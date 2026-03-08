import { useEffect, useRef } from "react";

export const NightScene = ({ showOwl = true, showMoon = true, starCount = 150 }: { showOwl?: boolean, showMoon?: boolean, starCount?: number }) => {
  const starsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!starsRef.current) return;
    const container = starsRef.current;
    container.innerHTML = "";
    const ww = container.offsetWidth;
    const wh = container.offsetHeight;
    
    // Create random stars
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div");
        star.className = "landing-star";
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * ww}px`;
        star.style.top = `${Math.random() * wh}px`;
        star.style.setProperty("--dur", `${Math.random() * 3 + 1}s`);
        star.style.setProperty("--min-op", `${Math.random() * 0.5}`);
        container.appendChild(star);
    }
  }, [starCount]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-star {
          position: absolute;
          background: #fff;
          border-radius: 50%;
          animation: twinkle var(--dur) ease-in-out infinite alternate;
        }
        @keyframes twinkle {
          from { opacity: var(--min-op); transform: scale(1); }
          to   { opacity: 1; transform: scale(1.4); }
        }
        .landing-moon {
          position: absolute;
          top: 80px;
          right: 15%;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fffbe0, #f5d97a 40%, #c8a227 80%, #a07010);
          box-shadow:
            0 0 40px 15px rgba(245,217,100,0.35),
            0 0 100px 40px rgba(245,217,100,0.15),
            inset -10px -8px 20px rgba(100,70,0,0.3);
          z-index: 10;
          animation: moonFloat 8s ease-in-out infinite;
        }
        .landing-moon::before {
          content: '';
          position: absolute;
          top: 22px; left: 30px;
          width: 18px; height: 14px;
          border-radius: 50%;
          background: rgba(100,70,0,0.18);
          box-shadow: 30px 28px 0 8px rgba(100,70,0,0.12), -5px 38px 0 5px rgba(100,70,0,0.10);
        }
        .landing-moon::after {
          content: '';
          position: absolute;
          bottom: 25px; right: 20px;
          width: 10px; height: 8px;
          border-radius: 50%;
          background: rgba(100,70,0,0.15);
        }
        @keyframes moonFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .landing-cloud {
          position: absolute;
          opacity: 0.07;
          border-radius: 50px;
          background: #8888bb;
          pointer-events: none;
          z-index: 1;
          animation: cloudDrift var(--cdur) linear infinite;
        }
        @keyframes cloudDrift {
          from { left: -300px; }
          to   { left: 110%; }
        }
        .landing-owl-wrap {
          position: absolute;
          z-index: 20;
          pointer-events: none;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .landing-owl-mover {
          position: absolute;
          top: 0;
          left: 0;
          animation: flyAround 22s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .landing-owl-flipper {
          animation: flyFlip 22s linear infinite;
        }
        .landing-owl-bob {
           animation: owlBob 2.5s ease-in-out infinite alternate;
        }
        .landing-owl-img {
          width: 180px;
          height: auto;
          filter: drop-shadow(0 0 16px rgba(220,30,30,0.6)) drop-shadow(0 2px 20px rgba(0,0,0,0.8));
          transform-origin: center center;
          animation: wingFlap 0.4s ease-in-out infinite alternate;
        }
        @keyframes owlBob {
          from { transform: translateY(-20px); }
          to   { transform: translateY(20px); }
        }
        @keyframes wingFlap {
          from { transform: scaleY(1); }
          to   { transform: scaleY(0.85); }
        }
        @keyframes flyAround {
          0% {
            transform: translate(-30vw, 70vh);
          }
          15% {
            transform: translate(15vw, 20vh);
          }
          30% {
            transform: translate(55vw, 65vh);
          }
          45% {
            transform: translate(90vw, 25vh);
          }
          50% {
            transform: translate(120vw, 45vh);
          }
          65% {
            transform: translate(80vw, 80vh);
          }
          80% {
            transform: translate(35vw, 30vh);
          }
          95% {
            transform: translate(0vw, 65vh);
          }
          100% {
            transform: translate(-30vw, 70vh);
          }
        }
        @keyframes flyFlip {
          0%, 50% {
            transform: scaleX(1);
          }
          50.01%, 100% {
            transform: scaleX(-1);
          }
        }
      `}} />
      <div ref={starsRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden" />
      {showMoon && (
        <>
          <div className="landing-moon" />
          <div className="landing-cloud" style={{ width: "220px", height: "55px", top: "12%", "--cdur": "38s", animationDelay: "-10s" } as any} />
          <div className="landing-cloud" style={{ width: "160px", height: "40px", top: "28%", "--cdur": "52s", animationDelay: "-24s" } as any} />
          <div className="landing-cloud" style={{ width: "300px", height: "65px", top: "60%", "--cdur": "44s", animationDelay: "-5s" } as any} />
          <div className="landing-cloud" style={{ width: "180px", height: "45px", top: "75%", "--cdur": "60s", animationDelay: "-33s" } as any} />
        </>
      )}
      
      {showOwl && (
        <div className="landing-owl-wrap">
          <div className="landing-owl-mover">
            <div className="landing-owl-flipper">
              <div className="landing-owl-bob">
                <img className="landing-owl-img" src="/flying-owl.png" alt="Flying Owl" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
