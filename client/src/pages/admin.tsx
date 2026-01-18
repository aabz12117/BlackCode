import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getMissions, createMission as apiCreateMission, toggleMission as apiToggleMission, createUser, updateMission as apiUpdateMission, deleteMission as apiDeleteMission, banUser as apiBanUser, unbanUser as apiUnbanUser, getUserPlays, updateUserFull, addPlayForUser, deletePlay as apiDeletePlay, getAdminStats } from "@/lib/api";
import { ShieldAlert, Users, Plus, QrCode, Target, Trash2, Edit, Ban, UserCheck, Settings, CheckCircle2, XCircle, History, BarChart3, Search, TrendingUp, Activity } from "lucide-react";
import type { User, Play } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  const [newUserRole, setNewUserRole] = useState<"user" | "admin">("user");
  const [createUserCooldown, setCreateUserCooldown] = useState(0);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [isNewMissionOpen, setIsNewMissionOpen] = useState(false);
  const [isEditMissionOpen, setIsEditMissionOpen] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [newMissionTargetAll, setNewMissionTargetAll] = useState(true);
  const [editMissionTargetAll, setEditMissionTargetAll] = useState(true);
  const [editMissionForm, setEditMissionForm] = useState({
    title: "",
    description: "",
    points: 100,
    type: "game",
    difficulty: "easy",
    cooldown: 300,
    answer: "",
    repeatable: true,
    hidden: false,
    hintUrl: "",
    targetUsers: [] as string[]
  });
  
  // Owner-only user edit state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", code: "", points: 0, level: 1 });
  const [editingUserPlays, setEditingUserPlays] = useState<Play[]>([]);
  const [addPlayMissionId, setAddPlayMissionId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [missionSearchQuery, setMissionSearchQuery] = useState("");
  const [newMission, setNewMission] = useState({
    title: "",
    description: "",
    points: 100,
    type: "game",
    difficulty: "easy",
    cooldown: 300,
    answer: "",
    repeatable: true,
    hidden: false,
    hintUrl: "",
    targetUsers: [] as string[]
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: missions = [] } = useQuery({
    queryKey: ["missions"],
    queryFn: () => getMissions(),
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin';
  const hasAdminAccess = isOwner || isAdmin;
  
  if (!hasAdminAccess) {
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
    mutationFn: (data: Parameters<typeof createUser>[0]) => createUser(data, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: (targetId: string) => apiBanUser(targetId, user?.id),
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
    mutationFn: (targetId: string) => apiUnbanUser(targetId, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم رفع الحظر",
        description: "يمكن للمستخدم الدخول الآن.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  // Owner-only mutations for full user management
  const updateUserFullMutation = useMutation({
    mutationFn: (data: { id: string; name?: string; code?: string; points?: number; level?: number }) => 
      updateUserFull(data.id, { name: data.name, code: data.code, points: data.points, level: data.level }, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "تم تحديث المستخدم",
        description: "تم حفظ البيانات بنجاح.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  const addPlayMutation = useMutation({
    mutationFn: (data: { userId: string; missionId: string; score: number }) => 
      addPlayForUser(data.userId, data.missionId, true, data.score, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (editingUser) {
        getUserPlays(editingUser.id).then(setEditingUserPlays);
      }
      toast({
        title: "تم إضافة الإنجاز",
        description: "تم تسجيل إكمال المهمة للمستخدم.",
        className: "bg-green-500/20 border-green-500 text-green-500"
      });
    },
  });

  const deletePlayMutation = useMutation({
    mutationFn: (playId: string) => apiDeletePlay(playId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (editingUser) {
        getUserPlays(editingUser.id).then(setEditingUserPlays);
      }
      toast({
        title: "تم حذف الإنجاز",
        description: "تمت إزالة سجل المهمة.",
        className: "bg-red-500/20 border-red-500 text-red-500"
      });
    },
  });

  // Cooldown timer for user creation (prevents spam)
  useEffect(() => {
    if (createUserCooldown > 0) {
      const timer = setInterval(() => {
        setCreateUserCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [createUserCooldown]);

  const handleGenerateCode = async () => {
    // Check if name is provided
    if (!newCodeName.trim()) {
      toast({
        variant: "destructive",
        title: "اسم المستخدم مطلوب",
        description: "يرجى إدخال اسم المستخدم قبل إنشاء الكود.",
      });
      return;
    }
    
    const randomCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    // Admin can only create users, owner can create both
    const roleToCreate = isOwner ? newUserRole : "user";
    const roleLabel = roleToCreate === 'admin' ? 'مشرف' : 'مستخدم';
    
    try {
      await createUserMutation.mutateAsync({
        code: randomCode,
        name: newCodeName.trim(),
        points: 0,
        level: 1,
        role: roleToCreate,
        status: "active",
      });
      
      toast({
        title: "تم توليد الكود بنجاح",
        description: `الكود الجديد: ${randomCode} (${roleLabel}) للعميل ${newCodeName.trim()}`,
      });
      setNewCodeName("");
      setNewUserRole("user");
      setCreateUserCooldown(10); // 10 seconds cooldown
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إنشاء المستخدم",
        description: error.message,
      });
    }
  };
  
  // Helper to check if current user can ban target user
  const canBanUser = (targetRole: string) => {
    if (isOwner) return true; // Owner can ban everyone
    if (isAdmin && targetRole === 'user') return true; // Admin can only ban users
    return false;
  };

  // Toggle code visibility
  const toggleCodeVisibility = (userId: string) => {
    setRevealedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateMission = async () => {
    try {
      await createMissionMutation.mutateAsync({
        ...newMission,
        active: true,
        points: Number(newMission.points),
        cooldown: Number(newMission.cooldown),
        type: newMission.type as 'game' | 'challenge',
        difficulty: newMission.difficulty as 'easy' | 'medium' | 'hard' | 'expert',
        repeatable: newMission.repeatable,
        hidden: newMission.hidden,
        hintUrl: newMission.hintUrl || null,
        targetUsers: newMissionTargetAll ? null : (newMission.targetUsers.length > 0 ? newMission.targetUsers : null)
      });
      
      setIsNewMissionOpen(false);
      setNewMission({
        title: "",
        description: "",
        points: 100,
        type: "game",
        difficulty: "easy",
        cooldown: 300,
        answer: "",
        repeatable: true,
        hidden: false,
        hintUrl: "",
        targetUsers: []
      });
      setNewMissionTargetAll(true);
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
      repeatable: mission.repeatable,
      hidden: mission.hidden,
      hintUrl: mission.hintUrl || "",
      targetUsers: mission.targetUsers || [],
    });
    setEditMissionTargetAll(!mission.targetUsers || mission.targetUsers.length === 0);
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
          repeatable: editMissionForm.repeatable,
          hidden: editMissionForm.hidden,
          hintUrl: editMissionForm.hintUrl || null,
          targetUsers: editMissionTargetAll ? null : (editMissionForm.targetUsers.length > 0 ? editMissionForm.targetUsers : null)
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
    try {
      await deleteMissionMutation.mutateAsync(missionId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل حذف المهمة",
        description: error.message,
      });
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

  // Owner-only: Edit user handler
  const handleEditUser = async (targetUser: User) => {
    setEditingUser(targetUser);
    setEditUserForm({
      name: targetUser.name,
      code: targetUser.code,
      points: targetUser.points,
      level: targetUser.level
    });
    const plays = await getUserPlays(targetUser.id);
    setEditingUserPlays(plays);
    setAddPlayMissionId("");
    setIsEditUserOpen(true);
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      await updateUserFullMutation.mutateAsync({
        id: editingUser.id,
        name: editUserForm.name,
        code: editUserForm.code,
        points: editUserForm.points,
        level: editUserForm.level
      });
      setIsEditUserOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل تحديث المستخدم",
        description: error.message,
      });
    }
  };

  const handleAddPlay = async () => {
    if (!editingUser || !addPlayMissionId) return;
    const mission = missions.find(m => m.id === addPlayMissionId);
    if (!mission) return;
    
    try {
      await addPlayMutation.mutateAsync({
        userId: editingUser.id,
        missionId: addPlayMissionId,
        score: mission.points
      });
      setAddPlayMissionId("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل إضافة الإنجاز",
        description: error.message,
      });
    }
  };

  const handleDeletePlay = async (playId: string) => {
    try {
      await deletePlayMutation.mutateAsync(playId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل حذف الإنجاز",
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
        <div className={`px-3 py-1.5 md:px-4 md:py-2 border rounded font-mono text-xs md:text-sm flex items-center gap-2 w-fit ${
          isOwner 
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
            : 'bg-destructive/10 text-destructive border-destructive/20'
        }`}>
          <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">{isOwner ? 'OWNER ACCESS GRANTED' : 'ADMIN ACCESS GRANTED'}</span>
          <span className="sm:hidden">{isOwner ? 'OWNER' : 'ADMIN'}</span>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">مستخدم</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.activeMissions}/{stats.totalMissions}</p>
                  <p className="text-xs text-muted-foreground">مهمة نشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.completedPlays}</p>
                  <p className="text-xs text-muted-foreground">إكمال مهمة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-400 truncate max-w-[100px]" title={stats.mostPopularMission?.title}>
                    {stats.mostPopularMission?.title || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.mostPopularMission ? `${stats.mostPopularMission.playCount} لعبة` : 'الأكثر شعبية'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <Label>اسم المستخدم <span className="text-destructive">*</span></Label>
                  <Input 
                    value={newCodeName} 
                    onChange={(e) => setNewCodeName(e.target.value)}
                    placeholder="اسم العميل..." 
                    className="bg-black/20"
                    required
                    data-testid="input-new-user-name"
                  />
                </div>
                {isOwner && (
                  <div className="space-y-2">
                    <Label>نوع الحساب</Label>
                    <Select value={newUserRole} onValueChange={(val: "user" | "admin") => setNewUserRole(val)}>
                      <SelectTrigger className="bg-black/20" data-testid="select-new-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">مستخدم عادي</SelectItem>
                        <SelectItem value="admin">مشرف</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button 
                  onClick={handleGenerateCode} 
                  className="w-full bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={createUserCooldown > 0 || !newCodeName.trim()}
                  data-testid="button-generate-code"
                >
                  {createUserCooldown > 0 ? `انتظر ${createUserCooldown} ثانية` : 'توليد كود عشوائي'}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-lg md:text-xl font-bold font-display">قائمة المهام الحالية</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="بحث في المهام..." 
                  value={missionSearchQuery}
                  onChange={(e) => setMissionSearchQuery(e.target.value)}
                  className="bg-black/20 pr-10 text-sm h-9"
                  data-testid="input-search-missions"
                />
              </div>
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newMission.points}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewMission({...newMission, points: val === '' ? 0 : parseInt(val, 10)});
                        }}
                        className="bg-black/20" 
                        data-testid="input-new-mission-points"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>وقت الانتظار (ثانية)</Label>
                      <Input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newMission.cooldown}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewMission({...newMission, cooldown: val === '' ? 0 : parseInt(val, 10)});
                        }}
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
                  <div className="space-y-2">
                    <Label>رابط المساعدة (اختياري)</Label>
                    <Input 
                      value={newMission.hintUrl}
                      onChange={(e) => setNewMission({...newMission, hintUrl: e.target.value})}
                      placeholder="https://example.com/hint"
                      className="bg-black/20 text-sm" 
                      dir="ltr"
                      data-testid="input-new-mission-hint-url"
                    />
                    <p className="text-xs text-muted-foreground">رابط يحتوي على دليل للإجابة</p>
                  </div>
                  <div className="space-y-2">
                    <Label>المستخدمين المستهدفين</Label>
                    <Select 
                      value={newMissionTargetAll ? "all" : "specific"}
                      onValueChange={(val) => {
                        if (val === "all") {
                          setNewMissionTargetAll(true);
                          setNewMission({...newMission, targetUsers: []});
                        } else {
                          setNewMissionTargetAll(false);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-black/20" data-testid="select-new-mission-target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">للجميع</SelectItem>
                        <SelectItem value="specific">مستخدمين محددين</SelectItem>
                      </SelectContent>
                    </Select>
                    {!newMissionTargetAll && newMission.targetUsers.length > 0 && (
                      <p className="text-xs text-muted-foreground">تم اختيار {newMission.targetUsers.length} مستخدم</p>
                    )}
                  </div>
                  {newMissionTargetAll ? null : (
                    <div className="space-y-2 max-h-32 overflow-y-auto bg-black/20 p-2 rounded border border-white/5">
                      {users.filter(u => u.role === 'user').map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={newMission.targetUsers.includes(u.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMission({...newMission, targetUsers: [...newMission.targetUsers, u.id]});
                              } else {
                                setNewMission({...newMission, targetUsers: newMission.targetUsers.filter(id => id !== u.id)});
                              }
                            }}
                            className="rounded"
                          />
                          <span>{u.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5">
                    <div>
                      <Label className="text-sm">قابلة للتكرار</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {newMission.repeatable ? 'يمكن إعادة المهمة بعد انتهاء وقت الانتظار' : 'مرة واحدة فقط'}
                      </p>
                    </div>
                    <Switch 
                      checked={newMission.repeatable}
                      onCheckedChange={(val) => setNewMission({...newMission, repeatable: val})}
                      className="data-[state=checked]:bg-primary"
                      data-testid="switch-new-mission-repeatable"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5">
                    <div>
                      <Label className="text-sm">مهمة مخفية</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {newMission.hidden ? 'لا تظهر في قائمة المهام' : 'تظهر في قائمة المهام'}
                      </p>
                    </div>
                    <Switch 
                      checked={newMission.hidden}
                      onCheckedChange={(val) => setNewMission({...newMission, hidden: val})}
                      className="data-[state=checked]:bg-primary"
                      data-testid="switch-new-mission-hidden"
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
          </div>

          <Card className="bg-card/50 border-white/10">
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {missions.filter(m => 
                  missionSearchQuery === '' || 
                  m.title.toLowerCase().includes(missionSearchQuery.toLowerCase()) ||
                  m.description.toLowerCase().includes(missionSearchQuery.toLowerCase())
                ).map(mission => (
                  <div key={mission.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-colors gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`p-1.5 md:p-2 rounded bg-white/5 ${mission.active ? 'text-primary' : 'text-muted-foreground'}`}>
                        <Target className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm md:text-base ${!mission.active && 'text-muted-foreground line-through'}`}>{mission.title}</h4>
                          {mission.hidden && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">مخفي</span>
                          )}
                        </div>
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
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               size="icon" 
                               variant="ghost" 
                               className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive/10"
                               data-testid={`button-delete-mission-${mission.id}`}
                             >
                               <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent className="bg-card border-white/10">
                             <AlertDialogHeader>
                               <AlertDialogTitle>حذف المهمة</AlertDialogTitle>
                               <AlertDialogDescription>
                                 هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter className="gap-2">
                               <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">إلغاء</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => handleDeleteMission(mission.id)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                               >
                                 حذف
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
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
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editMissionForm.points}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditMissionForm({...editMissionForm, points: val === '' ? 0 : parseInt(val, 10)});
                      }}
                      className="bg-black/20" 
                      data-testid="input-edit-mission-points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانتظار (ثانية)</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editMissionForm.cooldown}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditMissionForm({...editMissionForm, cooldown: val === '' ? 0 : parseInt(val, 10)});
                      }}
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
                <div className="space-y-2">
                  <Label>رابط المساعدة (اختياري)</Label>
                  <Input 
                    value={editMissionForm.hintUrl}
                    onChange={(e) => setEditMissionForm({...editMissionForm, hintUrl: e.target.value})}
                    placeholder="https://example.com/hint"
                    className="bg-black/20 text-sm" 
                    dir="ltr"
                    data-testid="input-edit-mission-hint-url"
                  />
                  <p className="text-xs text-muted-foreground">رابط يحتوي على دليل للإجابة</p>
                </div>
                <div className="space-y-2">
                  <Label>المستخدمين المستهدفين</Label>
                  <Select 
                    value={editMissionTargetAll ? "all" : "specific"}
                    onValueChange={(val) => {
                      if (val === "all") {
                        setEditMissionTargetAll(true);
                        setEditMissionForm({...editMissionForm, targetUsers: []});
                      } else {
                        setEditMissionTargetAll(false);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-black/20" data-testid="select-edit-mission-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">للجميع</SelectItem>
                      <SelectItem value="specific">مستخدمين محددين</SelectItem>
                    </SelectContent>
                  </Select>
                  {!editMissionTargetAll && editMissionForm.targetUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground">تم اختيار {editMissionForm.targetUsers.length} مستخدم</p>
                  )}
                </div>
                {editMissionTargetAll ? null : (
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-black/20 p-2 rounded border border-white/5">
                    {users.filter(u => u.role === 'user').map(u => (
                      <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={editMissionForm.targetUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditMissionForm({...editMissionForm, targetUsers: [...editMissionForm.targetUsers, u.id]});
                            } else {
                              setEditMissionForm({...editMissionForm, targetUsers: editMissionForm.targetUsers.filter(id => id !== u.id)});
                            }
                          }}
                          className="rounded"
                        />
                        <span>{u.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5">
                  <div>
                    <Label className="text-sm">قابلة للتكرار</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editMissionForm.repeatable ? 'يمكن إعادة المهمة بعد انتهاء وقت الانتظار' : 'مرة واحدة فقط'}
                    </p>
                  </div>
                  <Switch 
                    checked={editMissionForm.repeatable}
                    onCheckedChange={(val) => setEditMissionForm({...editMissionForm, repeatable: val})}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-edit-mission-repeatable"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5">
                  <div>
                    <Label className="text-sm">مهمة مخفية</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editMissionForm.hidden ? 'لا تظهر في قائمة المهام' : 'تظهر في قائمة المهام'}
                    </p>
                  </div>
                  <Switch 
                    checked={editMissionForm.hidden}
                    onCheckedChange={(val) => setEditMissionForm({...editMissionForm, hidden: val})}
                    className="data-[state=checked]:bg-primary"
                    data-testid="switch-edit-mission-hidden"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  إدارة المستخدمين
                </CardTitle>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث عن مستخدم..." 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="bg-black/20 pr-10 text-sm h-9 w-full sm:w-60"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.filter(u => u.id !== user?.id).filter(u =>
                  userSearchQuery === '' ||
                  u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                  u.code.toLowerCase().includes(userSearchQuery.toLowerCase())
                ).map(u => {
                  const getRoleBadge = (role: string) => {
                    if (role === 'owner') return { label: 'مالك', className: 'bg-purple-500/20 text-purple-400' };
                    if (role === 'admin') return { label: 'مشرف', className: 'bg-blue-500/20 text-blue-400' };
                    return { label: 'مستخدم', className: 'bg-white/10 text-muted-foreground' };
                  };
                  const roleBadge = getRoleBadge(u.role);
                  const showBanButtons = canBanUser(u.role);
                  
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm md:text-base">{u.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleBadge.className}`}>{roleBadge.label}</span>
                          {u.status === 'banned' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded">محظور</span>
                          )}
                        </div>
                        <span 
                          className={`text-[10px] md:text-xs font-mono cursor-pointer select-none transition-all duration-200 ${
                            revealedCodes.has(u.id) 
                              ? 'text-primary' 
                              : 'text-muted-foreground blur-[4px]'
                          }`}
                          onClick={() => {
                            if (revealedCodes.has(u.id)) {
                              navigator.clipboard.writeText(u.code);
                            }
                            toggleCodeVisibility(u.id);
                          }}
                          title={revealedCodes.has(u.id) ? 'اضغط للنسخ والإخفاء' : 'اضغط لإظهار الكود'}
                          data-testid={`code-display-${u.id}`}
                        >
                          {u.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-right">
                          <span className="text-xs md:text-sm font-mono text-primary block">LVL {u.level}</span>
                          <span className="text-[10px] md:text-xs font-mono text-yellow-500">{u.points} XP</span>
                        </div>
                        {isOwner && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-white"
                            onClick={() => handleEditUser(u)}
                            data-testid={`button-edit-user-${u.id}`}
                          >
                            <Settings className="w-3 h-3" />
                            إدارة
                          </Button>
                        )}
                        {showBanButtons && (
                          u.status === 'active' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-7 text-xs gap-1"
                                  data-testid={`button-ban-user-${u.id}`}
                                >
                                  <Ban className="w-3 h-3" />
                                  حظر
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-destructive">تأكيد الحظر</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حظر المستخدم "{u.name}"؟ لن يتمكن من تسجيل الدخول حتى يتم رفع الحظر.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/10 border-white/20 hover:bg-white/20">إلغاء</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleBanUser(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    تأكيد الحظر
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Owner-only: Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="bg-card border-white/10 text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  إدارة المستخدم: {editingUser?.name}
                </DialogTitle>
                <DialogDescription>تعديل بيانات المستخدم وإدارة إنجازاته.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input 
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                      className="bg-black/20" 
                      data-testid="input-edit-user-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الكود السري</Label>
                    <Input 
                      value={editUserForm.code}
                      onChange={(e) => setEditUserForm({...editUserForm, code: e.target.value.toUpperCase()})}
                      className="bg-black/20 font-mono" 
                      data-testid="input-edit-user-code"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>النقاط (XP)</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={editUserForm.points}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditUserForm({...editUserForm, points: val === '' ? 0 : Number(val)});
                      }}
                      className="bg-black/20" 
                      data-testid="input-edit-user-points"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>المستوى</Label>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      value={editUserForm.level}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEditUserForm({...editUserForm, level: val === '' ? 1 : Number(val)});
                      }}
                      className="bg-black/20" 
                      data-testid="input-edit-user-level"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-bold">سجل الإنجازات ({editingUserPlays.filter(p => p.completed).length} مهمة مكتملة)</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                    {editingUserPlays.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">لا توجد إنجازات</p>
                    ) : (
                      editingUserPlays.map(play => {
                        const mission = missions.find(m => m.id === play.missionId);
                        return (
                          <div key={play.id} className="flex items-center justify-between p-2 bg-black/20 rounded border border-white/5">
                            <div className="flex items-center gap-2">
                              {play.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-sm">{mission?.title || 'مهمة غير معروفة'}</span>
                              {play.completed && play.score > 0 && (
                                <span className="text-xs text-yellow-500">+{play.score} XP</span>
                              )}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                  data-testid={`button-delete-play-${play.id}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف الإنجاز</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من حذف هذا الإنجاز؟
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10">إلغاء</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeletePlay(play.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Select value={addPlayMissionId} onValueChange={setAddPlayMissionId}>
                      <SelectTrigger className="bg-black/20 flex-1" data-testid="select-add-play-mission">
                        <SelectValue placeholder="اختر مهمة لإضافتها..." />
                      </SelectTrigger>
                      <SelectContent>
                        {missions.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.title} ({m.points} XP)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleAddPlay}
                      disabled={!addPlayMissionId}
                      className="bg-green-500 text-white hover:bg-green-600"
                      data-testid="button-add-play"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)} data-testid="button-cancel-edit-user">إلغاء</Button>
                <Button onClick={handleSaveUserEdit} className="bg-primary text-black font-bold" data-testid="button-save-edit-user">حفظ التغييرات</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
