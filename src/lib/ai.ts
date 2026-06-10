import type { Question } from "./types";

export interface AiClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
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

  return `请帮我深入讲解下面这道${typeName}：

题目：${question.text}${optionsBlock}

正确答案：${question.answer}

请按以下结构回答：
1. 知识点：这道题考察的核心概念是什么
2. 解析：为什么正确答案是这个，关键依据是什么
3. 易错点：常见错误理解或干扰项的辨析
4. 拓展：相关的延伸知识或记忆技巧

回答用中文，简洁清晰，markdown 格式。`;
}

export async function streamAiExplanation(
  question: Question,
  config: AiClientConfig,
  onChunk: (delta: string) => void,
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
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "你是一位耐心专业的人工智能训练师高级理论考试辅导老师，擅长把题目讲透。",
        },
        {
          role: "user",
          content: buildPrompt(question),
        },
      ],
    }),
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
        const delta = obj.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          onChunk(delta);
        }
      } catch {
        // ignore malformed
      }
    }
  }
}
