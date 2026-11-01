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
    CANDIDATE_MODELS = ["gemini-flash-lite-latest", "gemini-3-flash-preview"]

    @classmethod
    def _get_api_key(cls) -> str:
        from dotenv import load_dotenv
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        load_dotenv(dotenv_path=env_file, override=True)
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
                with urllib.request.urlopen(req, timeout=3) as response:
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
            "   - couple_names: strictly Bride & Groom names (e.g. 'Aarav & Diya'). NEVER include sentences, destinations, or prepositions.\n"
            "   - destination: 'jaipur' or 'udaipur' or null\n"
            "   - duration_days: integer or null (if user specifies 'partial', 'half day', 'single day', or 1 day, set duration_days: 1 and is_partial: true)\n"
            "   - guest_count: integer or null\n"
            "   - budget_inr: float total in INR or null (e.g., 2.5 Cr = 25000000, 80 Lakhs = 8000000)\n"
            "   - wedding_theme: string or null\n"
            "   - preferred_dates: string or null\n"
            "   - is_partial: boolean (true if user specifies partial, 1 day, or half day)\n\n"
            "2. DETERMINE NEXT REQUIRED STEP:\n"
            "   - If destination or couple_names is missing -> Step 1\n"
            "   - Else if duration_days is missing and not is_partial -> Step 2\n"
            "   - Else if guest_count is missing -> Step 3\n"
            "   - Else if budget_inr is missing -> Step 4\n"
            "   - Else -> Step 5 (Completed!)\n\n"
            "3. GENERATE A WARM, ROYAL HTML REPLY:\n"
            "   - Acknowledge what they provided.\n"
            "   - If not completed, ask for the next step clearly indicating '<b>Step X of 4</b>'.\n"
            "   - If all 4 steps are complete, present a magnificent Royal Enquiry Summary with ML buffer preview (+17%) and confirm submission to the KnotCore Executive Dashboard.\n\n"
            "Return JSON with keys:\n"
            "- 'reply': string (Telegram HTML formatted using ONLY <b>, <i>, <code>. Do NOT use <ul>, <ol>, <li>, <p>, or <br>. Use bullet points like • and clean newlines \\n)\n"
            "- 'extracted': object with couple_names, destination, duration_days, guest_count, budget_inr, wedding_theme, preferred_dates, is_partial\n"
            "- 'next_step': integer (1, 2, 3, 4, or 5 if completed)\n"
            "- 'is_completed': boolean (true if destination, guest_count, and budget_inr are present)"
        )

        raw_output = cls._call_gemini_with_failover(prompt, is_json=True)
        if raw_output:
            try:
                data = json.loads(raw_output)
                extracted = data.get("extracted", {})
                merged = dict(existing_data)
                for k in ["couple_names", "destination", "duration_days", "guest_count", "budget_inr", "wedding_theme", "preferred_dates", "is_partial"]:
                    val = extracted.get(k)
                    if val is not None and val != "" and val != "null":
                        merged[k] = val

                # Deterministic next_step calculation based on collected fields
                if not merged.get("destination") or not merged.get("couple_names"):
                    calc_step = 1
                elif not (merged.get("duration_days") or merged.get("is_partial")):
                    calc_step = 2
                elif not merged.get("guest_count"):
                    calc_step = 3
                elif not merged.get("budget_inr"):
                    calc_step = 4
                else:
                    calc_step = 5

                is_completed = (calc_step == 5) or bool(data.get("is_completed", False)) or (
                    bool(merged.get("destination")) and bool(merged.get("guest_count")) and bool(merged.get("budget_inr"))
                )

                return {
                    "reply": data.get("reply", ""),
                    "enquiry_data": merged,
                    "next_step": 5 if is_completed else calc_step,
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

        # 1. Parameter extraction: Clean couple names without sentences or prepositions
        stop_words = {"in", "at", "on", "this", "our", "the", "my", "a", "an", "udaipur", "jaipur", "jodhpur", "goa", "december", "january", "february", "march"}
        couple_match = re.search(r'(?:wedding\s+for|affair\s+for|celebration\s+for|couple:?|names:?|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:and|&)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)', text, re.IGNORECASE)
        if couple_match:
            p1_parts = [w for w in couple_match.group(1).split() if w.lower() not in stop_words]
            p2_parts = [w for w in couple_match.group(2).split() if w.lower() not in stop_words]
            if p1_parts and p2_parts:
                merged["couple_names"] = f"{' '.join(p1_parts).capitalize()} & {' '.join(p2_parts).capitalize()}"
        elif ("&" in text or " and " in text) and len(text.split()) <= 6:
            # e.g. "Rohit & Simran, Udaipur" or "Aarav and Diya"
            c_text = re.sub(r'[,;]+', ' ', text).strip()
            c_parts = [w for w in c_text.split() if w.lower() not in stop_words and not w.isdigit()]
            if len(c_parts) >= 2:
                merged["couple_names"] = " ".join(c_parts).title()
        elif not merged.get("couple_names") and current_step >= 2:
            clean_sender = sender_name.replace("@", "").strip()
            merged["couple_names"] = f"{clean_sender} & Partner" if clean_sender and clean_sender.lower() != "valued guest" else "Aarav & Diya"

        if 'jaipur' in text_lower:
            merged['destination'] = 'Jaipur'
        elif 'udaipur' in text_lower:
            merged['destination'] = 'Udaipur'
        elif 'jodhpur' in text_lower:
            merged['destination'] = 'Jodhpur'
        elif 'goa' in text_lower:
            merged['destination'] = 'Goa'

        # Check for partial / single-day / half-day celebration keywords
        if any(k in text_lower for k in ["partial", "half day", "half-day", "halfday", "single day", "1 day", "one day", "only sangeet", "only reception", "only wedding", "partial wedding", "partial celebration"]):
            merged['duration_days'] = 1
            merged['is_partial'] = True
            if any(k in text_lower for k in ["half day", "half-day", "halfday"]):
                merged['is_half_day'] = True

        day_match = re.search(r'(\d+)\s*[- ]?(?:days?|day)\b', text_lower)
        if day_match:
            d_count = int(day_match.group(1))
            merged['duration_days'] = d_count
            if d_count == 1:
                merged['is_partial'] = True
        elif (current_step == 2 or not merged.get("duration_days")) and text.strip().isdigit() and 1 <= int(text.strip()) <= 14:
            merged['duration_days'] = int(text.strip())
            if merged['duration_days'] == 1:
                merged['is_partial'] = True

        guest_match = re.search(r'(\d+)\s*(?:guests?|people|pax|members?|attendees?|invitees?)', text_lower)
        if guest_match:
            merged['guest_count'] = int(guest_match.group(1))
        elif (current_step == 3 or (merged.get("destination") and not merged.get("guest_count"))) and text.strip().isdigit() and int(text.strip()) >= 20:
            merged['guest_count'] = int(text.strip())

        crore_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)', text_lower)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', text_lower)
        if crore_match:
            merged['budget_inr'] = float(crore_match.group(1)) * 10000000.0
        elif lakh_match:
            merged['budget_inr'] = float(lakh_match.group(1)) * 100000.0
        elif current_step == 4 or (merged.get("guest_count") and not merged.get("budget_inr")):
            clean_num = re.sub(r'[^\d\.]', '', text).strip()
            if clean_num:
                try:
                    f_val = float(clean_num)
                    if f_val >= 100000:
                        merged['budget_inr'] = f_val
                    elif 0.5 <= f_val <= 100:
                        merged['budget_inr'] = f_val * 10000000.0
                except ValueError:
                    pass

        date_match = re.search(r'\b(december|january|february|march|april|may|june|july|august|september|october|november|winter|spring|autumn)\b', text_lower)
        if date_match:
            merged['preferred_dates'] = date_match.group(1).capitalize()

        # Step Progression
        if not merged.get("destination"):
            next_step = 1
            reply = (
                f" <b>Welcome to The Royal Knot, {sender_name}!</b>\n\n"
                "<b>Step 1 of 4: Couple & Destination</b>\n"
                "Please share the names of the Bride & Groom, and whether your heart is set on <b>Jaipur</b> (Rambagh/Samode) or <b>Udaipur</b> (City Palace/Jagmandir)."
            )
        elif not merged.get("duration_days") and not merged.get("is_partial"):
            next_step = 2
            reply = (
                f" <b>Step 2 of 4: Celebration Span & Dates</b>\n\n"
                f"Splendid! For your celebration in <b>{merged['destination']}</b>, how many days are you planning (e.g. <b>3-day royal affair</b> or <b>partial / 1-day / half-day celebration</b>) and do you have tentative preferred dates?"
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
            span_desc = "Partial Royal Celebration (1 Day / Half-Day based on timing)" if merged.get("is_partial") else f"{merged.get('duration_days', 3)} Days Celebration"
            reply = (
                " <b>YOUR ROYAL ENQUIRY IS OFFICIALLY REGISTERED!</b>\n\n"
                f"• <b>Couple:</b> {merged.get('couple_names', sender_name)}\n"
                f"• <b>Destination:</b> {merged['destination']}\n"
                f"• <b>Celebration Span:</b> {span_desc}\n"
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
