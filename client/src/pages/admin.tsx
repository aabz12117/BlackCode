import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getMissions, createMission as apiCreateMission, toggleMission as apiToggleMission, createUser, updateMission as apiUpdateMission, deleteMission as apiDeleteMission, banUser as apiBanUser, unbanUser as apiUnbanUser } from "@/lib/api";
import { ShieldAlert, Users, Plus, QrCode, Target, Trash2, Edit, Ban, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Mission } from "@shared/schema";

export default function Admin() {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newCodeName, setNewCodeName] = useState("");
  const [isNewMissionOpen, setIsNewMissionOpen] = useState(false);
  const [isEditMissionOpen, setIsEditMissionOpen] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [editMissionForm, setEditMissionForm] = useState({
    title: "",
    description: "",
    points: 100,
    type: "game",
    difficulty: "easy",
    cooldown: 300,
    answer: ""
  });
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    points: 100,
    type: "game",
    difficulty: "easy",
    cooldown: 300,
    answer: ""
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions(),
  });

  if (user?.role !== 'admin') {
    setLocation("/missions");
    return null;
  }

  const createMissionMutation = useMutation({
    mutationFn: apiCreateMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({
        title: "تم إنشاء المهمة",
        description: "تمت إضافة المهمة بنجاح.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Mission> }) => apiUpdateMission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({
        title: "تم تحديث المهمة",
        description: "تم حفظ التغييرات بنجاح.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  const deleteMissionMutation = useMutation({
    mutationFn: apiDeleteMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast({
        title: "تم حذف المهمة",
        description: "تمت إزالة المهمة بنجاح.",
        className: "bg-red-500/20 border-red-500 text-red-500"
      });
    },
  });

  const toggleMissionMutation = useMutation({
    mutationFn: apiToggleMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: apiBanUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم حظر المستخدم",
        description: "لن يتمكن المستخدم من الدخول.",
        className: "bg-red-500/20 border-red-500 text-red-500"
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: apiUnbanUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم رفع الحظر",
        description: "يمكن للمستخدم الدخول الآن.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  const handleGenerateCode = async () => {
    const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    try {
      await createUserMutation.mutateAsync({
        code: randomCode,
        name: newCodeName || "مجهول",
        points: 0,
        level: 1,
        role: "user",
        status: "active",
      });
      
      toast({
        title: "تم توليد الكود بنجاح",
        description: `الكود الجديد: ${randomCode} للعميل ${newCodeName || "مجهول"}`,
      });
      setNewCodeName("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء المستخدم",
        description: error.message,
      });
    }
  };

  const handleCreateMission = async () => {
    try {
      await createMissionMutation.mutateAsync({
        ...newMission,
        active: true,
        points: Number(newMission.points),
        cooldown: Number(newMission.cooldown),
        type: newMission.type as 'game' | 'challenge',
        difficulty: newMission.difficulty as 'easy' | 'medium' | 'hard' | 'expert'
      });
      
      setIsNewMissionOpen(false);
      setNewMission({
        title: "",
        description: "",
        points: 100,
        type: "game",
        difficulty: "easy",
        cooldown: 300,
        answer: ""
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء المهمة",
        description: error.message,
      });
    }
  };

  const handleEditMission = (mission: Mission) => {
    setEditingMissionId(mission.id);
    setEditMissionForm({
      title: mission.title,
      description: mission.description,
      points: mission.points,
      type: mission.type,
      difficulty: mission.difficulty,
      cooldown: mission.cooldown,
      answer: mission.answer,
    });
    setIsEditMissionOpen(true);
  };

  const handleSaveEditMission = async () => {
    if (!editingMissionId) return;
    
    try {
      await updateMissionMutation.mutateAsync({
        id: editingMissionId,
        data: {
          title: editMissionForm.title,
          description: editMissionForm.description,
          points: Number(editMissionForm.points),
          type: editMissionForm.type as 'game' | 'challenge',
          difficulty: editMissionForm.difficulty as 'easy' | 'medium' | 'hard' | 'expert',
          cooldown: Number(editMissionForm.cooldown),
          answer: editMissionForm.answer,
        }
      });
      setIsEditMissionOpen(false);
      setEditingMissionId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل تحديث المهمة",
        description: error.message,
      });
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
      try {
        await deleteMissionMutation.mutateAsync(missionId);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "فشل حذف المهمة",
          description: error.message,
        });
      }
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await banUserMutation.mutateAsync(userId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل حظر المستخدم",
        description: error.message,
      });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUserMutation.mutateAsync(userId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل رفع الحظر",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-destructive">لوحة التحكم</h2>
          <p className="text-muted-foreground font-mono text-xs md:text-sm">منطقة محظورة - للمشرفين فقط</p>
        </div>
        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded font-mono text-xs md:text-sm flex items-center gap-2 w-fit">
          <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">ADMIN ACCESS GRANTED</span>
          <span className="sm:hidden">ADMIN</span>
        </div>
      </div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-white/5 text-xs md:text-sm">
          <TabsTrigger value="codes" className="text-xs md:text-sm" data-testid="tab-codes">الأكواد</TabsTrigger>
          <TabsTrigger value="missions" className="text-xs md:text-sm" data-testid="tab-missions">المهام</TabsTrigger>
          <TabsTrigger value="users" className="text-xs md:text-sm" data-testid="tab-users">المستخدمين</TabsTrigger>
        </TabsList>
        
        <TabsContent value="codes" className="space-y-4 mt-4 md:mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    data-testid="input-new-user-name"
                  />
                </div>
                <Button onClick={handleGenerateCode} className="w-full bg-primary text-black font-bold hover:bg-primary/90" data-testid="button-generate-code">
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

        <TabsContent value="missions" className="space-y-4 mt-4 md:mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg md:text-xl font-bold font-display">قائمة المهام الحالية</h3>
            <Dialog open={isNewMissionOpen} onOpenChange={setIsNewMissionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-black font-bold hover:bg-primary/90 gap-2 text-xs md:text-sm" data-testid="button-new-mission">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">مهمة جديدة</span>
                  <span className="sm:hidden">جديدة</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-foreground max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                  <DialogDescription>أدخل تفاصيل المهمة أو التحدي الجديد.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label>عنوان المهمة</Label>
                    <Input 
                      value={newMission.title}
                      onChange={(e) => setNewMission({...newMission, title: e.target.value})}
                      className="bg-black/20" 
                      data-testid="input-new-mission-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Input 
                      value={newMission.description}
                      onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                      className="bg-black/20" 
                      data-testid="input-new-mission-description"
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
                        data-testid="input-new-mission-points"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وقت الانتظار (ثانية)</Label>
                      <Input 
                        type="number" 
                        value={newMission.cooldown}
                        onChange={(e) => setNewMission({...newMission, cooldown: Number(e.target.value)})}
                        className="bg-black/20" 
                        data-testid="input-new-mission-cooldown"
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
                        <SelectTrigger className="bg-black/20" data-testid="select-new-mission-type">
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
                        <SelectTrigger className="bg-black/20" data-testid="select-new-mission-difficulty">
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
                  <div className="space-y-2">
                    <Label>الإجابة الصحيحة</Label>
                    <Input 
                      value={newMission.answer}
                      onChange={(e) => setNewMission({...newMission, answer: e.target.value})}
                      placeholder="أدخل الإجابة الصحيحة للمهمة"
                      className="bg-black/20 font-mono uppercase" 
                      data-testid="input-new-mission-answer"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewMissionOpen(false)} data-testid="button-cancel-new-mission">إلغاء</Button>
                  <Button onClick={handleCreateMission} className="bg-primary text-black font-bold" data-testid="button-save-new-mission">حفظ المهمة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {missions.map(mission => (
                  <div key={mission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-colors gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`p-1.5 md:p-2 rounded bg-white/5 ${mission.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Target className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm md:text-base ${!mission.active && 'text-muted-foreground line-through'}`}>{mission.title}</h4>
                        <div className="flex gap-2 text-[10px] md:text-xs text-muted-foreground font-mono mt-0.5 md:mt-1">
                          <span className="uppercase">{mission.difficulty}</span>
                          <span>•</span>
                          <span>{mission.points} XP</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4 mr-auto sm:mr-0">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${mission.id}`} className="text-[10px] md:text-xs text-muted-foreground cursor-pointer">
                          {mission.active ? 'نشط' : 'معطل'}
                        </Label>
                        <Switch 
                          id={`active-${mission.id}`}
                          checked={mission.active}
                          onCheckedChange={() => toggleMissionMutation.mutate(mission.id)}
                          className="data-[state=checked]:bg-primary scale-90 md:scale-100"
                          data-testid={`switch-toggle-mission-${mission.id}`}
                        />
                      </div>
                      <div className="flex gap-1 border-l border-white/10 pr-2 md:pr-4">
                         <Button 
                           size="icon" 
                           variant="ghost" 
                           className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-white"
                           onClick={() => handleEditMission(mission)}
                           data-testid={`button-edit-mission-${mission.id}`}
                         >
                           <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                         </Button>
                         <Button 
                           size="icon" 
                           variant="ghost" 
                           className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive/10"
                           onClick={() => handleDeleteMission(mission.id)}
                           data-testid={`button-delete-mission-${mission.id}`}
                         >
                           <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                         </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isEditMissionOpen} onOpenChange={setIsEditMissionOpen}>
            <DialogContent className="bg-card border-white/10 text-foreground max-w-md">
              <DialogHeader>
                <DialogTitle>تعديل المهمة</DialogTitle>
                <DialogDescription>قم بتعديل تفاصيل المهمة.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>عنوان المهمة</Label>
                  <Input 
                    value={editMissionForm.title}
                    onChange={(e) => setEditMissionForm({...editMissionForm, title: e.target.value})}
                    className="bg-black/20" 
                    data-testid="input-edit-mission-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Input 
                    value={editMissionForm.description}
                    onChange={(e) => setEditMissionForm({...editMissionForm, description: e.target.value})}
                    className="bg-black/20" 
                    data-testid="input-edit-mission-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>النقاط</Label>
                    <Input 
                      type="number" 
                      value={editMissionForm.points}
                      onChange={(e) => setEditMissionForm({...editMissionForm, points: Number(e.target.value)})}
                      className="bg-black/20" 
                      data-testid="input-edit-mission-points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانتظار (ثانية)</Label>
                    <Input 
                      type="number" 
                      value={editMissionForm.cooldown}
                      onChange={(e) => setEditMissionForm({...editMissionForm, cooldown: Number(e.target.value)})}
                      className="bg-black/20" 
                      data-testid="input-edit-mission-cooldown"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>النوع</Label>
                    <Select 
                      value={editMissionForm.type} 
                      onValueChange={(val) => setEditMissionForm({...editMissionForm, type: val})}
                    >
                      <SelectTrigger className="bg-black/20" data-testid="select-edit-mission-type">
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
                      value={editMissionForm.difficulty} 
                      onValueChange={(val) => setEditMissionForm({...editMissionForm, difficulty: val})}
                    >
                      <SelectTrigger className="bg-black/20" data-testid="select-edit-mission-difficulty">
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
                <div className="space-y-2">
                  <Label>الإجابة الصحيحة</Label>
                  <Input 
                    value={editMissionForm.answer}
                    onChange={(e) => setEditMissionForm({...editMissionForm, answer: e.target.value})}
                    placeholder="أدخل الإجابة الصحيحة للمهمة"
                    className="bg-black/20 font-mono uppercase" 
                    data-testid="input-edit-mission-answer"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditMissionOpen(false)} data-testid="button-cancel-edit-mission">إلغاء</Button>
                <Button onClick={handleSaveEditMission} className="bg-primary text-black font-bold" data-testid="button-save-edit-mission">حفظ التغييرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="users" className="mt-4 md:mt-6">
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                إدارة المستخدمين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.filter(u => u.id !== user?.id).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm md:text-base">{u.name}</span>
                        {u.status === 'banned' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">محظور</span>
                        )}
                      </div>
                      <span className="text-[10px] md:text-xs font-mono text-muted-foreground">{u.code}</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="text-right">
                        <span className="text-xs md:text-sm font-mono text-primary block">LVL {u.level}</span>
                        <span className="text-[10px] md:text-xs font-mono text-yellow-500">{u.points} XP</span>
                      </div>
                      {u.status === 'active' ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-7 text-xs gap-1"
                          onClick={() => handleBanUser(u.id)}
                          data-testid={`button-ban-user-${u.id}`}
                        >
                          <Ban className="w-3 h-3" />
                          حظر
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs gap-1 border-green-500/50 text-green-500 hover:bg-green-500/10"
                          onClick={() => handleUnbanUser(u.id)}
                          data-testid={`button-unban-user-${u.id}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          رفع الحظر
                        </Button>
                      )}
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
