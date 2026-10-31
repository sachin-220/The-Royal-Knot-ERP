# -*- coding: utf-8 -*-
"""
Gemini AI NLP Structured Extraction Engine
==========================================
Converts messy, unstructured natural language messages from couples into
strict JSON schemas for Odoo CRM lead generation. Includes a zero-failure
heuristic fallback parser for offline testing environments.
"""
import os
import re
import json
import urllib.request
from typing import Dict, Any

class GeminiLeadExtractor:
    """
    Parses conversational inquiries into verified CRM lead structures using
    Google Gemini REST API with schema enforcement and local fallback heuristics.
    """

    @classmethod
    def extract_wedding_enquiry(cls, raw_text: str, sender_name: str = "") -> Dict[str, Any]:
        """
        Extracts structured wedding parameters from raw chat text.
        """
        api_key = os.getenv('GEMINI_API_KEY', '').strip()
        
        # If API key is available, attempt Gemini structured generation
        if api_key:
            try:
                extracted = cls._call_gemini_api(raw_text, api_key, sender_name)
                if extracted and isinstance(extracted, dict):
                    return cls._normalize_extracted_data(extracted, raw_text, sender_name)
            except Exception as e:
                # Fallback to local heuristic parser on network/API exceptions
                print(f"[GeminiLeadExtractor] API call failed: {e}. Utilizing heuristic parser.")

        return cls._heuristic_fallback(raw_text, sender_name)

    @classmethod
    def _call_gemini_api(cls, raw_text: str, api_key: str, sender_name: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = (
            "You are the AI Concierge for 'The Royal Knot', a luxury wedding agency in Jaipur and Udaipur. "
            "Extract the following structured JSON from the user message. "
            "Return ONLY raw JSON with keys: "
            "'client_name' (string), 'destination' ('jaipur' or 'udaipur'), 'guest_count' (integer), "
            "'budget_total' (float in INR, convert Crores/Lakhs e.g. 3 Crores = 30000000), "
            "'wedding_theme' (string e.g. 'Royal Heritage', 'Beach Chic', 'Vintage Floral'), "
            "'package_type' ('full_service' or 'partial_day_of').\n\n"
            f"User message: \"{raw_text}\"\nSender name: \"{sender_name}\""
        )

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            result = json.loads(response.read().decode('utf-8'))
            candidate = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(candidate)

    @classmethod
    def _heuristic_fallback(cls, text: str, sender_name: str) -> Dict[str, Any]:
        """
        Deterministic, offline rule-based parser that never fails.
        """
        text_lower = text.lower()
        
        # 1. Destination detection
        destination = 'udaipur' if 'udaipur' in text_lower else 'jaipur'

        # 2. Guest count extraction
        guest_match = re.search(r'(\d+)\s*(?:guests?|people|pax|members?)', text_lower)
        guest_count = int(guest_match.group(1)) if guest_match else 400

        # 3. Budget extraction (Handling Crores and Lakhs)
        budget = 25000000.0 # Default 2.5 Cr
        crore_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)', text_lower)
        lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l)', text_lower)
        if crore_match:
            budget = float(crore_match.group(1)) * 10000000.0
        elif lakh_match:
            budget = float(lakh_match.group(1)) * 100000.0

        # 4. Theme detection
        theme = 'Royal Heritage'
        if 'beach' in text_lower:
            theme = 'Lakeside Beach Chic'
        elif 'modern' in text_lower or 'contemporary' in text_lower:
            theme = 'Modern Royal'
        elif 'minimal' in text_lower:
            theme = 'Elegant Minimalist'

        # 5. Package type
        package = 'full_service'
        if 'day of' in text_lower or 'partial' in text_lower or 'coordination' in text_lower:
            package = 'partial_day_of'

        return {
            'client_name': sender_name or 'Royal Couple',
            'destination': destination,
            'guest_count': guest_count,
            'budget_total': budget,
            'wedding_theme': theme,
            'package_type': package,
        }

    @classmethod
    def _normalize_extracted_data(cls, data: Dict[str, Any], raw_text: str, sender_name: str) -> Dict[str, Any]:
        dest = str(data.get('destination', '')).lower()
        destination = 'udaipur' if 'udaipur' in dest else 'jaipur'
        
        try:
            guests = int(data.get('guest_count', 400))
        except (ValueError, TypeError):
            guests = 400

        try:
            budget = float(data.get('budget_total', 30000000.0))
        except (ValueError, TypeError):
            budget = 30000000.0

        return {
            'client_name': data.get('client_name') or sender_name or 'Royal Couple',
            'destination': destination,
            'guest_count': max(guests, 50),
            'budget_total': max(budget, 1000000.0),
            'wedding_theme': data.get('wedding_theme') or 'Royal Heritage',
            'package_type': data.get('package_type') or 'full_service',
        }
