// Copyright (c) 2025 hotflow2024
// Licensed under AGPL-3.0-or-later. See LICENSE for details.
// Commercial licensing available. See COMMERCIAL_LICENSE.md.
import { mainNavItems, bottomNavItems, Tab, useMediaPanelStore } from "@/stores/media-panel-store";
import { useThemeStore } from "@/stores/theme-store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, LayoutDashboard, Settings, Sun, Moon, HelpCircle } from "lucide-react";

export function TabBar() {
  const { activeTab, inProject, setActiveTab, setInProject } = useMediaPanelStore();
  const { theme, toggleTheme } = useThemeStore();

  // Dashboard mode
  if (!inProject) {
    return (
        <div className="flex flex-col w-14 border-r border-white/5 glass py-2 relative shadow-xl z-30">
        <div className="p-2">
          <div className="w-8 h-8 bg-transparent flex items-center justify-center mx-auto rounded overflow-hidden">
            <img 
              src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cute%20pink%20and%20white%20kawaii%20cat%20face%2C%20large%20round%20dark%20eyes%2C%20simple%20flat%20vector%20illustration%2C%20light%20pink%20background%2C%20logo%20design&image_size=square" 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {/* Dashboard nav */}
        <nav className="flex-1 py-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={cn(
                    "w-full flex flex-col items-center py-2.5 transition-colors",
                    activeTab === "dashboard"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 mb-0.5" />
                  <span className="text-[9px]">项目</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">项目仪表盘</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
        {/* Bottom: Help + Settings + Theme */}
        <div className="mt-auto border-t border-border py-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                href="https://wcnt4lo56m8u.feishu.cn/wiki/MTdewDmBniI9HoknEo4c3VX6nAc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex flex-col items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-[8px]">帮助</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">使用帮助</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={cn(
                    "w-full flex flex-col items-center py-2 transition-colors",
                    activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-[8px]">设置</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">系统设置</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Theme Toggle */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="w-full flex flex-col items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="text-[8px]">{theme === "dark" ? "浅色" : "深色"}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  // Project mode - flat navigation
    return (
      <div className="flex flex-col w-14 border-r border-white/5 glass relative shadow-xl z-30">
      {/* Logo + Back */}
      <div className="p-2 border-b border-border">
        <div className="w-8 h-8 bg-transparent flex items-center justify-center mx-auto rounded mb-1">
          <svg width="24" height="24" viewBox="0 0 400 135" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M51.8258 74.0048L51.8258 93.9161L71.4925 105.158L71.4925 117.848L40.7592 100.274L40.7592 67.6214L51.8258 74.0048Z" fill="#66B8FF"/>
            <path d="M125.992 60.158L125.992 40.2467L106.326 29.0048L106.326 16.3144L137.059 33.8887L137.059 66.5413L125.992 60.158Z" fill="#66B8FF"/>
            <path d="M96.0461 117.828L78.9627 108.061L98.6294 96.819L109.696 103.202L96.0461 110.985V117.828Z" fill="#66B8FF"/>
            <path d="M81.7716 26.1017L98.8549 35.8687L79.1883 47.1107L68.1216 40.7273L81.7716 32.9439V26.1017Z" fill="#66B8FF"/>
            <path d="M40.7592 53.7745L40.7592 40.0841L51.8258 33.7008V47.3911L40.7592 53.7745Z" fill="#66B8FF"/>
            <path d="M137.059 80.3884V94.0787L125.992 100.462L125.992 86.7718L137.059 80.3884Z" fill="#66B8FF"/>
            <path d="M88.9092 107.502L106.326 97.4357V46.6107L88.9092 56.6773V107.502Z" fill="#66B8FF"/>
            <path d="M51.8258 61.2774V50.1107L106.326 81.3607L106.326 92.5274L51.8258 61.2774Z" fill="#66B8FF"/>
            <path d="M125.992 72.8853V84.052L71.4925 52.802L71.4925 41.6353L125.992 72.8853Z" fill="#66B8FF"/>
          </svg>
        </div>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setInProject(false)}
                className="flex items-center justify-center w-full h-5 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">返回项目列表</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-1">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <TooltipProvider key={item.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex flex-col items-center py-2.5 transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5 mb-0.5" />
                    <span className="text-[9px]">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}{item.phase ? ` (Phase ${item.phase})` : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      {/* Bottom: Help + Settings + Theme */}
      <div className="mt-auto border-t border-border py-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://wcnt4lo56m8u.feishu.cn/wiki/MTdewDmBniI9HoknEo4c3VX6nAc"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex flex-col items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-[8px]">帮助</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">使用帮助</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <TooltipProvider key={item.id} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex flex-col items-center py-2 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[8px]">{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        {/* Theme Toggle */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="w-full flex flex-col items-center py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-[8px]">{theme === "dark" ? "浅色" : "深色"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === "dark" ? "切换到浅色模式" : "切换到深色模式"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
