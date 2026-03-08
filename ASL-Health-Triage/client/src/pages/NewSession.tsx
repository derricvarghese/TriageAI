import { useState, useCallback, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { VisionScanner } from "@/components/camera/VisionScanner";
import { useCreateTriageSession, useTriageChat, type ChatResponse } from "@/hooks/use-triage-sessions";
import { useLocation } from "wouter";
import { 
  Send, Save, Loader2, Sparkles, ShieldAlert, ArrowRight, 
  MessageCircle, User, Bot, Camera, CameraOff, ChevronDown, Eye
} from "lucide-react";
import type { FaceAnalysis } from "@/lib/face-analyzer";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: number;
}

interface AssessmentResult {
  assessment: string;
  recommendedUrgency: string;
  followUpActions: string[];
  safetyNotes: string;
  summary?: string;
}

export default function NewSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateTriageSession();
  const chatMutation = useTriageChat();
  
  const [step, setStep] = useState<"intake" | "chat" | "done">("intake");
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [urgencyLevel, setUrgencyLevel] = useState("Medium");
  
  const [detectedHandSignals, setDetectedHandSignals] = useState<string[]>([]);
  const [faceStatus, setFaceStatus] = useState("Normal");
  const [latestFaceAnalysis, setLatestFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [spelledText, setSpelledText] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignalsDetected = useCallback((signals: string[], faceStatusVal: string, faceAnalysis?: FaceAnalysis) => {
    if (signals.length > 0) {
      setDetectedHandSignals(prev => {
        const newSet = new Set([...prev, ...signals]);
        return Array.from(newSet);
      });
      const latestSignal = signals[signals.length - 1];
      if (latestSignal && latestSignal.length > 1) {
        setSpelledText(latestSignal);
      }
    }
    if (faceStatusVal !== "Normal") {
      setFaceStatus(faceStatusVal);
    }
    if (faceAnalysis) {
      setLatestFaceAnalysis(faceAnalysis);
    }
  }, []);

  const startChat = async () => {
    if (!patientName.trim() || !age.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and age to begin.",
        variant: "destructive"
      });
      return;
    }
    
    setStep("chat");
    
    try {
      const result = await chatMutation.mutateAsync({
        messages: [],
        patientName: patientName.trim(),
        age: parseInt(age, 10),
        detectedSignals: detectedHandSignals,
        faceStatus,
        faceDescriptions: latestFaceAnalysis?.descriptions,
        facePainLevel: latestFaceAnalysis?.painLevel,
        faceCriticalIndicators: latestFaceAnalysis?.criticalIndicators,
      });
      
      if (result.isAssessment && result.assessment) {
        const summaryMsg: ChatMessage = {
          role: "assistant",
          content: "Based on the information provided, I've completed my assessment.",
          timestamp: Date.now(),
        };
        setMessages([summaryMsg]);
        setAssessment(result.assessment);
        setUrgencyLevel(result.assessment.recommendedUrgency);
        setStep("done");
      } else {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: result.message,
          timestamp: Date.now(),
        };
        setMessages([assistantMsg]);
      }
    } catch (err: any) {
      toast({
        title: "Connection Error",
        description: "Could not start the assessment. Please try again.",
        variant: "destructive"
      });
      setStep("intake");
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText || chatMutation.isPending) return;
    
    const userMsg: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setSpelledText("");
    
    try {
      const result = await chatMutation.mutateAsync({
        messages: updatedMessages,
        patientName: patientName.trim(),
        age: parseInt(age, 10),
        detectedSignals: detectedHandSignals,
        faceStatus,
        faceDescriptions: latestFaceAnalysis?.descriptions,
        facePainLevel: latestFaceAnalysis?.painLevel,
        faceCriticalIndicators: latestFaceAnalysis?.criticalIndicators,
      });
      
      if (result.isAssessment && result.assessment) {
        setAssessment(result.assessment);
        setUrgencyLevel(result.assessment.recommendedUrgency);
        setStep("done");
        
        const summaryMsg: ChatMessage = {
          role: "assistant",
          content: `Based on our conversation, I've completed my assessment. Here's what I found:`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, summaryMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: result.message,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to get response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const useSpelledText = () => {
    if (spelledText.trim()) {
      setInputText(prev => prev ? `${prev} ${spelledText.trim()}` : spelledText.trim());
      setSpelledText("");
    }
  };

  const handleSubmit = async () => {
    try {
      const chatSummary = messages.map(m => 
        `${m.role === "assistant" ? "ASOwl" : "Patient"}: ${m.content}`
      ).join("\n");
      
      await createMutation.mutateAsync({
        patientName: patientName.trim(),
        age: parseInt(age, 10),
        urgencyLevel,
        symptomsNotes: chatSummary,
        detectedHandSignals,
        faceStatus,
        chatHistory: messages,
        aiAssessment: assessment ? JSON.stringify(assessment) : null,
      });
      
      toast({
        title: "Session Saved",
        description: "Triage session has been logged successfully.",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save the session.",
        variant: "destructive"
      });
    }
  };

  const urgencyColor = (level: string) => {
    switch (level) {
      case "Critical": return "text-red-400 border-red-400/30 bg-red-400/10";
      case "High": return "text-orange-400 border-orange-400/30 bg-orange-400/10";
      case "Medium": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
      case "Low": return "text-green-400 border-green-400/30 bg-green-400/10";
      default: return "text-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-light text-foreground" data-testid="text-new-session-title">
            Health <em className="italic text-primary">Assessment</em>
          </h1>
          <p className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground mt-1" data-testid="text-new-session-subtitle">
            Interactive Triage &middot; Powered by Gemini AI
          </p>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {step === "intake" && (
                <motion.div
                  key="intake"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="w-full max-w-md bg-card border p-8" data-testid="form-intake">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-primary/10 p-2.5 rounded-full">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-serif text-xl text-foreground">Let's Get Started</h2>
                        <p className="text-[10px] tracking-[1px] text-muted-foreground mt-0.5">Tell me a bit about yourself</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[9px] tracking-[2px] uppercase text-foreground/50">Your Name</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full px-4 py-3 bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                          placeholder="Jane Doe"
                          data-testid="input-patient-name"
                          autoFocus
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[9px] tracking-[2px] uppercase text-foreground/50">Your Age</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="150"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full px-4 py-3 bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                          placeholder="34"
                          data-testid="input-age"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={startChat}
                        disabled={chatMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground text-[10px] tracking-[2px] uppercase font-sans hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        data-testid="button-start-assessment"
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        {chatMutation.isPending ? "Starting..." : "Begin Assessment"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {(step === "chat" || step === "done") && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col bg-card border min-h-0"
                >
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] tracking-[1.5px] uppercase text-foreground/60">
                        AS<em className="italic text-primary">Owl</em> Triage
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] tracking-[1px] text-muted-foreground">
                        {patientName}, {age}y
                      </span>
                      <button
                        onClick={() => setShowCamera(!showCamera)}
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          showCamera ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="button-toggle-camera"
                        title={showCamera ? "Hide camera" : "Show ASL camera"}
                      >
                        {showCamera ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0" data-testid="chat-messages">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className={cn(
                          "flex gap-3",
                          msg.role === "user" ? "flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          msg.role === "assistant" ? "bg-primary/15" : "bg-foreground/10"
                        )}>
                          {msg.role === "assistant" ? (
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-foreground/60" />
                          )}
                        </div>
                        <div className={cn(
                          "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
                          msg.role === "assistant" 
                            ? "bg-background border text-foreground" 
                            : "bg-primary/10 border border-primary/20 text-foreground"
                        )} data-testid={`chat-message-${i}`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    
                    {chatMutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/15 shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-background border px-4 py-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {step === "done" && assessment && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mx-5 mb-4 border border-primary/20 bg-background p-5 space-y-4"
                      data-testid="section-ai-result"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-[10px] tracking-[2px] uppercase text-primary">Assessment Complete</span>
                      </div>
                      
                      <p className="text-sm text-foreground leading-relaxed" data-testid="text-ai-assessment">
                        {assessment.assessment}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-[9px] tracking-[1.5px] uppercase text-muted-foreground">Urgency:</span>
                        <span className={cn(
                          "px-3 py-1 text-[10px] tracking-[1.5px] uppercase border font-medium",
                          urgencyColor(assessment.recommendedUrgency)
                        )} data-testid="text-ai-urgency">
                          {assessment.recommendedUrgency}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] tracking-[1.5px] uppercase text-muted-foreground">Recommended Actions</span>
                        <ul className="mt-2 space-y-1.5" data-testid="list-ai-actions">
                          {assessment.followUpActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                              <ArrowRight className="w-3 h-3 mt-1 text-primary shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {assessment.safetyNotes && (
                        <div className="bg-card border border-yellow-500/20 p-3" data-testid="text-ai-safety">
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] tracking-[1px] text-yellow-500/80 leading-relaxed">
                              {assessment.safetyNotes}
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-foreground text-foreground text-[10px] tracking-[2px] uppercase font-sans hover:bg-foreground hover:text-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        data-testid="button-submit"
                      >
                        {createMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {createMutation.isPending ? "Saving..." : "Save Session"}
                      </button>
                    </motion.div>
                  )}

                  {step === "chat" && (
                    <div className="px-5 py-3 border-t border-border">
                      {spelledText && (
                        <button
                          onClick={useSpelledText}
                          className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] tracking-[1px] hover:bg-primary/20 transition-colors"
                          data-testid="button-use-spelled"
                        >
                          <ChevronDown className="w-3 h-3" />
                          Use signed text: "<span className="font-mono">{spelledText}</span>"
                        </button>
                      )}
                      
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                          placeholder="Type your answer or use ASL camera..."
                          className="flex-1 px-4 py-3 bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all text-sm"
                          disabled={chatMutation.isPending}
                          data-testid="input-chat"
                        />
                        <button
                          onClick={() => sendMessage()}
                          disabled={!inputText.trim() || chatMutation.isPending}
                          className="px-4 py-3 bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-all"
                          data-testid="button-send"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showCamera && (step === "chat" || step === "done") && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="lg:w-[340px] shrink-0 overflow-hidden"
              >
                <VisionScanner onSignalsDetected={handleSignalsDetected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
