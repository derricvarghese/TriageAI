interface Landmark {
  x: number;
  y: number;
  z: number;
}

const WRIST = 0;
const THUMB_CMC = 1, THUMB_MCP = 2, THUMB_IP = 3, THUMB_TIP = 4;
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_DIP = 7, INDEX_TIP = 8;
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_DIP = 11, MIDDLE_TIP = 12;
const RING_MCP = 13, RING_PIP = 14, RING_DIP = 15, RING_TIP = 16;
const PINKY_MCP = 17, PINKY_PIP = 18, PINKY_DIP = 19, PINKY_TIP = 20;

function dist(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function dist2d(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angle3(a: Landmark, b: Landmark, c: Landmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const cb = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2 + ab.z ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2 + cb.z ** 2);
  if (magAB < 0.001 || magCB < 0.001) return 180;
  return Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB)))) * (180 / Math.PI);
}

function palmSize(lm: Landmark[]): number {
  return dist(lm[WRIST], lm[MIDDLE_MCP]);
}

function fingerStraightness(lm: Landmark[], mcp: number, pip: number, dip: number, tip: number): number {
  const mcpTip = dist(lm[mcp], lm[tip]);
  const totalLen = dist(lm[mcp], lm[pip]) + dist(lm[pip], lm[dip]) + dist(lm[dip], lm[tip]);
  if (totalLen < 0.001) return 0;
  return mcpTip / totalLen;
}

function pipAngle(lm: Landmark[], mcp: number, pip: number, dip: number): number {
  return angle3(lm[mcp], lm[pip], lm[dip]);
}

function dipAngle(lm: Landmark[], pip: number, dip: number, tip: number): number {
  return angle3(lm[pip], lm[dip], lm[tip]);
}

function isOpen(lm: Landmark[], mcp: number, pip: number, dip: number, tip: number): boolean {
  return fingerStraightness(lm, mcp, pip, dip, tip) > 0.75 && pipAngle(lm, mcp, pip, dip) > 150;
}

function isClosed(lm: Landmark[], mcp: number, pip: number, dip: number, tip: number): boolean {
  return fingerStraightness(lm, mcp, pip, dip, tip) < 0.65 || pipAngle(lm, mcp, pip, dip) < 120;
}

function isHooked(lm: Landmark[], mcp: number, pip: number, dip: number, tip: number): boolean {
  const pAngle = pipAngle(lm, mcp, pip, dip);
  const dAngle = dipAngle(lm, pip, dip, tip);
  return pAngle > 140 && dAngle < 140 && dAngle > 50;
}

function tipAbovePip(lm: Landmark[], tip: number, pip: number): boolean {
  return lm[tip].y < lm[pip].y - 0.01;
}

function tipBelowMcp(lm: Landmark[], tip: number, mcp: number): boolean {
  return lm[tip].y > lm[mcp].y + 0.02;
}

function tipsClose(lm: Landmark[], a: number, b: number, threshold = 0.3): boolean {
  return dist(lm[a], lm[b]) < palmSize(lm) * threshold;
}

function thumbAcrossPalm(lm: Landmark[]): boolean {
  const tx = lm[THUMB_TIP].x;
  const left = Math.min(lm[INDEX_PIP].x, lm[MIDDLE_PIP].x);
  const right = Math.max(lm[INDEX_PIP].x, lm[MIDDLE_PIP].x);
  return tx > left - 0.01 && tx < right + 0.01;
}

function thumbOutSide(lm: Landmark[]): boolean {
  const thumbDist = dist2d(lm[THUMB_TIP], lm[INDEX_MCP]);
  const ps = palmSize(lm);
  return thumbDist > ps * 0.35;
}

function thumbTucked(lm: Landmark[]): boolean {
  return dist(lm[THUMB_TIP], lm[MIDDLE_MCP]) < palmSize(lm) * 0.5;
}

function handPointsDown(lm: Landmark[]): boolean {
  return lm[MIDDLE_TIP].y > lm[WRIST].y;
}

function handPointsSideways(lm: Landmark[]): boolean {
  const dx = Math.abs(lm[MIDDLE_TIP].x - lm[WRIST].x);
  const dy = Math.abs(lm[MIDDLE_TIP].y - lm[WRIST].y);
  return dx > dy * 0.8;
}

function indexPointsSideways(lm: Landmark[]): boolean {
  const dx = Math.abs(lm[INDEX_TIP].x - lm[INDEX_MCP].x);
  const dy = Math.abs(lm[INDEX_TIP].y - lm[INDEX_MCP].y);
  return dx > dy;
}

interface FState {
  io: boolean; ic: boolean;
  mo: boolean; mc: boolean;
  ro: boolean; rc: boolean;
  po: boolean; pc: boolean;
}

function fState(lm: Landmark[]): FState {
  return {
    io: isOpen(lm, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP),
    ic: isClosed(lm, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP),
    mo: isOpen(lm, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP),
    mc: isClosed(lm, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP),
    ro: isOpen(lm, RING_MCP, RING_PIP, RING_DIP, RING_TIP),
    rc: isClosed(lm, RING_MCP, RING_PIP, RING_DIP, RING_TIP),
    po: isOpen(lm, PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP),
    pc: isClosed(lm, PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP),
  };
}

