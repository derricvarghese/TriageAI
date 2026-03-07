"""
Patient Memory System for TriageAI
Manages per-session conversation history and triage records.
In production, replace with Redis or a database.
"""

from datetime import datetime
from typing import Optional


class PatientMemory:
    def __init__(self):
        # In-memory store: session_id -> session data
        self._sessions: dict[str, dict] = {}

    def get_session(self, session_id: str) -> dict:
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "session_id": session_id,
                "patient_name": None,
                "created_at": datetime.now().isoformat(),
                "triage_history": [],
                "messages": []
            }
        return self._sessions[session_id]

    def set_patient_name(self, session_id: str, name: str):
        session = self.get_session(session_id)
        session["patient_name"] = name

    def add_message(self, session_id: str, role: str, content: str):
        session = self.get_session(session_id)
        session["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })

    def get_messages(self, session_id: str) -> list[dict]:
        """Returns messages in Anthropic API format (role + content only)."""
        session = self.get_session(session_id)
        return [
            {"role": m["role"], "content": m["content"]}
            for m in session["messages"]
        ]

    def save_triage(self, session_id: str, triage_data: dict):
        session = self.get_session(session_id)
        triage_data["timestamp"] = datetime.now().isoformat()
        session["triage_history"].append(triage_data)

    def get_triage_history(self, session_id: str) -> list[dict]:
        session = self.get_session(session_id)
        return session.get("triage_history", [])

    def clear_session(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]
