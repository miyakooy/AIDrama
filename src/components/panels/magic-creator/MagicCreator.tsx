import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, ArrowRight, Loader2, Clapperboard, Settings, 
  Share, MoreHorizontal, Plus, Image as ImageIcon, Send, 
  CheckCircle2, PlayCircle, LayoutTemplate, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaPanelStore } from "@/stores/media-panel-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// --- Types for Agent Workspace ---
type AgentRole = 'user' | 'art_director' | 'screenwriter' | 'character_designer' | 'storyboard_director' | 'system';

interface ChatMessage {
  id: string;
  role: AgentRole;
  content: React.ReactNode;
  status?: 'thinking' | 'done';
}

interface CanvasItem {
  id: string;
  type: 'script' | 'character' | 'scene' | 'storyboard';
  x: number;
  y: number;
  width: number;
  content: React.ReactNode;
}

// --- Agent Avatar Component ---
const AgentAvatar = ({ role }: { role: AgentRole }) => {
  if (role === 'user' || role === 'system') return null;
  
  const config = {
    art_director: { bg: 'bg-[#E11D48]/20', text: 'text-[#E11D48]', icon: '🐱', name: 'Tensor喵 (制片)' },
    screenwriter: { bg: 'bg-[#8B5CF6]/20', text: 'text-[#8B5CF6]', icon: '🦉', name: '剧本喵 (编剧)' },
    character_designer: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', icon: '🦊', name: '美术喵 (视觉)' },
    storyboard_director: { bg: 'bg-blue-500/20', text: 'text-blue-500', icon: '🎬', name: '分镜喵 (导演)' }
  }[role];

  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border border-white/5", config.bg, config.text)}>
        {config.icon}
      </div>
      <span className={cn("font-bold text-sm", config.text)}>{config.name}</span>
    </div>
  );
};

