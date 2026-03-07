"""
Medical Knowledge Base for TriageAI RAG System
A curated set of symptom patterns, conditions, and urgency guidance.
"""

MEDICAL_KB = [
    # ── Cardiovascular ────────────────────────────────────────────────────────
    {
        "id": "cv001",
        "category": "Cardiovascular",
        "keywords": ["chest pain", "chest tightness", "chest pressure", "heart attack", "cardiac"],
        "content": "Chest pain or pressure is a serious symptom. Key differentiators: cardiac chest pain is often described as pressure/squeezing, may radiate to left arm, jaw, or back, associated with sweating, nausea, or shortness of breath. Typical MI presents within 30 min of onset. Always treat as EMERGENCY until proven otherwise. Even atypical presentations in diabetics or women may lack classic symptoms.",
        "urgency": "EMERGENCY",
        "red_flags": ["radiation to arm or jaw", "sweating", "nausea with chest pain", "sudden onset"]
    },
    {
        "id": "cv002",
        "category": "Cardiovascular",
        "keywords": ["palpitations", "heart racing", "irregular heartbeat", "skipped beats"],
        "content": "Palpitations range from benign (stress, caffeine, dehydration) to serious (arrhythmia). URGENT if: accompanied by dizziness, syncope, chest pain, or shortness of breath. ROUTINE if: brief, in healthy young person, related to caffeine/stress, no other symptoms.",
        "urgency": "SEMI_URGENT",
        "red_flags": ["dizziness with palpitations", "fainting", "history of heart disease"]
    },
    # ── Respiratory ───────────────────────────────────────────────────────────
    {
        "id": "resp001",
        "category": "Respiratory",
        "keywords": ["difficulty breathing", "shortness of breath", "can't breathe", "breathlessness", "dyspnea"],
        "content": "Acute shortness of breath is always serious. Causes range from anxiety/panic attacks to pulmonary embolism, asthma exacerbation, pneumonia, or heart failure. Assess: sudden vs gradual onset, SpO2 if available, presence of wheeze or stridor, fever. Any cyanosis (blue lips/fingertips) = EMERGENCY.",
        "urgency": "EMERGENCY",
        "red_flags": ["blue lips or fingertips", "unable to speak in full sentences", "use of accessory muscles", "sudden onset"]
    },
    {
        "id": "resp002",
        "category": "Respiratory",
        "keywords": ["cough", "persistent cough", "coughing", "productive cough", "dry cough"],
        "content": "Cough assessment: Duration matters (acute <3wk usually viral, chronic >8wk warrants investigation). Blood in sputum (hemoptysis) = URGENT. Cough with fever + shortness of breath may indicate pneumonia. Whooping cough (pertussis) has characteristic whoop. Croup in children presents with barking cough and stridor.",
        "urgency": "ROUTINE",
        "red_flags": ["coughing up blood", "high fever with cough", "shortness of breath with cough"]
    },
    # ── Neurological ─────────────────────────────────────────────────────────
    {
        "id": "neuro001",
        "category": "Neurological",
        "keywords": ["stroke", "facial drooping", "arm weakness", "slurred speech", "FAST", "sudden numbness"],
        "content": "FAST stroke signs: Face drooping, Arm weakness, Speech difficulty, Time to call 911. Additional signs: sudden severe headache, sudden vision changes, sudden confusion, sudden loss of coordination. Stroke is a TIME-CRITICAL emergency — every minute counts. TPA (clot-busting medication) window is 4.5 hours from symptom onset.",
        "urgency": "EMERGENCY",
        "red_flags": ["facial drooping", "one-sided weakness", "sudden speech problems", "worst headache of life"]
    },
    {
        "id": "neuro002",
        "category": "Neurological",
        "keywords": ["headache", "migraine", "head pain", "thunderclap headache"],
        "content": "Most headaches are benign (tension, migraine). RED FLAGS: 'Worst headache of life' (subarachnoid hemorrhage), headache with fever + stiff neck (meningitis), headache with vision changes or vomiting, new headache in person >50, headache after head trauma, headache waking from sleep. Migraine: throbbing, unilateral, with nausea/light sensitivity, often with aura.",
        "urgency": "SEMI_URGENT",
        "red_flags": ["worst headache of life", "sudden onset severe headache", "headache with stiff neck and fever", "headache after trauma"]
    },
    {
        "id": "neuro003",
        "category": "Neurological",
        "keywords": ["seizure", "convulsion", "epilepsy", "fitting", "shaking"],
        "content": "First-time seizure always requires emergency evaluation. Known epileptic with typical seizure, fully recovered (postictal normal): semi-urgent. Status epilepticus (seizure >5 min or no recovery between seizures) = EMERGENCY. Check: duration, loss of consciousness, tongue biting, incontinence, postictal state.",
        "urgency": "URGENT",
        "red_flags": ["first ever seizure", "seizure lasting more than 5 minutes", "not recovering after seizure"]
    },
    # ── Abdominal ────────────────────────────────────────────────────────────
    {
        "id": "abd001",
        "category": "Abdominal",
        "keywords": ["abdominal pain", "stomach pain", "belly pain", "stomach ache"],
        "content": "Abdominal pain assessment requires location, character, duration, and associated symptoms. EMERGENCY signs: rigid/board-like abdomen, severe sudden onset (ruptured AAA, ectopic pregnancy), signs of peritonitis. URGENT: RLQ pain (appendicitis), severe colicky pain (kidney stone, bowel obstruction), pain in pregnant patient. Assess for guarding, rebound tenderness.",
        "urgency": "SEMI_URGENT",
        "red_flags": ["rigid abdomen", "severe sudden onset", "RLQ pain with fever", "pain in pregnancy", "blood in stool with pain"]
    },
    # ── Fever / Infection ────────────────────────────────────────────────────
    {
        "id": "infect001",
        "category": "Infection",
        "keywords": ["fever", "high temperature", "pyrexia", "chills", "rigors"],
        "content": "Fever thresholds: Adult >38.3°C (101°F) is clinically significant. EMERGENCY: fever with stiff neck + photophobia (meningitis), fever with rash (septicemia, meningococcal), fever in immunocompromised/cancer patients, fever with hypotension/altered consciousness (sepsis). Febrile seizure in child <5: frightening but usually benign; URGENT if first episode. Fever duration and pattern matter.",
        "urgency": "SEMI_URGENT",
        "red_flags": ["fever with stiff neck", "fever with non-blanching rash", "fever with confusion", "fever in immunocompromised patient", "very high fever >40C (104F)"]
    },
    # ── Pediatric ─────────────────────────────────────────────────────────────
    {
        "id": "ped001",
        "category": "Pediatric",
        "keywords": ["child", "baby", "infant", "toddler", "newborn", "pediatric"],
        "content": "Children can deteriorate rapidly. Key pediatric concerns: Any fever in infant <3 months = EMERGENCY. Prolonged crying/inconsolability in infant. Signs of dehydration: dry mouth, no tears, sunken fontanelle, reduced urine output. Respiratory distress: grunting, flaring, severe recession. Altered consciousness. Rash with fever. Lower threshold for urgent care in children.",
        "urgency": "URGENT",
        "red_flags": ["fever in baby under 3 months", "infant inconsolable crying", "signs of dehydration in child", "child with difficulty breathing", "non-blanching rash in child"]
    },
    # ── Mental Health ────────────────────────────────────────────────────────
    {
        "id": "mh001",
        "category": "Mental Health",
        "keywords": ["suicidal", "self-harm", "overdose", "mental health crisis", "want to die"],
        "content": "Mental health crisis requires immediate compassionate assessment. Any active suicidal ideation with plan or intent = EMERGENCY (crisis line 988, ER). Self-harm without suicidal intent = URGENT (wound care + mental health evaluation). Depression/anxiety without immediate safety concern = SEMI_URGENT. Always ask directly about thoughts of self-harm.",
        "urgency": "EMERGENCY",
        "red_flags": ["active suicidal ideation", "plan to self-harm", "recent overdose or ingestion"]
    },
    # ── Allergic / Anaphylaxis ───────────────────────────────────────────────
    {
        "id": "allergy001",
        "category": "Allergy",
        "keywords": ["allergic reaction", "anaphylaxis", "hives", "swelling", "throat closing", "bee sting"],
        "content": "Anaphylaxis is life-threatening. Signs: throat tightening, tongue swelling, difficulty breathing, drop in blood pressure, rapid pulse, hives + systemic symptoms. Treat with epinephrine (EpiPen) immediately. Even mild allergic reactions can progress — monitor closely. Local reactions (hives without systemic symptoms): SEMI_URGENT. Any airway involvement: EMERGENCY.",
        "urgency": "EMERGENCY",
        "red_flags": ["throat tightening", "difficulty swallowing", "shortness of breath after exposure", "tongue swelling", "known severe allergy"]
    },
]


def search_knowledge_base(query: str, top_k: int = 3) -> list[dict]:
    """
    Simple keyword-based RAG search over the medical knowledge base.
    Returns top_k most relevant entries with relevance scores.
    """
    query_words = set(query.lower().split())
    results = []
    
    for entry in MEDICAL_KB:
        score = 0
        
        # Keyword matching
        for keyword in entry["keywords"]:
            keyword_words = set(keyword.lower().split())
            if keyword_words & query_words:  # intersection
                score += 2
            elif any(kw in query.lower() for kw in keyword.lower().split()):
                score += 1
        
        # Direct query match in content
        if any(word in entry["content"].lower() for word in query_words if len(word) > 3):
            score += 1
        
        if score > 0:
            results.append({
                "id": entry["id"],
                "category": entry["category"],
                "content": entry["content"],
                "urgency": entry["urgency"],
                "red_flags": entry["red_flags"],
                "relevance_score": score
            })
    
    # Sort by relevance, return top_k
    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return results[:top_k]
