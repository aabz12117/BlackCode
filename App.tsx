import React, { useState, useEffect } from "react";
import { BootScreen } from "./components/BootScreen";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { fetchGoogleSheet, parseUser, parseTask, SHEET_IDS, logUserAction } from "./utils";
import { User, Task } from "./types";

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [bootStatus, setBootStatus] = useState("INITIATING HANDSHAKE...");

  const refreshData = async () => {
      const rawUsers = await fetchGoogleSheet(SHEET_IDS.USERS);
      const parsedUsers: User[] = rawUsers
        .map(parseUser)
        .filter((u): u is User => u !== null);
      setUsers(parsedUsers);

      const rawTasks = await fetchGoogleSheet(SHEET_IDS.TASKS);
      const parsedTasks: Task[] = rawTasks.map(parseTask);
      setTasks(parsedTasks);
      
      // If a user is logged in, refresh their specific object reference
      if (currentUser) {
          const updatedUser = parsedUsers.find(u => u.username === currentUser.username);
          if (updatedUser) setCurrentUser(updatedUser);
      }
  };

  useEffect(() => {
    const initSystem = async () => {
      // 1. Fetch Users
      setBootStatus("DECRYPTING PERSONNEL DATA...");
      const rawUsers = await fetchGoogleSheet(SHEET_IDS.USERS);
      const parsedUsers: User[] = rawUsers
        .map(parseUser)
        .filter((u): u is User => u !== null);

      setUsers(parsedUsers);

      // 2. Fetch Tasks
      setBootStatus("DOWNLOADING MISSION PARAMETERS...");
      const rawTasks = await fetchGoogleSheet(SHEET_IDS.TASKS);
      const parsedTasks: Task[] = rawTasks.map(parseTask);

      setTasks(parsedTasks);
      
      setBootStatus("SYSTEM ONLINE.");
      setTimeout(() => setLoading(false), 1200);
    };

    initSystem();
  }, []);

  const handleLogout = () => {
      if (currentUser) {
          logUserAction(currentUser, "LOGOUT", "User Session Ended");
      }
      setCurrentUser(null);
  };

  if (loading) {
    return <BootScreen status={bootStatus} />;
  }

  return (
    <div className="font-mono bg-black text-gray-200 min-h-screen selection:bg-green-900 selection:text-white">
      {currentUser ? (
        <Dashboard 
            user={currentUser} 
            tasks={tasks} 
            allUsers={users}
            onLogout={handleLogout} 
            onRefresh={refreshData}
        />
      ) : (
        <LoginScreen onLogin={setCurrentUser} users={users} />
      )}
    </div>
  );
};

export default App;
