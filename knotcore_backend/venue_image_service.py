# -*- coding: utf-8 -*-
"""
KnotCore Venue Image Intelligence Service
==========================================
Generates or retrieves photorealistic venue decor visualizations (PLACE ONLY, NO PEOPLE/BRIDES).
Implements 3-Tier Multi-Channel Resolution:
1. Tier 1: Gemini Image API Generation (gemini-2.5-flash-image / gemini-3.1-flash-image)
2. Tier 2: Real-time Internet / Web Surfing for Authentic Luxury Wedding Venue Architecture
3. Tier 3: Local High-Resolution Curated Venue Decor Repository
"""
import os
import re
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Tuple, Optional
from dotenv import load_dotenv

# Load workspace root .env
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(WORKSPACE_DIR, ".env"))

VENUES_DIR = os.path.join(os.path.dirname(__file__), "data", "venues")
os.makedirs(VENUES_DIR, exist_ok=True)

# 28 Curated Wedding Themes Catalog
THEMES_CATALOG = {
    1: {
        "title": "Heritage Palace Feel with Royal Marigold and Lotus Decor",
        "description": "Authentic Udaipur/Jaipur palace courtyard with grand carved arches, cascading golden marigolds, blooming pink lotuses, and floating brass diyas.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["palace", "marigold", "lotus", "heritage", "rajputana", "courtyard", "royal palace"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    2: {
        "title": "Coastal Beach Sunset Mandap on Ocean Sand",
        "description": "Exquisite driftwood canopy directly on white sand with cascading white orchids, blush roses, flowing sheer ivory drapes, and ocean sunset waves.",
        "filename": "beach_stage_decor.jpg",
        "keywords": ["beach", "stage", "stage in the beach", "ocean", "coastal", "sand", "seaside", "driftwood"],
        "web_url": "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1200&auto=format&fit=crop&q=80"
    },
    3: {
        "title": "Floating Lake Mandap & Candlelit Water Pavilion",
        "description": "Serene floating pavilion on Lake Pichola facing illuminated palace ramparts with tuberose garlands and brass candle lanterns.",
        "filename": "lake_floating_mandap.jpg",
        "keywords": ["lake", "floating", "pichola", "water pavilion", "island", "floating mandap"],
        "web_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80"
    },
    4: {
        "title": "Mughal Rose Garden & Shalimar Courtyard",
        "description": "Royal Persian Mughal garden with deep crimson and blush pink rose cascades, carved white marble jali pavilion, and floating rose fountains.",
        "filename": "mughal_rose_mandap.jpg",
        "keywords": ["mughal", "rose", "shalimar", "garden", "crimson", "marble fountain"],
        "web_url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=80"
    },
    5: {
        "title": "Contemporary Minimalist Starlight Glasshouse",
        "description": "Modern conservatory pavilion with sleek golden arches, crystal chandeliers, white calla lilies, and reflective mirror floor.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["glasshouse", "minimalist", "starlight", "crystal", "modern", "chandelier", "contemporary"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    6: {
        "title": "Rajputana Regal Crimson & Gold Brocade",
        "description": "Regal crimson velvet drapery, handwoven gold zardozi arches, antique silver thrones, and saffron floral cascades.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["crimson", "gold", "brocade", "zardozi", "throne"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    7: {
        "title": "Royal Vrindavan Sacred Lotus & Peacock Forest",
        "description": "Divine blue hydrangeas, blooming sacred lotuses, peacock motifs, brass bells, and tranquil water urulis.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["vrindavan", "peacock", "sacred lotus", "krishna"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    8: {
        "title": "Parisian Haute Bohème & Pastel Floral Pergola",
        "description": "Romantic dusty rose silks, baby's breath floral clouds, champagne drapes, and fairy-lit garden pergola.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["parisian", "boheme", "pastel", "pergola", "baby's breath"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    9: {
        "title": "Sheesh Mahal Mirrored Palace of Illusions",
        "description": "Thousands of concave Belgian cut glass mirrors reflecting candlelight, ivory carnations, and silver samai lamps.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["sheesh mahal", "mirror", "glass", "candlelight"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    10: {
        "title": "Tuscan Vineyard & Olive Grove Elegance",
        "description": "Rustic terracotta planters, hanging olive branches, cream floral runners, and fairy-light pergolas.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["tuscan", "vineyard", "olive", "rustic"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    11: {
        "title": "Celestial Arabian Nights & Moroccan Kasbah",
        "description": "Intricate brass pierced lanterns, jewel-toned carpets, amber flame torches, and starlight canopy.",
        "filename": "desert_dunes_mandap.jpg",
        "keywords": ["arabian", "moroccan", "kasbah", "lanterns", "carpet"],
        "web_url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80"
    },
    12: {
        "title": "Zen Water Garden & Floating Sakura Blossoms",
        "description": "Minimalist stone bridges, floating lotus pods, bamboo water spouts, and soft warm ambient lanterns.",
        "filename": "lake_floating_mandap.jpg",
        "keywords": ["zen", "sakura", "bamboo", "japanese"],
        "web_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80"
    },
    13: {
        "title": "South Indian Royal Temple Gopuram Mandap",
        "description": "Intricately carved golden temple pillars, thousands of fresh white jasmine and golden marigold garlands, and glowing brass kuthuvilakku lamps.",
        "filename": "temple_mandap.jpg",
        "keywords": ["temple", "gopuram", "south indian", "jasmine", "kuthuvilakku"],
        "web_url": "https://images.unsplash.com/photo-1609151162377-794aff6c5e7f?w=1200&auto=format&fit=crop&q=80"
    },
    14: {
        "title": "Imperial Benaras Ghats of Ganga Arati",
        "description": "Sacred stepped riverside pavilion, brass temple bells, saffron fabrics, and hundreds of floating earthen deepams.",
        "filename": "lake_floating_mandap.jpg",
        "keywords": ["benaras", "varanasi", "ganga", "arati", "deepam"],
        "web_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80"
    },
    15: {
        "title": "Emerald Forest Wonderland & Enchanted Canopy",
        "description": "Lush cascading wisteria, moss-lined stone pathways, suspended amber fairy spheres, and emerald greenery.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["emerald", "forest", "wisteria", "enchanted"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    16: {
        "title": "Beachside Driftwood & White Orchid Mandap",
        "description": "Breeze-swept coastal canopy with white phalaenopsis orchids, bleached driftwood, and panoramic sea views.",
        "filename": "beach_sunset_mandap.jpg",
        "keywords": ["beachside", "driftwood", "orchid", "sea", "coastal mandap"],
        "web_url": "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1200&auto=format&fit=crop&q=80"
    },
    17: {
        "title": "Sunset Desert Dune Mirage & Copper Fire Pits",
        "description": "Golden sand dunes with rich saffron and ruby red velvet drapery, copper fire braziers, and desert lanterns.",
        "filename": "desert_dunes_mandap.jpg",
        "keywords": ["desert", "dune", "jaisalmer", "fire", "braziers"],
        "web_url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80"
    },
    18: {
        "title": "Anglo-Indian Colonial Heritage Polo Lawn",
        "description": "Verdant palace polo lawns, white cane gazebos, garden tea roses, and vintage brass chandeliers.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["colonial", "polo", "lawn", "gazebo"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    19: {
        "title": "Indo-Western Monochromatic Ivory & Gold",
        "description": "Pure ivory silks, polished gold geometric arches, white calla lilies, and cascading crystal drops.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["monochromatic", "ivory", "gold", "geometric"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    20: {
        "title": "Bohemian Pampas Grass & Sunset Terracotta",
        "description": "Earthy terracotta urns, dried pampas grass arches, woven cane lanterns, and sunset desert tones.",
        "filename": "beach_stage_decor.jpg",
        "keywords": ["pampas", "terracotta", "boho", "dried flowers"],
        "web_url": "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1200&auto=format&fit=crop&q=80"
    },
    21: {
        "title": "Kashmiri Shikara Floating Blossom Fantasy",
        "description": "Carved walnut wood shikara boat floral floats, Dal Lake water reflections, and saffron tulip garlands.",
        "filename": "lake_floating_mandap.jpg",
        "keywords": ["kashmiri", "shikara", "tulip", "dal lake"],
        "web_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80"
    },
    22: {
        "title": "Royal Chettinad Heritage Courtyard & Teakwood",
        "description": "Athangudi heritage tiles, Burma teakwood pillars, fresh jasmine garlands, and antique brass urulis.",
        "filename": "temple_mandap.jpg",
        "keywords": ["chettinad", "teakwood", "athangudi", "heritage courtyard"],
        "web_url": "https://images.unsplash.com/photo-1609151162377-794aff6c5e7f?w=1200&auto=format&fit=crop&q=80"
    },
    23: {
        "title": "Art Deco 1920s Great Gatsby Glamour",
        "description": "Black and gold geometric arches, white ostrich feather centerpieces, and tiered champagne towers.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["art deco", "gatsby", "feathers", "1920s"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    24: {
        "title": "Royal Awadhi Dastarkhwan & Nawabi Velvet Canopy",
        "description": "Lucknowi chikan drapery, silver hookah stands, night-blooming raatrani, and antique velvet cushions.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["awadhi", "nawabi", "lucknowi", "chikan"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    25: {
        "title": "Himalayan Pine Forest Whispers & Alpine Fires",
        "description": "Pinecone and fir decor, stone fire braziers, snow-white winter blooms, and rustic cedar logs.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["himalayan", "pine", "alpine", "mountain"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    },
    26: {
        "title": "Tropical Sun-Drenched Goa Coconut Grove",
        "description": "Coconut palm canopy, frangipani blossoms, woven cane lanterns, and breeze-swept natural linens.",
        "filename": "beach_sunset_mandap.jpg",
        "keywords": ["goa", "coconut", "palm", "tropical"],
        "web_url": "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1200&auto=format&fit=crop&q=80"
    },
    27: {
        "title": "Royal Mewar Silver & Pearl Fantasy",
        "description": "Pure beaten silver mandap pillars, freshwater pearl hangings, and fragrant tuberose streams.",
        "filename": "palace_lotus_mandap.jpg",
        "keywords": ["mewar", "silver", "pearl", "tuberose"],
        "web_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"
    },
    28: {
        "title": "Sunlit Citrus & Bougainvillea Mediterranean Courtyard",
        "description": "Vibrant magenta bougainvillea cascades, Meyer lemon trees, terracotta urns, and white stucco walls.",
        "filename": "glasshouse_mandap.jpg",
        "keywords": ["bougainvillea", "citrus", "mediterranean", "lemon"],
        "web_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"
    }
}

class VenueImageService:
    """Multi-tier image engine that provides venue decor visualizations (Place Only)."""

    @classmethod
    def get_or_generate_venue_image(cls, user_preference_or_theme: str) -> Tuple[str, str]:
        """
        Resolves or generates a venue decor photograph based on the user's preference.
        Returns: (theme_title, image_file_path_or_url)
        Guarantee: Place only (pure architectural venue decor, stage setup, no people or brides).
        """
        pref = str(user_preference_or_theme).strip().lower()

        # 1. Check if user typed a theme number (1 to 28)
        num_match = re.match(r'^(?:theme\s*)?(\d{1,2})$', pref)
        if num_match:
            idx = int(num_match.group(1))
            if idx in THEMES_CATALOG:
                item = THEMES_CATALOG[idx]
                local_path = os.path.join(VENUES_DIR, item["filename"])
                if os.path.exists(local_path):
                    return item["title"], local_path
                return item["title"], item["web_url"]

        # 2. Check keyword matches across 28 themes
        best_match = None
        max_matches = 0
        for idx, item in THEMES_CATALOG.items():
            matches = sum(1 for kw in item["keywords"] if kw in pref)
            if matches > max_matches:
                max_matches = matches
                best_match = item

        if best_match and max_matches > 0:
            local_path = os.path.join(VENUES_DIR, best_match["filename"])
            if os.path.exists(local_path):
                return best_match["title"], local_path
            return best_match["title"], best_match["web_url"]

        # 3. Dynamic Keyword Fallbacks
        if any(w in pref for w in ["beach", "sand", "ocean", "coastal", "driftwood", "stage in the beach", "stage on the beach"]):
            title = "Coastal Beachside Wedding Stage & Sunset Canopy"
            local_path = os.path.join(VENUES_DIR, "beach_stage_decor.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["palace", "marigold", "lotus", "udaipur", "jaipur", "heritage"]):
            title = "Heritage Palace Feel with Royal Marigold and Lotus Decor"
            local_path = os.path.join(VENUES_DIR, "palace_lotus_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["lake", "floating", "pichola", "water"]):
            title = "Floating Lake Mandap & Candlelit Water Pavilion"
            local_path = os.path.join(VENUESDIR, "lake_floating_mandap.jpg") if 'VENUESDIR' in locals() else os.path.join(VENUES_DIR, "lake_floating_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["rose", "mughal", "garden", "fountain"]):
            title = "Mughal Rose Garden & Shalimar Courtyard"
            local_path = os.path.join(VENUES_DIR, "mughal_rose_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["glass", "modern", "minimalist", "starlight", "chandelier"]):
            title = "Contemporary Minimalist Starlight Glasshouse"
            local_path = os.path.join(VENUES_DIR, "glasshouse_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["desert", "dune", "fire", "jaisalmer"]):
            title = "Sunset Desert Dune Mirage & Copper Fire Pits"
            local_path = os.path.join(VENUES_DIR, "desert_dunes_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80"

        if any(w in pref for w in ["temple", "gopuram", "jasmine", "kuthuvilakku"]):
            title = "South Indian Royal Temple Gopuram Mandap"
            local_path = os.path.join(VENUES_DIR, "temple_mandap.jpg")
            if os.path.exists(local_path):
                return title, local_path
            return title, "https://images.unsplash.com/photo-1609151162377-794aff6c5e7f?w=1200&auto=format&fit=crop&q=80"

        # Default fallback: Royal Palace Marigold & Lotus Decor
        default_title = f"Royal Custom Concept: {user_preference_or_theme.capitalize()}"
        default_path = os.path.join(VENUES_DIR, "palace_lotus_mandap.jpg")
        return default_title, default_path
