import { useStore } from "@/lib/store";
import type { Mission } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getMissions } from "@/lib/api";
import { motion } from "framer-motion";
import { Gamepad2, AlertTriangle, Clock, Lock, Star, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Missions() {
  const { user } = useStore();
  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions(),
  });

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex flex-col gap-1 md:gap-2">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary">قائمة المهام</h2>
        <p className="text-muted-foreground font-mono text-xs md:text-sm">أكمل المهام لرفع مستواك وكسب النقاط.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"
      >
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </motion.div>
    </div>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const difficultyColor = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-orange-500",
    expert: "text-red-500"
  };

  const isLocked = !mission.active;

  return (
    <motion.div variants={item} className={cn(
      "group relative overflow-hidden rounded-xl border bg-card/50 transition-all duration-300 hover:scale-[1.02]",
      isLocked ? "border-white/5 opacity-70" : "border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--color-primary)]"
    )}>
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="p-4 md:p-6 relative z-10 space-y-3 md:space-y-4">
        <div className="flex justify-between items-start">
          <div className={cn("p-1.5 md:p-2 rounded-lg bg-black/40 border border-white/10", isLocked ? "text-muted-foreground" : "text-primary")}>
            {mission.type === 'game' ? <Gamepad2 className="w-5 h-5 md:w-6 md:h-6" /> : <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div className="flex items-center gap-1 bg-black/40 px-2 md:px-3 py-1 rounded-full border border-white/10">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs md:text-sm font-bold font-mono text-yellow-500">{mission.points}</span>
          </div>
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-bold font-display mb-1 md:mb-2">{mission.title}</h3>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{mission.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs font-mono">
          <div className="bg-white/5 rounded px-2 py-1 flex items-center gap-1 md:gap-2">
            <Clock className="w-3 h-3 opacity-70" />
            <span>{Math.floor(mission.cooldown / 60)} دقيقة</span>
          </div>
          <div className="bg-white/5 rounded px-2 py-1 flex items-center gap-1 md:gap-2">
            <AlertTriangle className="w-3 h-3 opacity-70" />
            <span className={cn("uppercase", difficultyColor[mission.difficulty])}>{mission.difficulty}</span>
          </div>
        </div>

        <div className="pt-1 md:pt-2">
          {isLocked ? (
            <button disabled className="w-full py-2.5 md:py-3 rounded bg-white/5 text-muted-foreground font-mono text-xs md:text-sm flex items-center justify-center gap-2 cursor-not-allowed">
              <Lock className="w-4 h-4" />
              مغلق حالياً
            </button>
          ) : (
            <Link href={`/mission/${mission.id}`}>
              <button className="w-full py-2.5 md:py-3 rounded bg-primary text-black font-bold font-display text-sm md:text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group-hover:animate-pulse">
                <Play className="w-4 h-4 fill-black" />
                ابدأ المهمة
              </button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
