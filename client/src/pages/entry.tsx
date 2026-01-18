import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ScanLine, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { login as apiLogin } from "@/lib/api";
import { Html5Qrcode } from "html5-qrcode";
import loginBg from "@assets/generated_images/cyberpunk_digital_security_interface_background.png";

export default function Entry() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [, setLocation] = useLocation();
  const { setUser } = useStore();
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (inputCode?: string) => {
    const codeToUse = inputCode || code;
    if (!codeToUse) return;
    
    setIsLoading(true);
    
    try {
      const { user } = await apiLogin(codeToUse);
      setUser(user);
      
      toast({
        title: "تم التحقق من الوصول",
        description: "مرحباً بك في النظام، أيها العميل.",
        className: "bg-primary/20 border-primary text-primary-foreground"
      });
      setLocation("/missions");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل الدخول",
        description: error.message || "الكود غير صحيح أو غير نشط.",
      });
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin();
  };

  const startScanner = () => {
    setIsScanning(true);
  };
  
  // Start camera after modal is rendered
  useEffect(() => {
    if (!isScanning) return;
    
    const initScanner = async () => {
      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById("qr-reader");
      if (!element) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "تعذر تحميل الماسح الضوئي.",
        });
        setIsScanning(false);
        return;
      }
      
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // QR code scanned successfully
            await stopScanner();
            setCode(decodedText.toUpperCase());
            
            // Auto-login with scanned code
            toast({
              title: "تم مسح الكود",
              description: `جاري التحقق من الكود: ${decodedText.toUpperCase()}`,
            });
            
            await handleLogin(decodedText.toUpperCase());
          },
          () => {
            // QR code not found - ignore
          }
        );
      } catch (error: any) {
        console.error("Scanner error:", error);
        toast({
          variant: "destructive",
          title: "خطأ في الكاميرا",
          description: "تعذر فتح الكاميرا. تأكد من السماح بالوصول للكاميرا.",
        });
        setIsScanning(false);
      }
    };
    
    initScanner();
  }, [isScanning]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-primary/30 rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary">مسح رمز QR</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopScanner}
                  className="text-muted-foreground hover:text-white"
                  data-testid="button-close-scanner"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div 
                id="qr-reader" 
                ref={scannerContainerRef}
                className="w-full aspect-square bg-black/50 rounded-lg overflow-hidden border border-white/10"
              />
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                وجه الكاميرا نحو رمز QR الخاص بك
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 w-full max-w-md px-4 py-6 md:p-8 m-2 md:m-4"
      >
        <div className="bg-card/60 backdrop-blur-xl border border-primary/20 rounded-xl p-5 md:p-8 shadow-2xl relative overflow-hidden group">
          {/* Animated Border Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col items-center mb-6 md:mb-8 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-primary/30 relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-primary rounded-full opacity-50"
              />
              <Lock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 tracking-wider glitch-effect" data-text="نظام الوصول الآمن">نظام الوصول الآمن</h1>
            <p className="text-muted-foreground text-sm font-mono">الرجاء إدخال بيانات التصريح للمتابعة</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={isLoading || isScanning}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
                  data-testid="button-scan-qr"
                >
                  <ScanLine className="w-5 h-5" />
                </button>
                <Input
                  type="text"
                  placeholder="أدخل الكود السري..."
                  className="bg-black/40 border-primary/20 text-center font-mono text-lg py-6 tracking-[0.2em] focus:border-primary/60 focus:ring-primary/20 transition-all uppercase placeholder:normal-case placeholder:tracking-normal"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  disabled={isLoading}
                  data-testid="input-code"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-6 text-lg tracking-wide relative overflow-hidden"
              disabled={isLoading}
              data-testid="button-login"
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

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              اضغط على أيقونة المسح لفتح الكاميرا
            </p>
          </div>

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
