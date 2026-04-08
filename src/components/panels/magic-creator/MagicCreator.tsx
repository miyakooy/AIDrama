import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, Video, Clapperboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/stores/project-store";
import { useMediaPanelStore } from "@/stores/media-panel-store";
import { switchProject } from "@/lib/project-switcher";
import { generateScriptFromIdea, type ScriptGenerationOptions } from "@/lib/script/script-parser";
import { importFullScript } from "@/lib/script/full-script-service";
import { getFeatureConfig, getFeatureNotConfiguredMessage } from "@/lib/ai/feature-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MagicCreator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState("");
  const { createProject } = useProjectStore();
  const { setInProject, setActiveTab } = useMediaPanelStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setProgressText("初始化 AI 引擎...");

    // [DEMO MODE] Skip actual API calls and load the demo project directly
    setTimeout(async () => {
      try {
        setProgressText("加载演示工作区...");
        const DEMO_PROJECT_ID = "a4bbe260-0127-49c7-9230-e766402663c7";
        
        // Ensure we switch to the demo project correctly
        await switchProject(DEMO_PROJECT_ID);
        
        setProgressText("演示资产构建完成...");
        
        setTimeout(() => {
          setIsGenerating(false);
          // OiiOii Style: DO NOT jump to Director automatically anymore
          // Instead, just clear the input and show a success toast.
          // The user will stay in the MagicCreator dialog flow.
          setPrompt("");
          toast.success("演示项目加载完成！已在后台准备就绪。");
        }, 800);
      } catch (error) {
        console.error("Demo load failed:", error);
        toast.error("加载演示项目失败，请确保本地已有演示数据");
        setIsGenerating(false);
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden relative selection:bg-blue-500/30 text-slate-200 font-sans w-full">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Top Navbar */}
      <div className="h-16 px-8 flex items-center justify-between shrink-0 relative z-10 w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
            <div className="w-full h-full bg-[#0a0a0a] rounded-[7px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Magic Creator</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-slate-400 hover:text-white transition-colors" onClick={() => setActiveTab("dashboard")}>
            <Clapperboard className="w-4 h-4 mr-2" />
            专业工作台
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setActiveTab("settings")}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="max-w-4xl w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Hero Header */}
          <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-10 tracking-tight">
            找回你的想象力
          </h1>

          {/* Type Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full">
            {[
              { icon: "🪄", title: "Seedance 2.0故事动画" },
              { icon: "⚡", title: "快速生图/视频" },
              { icon: "🎬", title: "剧情故事短片" },
              { icon: "🎵", title: "音乐概念短片" },
              { icon: "🎨", title: "衍生品设计" },
              { icon: "🧑‍🎨", title: "角色设计" },
              { icon: "🌄", title: "场景设计" },
            ].map((btn, idx) => (
              <button
                key={idx}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-slate-200"
              >
                <span className="text-base">{btn.icon}</span>
                {btn.title}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="w-full relative group max-w-3xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 focus-within:border-white/20 focus-within:bg-[#0f0f0f]/90">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="拖拽/粘贴 🌁 图片到这里，来试试【角色】、【风格】参考"
                className="min-h-[140px] w-full bg-transparent border-0 resize-none text-lg p-6 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
                disabled={isGenerating}
              />
              
              {/* Action Bar */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border-t border-white/5 relative">
                
                {/* Left tools */}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white rounded-[16px] bg-white/[0.04] hover:bg-white/10 h-8 px-4 font-medium transition-colors border border-white/5">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-400" /> 帮我润色
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white rounded-[16px] bg-white/[0.04] hover:bg-white/10 h-8 px-4 font-medium transition-colors border border-white/5">
                    🎲 随机灵感
                  </Button>
                </div>
                
                {/* Oii Style Generating Overlay Box */}
                {isGenerating && (
                  <div className="absolute right-3 bottom-3 flex items-center bg-[#1c1c1c]/90 backdrop-blur-md border border-white/10 p-2 pr-6 rounded-[24px] shadow-2xl z-20 overflow-hidden min-w-[200px] animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-[slide_2s_linear_infinite]"></div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 mr-3">
                      <div className="w-4 h-4 rounded-sm border-2 border-purple-500 animate-[spin_3s_ease-in-out_infinite]"></div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-semibold text-white tracking-wide">AI Agent Working</span>
                      <span className="text-[10px] text-slate-400 truncate w-[140px] animate-pulse">
                        {progressText || "调度中..."}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={cn(
                    "bg-white text-black hover:bg-slate-200 rounded-[24px] px-8 h-11 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-0 disabled:pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.15)] ml-auto",
                    isGenerating ? "absolute opacity-0 pointer-events-none" : "relative opacity-100"
                  )}
                >
                  一键生成 <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="mt-8 flex items-center justify-center flex-wrap gap-3 opacity-80 max-w-3xl">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mr-2">Try these</span>
            {["魔法少女穿越都市", "末日废土的机器狗", "古代剑客竹林决斗", "太空舰队跃迁瞬间"].map((preset) => (
              <button 
                key={preset}
                onClick={() => setPrompt(preset)}
                className="text-sm px-4 py-1.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* OiiOii Style Generating Process (Inline, No Overlay) */}
      {/* We removed the full screen overlay. Progress is now shown inside the input box */}
    </div>
  );
}