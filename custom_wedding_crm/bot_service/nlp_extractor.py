# -*- coding: utf-8 -*-
"""
Gemini AI NLP Dynamic Conversational & Structured Extraction Engine
===================================================================
Powers dynamic, multi-turn conversational AI across all KnotCore bot roles
(Public Inquirer, Founder, Planner, Vendor, Client). Strictly avoids hardcoded
or static assumptions and dynamically prompts users for missing information.
"""
import os
import re
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

class GeminiLeadExtractor:
    """
    Conversational AI and NLP extractor powered by Gemini 3.5 Flash REST API
    with resilient offline heuristic fallbacks.
    """
    GEMINI_MODEL = "gemini-3.5-flash"

    @classmethod
    def _get_api_key(cls) -> str:
        return os.getenv('GEMINI_API_KEY', '').strip()

    @classmethod
    def extract_or_update_enquiry(
        cls,
        existing_data: Optional[Dict[str, Any]],
        message: str,
        sender_name: str = ""
    ) -> Dict[str, Any]:
        """
        Dynamically extracts and merges wedding parameters from the user's message
        into the existing inquiry state. Missing fields are strictly set to None.
        """
        if not existing_data:
            existing_data = {
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            }

        api_key = cls._get_api_key()
        if api_key:
            try:
                extracted = cls._call_gemini_extraction(existing_data, message, sender_name, api_key)
                if extracted and isinstance(extracted, dict):
                    # Merge into existing data
                    merged = dict(existing_data)
                    for k in ["destination", "duration_days", "guest_count", "budget_inr", "wedding_theme", "preferred_dates"]:
                        val = extracted.get(k)
                        if val is not None and val != "" and val != "null":
                            merged[k] = val
                    merged["is_general_question"] = bool(extracted.get("is_general_question", False))
                    merged["ai_reply"] = extracted.get("ai_reply", "")
                    return merged
            except Exception as e:
                print(f"[GeminiLeadExtractor] Extraction API error: {e}. Using intelligent heuristic parser.")

        # Heuristic fallback (guaranteed zero-assumption)
        return cls._heuristic_extraction(existing_data, message, sender_name)

    @classmethod
    def _call_gemini_extraction(
        cls,
        existing_data: Dict[str, Any],
        message: str,
        sender_name: str,
        api_key: str
    ) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{cls.GEMINI_MODEL}:generateContent?key={api_key}"
        
        prompt = (
            "You are the AI Wedding Concierge for 'The Royal Knot', a luxury wedding planning agency in Jaipur and Udaipur.\n"
            "Analyze the user's message and update the wedding inquiry state.\n\n"
            f"PREVIOUS INQUIRY STATE: {json.dumps(existing_data)}\n"
            f"USER SENDER NAME: \"{sender_name}\"\n"
            f"NEW USER MESSAGE: \"{message}\"\n\n"
            "RULES:\n"
            "1. Extract ONLY what the user explicitly stated or confirmed.\n"
            "2. DO NOT GUESS OR INVENT DEFAULT VALUES! If guest count or budget was NOT stated, set it to null.\n"
            "3. destination: 'jaipur' or 'udaipur' or null.\n"
            "4. duration_days: integer number of celebration days (e.g., 3) or null.\n"
            "5. guest_count: integer number of guests or null.\n"
            "6. budget_inr: float total budget in INR. Convert Crores/Lakhs (e.g., 1.8 Cr = 18000000, 75 Lakhs = 7500000) or null.\n"
            "7. wedding_theme: royal heritage, lakeside, minimalist, vintage, etc., or null.\n"
            "8. preferred_dates: month or season mentioned, or null.\n"
            "9. is_general_question: true if user is asking questions about venues, decor, packages, or costs; false if just giving details.\n"
            "10. ai_reply: A warm, ultra-luxurious, dynamic conversational reply addressing their message, answering any questions, and asking specifically for missing details (guest count, budget, dates).\n\n"
            "Return ONLY valid raw JSON."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidate = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(candidate)

    @classmethod
    def _heuristic_extraction(
        cls,
        existing: Dict[str, Any],
        text: str,
        sender_name: str
    ) -> Dict[str, Any]:
        """
        Deterministic, rule-based parser with ZERO static default numbers.
        If a field is not present in the text, it remains None or preserves existing state.
        """
        text_lower = text.lower()
        merged = dict(existing)

        # 1. Destination
        if 'jaipur' in text_lower:
            merged['destination'] = 'jaipur'
        elif 'udaipur' in text_lower:
            merged['destination'] = 'udaipur'

        # 2. Duration
        day_match = re.search(r'(\d+)\s*(?:days?|day)\b', text_lower)
        if day_match:
            merged['duration_days'] = int(day_match.group(1))

        # 3. Guest count (explicit match ONLY)
        guest_match = re.search(r'(\d+)\s*(?:guests?|people|pax|members?|attendees?|invitees?)', text_lower)
        if guest_match:
            merged['guest_count'] = int(guest_match.group(1))

        # 4. Budget (explicit match ONLY)
        crore_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)', text_lower)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', text_lower)
        num_k_match = re.search(r'(?:budget|cost|spend|spending)\s*(?:is|of|around|approx|about)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)', text_lower)
        
        if crore_match:
            merged['budget_inr'] = float(crore_match.group(1)) * 10000000.0
        elif lakh_match:
            merged['budget_inr'] = float(lakh_match.group(1)) * 100000.0
        elif num_k_match:
            val = float(num_k_match.group(1))
            if val < 50: # Assume crores if small number like 2 or 2.5
                merged['budget_inr'] = val * 10000000.0
            else:
                merged['budget_inr'] = val * 100000.0

        # 5. Theme
        if 'heritage' in text_lower or 'royal' in text_lower or 'palace' in text_lower:
            merged['wedding_theme'] = 'Royal Heritage & Palace'
        elif 'lakeside' in text_lower or 'lake' in text_lower:
            merged['wedding_theme'] = 'Lakeside Grandeur'
        elif 'minimal' in text_lower:
            merged['wedding_theme'] = 'Contemporary Minimalist'

        # 6. Preferred dates
        month_match = re.search(r'\b(january|february|march|april|may|june|july|august|september|october|november|december|winter|spring|autumn)\b', text_lower)
        if month_match:
            merged['preferred_dates'] = month_match.group(1).capitalize()

        # Check if question
        merged['is_general_question'] = '?' in text or any(w in text_lower for w in ['which', 'what', 'how', 'can you', 'recommend', 'where', 'venue', 'palace'])
        merged['ai_reply'] = ""
        return merged

    @classmethod
    def generate_role_copilot_reply(
        cls,
        role: str,
        user_query: str,
        context_data: Dict[str, Any]
    ) -> str:
        """
        Dynamically answers arbitrary queries from any role (Founder, Planner, Vendor, Client)
        using Gemini 3.5 Flash grounded in the live system context.
        """
        api_key = cls._get_api_key()
        if not api_key:
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{cls.GEMINI_MODEL}:generateContent?key={api_key}"

        role_prompts = {
            "founder": (
                "You are the Executive AI Advisor to the Founder of 'The Royal Knot' luxury wedding agency in Rajasthan. "
                "You have access to live agency financial and operational metrics. "
                "Answer the founder's inquiry concisely, strategically, and with exact business numbers."
            ),
            "planner": (
                "You are the On-Ground Operations AI Copilot for the Lead Wedding Planner of 'The Royal Knot'. "
                "You have access to the active task graph, run sheets, and vendor check-in statuses. "
                "Answer practically, chronologically, and with actionable event management focus."
            ),
            "vendor": (
                "You are the Palace Logistics Coordinator for suppliers and vendors working with 'The Royal Knot'. "
                "Answer vendor logistics, unloading docks, arrival times, and emergency needs politely and clearly."
            ),
            "client": (
                "You are the VIP Wedding Concierge for the Royal Couple ('Aarav & Diya') at 'The Royal Knot'. "
                "Answer questions about their wedding countdown, payment schedule, approvals, and ceremony preparations warmly and reassuringly."
            )
        }

        system_instruction = role_prompts.get(role, "You are an assistant for The Royal Knot.")
        prompt = (
            f"{system_instruction}\n\n"
            f"LIVE SYSTEM CONTEXT: {json.dumps(context_data)}\n"
            f"USER QUERY: \"{user_query}\"\n\n"
            "Format your answer using clean HTML tags (<b>, <i>, <code>, <ul>, <li>) suitable for Telegram messages. "
            "Do not use markdown backticks or stars."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            print(f"[GeminiLeadExtractor] Copilot reply error: {e}")
            return ""
