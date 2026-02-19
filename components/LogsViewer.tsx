import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, Filter, Search, ShieldAlert, Clock, User, Activity } from "lucide-react";
import { fetchGoogleSheet, SHEET_IDS } from "../utils";

export const LogsViewer = () => {
  const [logs, setLogs] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchGoogleSheet(SHEET_IDS.LOGS);
    setLogs(data.reverse()); // Newest first
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
      // Search in all values of the log object, not just a specific column name
      // This makes it robust if the Google Sheet header name changes (e.g., 'LOGS' vs 'logData' vs 'Data')
      const rowString = Object.values(log).join(" ").toLowerCase();
      return rowString.includes(filter.toLowerCase());
  });

  const getLogColor = (text: string) => {
      if (text.includes("LOGIN_FAIL") || text.includes("BANNED")) return "text-red-500 border-red-500/30 bg-red-500/5";
      if (text.includes("SOLVED_TASK")) return "text-green-400 border-green-500/30 bg-green-500/5";
      if (text.includes("ADMIN_UPDATE")) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/5";
      if (text.includes("LOGIN_SUCCESS")) return "text-blue-400 border-blue-500/30 bg-blue-500/5";
      return "text-dim border-white/5 bg-white/5";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <ShieldAlert className="text-alert" />
                سجل النظام المركزي
            </h2>
            <p className="text-dim text-sm font-mono">مراقبة حية لجميع الأنشطة والعمليات.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <input 
                    type="text" 
                    placeholder="بحث في السجلات..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-2 pl-10 text-xs text-white focus:border-primary outline-none"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
             </div>
             <button 
                onClick={loadLogs} 
                disabled={loading}
                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all"
             >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
             </button>
        </div>
      </div>

      <div className="bg-[#050505] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Header Bar */}
          <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-[10px] font-mono text-dim opacity-50">/var/log/syslog/darkcode</div>
          </div>

          {/* Console Output */}
          <div className="h-[600px] overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar bg-black relative">
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>

              {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-primary gap-4">
                      <Terminal size={48} className="animate-pulse" />
                      <p className="tracking-widest">جاري استدعاء البيانات المشفرة...</p>
                  </div>
              ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-20 text-dim">
                      <p>لا توجد سجلات مطابقة.</p>
                  </div>
              ) : (
                  filteredLogs.map((log, idx) => {
                      // Attempt to find the main log column. 
                      // Common headers based on utils.ts might be "LOGS", "logData", "Data", etc.
                      // We prefer 'logData' or 'LOGS', otherwise take the longest string value that looks like a log.
                      let logContent = log['logData'] || log['LOGS'] || log['Data'] || "";
                      
                      // If specific column not found, fallback to first long value
                      if (!logContent) {
                          const values = Object.values(log);
                          logContent = values.find(v => v.length > 20) || values[0] || "";
                      }

                      const timestamp = log['طابع زمني'] || log['Timestamp'] || "UNKNOWN";
                      const colorClass = getLogColor(logContent);
                      
                      // Try to extract parts if formatted with ||
                      const parts = logContent.split('||').map(s => s.trim());
                      
                      return (
                          <div key={idx} className={`border-l-2 p-3 mb-2 rounded-r-lg transition-all hover:bg-white/10 ${colorClass}`}>
                              <div className="flex items-center gap-2 mb-2 opacity-70 border-b border-white/5 pb-1">
                                  <Clock size={10} />
                                  <span className="text-[10px]">{timestamp}</span>
                              </div>
                              
                              <div className="space-y-1">
                                  {parts.map((part, pIdx) => {
                                      if (part.startsWith("[ACTOR]:") || part.startsWith("[USER]:")) {
                                          return <div key={pIdx} className="font-bold flex items-center gap-2"><User size={12}/> {part.replace(/\[.*?\]:/, "").trim()}</div>
                                      }
                                      if (part.startsWith("[ACTION]:")) {
                                          return <div key={pIdx} className="font-bold flex items-center gap-2"><Activity size={12}/> {part.replace("[ACTION]:", "").trim()}</div>
                                      }
                                      return <div key={pIdx} className="pl-5 opacity-80 break-words">{part.replace(/\[.*?\]:/, "").trim()}</div>
                                  })}
                                  {parts.length <= 1 && <div className="break-words">{logContent}</div>}
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};