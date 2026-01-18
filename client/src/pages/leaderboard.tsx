import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { getLeaderboard, user: currentUser } = useStore();
  const users = getLeaderboard();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-2 mb-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/50 flex items-center justify-center mb-4 relative">
          <div className="absolute inset-0 rounded-full animate-ping bg-yellow-500/10" />
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>
        <h2 className="text-4xl font-display font-bold text-foreground">لوحة المتصدرين</h2>
        <p className="text-muted-foreground font-mono">نخبة اللاعبين في النظام</p>
      </div>

      <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs font-mono text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4 text-right">#</th>
                <th className="px-6 py-4 text-right">العميل</th>
                <th className="px-6 py-4 text-center">المستوى</th>
                <th className="px-6 py-4 text-left">النقاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "group transition-colors",
                    currentUser?.id === user.id ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5"
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                      {index === 1 && <Medal className="w-5 h-5 text-gray-300 fill-gray-300" />}
                      {index === 2 && <Medal className="w-5 h-5 text-amber-600 fill-amber-600" />}
                      <span className={cn(
                        "font-mono font-bold text-lg",
                        index < 3 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-bold text-lg",
                        currentUser?.id === user.id ? "text-primary" : "text-foreground"
                      )}>
                        {user.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{user.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-foreground border border-white/10 font-mono">
                      LVL {user.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <span className="font-mono font-bold text-yellow-500">{user.points.toLocaleString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
