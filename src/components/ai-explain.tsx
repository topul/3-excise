"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStudyStore } from "@/lib/store";
import { streamAiExplanation } from "@/lib/ai";
import type { Question } from "@/lib/types";

export function AiExplain({ question }: { question: Question }) {
  const aiConfig = useStudyStore((s) => s.aiConfig);
  const aiExplanations = useStudyStore((s) => s.aiExplanations);
  const setAiExplanation = useStudyStore((s) => s.setAiExplanation);
  const clearAiExplanation = useStudyStore((s) => s.clearAiExplanation);

  const cached = aiExplanations[question.id] || "";
  const [open, setOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState(cached);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setText(aiExplanations[question.id] || "");
    setError("");
    setOpen(!!aiExplanations[question.id]);
  }, [question.id, aiExplanations]);

  const isConfigured =
    aiConfig.baseUrl && aiConfig.apiKey && aiConfig.model;

  const run = async () => {
    if (!isConfigured) return;
    setOpen(true);
    setStreaming(true);
    setError("");
    setText("");
    const ac = new AbortController();
    abortRef.current = ac;
    let acc = "";
    try {
      await streamAiExplanation(
        question,
        aiConfig,
        (delta) => {
          acc += delta;
          setText(acc);
        },
        ac.signal
      );
      setAiExplanation(question.id, acc);
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
      {!open ? (
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
                  {text && (
                    <button
                      onClick={regenerate}
                      className="px-2.5 py-1 text-xs text-slate-600 border border-slate-200 rounded-md hover:bg-white"
                    >
                      重新生成
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:bg-white rounded-md"
                  >
                    收起
                  </button>
                </>
              )}
            </div>
          </div>
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
            ) : text ? (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {text}
                {streaming && <span className="inline-block w-2 h-4 align-middle bg-violet-500 ml-0.5 animate-pulse" />}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">
                等待 AI 响应...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
