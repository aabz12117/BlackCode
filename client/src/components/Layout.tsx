import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Shield, Target, Trophy, LogOut, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useStore();

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/missions", icon: Target, label: "المهام" },
    { href: "/leaderboard", icon: Trophy, label: "المتصدرين" },
    { href: "/profile", icon: User, label: "الملف الشخصي" },
  ];

  if (user.role === 'admin') {
    navItems.push({ href: "/admin", icon: LayoutDashboard, label: "الإدارة" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-hidden flex flex-col md:flex-row">
      {/* Background Grid/Scanlines */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      <div className="fixed inset-0 z-0 pointer-events-none scanline opacity-10"></div>
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card/50 backdrop-blur-xl border-b md:border-b-0 md:border-l border-primary/20 z-40 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Shield className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <h1 className="font-display font-bold text-xl tracking-wider text-primary">NEXUS</h1>
            <p className="text-xs text-muted-foreground font-mono">SECURE ACCESS</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 group relative overflow-hidden cursor-pointer",
                location === item.href 
                  ? "bg-primary/10 text-primary border-r-2 border-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
                <item.icon className={cn("w-5 h-5", location === item.href && "animate-pulse")} />
                <span className="font-medium">{item.label}</span>
                {location === item.href && (
                  <div className="absolute inset-0 bg-primary/5 blur-xl -z-10" />
                )}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-black/40 rounded-lg p-4 mb-4 font-mono text-xs border border-white/5">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">USER:</span>
              <span className="text-accent">{user.code}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">LVL:</span>
              <span className="text-primary">{user.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PTS:</span>
              <span className="text-yellow-500">{user.points}</span>
            </div>
          </div>
          
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-y-auto h-screen scrollbar-hide">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
