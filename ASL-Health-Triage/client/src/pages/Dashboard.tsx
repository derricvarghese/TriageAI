import { useTriageSessions } from "@/hooks/use-triage-sessions";
import type { TriageSession } from "@shared/schema";
import { Navbar } from "@/components/layout/Navbar";
import { format } from "date-fns";
import { Activity, Clock, AlertTriangle, ChevronRight, UserPlus, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { NightScene } from "@/components/NightScene";

export default function Dashboard() {
  const { data: sessionsData, isLoading, error } = useTriageSessions();
  const sessions = sessionsData as TriageSession[] | undefined;

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case "Critical": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "High": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Low": return "bg-green-500/10 text-green-400 border-green-500/20";
      default: return "bg-foreground/5 text-foreground/50 border-foreground/10";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-foreground" style={{ background: "#0a0010" }}>
      <Navbar />
      <NightScene showOwl={false} starCount={150} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-4xl font-light text-foreground" data-testid="text-title">
              Triage <em className="italic text-primary">Queue</em>
            </h1>
            <p className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mt-2" data-testid="text-subtitle">Manage and review patient intake sessions</p>
          </div>
          
          <Link 
            href="/new-session" 
            className="inline-flex items-center gap-2 px-6 py-3 border border-foreground text-foreground text-[9px] tracking-[2px] uppercase font-sans hover:bg-foreground hover:text-background transition-all duration-200 no-underline"
            data-testid="link-new-session"
          >
            <UserPlus className="w-4 h-4" />
            New Session
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border mb-8" data-testid="stats-grid">
          {[
            { label: "Active Queue", value: sessions?.length || 0, icon: Activity, color: "text-primary" },
            { label: "Critical Cases", value: sessions?.filter(s => s.urgencyLevel === "Critical").length || 0, icon: AlertTriangle, color: "text-red-400" },
            { label: "Avg Wait Time", value: "14 min", icon: Clock, color: "text-yellow-400" },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-card p-6 flex items-center gap-4"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <div className="p-3 rounded-md bg-foreground/5">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-[9px] tracking-[2px] uppercase text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-serif font-light text-foreground">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-[10px] tracking-[2px] uppercase text-foreground/50" data-testid="text-sessions-header">Recent Sessions</h2>
          </div>
          
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center" data-testid="loading-state">
              <Loader2 className="w-6 h-6 animate-spin mb-4 text-primary" />
              <span className="text-[10px] tracking-[1.5px] uppercase">Loading patient data...</span>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-destructive" data-testid="error-state">
              <AlertTriangle className="w-10 h-10 mx-auto mb-4 opacity-50" />
              <span className="text-[10px] tracking-[1.5px] uppercase">Failed to load queue</span>
            </div>
          ) : sessions?.length === 0 ? (
            <div className="p-16 text-center" data-testid="empty-state">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-light text-foreground">Queue is empty</h3>
              <p className="text-[10px] tracking-[1px] uppercase text-muted-foreground mt-2">No triage sessions recorded yet.</p>
              <Link href="/new-session" className="mt-4 inline-block text-primary text-[10px] tracking-[1.5px] uppercase hover:underline" data-testid="link-create-first">
                Create first session
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions?.map((session, i) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  key={session.id} 
                  className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-foreground/[0.02] transition-colors group"
                  data-testid={`row-session-${session.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-serif text-lg" data-testid={`avatar-${session.id}`}>
                      {session.patientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm text-foreground flex items-center gap-2" data-testid={`text-patient-${session.id}`}>
                        {session.patientName} 
                        <span className="text-[9px] tracking-[1px] uppercase text-muted-foreground">{session.age} yrs</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={cn("px-2 py-0.5 text-[8px] tracking-[1.5px] uppercase border", getUrgencyColor(session.urgencyLevel))} data-testid={`badge-urgency-${session.id}`}>
                          {session.urgencyLevel}
                        </span>
                        <span className="text-[9px] tracking-[1px] text-muted-foreground flex items-center gap-1" data-testid={`text-time-${session.id}`}>
                          <Clock className="w-3 h-3" />
                          {format(new Date(session.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="hidden md:block text-[10px] tracking-[1px] uppercase max-w-[200px] truncate text-muted-foreground" data-testid={`text-face-${session.id}`}>
                      Face: {session.faceStatus}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
