import { User, Task, TaskStatus, ADMIN_RANKS, AccountStatus } from "./types";

export const SHEET_IDS = {
  USERS: "1sEk4j9_3pscX28BQsEtirWphAFLtQ3A7HcKiYPyLbwA",
  TASKS: "1u8riDUGmK4tW-h1zRLN6lXUQ5Iyvzb1rSMeO1yzr0Ew",
  LOGS: "1VgKLhfFtgy8wae3kVt6-qxcUGzhQCIbZWyg3mlNU05s"
};

export const API_URL = "https://script.google.com/macros/s/AKfycbzupojyNcYkjoU8TrQQ7IpWbHxdGbgkjV2a_lMklrHYbOY6CT7mhxgS_FC2AKvOEzZc/exec"; 

const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map((line, idx) => {
    const row: Record<string, string> = {};
    let currentVal = '';
    let inQuotes = false;
    let colIndex = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        if (colIndex < headers.length) {
            row[headers[colIndex]] = currentVal.trim().replace(/^"|"$/g, '');
        }
        colIndex++;
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (colIndex < headers.length) {
       row[headers[colIndex]] = currentVal.trim().replace(/^"|"$/g, '');
    }
    row['_rowIndex'] = (idx + 2).toString(); 
    return row;
  });
};

export const fetchGoogleSheet = async (sheetId: string): Promise<Record<string, string>[]> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&cache=${new Date().getTime()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error("Failed to fetch sheet:", error);
    return [];
  }
};

export const parseUser = (r: Record<string, string>): User | null => {
  const username = r["Username"] || "";
  const code = r["code"] || "";
  if (!username || !code) return null;

  const rank = r["Rank"] || "متدرب";
  const points = parseInt(r["points"] || "0", 10);
  const isAdmin = ADMIN_RANKS.includes(rank.trim());

  // Parse Account Status
  const rawStatus = (r["حالة الحساب"] || "شغال").trim();
  let status: AccountStatus = 'active';
  if (rawStatus === 'موقف') status = 'paused';
  if (rawStatus === 'مبند') status = 'banned';

  // Parse Completed Tasks (comma separated)
  const completedTasksRaw = r["المهام المنجزه"] || "";
  const completedTasks = completedTasksRaw.split(',').map(t => t.trim()).filter(t => t !== "");

  return {
    timestamp: r["طابع زمني"] || r["Timestamp"] || "",
    name: r["Name"] || "",
    codeName: r["CodeName"] || "",
    username,
    code,
    points: isNaN(points) ? 0 : points,
    rank,
    completedTasks,
    status,
    isAdmin,
    rowId: parseInt(r['_rowIndex'] || "0")
  };
};

export const parseTask = (r: Record<string, string>): Task => {
  const rawStatus = (r["هل المهمه تعمل"] || r["Active"] || "").trim();
  let status: TaskStatus = 'unknown';
  let isVisible = false;

  if (rawStatus === 'تعمل' || rawStatus.toLowerCase() === 'true' || rawStatus === 'TRUE') {
    status = 'active';
    isVisible = true;
  } else if (rawStatus === 'موقفه') {
    status = 'paused';
    isVisible = false;
  } else if (rawStatus === 'منتهيه') {
    status = 'finished';
    isVisible = false;
  }

  const points = parseInt(r["points"] || "0", 10);
  const maxWinners = parseInt(r["كم فوز"] || "1000", 10); // Default to high number if empty

  return {
    timestamp: r["طابع زمني"] || r["Timestamp"] || "",
    taskName: r["اسم المهمه"] || r["اسم المهمة"] || "",
    description: r["وصف المهمه"] || r["وصف المهمة"] || "",
    link: r["رابط مهمه"] || r["رابط مهمة"] || "#",
    solution: r["حل المهمه"] || r["حل المهمة"] || "",
    status,
    isVisible,
    points: isNaN(points) ? 0 : points,
    maxWinners: isNaN(maxWinners) ? 1000 : maxWinners,
    rowId: parseInt(r['_rowIndex'] || "0")
  };
};

