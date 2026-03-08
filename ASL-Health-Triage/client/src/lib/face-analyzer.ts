interface BlendshapeCategory {
  categoryName: string;
  score: number;
}

export interface FaceAnalysis {
  overallStatus: string;
  painLevel: number;
  descriptions: string[];
  details: FaceDetails;
  criticalIndicators: string[];
}

export interface FaceDetails {
  eyes: string;
  eyebrows: string;
  mouth: string;
  jaw: string;
  skin: string;
  overall: string;
}

function getScore(shapes: BlendshapeCategory[], name: string): number {
  return shapes.find(s => s.categoryName === name)?.score || 0;
}

export function analyzeFace(blendshapes: BlendshapeCategory[]): FaceAnalysis {
  const s = (name: string) => getScore(blendshapes, name);

  const browDownL = s("browDownLeft");
  const browDownR = s("browDownRight");
  const browInnerUp = s("browInnerUp");
  const browOuterUpL = s("browOuterUpLeft");
  const browOuterUpR = s("browOuterUpRight");

  const eyeSquintL = s("eyeSquintLeft");
  const eyeSquintR = s("eyeSquintRight");
  const eyeWideL = s("eyeWideLeft");
  const eyeWideR = s("eyeWideRight");
  const eyeBlinkL = s("eyeBlinkLeft");
  const eyeBlinkR = s("eyeBlinkRight");
  const eyeLookUpL = s("eyeLookUpLeft");
  const eyeLookUpR = s("eyeLookUpRight");
  const eyeLookDownL = s("eyeLookDownLeft");
  const eyeLookDownR = s("eyeLookDownRight");

  const jawOpen = s("jawOpen");
  const jawForward = s("jawForward");
  const jawLeft = s("jawLeft");
  const jawRight = s("jawRight");

  const mouthClose = s("mouthClose");
  const mouthFrownL = s("mouthFrownLeft");
  const mouthFrownR = s("mouthFrownRight");
  const mouthSmileL = s("mouthSmileLeft");
  const mouthSmileR = s("mouthSmileRight");
  const mouthPucker = s("mouthPucker");
  const mouthShrugUpper = s("mouthShrugUpper");
  const mouthShrugLower = s("mouthShrugLower");
  const mouthPressL = s("mouthPressLeft");
  const mouthPressR = s("mouthPressRight");
  const mouthStretchL = s("mouthStretchLeft");
  const mouthStretchR = s("mouthStretchRight");
  const mouthRollLower = s("mouthRollLower");
  const mouthRollUpper = s("mouthRollUpper");
  const mouthDimpleL = s("mouthDimpleLeft");
  const mouthDimpleR = s("mouthDimpleRight");
  const mouthUpperUpL = s("mouthUpperUpLeft");
  const mouthUpperUpR = s("mouthUpperUpRight");
  const mouthLowerDownL = s("mouthLowerDownLeft");
  const mouthLowerDownR = s("mouthLowerDownRight");

  const cheekPuff = s("cheekPuff");
  const cheekSquintL = s("cheekSquintLeft");
  const cheekSquintR = s("cheekSquintRight");
  const noseSneerL = s("noseSneerLeft");
  const noseSneerR = s("noseSneerRight");

  const descriptions: string[] = [];
  const criticalIndicators: string[] = [];
  let painLevel = 0;

  const avgBrowDown = (browDownL + browDownR) / 2;
  const avgEyeSquint = (eyeSquintL + eyeSquintR) / 2;
  const avgEyeWide = (eyeWideL + eyeWideR) / 2;
  const avgMouthFrown = (mouthFrownL + mouthFrownR) / 2;
  const avgMouthSmile = (mouthSmileL + mouthSmileR) / 2;
  const avgMouthPress = (mouthPressL + mouthPressR) / 2;
  const avgMouthStretch = (mouthStretchL + mouthStretchR) / 2;
  const avgCheekSquint = (cheekSquintL + cheekSquintR) / 2;
  const avgNoseSneer = (noseSneerL + noseSneerR) / 2;
  const avgBrowOuterUp = (browOuterUpL + browOuterUpR) / 2;

  let eyeDesc = "Eyes appear normal and relaxed";
  if (avgEyeSquint > 0.5 && avgCheekSquint > 0.3) {
    eyeDesc = "Eyes tightly squinted, cheeks raised — wincing";
    painLevel += 3;
    descriptions.push("Patient is squinting hard, suggesting sharp pain or bright-light sensitivity");
  } else if (avgEyeSquint > 0.35) {
    eyeDesc = "Eyes partially squinted";
    painLevel += 1;
    descriptions.push("Eyes are narrowed, possibly from discomfort");
  } else if (avgEyeWide > 0.5) {
    eyeDesc = "Eyes wide open — alert or startled";
    descriptions.push("Eyes are noticeably wide, suggesting surprise, fear, or acute distress");
    if (avgEyeWide > 0.7) {
      criticalIndicators.push("Extremely wide eyes may indicate shock or acute fear");
      painLevel += 2;
    }
  }

  if ((eyeBlinkL > 0.7) !== (eyeBlinkR > 0.7)) {
    eyeDesc += ", one eye appears more closed than the other";
    descriptions.push("Asymmetric eye closure detected — possible facial nerve issue or localized pain");
    criticalIndicators.push("Facial asymmetry detected (uneven eye closure)");
    painLevel += 2;
  }

  if (avgEyeWide > 0.4 && eyeLookUpL > 0.5 && eyeLookUpR > 0.5) {
    descriptions.push("Eyes wide and looking upward — may indicate dizziness or lightheadedness");
  }

  let browDesc = "Eyebrows in neutral position";
  if (browInnerUp > 0.5 && avgBrowOuterUp > 0.3) {
    browDesc = "Eyebrows raised — surprised or alarmed expression";
    descriptions.push("Eyebrows significantly raised, indicating surprise or alarm");
  } else if (browInnerUp > 0.45) {
    browDesc = "Inner eyebrows raised — worried expression";
    painLevel += 1;
    descriptions.push("Inner brows raised suggesting worry or concern");
  } else if (avgBrowDown > 0.5) {
    browDesc = "Eyebrows furrowed";
    painLevel += 2;
    descriptions.push("Brows are furrowed, often associated with pain concentration or frustration");
  } else if (avgBrowDown > 0.3) {
    browDesc = "Slight brow tension";
    painLevel += 1;
  }

  let mouthDesc = "Mouth in relaxed position";
  if (jawOpen > 0.6) {
    mouthDesc = "Mouth wide open";
    if (avgMouthStretch > 0.3 || avgEyeSquint > 0.3) {
      descriptions.push("Mouth open wide with facial tension — possible grimace of pain or cry");
      painLevel += 3;
      criticalIndicators.push("Open-mouth grimace suggests significant pain");
    } else {
      descriptions.push("Mouth is wide open — could be speaking, breathing through mouth, or in distress");
    }
  } else if (avgMouthFrown > 0.4) {
    mouthDesc = "Mouth turned downward — frowning";
    painLevel += 2;
    descriptions.push("Noticeable frown, indicating sadness, discomfort, or pain");
  } else if (avgMouthFrown > 0.2) {
    mouthDesc = "Slight frown";
    painLevel += 1;
  } else if (avgMouthSmile > 0.4) {
    mouthDesc = "Mouth shows a smile";
    descriptions.push("Patient appears to be smiling — may indicate comfort or social masking of pain");
  }

  if (avgMouthPress > 0.5) {
    mouthDesc += ", lips pressed together tightly";
    painLevel += 2;
    descriptions.push("Lips are pressed together firmly — common pain-suppression behavior");
  }

  if (mouthRollLower > 0.4 || mouthRollUpper > 0.4) {
    descriptions.push("Lips rolled inward — may indicate anxiety or pain suppression");
    painLevel += 1;
  }

  if (mouthPucker > 0.5) {
    descriptions.push("Lips puckered — could indicate nausea or difficulty breathing");
  }

  let jawDesc = "Jaw in normal position";
  if (jawOpen > 0.3 && jawForward > 0.3) {
    jawDesc = "Jaw pushed forward and open — possible teeth grinding or jaw tension";
    painLevel += 1;
    descriptions.push("Jaw appears tense and thrust forward");
  } else if (jawOpen > 0.4) {
    jawDesc = "Jaw open";
  }
  if (Math.abs(jawLeft - jawRight) > 0.3) {
    jawDesc += ", shifted to one side";
    descriptions.push("Jaw shifted to one side — may indicate jaw pain or dental issue");
    painLevel += 1;
  }

  if (avgNoseSneer > 0.4) {
    descriptions.push("Nose wrinkling/sneering detected — often associated with disgust, nausea, or sharp pain");
    painLevel += 2;
  }

  if (cheekPuff > 0.5) {
    descriptions.push("Cheeks puffed out — may indicate held breath, nausea, or trying to manage pain");
    painLevel += 1;
  }

  const isPainGrimace = avgEyeSquint > 0.3 && avgBrowDown > 0.3 && (avgMouthFrown > 0.2 || avgMouthPress > 0.3 || jawOpen > 0.3);
  if (isPainGrimace) {
    painLevel += 2;
    if (!descriptions.some(d => d.includes("grimace"))) {
      descriptions.push("Overall facial pattern suggests a pain grimace (squinting + furrowed brows + mouth tension)");
    }
  }

  const isDistress = avgEyeWide > 0.4 && browInnerUp > 0.4 && (jawOpen > 0.3 || avgMouthFrown > 0.3);
  if (isDistress) {
    criticalIndicators.push("Facial expression pattern consistent with acute distress");
    painLevel += 2;
  }

  const asymmetryScore = Math.abs(mouthSmileL - mouthSmileR) + Math.abs(mouthFrownL - mouthFrownR) + Math.abs(browDownL - browDownR);
  if (asymmetryScore > 0.8) {
    criticalIndicators.push("Significant facial asymmetry detected — could indicate stroke or Bell's palsy");
    descriptions.push("Notable asymmetry between left and right side of the face");
    painLevel += 3;
  }

  painLevel = Math.min(10, Math.max(0, painLevel));

  let overallStatus: string;
  let skinDesc: string;
  let overallDesc: string;

  if (painLevel >= 7) {
    overallStatus = "Severe Distress Detected";
    skinDesc = "Facial muscles visibly tense";
    overallDesc = "Patient shows signs of significant pain or distress";
  } else if (painLevel >= 4) {
    overallStatus = "Moderate Discomfort";
    skinDesc = "Some facial tension present";
    overallDesc = "Patient appears to be experiencing moderate discomfort";
  } else if (painLevel >= 2) {
    overallStatus = "Mild Discomfort";
    skinDesc = "Slight facial tension";
    overallDesc = "Patient shows subtle signs of discomfort";
  } else if (descriptions.length > 0) {
    overallStatus = "Alert / Attentive";
    skinDesc = "Face appears relaxed";
    overallDesc = "Patient appears alert with no clear signs of distress";
  } else {
    overallStatus = "Normal";
    skinDesc = "Face appears relaxed";
    overallDesc = "Patient appears calm and comfortable";
  }

  if (descriptions.length === 0) {
    descriptions.push("No notable facial expressions detected");
  }

  return {
    overallStatus,
    painLevel,
    descriptions,
    criticalIndicators,
    details: {
      eyes: eyeDesc,
      eyebrows: browDesc,
      mouth: mouthDesc,
      jaw: jawDesc,
      skin: skinDesc,
      overall: overallDesc,
    },
  };
}

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];
const LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const LEFT_EYEBROW = [276, 283, 282, 295, 300];
const RIGHT_EYEBROW = [46, 53, 52, 65, 70];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const NOSE_BRIDGE = [168, 6, 197, 195, 5];

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export function drawFaceLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  painLevel: number
) {
  if (!landmarks || landmarks.length === 0) return;

  const mirrorX = (x: number) => (1 - x) * canvasWidth;

  let color: string;
  if (painLevel >= 7) {
    color = "rgba(239, 68, 68, 0.7)";
  } else if (painLevel >= 4) {
    color = "rgba(251, 146, 60, 0.6)";
  } else if (painLevel >= 2) {
    color = "rgba(250, 204, 21, 0.5)";
  } else {
    color = "rgba(74, 222, 128, 0.5)";
  }

  const drawContour = (indices: number[], closed = true, lineWidth = 1.5) => {
    if (indices.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    const first = landmarks[indices[0]];
    if (!first) return;
    ctx.moveTo(mirrorX(first.x), first.y * canvasHeight);
    for (let i = 1; i < indices.length; i++) {
      const p = landmarks[indices[i]];
      if (p) ctx.lineTo(mirrorX(p.x), p.y * canvasHeight);
    }
    if (closed) ctx.closePath();
    ctx.stroke();
  };

  drawContour(FACE_OVAL, true, 1);
  drawContour(LEFT_EYE, true, 1.5);
  drawContour(RIGHT_EYE, true, 1.5);
  drawContour(LEFT_EYEBROW, false, 1.5);
  drawContour(RIGHT_EYEBROW, false, 1.5);
  drawContour(LIPS_OUTER, true, 1.5);
  drawContour(NOSE_BRIDGE, false, 1);

  const noseTip = landmarks[4];
  if (noseTip) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mirrorX(noseTip.x), noseTip.y * canvasHeight, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