export function MagicCreator() {
  const { setActiveTab } = useMediaPanelStore();
  
  // App State
  const [mode, setMode] = useState<'hero' | 'workspace'>('hero');
  const [prompt, setPrompt] = useState("");
  const [chatInput, setChatInput] = useState("");
  
  // Workspace State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [optionsConfirmed, setOptionsConfirmed] = useState(false);
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Simulation Flow (Huobao Drama Workflow) ---
  const startAgentFlow = () => {
    if (!prompt.trim()) return;
    
    setMode('workspace');
    setIsFlowRunning(true);
    
    // 1. Add User Message
    const initialMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    };
    setMessages([initialMsg]);

    // 2. Trigger Art Director (Tensor喵)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'ad_1',
        role: 'art_director',
        status: 'done',
        content: (
          <div className="space-y-4">
            <div className="text-sm text-slate-300 leading-relaxed">
              <p className="mb-2">喵～收到导演的新灵感！「{prompt}」听起来很有趣呢 🐾</p>
              <p>我是你的专属制片人Tensor喵。为了让故事更完美，请先选定一下视觉风格和情绪吧，剩下的交给我们Agent团队！</p>
            </div>
            
            <div className="bg-[#1E1B4B]/50 border border-white/5 rounded-[16px] p-4 space-y-4 shadow-lg">
              {/* Visual Style Picker */}
              <div>
                <span className="text-xs text-slate-400 mb-2 block">推荐视觉风格：</span>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {[
                    { name: '治愈柔和Q版', img: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20girl%20in%20a%20pink%20dress%20standing%20on%20the%20street%2C%20healing%20soft%20chibi%20anime%20style&image_size=square' },
                    { name: '甜美粉彩', img: 'https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20girl%20in%20a%20pink%20dress%20standing%20on%20the%20street%2C%20sweet%20pastel%20anime%20style%2C%20soft%20lighting&image_size=square' },
                  ].map((style, idx) => (
                    <button key={style.name} className={cn(
                      "relative rounded-[12px] border-2 overflow-hidden group h-24 w-full transition-all",
                      idx === 0 ? "border-[#E11D48] ring-2 ring-[#E11D48]/30 shadow-lg shadow-[#E11D48]/20" : "border-transparent hover:border-white/20"
                    )}>
                      <img src={style.img} alt={style.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 text-center backdrop-blur-[2px]">
                        <span className="text-white text-[10px] font-medium">{style.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-400 mb-2 block">情绪关键词</span>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 rounded-[12px] border border-[#E11D48] bg-[#E11D48]/10 text-white text-xs">治愈</button>
                  <button className="px-3 py-1 rounded-[12px] border border-[#E11D48] bg-[#E11D48]/10 text-white text-xs">陪伴</button>
                  <button className="px-3 py-1 rounded-[12px] border border-white/10 text-xs hover:bg-white/10 text-slate-300">搞笑</button>
                  <button className="px-3 py-1 rounded-[12px] border border-white/10 text-xs hover:bg-white/10 text-slate-300">冒险</button>
                </div>
              </div>
            </div>
          </div>
        )
      }]);
    }, 1000);
  };

  const handleConfirmOptions = () => {
    setOptionsConfirmed(true);
    
    // Art Director confirms
    setMessages(prev => [...prev, {
      id: 'ad_2',
      role: 'art_director',
      status: 'done',
      content: (
        <div className="text-sm text-slate-300 space-y-2">
          <p>收到！参数已锁定 🔒</p>
          <p>马上召唤剧本喵为你定制剧本～ (召唤中...)</p>
        </div>
      )
    }]);

    // System Message: Invite Screenwriter
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'sys_1',
        role: 'system',
        content: <div className="text-xs text-slate-500 text-center my-4 bg-white/[0.02] py-2 rounded-full mx-8">🐱 Tensor喵 邀请 🦉 剧本喵 加入了群聊</div>
      }]);

      // Screenwriter joins and generates script (Huobao Script Rewriter logic)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'sw_1',
          role: 'screenwriter',
          status: 'done',
          content: (
            <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
              <p>咕咕！剧本喵来啦 📝</p>
              <p>我已经根据你的灵感完成了剧本初步创作。请在右侧画板查看《剧本正文》！接下来我把接力棒交给美术喵提取角色～</p>
            </div>
          )
        }]);

        // Add Script to Canvas
        setCanvasItems(prev => [...prev, {
          id: 'canvas_script_1',
          type: 'script',
          x: 50,
          y: 50,
          width: 380,
          content: (
            <div className="flex flex-col gap-4 text-slate-300 text-sm leading-relaxed">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#8B5CF6]" /> 剧本正文
                </h3>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-md">V1.0</span>
              </div>
              <div className="bg-[#1E1B4B]/30 p-4 rounded-xl border border-white/5 shadow-inner">
                <p className="font-bold text-[#8B5CF6] mb-2">【场景 1】温馨的书房 - 午后</p>
                <p className="mb-3 text-slate-300">阳光透过百叶窗的缝隙，在木质书桌上切出细碎的光斑。Mia戴着防蓝光眼镜，眉头微蹙，紧盯着屏幕，手指在键盘上飞快敲击。咖啡杯里的热气已经散尽。</p>
                <p className="mb-3 text-slate-300">桌角，一只橘白相间的小猫正端着手打盹。它的一只耳朵突然抖了抖，睁开圆溜溜的眼睛，默默注视着神情紧绷的Mia。</p>
                <div className="bg-black/20 p-3 rounded-lg mt-4 border-l-2 border-[#8B5CF6]">
                  <p className="text-[#E11D48] font-medium mb-1">Mia (轻声, 疲惫地):</p>
                  <p className="text-white">"等一下哦，马上就好..."</p>
                </div>
              </div>
            </div>
          )
        }]);

        // System Message: Invite Character Designer
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'sys_2',
            role: 'system',
            content: <div className="text-xs text-slate-500 text-center my-4 bg-white/[0.02] py-2 rounded-full mx-8">🦉 剧本喵 邀请 🦊 美术喵 加入了群聊</div>
          }]);

          // Character Designer joins (Huobao Role Extractor logic)
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: 'cd_1',
              role: 'character_designer',
              status: 'done',
              content: (
                <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
                  <p>嗷呜！美术喵报到 🎨</p>
                  <p>我把剧本里的角色都抓出来啦。为你生成了角色档案（Mia和小猫），画板上已经更新了！</p>
                  <p>正在呼叫分镜喵进行最后的视频生成工作...</p>
                </div>
              )
            }]);

            // Add Characters to Canvas
            setCanvasItems(prev => [...prev, {
              id: 'canvas_chars_1',
              type: 'character',
              x: 460,
              y: 50,
              width: 500,
              content: (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" /> 角色档案
                    </h3>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white">全部加到资产库</Button>
                  </div>
                  <div className="flex gap-4">
                    {/* Cat Character */}
                    <div className="flex-1 bg-[#2a2a2a]/60 backdrop-blur-md rounded-xl p-4 border border-white/5 flex flex-col gap-3 group hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-base">小猫</h4>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">主角</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3">一只橘白相间的小猫，是Mia的贴心伙伴。它具有很强的观察力，是一个充满灵性且温暖的角色。</p>
                      <div className="h-36 bg-[#1a1a1a] rounded-lg mt-2 flex items-center justify-center text-slate-600 border border-white/5 overflow-hidden relative">
                        <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20cute%20fluffy%20orange%20and%20white%20cat%20sitting%20on%20a%20desk%2C%20healing%20soft%20chibi%20anime%20style%2C%20warm%20lighting&image_size=square" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cat" />
                      </div>
                      <Button size="sm" className="w-full bg-white/5 hover:bg-white/10 text-white mt-1 border border-white/5 h-8 text-xs">+ 加到资产库</Button>
                    </div>
                    {/* Mia Character */}
                    <div className="flex-1 bg-[#2a2a2a]/60 backdrop-blur-md rounded-xl p-4 border border-white/5 flex flex-col gap-3 group hover:border-yellow-500/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-base">Mia</h4>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">主角</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3">Mia是一个在温馨书房里忙碌工作的年轻女性。她对待工作非常专注，展现出温柔、感性的一面。</p>
                      <div className="h-36 bg-[#1a1a1a] rounded-lg mt-2 flex items-center justify-center text-slate-600 border border-white/5 overflow-hidden relative">
                        <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20young%20woman%20with%20glasses%20working%20at%20a%20desk%2C%20healing%20soft%20chibi%20anime%20style%2C%20warm%20afternoon%20lighting&image_size=square" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Mia" />
                      </div>
                      <Button size="sm" className="w-full bg-white/5 hover:bg-white/10 text-white mt-1 border border-white/5 h-8 text-xs">+ 加到资产库</Button>
                    </div>
                  </div>
                </div>
              )
            }]);

            // System Message: Invite Storyboard Director
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: 'sys_3',
                role: 'system',
                content: <div className="text-xs text-slate-500 text-center my-4 bg-white/[0.02] py-2 rounded-full mx-8">🦊 美术喵 邀请 🎬 分镜喵 加入了群聊</div>
              }]);

              // Storyboard Designer joins (Huobao Storyboard Breaker & Video Generator)
              setTimeout(() => {
                setMessages(prev => [...prev, {
                  id: 'sd_1',
                  role: 'storyboard_director',
                  status: 'done',
                  content: (
                    <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
                      <p>咔嚓！分镜喵就位 🎥</p>
                      <p>分镜脚本已经拆解完毕，并且我已经调用了 Seedance 2.0 为你生成了首个镜头的动态预览。快去画板上看看效果吧！</p>
                      <p className="text-[#E11D48] mt-2 font-medium">✨ 整个第一幕的草稿已经完成了，导演下一步想修改哪里？</p>
                    </div>
                  )
                }]);

                // Add Storyboard to Canvas
                setCanvasItems(prev => [...prev, {
                  id: 'canvas_storyboard_1',
                  type: 'storyboard',
                  x: 50,
                  y: 450,
                  width: 910,
                  content: (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Clapperboard className="w-5 h-5 text-blue-500" /> 分镜与视频预览
                        </h3>
                        <div className="flex gap-2">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">Seedance 2.0 引擎</span>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-white">进入专业模式精调</Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        {/* Shot 1 */}
                        <div className="w-1/3 bg-[#1E1B4B]/20 rounded-xl border border-white/5 overflow-hidden group">
                          <div className="relative aspect-video bg-black flex items-center justify-center">
                            <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Sunlight%20filtering%20through%20blinds%20onto%20a%20wooden%20desk%2C%20healing%20soft%20chibi%20anime%20style%2C%20cinematic%20lighting&image_size=landscape_16_9" className="w-full h-full object-cover opacity-80" alt="Shot 1" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-10 h-10 text-white" />
                            </div>
                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">镜头 1 (3s)</span>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-slate-300 line-clamp-2">阳光透过百叶窗的缝隙，在木质书桌上切出细碎的光斑。空镜引入，营造午后宁静氛围。</p>
                          </div>
                        </div>
                        
                        {/* Shot 2 */}
                        <div className="w-1/3 bg-[#1E1B4B]/20 rounded-xl border border-white/5 overflow-hidden group ring-1 ring-blue-500/30">
                          <div className="relative aspect-video bg-black flex items-center justify-center">
                            <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20young%20woman%20Mia%20typing%20on%20keyboard%2C%20focused%20expression%2C%20healing%20soft%20chibi%20anime%20style%2C%20medium%20shot&image_size=landscape_16_9" className="w-full h-full object-cover opacity-80" alt="Shot 2" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-10 h-10 text-white" />
                            </div>
                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">镜头 2 (4s)</span>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-slate-300 line-clamp-2">中景：Mia眉头微蹙，紧盯着屏幕，手指在键盘上飞快敲击。</p>
                          </div>
                        </div>

                        {/* Shot 3 */}
                        <div className="w-1/3 bg-[#1E1B4B]/20 rounded-xl border border-white/5 overflow-hidden group">
                          <div className="relative aspect-video bg-black flex items-center justify-center">
                            <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20cute%20orange%20and%20white%20cat%20sleeping%20on%20desk%20opening%20eyes%2C%20healing%20soft%20chibi%20anime%20style%2C%20close%20up&image_size=landscape_16_9" className="w-full h-full object-cover opacity-80" alt="Shot 3" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle className="w-10 h-10 text-white" />
                            </div>
                            <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">镜头 3 (3s)</span>
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-slate-300 line-clamp-2">特写：小猫睁开圆溜溜的眼睛，默默注视着神情紧绷的Mia。</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }]);
                
                setIsFlowRunning(false);

              }, 2500);
            }, 1500);

          }, 2000);
        }, 1500);

      }, 2000);
    }, 1500);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput
    }]);

    const currentInput = chatInput;
    setChatInput("");
    setIsFlowRunning(true);

    // Simulate agent response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_resp',
        role: 'storyboard_director',
        status: 'done',
        content: (
          <div className="text-sm text-slate-300 space-y-2 leading-relaxed">
            <p>收到修改意见：「{currentInput}」</p>
            <p>分镜喵正在调整镜头，画板稍后更新... 🎬</p>
          </div>
        )
      }]);
      setIsFlowRunning(false);
    }, 1500);
  };

  // --- Render Hero View ---
  if (mode === 'hero') {
    return (
      <div className="flex flex-col h-full bg-[#050505] overflow-hidden relative selection:bg-[#E11D48]/30 text-slate-200 font-sans w-full">
        {/* Background Ambience */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E11D48]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1E1B4B]/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
        
        {/* Top Navbar */}
        <div className="h-16 px-8 flex items-center justify-between shrink-0 relative z-10 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#8B5CF6] p-[1px]">
              <div className="w-full h-full bg-[#0a0a0a] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">TensorsLab</span>
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
            
            <div className="mb-6 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-[#E11D48] flex items-center gap-2 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E11D48]"></span>
              </span>
              已接入 Seedream 5 & Seedance 2.0
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-10 tracking-tight">
              把创意交给 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] to-[#8B5CF6]">Agent</span> 团队
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full">
              {[
                { icon: "🪄", title: "一句话生成短剧" },
                { icon: "🐱", title: "Agent 协作" },
                { icon: "🎬", title: "智能分镜" },
                { icon: "🎨", title: "角色资产库" },
              ].map((btn, idx) => (
                <button key={idx} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-slate-200">
                  <span className="text-base">{btn.icon}</span>
                  {btn.title}
                </button>
              ))}
            </div>

            <div className="w-full relative group max-w-3xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#E11D48]/20 to-[#8B5CF6]/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative bg-[#0F0F23]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 focus-within:border-[#E11D48]/40">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入你想要的剧情，例如：一只名叫Mia的小猫在太空迷路的故事..."
                  className="min-h-[140px] w-full bg-transparent border-0 resize-none text-lg p-6 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
                />
                
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border-t border-white/5 relative">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white rounded-[16px] bg-white/[0.04] hover:bg-white/10 h-8 px-4 font-medium transition-colors border border-white/5">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-400" /> 帮我润色
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white rounded-[16px] bg-white/[0.04] hover:bg-white/10 h-8 px-4 font-medium transition-colors border border-white/5">
                      🎲 随机灵感
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={startAgentFlow}
                    disabled={!prompt.trim()}
                    className="bg-[#E11D48] text-white hover:bg-[#E11D48]/90 rounded-[24px] px-8 h-11 font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(225,29,72,0.3)] ml-auto"
                  >
                    让 Agent 帮我做 <ArrowRight className="w-4 h-4 ml-2 opacity-90" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center flex-wrap gap-3 opacity-80 max-w-3xl">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mr-2">试试这些</span>
              {["Mia和她可爱小猫的一天", "末日废土的机器狗", "古代剑客竹林决斗"].map((preset) => (
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
      </div>
    );
  }

  // --- Render Agent Workspace View ---
  return (
    <div className="flex h-full bg-[#050505] overflow-hidden text-slate-200 font-sans w-full">
      
      {/* Left Panel: Agent Chat */}
      <div className="w-[420px] border-r border-white/5 bg-[#0F0F23] flex flex-col shrink-0 relative z-20 shadow-2xl">
        {/* Header */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F0F23]">
          
          {/* OiiOii Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-transparent flex items-center justify-center">
              <img 
                src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cute%20pink%20and%20white%20kawaii%20cat%20face%2C%20large%20round%20dark%20eyes%2C%20simple%20flat%20vector%20illustration%2C%20light%20pink%20background%2C%20logo%20design&image_size=square" 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-cover shadow-sm"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">TensorsLab</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-full bg-white/5">
              <Share className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-full bg-white/5">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-[#0F0F23] custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
              {msg.role !== 'user' && <AgentAvatar role={msg.role} />}
              
              <div className={cn(
                "p-3.5 rounded-2xl max-w-[90%] shadow-sm",
                msg.role === 'user' 
                  ? "bg-[#E11D48] text-white rounded-tr-sm" 
                  : "bg-[#1E1B4B]/40 text-slate-200 rounded-tl-sm border border-white/5"
              )}>
                {msg.role === 'user' ? (
                  <span className="text-sm leading-relaxed">{msg.content}</span>
                ) : msg.role === 'system' ? (
                  <span className="text-sm">{msg.content}</span>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                      <CheckCircle2 className={cn("w-3.5 h-3.5", 
                        msg.role === 'art_director' ? 'text-[#E11D48]' : 
                        msg.role === 'screenwriter' ? 'text-[#8B5CF6]' : 
                        msg.role === 'character_designer' ? 'text-yellow-500' : 'text-blue-500'
                      )} />
                      <span className="text-xs font-medium text-slate-400">
                        {msg.status === 'thinking' ? '思考中...' : '任务完成'}
                      </span>
                    </div>
                    {msg.content}
                  </div>
                )}
              </div>

              {/* Action Buttons specifically for Art Director step 1 */}
              {msg.id === 'ad_1' && !optionsConfirmed && (
                <div className="mt-3 w-full pl-10 pr-2 animate-in fade-in slide-in-from-top-2">
                  <Button 
                    onClick={handleConfirmOptions}
                    className="w-full bg-[#E11D48] hover:bg-[#E11D48]/90 text-white rounded-[16px] shadow-lg shadow-[#E11D48]/20 h-10 text-sm"
                  >
                    确认风格并继续 <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isFlowRunning && (
             <div className="flex items-center gap-2 text-slate-500 text-xs pl-10 animate-pulse">
               <Loader2 className="w-3 h-3 animate-spin" /> Agent 正在忙碌中...
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#0F0F23]">
          <div className="bg-[#1E1B4B]/30 border border-white/10 rounded-[20px] p-2 focus-within:border-[#E11D48]/40 transition-colors shadow-inner">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="输入你的修改意见，或拖拽图片..."
              className="min-h-[60px] w-full bg-transparent border-0 resize-none text-sm p-2 text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between px-2 pb-1 mt-1">
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white rounded-full">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white rounded-full text-xs bg-white/5">
                  @ 剧本
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white rounded-full text-xs bg-white/5">
                  @ 分镜
                </Button>
              </div>
              <Button 
                size="icon" 
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="h-8 w-8 rounded-full bg-[#E11D48] hover:bg-[#E11D48]/90 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Infinite Canvas */}
      <div className="flex-1 bg-[#141414] relative overflow-auto bg-[radial-gradient(#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* Top Right Professional Mode Switch */}
        <div className="absolute top-6 right-8 z-50 flex gap-4">
          <Button variant="outline" className="bg-[#1E1B4B]/40 backdrop-blur-md border-[#E11D48]/30 text-white hover:bg-[#E11D48]/20 rounded-full h-10 px-6 shadow-[0_0_15px_rgba(225,29,72,0.15)] transition-all hover:scale-105" onClick={() => setActiveTab("dashboard")}>
            <LayoutTemplate className="w-4 h-4 mr-2 text-[#E11D48]" />
            进入专业工作台
          </Button>
        </div>

        <div className="min-w-[2000px] min-h-[2000px] relative p-12">
          {canvasItems.map((item) => (
            <div 
              key={item.id} 
              className="absolute bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-500 hover:border-white/20 transition-colors"
              style={{ left: item.x, top: item.y, width: item.width }}
            >
              {item.content}
            </div>
          ))}
          {canvasItems.length === 0 && (
             <div className="absolute top-1/2 left-1/4 -translate-y-1/2 text-slate-500 text-center flex flex-col items-center gap-4 opacity-50">
               <img src="https://coreva-normal.trae.ai/api/ide/v1/text_to_image?prompt=Cute%20pink%20and%20white%20kawaii%20cat%20face%2C%20large%20round%20dark%20eyes%2C%20simple%20flat%20vector%20illustration%2C%20light%20pink%20background%2C%20logo%20design&image_size=square" alt="Empty" className="w-24 h-24 rounded-full grayscale opacity-50 mix-blend-screen" />
               <p>在左侧与 Agent 聊天，内容会自动在此生成</p>
             </div>
          )}
        </div>

        {/* Bottom Floating Toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#1E1B4B]/60 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl">
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> 添加画板
          </Button>
          <div className="w-[1px] h-4 bg-white/10 mx-2"></div>
          <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white rounded-full">
            <CheckCircle2 className="w-4 h-4 mr-2" /> 多选
          </Button>
          <div className="w-[1px] h-4 bg-white/10 mx-2"></div>
          <span className="text-xs text-slate-400 px-4">100%</span>
        </div>
      </div>
    </div>
  );
}
