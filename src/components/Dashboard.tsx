// Copyright (c) 2025 hotflow2024
// Licensed under AGPL-3.0-or-later. See LICENSE for details.
// Commercial licensing available. See COMMERCIAL_LICENSE.md.
"use client";

/**
 * Dashboard - Project List and Management
 * Features: create, open, rename, duplicate, batch select & delete
 */

import { useState, useCallback } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useMediaPanelStore } from "@/stores/media-panel-store";
import { switchProject } from "@/lib/project-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  FolderOpen,
  Clock,
  Film,
  Aperture,
  X,
  MoreVertical,
  Pencil,
  Copy,
  CheckSquare,
} from "lucide-react";
import { cn, generateUUID } from "@/lib/utils";
import { toast } from "sonner";
import type { Project } from "@/stores/project-store";

export function Dashboard() {
  const { projects, createProject, deleteProject, renameProject } = useProjectStore();
  const { setActiveTab } = useMediaPanelStore();
  
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState(false);

  // Rename dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Duplicate loading
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Sort projects by updatedAt descending
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  // ==================== Create / Open ====================

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      setNewProjectName("");
      setShowNewProject(false);
      await switchProject(project.id);
      setActiveTab("overview");
    }
  };

  const handleOpenProject = async (projectId: string) => {
    if (selectionMode) return; // Don't open in selection mode
    await switchProject(projectId);
    setActiveTab("overview");
  };

  // ==================== Selection ====================

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set()); // Clear on exit
      return !prev;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map((p) => p.id)));
    }
  }, [projects, selectedIds.size]);

  // ==================== Batch Delete ====================

  const handleBatchDelete = useCallback(() => {
    selectedIds.forEach((id) => deleteProject(id));
    toast.success(`已删除 ${selectedIds.size} 个项目`);
    setSelectedIds(new Set());
    setBatchDeleteConfirm(false);
    setSelectionMode(false);
  }, [selectedIds, deleteProject]);

  // ==================== Rename ====================

  const openRenameDialog = useCallback((id: string, name: string) => {
    setRenameTarget({ id, name });
    setRenameValue(name);
    setRenameDialogOpen(true);
  }, []);

  const handleRename = useCallback(() => {
    if (!renameTarget || !renameValue.trim()) return;
    renameProject(renameTarget.id, renameValue.trim());
    setRenameDialogOpen(false);
    setRenameTarget(null);
    toast.success("项目已重命名");
  }, [renameTarget, renameValue, renameProject]);

  // ==================== Duplicate ====================

  const handleDuplicate = useCallback(async (projectId: string) => {
    const source = projects.find((p) => p.id === projectId);
    if (!source) return;

    setDuplicatingId(projectId);

    try {
      const fs = window.fileStorage;
      if (!fs) {
        toast.warning('文件存储不可用，仅复制了项目名称');
        setDuplicatingId(null);
        return;
      }

      // STEP 1: Ensure source project data is persisted to disk.
      // Per-project files (_p/{pid}/*.json) only exist after a store's setItem is called.
      // If data was loaded from legacy storage but never modified, the per-project files
      // won't exist. Force a switchProject to trigger rehydrate → state merge → persist write.
      const currentPid = useProjectStore.getState().activeProjectId;
      if (currentPid === projectId) {
        // switchProject would no-op for same ID. Temporarily deactivate to force full cycle.
        useProjectStore.getState().setActiveProject(null);
      }
      await switchProject(projectId);
      // Wait for all async IPC persist writes to complete
      await new Promise(r => setTimeout(r, 500));

      // STEP 2: Generate new project ID BEFORE creating the project entry.
      // CRITICAL: Do NOT call createProject() here — it would change
      // project-store's activeProjectId, which affects getActiveProjectId() used by
      // all storage adapters. Any pending persist writes could then route to the
      // wrong per-project file, overwriting the copied data.
      const newProjectId = generateUUID();
      const newProjectName = `${source.name} (副本)`;

      // STEP 3: Copy per-project files with project ID rewriting.
      // activeProjectId still points to the source project during this step.
      const KNOWN_STORES = [
        'director', 'script', 'sclass', 'timeline',   // createProjectScopedStorage
        'characters', 'media', 'scenes',               // createSplitStorage (per-project portion)
      ];

      let copiedCount = 0;
      let keysToCopy: string[] = await fs.listKeys?.(`_p/${projectId}`) ?? [];
      console.log(`[Duplicate] listKeys('_p/${projectId}') → ${keysToCopy.length} keys:`, keysToCopy);

      if (keysToCopy.length === 0) {
        keysToCopy = KNOWN_STORES.map(s => `_p/${projectId}/${s}`);
        console.log('[Duplicate] Fallback to known store names');
      }

      for (const key of keysToCopy) {
        const rawData = await fs.getItem(key);
        if (!rawData) continue;

        // Rewrite activeProjectId so the new project's merge() keys data correctly.
        let dataToWrite = rawData;
        try {
          const parsed = JSON.parse(rawData);
          const state = parsed?.state ?? parsed;

          if (state && typeof state === 'object') {
            if (state.activeProjectId === projectId) {
              state.activeProjectId = newProjectId;
            }
            // Handle legacy format where projects is a dict keyed by projectId
            if (state.projects && typeof state.projects === 'object' && state.projects[projectId]) {
              state.projects[newProjectId] = state.projects[projectId];
              delete state.projects[projectId];
            }
          }
          dataToWrite = JSON.stringify(parsed);
        } catch {
          console.warn(`[Duplicate] Could not parse ${key}, copying raw`);
        }

        const newKey = key.replace(`_p/${projectId}`, `_p/${newProjectId}`);
        await fs.setItem(newKey, dataToWrite);
        copiedCount++;
        console.log(`[Duplicate] Copied: ${key} → ${newKey}`);
      }

      // STEP 4: NOW add the project entry to project-store (after all files are copied).
      // Use setState directly to add the project WITHOUT changing activeProjectId.
      // This prevents any persist writes from being routed to the new project's files
      // before the copy is fully complete.
      const newProject: Project = {
        id: newProjectId,
        name: newProjectName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      useProjectStore.setState((state) => ({
        projects: [newProject, ...state.projects],
      }));

      if (copiedCount > 0) {
        toast.success(`已复制项目「${source.name}」(${copiedCount} 个数据文件)`);
      } else {
        toast.warning('项目数据文件为空，仅复制了项目名称');
      }

      // STEP 5: Reset activeProjectId so the next project open triggers a full switchProject.
      useProjectStore.getState().setActiveProject(null);
    } catch (err) {
      console.error('[Duplicate] Failed:', err);
      toast.error(`复制项目数据失败: ${(err as Error).message}`);
    } finally {
      setDuplicatingId(null);
    }
  }, [projects]);

  // ==================== Helpers ====================

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden relative selection:bg-primary/30">
      {/* 背景环境光晕，增强 Glass 材质的通透感 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="h-16 bg-[#0a0a0a] border-b border-white/5 px-8 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-transparent flex items-center justify-center">
              <img 
                src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cute%20pink%20and%20white%20kawaii%20cat%20face%2C%20large%20round%20dark%20eyes%2C%20simple%20flat%20vector%20illustration%2C%20light%20pink%20background%2C%20logo%20design&image_size=square" 
                alt="Logo" 
                className="w-10 h-10 rounded-lg object-cover shadow-sm"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-wide">OiiOii</h1>
            </div>
          </div>
        
        <div className="flex items-center gap-6 text-sm font-medium">
          <button className="text-foreground hover:text-primary transition-colors">全部</button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">我的收藏</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-muted-foreground group-focus-within:text-primary transition-colors"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <Input 
              placeholder="搜索项目名称" 
              className="w-64 h-9 pl-9 bg-white/5 border-white/10 focus-visible:ring-1 focus-visible:ring-primary rounded-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 bg-[#0a0a0a] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">我的项目</h2>
              <p className="text-sm text-muted-foreground">
                共 {projects.length} 个项目
                {selectionMode && selectedIds.size > 0 && (
                  <span className="text-primary ml-2">· 已选 {selectedIds.size} 个</span>
                )}
              </p>
            </div>
            
            {/* Selection toolbar */}
            <div className="flex items-center gap-2">
              {projects.length > 0 && (
                <Button
                  variant={selectionMode ? "secondary" : "outline"}
                  size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  onClick={toggleSelectionMode}
                >
                  <CheckSquare className="w-4 h-4 mr-1.5" />
                  {selectionMode ? "退出选择" : "批量管理"}
                </Button>
              )}
              {selectionMode && (
                <>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={handleSelectAll}>
                    {allSelected ? "取消全选" : "全选"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    onClick={() => setBatchDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    删除选中 ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* New Project Input */}
          {showNewProject && (
            <div className="mb-6 p-5 bg-[#1c1c1c] border border-white/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="输入项目名称..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                  className="flex-1 bg-[#2a2a2a] border-white/5 h-11 focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-white"
                  autoFocus
                />
                <Button 
                  onClick={handleCreateProject} 
                  disabled={!newProjectName.trim()}
                  className="bg-white text-black hover:bg-slate-200 h-11 px-6 rounded-xl font-medium"
                >
                  创建
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    setShowNewProject(false);
                    setNewProjectName("");
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            
            {/* OiiOii New Project Button Card */}
            <div 
              onClick={() => setShowNewProject(true)}
              className="group relative bg-[#1c1c1c] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium">新建项目</span>
            </div>
            {sortedProjects.map((project) => {
              const isSelected = selectedIds.has(project.id);
              const isDuplicating = duplicatingId === project.id;

              return (
                  <div
                  key={project.id}
                  className={cn(
                    "group relative bg-[#1c1c1c] rounded-2xl overflow-hidden transition-all duration-300 min-h-[220px] flex flex-col",
                    selectionMode
                      ? isSelected
                        ? "border-primary ring-2 ring-primary cursor-pointer"
                        : "border-transparent cursor-pointer hover:border-white/10"
                      : "border-transparent hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] cursor-pointer"
                  )}
                  onClick={() => {
                    if (selectionMode) {
                      toggleSelect(project.id);
                    } else {
                      handleOpenProject(project.id);
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(project.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                  )}

                  {/* Project Thumbnail */}
                  <div className="aspect-[16/10] bg-[#2a2a2a] flex items-center justify-center relative overflow-hidden transition-colors rounded-t-2xl">
                    <img 
                      src={`https://picsum.photos/seed/${project.id}/400/250`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                    />
                    {isDuplicating && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-4 pt-3 bg-[#1c1c1c] rounded-b-2xl h-full flex flex-col justify-start">
                    <h3 className="font-semibold text-[15px] text-white truncate mb-1.5 leading-snug">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
                        <span>{formatDate(project.updatedAt)}</span>
                      </div>

                      {/* Actions menu (hidden in selection mode) */}
                      {!selectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-muted text-muted-foreground transition-all"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-300" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="bg-[#1a1a1a] border-white/10 p-1.5 min-w-[140px] shadow-xl">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenameDialog(project.id, project.name);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              <span>重命名</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(project.id);
                              }}
                              disabled={isDuplicating}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Copy className="w-4 h-4" />
                              <span>复制项目</span>
                            </button>
                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                                toast.success(`已删除「${project.name}」`);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>删除</span>
                            </button>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Hover Overlay (not in selection mode) */}
                  {!selectionMode && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <div className="bg-panel-elevated/80 backdrop-blur-md border border-white/10 text-foreground px-5 py-2 rounded-full font-medium text-sm flex items-center gap-2 shadow-xl">
                        <FolderOpen className="w-4 h-4" />
                        打开项目
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {projects.length === 0 && !showNewProject && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center glass-card border-dashed border-white/10 rounded-xl mt-8">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">暂无项目</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  开始你的第一个漫剧创作吧。你可以从头开始编写剧本，或者导入已有的素材。
                </p>
                <Button 
                  onClick={() => setShowNewProject(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:-translate-y-[1px] transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建项目
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* ==================== Rename Dialog ==================== */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重命名项目</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            placeholder="输入新名称..."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>取消</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== Batch Delete Confirm Dialog ==================== */}
      <Dialog open={batchDeleteConfirm} onOpenChange={setBatchDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认批量删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            即将删除 <span className="text-foreground font-medium">{selectedIds.size}</span> 个项目，
            此操作不可撤销。确定继续？
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteConfirm(false)}>取消</Button>
            <Button variant="destructive" onClick={handleBatchDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
