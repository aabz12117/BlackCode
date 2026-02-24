import React, { useEffect } from "react";
import { Bell } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-primary/10 backdrop-blur-md border border-primary/30 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-3">
        <Bell className="text-primary animate-pulse" size={18} />
        <span className="font-bold text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};
