# ASOwl - ASL Health Triage System

## Overview
A web application for ASL (American Sign Language) users to perform health triage using camera-based hand signal and facial expression detection. Features an Akinator-style interactive medical chatbot powered by Gemini AI, and an ASOwl-branded dark landing page with scroll-driven animations.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Firebase Authentication (Google sign-in via popup)
- **Vision**: MediaPipe Tasks Vision (hand landmarks + face landmarks with blendshapes)
- **Camera**: react-webcam
- **AI**: Google Gemini 2.5 Flash (conversational triage + one-shot analysis)

## Key Design
- Dark theme inspired by ASOwl aesthetic
- Fonts: Cormorant Garamond (serif display), Space Mono (monospace body)
- Gold accent color (#c8b48a / HSL 38 35% 66%)
- Scroll-driven landing page with 240 owl frame animation

## Routes
- `/` - Landing page (ASOwl branded hero with scroll animation)
- `/login` - Firebase Google sign-in page
- `/dashboard` - Triage session queue/history (protected)
- `/new-session` - Akinator-style medical chatbot with optional ASL camera (protected)

## Triage Flow (New Session)
1. **Intake**: Patient enters name and age
2. **Chat**: Gemini AI asks questions one at a time, narrowing down symptoms
3. **Assessment**: AI provides urgency level, clinical assessment, follow-up actions
4. **Save**: Session saved with full chat history to database

## API Endpoints
- `GET /api/triage-sessions` - List all sessions
- `GET /api/triage-sessions/:id` - Get single session
- `POST /api/triage-sessions` - Create session
- `PUT /api/triage-sessions/:id` - Update session
- `POST /api/analyze` - One-shot Gemini AI triage analysis (rate limited: 10 req/min)
- `POST /api/chat` - Conversational Gemini AI triage chat (rate limited: 10 req/min)

## Rate Limiting
- `/api/analyze` and `/api/chat` - 10 requests per minute (Gemini AI)
- `/api/*` - 60 requests per minute (general API)

## Key Files
- `shared/schema.ts` - Drizzle schema + types (includes chatHistory, aiAssessment fields)
- `shared/routes.ts` - API contract with Zod schemas
- `server/routes.ts` - Express route handlers
- `server/storage.ts` - DatabaseStorage layer
- `server/gemini.ts` - Gemini AI service (analyzeTriageData + triageChat)
- `server/db.ts` - Database connection
- `client/src/pages/Landing.tsx` - ASOwl landing page with scroll animation
- `client/src/pages/Dashboard.tsx` - Triage queue
- `client/src/pages/NewSession.tsx` - Akinator-style chat triage UI
- `client/src/components/camera/VisionScanner.tsx` - MediaPipe vision + ASL detection
- `client/src/hooks/use-triage-sessions.ts` - API hooks (including useTriageChat)
- `client/src/lib/asl-classifier.ts` - ASL fingerspelling classifier + word accumulator

## Auth Files
- `client/src/lib/firebase.ts` - Firebase app init + auth/provider exports
- `client/src/hooks/use-auth.tsx` - AuthProvider context + useAuth hook
- `client/src/pages/Login.tsx` - Google sign-in page

## Dependencies
- firebase - Firebase Auth SDK
- @mediapipe/tasks-vision - Hand/face detection
- react-webcam - Camera access
- framer-motion - Animations
- date-fns - Date formatting
- @google/generative-ai - Gemini AI SDK
- express-rate-limit - API rate limiting
