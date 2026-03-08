import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const TRIAGE_SYSTEM_PROMPT = `You are ASOwl, a medical triage AI assistant for an ASL (American Sign Language) health triage system. Your role is to analyze patient data including detected hand signals, facial expressions, and symptom notes to provide a clinical assessment.

Given the patient information, provide:
1. A brief clinical assessment (2-3 sentences)
2. A recommended urgency level: Low, Medium, High, or Critical
3. Suggested follow-up actions (2-3 bullet points)
4. Any important safety notes

Be concise and professional. Always include a disclaimer that this is not a substitute for professional medical evaluation.

Respond ONLY with valid JSON in this exact format:
{
  "assessment": "string",
  "recommendedUrgency": "Low|Medium|High|Critical",
  "followUpActions": ["string"],
  "safetyNotes": "string"
}`;

const CHAT_SYSTEM_PROMPT = `You are ASOwl, an interactive medical triage chatbot. You guide patients through a symptom assessment by asking ONE question at a time, like a medical version of Akinator.

Your personality:
- Warm, calm, and reassuring
- Professional but approachable
- You use clear, simple language anyone can understand

You have access to real-time facial analysis from the patient's camera. This includes:
- Overall facial status (Normal, Mild Discomfort, Moderate Discomfort, Severe Distress)
- Estimated pain level (0-10) based on facial muscle tension
- Detailed observations about their eyes, eyebrows, mouth, and jaw
- Critical indicators like facial asymmetry or signs of stroke

When facial analysis data is provided, consider it in your assessment. If you notice signs of pain or distress from the facial analysis, acknowledge it empathetically (e.g., "I can see you seem to be in some discomfort. Let me ask a few questions to help figure out what's going on."). Use facial observations to corroborate or contrast with what the patient reports verbally. If there are CRITICAL facial indicators (like facial asymmetry), prioritize investigating those immediately.

Rules:
1. Ask only ONE question per message. Keep it short and focused.
2. Start by greeting the patient. If facial analysis shows discomfort, acknowledge it. Ask about their main concern/complaint.
3. Based on their answer, ask follow-up questions to narrow down:
   - Location of symptoms (where does it hurt?)
   - Duration (how long has this been going on?)
   - Severity (on a scale of 1-10, how bad is it?)
   - Character (sharp, dull, burning, aching?)
   - Associated symptoms (any other symptoms like fever, nausea?)
   - What makes it better or worse?
   - Relevant medical history
4. After gathering enough information (typically 5-8 questions), provide your assessment.
5. When ready to assess, respond with a special JSON format (see below).
6. If the patient mentions emergency symptoms (chest pain with shortness of breath, stroke symptoms, severe bleeding, difficulty breathing), IMMEDIATELY provide a Critical assessment and advise calling 911.
7. Keep track of what you've already asked — don't repeat questions.
8. If the patient's answer is unclear or seems like ASL-translated text (individual letters), try to interpret it and confirm with them.

For regular questions, respond with plain text only. No JSON, no markdown headers.

When you have enough information to make an assessment, respond with ONLY this JSON (no other text):
{
  "type": "assessment",
  "assessment": "Brief clinical assessment (2-3 sentences)",
  "recommendedUrgency": "Low|Medium|High|Critical",
  "followUpActions": ["action1", "action2", "action3"],
  "safetyNotes": "Important safety disclaimer",
  "summary": "One-line summary of the patient's condition"
}`;

export interface TriageAnalysisInput {
  patientName: string;
  age: number;
  detectedHandSignals: string[];
  faceStatus: string;
  symptomsNotes: string;
}

export interface TriageAnalysisResult {
  assessment: string;
  recommendedUrgency: string;
  followUpActions: string[];
  safetyNotes: string;
}

export interface ChatInput {
  messages: ChatMessage[];
  patientName: string;
  age: number;
  detectedSignals?: string[];
  faceStatus?: string;
  faceDescriptions?: string[];
  facePainLevel?: number;
  faceCriticalIndicators?: string[];
}

export interface ChatResponse {
  message: string;
  isAssessment: boolean;
  assessment?: TriageAnalysisResult & { summary?: string };
}

export async function analyzeTriageData(input: TriageAnalysisInput): Promise<TriageAnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyze this patient triage data:

Patient: ${input.patientName}, Age: ${input.age}
Detected ASL Hand Signals: ${input.detectedHandSignals.length > 0 ? input.detectedHandSignals.join(", ") : "None detected"}
Facial Expression Analysis: ${input.faceStatus}
Symptom Notes: ${input.symptomsNotes || "No additional notes"}

Provide your clinical triage assessment in the specified JSON format.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: TRIAGE_SYSTEM_PROMPT }] },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const text = result.response.text();

  let parsed: TriageAnalysisResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.assessment || !parsed.recommendedUrgency || !parsed.followUpActions) {
    throw new Error("Invalid response structure from Gemini");
  }

  return parsed;
}

export async function triageChat(input: ChatInput): Promise<ChatResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let contextPrefix = `Patient: ${input.patientName}, Age: ${input.age}`;
  
  if (input.detectedSignals?.length) {
    contextPrefix += `\nDetected ASL signals: ${input.detectedSignals.join(", ")}`;
  }
  
  if (input.faceStatus && input.faceStatus !== "Normal") {
    contextPrefix += `\nFacial expression overall: ${input.faceStatus}`;
  }

  if (input.facePainLevel !== undefined && input.facePainLevel > 0) {
    contextPrefix += `\nEstimated pain level from facial analysis: ${input.facePainLevel}/10`;
  }

  if (input.faceDescriptions?.length) {
    contextPrefix += `\nDetailed facial observations:\n${input.faceDescriptions.map(d => `- ${d}`).join("\n")}`;
  }

  if (input.faceCriticalIndicators?.length) {
    contextPrefix += `\nCRITICAL facial indicators:\n${input.faceCriticalIndicators.map(d => `- ${d}`).join("\n")}`;
  }

  const contextMessage = {
    role: "user" as const,
    parts: [{ text: `${contextPrefix}\n\nPlease start the triage assessment for this patient.` }],
  };

  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [contextMessage];

  if (input.messages.length > 0) {
    const firstAssistantIdx = input.messages.findIndex(m => m.role === "assistant");
    if (firstAssistantIdx >= 0) {
      contents.push({
        role: "model" as const,
        parts: [{ text: input.messages[firstAssistantIdx].content }],
      });
      for (let i = firstAssistantIdx + 1; i < input.messages.length; i++) {
        const msg = input.messages[i];
        contents.push({
          role: msg.role === "assistant" ? "model" as const : "user" as const,
          parts: [{ text: msg.content }],
        });
      }
    } else {
      for (const msg of input.messages) {
        contents.push({
          role: msg.role === "assistant" ? "model" as const : "user" as const,
          parts: [{ text: msg.content }],
        });
      }
    }
  }

  const result = await model.generateContent({
    contents,
    systemInstruction: { role: "model", parts: [{ text: CHAT_SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2048,
    },
  });

  const text = result.response.text().trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.type === "assessment") {
        return {
          message: text,
          isAssessment: true,
          assessment: {
            assessment: parsed.assessment,
            recommendedUrgency: parsed.recommendedUrgency,
            followUpActions: parsed.followUpActions || [],
            safetyNotes: parsed.safetyNotes || "",
            summary: parsed.summary,
          },
        };
      }
    }
  } catch {}

  return {
    message: text,
    isAssessment: false,
  };
}
