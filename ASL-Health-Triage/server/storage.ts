import { db } from "./db";
import { triageSessions } from "@shared/schema";
import type { 
  TriageSession, 
  InsertTriageSession,
  UpdateTriageSessionRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getTriageSessions(): Promise<TriageSession[]>;
  getTriageSession(id: number): Promise<TriageSession | undefined>;
  createTriageSession(session: InsertTriageSession): Promise<TriageSession>;
  updateTriageSession(id: number, session: UpdateTriageSessionRequest): Promise<TriageSession>;
}

export class DatabaseStorage implements IStorage {
  async getTriageSessions(): Promise<TriageSession[]> {
    return await db.select().from(triageSessions);
  }

  async getTriageSession(id: number): Promise<TriageSession | undefined> {
    const [session] = await db.select().from(triageSessions).where(eq(triageSessions.id, id));
    return session;
  }

  async createTriageSession(session: InsertTriageSession): Promise<TriageSession> {
    const [newSession] = await db.insert(triageSessions).values(session).returning();
    return newSession;
  }

  async updateTriageSession(id: number, session: UpdateTriageSessionRequest): Promise<TriageSession> {
    const [updatedSession] = await db.update(triageSessions)
      .set(session)
      .where(eq(triageSessions.id, id))
      .returning();
    return updatedSession;
  }
}

export const storage = new DatabaseStorage();
