import React, { useEffect, useRef, useState } from "react";
import { X, Scan, Zap, Target, Smartphone, Image as ImageIcon, Upload } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  title?: string;
}

export const QRScanner = ({ onScan, onClose, title = "SYSTEM SCANNING" }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<number>(0);
  const scannedRef = useRef<boolean>(false); // Prevent double scans
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    scannedRef.current = false;

    const startScan = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.error("Play error:", e));
                setLoading(false);
                requestRef.current = requestAnimationFrame(tick);
            }
          };
        }
      } catch (err) {
        console.error(err);
        setError("تعذر الوصول للكاميرا");
        setLoading(false);
      }
    };

    startScan();

    return () => {
      if (stream) {
          stream.getTracks().forEach(t => t.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const tick = () => {
    if (scannedRef.current) return; // Stop processing if already scanned

    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

        if (code && code.data && code.data.trim() !== "") {
           scannedRef.current = true; // Lock scanning
           if (navigator.vibrate) navigator.vibrate(200);
           onScan(code.data);
           return; 
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize canvas to match image
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                
                if (code && code.data && code.data.trim() !== "") {
                     scannedRef.current = true;
                     if (navigator.vibrate) navigator.vibrate(200);
                     onScan(code.data);
                } else {
                     setError("لم يتم العثور على رمز QR صالح في الصورة");
                     setTimeout(() => setError(""), 3000);
                }
            } catch (err) {
                console.error(err);
                setError("فشل في معالجة ملف الصورة");
                setTimeout(() => setError(""), 3000);
            }
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset value to allow selecting same file again if needed
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300 font-sans" dir="ltr">
        {/* Full Screen Video Background */}
        <div className="absolute inset-0 overflow-hidden bg-black">
            <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover opacity-60" 
                muted 
                playsInline
            />
            {/* Tech Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-10"></div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
        />

        {/* UI Layer */}
        <div className="relative z-20 flex flex-col h-full safe-area-inset">
            {/* Header */}
            <div className="flex justify-between items-center p-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                    <span className="font-mono text-xs tracking-[0.2em] font-bold text-white/80">REC • LIVE</span>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-500 transition-all backdrop-blur-md"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Main Scanner Area */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                {error ? (
                    <div className="bg-black/80 border border-alert/50 text-alert p-8 rounded-2xl text-center max-w-xs backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in duration-200">
                        <Smartphone size={40} className="mx-auto mb-4 opacity-80" />
                        <p className="font-bold mb-2 text-lg">System Error</p>
                        <p className="text-xs opacity-70 font-mono">{error}</p>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[280px] aspect-square group">
                        
                        {/* Scanning Laser */}
                        <div className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(59,130,246,1)] z-30 animate-[scan_2.5s_ease-in-out_infinite]"></div>
                        
                        {/* Corner Brackets - Animated */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-primary rounded-tl-xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                        <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-primary rounded-tr-xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-primary rounded-bl-xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-primary rounded-br-xl shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>

                        {/* Center Target */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 scale-75">
                            <Target size={64} className="text-white animate-pulse" strokeWidth={1} />
                        </div>

                        {/* Text Overlay */}
                        <div className="absolute -top-10 left-0 right-0 text-center">
                             <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-mono tracking-widest font-bold backdrop-blur-md">
                                {title}
                             </div>
                        </div>
                        
                        {/* Side Data */}
                        <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex flex-col gap-1">
                             {[...Array(5)].map((_, i) => (
                                 <div key={i} className="w-1 h-8 bg-white/10 rounded-full"></div>
                             ))}
                        </div>
                         <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex flex-col gap-1">
                             {[...Array(5)].map((_, i) => (
                                 <div key={i} className="w-1 h-8 bg-white/10 rounded-full"></div>
                             ))}
                        </div>

                    </div>
                )}
            </div>

            {/* Footer / Instructions */}
            <div className="p-8 pb-12 w-full max-w-md mx-auto">
                <div className="flex flex-col gap-4">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 animate-pulse mb-4">
                            <Scan size={18} className="text-primary" />
                            <span className="text-xs text-primary/60 font-bold font-mono tracking-widest uppercase">Align Code Within Frame</span>
                        </div>
                    </div>
                    
                    {/* Image Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-white rounded-lg transition-all group backdrop-blur-md"
                    >
                        <ImageIcon size={18} className="text-dim group-hover:text-primary transition-colors" />
                        <span className="text-xs font-bold tracking-wider">اختيار صورة من المعرض</span>
                        <Upload size={14} className="text-dim opacity-50" />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};