from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import json
import re
from datetime import datetime
from knowledge_base import MEDICAL_KB, search_knowledge_base
from memory import PatientMemory

app = FastAPI(title="TriageAI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic()
memory_store = PatientMemory()

# ─── Schemas ────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    patient_name: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    triage_result: Optional[dict] = None
    stage: str  # intake | questioning | analysis | result

# ─── Agent Tools ────────────────────────────────────────────────────────────

tools = [
    {
        "name": "search_medical_knowledge",
        "description": "Search the medical knowledge base for information about symptoms, conditions, red flags, and treatment urgency. Use this to look up symptom patterns and assess severity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Symptom or condition to search for (e.g. 'chest pain shortness of breath', 'high fever child')"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "check_red_flags",
        "description": "Check if any mentioned symptoms are critical red flags that require immediate emergency care (911). Always call this before giving a triage result.",
        "input_schema": {
            "type": "object",
            "properties": {
                "symptoms": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of symptoms the patient has described"
                }
            },
            "required": ["symptoms"]
        }
    },
    {
        "name": "save_triage_result",
        "description": "Save the final triage assessment to patient memory. Call this when you have enough information to make a triage decision.",
        "input_schema": {
            "type": "object",
            "properties": {
                "urgency_level": {
                    "type": "string",
                    "enum": ["EMERGENCY", "URGENT", "SEMI_URGENT", "ROUTINE"],
                    "description": "Triage urgency level"
                },
                "urgency_color": {
                    "type": "string",
                    "enum": ["red", "orange", "yellow", "green"],
                    "description": "Color code matching urgency level"
                },
                "primary_concern": {
                    "type": "string",
                    "description": "Main medical concern identified"
                },
                "symptoms_summary": {
                    "type": "string",
                    "description": "Brief summary of reported symptoms"
                },
                "recommendation": {
                    "type": "string",
                    "description": "Clear action recommendation for the patient"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Clinical reasoning behind this triage decision"
                },
                "follow_up_instructions": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of specific follow-up instructions or warning signs to watch for"
                }
            },
            "required": ["urgency_level", "urgency_color", "primary_concern", "symptoms_summary", "recommendation", "reasoning", "follow_up_instructions"]
        }
    }
]

# ─── Tool Execution ──────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict, session_id: str) -> str:
    if tool_name == "search_medical_knowledge":
        results = search_knowledge_base(tool_input["query"])
        return json.dumps(results)
    
    elif tool_name == "check_red_flags":
        symptoms = [s.lower() for s in tool_input["symptoms"]]
        red_flags = [
            "chest pain", "chest tightness", "difficulty breathing", "shortness of breath",
            "stroke", "facial drooping", "arm weakness", "slurred speech",
            "unconscious", "unresponsive", "seizure", "severe bleeding",
            "anaphylaxis", "throat closing", "severe allergic", "overdose",
            "suicidal", "self-harm", "poisoning", "head injury", "severe head",
            "coughing blood", "vomiting blood", "blood in stool",
            "severe abdominal", "cannot breathe", "turning blue", "cyanosis"
        ]
        found_flags = []
        for symptom in symptoms:
            for flag in red_flags:
                if flag in symptom or any(w in symptom for w in flag.split()):
                    found_flags.append(flag)
        
        if found_flags:
            return json.dumps({
                "emergency": True,
                "matched_flags": list(set(found_flags)),
                "action": "CALL 911 IMMEDIATELY or go to nearest Emergency Room"
            })
        return json.dumps({"emergency": False, "matched_flags": []})

    elif tool_name == "save_triage_result":
        memory_store.save_triage(session_id, tool_input)
        return json.dumps({"saved": True, "result": tool_input})
    
    return json.dumps({"error": "Unknown tool"})

# ─── Agent Loop ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are TriageAI, an expert medical triage assistant agent. You guide patients through a structured symptom assessment to determine how urgently they need medical care.

## Your Agent Loop
1. **INTAKE**: Greet the user warmly, ask their name and age if not known, then ask them to describe their main symptom or concern.
2. **QUESTIONING**: Ask focused follow-up questions one at a time. Gather: duration, severity (1-10), associated symptoms, relevant history, medications, allergies. Ask 3-5 targeted questions — don't overwhelm.
3. **ANALYSIS**: Once you have enough information, use your tools: first `search_medical_knowledge` to look up relevant conditions, then `check_red_flags` to check for emergencies. 
4. **RESULT**: Call `save_triage_result` with your structured assessment, then explain the result clearly and compassionately to the patient.

## Triage Levels
- 🔴 EMERGENCY: Life-threatening, call 911 now
- 🟠 URGENT: Serious, go to ER or urgent care within hours
- 🟡 SEMI_URGENT: See a doctor today or tomorrow
- 🟢 ROUTINE: Schedule an appointment, manage at home for now

## Rules
- ALWAYS use check_red_flags before finalizing any triage
- ALWAYS recommend the patient consult a real healthcare provider — you are a triage aid, not a replacement for medical care
- Be warm, calm, and reassuring — patients may be anxious
- Ask one question at a time during intake
- If unsure, always triage higher (more urgent) not lower
- Never diagnose definitively — use language like "this may suggest" or "could indicate"
- Keep responses concise and clear"""

def run_agent(session_id: str, user_message: str, patient_name: Optional[str]) -> dict:
    # Load or create session memory
    session = memory_store.get_session(session_id)
    if patient_name and not session.get("patient_name"):
        memory_store.set_patient_name(session_id, patient_name)
    
    # Add user message to history
    memory_store.add_message(session_id, "user", user_message)
    messages = memory_store.get_messages(session_id)
    
    triage_result = None
    final_reply = ""
    
    # Agentic loop — runs until no more tool calls
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages
        )
        
        # Check stop reason
        if response.stop_reason == "end_turn":
            # Extract text reply
            for block in response.content:
                if hasattr(block, "text"):
                    final_reply = block.text
            memory_store.add_message(session_id, "assistant", final_reply)
            break
        
        elif response.stop_reason == "tool_use":
            # Process all tool calls
            tool_results = []
            assistant_content = response.content
            
            for block in response.content:
                if block.type == "tool_use":
                    tool_output = execute_tool(block.name, block.input, session_id)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": tool_output
                    })
                    
                    # Capture triage result if saved
                    if block.name == "save_triage_result":
                        triage_result = block.input
            
            # Add assistant response and tool results to messages
            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})
        
        else:
            break
    
    # Determine conversation stage
    msg_count = len(memory_store.get_messages(session_id))
    if triage_result:
        stage = "result"
    elif msg_count <= 2:
        stage = "intake"
    elif msg_count <= 8:
        stage = "questioning"
    else:
        stage = "analysis"
    
    return {
        "reply": final_reply,
        "triage_result": triage_result,
        "stage": stage
    }

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        result = run_agent(req.session_id, req.message, req.patient_name)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history/{session_id}")
async def get_history(session_id: str):
    return {
        "session": memory_store.get_session(session_id),
        "messages": memory_store.get_messages(session_id)
    }

@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    memory_store.clear_session(session_id)
    return {"cleared": True}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
