import { useStore } from "@/lib/store";
import { User, Shield, Trophy, Activity, History, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Profile() {
  const { user, missions } = useStore();

  if (!user) return null;

  // Mock calculation for next level progress
  const nextLevelPoints = user.level * 200;
  const progress = (user.points % 200) / 200 * 100;

  // Mock history - in a real app this would be in the store/database
  const history = [
    { action: "تم إكمال مهمة 'تفكيك الشفرة'", date: "منذ 2 ساعة", points: "+100", type: "success" },
    { action: "تسجيل الدخول للنظام", date: "منذ 2 ساعة", points: "", type: "info" },
    { action: "محاولة فاشلة 'اختراق الجدار'", date: "الأمس", points: "", type: "error" },
  ];

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
                <span className="font-mono font-bold text-yellow-500">{user.points} XP</span>
              </div>
              <div className="bg-white/5 px-4 py-2 rounded border border-white/5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-primary">المستوى {user.level}</span>
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
              <Progress value={progress} className="h-2 bg-white/5" indicatorClassName="bg-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">{missions.filter(m => m.active).length}</div>
                <div className="text-xs text-muted-foreground mt-1">مهام نشطة</div>
              </div>
              <div className="p-4 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-bold font-mono text-foreground">3</div>
                <div className="text-xs text-muted-foreground mt-1">مهام مكتملة</div>
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
            <div className="space-y-4">
              {history.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded hover:bg-white/5 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    item.type === 'success' ? 'bg-green-500' : 
                    item.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.action}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </div>
                  </div>
                  {item.points && (
                    <span className="font-mono text-sm font-bold text-green-500">{item.points}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