export function classifyASLSign(lm: Landmark[]): string | null {
  if (!lm || lm.length < 21) return null;

  const f = fState(lm);
  const ps = palmSize(lm);
  const allOpen = f.io && f.mo && f.ro && f.po;
  const allClosed = f.ic && f.mc && f.rc && f.pc;
  const threeClosed = f.mc && f.rc && f.pc;
  const thumbIdxTouch = tipsClose(lm, THUMB_TIP, INDEX_TIP, 0.35);
  const thumbMidTouch = tipsClose(lm, THUMB_TIP, MIDDLE_TIP, 0.35);
  const idxMidTouch = tipsClose(lm, INDEX_TIP, MIDDLE_TIP, 0.25);
  const idxUp = tipAbovePip(lm, INDEX_TIP, INDEX_PIP);
  const midUp = tipAbovePip(lm, MIDDLE_TIP, MIDDLE_PIP);
  const ringUp = tipAbovePip(lm, RING_TIP, RING_PIP);
  const pinkyUp = tipAbovePip(lm, PINKY_TIP, PINKY_PIP);
  const idxMidSpread = dist(lm[INDEX_TIP], lm[MIDDLE_TIP]) > ps * 0.25;

  // --- GROUP 1: all fingers extended ---

  // 5: all open + thumb out
  if (allOpen && thumbOutSide(lm) && idxUp) {
    return "5";
  }

  // B: all open + thumb tucked/across palm
  if (allOpen && idxUp && midUp && ringUp && pinkyUp && thumbTucked(lm)) {
    return "B";
  }

  // W: index+middle+ring open, pinky closed
  if (f.io && f.mo && f.ro && f.pc && idxUp && midUp && ringUp) {
    return "W";
  }

  // --- GROUP 2: thumb+index touching ---

  // F: thumb+index touch, other 3 open upward
  if (thumbIdxTouch && f.mo && f.ro && f.po && midUp) {
    return "F";
  }

  // --- GROUP 3: two fingers up ---

  // Y: pinky + thumb out, index+middle+ring closed
  if (f.po && pinkyUp && f.ic && f.mc && f.rc && thumbOutSide(lm)) {
    return "Y";
  }

  // K: index up + middle angled, thumb touching middle area, ring+pinky closed
  if (f.io && idxUp && f.rc && f.pc) {
    const thumbNearMid = dist(lm[THUMB_TIP], lm[MIDDLE_PIP]) < ps * 0.35;
    if (thumbNearMid && midUp) {
      return "K";
    }
  }

  // V: index + middle up, spread apart, ring+pinky closed
  if (f.io && f.mo && idxUp && midUp && f.rc && f.pc && idxMidSpread && !thumbIdxTouch) {
    return "V";
  }

  // R: index + middle up, crossed/touching, ring+pinky closed
  if (f.io && f.mo && idxUp && midUp && f.rc && f.pc && idxMidTouch) {
    return "R";
  }

  // U: index + middle up, close but not crossed, ring+pinky closed
  if (f.io && f.mo && idxUp && midUp && f.rc && f.pc) {
    return "U";
  }

  // H: index + middle pointing sideways, ring+pinky closed
  if (f.io && f.mo && f.rc && f.pc && !idxUp && !midUp && indexPointsSideways(lm)) {
    return "H";
  }

  // --- GROUP 4: one finger up ---

  // I: only pinky up
  if (f.po && pinkyUp && f.ic && f.mc && f.rc && !thumbOutSide(lm)) {
    return "I";
  }

  // D: index up, middle+ring+pinky closed, thumb touches middle
  if (f.io && idxUp && f.mc && f.rc && f.pc) {
    if (thumbMidTouch || tipsClose(lm, THUMB_TIP, MIDDLE_DIP, 0.35)) {
      return "D";
    }
  }

  // L: index up + thumb out forming L, middle+ring+pinky closed
  if (f.io && idxUp && threeClosed && thumbOutSide(lm) && !thumbIdxTouch) {
    const thumbHoriz = Math.abs(lm[THUMB_TIP].y - lm[THUMB_MCP].y) < 
                        Math.abs(lm[THUMB_TIP].x - lm[THUMB_MCP].x) * 0.8;
    if (thumbHoriz || true) {
      return "L";
    }
  }

  // 1: index up only, thumb not sticking out
  if (f.io && idxUp && threeClosed && !thumbOutSide(lm)) {
    return "1";
  }

  // X: index hooked, others closed
  if (isHooked(lm, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP) && f.mc && f.rc && f.pc) {
    return "X";
  }

  // G: index pointing sideways, others closed, thumb out
  if (f.io && indexPointsSideways(lm) && threeClosed && !idxUp) {
    return "G";
  }

  // --- GROUP 5: sideways/down pointing ---

  // P: like K but hand points down
  if (f.io && f.mo && f.rc && f.pc && handPointsDown(lm)) {
    return "P";
  }

  // Q: index+thumb pointing down, others closed
  if (f.io && threeClosed && tipBelowMcp(lm, INDEX_TIP, INDEX_MCP) && thumbOutSide(lm)) {
    return "Q";
  }

  // --- GROUP 6: curved/partial ---

  // C: all fingers half-curled forming C shape
  if (!allOpen && !allClosed) {
    const iStr = fingerStraightness(lm, INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP);
    const mStr = fingerStraightness(lm, MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP);
    const rStr = fingerStraightness(lm, RING_MCP, RING_PIP, RING_DIP, RING_TIP);
    const pStr = fingerStraightness(lm, PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP);
    const allMidRange = [iStr, mStr, rStr, pStr].every(s => s > 0.55 && s < 0.85);
    if (allMidRange && thumbOutSide(lm)) {
      const gap = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
      if (gap > ps * 0.2 && gap < ps * 0.9) {
        return "C";
      }
    }
  }

  // O: fingers curved to meet thumb, forming circle
  if (!allOpen && thumbIdxTouch && !f.mo && !f.ro && !f.po) {
    return "O";
  }

  // --- GROUP 7: fist variants (all closed) ---

  if (allClosed) {
    // T: thumb pokes between index and middle  
    const thumbBetween = lm[THUMB_TIP].y < lm[INDEX_PIP].y &&
      dist(lm[THUMB_TIP], lm[INDEX_PIP]) < ps * 0.35;
    if (thumbBetween && !thumbAcrossPalm(lm)) {
      return "T";
    }

    // S: fist with thumb across front of fingers
    if (thumbAcrossPalm(lm) && !thumbOutSide(lm)) {
      return "S";
    }

    // M: fist with thumb under three fingers
    const fingersOverThumb = [INDEX_TIP, MIDDLE_TIP, RING_TIP].filter(
      tip => lm[tip].y < lm[THUMB_TIP].y
    ).length;
    if (fingersOverThumb >= 3) {
      return "M";
    }

    // N: fist with thumb under two fingers
    if (fingersOverThumb >= 2) {
      return "N";
    }

    // E: tight fist, thumb tucked
    if (thumbTucked(lm)) {
      return "E";
    }

    // A: fist with thumb beside (default fist)
    return "A";
  }

  // --- Fallback for partially closed hands ---

  // A-like: mostly closed fist with thumb out
  if (f.ic && f.mc && f.rc && f.pc && thumbOutSide(lm)) {
    return "A";
  }

  // S-like: mostly closed fist with thumb across  
  if (f.ic && f.mc && f.rc && f.pc) {
    return "S";
  }

  return null;
}

