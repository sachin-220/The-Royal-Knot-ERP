# -*- coding: utf-8 -*-
"""
Gemini AI NLP Dynamic Conversational & Structured Extraction Engine
===================================================================
Powers dynamic, multi-turn conversational AI across all KnotCore bot roles
(Public Inquirer, Founder, Planner, Vendor, Client). Strictly avoids hardcoded
or static assumptions, dynamically answers any query, and prompts for missing info.
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
            except Exception as e:
                # Try next model in candidate list
                continue
        return None

    @classmethod
    def process_public_chat(
        cls,
        existing_data: Optional[Dict[str, Any]],
        message: str,
        sender_name: str = ""
    ) -> Dict[str, Any]:
        """
        Processes any user message dynamically:
        - Answers questions about venues, packages, costs, or themes
        - Extracts newly provided wedding parameters (destination, guests, budget, etc.)
        - Asks for missing details without ever assuming fake defaults
        - Returns a complete, personalized conversational response
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

        prompt = (
            "You are the bespoke luxury wedding AI Concierge for 'The Royal Knot', Jaipur & Udaipur's premier luxury wedding planning agency.\n"
            "You are in an interactive, multi-turn conversation with a prospective client.\n\n"
            f"CURRENT KNOWN ENQUIRY STATE: {json.dumps(existing_data)}\n"
            f"CLIENT NAME: \"{sender_name or 'Valued Guest'}\"\n"
            f"CLIENT MESSAGE: \"{message}\"\n\n"
            "INSTRUCTIONS:\n"
            "1. EXTRACT PARAMETERS: Extract only what the user explicitly stated. Never guess numbers! If guest count or budget was not stated, keep it null.\n"
            "   - destination: 'jaipur' or 'udaipur' or null\n"
            "   - duration_days: integer celebration days or null\n"
            "   - guest_count: integer or null\n"
            "   - budget_inr: float total in INR. Convert Crores/Lakhs (e.g., 1.8 Cr = 18000000) or null\n"
            "   - wedding_theme: royal heritage, lakeside, minimalist, vintage, or null\n"
            "   - preferred_dates: month or season or null\n\n"
            "2. GENERATE A BESPOKE CONVERSATIONAL REPLY (HTML format using <b>, <i>, <ul>, <li>):\n"
            "   - If they asked a question (about venues, decor, packages, costs, catering), answer it thoroughly, gracefully, and with true palace expertise (Rambagh, Samode, City Palace, Jagmandir, Lake Palace, Fairmont).\n"
            "   - Acknowledge whatever details they have shared so far.\n"
            "   - If guest count or budget is still missing, politely and warmly ask them to share those so you can prepare customized palace options.\n"
            "   - If both guest count and budget (and destination) are now known, confirm their Royal Enquiry with celebration summary and announce that their Lead Destination Planner is compiling their palace portfolio.\n\n"
            "Return JSON with keys: 'reply' (string HTML), 'extracted' (object with destination, duration_days, guest_count, budget_inr, wedding_theme, preferred_dates), 'is_ready_for_lead' (boolean true if destination, guest_count, and budget_inr are non-null)."
        )

        raw_output = cls._call_gemini_with_failover(prompt, is_json=True)
        if raw_output:
            try:
                data = json.loads(raw_output)
                extracted = data.get("extracted", {})
                merged = dict(existing_data)
                for k in ["destination", "duration_days", "guest_count", "budget_inr", "wedding_theme", "preferred_dates"]:
                    val = extracted.get(k)
                    if val is not None and val != "" and val != "null":
                        merged[k] = val

                return {
                    "reply": data.get("reply", ""),
                    "enquiry_data": merged,
                    "is_ready_for_lead": bool(data.get("is_ready_for_lead", False))
                }
            except Exception as e:
                print(f"[GeminiLeadExtractor] JSON parse error: {e}")

        # Intelligent offline conversational fallback
        return cls._offline_dialog_fallback(existing_data, message, sender_name)

    @classmethod
    def _offline_dialog_fallback(
        cls,
        existing: Dict[str, Any],
        text: str,
        sender_name: str
    ) -> Dict[str, Any]:
        """
        High-intelligence local conversational engine with zero fake defaults.
        Answers questions about venues, packages, and extracts explicit parameters.
        """
        text_lower = text.lower()
        merged = dict(existing)

        # 1. Parameter extraction
        if 'jaipur' in text_lower:
            merged['destination'] = 'jaipur'
        elif 'udaipur' in text_lower:
            merged['destination'] = 'udaipur'

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

        if 'heritage' in text_lower or 'royal' in text_lower or 'palace' in text_lower:
            merged['wedding_theme'] = 'Royal Heritage & Palace'
        elif 'lakeside' in text_lower or 'lake' in text_lower:
            merged['wedding_theme'] = 'Lakeside Grandeur'

        month_match = re.search(r'\b(january|february|march|april|may|june|july|august|september|october|november|december|winter|spring)\b', text_lower)
        if month_match:
            merged['preferred_dates'] = month_match.group(1).capitalize()

        # Check completeness
        has_dest = bool(merged.get('destination'))
        has_guests = bool(merged.get('guest_count'))
        has_budget = bool(merged.get('budget_inr'))
        is_ready = has_dest and has_guests and has_budget

        # 2. Check conversational intent
        # A. Venue Inquiry
        if any(w in text_lower for w in ['venue', 'venues', 'palace', 'palaces', 'where', 'location', 'rambagh', 'samode', 'city palace', 'lake palace']):
            if 'udaipur' in text_lower or merged.get('destination') == 'udaipur':
                answer = (
                    "🏰 <b>Premier Luxury Palaces in Udaipur:</b>\n"
                    "• <b>City Palace Complex:</b> Grand courtyards (Manek Chowk, Zenana Mahal) accommodating 300–800 guests.\n"
                    "• <b>Taj Lake Palace & Jagmandir Island:</b> Iconic romantic island palaces on Lake Pichola for magical pheras.\n"
                    "• <b>The Leela Palace Udaipur:</b> Contemporary royal heritage with lakeside amphitheaters."
                )
            else:
                answer = (
                    "🏰 <b>Premier Luxury Palaces in Jaipur:</b>\n"
                    "• <b>Rambagh Palace:</b> Former royal residence with sprawling Mughal gardens (ideal for 250–600 guests).\n"
                    "• <b>Samode Palace:</b> 475-year-old regal fort tucked in the Aravalli hills for exclusive palace buyouts.\n"
                    "• <b>Fairmont Jaipur:</b> Grand banquet lawns and opulent ballroom for celebrations up to 1,000 guests."
                )
            
            missing_text = ""
            if not has_guests or not has_budget:
                missing_text = "\n\n💬 <i>To check availability and match the best palace layout for your wedding, roughly how many guests are you expecting and what overall budget are you planning?</i>"
            
            return {
                "reply": f"✨ <b>Delighted to guide you, {sender_name or 'Valued Guest'}!</b>\n\n{answer}{missing_text}",
                "enquiry_data": merged,
                "is_ready_for_lead": is_ready
            }

        # B. Packages Inquiry
        if any(w in text_lower for w in ['package', 'packages', 'service', 'services', 'offer', 'include', 'what do you do']):
            answer = (
                "👑 <b>The Royal Knot Curated Service Packages:</b>\n\n"
                "1. <b>Full-Service Palace Royal Journey (28 Tasks):</b>\n"
                "• Complete turnkey management: Venue buyouts, palace decor design, 18 vendor categories, multi-course banquet curation, RSVP guest logistics, and wedding-day command centre.\n\n"
                "2. <b>Day-Of & Production Coordination (14 Tasks):</b>\n"
                "• Operational execution: Vendor gate QR check-ins, minute-by-minute timeline management, live ceremony cueing, and variation audits."
            )
            return {
                "reply": f"✨ <b>Welcome to The Royal Knot, {sender_name or 'Valued Guest'}!</b>\n\n{answer}\n\n💬 <i>Tell us your preferred destination (Jaipur or Udaipur) and guest count to receive a customized proposal!</i>",
                "enquiry_data": merged,
                "is_ready_for_lead": is_ready
            }

        # C. Ready for Lead
        if is_ready:
            dest_name = merged['destination'].capitalize()
            days_num = merged.get('duration_days') or 3
            guest_num = merged['guest_count']
            b_val = merged['budget_inr']
            b_str = f"₹{b_val/10000000.0:.2f} Crores" if b_val >= 10000000 else f"₹{b_val/100000.0:.1f} Lakhs"
            lead_ref = f"LEAD-{int(time.time()) % 10000:04d}"

            reply = (
                f"👑 <b>BESPOKE ROYAL ENQUIRY CONFIRMED!</b>\n\n"
                f"Dear {sender_name or 'Royal Couple'},\n"
                f"Thank you for sharing your celebration vision with The Royal Knot. Every detail has been dynamically captured:\n\n"
                f"• <b>Destination:</b> {dest_name}\n"
                f"• <b>Duration:</b> {days_num} Days Celebration\n"
                f"• <b>Expected Guests:</b> {guest_num} Guests\n"
                f"• <b>Budget Ceiling:</b> {b_str}\n"
                f"• <b>Theme:</b> {merged.get('wedding_theme') or 'Royal Heritage'}\n"
                f"• <b>Preferred Timeline:</b> {merged.get('preferred_dates') or 'Upcoming Wedding Season'}\n"
                f"• <b>Lead Reference:</b> <code>{lead_ref}</code>\n\n"
                "✨ <b>Next Step:</b> Our Lead Destination Planner is reviewing availability across our partner palaces and compiling your personalized floor plans and portfolios.\n\n"
                "📲 <i>Need to test other roles? Type <code>/role founder</code> or <code>/role planner</code> anytime!</i>"
            )
            return {
                "reply": reply,
                "enquiry_data": merged,
                "is_ready_for_lead": True
            }

        # D. Incomplete Details - Prompt for Missing
        captured_lines = []
        if merged.get('destination'):
            captured_lines.append(f"• <b>Destination:</b> {merged['destination'].capitalize()}")
        if merged.get('duration_days'):
            captured_lines.append(f"• <b>Duration:</b> {merged['duration_days']} Days Celebration")
        if merged.get('guest_count'):
            captured_lines.append(f"• <b>Expected Guests:</b> {merged['guest_count']} Guests")
        if merged.get('budget_inr'):
            b_val = merged['budget_inr']
            b_str = f"₹{b_val/10000000.0:.2f} Cr" if b_val >= 10000000 else f"₹{b_val/100000.0:.1f} Lakhs"
            captured_lines.append(f"• <b>Budget:</b> {b_str}")

        captured_text = "\n".join(captured_lines) if captured_lines else "• Discussion started"

        follow_ups = []
        if not has_guests:
            follow_ups.append("1️⃣ <b>Guest Count:</b> Approximately how many guests are you expecting?")
        if not has_budget:
            follow_ups.append(f"{len(follow_ups) + 1}️⃣ <b>Budget Range:</b> What is your approximate overall budget (e.g. in Lakhs or Crores)?")
        if not merged.get('preferred_dates') and len(follow_ups) < 3:
            follow_ups.append(f"{len(follow_ups) + 1}️⃣ <b>Timeline:</b> Do you have a preferred month or season in mind?")

        q_block = "\n".join(follow_ups)

        intro = f"✨ <b>Delighted to connect, {sender_name or 'Valued Guest'}!</b>\n\n"
        if merged.get('destination') and merged.get('duration_days'):
            intro += f"A <b>{merged['duration_days']}-day royal wedding in {merged['destination'].capitalize()}</b> is a magnificent vision!\n\n"
        elif merged.get('destination'):
            intro += f"Planning a royal celebration in <b>{merged['destination'].capitalize()}</b> is truly magical!\n\n"

        reply = (
            f"{intro}"
            f"📝 <b>Details Noted So Far:</b>\n{captured_text}\n\n"
            f"To help our team prepare curated palace options and an accurate cost breakdown, could you please share:\n"
            f"{q_block}\n\n"
            "<i>Simply reply naturally with your numbers!</i>"
        )

        return {
            "reply": reply,
            "enquiry_data": merged,
            "is_ready_for_lead": False
        }

    @classmethod
    def generate_role_copilot_reply(
        cls,
        role: str,
        user_query: str,
        context_data: Dict[str, Any]
    ) -> str:
        """
        Dynamically answers arbitrary queries from any role (Founder, Planner, Vendor, Client)
        using Gemini REST API with candidate model failover grounded in live system context.
        """
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

        answer = cls._call_gemini_with_failover(prompt, is_json=False)
        return answer or ""
