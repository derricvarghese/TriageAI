import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

const TOTAL_FRAMES = 240;

function getFramePath(index: number): string {
  const num = String(Math.min(TOTAL_FRAMES, Math.max(1, index))).padStart(3, "0");
  return `/owl-frames/ezgif-frame-${num}.jpg`;
}

const phases = [
  {
    eyeLabel: "01 / 04",
    eyeContext: "medical triage agent",
    titleLines: ["symptom", "triage", "agent"],
    italicIdx: 1,
    sub: "An AI-powered ASL triage system with real-time hand signal detection, face analysis, and clinical reasoning.",
    stage: "intro",
  },
  {
    eyeLabel: "02 / 04",
    eyeContext: "the agent awakens",
    titleLines: ["camera", "activated"],
    italicIdx: 1,
    sub: "The system initializes hand and face tracking models, preparing to interpret patient gestures and expressions.",
    stage: "scanning",
  },
  {
    eyeLabel: "03 / 04",
    eyeContext: "full analysis",
    titleLines: ["full", "scope"],
    italicIdx: 1,
    sub: "ASL gesture classification across symptom categories. Facial expression pain detection. Real-time clinical assessment.",
    stage: "analysis",
  },
  {
    eyeLabel: "04 / 04",
    eyeContext: "triage complete",
    titleLines: ["triage", "result"],
    italicIdx: 1,
    sub: "Structured output: urgency level, detected signals, facial status, symptom notes, and follow-up instructions.",
    stage: "result",
  },
];

import { NightScene } from "@/components/NightScene";

