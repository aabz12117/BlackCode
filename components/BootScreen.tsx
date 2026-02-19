import React from "react";
import { Activity, Database, ShieldCheck } from "lucide-react";

export const BootScreen = ({ status }: { status: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-black text-primary font-mono p-4 z-50 relative overflow-hidden" dir="ltr">
    <div className="absolute inset-0 bg-carbon opacity-30"></div>
    
    <div className="w-72 relative z-10 text-right" dir="rtl">
      <div className="flex justify-between mb-2 text-[10px] uppercase tracking-widest text-tech/70 font-bold font-sans">
         <span>بدء النظام</span>
         <span className="font-mono">v5.0.0-AR</span>
      </div>
      
      <div className="w-full bg-deep h-1 mb-8 overflow-hidden border border-primary/30 rounded-sm">
        <div className="bg-primary h-full animate-[width_2s_ease-in-out_infinite] shadow-[0_0_15px_#3B82F6]" style={{width: '60%'}}></div>
      </div>
      
      <div className="space-y-3 text-xs font-bold tracking-wider font-sans">
        <p className="flex items-center gap-3 text-tech/80">
            <ShieldCheck size={14} className="text-primary" /> 
            جاري تهيئة بروتوكولات الأمان...
        </p>
        <p className="flex items-center gap-3 text-tech/80">
            <Activity size={14} className="animate-pulse text-primary" /> 
            تأسيس الاتصال العصبي...
        </p>
        <p className="flex items-center gap-3 text-white animate-pulse">
            <Database size={14} /> 
            {status}
        </p>
      </div>
    </div>
    
    {/* Blue Glow Background */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
  </div>
);
