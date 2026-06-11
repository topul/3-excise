import type { Question } from "./types";

export interface AiClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  deepThinkingEnabled?: boolean;
}

export interface AiStreamChunk {
  reasoningDelta?: string;
  contentDelta?: string;
}

function buildPrompt(question: Question): string {
  const typeName =
    question.type === "tf"
      ? "判断题"
      : question.type === "single"
      ? "单选题"
      : "多选题";

  let optionsBlock = "";
  if (question.options.length > 0) {
    optionsBlock =
      "\n选项：\n" +
      question.options.map((o) => `${o.label}. ${o.text}`).join("\n");
  }

  return `请帮我用通俗易懂的语言讲解下面这道${typeName}。
我会点开 AI 详解，通常说明这道题涉及的知识我完全没理解，请把我当作第一次接触这个概念的学习者，不要默认我知道专业术语。

题目：${question.text}${optionsBlock}

正确答案：${question.answer}

请按以下结构回答：
1. 一句话先讲懂：用大白话说明这题到底在考什么
2. 知识点：解释核心概念，遇到专业术语要先翻译成人话
3. 解析：一步一步说明为什么正确答案是这个
4. 易错点：说明我为什么可能会选错，干扰项错在哪里
5. 记忆方法：给一个好记的例子、类比或口诀

回答用中文，语气耐心，markdown 格式。不要只堆概念，要先讲明白再讲专业说法。`;
}

function supportsReasoningControls(model: string): boolean {
  const name = model.toLowerCase();
  return (
    name.includes("deepseek-reasoner") ||
    name.includes("qwen3") ||
    name.includes("qwen") ||
    name.includes("qwq")
  );
}

function buildRequestBody(question: Question, config: AiClientConfig) {
  const deepThinkingEnabled = Boolean(config.deepThinkingEnabled);
  const body: Record<string, unknown> = {
    model: config.model,
    stream: true,
    messages: [
      {
        role: "system",
        content: deepThinkingEnabled
          ? "你是一位耐心专业的人工智能训练师高级理论考试辅导老师，擅长把复杂概念讲得通俗易懂。用户点开解释，往往代表他对相关知识几乎不懂。请先用大白话和例子讲明白，再补充必要的专业表述。用户已开启深度思考，可以先进行必要的推理再给出答案。"
          : "你是一位耐心专业的人工智能训练师高级理论考试辅导老师，擅长把复杂概念讲得通俗易懂。用户点开解释，往往代表他对相关知识几乎不懂。请先用大白话和例子讲明白，再补充必要的专业表述。不要输出深度思考、推理过程或 reasoning 内容，只给出面向学习者的简洁解析。",
      },
      {
        role: "user",
        content: buildPrompt(question),
      },
    ],
  };

  if (supportsReasoningControls(config.model)) {
    body.enable_thinking = deepThinkingEnabled;
    body.chat_template_kwargs = {
      enable_thinking: deepThinkingEnabled,
    };
  }

  return body;
}

export async function streamAiExplanation(
  question: Question,
  config: AiClientConfig,
  onChunk: (chunk: AiStreamChunk) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("请先在设置中配置 AI 服务");
  }

  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(buildRequestBody(question, config)),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI 接口返回 ${res.status}：${text || res.statusText}`);
  }

  if (!res.body) {
    throw new Error("AI 接口没有返回数据流");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const obj = JSON.parse(data);
        const delta = obj.choices?.[0]?.delta ?? {};
        const reasoningDelta =
          delta.reasoning_content ?? delta.reasoning ?? delta.thinking;
        const contentDelta = delta.content;

        if (
          typeof reasoningDelta === "string" &&
          reasoningDelta.length > 0
        ) {
          onChunk({ reasoningDelta });
        }

        if (typeof contentDelta === "string" && contentDelta.length > 0) {
          onChunk({ contentDelta });
        }
      } catch {
        // ignore malformed
      }
    }
  }
}
