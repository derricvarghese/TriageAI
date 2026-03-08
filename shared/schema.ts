import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["assistant", "user"]),
  content: z.string(),
  timestamp: z.number(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const triageSessions = pgTable("triage_sessions", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  detectedHandSignals: jsonb("detected_hand_signals").$type<string[]>().default([]).notNull(),
  faceStatus: text("face_status").notNull(),
  symptomsNotes: text("symptoms_notes"),
  urgencyLevel: text("urgency_level").notNull(),
  chatHistory: jsonb("chat_history").$type<ChatMessage[]>().default([]),
  aiAssessment: text("ai_assessment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTriageSessionSchema = createInsertSchema(triageSessions).omit({ 
  id: true, 
  createdAt: true 
});

export type TriageSession = typeof triageSessions.$inferSelect;
export type InsertTriageSession = z.infer<typeof insertTriageSessionSchema>;

export type CreateTriageSessionRequest = InsertTriageSession;
export type UpdateTriageSessionRequest = Partial<InsertTriageSession>;
export type TriageSessionResponse = TriageSession;
export type TriageSessionsListResponse = TriageSession[];