export class ASLWordAccumulator {
  private lastLetter: string | null = null;
  private lastLetterTime = 0;
  private sameLetterCount = 0;
  private words: string[] = [];
  private currentWord = "";

  private readonly CONFIRM_FRAMES = 6;
  private readonly LETTER_COOLDOWN_MS = 500;
  private readonly SPACE_TIMEOUT_MS = 2000;
  private lastAnyDetection = 0;

  addDetection(letter: string | null, timestamp: number): { 
    confirmedLetter: string | null; 
    currentWord: string; 
    words: string[];
    allText: string;
  } {
    if (letter === null) {
      if (this.currentWord.length > 0 && timestamp - this.lastAnyDetection > this.SPACE_TIMEOUT_MS) {
        this.words.push(this.currentWord);
        this.currentWord = "";
      }
      this.sameLetterCount = 0;
      this.lastLetter = null;
      return { 
        confirmedLetter: null, 
        currentWord: this.currentWord, 
        words: [...this.words],
        allText: this.getAllText()
      };
    }

    this.lastAnyDetection = timestamp;

    if (letter === this.lastLetter) {
      this.sameLetterCount++;
    } else {
      this.lastLetter = letter;
      this.sameLetterCount = 1;
    }

    let confirmedLetter: string | null = null;

    if (this.sameLetterCount === this.CONFIRM_FRAMES) {
      if (timestamp - this.lastLetterTime > this.LETTER_COOLDOWN_MS) {
        confirmedLetter = letter;
        this.currentWord += letter;
        this.lastLetterTime = timestamp;
      }
    }

    return {
      confirmedLetter,
      currentWord: this.currentWord,
      words: [...this.words],
      allText: this.getAllText()
    };
  }

  getAllText(): string {
    const parts = [...this.words];
    if (this.currentWord) parts.push(this.currentWord);
    return parts.join(" ");
  }

  addSpace(): void {
    if (this.currentWord.length > 0) {
      this.words.push(this.currentWord);
      this.currentWord = "";
    }
  }

  backspace(): void {
    if (this.currentWord.length > 0) {
      this.currentWord = this.currentWord.slice(0, -1);
    } else if (this.words.length > 0) {
      this.currentWord = this.words.pop()!;
      this.currentWord = this.currentWord.slice(0, -1);
    }
  }

  clear(): void {
    this.lastLetter = null;
    this.lastLetterTime = 0;
    this.sameLetterCount = 0;
    this.words = [];
    this.currentWord = "";
  }
}
