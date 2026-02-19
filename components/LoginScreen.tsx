import React, { useState, useEffect } from "react";
import { Scan, AlertTriangle, ChevronLeft, Ban, Lock, Eye, EyeOff } from "lucide-react";
import { User } from "../types";
import { QRScanner } from "./QRScanner";
import { logUserAction } from "../utils";

interface LoginScreenProps {
  onLogin: (u: User) => void;
  users: User[];
}

export const LoginScreen = ({ onLogin, users }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  
  // State to manage blur effect on focus
  const [isCodeFocused, setIsCodeFocused] = useState(false);

  useEffect(() => {
    let timer: number;
    if (isLocked && lockoutTimer > 0) {
      timer = window.setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (isLocked && lockoutTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
      setError("");
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTimer]);

  const handleLogin = (uName: string, pCode: string) => {
    if (isLocked) return;

    const cleanUser = uName.trim();
    const cleanCode = pCode.trim();

    const user = users.find((u) => 
        u.username.toLowerCase() === cleanUser.toLowerCase() && 
        u.code === cleanCode
    );

    if (user) {
      if (user.status === 'banned') {
          setError("تم تبنيد الحساب - راجع الإدارة");
          logUserAction(user, "LOGIN_FAIL", "BANNED USER ATTEMPT", { user: cleanUser, code: cleanCode });
          return;
      }
      if (user.status === 'paused') {
          setError("الحساب موقوف مؤقتاً");
          logUserAction(user, "LOGIN_FAIL", "PAUSED USER ATTEMPT", { user: cleanUser, code: cleanCode });
          return;
      }
      logUserAction(user, "LOGIN_SUCCESS", "Manual Login");
      onLogin(user);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError("بيانات غير مصرح بها");
      
      // Log failed attempt with provided username AND the password they tried
      const dummyUser = { username: cleanUser } as User;
      logUserAction(dummyUser, "LOGIN_FAIL", `Invalid Credentials (Attempt ${newAttempts}/3)`, { user: cleanUser, code: cleanCode });

      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockoutTimer(30); 
        setError("تم قفل النظام // إنذار أمني");
        logUserAction(dummyUser, "SYSTEM_LOCKOUT", "3 Failed Attempts", { user: cleanUser, code: cleanCode });
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, code);
  };

  const handleScan = (data: string) => {
      setShowScanner(false);
      try {
        let qrUser = "";
        let qrCode = "";
        
        // Format: USER:PIN (e.g. Code01:1234)
        if (data.includes(":")) {
             const separatorIndex = data.indexOf(":");
             qrUser = data.substring(0, separatorIndex).trim();
             qrCode = data.substring(separatorIndex + 1).trim();
        } 
        // Legacy JSON support
        else if (data.trim().startsWith("{")) {
           try {
              const parsed = JSON.parse(data);
              qrUser = parsed.username || "";
              qrCode = parsed.code || "";
           } catch (e) { /* ignore */ }
        }
        // Legacy Space support
        else if (data.includes(" ")) {
           const parts = data.split(" ");
           if (parts.length >= 2) {
               qrUser = parts[0];
               qrCode = parts[1];
           }
        }

        if (qrUser && qrCode) {
            handleLogin(qrUser, qrCode);
        } else {
            setError("تنسيق QR غير صالح (المطلوب USER:PIN)");
        }
      } catch (e) {
         setError("خطأ في قراءة الرمز");
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden flex items-center justify-center p-6" dir="rtl">
      
      {showScanner && (
        <QRScanner 
            onScan={handleScan} 
            onClose={() => setShowScanner(false)} 
            title="المسح الأمني للدخول"
        />
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 bg-carbon opacity-20"></div>
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md bg-black/80 backdrop-blur-xl border border-primary/20 p-8 shadow-[0_0_60px_rgba(59,130,246,0.15)] rounded-2xl">
        
        {/* Decorative Corners */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-primary/60 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-primary/60 rounded-bl-xl"></div>

        {/* Header */}
        <div className="text-center mb-10 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary/20 rounded-full"></div>
            <h1 className="text-5xl font-black tracking-tighter mb-3 font-sans" dir="ltr">
            DARK<span className="text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">CODE</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.3em] text-tech uppercase">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_5px_#3B82F6]"></span>
                بوابة الدخول المشفرة
            </div>
        </div>

        {isLocked ? (
           <div className="bg-alert/10 border border-alert/50 p-6 mb-6 text-center animate-pulse relative overflow-hidden rounded-lg">
             <div className="absolute inset-0 bg-alert/5 animate-[pulse_0.5s_infinite]"></div>
             <Ban className="mx-auto text-alert mb-3 relative z-10" size={32} />
             <p className="text-alert font-bold tracking-wider text-lg mb-1 relative z-10 font-sans">إغلاق تام</p>
             <p className="text-red-400 text-xs font-mono relative z-10">محاولة إعادة الاتصال خلال {lockoutTimer} ثانية</p>
           </div>
        ) : (
            <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-5">
                    <div className="group">
                        <label className="block text-[11px] uppercase tracking-wider text-primary/70 mb-2 font-bold flex justify-between">
                            <span>اسم المستخدم</span>
                        </label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#050505] border border-white/10 text-white px-4 py-4 rounded-lg outline-none focus:border-primary focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all placeholder-dim/30 font-sans text-right text-sm"
                            placeholder="المعرف الخاص بك..."
                            autoComplete="off"
                        />
                    </div>
                    
                    <div className="group">
                        <label className="block text-[11px] uppercase tracking-wider text-primary/70 mb-2 font-bold flex justify-between">
                            <span>الرمز السري</span>
                            <span className="text-[9px] text-alert/70 font-mono tracking-wider">[TOP SECRET]</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={code}
                                maxLength={4}
                                onFocus={() => setIsCodeFocused(true)}
                                onBlur={() => setIsCodeFocused(false)}
                                onChange={(e) => setCode(e.target.value)}
                                className={`
                                    w-full bg-[#050505] border border-white/10 text-white px-4 py-4 rounded-lg outline-none 
                                    focus:border-alert focus:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all placeholder-dim/30 
                                    tracking-[1.5em] font-mono text-center text-lg
                                `}
                                placeholder="••••"
                            />
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Lock size={14} className={isCodeFocused ? "text-alert" : "text-dim"} />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-3 text-alert text-xs font-bold tracking-wider uppercase border-r-2 border-alert pr-3 bg-alert/5 py-3 rounded-r-sm">
                        {error.includes('مبند') || error.includes('موقف') ? <Lock size={14} /> : <AlertTriangle size={14} />}
                        {error}
                    </div>
                )}

                <div className="space-y-4 pt-4">
                    {/* Primary Button */}
                    <button 
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-600 text-black font-black py-4 rounded-lg transition-all relative overflow-hidden group shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider font-sans text-lg">
                            تسجيل الدخول <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>

                    <div className="flex items-center gap-4 py-1">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <span className="text-[10px] text-dim uppercase tracking-widest font-sans">أو</span>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* QR Button - Improved Aesthetic */}
                    <button 
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="w-full relative overflow-hidden group bg-white/5 border border-white/10 hover:border-primary/50 text-white rounded-lg py-3 transition-all"
                    >
                        <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center justify-center gap-3">
                            <div className="p-1.5 bg-black rounded border border-white/20 group-hover:border-primary/50 transition-colors">
                                <Scan size={16} className="text-primary" />
                            </div>
                            <span className="text-xs font-bold tracking-wider uppercase">مسح بطاقة الوصول (QR)</span>
                        </div>
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};