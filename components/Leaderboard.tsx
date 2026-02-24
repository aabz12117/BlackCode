import React from "react";
import { Trophy, Medal, Crown } from "lucide-react";
import { User, ADMIN_RANKS } from "../types";

interface LeaderboardProps {
  users: User[];
}

export const Leaderboard = ({ users }: LeaderboardProps) => {
  // Filter out admins and sort by points descending
  const sortedUsers = users
    .filter(u => !ADMIN_RANKS.includes(u.rank) && u.status !== 'paused')
    .sort((a, b) => b.points - a.points);

  const topThree = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="text-yellow-400 fill-yellow-400/20" size={20} />;
      case 1: return <Medal className="text-gray-300 fill-gray-300/20" size={20} />;
      case 2: return <Medal className="text-amber-700 fill-amber-700/20" size={20} />;
      default: return <span className="font-mono text-dim font-bold">#{index + 1}</span>;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
          <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-500" />
            لوحة الصدارة
          </h2>
          <p className="text-dim text-sm">ترتيب العملاء الميدانيين حسب النقاط المكتسبة.</p>
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {topThree.map((user, idx) => (
           <div key={idx} className={`
              relative p-6 rounded-xl border flex flex-col items-center text-center overflow-hidden
              ${idx === 0 ? 'bg-yellow-500/10 border-yellow-500/50 order-1 md:order-2 md:-mt-4 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : ''}
              ${idx === 1 ? 'bg-gray-400/10 border-gray-400/30 order-2 md:order-1' : ''}
              ${idx === 2 ? 'bg-amber-800/10 border-amber-700/30 order-3 md:order-3' : ''}
           `}>
              <div className="mb-3">{getRankIcon(idx)}</div>
              <div className="w-16 h-16 bg-black rounded-full border border-white/10 flex items-center justify-center text-2xl font-bold mb-2">
                 {user.codeName.substring(0,2)}
              </div>
              <h3 className="text-lg font-bold text-white truncate w-full">{user.codeName}</h3>
              <p className="text-[10px] text-dim uppercase tracking-widest mb-2">{user.rank}</p>
              <div className="mt-auto bg-black/40 px-3 py-1 rounded-full border border-white/10">
                 <span className="text-primary font-mono font-bold">{user.points} PTS</span>
              </div>
           </div>
        ))}
      </div>

      {/* Rest of the list */}
      <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden">
         <table className="w-full text-right">
            <thead className="bg-white/5 text-[10px] text-dim uppercase font-bold tracking-wider">
               <tr>
                  <th className="px-6 py-4">الترتيب</th>
                  <th className="px-6 py-4">الاسم الحركي</th>
                  <th className="px-6 py-4">الرتبة</th>
                  <th className="px-6 py-4 text-left">النقاط</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {rest.map((user, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                     <td className="px-6 py-4 font-mono text-dim/50 group-hover:text-white">#{idx + 4}</td>
                     <td className="px-6 py-4 font-bold text-white">{user.codeName}</td>
                     <td className="px-6 py-4 text-xs text-dim">{user.rank}</td>
                     <td className="px-6 py-4 font-mono text-primary font-bold text-left">{user.points}</td>
                  </tr>
               ))}
               {rest.length === 0 && topThree.length === 0 && (
                   <tr>
                       <td colSpan={4} className="text-center py-8 text-dim">لا توجد بيانات متاحة</td>
                   </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};
