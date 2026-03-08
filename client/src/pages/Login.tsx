import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { NightScene } from "@/components/NightScene";

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Firebase auth error:", err?.code, err?.message);
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User closed the popup, no error to show
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase. Add it under Authentication > Settings > Authorized domains in the Firebase Console.");
      } else if (err?.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for this site and try again.");
      } else {
        setError(`Sign-in failed: ${err?.code || err?.message || "Unknown error"}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#0a0010" }}>
        <NightScene showOwl={false} showMoon={false} starCount={80} />
        <Loader2 className="w-6 h-6 animate-spin text-primary relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#0a0010" }} data-testid="login-page">
      <NightScene showOwl={false} showMoon={true} starCount={120} />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/owl-logo.png"
            alt="ASOwl"
            className="h-24 w-24 object-cover rounded-xl"
            style={{ filter: "drop-shadow(0 0 20px rgba(200,50,50,0.5))" }}
          />
          <h1 className="font-serif text-3xl font-light text-foreground" data-testid="text-login-title">
            AS<em className="italic text-primary">Owl</em>
          </h1>
          <p className="text-[10px] tracking-[1.5px] uppercase text-muted-foreground text-center">
            ASL Health Triage System
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-foreground/30 text-foreground text-[10px] tracking-[2px] uppercase font-sans hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backdropFilter: "blur(4px)", background: "rgba(255,255,255,0.03)" }}
            data-testid="button-google-signin"
          >
            {signingIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SiGoogle className="w-4 h-4" />
            )}
            {signingIn ? "Signing in..." : "Continue with Google"}
          </button>

          {error && (
            <p className="text-[10px] tracking-[1px] text-destructive text-center" data-testid="text-login-error">
              {error}
            </p>
          )}
        </div>

        <p className="text-[8px] tracking-[1.5px] uppercase text-muted-foreground text-center max-w-[280px]" data-testid="text-login-disclaimer">
          By signing in you agree that this is not a substitute for professional medical advice
        </p>
      </div>
    </div>
  );
}
