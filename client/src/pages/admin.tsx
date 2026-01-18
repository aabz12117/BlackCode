import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { ShieldAlert, Users, Plus, QrCode, Target, Power, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user, users, missions, toggleMission, addMission } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Code Generation State
  const [newCodeName, setNewCodeName] = useState("");
  
  // Mission Management State
  const [isNewMissionOpen, setIsNewMissionOpen] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    points: 100,
    type: "game",
    difficulty: "easy",
    cooldown: 300
  });

  if (user?.role !== 'admin') {
    setLocation("/missions");
    return null;
  }

  const handleGenerateCode = () => {
    const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    toast({
      title: "تم توليد الكود بنجاح",
      description: `الكود الجديد: ${randomCode} للعميل ${newCodeName || "مجهول"}`,
    });
    setNewCodeName("");
  };

  const handleCreateMission = () => {
    const mission = {
      id: `m${Date.now()}`,
      ...newMission,
      active: true,
      points: Number(newMission.points),
      cooldown: Number(newMission.cooldown),
      type: newMission.type as 'game' | 'challenge',
      difficulty: newMission.difficulty as 'easy' | 'medium' | 'hard' | 'expert'
    };
    
    addMission(mission);
    setIsNewMissionOpen(false);
    setNewMission({
      title: "",
      description: "",
      points: 100,
      type: "game",
      difficulty: "easy",
      cooldown: 300
    });
    
    toast({
      title: "تم إنشاء المهمة",
      description: `تمت إضافة المهمة "${mission.title}" بنجاح.`,
      className: "bg-green-500/20 border-green-500 text-green-500"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-destructive">لوحة التحكم</h2>
          <p className="text-muted-foreground font-mono">منطقة محظورة - للمشرفين فقط</p>
        </div>
        <div className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded font-mono text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          ADMIN ACCESS GRANTED
        </div>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-white/5">
          <TabsTrigger value="codes">إدارة الأكواد</TabsTrigger>
          <TabsTrigger value="missions">المهام</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
        </TabsList>
        
        <TabsContent value="codes" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  إنشاء كود دخول جديد
                </CardTitle>
                <CardDescription>قم بتوليد كود دخول جديد لمستخدم.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم (اختياري)</Label>
                  <Input 
                    value={newCodeName} 
                    onChange={(e) => setNewCodeName(e.target.value)}
                    placeholder="اسم العميل..." 
                    className="bg-black/20"
                  />
                </div>
                <Button onClick={handleGenerateCode} className="w-full bg-primary text-black font-bold hover:bg-primary/90">
                  توليد كود عشوائي
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-secondary" />
                   توليد QR Code
                </CardTitle>
                <CardDescription>تحويل الكود إلى رمز استجابة سريعة.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="w-32 h-32 bg-white rounded flex items-center justify-center">
                   <QrCode className="w-24 h-24 text-black" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="missions" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-display">قائمة المهام الحالية</h3>
            <Dialog open={isNewMissionOpen} onOpenChange={setIsNewMissionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black font-bold hover:bg-primary/90 gap-2">
                  <Plus className="w-4 h-4" />
                  مهمة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-foreground">
                <DialogHeader>
                  <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                  <DialogDescription>أدخل تفاصيل المهمة أو التحدي الجديد.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>عنوان المهمة</Label>
                    <Input 
                      value={newMission.title}
                      onChange={(e) => setNewMission({...newMission, title: e.target.value})}
                      className="bg-black/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input 
                      value={newMission.description}
                      onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                      className="bg-black/20" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>النقاط</Label>
                      <Input 
                        type="number" 
                        value={newMission.points}
                        onChange={(e) => setNewMission({...newMission, points: Number(e.target.value)})}
                        className="bg-black/20" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وقت الانتظار (ثانية)</Label>
                      <Input 
                        type="number" 
                        value={newMission.cooldown}
                        onChange={(e) => setNewMission({...newMission, cooldown: Number(e.target.value)})}
                        className="bg-black/20" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>النوع</Label>
                      <Select 
                        value={newMission.type} 
                        onValueChange={(val) => setNewMission({...newMission, type: val})}
                      >
                        <SelectTrigger className="bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="game">لعبة</SelectItem>
                          <SelectItem value="challenge">تحدي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>الصعوبة</Label>
                      <Select 
                        value={newMission.difficulty} 
                        onValueChange={(val) => setNewMission({...newMission, difficulty: val})}
                      >
                        <SelectTrigger className="bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">سهل</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="hard">صعب</SelectItem>
                          <SelectItem value="expert">خبير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewMissionOpen(false)}>إلغاء</Button>
                  <Button onClick={handleCreateMission} className="bg-primary text-black font-bold">حفظ المهمة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {missions.map(mission => (
                  <div key={mission.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded bg-white/5 ${mission.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${!mission.active && 'text-muted-foreground line-through'}`}>{mission.title}</h4>
                        <div className="flex gap-2 text-xs text-muted-foreground font-mono mt-1">
                          <span className="uppercase">{mission.difficulty}</span>
                          <span>•</span>
                          <span>{mission.points} XP</span>
                          <span>•</span>
                          <span>{mission.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${mission.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          {mission.active ? 'نشط' : 'معطل'}
                        </Label>
                        <Switch 
                          id={`active-${mission.id}`}
                          checked={mission.active}
                          onCheckedChange={() => toggleMission(mission.id)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                      <div className="flex gap-1 border-l border-white/10 pr-4">
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                           <Edit className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                المستخدمين النشطين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                    <div className="flex flex-col">
                      <span className="font-bold">{u.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{u.code}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-primary">LVL {u.level}</span>
                      <Button variant="destructive" size="sm" className="h-7 text-xs">حظر</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
