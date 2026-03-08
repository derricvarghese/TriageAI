# ASOwl - ASL Health Triage

Breaking the language barrier in emergency healthcare through AI-powered sign language recognition and facial pain analysis.

## Frontend
- **Using**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Features**:
    - **Real-time ASL Recognition**: Hand landmark tracking and fingerspelling interpretation.
    - **Facial Pain Analysis**: Computer vision detection of distress, pain levels, and critical clinical indicators.
    - **Interactive Triage Chat**: AI-driven medical intake interview with empathetic responses.
    - **Immersive UI**: Premium "Starry Night" aesthetic designed to calm patients in high-stress environments.

## Backend
- **Using**: Express.js + TypeScript
- **Storage**: PostgreSQL + Drizzle ORM
- **Endpoints**:
    - `POST /api/chat`: Processes ASL text and visual metadata to drive the diagnostic conversation.
    - `POST /api/triage-sessions`: Initializes a new patient intake and vision scanning session.
    - `GET /api/triage-sessions`: Retrieves history of past triage assessments for medical staff.
    - `PATCH /api/triage-sessions/:id`: Binds AI analysis and urgency levels to a specific patient record.

## AI & Computer Vision
- **Generative AI**: Google Gemini 1.5 Pro API
    - **Analysis**: Synthesizes visual pain data and ASL input into clinical triage summaries.
    - **Conversational**: Conducts intelligent, context-aware medical questioning.
- **Vision Models**:
    - **Google MediaPipe**: 21-point 3D hand landmarking for gesture recognition.
    - **FaceBlaze**: Sub-millisecond face detection for real-time tracking.
- **Agentic Partner**: Google Antigravity
    - Facilitated full-stack implementation, architectural planning, and premium UI polish.

## Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables: `GEMINI_API_KEY`
3. Run development server: `npm run dev`
