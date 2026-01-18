import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMission, recordPlay, refreshUser, getUserPlays } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, CheckCircle2, XCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Mission, Play } from "@shared/schema";

function getCooldownRemaining(mission: Mission | undefined, plays: Play[]): number {
  if (!mission) return 0;
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

export default function MissionGame() {
  const [, params] = useRoute("/mission/:id");
  const [, setLocation] = useLocation();
  const { user, setUser } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost' | 'cooldown' | 'completed'>('playing');
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputCode, setInputCode] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  const { data: mission } = useQuery({
    queryKey: ["mission", params?.id],
    queryFn: () => getMission(params!.id),
    enabled: !!params?.id,
  });
  
  const { data: plays = [] } = useQuery({
    queryKey: ["plays", user?.id],
    queryFn: () => getUserPlays(user!.id),
    enabled: !!user?.id,
  });
  
  // Check if one-time mission is already completed
  const hasCompletedMission = mission && plays.some(p => p.missionId === mission.id && p.completed);
  const isOneTimeCompleted = mission && !mission.repeatable && hasCompletedMission;
  
  // Check cooldown or one-time completion on load
  useEffect(() => {
    if (mission && plays.length >= 0) {
      // Check for one-time completed first
      if (!mission.repeatable && plays.some(p => p.missionId === mission.id && p.completed)) {
        setGameState('completed');
        return;
      }
      
      // Then check cooldown for repeatable missions
      const remaining = getCooldownRemaining(mission, plays);
      if (remaining > 0) {
        setCooldownRemaining(remaining);
        setGameState('cooldown');
      }
    }
  }, [mission, plays]);
  
  // Cooldown timer
  useEffect(() => {
    if (gameState === 'cooldown' && cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            setGameState('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, cooldownRemaining]);

  const recordPlayMutation = useMutation({
    mutationFn: recordPlay,
    onSuccess: async () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["plays"] });
      
      // Refresh user data to get updated points
      if (user) {
        const updatedUser = await refreshUser(user.id);
        setUser(updatedUser);
        // Also invalidate the user query to keep cache in sync
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      }
    },
  });

  // Timer
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('lost');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  if (!mission) return <div>Mission not found</div>;

  const handleVerify = async () => {
    if (!user || !mission) return;
    
    // التحقق من الإجابة الصحيحة من قاعدة البيانات
    if (inputCode.toUpperCase() === mission.answer.toUpperCase()) {
      setGameState('won');
      
      // Record the play
      await recordPlayMutation.mutateAsync({
        userId: user.id,
        missionId: mission.id,
        score: mission.points,
        timeSpent: 60 - timeLeft,
        completed: true,
      });
      
      toast({
        title: "تم إكمال المهمة!",
        description: `تمت إضافة ${mission.points} نقطة لرصيدك.`,
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    } else {
      toast({
        variant: "destructive",
        title: "خطأ في الكود",
        description: "الرمز المدخل غير صحيح. حاول مرة أخرى.",
      });
      setInputCode("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/missions" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm md:text-base">
          <ArrowRight className="w-4 h-4" />
          العودة للمهام
        </Link>
        <div className="font-mono text-base md:text-xl font-bold flex items-center gap-1 md:gap-2">
          <span className="text-muted-foreground text-xs md:text-base hidden sm:inline">الوقت:</span>
          <span className={timeLeft < 10 ? "text-red-500 animate-pulse" : "text-primary"}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="bg-card/50 border border-primary/20 rounded-xl p-4 md:p-8 relative overflow-hidden">
        {gameState === 'playing' && (
          <div className="space-y-4 md:space-y-8">
            <div className="text-center space-y-1 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold font-display text-primary">{mission.title}</h2>
              <p className="text-muted-foreground text-sm md:text-base">{mission.description}</p>
            </div>

            <div className="bg-black/60 rounded-lg p-4 md:p-6 border border-white/10 text-center space-y-3 md:space-y-4">
              <p className="font-mono text-xs md:text-sm text-muted-foreground mb-2 md:mb-4">أدخل الإجابة الصحيحة لإكمال المهمة:</p>
              <div className="flex justify-center gap-1 md:gap-2 flex-wrap">
                {mission.answer.split('').map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="w-7 h-9 md:w-10 md:h-12 bg-primary/10 border border-primary/30 rounded flex items-center justify-center font-mono text-base md:text-xl font-bold text-primary"
                  >
                    ?
                  </motion.div>
                ))}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-2">عدد الأحرف: {mission.answer.length}</p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="relative">
                <Terminal className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="أدخل الرمز هنا..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 md:py-3 px-10 text-center font-mono text-base md:text-lg tracking-widest focus:outline-none focus:border-primary transition-colors uppercase"
                  autoFocus
                />
              </div>
              <Button onClick={handleVerify} className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-2.5 md:py-3">
                تحقق من الكود
              </Button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 md:py-12 space-y-4 md:space-y-6"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500">
              <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-500 mb-2">مهمة ناجحة!</h2>
              <p className="text-muted-foreground text-sm md:text-base">تمت إضافة {mission.points} نقطة إلى رصيدك.</p>
            </div>
            <Link href="/missions">
              <Button variant="outline" className="mt-4 border-green-500/50 text-green-500 hover:bg-green-500/10">
                العودة للقائمة
              </Button>
            </Link>
          </motion.div>
        )}

        {gameState === 'lost' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 md:py-12 space-y-4 md:space-y-6"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500">
              <XCircle className="w-8 h-8 md:w-12 md:h-12 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-red-500 mb-2">فشلت المهمة</h2>
              <p className="text-muted-foreground text-sm md:text-base">انتهى الوقت المحدد. حاول مرة أخرى لاحقاً.</p>
            </div>
            <Link href="/missions">
              <Button variant="outline" className="mt-4 border-red-500/50 text-red-500 hover:bg-red-500/10">
                العودة للقائمة
              </Button>
            </Link>
          </motion.div>
        )}

        {gameState === 'cooldown' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 md:py-12 space-y-4 md:space-y-6"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-orange-500">
              <Timer className="w-8 h-8 md:w-12 md:h-12 text-orange-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-orange-500 mb-2">فترة انتظار</h2>
              <p className="text-muted-foreground text-sm md:text-base mb-4">أكملت هذه المهمة مؤخراً. يجب الانتظار قبل إعادة المحاولة.</p>
              <div className="font-mono text-3xl md:text-4xl text-orange-400 font-bold">
                {formatCooldown(cooldownRemaining)}
              </div>
            </div>
            <Link href="/missions">
              <Button variant="outline" className="mt-4 border-orange-500/50 text-orange-500 hover:bg-orange-500/10">
                العودة للقائمة
              </Button>
            </Link>
          </motion.div>
        )}

        {gameState === 'completed' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8 md:py-12 space-y-4 md:space-y-6"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500">
              <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-green-500 mb-2">تم إكمال المهمة</h2>
              <p className="text-muted-foreground text-sm md:text-base">هذه المهمة متاحة مرة واحدة فقط وقد أكملتها بنجاح.</p>
            </div>
            <Link href="/missions">
              <Button variant="outline" className="mt-4 border-green-500/50 text-green-500 hover:bg-green-500/10">
                العودة للقائمة
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
