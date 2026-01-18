import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ScanLine, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import loginBg from "@assets/generated_images/cyberpunk_digital_security_interface_background.png";

export default function Entry() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useStore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setIsLoading(true);
    
    // Simulate network delay for effect
    setTimeout(() => {
      const success = login(code);
      
      if (success) {
        toast({
          title: "تم التحقق من الوصول",
          description: "مرحباً بك في النظام، أيها العميل.",
          className: "bg-primary/20 border-primary text-primary-foreground"
        });
        setLocation("/missions");
      } else {
        toast({
          variant: "destructive",
          title: "فشل الدخول",
          description: "الكود غير صحيح أو غير نشط.",
        });
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

      {/* Login Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 w-full max-w-md p-8 m-4"
      >
        <div className="bg-card/60 backdrop-blur-xl border border-primary/20 rounded-xl p-8 shadow-2xl relative overflow-hidden group">
          {/* Animated Border Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/30 relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-primary rounded-full opacity-50"
              />
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wider glitch-effect" data-text="نظام الوصول الآمن">نظام الوصول الآمن</h1>
            <p className="text-muted-foreground text-sm font-mono">الرجاء إدخال بيانات التصريح للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="أدخل الكود السري..."
                  className="bg-black/40 border-primary/20 text-center font-mono text-lg py-6 tracking-[0.2em] focus:border-primary/60 focus:ring-primary/20 transition-all uppercase placeholder:normal-case placeholder:tracking-normal"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-6 text-lg tracking-wide relative overflow-hidden"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  جاري التحقق... <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  تسجيل الدخول <ArrowRight className="w-5 h-5 rotate-180" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-muted-foreground font-mono">
              النظام محمي ومشفر. جميع محاولات الدخول مسجلة.
              <br />
              IP: {Math.floor(Math.random()*255)}.{Math.floor(Math.random()*255)}.XXX.XXX
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
