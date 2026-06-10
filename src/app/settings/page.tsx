"use client";

import { useState } from "react";
import { useStudyStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESETS = [
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  {
    name: "智谱 BigModel",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
  },
  {
    name: "阿里通义",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
];

export default function SettingsPage() {
  const aiConfig = useStudyStore((s) => s.aiConfig);
  const setAiConfig = useStudyStore((s) => s.setAiConfig);

  const [baseUrl, setBaseUrl] = useState(aiConfig.baseUrl);
  const [apiKey, setApiKey] = useState(aiConfig.apiKey);
  const [model, setModel] = useState(aiConfig.model);
  const [showKey, setShowKey] = useState(false);
  const [savedTip, setSavedTip] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "ok" | "fail"
  >("idle");
  const [testMsg, setTestMsg] = useState("");

  const handleSave = () => {
    setAiConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    });
    setSavedTip(true);
    setTimeout(() => setSavedTip(false), 2000);
  };

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
  };

  const handleTest = async () => {
    if (!baseUrl || !apiKey || !model) {
      setTestStatus("fail");
      setTestMsg("请先填写 Base URL、API Key 和模型名称");
      return;
    }
    setTestStatus("testing");
    setTestMsg("");
    try {
      const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        setTestStatus("ok");
        setTestMsg("连接成功！可以正常使用");
      } else {
        const text = await res.text().catch(() => res.statusText);
        setTestStatus("fail");
        setTestMsg(`HTTP ${res.status}：${text.slice(0, 200)}`);
      }
    } catch (err) {
      setTestStatus("fail");
      setTestMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
        设置
      </h1>
      <p className="text-sm md:text-base text-slate-500 mb-6 md:mb-8">
        配置 AI 服务后，答题页面会出现「AI 详解」按钮，由 AI 给你深入讲解题目。
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI 服务配置</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            支持所有 OpenAI 兼容接口（OpenAI/DeepSeek/智谱/通义/Ollama 等）。配置仅保存在你的浏览器本地，不会上传。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              快速预设
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handlePreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <p className="text-xs text-slate-400 mt-1">
              不要加末尾的 /chat/completions，只到 /v1
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-16 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 px-2 py-1 hover:bg-slate-100 rounded"
              >
                {showKey ? "隐藏" : "显示"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              模型名称
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini / deepseek-chat / glm-4-flash"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
            >
              保存配置
            </button>
            <button
              onClick={handleTest}
              disabled={testStatus === "testing"}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              {testStatus === "testing" ? "测试中..." : "测试连接"}
            </button>
            {savedTip && (
              <span className="text-sm text-green-600 self-center">
                ✓ 已保存
              </span>
            )}
          </div>

          {testStatus === "ok" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              ✓ {testMsg}
            </div>
          )}
          {testStatus === "fail" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ✗ {testMsg}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-medium mb-1">💡 提示</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700 text-xs">
          <li>API Key 保存在你本机的 localStorage，请勿在公用电脑上使用</li>
          <li>调用 AI 接口会直接从浏览器发起请求，请确保你的 API 提供商允许跨域</li>
          <li>使用流式输出，建议选择支持 stream 的模型</li>
        </ul>
      </div>
    </div>
  );
}
