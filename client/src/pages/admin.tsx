import { useState } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { ShieldAlert, Users, Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user, users } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newCodeName, setNewCodeName] = useState("");

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
                  <label className="text-sm text-muted-foreground">اسم المستخدم (اختياري)</label>
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
        
        <TabsContent value="missions">
          <div className="p-8 text-center text-muted-foreground border border-dashed border-white/10 rounded-lg">
            قريباً: واجهة إدارة المهام وتعديلها
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
