import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Entry from "@/pages/entry";
import Missions from "@/pages/missions";
import Leaderboard from "@/pages/leaderboard";
import Admin from "@/pages/admin"; // We'll create this next
import MissionGame from "@/pages/mission-game"; // We'll create this next
import { useStore } from "@/lib/store";
import { useEffect } from "react";

function Router() {
  const { user } = useStore();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect logic: if not logged in and not on entry page, go to entry
    // If logged in and on entry page, go to missions
    if (!user && location !== "/") {
      setLocation("/");
    } else if (user && location === "/") {
      setLocation("/missions");
    }
  }, [user, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Entry} />
      
      {/* Protected Routes Wrapper */}
      {user && (
        <Layout>
          <Switch>
            <Route path="/missions" component={Missions} />
            <Route path="/mission/:id" component={MissionGame} />
            <Route path="/leaderboard" component={Leaderboard} />
            <Route path="/admin" component={Admin} />
            <Route path="/profile">
               {/* Simple Profile Placeholder */}
               <div className="p-8 text-center text-muted-foreground font-mono">
                 جاري بناء صفحة الملف الشخصي...
               </div>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )}
      
      {/* Fallback for unauthenticated access to other routes (although effect handles this) */}
      {!user && <Route component={Entry} />}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