// Helper to count how many users solved a task
export const getTaskWinnerCount = (taskName: string, allUsers: User[]): number => {
    return allUsers.filter(u => u.completedTasks.includes(taskName)).length;
};

// --- LOGGING SYSTEM ---

const getCoordinates = (): Promise<string> => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve("Geo Not Supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve(`${position.coords.latitude},${position.coords.longitude} (Acc: ${Math.round(position.coords.accuracy)}m)`);
            },
            (error) => {
                resolve(`Geo Error: ${error.message}`);
            },
            { timeout: 5000, maximumAge: 0 }
        );
    });
};

const getBatteryInfo = async (): Promise<string> => {
    try {
        // @ts-ignore
        if (navigator.getBattery) {
            // @ts-ignore
            const battery = await navigator.getBattery();
            return `Level: ${Math.round(battery.level * 100)}% | Charging: ${battery.charging}`;
        }
    } catch (e) { return "Battery API N/A"; }
    return "Battery API N/A";
};

export const logUserAction = async (
    user: User | null, 
    action: string, 
    extraDetails: string = "", 
    credentialsAttempt?: { user: string, code: string }
) => {
    try {
        // 1. Collect Basic Device Info
        const ua = navigator.userAgent;
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const lang = navigator.language;
        const platform = navigator.platform;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const cores = navigator.hardwareConcurrency || "Unknown";
        // @ts-ignore
        const ram = navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "Unknown";
        
        let connectionInfo = "Unknown";
        // @ts-ignore
        if (navigator.connection) {
             // @ts-ignore
            connectionInfo = `${navigator.connection.effectiveType} (DL: ${navigator.connection.downlink}Mb/s, RTT: ${navigator.connection.rtt}ms)`;
        }

        // 2. Async Info (Battery & Geo)
        // We only try Geo if it's a Critical Action to avoid spamming prompts, or if we assume permission is granted.
        // For security logs, we always try.
        const [geo, battery] = await Promise.all([
            getCoordinates(),
            getBatteryInfo()
        ]);

        const username = user ? user.username : "GUEST";
        const realName = user ? (user.name || "N/A") : "N/A";
        const codeName = user ? user.codeName : "N/A";
        
        let credentialLog = "";
        if (credentialsAttempt) {
            credentialLog = ` || [ATTEMPTED_CREDS]: User="${credentialsAttempt.user}" | Pass="${credentialsAttempt.code}"`;
        }

        const logMessage = `
[ACTOR]: ${username} | ${codeName} (${realName})
[ACTION]: ${action}
[DETAILS]: ${extraDetails}${credentialLog}
[LOC]: ${geo} | TZ: ${timeZone}
[DEVICE]: OS: ${platform} | CPU: ${cores} Cores | RAM: ${ram} | Res: ${screenRes}
[STATUS]: Bat: ${battery} | Net: ${connectionInfo} | Lang: ${lang}
[AGENT]: ${ua}
`.trim().replace(/\n/g, " || ");

        // Send to API
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify({
                action: "LOG_ACTION",
                logData: logMessage,
                timestamp: new Date().toISOString()
            })
        });

    } catch (e) {
        console.error("Logging failed", e);
    }
};

// --- API Actions ---

export const submitTaskSolution = async (user: User, taskName: string, taskPoints: number) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "SOLVE_TASK",
        username: user.username,
        taskName: taskName,
        points: taskPoints
      })
    });
    // Log the success
    logUserAction(user, "SOLVED_TASK", `Task: ${taskName}, Points: ${taskPoints}`);
    return await response.json();
  } catch (e) {
    console.error(e);
    return { success: false };
  }
};

export const adminUpdateUser = async (updatedUser: User) => {
   try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "UPDATE_USER",
        data: updatedUser
      })
    });
    return await response.json();
   } catch(e) { return { success: false }; }
};

export const adminUpdateTask = async (updatedTask: Task) => {
  try {
   const response = await fetch(API_URL, {
     method: "POST",
     body: JSON.stringify({
       action: "UPDATE_TASK",
       data: updatedTask
     })
   });
   return await response.json();
  } catch(e) { return { success: false }; }
};
