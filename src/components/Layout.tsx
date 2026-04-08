// Copyright (c) 2025 hotflow2024
// Licensed under AGPL-3.0-or-later. See LICENSE for details.
// Commercial licensing available. See COMMERCIAL_LICENSE.md.
import { TabBar } from "./TabBar";
import { PreviewPanel } from "./PreviewPanel";
import { RightPanel } from "./RightPanel";
import { SimpleTimeline } from "./SimpleTimeline";
import { Dashboard } from "./Dashboard";
import { ProjectHeader } from "./ProjectHeader";
import { useMediaPanelStore } from "@/stores/media-panel-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// Panel imports
import { ScriptView } from "@/components/panels/script";
import { DirectorView } from "@/components/panels/director";
import { SClassView } from "@/components/panels/sclass";
import { CharactersView } from "@/components/panels/characters";
import { ScenesView } from "@/components/panels/scenes";
import { FreedomView } from "@/components/panels/freedom";
import { MediaView } from "@/components/panels/media";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { ExportView } from "@/components/panels/export";
import { OverviewPanel } from "@/components/panels/overview";
import { AssetsView } from "@/components/panels/assets";

export function Layout() {
  const { activeTab, inProject } = useMediaPanelStore();

  // Dashboard mode - show full-screen dashboard or settings
  if (!inProject) {
    return (
      <div className="h-full flex bg-background">
        <TabBar />
        <div className="flex-1">
          {activeTab === "settings" ? <SettingsPanel /> : <Dashboard />}
        </div>
      </div>
    );
  }

  // Full-screen views (no resizable panels)
  // 这些板块有自己的多栏布局，不需要全局的预览和属性面板
  const fullScreenTabs = ["export", "settings", "overview", "script", "characters", "scenes", "freedom", "assets"];
  if (fullScreenTabs.includes(activeTab)) {
    return (
      <div className="h-full flex bg-background">
        <TabBar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <ProjectHeader />
          {activeTab === "export" && <ExportView />}
          {activeTab === "settings" && <SettingsPanel />}
          {activeTab === "overview" && <OverviewPanel />}
          {activeTab === "script" && <ScriptView />}
          {activeTab === "characters" && <CharactersView />}
          {activeTab === "scenes" && <ScenesView />}
          {activeTab === "freedom" && <FreedomView />}
          {activeTab === "assets" && <AssetsView />}
        </div>
      </div>
    );
  }

  // Only show timeline for director and media tabs
  const showTimeline = activeTab === "director" || activeTab === "sclass" || activeTab === "media";

  // Left panel content based on active tab
  const renderLeftPanel = () => {
    switch (activeTab) {
      case "script":
        return <ScriptView />;
      case "director":
        // 保持原有 AI 导演功能
        return <DirectorView />;
      case "sclass":
        return <SClassView />;
      case "characters":
        return <CharactersView />;
      case "scenes":
        return <ScenesView />;
      case "media":
        return <MediaView />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <ScriptView />;
    }
  };

  // Right panel content based on active tab
  const renderRightPanel = () => {
    return <RightPanel />;
  };

  return (
    <div className="h-full flex bg-background relative overflow-hidden">
      {/* 全局环境光晕，增强所有 Glass 面板的折射感 */}
      {inProject && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[150px] pointer-events-none z-0" />
        </>
      )}

      {/* Left: TabBar - full height */}
      <TabBar />

      {/* Right content area */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Top: Project Header with save status */}
        <ProjectHeader />
        
        {/* Main content with resizable panels */}
        <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0 min-w-0">
        {/* Main content row */}
        <ResizablePanel defaultSize={85} minSize={50} className="min-h-0 min-w-0">
            <ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0 gap-2 p-2">
              {/* Left Panel: Content based on active tab */}
              <ResizablePanel defaultSize={26} minSize={18} maxSize={40} className="min-w-0">
                <div className="h-full min-w-0 overflow-hidden glass rounded-xl border border-white/5">
                  {renderLeftPanel()}
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-transparent w-1" />

              {/* Center: Preview */}
              <ResizablePanel defaultSize={54} minSize={28} className="min-w-0">
                <div className="h-full min-w-0 flex flex-col glass rounded-xl border border-white/5">
                  <PreviewPanel />
                </div>
              </ResizablePanel>

              <ResizableHandle className="bg-transparent w-1" />

              {/* Right: Properties */}
              <ResizablePanel defaultSize={20} minSize={15} maxSize={32} className="min-w-0">
                <div className="h-full min-w-0 overflow-hidden glass rounded-xl border border-white/5">
                  {renderRightPanel()}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Bottom: Timeline - only for director and media tabs */}
          {showTimeline && (
            <>
              <ResizableHandle className="bg-transparent h-1" />
              <ResizablePanel defaultSize={15} minSize={10} maxSize={40}>
                <div className="h-full px-2 pb-2">
                  <div className="h-full min-w-0 overflow-hidden glass rounded-xl border border-white/5">
                    <SimpleTimeline />
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
