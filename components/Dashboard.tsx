import React, { useState, useEffect, useMemo } from "react";
import { Terminal, LogOut, User, Activity, Shield, LayoutGrid, Briefcase, Wrench, Menu, X, ChevronLeft, RectangleEllipsis, Wifi, ExternalLink, Trophy, Settings, Eye, EyeOff, ShieldAlert, Map } from "lucide-react";
import { User as UserType, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { Leaderboard } from "./Leaderboard";
import { AdminPanel } from "./AdminPanel";
import { LogsViewer } from "./LogsViewer";
import { submitTaskSolution, getTaskWinnerCount, logUserAction } from "../utils";

interface DashboardProps {
  user: UserType;
  tasks: Task[];
  onLogout: () => void;
  allUsers?: UserType[]; 
  onRefresh?: () => void;
}

type View = 'tasks' | 'profile' | 'tools' | 'leaderboard' | 'admin' | 'logs';

const TOOLS = [
  {
    id: 'pager',
    name: 'نظام PAGER',
    url: 'https://aabz12117.github.io/PAGER/',
    description: 'قناة اتصال مشفرة للنقل قصير المدى وتنبيهات الطوارئ.',
    status: 'متصل'
  },
  {
    id: 'maps',
    name: 'نظام الملاحة (MAPS)',
    url: 'https://aabz12117.github.io/MAPS/',
    description: 'تحليل الإحداثيات الجغرافية وتوجيه الوحدات عبر الأقمار الصناعية.',
    status: 'متصل'
  }
];

export const Dashboard = ({ user, tasks, onLogout, allUsers = [], onRefresh }: DashboardProps) => {
  const [activeView, setActiveView] = useState<View>('tasks');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCodeRevealed, setIsCodeRevealed] = useState(false);
  
  // Local state for immediate UI feedback, though actual state comes from 'user' prop
  const [localPoints, setLocalPoints] = useState(user.points);

  const activeTasks = tasks.filter(t => t.isVisible);

  // Optimize winner counting
  const winnerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTasks.forEach(t => {
        counts[t.taskName] = getTaskWinnerCount(t.taskName, allUsers);
    });
    return counts;
  }, [activeTasks, allUsers]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleTaskSolve = async (points: number) => {
      setLocalPoints(prev => prev + points);
      if (onRefresh) onRefresh();
  };

  const submitTask = async (taskName: string, points: number) => {
      // API call to solve
      await submitTaskSolution(user, taskName, points);
      handleTaskSolve(points);
  }

  const NavItem = ({ view, icon: Icon, label, isAdminOnly = false }: { view: View; icon: any; label: string, isAdminOnly?: boolean }) => {
    if (isAdminOnly && !user.isAdmin) return null;
    return (
        <button
        onClick={() => {
            setActiveView(view);
            closeMenu();
        }}
        className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group relative overflow-hidden mb-1 ${
            activeView === view 
            ? 'bg-primary/10 text-primary font-bold' 
            : 'text-dim hover:bg-white/5 hover:text-white'
        }`}
        >
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-primary transition-opacity duration-200 ${activeView === view ? 'opacity-100' : 'opacity-0'}`}></div>
        <Icon size={20} className={activeView === view ? 'text-primary' : 'text-dim group-hover:text-white'} />
        <span className="text-sm tracking-wide">{label}</span>
        {activeView === view && (
            <ChevronLeft size={16} className="mr-auto animate-pulse" />
        )}
        </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-primary/30" dir="rtl">
      {/* Background Texture */}
      <div className="fixed inset-0 bg-carbon opacity-10 pointer-events-none"></div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
                onClick={toggleMenu}
                className="p-2 -mr-2 text-white hover:bg-white/10 rounded-md transition-colors"
             >
                <Menu size={24} />
             </button>
             <div className="flex items-center gap-2">
                <Terminal className="text-primary" size={20} />
                <h1 className="text-lg font-black tracking-tighter font-sans leading-none" dir="ltr">
                    DARK<span className="text-primary">CODE</span>
                </h1>
             </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-deep border border-primary/20 flex items-center justify-center">
             <span className="font-mono text-xs font-bold text-primary">{user.codeName.substring(0,2)}</span>
          </div>
      </header>

      {/* Sidebar - Fixed Right */}
      <aside className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-[#020202] border-l border-white/5 flex flex-col
          transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
          {/* Sidebar Header */}
          <div className="h-24 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-lg text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      <Terminal size={22} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tighter font-sans leading-none mb-1" dir="ltr">
                        DARK<span className="text-primary">CODE</span>
                    </h1>
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                       <p className="text-[10px] text-dim font-bold tracking-wider">نظام متصل</p>
                    </div>
                  </div>
              </div>
              <button onClick={closeMenu} className="lg:hidden text-dim hover:text-white transition-colors">
                  <X size={24} />
              </button>
          </div>

          {/* User Info Card */}
          <div className="p-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-black border border-primary/30 flex items-center justify-center text-primary">
                          <User size={18} />
                      </div>
                      <div className="overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">{user.codeName}</p>
                          <p className="text-[10px] text-dim font-mono truncate">{user.username}</p>
                      </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-[10px] text-dim font-bold bg-black/50 px-2 py-0.5 rounded">{user.rank}</span>
                      <span className="text-[10px] font-mono text-primary tracking-widest">{localPoints} PTS</span>
                  </div>
              </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
              <p className="px-4 mb-2 text-[10px] font-bold text-dim/50 uppercase tracking-widest">القوائم</p>
              <nav className="space-y-1">
                  <NavItem view="tasks" icon={Briefcase} label="المهام الحالية" />
                  <NavItem view="profile" icon={User} label="الملف الشخصي" />
                  <NavItem view="leaderboard" icon={Trophy} label="لوحة الصدارة" />
                  <NavItem view="tools" icon={Wrench} label="الأدوات والأنظمة" />
                  
                  {user.isAdmin && (
                    <>
                        <div className="my-2 border-t border-white/5"></div>
                        <p className="px-4 mb-2 mt-4 text-[10px] font-bold text-dim/50 uppercase tracking-widest">الإدارة</p>
                        <NavItem view="admin" icon={Settings} label="لوحة التحكم" isAdminOnly={true} />
                        <NavItem view="logs" icon={ShieldAlert} label="سجل النظام" isAdminOnly={true} />
                    </>
                  )}
              </nav>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-white/5">
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"
              >
                  <LogOut size={16} />
                  <span>قطع الاتصال</span>
              </button>
          </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={closeMenu}
        />
      )}

      {/* Main Content */}
      <main className="lg:mr-72 min-h-screen pt-20 lg:pt-8 p-4 lg:p-10 transition-all duration-300">
         <div className="max-w-5xl mx-auto">
            
            {/* TASKS VIEW */}
            {activeView === 'tasks' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white mb-2">المهام المطلوبة</h2>
                        <p className="text-dim text-sm">قائمة التكليفات والعمليات النشطة المتاحة لك.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {activeTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <Briefcase className="text-dim" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">لا توجد مهام</h3>
                                <p className="text-sm text-dim">جميع العمليات مكتملة حالياً، يرجى التحقق لاحقاً.</p>
                            </div>
                        ) : (
                            activeTasks.map((task, idx) => {
                                const winners = winnerCounts[task.taskName] || 0;
                                const isSolved = user.completedTasks.includes(task.taskName);
                                return (
                                    <TaskCard 
                                        key={idx} 
                                        task={task} 
                                        onSolve={(points) => submitTask(task.taskName, points)} 
                                        currentWinners={winners}
                                        isAlreadySolved={isSolved}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* LEADERBOARD VIEW */}
            {activeView === 'leaderboard' && (
                <Leaderboard users={allUsers} />
            )}

            {/* ADMIN VIEW */}
            {activeView === 'admin' && user.isAdmin && (
                <AdminPanel users={allUsers} tasks={tasks} onRefresh={() => onRefresh && onRefresh()} />
            )}

             {/* LOGS VIEW */}
             {activeView === 'logs' && user.isAdmin && (
                <LogsViewer />
            )}

            {/* PROFILE VIEW */}
            {activeView === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white mb-2">بطاقة العميل</h2>
                        <p className="text-dim text-sm">البيانات الشخصية ومستوى التصريح الأمني.</p>
                    </div>

                    <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden relative">
                        {/* Header Banner */}
                        <div className="h-32 bg-gradient-to-l from-primary/20 via-deep to-deep relative">
                            <div className="absolute inset-0 bg-carbon opacity-30"></div>
                            <div className="absolute -bottom-10 right-8">
                                <div className="w-24 h-24 rounded-2xl bg-[#050505] p-2 border border-white/10">
                                    <div className="w-full h-full bg-deep rounded-xl flex items-center justify-center border border-primary/20 text-primary">
                                        <User size={40} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-14 px-8 pb-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">{user.codeName}</h3>
                                    <div className="flex items-center gap-2 text-primary font-mono text-sm tracking-wider">
                                        <span>@{user.username}</span>
                                        <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                                        <span className="text-white font-bold">{user.rank}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="px-4 py-2 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2">
                                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-success">حساب نشط</span>
                                    </div>
                                    <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
                                        <Shield size={14} className="text-primary" />
                                        <span className="text-xs font-bold text-primary">تصريح أمني</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-dim mb-1">نقاط التقييم</p>
                                    <p className="text-primary font-mono text-2xl font-bold">{localPoints}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-dim mb-1">الرتبة الحالية</p>
                                    <p className="text-white font-bold">{user.rank}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-dim mb-1">الاسم الحقيقي</p>
                                    <div className="group relative w-fit">
                                        <p className="text-white font-mono blur-[6px] group-hover:blur-0 transition-all duration-300 cursor-help select-none">
                                            {user.name || "محجوب أمنياً"}
                                        </p>
                                        <span className="text-[8px] text-dim opacity-50 absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full group-hover:opacity-0">كشف</span>
                                    </div>
                                </div>
                                <div 
                                    className="p-4 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setIsCodeRevealed(!isCodeRevealed)}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-dim">الرمز السري</p>
                                        {isCodeRevealed ? <EyeOff size={12} className="text-dim"/> : <Eye size={12} className="text-dim"/>}
                                    </div>
                                    <p className="text-white font-mono tracking-[0.3em] h-6">
                                        {isCodeRevealed ? user.code : "••••"}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-dim mb-1">تاريخ الانضمام</p>
                                    <p className="text-white font-mono flex items-center gap-2">
                                        <Activity size={14} className="text-primary" />
                                        {user.timestamp}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TOOLS VIEW */}
            {activeView === 'tools' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white mb-2">مركز الأدوات</h2>
                        <p className="text-dim text-sm">تطبيقات وأنظمة مساعدة للعمليات الميدانية.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {TOOLS.map((tool) => (
                            <div key={tool.id} className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden hover:border-primary/50 transition-colors group">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-deep border border-white/10 rounded-xl flex items-center justify-center text-white group-hover:bg-primary group-hover:text-black transition-all duration-300 shadow-lg">
                                            {/* Icon Logic */}
                                            {tool.id === 'pager' ? <RectangleEllipsis size={24} /> : 
                                             tool.id === 'maps' ? <Map size={24} /> : 
                                             <Wrench size={24} />}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 border border-success/10 rounded-full">
                                            <Wifi size={10} className="text-success" />
                                            <span className="text-[10px] font-bold text-success">{tool.status}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>
                                    <p className="text-sm text-dim leading-relaxed h-10 line-clamp-2 mb-6">
                                        {tool.description}
                                    </p>
                                    <a 
                                        href={tool.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => logUserAction(user, "OPEN_TOOL", `Opened: ${tool.name}`)}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-primary hover:text-black text-white text-xs font-bold rounded-lg transition-all border border-white/5 group-hover:border-primary/50"
                                    >
                                        تشغيل الأداة <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        ))}

                        <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-white/5 min-h-[250px]">
                            <Wrench size={32} className="text-dim/30 mb-3" />
                            <h4 className="text-white/50 font-bold mb-1">قيد التطوير</h4>
                            <p className="text-xs text-dim/40 max-w-[200px]">يتم العمل على إضافة المزيد من الأدوات للأنظمة الميدانية</p>
                        </div>
                    </div>
                </div>
            )}
            
         </div>
      </main>
    </div>
  );
};