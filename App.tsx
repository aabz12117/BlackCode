import React, { useState, useEffect, useCallback, useRef } from "react";
import { BootScreen } from "./components/BootScreen";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { Toast } from "./components/Toast";
import { fetchGoogleSheet, parseUser, parseTask, SHEET_IDS, logUserAction } from "./utils";
import { User, Task, ADMIN_RANKS } from "./types";

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [bootStatus, setBootStatus] = useState("INITIATING HANDSHAKE...");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for tracking changes
  const isFetchingRef = useRef(false);
  const prevTasksRef = useRef<Task[]>([]);
  const prevUsersRef = useRef<User[]>([]);

  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const rawUsers = await fetchGoogleSheet(SHEET_IDS.USERS);
      const parsedUsers: User[] = rawUsers
        .map(parseUser)
        .filter((u): u is User => u !== null);

      // Optimize: Only update if changed
      setUsers(prev => {
        // Safety: If we have data and fetch returns empty, likely an error. Keep old data.
        if (prev.length > 0 && parsedUsers.length === 0) return prev;

        if (JSON.stringify(prev) !== JSON.stringify(parsedUsers)) {
          return parsedUsers;
        }
        return prev;
      });

      const rawTasks = await fetchGoogleSheet(SHEET_IDS.TASKS);
      const parsedTasks: Task[] = rawTasks.map(parseTask);

      // Optimize: Only update if changed
      setTasks(prev => {
        // Safety: If we have data and fetch returns empty, likely an error. Keep old data.
        if (prev.length > 0 && parsedTasks.length === 0) return prev;

        if (JSON.stringify(prev) !== JSON.stringify(parsedTasks)) {
          return parsedTasks;
        }
        return prev;
      });

      // Update current user reference if logged in
      if (currentUser) {
        const updatedUser = parsedUsers.find(u => u.username === currentUser.username);
        if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedUser);
        }
      }
    } catch (error) {
      console.error("Auto-refresh failed", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    setConnectionError(false);
    const initSystem = async () => {
      try {
        // 1. Fetch Users
        setBootStatus("DECRYPTING PERSONNEL DATA...");
        const rawUsers = await fetchGoogleSheet(SHEET_IDS.USERS);
        const parsedUsers: User[] = rawUsers
          .map(parseUser)
          .filter((u): u is User => u !== null);

        setUsers(parsedUsers);
        prevUsersRef.current = parsedUsers;

        // 2. Fetch Tasks
        setBootStatus("DOWNLOADING MISSION PARAMETERS...");
        const rawTasks = await fetchGoogleSheet(SHEET_IDS.TASKS);
        const parsedTasks: Task[] = rawTasks.map(parseTask);

        setTasks(parsedTasks);
        prevTasksRef.current = parsedTasks;

        if (parsedUsers.length === 0) {
          console.error("No users loaded — Google Sheet may be private or unreachable");
          setConnectionError(true);
        }

        setBootStatus(parsedUsers.length > 0 ? "SYSTEM ONLINE." : "CONNECTION FAILED — SHEET UNREACHABLE");
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error("initSystem failed:", error);
        setBootStatus("CONNECTION ERROR — RETRYING...");
        setConnectionError(true);
        setTimeout(() => setLoading(false), 1500);
      }
    };

    // Safety timeout: if initSystem hangs for 15s, force-show the app
    const safetyTimer = setTimeout(() => {
      setBootStatus("TIMEOUT — PROCEEDING OFFLINE...");
      setLoading(false);
    }, 15000);

    initSystem().finally(() => clearTimeout(safetyTimer));
  }, [retryCount]);

  // Polling Effect
  useEffect(() => {
    if (loading) return;

    const intervalId = setInterval(() => {
      if (!document.hidden) {
        refreshData();
      }
    }, 2000); // Poll every 2 seconds for "immediate" updates

    return () => clearInterval(intervalId);
  }, [loading, refreshData]);

  // Toast Notifications for Changes
  useEffect(() => {
    if (loading) return;

    // Check for new tasks
    const activeTasks = tasks.filter(t => t.isVisible);
    const prevActiveTasks = prevTasksRef.current.filter(t => t.isVisible);

    if (prevActiveTasks.length > 0 && activeTasks.length > prevActiveTasks.length) {
      setToastMessage("تم رصد مهمة جديدة في النظام!");
    }
    prevTasksRef.current = tasks;
  }, [tasks, loading]);

  useEffect(() => {
    if (loading) return;

    // Check for leaderboard changes (Top 1 change)
    const sortedUsers = [...users]
      .filter(u => !ADMIN_RANKS.includes(u.rank))
      .sort((a, b) => b.points - a.points);

    const prevSortedUsers = [...prevUsersRef.current]
      .filter(u => !ADMIN_RANKS.includes(u.rank))
      .sort((a, b) => b.points - a.points);

    if (prevSortedUsers.length > 0 && sortedUsers.length > 0) {
      const topUser = sortedUsers[0];
      const prevTopUser = prevSortedUsers[0];

      if (topUser.username !== prevTopUser?.username) {
        setToastMessage(`تنبيه: ${topUser.codeName} يتصدر القائمة الآن!`);
      }
    }
    prevUsersRef.current = users;
  }, [users, loading]);


  const handleLogout = () => {
    if (currentUser) {
      logUserAction(currentUser, "LOGOUT", "User Session Ended");
    }
    setIsLoggingOut(true);
    setTimeout(() => {
      setCurrentUser(null);
      setIsLoggingOut(false);
    }, 1500);
  };

  const updateLocalUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.username === updatedUser.username ? updatedUser : u));
    if (currentUser && currentUser.username === updatedUser.username) {
      setCurrentUser(updatedUser);
    }
  };

  const updateLocalTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.taskName === updatedTask.taskName ? updatedTask : t));
  };

  if (loading) {
    return <BootScreen status={bootStatus} />;
  }

  if (connectionError && users.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono" dir="rtl">
        <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-red-500 mb-3">⚠ فشل الاتصال بقاعدة البيانات</h2>
        <p className="text-gray-400 text-sm text-center mb-6 max-w-sm">
          تعذّر الوصول إلى Google Sheets. تأكد أن الجداول مشاركة للعموم (Anyone with the link → Viewer).
        </p>
        <button
          onClick={() => setRetryCount(c => c + 1)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">جاري قطع الاتصال الآمن</h2>
        <p className="text-red-500 font-mono text-xs animate-pulse">مسح الذاكرة المؤقتة...</p>
      </div>
    );
  }

  return (
    <div className="font-mono bg-black text-gray-200 min-h-screen selection:bg-green-900 selection:text-white relative">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}

      {currentUser ? (
        <Dashboard
          user={currentUser}
          tasks={tasks}
          allUsers={users}
          onLogout={handleLogout}
          onRefresh={refreshData}
          onUpdateUser={updateLocalUser}
          onUpdateTask={updateLocalTask}
        />
      ) : (
        <LoginScreen onLogin={setCurrentUser} users={users} />
      )}
    </div>
  );
};

export default App;
