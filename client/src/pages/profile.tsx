import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { getMissions, getUserPlays, refreshUser } from "@/lib/api";
import type { Play } from "@shared/schema";
import { User, Shield, Trophy, Activity, History, Clock, Target, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export default function Profile() {
  const { user, setUser } = useStore();
  
  // Fetch missions
  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions(),
    refetchInterval: 30000,
  });

  // Fetch user's play history
  const { data: plays = [] } = useQuery({
    queryKey: ["plays", user?.id],
    queryFn: () => getUserPlays(user!.id),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Refresh user data periodically
  const { data: freshUser, dataUpdatedAt } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () => refreshUser(user!.id),
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Update local user when fresh data arrives (only if query data is newer)
  useEffect(() => {
    if (freshUser && dataUpdatedAt && freshUser.points !== user?.points) {
      // Only update if the fresh data has more points (can't lose points in this game)
      // or if it's a different level
      if (freshUser.points >= (user?.points || 0) || freshUser.level !== user?.level) {
        setUser(freshUser);
      }
    }
  }, [freshUser, dataUpdatedAt, user?.points, user?.level, setUser]);

  if (!user) return null;

  // Calculate level progress
  const nextLevelPoints = user.level * 200;
  const currentLevelPoints = (user.level - 1) * 200;
  const pointsInCurrentLevel = user.points - currentLevelPoints;
  const pointsNeededForLevel = 200;
  const progress = (pointsInCurrentLevel / pointsNeededForLevel) * 100;

  // Count completed missions
  const completedMissions = plays.filter((p: Play) => p.completed).length;
  const totalPoints = plays.reduce((sum: number, p: Play) => sum + (p.completed ? p.score : 0), 0);

  // Format play history
  const formatDate = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
    } catch {
      return "منذ قليل";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header / ID Card */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-primary/20 p-8">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <User className="w-64 h-64 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 bg-black/40 flex items-center justify-center shrink-0">
             <User className="w-16 h-16 text-primary" />
          </div>
          
          <div className="text-center md:text-right space-y-2 flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <h1 className="text-3xl font-display font-bold">{user.name}</h1>
              <span className="px-2 py-1 rounded text-xs font-mono bg-primary/20 text-primary border border-primary/20">
                {user.role === 'admin' ? 'مشرف النظام' : 'عميل ميداني'}
              </span>
            </div>
            <p className="font-mono text-xl text-muted-foreground tracking-widest">{user.code}</p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-4">
              <div className="bg-white/5 px-4 py-2 rounded border border-white/5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-mono font-bold text-yellow-500" data-testid="text-user-points">{user.points} XP</span>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded border border-white/5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-primary" data-testid="text-user-level">المستوى {user.level}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              إحصائيات الأداء
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>التقدم للمستوى {user.level + 1}</span>
                <span className="font-mono text-muted-foreground">{Math.floor(progress)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2 bg-white/5" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-bold font-mono text-foreground" data-testid="text-active-missions">
                  {missions.filter(m => m.active).length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">مهام نشطة</div>
              </div>
              <div className="p-4 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-bold font-mono text-green-500" data-testid="text-completed-missions">
                  {completedMissions}
                </div>
                <div className="text-xs text-muted-foreground mt-1">مهام مكتملة</div>
              </div>
              <div className="p-4 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-bold font-mono text-yellow-500" data-testid="text-total-earned">
                  {totalPoints}
                </div>
                <div className="text-xs text-muted-foreground mt-1">نقاط مكتسبة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              سجل النشاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {plays.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>لا يوجد نشاط بعد</p>
                  <p className="text-xs mt-1">ابدأ بإكمال المهمات لرؤية سجلك هنا</p>
                </div>
              ) : (
                plays.slice(0, 10).map((play: Play) => {
                  const mission = missions.find(m => m.id === play.missionId);
                  return (
                    <div key={play.id} className="flex items-center gap-3 p-3 rounded hover:bg-white/5 transition-colors" data-testid={`row-play-${play.id}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        play.completed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {play.completed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {play.completed ? 'أكمل' : 'حاول'} مهمة "{mission?.title || 'غير معروفة'}"
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(play.timestamp)}
                          {play.timeSpent && <span className="mr-2">• {play.timeSpent} ثانية</span>}
                        </div>
                      </div>
                      {play.completed && play.score > 0 && (
                        <span className="font-mono text-sm font-bold text-green-500">+{play.score}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