export default function Landing() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<Set<number>>(new Set());
  const rafRef = useRef<number | null>(null);
  const currentFrameRef = useRef(0);

  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !loadedRef.current.has(frameIndex)) return;

    if (canvas.width !== 1280) canvas.width = 1280;
    if (canvas.height !== 720) canvas.height = 720;
    ctx.clearRect(0, 0, 1280, 720);
    ctx.drawImage(img, 0, 0, 1280, 720);
  }, []);

  useEffect(() => {
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    imagesRef.current = images;

    const loadImage = (i: number) => {
      const img = new Image();
      img.src = getFramePath(i + 1);
      img.onload = () => {
        loadedRef.current.add(i);
        if (i === 0) drawFrame(0);
      };
      images[i] = img;
    };

    loadImage(0);
    for (let i = 1; i < 30; i++) loadImage(i);

    const loadRest = () => {
      for (let i = 30; i < TOTAL_FRAMES; i++) loadImage(i);
    };
    const timer = setTimeout(loadRest, 200);

    return () => clearTimeout(timer);
  }, [drawFrame]);

  useEffect(() => {
    const tryDraw = () => {
      if (loadedRef.current.has(0)) {
        drawFrame(0);
      } else {
        requestAnimationFrame(tryDraw);
      }
    };
    tryDraw();
  }, [drawFrame]);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
      setScrollProgress(progress);

      const phaseIndex = Math.min(3, Math.floor(progress * 4));
      setActivePhase(phaseIndex);

      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
      if (frameIndex !== currentFrameRef.current) {
        currentFrameRef.current = frameIndex;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [drawFrame]);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${e.clientX}px`;
        cursorRingRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const phase = phases[activePhase];
  const frameNum = String(Math.floor(scrollProgress * (TOTAL_FRAMES - 1)) + 1).padStart(3, "0");

  return (
    <div className="cursor-none text-foreground" style={{ background: "#0a0010" }}>
      <div ref={cursorRef} className="owl-cursor hidden md:block" data-testid="cursor-dot" />
      <div ref={cursorRingRef} className="owl-cursor-ring hidden md:block" data-testid="cursor-ring" />

      <div
        className="owl-progress-bar fixed top-0 left-0 h-0.5 z-[1000]"
        style={{ width: `${scrollProgress * 100}%` }}
        data-testid="progress-bar"
      />

      <nav className="owl-nav fixed top-0 left-0 right-0 z-[500] flex items-center justify-between px-6 md:px-[52px] py-6" data-testid="nav">
        <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-logo">
          <img src="/owl-logo.png" alt="ASOwl" className="h-8 w-8 object-cover rounded-md" style={{ filter: "drop-shadow(0 0 4px rgba(200,50,50,0.4))" }} />
          <span className="font-serif text-xl font-light tracking-wide text-foreground">AS<em className="italic text-primary">Owl</em></span>
        </Link>
        <div className="flex gap-6 md:gap-9 items-center">
          <a href="#how" className="hidden md:inline text-[9px] tracking-[2.5px] uppercase text-foreground/50 no-underline hover:text-foreground transition-colors" data-testid="link-how">
            how it works
          </a>
          <a href="#levels" className="hidden md:inline text-[9px] tracking-[2.5px] uppercase text-foreground/50 no-underline hover:text-foreground transition-colors" data-testid="link-levels">
            triage levels
          </a>
          <Link href="/login" className="text-[9px] tracking-[2px] uppercase px-4 py-2 border border-foreground/30 text-foreground bg-transparent font-sans hover:border-primary hover:text-primary transition-all" data-testid="button-launch">
            launch app &rarr;
          </Link>
        </div>
      </nav>

      <div ref={sectionRef} style={{ height: "500vh" }} className="relative" data-testid="owl-section">
        <div
          className="sticky top-0 h-screen overflow-hidden"
          data-testid="owl-sticky"
        >
          <div className="absolute inset-0 z-[1] flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-cover"
              data-testid="owl-canvas"
            />
          </div>

          <div className="absolute inset-0 z-[2] pointer-events-none" style={{
            background: "linear-gradient(90deg, hsl(20 8% 10% / 0.92) 0%, hsl(20 8% 10% / 0.6) 25%, hsl(20 8% 10% / 0.15) 45%, transparent 60%)"
          }} />

          <div className="absolute inset-0 z-[2] pointer-events-none" style={{
            background: "linear-gradient(0deg, hsl(20 8% 10% / 0.5) 0%, transparent 20%)"
          }} />

          <div className="absolute left-0 top-0 bottom-0 w-full md:w-[46%] z-10 flex flex-col justify-end p-6 pb-20 md:p-0 md:pb-20 md:pl-[52px] pointer-events-none">
            <div className="flex flex-col gap-0" key={activePhase}>
              <div className="text-[9px] tracking-[3px] uppercase text-foreground/45 mb-4 fade-in-up">
                {phase.eyeLabel} &nbsp;&middot;&nbsp; {phase.eyeContext}
              </div>
              <div className="font-serif text-[clamp(48px,7vw,100px)] font-light leading-[0.93] tracking-tight mb-5">
                {phase.titleLines.map((line, i) => (
                  <span key={i} className={`block fade-in-up fade-in-up-delay-${i + 1}`}>
                    {i === phase.italicIdx ? (
                      <em className="italic text-primary">{line}</em>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </div>
              <div className="text-[10px] tracking-[1.5px] uppercase text-foreground/40 leading-[2.1] max-w-[340px] fade-in-up fade-in-up-delay-3">
                {phase.sub}
              </div>
              {activePhase === 0 && (
                <div className="mt-4 text-[8px] tracking-[2px] uppercase text-foreground/30 flex items-center gap-2 fade-in-up fade-in-up-delay-4">
                  scroll to reveal <span className="owl-bob inline-block">&darr;</span>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex absolute right-[52px] top-1/2 -translate-y-1/2 z-10 flex-col items-end gap-2 pointer-events-none">
            <div className="text-[9px] tracking-[2px] text-foreground/35" style={{ writingMode: "vertical-rl" }} data-testid="text-frame-counter">
              {frameNum}
            </div>
            <div className="owl-vline mx-auto my-1" />
            <div className="text-[8px] tracking-[1.5px] text-foreground/30" data-testid="text-stage">
              {phase.stage}
            </div>
          </div>

          <div className="hidden md:flex absolute bottom-8 right-[52px] z-10 flex-col items-end gap-1.5">
            <div className="text-[8px] tracking-[2.5px] uppercase text-foreground/30">
              wing cycle
            </div>
            <div className="w-[100px] h-px bg-foreground/10 relative">
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-75"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
            <div className="text-[8px] tracking-[1px] text-foreground/25">
              {frameNum} / {TOTAL_FRAMES}
            </div>
          </div>

          <div className="hidden md:block absolute top-8 right-[52px] z-10 text-[9px] tracking-[2px] text-foreground/30" data-testid="text-phase-indicator">
            {phase.eyeLabel}
          </div>
        </div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-6 md:px-[52px] relative overflow-hidden border-t border-border" id="how" data-testid="section-cta">
        <NightScene />
        <div className="font-serif text-[clamp(48px,8vw,110px)] font-light leading-[0.93] tracking-tight text-center relative z-20">
          start your<br /><em className="italic text-primary">assessment</em>
        </div>
        <div className="text-[10px] tracking-[2px] uppercase text-muted-foreground text-center max-w-[500px] leading-[2.2]">
          ASL-powered health triage &middot; Camera-based sign & face detection &middot; Not a substitute for professional medical advice
        </div>
        <div className="flex gap-4 flex-wrap justify-center relative z-20" data-testid="cta-buttons">
          <Link
            href="/login"
            className="px-10 py-3.5 border border-foreground bg-transparent text-foreground font-sans text-[9px] tracking-[2px] uppercase hover:bg-foreground hover:text-background transition-all duration-200 no-underline"
            data-testid="button-begin-assessment"
          >
            begin assessment &rarr;
          </Link>
          <Link
            href="/login"
            className="px-10 py-3.5 border border-border text-muted-foreground font-sans text-[9px] tracking-[2px] uppercase hover:border-primary hover:text-primary transition-all duration-200 no-underline"
            data-testid="button-view-history"
          >
            view triage history
          </Link>
        </div>
        <div className="text-[8px] tracking-[1.5px] uppercase text-muted-foreground relative z-20" data-testid="text-emergency-note">
          in emergencies call 911
        </div>
      </div>

      <div className="py-24 px-6 md:px-[52px] border-t border-border relative overflow-hidden" id="levels" data-testid="section-levels">
        <NightScene showOwl={false} showMoon={false} />
        <div className="max-w-5xl mx-auto z-10 relative">
          <div className="text-center mb-16">
            <div className="text-[9px] tracking-[3px] uppercase text-foreground/45 mb-4">triage classification</div>
            <h2 className="font-serif text-[clamp(36px,5vw,72px)] font-light leading-[0.93] tracking-tight">
              urgency <em className="italic text-primary">levels</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { level: "Low", color: "rgb(34, 197, 94)", desc: "Minor symptoms, no immediate risk. Standard wait time.", marker: "I" },
              { level: "Medium", color: "rgb(245, 158, 11)", desc: "Moderate symptoms requiring attention within hours.", marker: "II" },
              { level: "High", color: "rgb(239, 68, 68)", desc: "Serious condition, needs prompt evaluation.", marker: "III" },
              { level: "Critical", color: "rgb(220, 38, 38)", desc: "Life-threatening, immediate intervention required.", marker: "IV" },
            ].map((item) => (
              <div key={item.level} className="bg-transparent backdrop-blur-sm bg-black/40 p-8 flex flex-col gap-4" data-testid={`card-level-${item.level.toLowerCase()}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                  />
                  <span className="text-[9px] tracking-[2px] uppercase text-foreground/40">{item.marker}</span>
                </div>
                <div className="font-serif text-3xl font-light">{item.level}</div>
                <div className="text-[10px] tracking-[1px] uppercase text-foreground/40 leading-[2]">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-12 px-6 md:px-[52px] border-t border-border relative overflow-hidden" data-testid="footer">
        <NightScene showOwl={false} showMoon={false} starCount={30} />
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <img src="/owl-logo.png" alt="ASOwl" className="h-8 w-8 object-cover rounded-md" style={{ filter: "drop-shadow(0 0 4px rgba(200,50,50,0.4))" }} />
            <span className="font-serif text-lg font-light tracking-wide">AS<em className="italic text-primary">Owl</em></span>
          </div>
          <div className="text-[8px] tracking-[2px] uppercase text-foreground/30">
            ASL Health Triage System &middot; Camera-based detection
          </div>
        </div>
      </footer>
    </div>
  );
}
