"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { streamAiExplanation } from "@/lib/ai";
import type { Question } from "@/lib/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHref(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return url.toString();
    }
  } catch {
    return "#";
  }
  return "#";
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      (_, label: string, href: string) =>
        `<a href="${sanitizeHref(href)}" target="_blank" rel="noreferrer">${label}</a>`
    );
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    const blocks = content
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed
            .split("\n")
            .map((line) => line.replace(/^[-*]\s+/, "").trim())
            .filter(Boolean)
            .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
            .join("");
          return `<ul>${items}</ul>`;
        }

        return `<p>${renderInlineMarkdown(trimmed).replace(/\n/g, "<br />")}</p>`;
      })
      .filter(Boolean)
      .join("");

    return blocks || `<p>${renderInlineMarkdown(content).replace(/\n/g, "<br />")}</p>`;
  }, [content]);
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function normalizeExplanation(
  value: string | { reasoning: string; answer: string } | undefined
) {
  if (!value) return { reasoning: "", answer: "" };
  if (typeof value === "string") return { reasoning: "", answer: value };
  return value;
}

export function AiExplain({ question }: { question: Question }) {
  const aiConfig = useStudyStore((s) => s.aiConfig);
  const aiExplanations = useStudyStore((s) => s.aiExplanations);
  const setAiExplanation = useStudyStore((s) => s.setAiExplanation);
  const clearAiExplanation = useStudyStore((s) => s.clearAiExplanation);

  const cached = normalizeExplanation(aiExplanations[question.id]);
  const [expanded, setExpanded] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [reasoning, setReasoning] = useState(cached.reasoning);
  const [text, setText] = useState(cached.answer);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const next = normalizeExplanation(aiExplanations[question.id]);
    setReasoning(next.reasoning);
    setText(next.answer);
    setError("");
    setExpanded(Boolean(next.reasoning || next.answer));
    setReasoningExpanded(false);
  }, [question.id, aiExplanations]);

  const isConfigured =
    aiConfig.baseUrl && aiConfig.apiKey && aiConfig.model;

  const run = async () => {
    if (!isConfigured) return;
    setExpanded(true);
    setReasoningExpanded(true);
    setStreaming(true);
    setError("");
    setReasoning("");
    setText("");
    const ac = new AbortController();
    abortRef.current = ac;
    let reasoningAcc = "";
    let answerAcc = "";
    try {
      await streamAiExplanation(
        question,
        aiConfig,
        ({ reasoningDelta, contentDelta }) => {
          if (reasoningDelta) {
            reasoningAcc += reasoningDelta;
            setReasoning(reasoningAcc);
          }
          if (contentDelta) {
            answerAcc += contentDelta;
            setText(answerAcc);
          }
        },
        ac.signal
      );
      setAiExplanation(question.id, {
        reasoning: reasoningAcc,
        answer: answerAcc,
      });
      setReasoningExpanded(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  const regenerate = () => {
    clearAiExplanation(question.id);
    run();
  };

  const hasResult = Boolean(reasoning || text || error || streaming);

  if (!isConfigured) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium text-slate-700">
              🤖 想看 AI 详解？
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              先在设置里配置 AI 服务，之后这里会出现「AI 详解」按钮
            </p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-700 transition shrink-0"
          >
            去配置
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!hasResult ? (
        <button
          onClick={run}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <span>🤖</span> AI 详解
        </button>
      ) : (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-100 bg-white/60">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <span className="text-sm font-semibold text-slate-700">
                AI 详解
              </span>
              {streaming && (
                <span className="text-xs text-violet-600 animate-pulse">
                  生成中...
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              {streaming ? (
                <button
                  onClick={stop}
                  className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                >
                  停止
                </button>
              ) : (
                <>
                  {(reasoning || text) && (
                    <button
                      onClick={regenerate}
                      className="px-2.5 py-1 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-white"
                    >
                      重新生成
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-white rounded-md"
                  >
                    {expanded ? "收起" : "展开"}
                  </button>
                </>
              )}
            </div>
          </div>
          {expanded && (
            <div className="p-4">
              {error ? (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="font-medium mb-1">请求失败</p>
                  <p className="text-xs break-words">{error}</p>
                  <button
                    onClick={run}
                    className="mt-2 text-xs underline text-red-600"
                  >
                    重试
                  </button>
                </div>
              ) : reasoning || text ? (
                <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                  {reasoning && (
                    <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                      <button
                        type="button"
                        onClick={() => setReasoningExpanded((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                          深度思考
                        </span>
                        <span className="text-xs text-amber-700">
                          {reasoningExpanded ? "收起" : "展开"}
                        </span>
                      </button>
                      {reasoningExpanded && (
                        <div className="mt-2">
                          <MarkdownContent content={reasoning} />
                        </div>
                      )}
                    </section>
                  )}
                  {text && (
                    <section>
                      <MarkdownContent content={text} />
                      {streaming && (
                        <span className="inline-block w-2 h-4 align-middle bg-violet-500 ml-0.5 animate-pulse" />
                      )}
                    </section>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">
                  等待 AI 响应...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
