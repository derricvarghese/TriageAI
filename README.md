# 🩺 TriageAI — Medical Symptom Triage Agent

An AI-powered multi-step medical triage agent with RAG (Retrieval-Augmented Generation), patient memory, and structured tool use. Built with Claude API + FastAPI + vanilla HTML/CSS.

## 🏗️ Architecture

```
User Message
    ↓
[INTAKE AGENT]          ← Collects name, age, main complaint
    ↓
[REASONING LOOP]        ← Asks targeted follow-up questions (multi-turn memory)
    ↓
[TOOL: search_medical_knowledge]   ← RAG over medical KB
[TOOL: check_red_flags]            ← Emergency detection
    ↓
[TOOL: save_triage_result]         ← Structured output + patient memory
    ↓
Triage Card: EMERGENCY / URGENT / SEMI_URGENT / ROUTINE
```

## 🚀 Setup

### 1. Clone & install backend
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
export ANTHROPIC_API_KEY=your_key_here
```

### 3. Run the backend
```bash
uvicorn main:app --reload --port 8000
```

### 4. Open the frontend
Just open `frontend/index.html` in your browser — no build step needed.

## 🧠 Agent Features

| Feature | Description |
|---|---|
| **Multi-step reasoning** | Agent decides when to ask more questions vs. analyze |
| **Tool use** | `search_medical_knowledge`, `check_red_flags`, `save_triage_result` |
| **RAG** | Keyword-based retrieval over 12-category medical knowledge base |
| **Memory** | Full conversation history maintained per session |
| **Safety layer** | Hard-coded red flag detection, always recommends real doctor |
| **Structured output** | JSON triage card with urgency, reasoning, follow-up instructions |

## 📁 Project Structure
```
triageai/
├── backend/
│   ├── main.py           # FastAPI app + agent loop
│   ├── knowledge_base.py # Medical RAG knowledge base + search
│   ├── memory.py         # Patient session memory
│   └── requirements.txt
└── frontend/
    └── index.html        # Full UI (single file, no build needed)
```

## 🎯 Hackathon Talking Points

1. **Agentic loop** — not just a single prompt; the agent decides what to do next
2. **Tool use** — 3 custom tools the agent orchestrates autonomously
3. **RAG** — medical knowledge base the agent queries in real-time
4. **Memory** — patient history persists across the conversation
5. **Safety-first** — red flag detection + disclaimer always present
6. **Structured output** — machine-readable triage result, not just freeform text

## ⚠️ Disclaimer

TriageAI is a hackathon demonstration only. Not a medical device. Not for clinical use. Always consult a licensed healthcare provider.
