import { useStore } from "@/lib/store";
import type { Mission, Play } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getMissions, getUserPlays } from "@/lib/api";
import { motion } from "framer-motion";
import { Gamepad2, AlertTriangle, Clock, Lock, Star, Play as PlayIcon, Timer, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useState, useEffect } from "react";

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

function getCooldownRemaining(mission: Mission, plays: Play[]): number {
  const lastPlay = plays
    .filter(p => p.missionId === mission.id && p.completed)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  if (!lastPlay) return 0;
  
  const lastPlayTime = new Date(lastPlay.timestamp).getTime();
  const cooldownMs = mission.cooldown * 1000;
  const now = Date.now();
  const remaining = (lastPlayTime + cooldownMs) - now;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return "";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Missions() {
  const { user } = useStore();
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions(),
  });
  
  const { data: plays = [] } = useQuery({
    queryKey: ["plays", user?.id],
    queryFn: () => getUserPlays(user!.id),
    enabled: !!user?.id,
  });

  // Filter missions based on targetUsers - show if no target (for all) or user is in target list
  const filteredMissions = missions.filter(mission => {
    if (!mission.targetUsers || mission.targetUsers.length === 0) {
      return true; // Available for everyone
    }
    return user && mission.targetUsers.includes(user.id);
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
        {filteredMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} plays={plays} />
        ))}
      </motion.div>
    </div>
  );
}

function MissionCard({ mission, plays }: { mission: Mission; plays: Play[] }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Check if mission was completed (for one-time missions)
  const hasCompletedMission = plays.some(p => p.missionId === mission.id && p.completed);
  const isOneTimeCompleted = !mission.repeatable && hasCompletedMission;
  
  // Calculate initial cooldown when plays or mission changes
  useEffect(() => {
    if (isOneTimeCompleted) return; // No cooldown for completed one-time missions
    const remaining = getCooldownRemaining(mission, plays);
    setCooldownRemaining(remaining);
  }, [plays, mission, isOneTimeCompleted]);
  
  // Run countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setCooldownRemaining(prev => {
        const newVal = prev - 1;
        return newVal <= 0 ? 0 : newVal;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldownRemaining > 0]);

  const difficultyColor: Record<string, string> = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-orange-500",
    expert: "text-red-500"
  };

  const isLocked = !mission.active;
  const isOnCooldown = cooldownRemaining > 0 && !isOneTimeCompleted;

  return (
    <motion.div variants={item} className={cn(
      "group relative overflow-hidden rounded-xl border bg-card/50 transition-all duration-300 hover:scale-[1.02]",
      isLocked || isOnCooldown || isOneTimeCompleted ? "border-white/5 opacity-70" : "border-primary/20 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_var(--color-primary)]"
    )}>
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="p-4 md:p-6 relative z-10 space-y-3 md:space-y-4">
        <div className="flex justify-between items-start">
          <div className={cn("p-1.5 md:p-2 rounded-lg bg-black/40 border border-white/10", isLocked || isOnCooldown ? "text-muted-foreground" : "text-primary")}>
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
            <button disabled className="w-full py-2.5 md:py-3 rounded bg-white/5 text-muted-foreground font-mono text-xs md:text-sm flex items-center justify-center gap-2 cursor-not-allowed" data-testid={`button-locked-mission-${mission.id}`}>
              <Lock className="w-4 h-4" />
              مغلق حالياً
            </button>
          ) : isOneTimeCompleted ? (
            <button disabled className="w-full py-2.5 md:py-3 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-mono text-xs md:text-sm flex items-center justify-center gap-2 cursor-not-allowed" data-testid={`button-completed-mission-${mission.id}`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>تم إكمالها</span>
            </button>
          ) : isOnCooldown ? (
            <button disabled className="w-full py-2.5 md:py-3 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono text-xs md:text-sm flex items-center justify-center gap-2 cursor-not-allowed" data-testid={`button-cooldown-mission-${mission.id}`}>
              <Timer className="w-4 h-4 animate-pulse" />
              <span>انتظر {formatCooldown(cooldownRemaining)}</span>
            </button>
          ) : (
            <Link href={`/mission/${mission.id}`}>
              <button className="w-full py-2.5 md:py-3 rounded bg-primary text-black font-bold font-display text-sm md:text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group-hover:animate-pulse" data-testid={`button-start-mission-${mission.id}`}>
                <PlayIcon className="w-4 h-4 fill-black" />
                ابدأ المهمة
              </button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
