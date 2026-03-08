import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { analyzeTriageData, triageChat } from "./gemini";

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please wait a moment and try again." },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

async function seedDatabase() {
  const existingSessions = await storage.getTriageSessions();
  if (existingSessions.length === 0) {
    await storage.createTriageSession({
      patientName: "John Doe",
      age: 45,
      detectedHandSignals: ["PAIN", "CHEST"],
      faceStatus: "Expressions of Pain",
      symptomsNotes: "Patient is experiencing chest pain",
      urgencyLevel: "Critical"
    });
    
    await storage.createTriageSession({
      patientName: "Jane Smith",
      age: 28,
      detectedHandSignals: ["HEADACHE"],
      faceStatus: "Normal",
      symptomsNotes: "Mild headache since morning",
      urgencyLevel: "Low"
    });
  }
}

const analyzeInput = z.object({
  patientName: z.string().min(1),
  age: z.number().int().min(0),
  detectedHandSignals: z.array(z.string()),
  faceStatus: z.string(),
  symptomsNotes: z.string().optional().default(""),
});

const chatInput = z.object({
  messages: z.array(z.object({
    role: z.enum(["assistant", "user"]),
    content: z.string(),
    timestamp: z.number(),
  })),
  patientName: z.string().min(1),
  age: z.number().int().min(0),
  detectedSignals: z.array(z.string()).optional().default([]),
  faceStatus: z.string().optional().default("Normal"),
  faceDescriptions: z.array(z.string()).optional().default([]),
  facePainLevel: z.number().optional(),
  faceCriticalIndicators: z.array(z.string()).optional().default([]),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  seedDatabase().catch(console.error);

  app.use("/api/", apiLimiter);

  app.get(api.triageSessions.list.path, async (req, res) => {
    const sessions = await storage.getTriageSessions();
    res.json(sessions);
  });

  app.get(api.triageSessions.get.path, async (req, res) => {
    const session = await storage.getTriageSession(Number(req.params.id));
    if (!session) {
      return res.status(404).json({ message: "Triage session not found" });
    }
    res.json(session);
  });

  app.post(api.triageSessions.create.path, async (req, res) => {
    try {
      const input = api.triageSessions.create.input.parse(req.body);
      const session = await storage.createTriageSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.triageSessions.update.path, async (req, res) => {
    try {
      const input = api.triageSessions.update.input.parse(req.body);
      const session = await storage.updateTriageSession(Number(req.params.id), input);
      if (!session) {
         return res.status(404).json({ message: "Triage session not found" });
      }
      res.json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/analyze", geminiLimiter, async (req, res) => {
    try {
      const input = analyzeInput.parse(req.body);
      const result = await analyzeTriageData({
        patientName: input.patientName,
        age: input.age,
        detectedHandSignals: input.detectedHandSignals,
        faceStatus: input.faceStatus,
        symptomsNotes: input.symptomsNotes,
      });
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Gemini analysis error:", err.message);
      res.status(500).json({ message: "AI analysis failed. Please try again." });
    }
  });

  app.post("/api/chat", geminiLimiter, async (req, res) => {
    try {
      const input = chatInput.parse(req.body);
      const result = await triageChat({
        messages: input.messages,
        patientName: input.patientName,
        age: input.age,
        detectedSignals: input.detectedSignals,
        faceStatus: input.faceStatus,
        faceDescriptions: input.faceDescriptions,
        facePainLevel: input.facePainLevel,
        faceCriticalIndicators: input.faceCriticalIndicators,
      });
      res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Chat error:", err.message);
      res.status(500).json({ message: "Chat failed. Please try again." });
    }
  });

  return httpServer;
}
