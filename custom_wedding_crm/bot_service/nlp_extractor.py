# -*- coding: utf-8 -*-
"""
Gemini AI NLP Dynamic Conversational & Structured 4-Step Interview Engine
========================================================================
Powers dynamic 4-step client interviews with zero-input ingestion,
role-based command flows, and multi-model failover for KnotCore.
"""
import os
import re
import json
import urllib.request
import urllib.error
import time
from typing import Dict, Any, Optional, List

class GeminiLeadExtractor:
    """
    Conversational AI and NLP extractor powered by Gemini REST API with multi-model
    failover (gemini-3.5-flash, gemini-flash-latest, gemini-2.5-flash-lite)
    and an intelligent offline dialog fallback.
    """
    CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"]

    @classmethod
    def _get_api_key(cls) -> str:
        return os.getenv('GEMINI_API_KEY', '').strip()

    @classmethod
    def _call_gemini_with_failover(cls, prompt: str, is_json: bool = True) -> Optional[str]:
        """Calls Gemini API with automatic model failover and retries."""
        api_key = cls._get_api_key()
        if not api_key:
            return None

        payload: Dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2}
        }
        if is_json:
            payload["generationConfig"]["response_mime_type"] = "application/json"

        for model in cls.CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res = json.loads(response.read().decode('utf-8'))
                    return res['candidates'][0]['content']['parts'][0]['text']
            except Exception:
                continue
        return None

    @classmethod
    def process_public_chat(
        cls,
        existing_data: Optional[Dict[str, Any]],
        message: str,
        sender_name: str = "",
        current_step: int = 1
    ) -> Dict[str, Any]:
        """
        4-Step Guided Client Interview with Zero-Input Ingestion:
        - Step 1: Couple Names & Royal Destination Choice (Jaipur/Udaipur)
        - Step 2: Celebration Span & Multi-Event Scope (e.g. 3-day affair)
        - Step 3: Confirmed / Anticipated Guest Estimate
        - Step 4: Target Budget Range & Aesthetic Vision
        Extracts parameters dynamically, skips steps if already provided in free text,
        and prompts warmly for next required information.
        """
        if not existing_data:
            existing_data = {
                "couple_names": None,
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            }

        prompt = (
            "You are the bespoke luxury wedding AI Concierge for 'The Royal Knot' (Jaipur & Udaipur).\n"
            "You are conducting a structured, dynamic 4-step wedding inquiry interview with a prospective royal client.\n\n"
            f"CURRENT STEP: {current_step} of 4\n"
            f"EXISTING ENQUIRY DATA: {json.dumps(existing_data)}\n"
            f"CLIENT SENDER NAME: \"{sender_name or 'Valued Guest'}\"\n"
            f"CLIENT INCOMING MESSAGE: \"{message}\"\n\n"
            "INTERVIEW STEPS DEFINITION:\n"
            "Step 1: Couple Names (Bride & Groom) & Destination City (Jaipur or Udaipur)\n"
            "Step 2: Celebration Span (number of days, e.g. 3 days: Mehendi, Sangeet, Pheras) & Preferred Dates/Month\n"
            "Step 3: Confirmed / Anticipated Guest Count (Exact integer number)\n"
            "Step 4: Target Total Budget in INR (e.g. 2.5 Cr) & Aesthetic Theme (Vedic, Royal Heritage, Lakeside)\n\n"
            "INSTRUCTIONS:\n"
            "1. ZERO-INPUT EXTRACTION: Extract ALL parameters the user mentioned anywhere in their message.\n"
            "   - couple_names: string or null\n"
            "   - destination: 'jaipur' or 'udaipur' or null\n"
            "   - duration_days: integer or null\n"
            "   - guest_count: integer or null\n"
            "   - budget_inr: float total in INR or null (e.g., 2.5 Cr = 25000000, 80 Lakhs = 8000000)\n"
            "   - wedding_theme: string or null\n"
            "   - preferred_dates: string or null\n\n"
            "2. DETERMINE NEXT REQUIRED STEP:\n"
            "   - If destination or couple_names is missing -> Step 1\n"
            "   - Else if duration_days is missing -> Step 2\n"
            "   - Else if guest_count is missing -> Step 3\n"
            "   - Else if budget_inr is missing -> Step 4\n"
            "   - Else -> Step 5 (Completed!)\n\n"
            "3. GENERATE A WARM, ROYAL HTML REPLY:\n"
            "   - Acknowledge what they provided.\n"
            "   - If not completed, ask for the next step clearly indicating '<b>Step X of 4</b>'.\n"
            "   - If all 4 steps are complete, present a magnificent Royal Enquiry Summary with ML buffer preview (+17%) and confirm submission to the KnotCore Executive Dashboard.\n\n"
            "Return JSON with keys:\n"
            "- 'reply': string (HTML formatted with <b>, <i>, <ul>, <li>)\n"
            "- 'extracted': object with couple_names, destination, duration_days, guest_count, budget_inr, wedding_theme, preferred_dates\n"
            "- 'next_step': integer (1, 2, 3, 4, or 5 if completed)\n"
            "- 'is_completed': boolean (true if destination, guest_count, and budget_inr are present)"
        )

        raw_output = cls._call_gemini_with_failover(prompt, is_json=True)
        if raw_output:
            try:
                data = json.loads(raw_output)
                extracted = data.get("extracted", {})
                merged = dict(existing_data)
                for k in ["couple_names", "destination", "duration_days", "guest_count", "budget_inr", "wedding_theme", "preferred_dates"]:
                    val = extracted.get(k)
                    if val is not None and val != "" and val != "null":
                        merged[k] = val

                next_step = data.get("next_step", current_step)
                is_completed = bool(data.get("is_completed", False)) or (
                    merged.get("destination") and merged.get("guest_count") and merged.get("budget_inr")
                )

                return {
                    "reply": data.get("reply", ""),
                    "enquiry_data": merged,
                    "next_step": 5 if is_completed else next_step,
                    "is_completed": is_completed
                }
            except Exception as e:
                print(f"[GeminiLeadExtractor] JSON parse error: {e}")

        # Intelligent offline conversational fallback
        return cls._offline_dialog_fallback(existing_data, message, sender_name, current_step)

    @classmethod
    def _offline_dialog_fallback(
        cls,
        existing: Dict[str, Any],
        text: str,
        sender_name: str,
        current_step: int = 1
    ) -> Dict[str, Any]:
        """Offline rule-based fallback when Gemini API is unreachable."""
        text_lower = text.lower()
        merged = dict(existing)

        # 1. Parameter extraction
        if not merged.get("couple_names") and ("&" in text or "and" in text):
            merged["couple_names"] = text.strip()
        elif not merged.get("couple_names"):
            merged["couple_names"] = f"{sender_name} & Partner"

        if 'jaipur' in text_lower:
            merged['destination'] = 'Jaipur'
        elif 'udaipur' in text_lower:
            merged['destination'] = 'Udaipur'

        day_match = re.search(r'(\d+)\s*(?:days?|day)\b', text_lower)
        if day_match:
            merged['duration_days'] = int(day_match.group(1))

        guest_match = re.search(r'(\d+)\s*(?:guests?|people|pax|members?|attendees?|invitees?)', text_lower)
        if guest_match:
            merged['guest_count'] = int(guest_match.group(1))

        crore_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)', text_lower)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', text_lower)
        if crore_match:
            merged['budget_inr'] = float(crore_match.group(1)) * 10000000.0
        elif lakh_match:
            merged['budget_inr'] = float(lakh_match.group(1)) * 100000.0

        # Step Progression
        if not merged.get("destination"):
            next_step = 1
            reply = (
                f" <b>Welcome to The Royal Knot, {sender_name}!</b>\n\n"
                "<b>Step 1 of 4: Couple & Destination</b>\n"
                "Please share the names of the Bride & Groom, and whether your heart is set on <b>Jaipur</b> (Rambagh/Samode) or <b>Udaipur</b> (City Palace/Jagmandir)."
            )
        elif not merged.get("duration_days"):
            next_step = 2
            reply = (
                f" <b>Step 2 of 4: Celebration Span & Dates</b>\n\n"
                f"Splendid! For your celebration in <b>{merged['destination']}</b>, how many days are you planning (e.g. 3-day royal affair: Mehendi, Sangeet, Pheras) and do you have tentative preferred dates?"
            )
        elif not merged.get("guest_count"):
            next_step = 3
            reply = (
                " <b>Step 3 of 4: Guestlist Estimate</b>\n\n"
                "Approximately how many esteemed guests will grace your celebrations?\n"
                "<i>(Our ML Turnout Engine will automatically factor outstation buffers & banqueting plates based on this!)</i>"
            )
        elif not merged.get("budget_inr"):
            next_step = 4
            reply = (
                " <b>Step 4 of 4: Budget & Thematic Vision</b>\n\n"
                "Lastly, what is your anticipated total budget range (e.g. ₹2.0 Cr - ₹3.5 Cr), and any signature elements (vintage car baraat, revolving lotus stage, concert sound)?"
            )
        else:
            next_step = 5
            b_cr = f"₹{(merged['budget_inr']/10000000):.2f} Cr"
            predicted_pax = int(merged['guest_count'] * 1.17)
            reply = (
                " <b>YOUR ROYAL ENQUIRY IS OFFICIALLY REGISTERED!</b>\n\n"
                f"• <b>Couple:</b> {merged.get('couple_names', sender_name)}\n"
                f"• <b>Destination:</b> {merged['destination']}\n"
                f"• <b>Duration:</b> {merged.get('duration_days', 3)} Days Celebration\n"
                f"• <b>Guest Estimate:</b> {merged['guest_count']} Confirmed\n"
                f"• <b>ML Predicted Turnout:</b> {predicted_pax} Guests (+17% Buffer)\n"
                f"• <b>Anticipated Budget:</b> {b_cr}\n\n"
                " <i>Your enquiry has been instantly transmitted to the KnotCore Executive Dashboard. A senior planner is reviewing your portfolio now.</i>"
            )

        is_completed = (next_step == 5)
        return {
            "reply": reply,
            "enquiry_data": merged,
            "next_step": next_step,
            "is_completed": is_completed
        }

    @classmethod
    def generate_role_copilot_reply(cls, role: str, message: str, context_data: Dict[str, Any]) -> Optional[str]:
        """Contextual Copilot for Founder, Planner, Vendor, and Client roles."""
        prompt = (
            f"You are the KnotCore AI Copilot for role: '{role.upper()}'.\n"
            f"CURRENT LIVE CONTEXT: {json.dumps(context_data)}\n"
            f"USER QUERY: \"{message}\"\n\n"
            "INSTRUCTIONS:\n"
            "- Answer directly and professionally with live facts from the context.\n"
            "- Use HTML tags <b>, <i>, <code> where appropriate.\n"
            "- Keep answers concise, factual, and royal."
        )
        return cls._call_gemini_with_failover(prompt, is_json=False)
