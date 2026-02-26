import React, { useState } from "react";
import { CheckCircle, ExternalLink, Lock, Unlock, XCircle, Terminal, Award, Users, QrCode, Star, Circle } from "lucide-react";
import { Task, AccountStatus } from "../types";
import { QRScanner } from "./QRScanner";

interface TaskCardProps {
    task: Task;
    onSolve: (points: number) => void;
    isAlreadySolved: boolean;
    currentWinners: number;
    userStatus?: AccountStatus;
}

export const TaskCard = ({ task, onSolve, isAlreadySolved, currentWinners, userStatus }: TaskCardProps) => {
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<'idle' | 'success' | 'fail' | 'loading'>('idle');
    const [showScanner, setShowScanner] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine actual status based on logic
    // If maxWinners is 0, it means UNLIMITED allowed winners.
    const isFull = task.maxWinners === 0 ? false : currentWinners >= task.maxWinners;

    // If user is paused, they can solve even if finished/full
    const isFinished = userStatus === 'paused' ? false : (isFull || task.status === 'finished');

    // If already solved, show solved state initially, UNLESS paused (paused users can re-solve)
    const [solvedState, setSolvedState] = useState(userStatus === 'paused' ? false : isAlreadySolved);

    const performSolve = async (solutionAttempt: string) => {
        const attempt = solutionAttempt.trim();
        const solution = task.solution.trim();
        // Case-insensitive comparison + normalize whitespace
        const normalize = (s: string) => s.replace(/\s+/g, ' ').toLowerCase();
        const isMatch = normalize(attempt) === normalize(solution);
        console.log(`[QR Debug] attempt="${attempt}" solution="${solution}" match=${isMatch}`);
        if (isMatch) {
            setStatus('loading');
            // Only submit if NOT paused (paused users don't get points/record)
            if (userStatus !== 'paused') {
                await onSolve(task.points);
            } else {
                // Simulate success for paused user
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setStatus('success');

            // Paused users don't get permanent solved state, just temporary success feedback
            if (userStatus !== 'paused') {
                setSolvedState(true);
            } else {
                setTimeout(() => {
                    setStatus('idle');
                    setInput("");
                }, 3000);
            }
        } else {
            setStatus('fail');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        // Paused users can solve even if "already solved" (which we force to false above)
        if (!input.trim() || status === 'loading' || isFinished || (userStatus !== 'paused' && isAlreadySolved)) return;
        performSolve(input);
    };

    const handleScan = (data: string) => {
        setShowScanner(false);
        setInput(data);
        performSolve(data);
    };

    return (
        <>
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                    title={`TASK: ${task.taskName}`}
                />
            )}

            <div className={`
      relative overflow-hidden rounded-xl border transition-all duration-300
      ${solvedState
                    ? 'bg-gradient-to-br from-success/5 to-black border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]'
                    : isFinished
                        ? 'bg-[#050505] border-red-900/50 opacity-80'
                        : task.category === 'main'
                            ? 'bg-[#0a0a0a] border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                            : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
                }
    `}>
                {/* Background Tech Lines */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                {/* Main Content Container */}
                <div className="relative z-10 p-5">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {/* Category Badge */}
                                {task.category === 'main' ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-black flex items-center gap-1">
                                        <Star size={10} fill="black" /> أساسية
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-dim flex items-center gap-1">
                                        <Circle size={8} /> جانبية
                                    </span>
                                )}

                                {solvedState ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success text-black flex items-center gap-1">
                                        <CheckCircle size={10} /> مكتملة
                                    </span>
                                ) : isFinished ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500 flex items-center gap-1">
                                        <Lock size={10} /> مغلقة
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary flex items-center gap-1 animate-pulse">
                                        <Terminal size={10} /> نشطة
                                    </span>
                                )}
                                <span className="text-[10px] text-dim font-mono">{task.timestamp.split(' ')[0]}</span>
                            </div>
                            <h3 className={`text-lg font-bold font-sans leading-tight ${solvedState ? 'text-success' : 'text-white'}`}>
                                {task.taskName}
                            </h3>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 ml-3">
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${solvedState ? 'bg-success/10 border-success/20 text-success' : 'bg-white/5 border-white/10 text-primary'}`}>
                                <Award size={12} />
                                <span className="text-xs font-bold font-mono">{task.points}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-dim font-mono">
                                <Users size={10} />
                                <span>{currentWinners}/{task.maxWinners === 0 ? "∞" : task.maxWinners}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className={`text-sm text-dim/80 font-normal leading-relaxed mb-6 transition-all ${isExpanded ? '' : 'line-clamp-2'}`} onClick={() => setIsExpanded(!isExpanded)}>
                        {task.description}
                    </div>

                    {/* Action Area - Mobile Optimized */}
                    <div className="space-y-3">
                        {/* File Link Button */}
                        <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all group"
                        >
                            <ExternalLink size={14} className="group-hover:text-primary transition-colors" />
                            <span>عرض ملف المهمة</span>
                        </a>

                        {/* Solve Area */}
                        {(!solvedState || userStatus === 'paused') && !isFinished && status !== 'success' && (
                            <div className="relative">
                                <form onSubmit={handleVerify} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            disabled={status === 'loading'}
                                            className={`
                                      w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 pl-10 text-white text-sm font-mono placeholder-dim/40 outline-none
                                      focus:border-primary focus:bg-black transition-all
                                      ${status === 'fail' ? 'border-alert text-alert' : ''}
                                  `}
                                            placeholder="أدخل شفرة الحل..."
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dim/30">
                                            <Lock size={14} />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 hover:border-primary/50 rounded-lg w-12 flex items-center justify-center text-white transition-colors"
                                    >
                                        <QrCode size={18} />
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className={`
                                px-4 rounded-lg font-bold text-xs transition-all shadow-lg
                                ${status === 'loading' ? 'bg-dim text-black' :
                                                status === 'fail' ? 'bg-alert text-white' :
                                                    'bg-primary text-black hover:bg-blue-400'}
                            `}
                                    >
                                        {status === 'loading' ? '...' : status === 'fail' ? <XCircle size={18} /> : 'إرسال'}
                                    </button>
                                </form>
                                {status === 'fail' && (
                                    <div className="absolute -bottom-5 right-0 text-[10px] text-alert font-bold animate-pulse">
                                        * الشفرة غير صحيحة
                                    </div>
                                )}
                            </div>
                        )}

                        {solvedState && userStatus !== 'paused' && (
                            <div className="w-full py-2 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center gap-2 text-success text-xs font-bold">
                                <Unlock size={14} />
                                <span>تمت العملية بنجاح</span>
                            </div>
                        )}

                        {status === 'success' && userStatus === 'paused' && (
                            <div className="w-full py-2 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center gap-2 text-success text-xs font-bold animate-pulse">
                                <Unlock size={14} />
                                <span>تمت العملية بنجاح (وضع التدريب)</span>
                            </div>
                        )}

                        {isFinished && !solvedState && userStatus !== 'paused' && (
                            <div className="w-full py-2 bg-red-900/20 border border-red-500/20 rounded-lg flex items-center justify-center gap-2 text-red-400 text-xs font-bold">
                                <Lock size={14} />
                                <span>العملية مغلقة</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};