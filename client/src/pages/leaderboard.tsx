import { useState } from "react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard as fetchLeaderboard } from "@/lib/api";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { user: currentUser } = useStore();
  const [revealedCodes, setRevealedCodes] = useState<Set<string | number>>(new Set());
  const { data: users = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 15000,
  });
  
  // Only owner and admin can see user codes
  const canSeeCodes = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  
  const toggleCodeVisibility = (userId: string | number, code: string) => {
    if (revealedCodes.has(userId)) {
      navigator.clipboard.writeText(code);
    }
    setRevealedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
      <div className="flex flex-col items-center text-center gap-2 mb-6 md:mb-12">
        <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/50 flex items-center justify-center mb-2 md:mb-4 relative">
          <div className="absolute inset-0 rounded-full animate-ping bg-yellow-500/10" />
          <Trophy className="w-7 h-7 md:w-10 md:h-10 text-yellow-500" />
        </div>
        <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">لوحة المتصدرين</h2>
        <p className="text-muted-foreground font-mono text-xs md:text-sm">نخبة اللاعبين في النظام</p>
      </div>

      <div className="bg-card/30 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="divide-y divide-white/5">
          {users.map((user, index) => (
            <motion.div 
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 md:p-4 transition-colors",
                currentUser?.id === user.id ? "bg-primary/5" : "hover:bg-white/5"
              )}
            >
              <div className="flex items-center justify-center w-8 md:w-10 shrink-0">
                {index === 0 && <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />}
                {index === 1 && <Medal className="w-5 h-5 md:w-6 md:h-6 text-gray-300 fill-gray-300" />}
                {index === 2 && <Medal className="w-5 h-5 md:w-6 md:h-6 text-amber-600 fill-amber-600" />}
                {index > 2 && (
                  <span className="font-mono font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-bold text-sm md:text-base truncate",
                  currentUser?.id === user.id ? "text-primary" : "text-foreground"
                )}>
                  {user.name}
                </div>
                <div className="text-[10px] md:text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <span>LVL {user.level}</span>
                  {canSeeCodes && (
                    <span 
                      className={`mr-2 cursor-pointer select-none transition-all duration-200 ${
                        revealedCodes.has(user.id) ? 'text-primary' : 'blur-[4px]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCodeVisibility(user.id, user.code);
                      }}
                      title={revealedCodes.has(user.id) ? 'اضغط للنسخ والإخفاء' : 'اضغط لإظهار الكود'}
                    >
                      • {user.code}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="font-mono font-bold text-sm md:text-base text-yellow-500 shrink-0">
                {user.points.toLocaleString()} <span className="text-xs opacity-70">XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
