"""
KnotCore Luxury Wedding Planning Management System
Geotagged Photo OCR & Live Location Verification Engine
Integrates Gemini Multimodal Vision, Telegram Vendor Bot (@Royalknot_vendors_bot),
and Odoo knotcore.vendor.arrival
"""
import os
import sys
import json
import base64
import urllib.request
import urllib.error
import math
from typing import Dict, Any, Optional
from PIL import Image
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Reference Palace Venue Coordinates (City Palace, Udaipur)
VENUE_LAT = 24.5764
VENUE_LNG = 73.6835

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates"""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)

class GeotagOCRService:
    """
    Intelligent Geotag OCR & Anti-Spoofing Engine:
    1. Inspects image for visual GPS coordinates, location watermarks, map stamps, or EXIF tags.
    2. Flags non-geotagged images with explicit reason when GPS stamps are missing.
    3. Accurately extracts Latitude, Longitude, Full Address, Date/Time, and City.
    4. Evaluates proximity to venue geofence.
    """

    CANDIDATE_MODELS = [
        "gemini-flash-lite-latest",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-latest"
    ]

    @classmethod
    def analyze_image_bytes(cls, image_bytes: bytes, filename: str = "image.jpeg") -> Dict[str, Any]:
        """
        Analyzes raw image bytes using Gemini Multimodal Vision API.
        Extracts GPS stamps, timestamps, and addresses, or flags if non-geotagged.
        """
        if not GEMINI_API_KEY:
            return {
                "success": False,
                "is_geotagged": False,
                "error": "GEMINI_API_KEY not configured in environment.",
                "flag_reason": "API_KEY_MISSING"
            }

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = "image/png" if filename.lower().endswith(".png") else "image/jpeg"

        prompt = """
        You are KnotCore's strict Geotagged Attendance & Location Verification OCR Engine.
        Inspect the attached image with absolute accuracy.

        Task 1: Determine whether this photograph is a verified GPS Geotagged photo:
        - A geotagged photo MUST contain a visual GPS watermark/stamp (such as Latitude, Longitude, Map overlay, Address, Date/Time stamp from GPS Map Camera apps) or embedded location tags.
        - If the photo is an ordinary photograph without visual GPS coordinates or location stamp, you MUST flag it as: "is_geotagged": false.

        Task 2: If "is_geotagged" is false:
        - Set "flag_reason": "NON-GEOTAGGED PHOTO DETECTED: Missing visual GPS coordinates, location stamp, or date-time watermark. Attendance proof rejected."

        Task 3: If "is_geotagged" is true:
        - Accurately transcribe all visible stamped text.
        - Extract exact numerical latitude (e.g. 17.520647 or 24.5764)
        - Extract exact numerical longitude (e.g. 78.630576 or 73.6835)
        - Extract full address, city, state, country
        - Extract stamped date and time (e.g. Sunday, 01/11/2026 12:19 AM)
        - Extract accuracy or altitude if visible.

        Return strictly valid JSON with no markdown wrapping:
        {
            "is_geotagged": true/false,
            "latitude": float or null,
            "longitude": float or null,
            "address": string or null,
            "city": string or null,
            "state": string or null,
            "country": string or null,
            "date_time": string or null,
            "accuracy_meters": float or null,
            "flag_reason": string,
            "raw_stamped_text": string,
            "scene_description": string
        }
        """

        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": b64_image}}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        for model in cls.CANDIDATE_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=18) as response:
                    raw_body = response.read().decode("utf-8")
                    data = json.loads(raw_body)
                    text_resp = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    parsed = json.loads(text_resp)
                    
                    # Calculate distance if coordinates extracted
                    lat = parsed.get("latitude")
                    lng = parsed.get("longitude")
                    distance_km = None
                    if lat is not None and lng is not None:
                        distance_km = haversine_distance(float(lat), float(lng), VENUE_LAT, VENUE_LNG)

                    return {
                        "success": True,
                        "model_used": model,
                        "is_geotagged": parsed.get("is_geotagged", False),
                        "latitude": lat,
                        "longitude": lng,
                        "address": parsed.get("address"),
                        "city": parsed.get("city"),
                        "state": parsed.get("state"),
                        "country": parsed.get("country"),
                        "date_time": parsed.get("date_time"),
                        "accuracy_meters": parsed.get("accuracy_meters"),
                        "flag_reason": parsed.get("flag_reason"),
                        "raw_stamped_text": parsed.get("raw_stamped_text"),
                        "scene_description": parsed.get("scene_description"),
                        "distance_to_venue_km": distance_km
                    }
            except Exception as e:
                continue

        # Fallback if external API times out or is unreachable
        return {
            "success": False,
            "is_geotagged": False,
            "error": "OCR vision service connection failed across candidate models.",
            "flag_reason": "API_TIMEOUT"
        }

    @classmethod
    def analyze_local_file(cls, filepath: str) -> Dict[str, Any]:
        """Convenience method to analyze a local image file (e.g. geotag1.jpeg)"""
        if not os.path.exists(filepath):
            return {
                "success": False,
                "is_geotagged": False,
                "error": f"File not found: {filepath}",
                "flag_reason": "FILE_NOT_FOUND"
            }

        with open(filepath, "rb") as f:
            bytes_data = f.read()

        filename = os.path.basename(filepath)
        return cls.analyze_image_bytes(bytes_data, filename)
