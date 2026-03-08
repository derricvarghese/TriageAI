import { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Loader2, AlertCircle, Trash2, Eye } from "lucide-react";
import { useVisionModels } from "@/hooks/use-vision-models";
import { classifyASLSign, ASLWordAccumulator } from "@/lib/asl-classifier";
import { analyzeFace, drawFaceLandmarks, type FaceAnalysis } from "@/lib/face-analyzer";
import { cn } from "@/lib/utils";

interface VisionScannerProps {
  onSignalsDetected: (signals: string[], faceStatus: string, faceAnalysis?: FaceAnalysis) => void;
}

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const PAIN_COLORS: Record<string, string> = {
  "Severe Distress Detected": "text-red-400",
  "Moderate Discomfort": "text-orange-400",
  "Mild Discomfort": "text-yellow-400",
  "Alert / Attentive": "text-blue-400",
  "Normal": "text-green-400",
};

export function VisionScanner({ onSignalsDetected }: VisionScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLoaded, isLoading, error, processVideoFrame } = useVisionModels();
  const [isActive, setIsActive] = useState(false);
  const animationFrameRef = useRef<number>();
  const accumulatorRef = useRef(new ASLWordAccumulator());
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [spelledText, setSpelledText] = useState("");
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysis | null>(null);
  const [showFacePanel, setShowFacePanel] = useState(true);
  const lastCallbackRef = useRef(0);
  const lastFaceUpdateRef = useRef(0);

  const startScanning = () => setIsActive(true);
  const stopScanning = () => {
    setIsActive(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleClear = useCallback(() => {
    accumulatorRef.current.clear();
    setSpelledText("");
    setDetectedWords([]);
    setCurrentLetter(null);
  }, []);

  const handleSpace = useCallback(() => {
    accumulatorRef.current.addSpace();
    setSpelledText(accumulatorRef.current.getAllText());
    setDetectedWords([...accumulatorRef.current.getAllText().trim().split(/\s+/)]);
  }, []);

  const handleBackspace = useCallback(() => {
    accumulatorRef.current.backspace();
    setSpelledText(accumulatorRef.current.getAllText());
  }, []);

  useEffect(() => {
    if (!isActive || !isLoaded) return;

    const renderLoop = () => {
      if (webcamRef.current?.video && canvasRef.current) {
        const video = webcamRef.current.video;
        if (video.readyState === 4) {
          const now = performance.now();
          const { hands, faces } = processVideoFrame(video, now);

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          let detectedLetter: string | null = null;
          let currentFaceStatus = "Normal";
          let currentFaceAnalysis: FaceAnalysis | null = null;

          if (hands && hands.landmarks.length > 0 && ctx) {
            for (let h = 0; h < hands.landmarks.length; h++) {
              const lm = hands.landmarks[h];
              const mirrorX = (x: number) => (1 - x) * canvas.width;

              ctx.strokeStyle = h === 0 ? "#c8b48a" : "#10b981";
              ctx.lineWidth = 2;
              for (const [start, end] of HAND_CONNECTIONS) {
                const s = lm[start];
                const e = lm[end];
                ctx.beginPath();
                ctx.moveTo(mirrorX(s.x), s.y * canvas.height);
                ctx.lineTo(mirrorX(e.x), e.y * canvas.height);
                ctx.stroke();
              }

              for (const point of lm) {
                ctx.fillStyle = h === 0 ? "#c8b48a" : "#10b981";
                ctx.beginPath();
                ctx.arc(mirrorX(point.x), point.y * canvas.height, 3, 0, 2 * Math.PI);
                ctx.fill();
              }

              if (h === 0) {
                detectedLetter = classifyASLSign(lm);
              }
            }
          }

          const result = accumulatorRef.current.addDetection(detectedLetter, now);
          setCurrentLetter(detectedLetter);

          if (result.confirmedLetter) {
            setSpelledText(result.allText);
            setDetectedWords(result.words);
          }

          if (detectedLetter && ctx) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(10, 10, 90, 70);
            ctx.fillStyle = "#c8b48a";
            ctx.font = "bold 48px monospace";
            ctx.textAlign = "center";
            ctx.fillText(detectedLetter, 55, 62);
            ctx.font = "10px monospace";
            ctx.fillStyle = "rgba(200,180,138,0.6)";
            ctx.fillText("DETECTED", 55, 76);
            ctx.textAlign = "start";
          }

          if (faces && faces.faceBlendshapes && faces.faceBlendshapes.length > 0) {
            const shapes = faces.faceBlendshapes[0].categories;
            currentFaceAnalysis = analyzeFace(shapes);
            currentFaceStatus = currentFaceAnalysis.overallStatus;

            if (now - lastFaceUpdateRef.current > 300) {
              lastFaceUpdateRef.current = now;
              setFaceAnalysis(currentFaceAnalysis);
            }
          }

          if (faces && faces.faceLandmarks && faces.faceLandmarks.length > 0 && ctx) {
            const landmarks = faces.faceLandmarks[0];
            drawFaceLandmarks(ctx, landmarks, canvas.width, canvas.height, currentFaceAnalysis?.painLevel || 0);
          }

          if (now - lastCallbackRef.current > 500) {
            lastCallbackRef.current = now;
            const allWords = result.allText.trim().split(/\s+/).filter(Boolean);
            const signals = allWords.length > 0 ? allWords : (detectedLetter ? [detectedLetter] : []);
            if (signals.length > 0 || currentFaceStatus !== "Normal" || currentFaceAnalysis) {
              onSignalsDetected(signals, currentFaceStatus, currentFaceAnalysis || undefined);
            }
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return stopScanning;
  }, [isActive, isLoaded, processVideoFrame, onSignalsDetected]);

  return (
    <div className="relative overflow-hidden bg-card border" data-testid="vision-scanner">
      <div className="absolute top-0 inset-x-0 z-10 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[9px] tracking-[2px] uppercase">
            {isActive ? "Scanning" : "Camera Ready"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {faceAnalysis && isActive && (
            <span className={cn(
              "text-[9px] tracking-[1px] uppercase",
              PAIN_COLORS[faceAnalysis.overallStatus] || "text-foreground"
            )} data-testid="text-face-status-badge">
              {faceAnalysis.overallStatus}
            </span>
          )}
          {currentLetter && isActive && (
            <div className="bg-primary/20 border border-primary/30 px-3 py-1" data-testid="text-current-letter">
              <span className="text-primary text-lg font-mono font-bold">{currentLetter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative aspect-[4/3] bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover"
          mirrored={true}
          data-testid="webcam-feed"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={640}
          height={480}
          data-testid="landmark-canvas"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-[10px] tracking-[2px] uppercase">Loading Vision Models...</p>
            <p className="text-[9px] text-white/50 mt-2">MediaPipe Hand & Face Landmarks</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
            <p className="text-sm text-red-400">Initialization Failed</p>
            <p className="text-[10px] text-white/50 mt-2 max-w-[280px]">{error}</p>
          </div>
        )}

        {!isActive && isLoaded && !error && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
            <button
              onClick={startScanning}
              className="px-8 py-3 border border-primary text-primary text-[9px] tracking-[2px] uppercase font-sans hover:bg-primary hover:text-primary-foreground transition-all"
              data-testid="button-start-scanning"
            >
              Start Scanning
            </button>
          </div>
        )}
      </div>

      {isActive && (
        <div className="bg-card border-t h-[400px] flex flex-col overflow-y-auto">
          <div className="p-3 space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-[11px] tracking-[2px] uppercase text-foreground/50 font-semibold">ASL Text</span>
              <div className="flex gap-1.5">
                <button onClick={handleSpace} className="px-3 py-1.5 border border-border text-[10px] tracking-[1px] uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all" data-testid="button-space">Space</button>
                <button onClick={handleBackspace} className="px-3 py-1.5 border border-border text-[10px] tracking-[1px] uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all" data-testid="button-backspace">←</button>
                <button onClick={handleClear} className="px-3 py-1.5 border border-border text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all font-bold" data-testid="button-clear"><Trash2 className="w-3.5 h-3.5" /></button>
                <button onClick={stopScanning} className="px-3 py-1.5 border border-border text-[10px] tracking-[1px] uppercase text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all" data-testid="button-pause">Pause</button>
              </div>
            </div>
            <div className="min-h-[48px] bg-background border p-3.5 font-mono text-base text-foreground break-all" data-testid="text-spelled">
              {spelledText || <span className="text-muted-foreground italic text-xs">Sign letters to spell words...</span>}
              <span className="animate-pulse text-primary ml-1">|</span>
            </div>
          </div>

          {faceAnalysis && (
            <div className="border-t" data-testid="section-face-analysis">
              <button
                onClick={() => setShowFacePanel(!showFacePanel)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-background/50 transition-colors shrink-0"
                data-testid="button-toggle-face-panel"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-[10px] tracking-[2px] uppercase text-foreground/60 font-medium">Face Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <PainIndicator level={faceAnalysis.painLevel} />
                  <span className={cn(
                    "text-[11px] tracking-[1px] font-medium w-24 text-right",
                    PAIN_COLORS[faceAnalysis.overallStatus] || "text-foreground"
                  )}>
                    {faceAnalysis.overallStatus}
                  </span>
                </div>
              </button>

              {showFacePanel && (
                <div className="px-3 pb-3 space-y-2.5 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    <FaceDetailItem label="Eyes" value={faceAnalysis.details.eyes} />
                    <FaceDetailItem label="Eyebrows" value={faceAnalysis.details.eyebrows} />
                    <FaceDetailItem label="Mouth" value={faceAnalysis.details.mouth} />
                    <FaceDetailItem label="Jaw" value={faceAnalysis.details.jaw} />
                  </div>

                  {faceAnalysis.descriptions.length > 0 && (
                    <div className="space-y-1.5 mt-2" data-testid="face-descriptions">
                      {faceAnalysis.descriptions.map((desc, i) => (
                        <p key={i} className="text-xs text-foreground/70 leading-relaxed pl-3 border-l-2 border-primary/20">
                          {desc}
                        </p>
                      ))}
                    </div>
                  )}

                  {faceAnalysis.criticalIndicators.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 mt-2 space-y-1.5" data-testid="face-critical-indicators">
                      {faceAnalysis.criticalIndicators.map((indicator, i) => (
                        <p key={i} className="text-xs text-red-400 flex items-start gap-2 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {indicator}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isActive && (
        <div className="p-3 bg-card border-t">
          <div className="text-[9px] tracking-[1.5px] text-muted-foreground">
            {isLoaded ? "Ready — press Start to begin scanning" : isLoading ? "Loading models..." : "Camera ready"}
          </div>
        </div>
      )}
    </div>
  );
}

function PainIndicator({ level }: { level: number }) {
  const blocks = 10;
  return (
    <div className="flex gap-0.5" data-testid="pain-indicator" title={`Pain level: ${level}/10`}>
      {Array.from({ length: blocks }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-3.5 transition-colors rounded-[1px]",
            i < level
              ? level >= 7
                ? "bg-red-400"
                : level >= 4
                  ? "bg-orange-400"
                  : level >= 2
                    ? "bg-yellow-400"
                    : "bg-green-400"
              : "bg-foreground/10"
          )}
        />
      ))}
    </div>
  );
}

function FaceDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border p-3 flex flex-col justify-center min-h-[56px]" data-testid={`face-detail-${label.toLowerCase()}`}>
      <span className="text-[9px] tracking-[2px] uppercase text-foreground/40 block mb-1 font-semibold">{label}</span>
      <span className="text-xs text-foreground/80 leading-snug block">{value}</span>
    </div>
  );
}
