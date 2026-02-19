import React, { useState } from "react";
import { Settings, Save, RefreshCw, Users, List, Edit2 } from "lucide-react";
import { User, Task, ALL_RANKS } from "../types";
import { adminUpdateUser, adminUpdateTask } from "../utils";

interface AdminPanelProps {
  users: User[];
  tasks: Task[];
  onRefresh: () => void;
}

export const AdminPanel = ({ users, tasks, onRefresh }: AdminPanelProps) => {
  const [tab, setTab] = useState<'users' | 'tasks'>('users');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Local state for edits
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const startEditUser = (user: User) => {
    setEditingId(user.rowId || 0);
    setEditForm({ ...user });
  };

  const startEditTask = (task: Task) => {
    setEditingId(task.rowId || 0);
    setEditForm({ ...task });
  };

  const handleSaveUser = async () => {
    setIsSaving(true);
    await adminUpdateUser(editForm);
    setIsSaving(false);
    setEditingId(null);
    onRefresh(); 
  };

  const handleSaveTask = async () => {
    setIsSaving(true);
    await adminUpdateTask(editForm);
    setIsSaving(false);
    setEditingId(null);
    onRefresh();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Settings className="text-alert" />
                لوحة الإدارة العليا
            </h2>
            <p className="text-dim text-sm">صلاحيات التعديل على السجلات والمهام.</p>
          </div>
          <button onClick={onRefresh} className="p-2 bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors">
              <RefreshCw size={20} className={isSaving ? "animate-spin" : ""} />
          </button>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
          <button 
            onClick={() => { setTab('users'); setEditingId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${tab === 'users' ? 'bg-primary text-black font-bold' : 'text-dim hover:text-white'}`}
          >
             <Users size={16} /> المستخدمين
          </button>
          <button 
            onClick={() => { setTab('tasks'); setEditingId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${tab === 'tasks' ? 'bg-primary text-black font-bold' : 'text-dim hover:text-white'}`}
          >
             <List size={16} /> المهام
          </button>
       </div>

       {/* Users Table */}
       {tab === 'users' && (
         <div className="bg-[#050505] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-right text-sm">
                <thead className="bg-white/5 text-dim uppercase font-bold text-[10px]">
                    <tr>
                        <th className="px-4 py-3">اسم المستخدم</th>
                        <th className="px-4 py-3">الرمز</th>
                        <th className="px-4 py-3">الاسم الحركي</th>
                        <th className="px-4 py-3">الاسم الحقيقي</th>
                        <th className="px-4 py-3">الرتبة</th>
                        <th className="px-4 py-3">الحالة</th>
                        <th className="px-4 py-3">النقاط</th>
                        <th className="px-4 py-3 w-64">المهام المنجزة</th>
                        <th className="px-4 py-3">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.map((u) => {
                        const isEditing = editingId === u.rowId;
                        return (
                           <tr key={u.rowId || u.username} className={isEditing ? 'bg-white/5' : ''}>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white" value={editForm.username || ""} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                                   ) : <span className="font-mono text-primary/80">{u.username}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-20 text-white" value={editForm.code || ""} onChange={e => setEditForm({...editForm, code: e.target.value})} />
                                   ) : <span className="blur-[3px] hover:blur-none transition-all font-mono">{u.code}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white" value={editForm.codeName || ""} onChange={e => setEditForm({...editForm, codeName: e.target.value})} />
                                   ) : u.codeName}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white" value={editForm.name || ""} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                                   ) : <span className="text-dim blur-[3px] hover:blur-none transition-all">{u.name}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <select className="bg-black border border-white/20 p-1 w-full text-white text-xs" value={editForm.rank || "متدرب"} onChange={e => setEditForm({...editForm, rank: e.target.value})}>
                                           {ALL_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                                       </select>
                                   ) : <span className="bg-white/5 px-2 py-0.5 rounded text-[10px]">{u.rank}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                    {isEditing ? (
                                       <select className="bg-black border border-white/20 p-1 w-full text-white text-xs" value={editForm.status || "active"} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                                           <option value="active">شغال</option>
                                           <option value="paused">موقف</option>
                                           <option value="banned">مبند</option>
                                       </select>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                                            u.status === 'active' ? 'text-success bg-success/10' : 
                                            u.status === 'banned' ? 'text-alert bg-alert/10' : 
                                            'text-yellow-500 bg-yellow-500/10'
                                        }`}>
                                            {u.status === 'active' ? 'شغال' : u.status === 'banned' ? 'مبند' : 'موقف'}
                                        </span>
                                    )}
                               </td>
                               <td className="px-4 py-3 font-mono text-primary align-top">
                                   {isEditing ? (
                                       <input type="number" className="bg-black border border-white/20 p-1 w-20 text-white" value={editForm.points || 0} onChange={e => setEditForm({...editForm, points: parseInt(e.target.value)})} />
                                   ) : u.points}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <textarea 
                                          className="bg-black border border-white/20 p-1 w-full text-white text-xs h-16 font-mono" 
                                          value={editForm.completedTasks ? editForm.completedTasks.join(',') : ''} 
                                          onChange={e => setEditForm({...editForm, completedTasks: e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')})} 
                                          placeholder="Task1, Task2..."
                                       />
                                   ) : (
                                       <div className="max-w-[200px] text-[10px] text-dim break-words leading-tight" title={u.completedTasks.join(', ')}>
                                           {u.completedTasks.length > 0 ? u.completedTasks.join(', ') : '-'}
                                       </div>
                                   )}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <button onClick={handleSaveUser} disabled={isSaving} className="text-success hover:bg-success/10 p-1 rounded">
                                           <Save size={16} />
                                       </button>
                                   ) : (
                                       <button onClick={() => startEditUser(u)} className="text-dim hover:text-white hover:bg-white/10 p-1 rounded">
                                           <Edit2 size={16} />
                                       </button>
                                   )}
                               </td>
                           </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
       )}

       {/* Tasks Table */}
       {tab === 'tasks' && (
         <div className="bg-[#050505] border border-white/10 rounded-xl overflow-x-auto">
            <table className="w-full text-right text-sm">
                <thead className="bg-white/5 text-dim uppercase font-bold text-[10px]">
                    <tr>
                        <th className="px-4 py-3 whitespace-nowrap">اسم المهمة</th>
                        <th className="px-4 py-3 whitespace-nowrap w-64">الوصف</th>
                        <th className="px-4 py-3 whitespace-nowrap">الرابط</th>
                        <th className="px-4 py-3 whitespace-nowrap">الحل</th>
                        <th className="px-4 py-3 whitespace-nowrap">الحالة</th>
                        <th className="px-4 py-3 whitespace-nowrap">النقاط</th>
                        <th className="px-4 py-3 whitespace-nowrap">كم فوز</th>
                        <th className="px-4 py-3 whitespace-nowrap">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {tasks.map((t) => {
                        const isEditing = editingId === t.rowId;
                        return (
                           <tr key={t.rowId || t.taskName} className={isEditing ? 'bg-white/5' : ''}>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white min-w-[120px]" value={editForm.taskName || ""} onChange={e => setEditForm({...editForm, taskName: e.target.value})} />
                                   ) : <span className="whitespace-nowrap">{t.taskName}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <textarea className="bg-black border border-white/20 p-1 w-full text-white h-20 text-xs" value={editForm.description || ""} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                                   ) : <p className="text-xs text-dim line-clamp-2 min-w-[200px]">{t.description}</p>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white text-xs" dir="ltr" value={editForm.link || ""} onChange={e => setEditForm({...editForm, link: e.target.value})} />
                                   ) : <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline block max-w-[150px] truncate" dir="ltr">{t.link}</a>}
                               </td>
                               <td className="px-4 py-3 font-mono text-xs align-top">
                                   {isEditing ? (
                                       <input className="bg-black border border-white/20 p-1 w-full text-white min-w-[100px]" value={editForm.solution || ""} onChange={e => setEditForm({...editForm, solution: e.target.value})} />
                                   ) : <span className="blur-[4px] hover:blur-none transition-all cursor-help">{t.solution}</span>}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <select className="bg-black border border-white/20 p-1 w-full text-white text-xs min-w-[80px]" value={editForm.status === 'active' ? 'تعمل' : editForm.status === 'paused' ? 'موقفه' : 'منتهيه'} onChange={e => setEditForm({...editForm, status: e.target.value === 'تعمل' ? 'active' : 'paused'})}> 
                                           <option value="تعمل">تعمل</option>
                                           <option value="موقفه">موقفه</option>
                                           <option value="منتهيه">منتهيه</option>
                                       </select>
                                   ) : <span className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap ${t.status === 'active' ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>{t.status}</span>}
                               </td>
                               <td className="px-4 py-3 font-mono text-primary align-top">
                                   {isEditing ? (
                                       <input type="number" className="bg-black border border-white/20 p-1 w-16 text-white" value={editForm.points || 0} onChange={e => setEditForm({...editForm, points: parseInt(e.target.value)})} />
                                   ) : t.points}
                               </td>
                               <td className="px-4 py-3 font-mono text-white align-top">
                                   {isEditing ? (
                                       <input type="number" className="bg-black border border-white/20 p-1 w-16 text-white" value={editForm.maxWinners || 1000} onChange={e => setEditForm({...editForm, maxWinners: parseInt(e.target.value)})} />
                                   ) : t.maxWinners}
                               </td>
                               <td className="px-4 py-3 align-top">
                                   {isEditing ? (
                                       <button onClick={handleSaveTask} disabled={isSaving} className="text-success hover:bg-success/10 p-1 rounded">
                                           <Save size={16} />
                                       </button>
                                   ) : (
                                       <button onClick={() => startEditTask(t)} className="text-dim hover:text-white hover:bg-white/10 p-1 rounded">
                                           <Edit2 size={16} />
                                       </button>
                                   )}
                               </td>
                           </tr>
                        );
                    })}
                </tbody>
            </table>
         </div>
       )}
    </div>
  );
};