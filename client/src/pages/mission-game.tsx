import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMission, recordPlay } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowRight, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function MissionGame() {
  const [, params] = useRoute("/mission/:id");
  const { user } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputCode, setInputCode] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  
  const { data: mission } = useQuery({
    queryKey: ["mission", params?.id],
    queryFn: () => getMission(params!.id),
    enabled: !!params?.id,
  });

  const recordPlayMutation = useMutation({
    mutationFn: recordPlay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Initialize Game
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

  // Generate random sequence for the "game"
  useEffect(() => {
    const chars = "0123456789ABCDEF";
    const seq = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]);
    setSequence(seq);
  }, []);

  if (!mission) return <div>Mission not found</div>;

  const handleVerify = async () => {
    if (!user || !mission) return;
    
    if (inputCode.toUpperCase() === sequence.join("")) {
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/missions" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للمهام
        </Link>
        <div className="font-mono text-xl font-bold flex items-center gap-2">
          <span className="text-muted-foreground">الوقت المتبقي:</span>
          <span className={timeLeft < 10 ? "text-red-500 animate-pulse" : "text-primary"}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="bg-card/50 border border-primary/20 rounded-xl p-8 relative overflow-hidden">
        {gameState === 'playing' && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display text-primary">{mission.title}</h2>
              <p className="text-muted-foreground">{mission.description}</p>
            </div>

            <div className="bg-black/60 rounded-lg p-6 border border-white/10 text-center space-y-4">
              <p className="font-mono text-sm text-muted-foreground mb-4">قم بفك تشفير التسلسل التالي:</p>
              <div className="flex justify-center gap-2">
                {sequence.map((char, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="w-10 h-12 bg-primary/10 border border-primary/30 rounded flex items-center justify-center font-mono text-xl font-bold text-primary"
                  >
                    {char}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Terminal className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="أدخل الرمز هنا..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-10 text-center font-mono text-lg tracking-widest focus:outline-none focus:border-primary transition-colors uppercase"
                  autoFocus
                />
              </div>
              <Button onClick={handleVerify} className="w-full bg-primary hover:bg-primary/90 text-black font-bold">
                تحقق من الكود
              </Button>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12 space-y-6"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-green-500 mb-2">مهمة ناجحة!</h2>
              <p className="text-muted-foreground">تمت إضافة {mission.points} نقطة إلى رصيدك.</p>
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
            className="text-center py-12 space-y-6"
          >
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-red-500">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-red-500 mb-2">فشلت المهمة</h2>
              <p className="text-muted-foreground">انتهى الوقت المحدد. حاول مرة أخرى لاحقاً.</p>
            </div>
            <Link href="/missions">
              <Button variant="outline" className="mt-4 border-red-500/50 text-red-500 hover:bg-red-500/10">
                العودة للقائمة
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
