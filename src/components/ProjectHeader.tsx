// Copyright (c) 2025 hotflow2024
// Licensed under AGPL-3.0-or-later. See LICENSE for details.
// Commercial licensing available. See COMMERCIAL_LICENSE.md.
"use client";

/**
 * ProjectHeader - Top bar showing project name and save status
 * Based on CineGen-AI App.tsx auto-save pattern
 */

import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useScriptStore } from "@/stores/script-store";
import { useMediaPanelStore, stages } from "@/stores/media-panel-store";
import { Cloud, CloudOff, Loader2, Check, ChevronRight, Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "saved" | "saving" | "unsaved";

export function ProjectHeader() {
  const { activeProject } = useProjectStore();
  const { activeStage, activeEpisodeIndex, backToSeries } = useMediaPanelStore();
  const scriptStore = useScriptStore();
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Get current project data for change detection
  const projectId = activeProject?.id;
  const scriptProject = projectId ? scriptStore.projects[projectId] : null;
  const currentUpdatedAt = scriptProject?.updatedAt || 0;

  // Auto-save effect with 1s debounce
  useEffect(() => {
    if (!projectId || currentUpdatedAt === 0) return;
    
    // Skip if this is the first mount or no actual change
    if (lastUpdateRef.current === currentUpdatedAt) return;
    
    // Mark as unsaved
    setSaveStatus("unsaved");
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      
      // Simulate save (Zustand persist handles actual storage)
      setTimeout(() => {
        setSaveStatus("saved");
        lastUpdateRef.current = currentUpdatedAt;
      }, 300);
    }, 1000); // 1s debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, currentUpdatedAt]);

  // Get current stage info
  const currentStageConfig = stages.find(s => s.id === activeStage);

  return (
    <div className="h-14 border-b border-white/5 bg-panel/70 backdrop-blur-md px-4 flex items-center justify-between shrink-0 shadow-sm relative z-20">
      {/* Left: Project Name + Stage + Episode Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-md text-primary-foreground flex items-center justify-center shadow-sm">
          <Aperture className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px] tracking-wide">
            {activeProject?.name || "未命名项目"}
          </span>
          {activeEpisodeIndex != null && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <button
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                onClick={backToSeries}
                title="返回全剧视图"
              >
                第{activeEpisodeIndex}集
              </button>
            </>
          )}
          {currentStageConfig && (
            <>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-xs text-muted-foreground/60 font-mono uppercase tracking-wider">
                {currentStageConfig.phase}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentStageConfig.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Save Status */}
      <div className="flex items-center gap-2">
        <SaveStatusIndicator status={saveStatus} />
      </div>
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors",
        status === "saved" && "text-green-500/70 bg-green-500/5",
        status === "saving" && "text-yellow-500/70 bg-yellow-500/5",
        status === "unsaved" && "text-zinc-500 bg-zinc-800/50"
      )}
    >
      {status === "saved" && (
        <>
          <Check className="w-3 h-3" />
          <span>Saved</span>
        </>
      )}
      {status === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <CloudOff className="w-3 h-3" />
          <span>Unsaved</span>
        </>
      )}
    </div>
  );
}
