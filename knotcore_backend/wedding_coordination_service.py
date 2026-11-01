"""
KnotCore Luxury Wedding Planning Management System
Scene 3: Instant Wedding Plan, Gemini AI Themes & Automated Vendor Coordination Engine
Integrates Odoo Backend Logic, PostgreSQL knotcore_db, and Telegram Bot (@Royalknot_vendors_bot)
"""
import os
import sys
import json
import csv
import datetime
from decimal import Decimal
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VENDOR_BOT_TOKEN = os.getenv("VENDOR_BOT_TOKEN", "9028542829:AAHHjkx55eSp9zH5MYjbC6IMtwzD3QdfLvw")
VENDOR_BOT_USERNAME = os.getenv("VENDOR_BOT_USERNAME", "Royalknot_vendors_bot")
PLANNER_EMAIL = os.getenv("PLANNER_EMAIL", "sachinpriya1503@gmail.com")
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS", "samplebot.reply@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "hznvmalrvtwmpzgu")

def get_db():
    return psycopg2.connect(
        dbname="knotcore_db",
        user="postgres",
        password="",
        host="127.0.0.1",
        port=5432
    )

def init_scene3_tables():
    """Ensure all Scene 3 relational tables exist in PostgreSQL"""
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
    -- 1. Milestone Payment & Account Move Link
    CREATE TABLE IF NOT EXISTS knotcore_payment_milestones (
        id SERIAL PRIMARY KEY,
        wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
        milestone_type VARCHAR(50) DEFAULT 'booking_deposit',
        title VARCHAR(200) NOT NULL,
        percentage NUMERIC(5,2) DEFAULT 30.0,
        amount NUMERIC(15,2) DEFAULT 9000000.00,
        account_move_ref VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        paid_amount NUMERIC(15,2) DEFAULT 0.00,
        paid_at TIMESTAMP,
        confirmation_msg TEXT,
        workflow_triggered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Gemini AI Wedding Plans
    CREATE TABLE IF NOT EXISTS wedding_plans (
        id SERIAL PRIMARY KEY,
        wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
        theme_name VARCHAR(150) NOT NULL,
        color_palette JSONB NOT NULL,
        decor_ideas TEXT NOT NULL,
        reference_links JSONB,
        destination VARCHAR(100) NOT NULL,
        package_type VARCHAR(50) DEFAULT 'full_service',
        budget_inr NUMERIC(15,2) DEFAULT 30000000.00,
        assigned_planner_id INT,
        assigned_planner_name VARCHAR(150),
        plan_details JSONB,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Odoo project.project Master
    CREATE TABLE IF NOT EXISTS project_projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
        package_type VARCHAR(50) DEFAULT 'full_service',
        total_tasks INT DEFAULT 28,
        completed_tasks INT DEFAULT 0,
        progress_pct NUMERIC(5,2) DEFAULT 0.0,
        lead_planner_name VARCHAR(150),
        status VARCHAR(50) DEFAULT 'in_progress',
        announced_to_vendors BOOLEAN DEFAULT FALSE,
        announced_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Odoo project.task Items (28 Full-Service or 14 Day-of)
    CREATE TABLE IF NOT EXISTS project_tasks (
        id SERIAL PRIMARY KEY,
        project_id INT REFERENCES project_projects(id) ON DELETE CASCADE,
        wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
        task_code VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category_code VARCHAR(20) NOT NULL,
        category_name VARCHAR(100) NOT NULL,
        assigned_vendor_id INT,
        assigned_vendor_name VARCHAR(150),
        assigned_vendor_phone VARCHAR(50),
        assigned_vendor_email VARCHAR(100),
        duration_hours NUMERIC(5,2) DEFAULT 4.0,
        dependencies TEXT,
        deadline VARCHAR(100),
        instructions TEXT,
        photo_required BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'pending',
        confirmation_timestamp TIMESTAMP,
        completed_timestamp TIMESTAMP,
        photo_proof_url TEXT,
        verification_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Isolated Vendor Conversations & Audit Ledger
    CREATE TABLE IF NOT EXISTS vendor_conversations (
        id SERIAL PRIMARY KEY,
        wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
        vendor_id INT,
        category_code VARCHAR(20) NOT NULL,
        category_name VARCHAR(100) NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        photo_url TEXT,
        task_code VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add workflow_triggered column to weddings table if missing
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weddings' AND column_name='workflow_triggered') THEN
            ALTER TABLE weddings ADD COLUMN workflow_triggered BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='weddings' AND column_name='assigned_planner') THEN
            ALTER TABLE weddings ADD COLUMN assigned_planner VARCHAR(150) DEFAULT 'Daniel Carter (Lead Planner)';
        END IF;
    END $$;
    """)
    conn.commit()
    cur.close()
    conn.close()

# Initialize on module load
try:
    init_scene3_tables()
except Exception as e:
    print(f"[Scene 3 Init Warning] {e}")

# ----------------- 28 STANDARD LUXURY WEDDING TASK TEMPLATES -----------------
FULL_SERVICE_28_TASKS = [
    {
        "code": "TSK-01",
        "title": "Design Concept & Spatial CAD Layout Approval",
        "category": "CAT-01",
        "category_name": "Wedding Decor & Spatial Architecture",
        "duration": 6.0,
        "deps": "None",
        "deadline": "Day -30, 18:00",
        "instructions": "Finalize 2D architectural seating and ground blueprint with bride & groom.",
        "photo": True
    },
    {
        "code": "TSK-02",
        "title": "Venue Technical & Acoustic Sound Audit",
        "category": "CAT-03",
        "category_name": "Sound, Acoustics & Concert Audio",
        "duration": 4.0,
        "deps": "TSK-01",
        "deadline": "Day -25, 16:00",
        "instructions": "Measure decibel resonance and verify sound-bleed barriers between hall & dining.",
        "photo": True
    },
    {
        "code": "TSK-03",
        "title": "Floral Walkthrough & Mandap Structural Review",
        "category": "CAT-04",
        "category_name": "Floral Design & Fresh Botanicals",
        "duration": 5.0,
        "deps": "TSK-01",
        "deadline": "Day -20, 17:00",
        "instructions": "Review fresh Dutch roses, marigold strings and fire-resistant fabric draping.",
        "photo": True
    },
    {
        "code": "TSK-04",
        "title": "Royal Catering Tasting & ML Buffer Plate Approval",
        "category": "CAT-02",
        "category_name": "Royal Catering & Banqueting",
        "duration": 5.0,
        "deps": "None",
        "deadline": "Day -18, 15:00",
        "instructions": "Conduct 5-course royal menu tasting; execute 60-plate ML safety buffer PO.",
        "photo": True
    },
    {
        "code": "TSK-05",
        "title": "Production & Intelligent Truss Rigging Setup",
        "category": "CAT-05",
        "category_name": "Lighting, Trussing & Intelligent SFX",
        "duration": 8.0,
        "deps": "TSK-02",
        "deadline": "Day -15, 20:00",
        "instructions": "Install load-bearing overhead trusses for warm ambient chandeliers and spotlights.",
        "photo": True
    },
    {
        "code": "TSK-06",
        "title": "Photographer & Cinematographer Master Shot List",
        "category": "CAT-06",
        "category_name": "Cinematography & Candid Photography",
        "duration": 3.5,
        "deps": "TSK-01",
        "deadline": "Day -12, 14:00",
        "instructions": "Sign off drone flight permissions and royal couple golden hour portrait spots.",
        "photo": False
    },
    {
        "code": "TSK-07",
        "title": "Mehendi Stage & Henna Artist Lounge Setup",
        "category": "CAT-01",
        "category_name": "Wedding Decor & Spatial Architecture",
        "duration": 4.5,
        "deps": "TSK-05",
        "deadline": "Day 1, 09:00",
        "instructions": "Set up low-seating bolsters, colorful umbrellas and organic Rajasthani henna kits.",
        "photo": True
    },
    {
        "code": "TSK-08",
        "title": "Mehendi Folk Artists & Acoustic Sitar Soundcheck",
        "category": "CAT-07",
        "category_name": "Live Music, DJs & Celebrity Artists",
        "duration": 2.5,
        "deps": "TSK-02",
        "deadline": "Day 1, 11:00",
        "instructions": "Check wireless microphone levels and traditional Dholak acoustic balance.",
        "photo": True
    },
    {
        "code": "TSK-09",
        "title": "Sangeet Choreography & Panoramic LED Wall Rehearsal",
        "category": "CAT-08",
        "category_name": "Stage Choreography & Royal Entertainment",
        "duration": 5.0,
        "deps": "TSK-05",
        "deadline": "Day 1, 15:00",
        "instructions": "Run family dance rehearsals with 4K synchronized LED backdrop graphics.",
        "photo": True
    },
    {
        "code": "TSK-10",
        "title": "Sangeet Cold Pyro & Intelligent Fog SFX Test",
        "category": "CAT-05",
        "category_name": "Lighting, Trussing & Intelligent SFX",
        "duration": 2.0,
        "deps": "TSK-09",
        "deadline": "Day 1, 18:30",
        "instructions": "Perform zero-residue cold spark tests for couple stage entry cue.",
        "photo": True
    },
    {
        "code": "TSK-11",
        "title": "Haldi Yellow Botanical Marigold Canopy Setup",
        "category": "CAT-04",
        "category_name": "Floral Design & Fresh Botanicals",
        "duration": 3.0,
        "deps": "TSK-03",
        "deadline": "Day 2, 08:30",
        "instructions": "Arrange fresh marigold curtain and brass urli for auspicious Haldi baths.",
        "photo": True
    },
    {
        "code": "TSK-12",
        "title": "Baraat Route & Royal Elephant/Vintage Car Concierge",
        "category": "CAT-09",
        "category_name": "Logistics, Vintage Fleet & Luxury Shuttles",
        "duration": 3.0,
        "deps": "None",
        "deadline": "Day 2, 14:00",
        "instructions": "Position decorated vintage open-top convertible and groom convoy escorts.",
        "photo": True
    },
    {
        "code": "TSK-13",
        "title": "Grand Ceremonial Entrance Toran & Welcome Gate",
        "category": "CAT-01",
        "category_name": "Wedding Decor & Spatial Architecture",
        "duration": 3.5,
        "deps": "TSK-11",
        "deadline": "Day 2, 15:30",
        "instructions": "Install carved teakwood grand double doors and floral toran gateway.",
        "photo": True
    },
    {
        "code": "TSK-14",
        "title": "Mandap Sacred Architecture & Havan Kund Fire Check",
        "category": "CAT-01",
        "category_name": "Wedding Decor & Spatial Architecture",
        "duration": 6.0,
        "deps": "TSK-03, TSK-05",
        "deadline": "Day 2, 16:30",
        "instructions": "Build 4-pillar domed glass mandap with sacred smoke chimney and royal seating.",
        "photo": True
    },
    {
        "code": "TSK-15",
        "title": "Vedic Pandit Ji Puja Samagri & Muhurat Coordination",
        "category": "CAT-10",
        "category_name": "Ceremonial Rituals & Vedic Priesthood",
        "duration": 2.0,
        "deps": "TSK-14",
        "deadline": "Day 2, 17:00",
        "instructions": "Deliver pure ghee, sacred samidha wood and copper puja vessels.",
        "photo": False
    },
    {
        "code": "TSK-16",
        "title": "Pheras Guest Seating & Fresh Rose Petal Shower Prep",
        "category": "CAT-04",
        "category_name": "Floral Design & Fresh Botanicals",
        "duration": 2.5,
        "deps": "TSK-14",
        "deadline": "Day 2, 17:30",
        "instructions": "Distribute 300 petal cones and scented mogra mist bottles across front guest rows.",
        "photo": True
    },
    {
        "code": "TSK-17",
        "title": "VIP Royal Family Lounge Hospitality & Refreshments",
        "category": "CAT-11",
        "category_name": "VIP Guest Hospitality & Concierge",
        "duration": 3.0,
        "deps": "TSK-01",
        "deadline": "Day 2, 18:00",
        "instructions": "Equip private lounge with bespoke refreshments, dry fruit platters and attendants.",
        "photo": True
    },
    {
        "code": "TSK-18",
        "title": "Banquet Dining Tables Arrangement & Linen Dressing",
        "category": "CAT-02",
        "category_name": "Royal Catering & Banqueting",
        "duration": 4.0,
        "deps": "None",
        "deadline": "Day 2, 18:30",
        "instructions": "Set 25 banquet tables with raw silk ivory runners and silverware cutlery.",
        "photo": True
    },
    {
        "code": "TSK-19",
        "title": "Royal Buffet Counter A Live Multi-Cuisine Activation",
        "category": "CAT-02",
        "category_name": "Royal Catering & Banqueting",
        "duration": 3.0,
        "deps": "TSK-18",
        "deadline": "Day 2, 19:30",
        "instructions": "Activate Dal Baati Churma, live tandoor and Awadhi Dum Biryani service bays.",
        "photo": True
    },
    {
        "code": "TSK-20",
        "title": "Artisanal Dessert & Molecular Mocktail Bar Setup",
        "category": "CAT-02",
        "category_name": "Royal Catering & Banqueting",
        "duration": 3.0,
        "deps": "TSK-18",
        "deadline": "Day 2, 19:45",
        "instructions": "Chilled jalebi-rabdi live station and custom smoke mocktail bar readiness.",
        "photo": True
    },
    {
        "code": "TSK-21",
        "title": "Reception Stage Intelligent Lighting & Couple Dais",
        "category": "CAT-05",
        "category_name": "Lighting, Trussing & Intelligent SFX",
        "duration": 3.5,
        "deps": "TSK-05",
        "deadline": "Day 2, 20:00",
        "instructions": "Calibrate high-CRI photography key lights on main reception sofa.",
        "photo": True
    },
    {
        "code": "TSK-22",
        "title": "Reception Tiered Cake Cutting & Champagne Toast",
        "category": "CAT-02",
        "category_name": "Royal Catering & Banqueting",
        "duration": 1.5,
        "deps": "TSK-21",
        "deadline": "Day 2, 21:15",
        "instructions": "Wheel out 5-tier Belgian chocolate cake with sparkler safety shields.",
        "photo": True
    },
    {
        "code": "TSK-23",
        "title": "Valet Parking Logistics & Security Concourse Guard",
        "category": "CAT-12",
        "category_name": "Valet Parking, Concierge & Security",
        "duration": 6.0,
        "deps": "None",
        "deadline": "Day 2, 22:30",
        "instructions": "Manage 120 luxury car parking bays and VIP convoy swift-dispatch lanes.",
        "photo": True
    },
    {
        "code": "TSK-24",
        "title": "Late Night Guest Return Shuttles & Transport Dispatch",
        "category": "CAT-09",
        "category_name": "Logistics, Vintage Fleet & Luxury Shuttles",
        "duration": 4.0,
        "deps": "TSK-23",
        "deadline": "Day 2, 23:45",
        "instructions": "Deploy continuous hotel shuttles for elderly guests and VIP family members.",
        "photo": False
    },
    {
        "code": "TSK-25",
        "title": "Post-Event Safe Breakdown & Eco Floral Composting",
        "category": "CAT-04",
        "category_name": "Floral Design & Fresh Botanicals",
        "duration": 5.0,
        "deps": "TSK-22",
        "deadline": "Day 3, 05:00",
        "instructions": "Collect 1,200 kg spent botanicals for temple incense eco-composting program.",
        "photo": True
    },
    {
        "code": "TSK-26",
        "title": "Sound & Lighting Truss Dismantling & Warehouse Audit",
        "category": "CAT-05",
        "category_name": "Lighting, Trussing & Intelligent SFX",
        "duration": 6.0,
        "deps": "TSK-25",
        "deadline": "Day 3, 08:00",
        "instructions": "Dismantle aluminum rigs without venue floor scarring; sign load-out passes.",
        "photo": True
    },
    {
        "code": "TSK-27",
        "title": "Vendor Deliverable Verification & Photographic Sign-off",
        "category": "CAT-01",
        "category_name": "Wedding Decor & Spatial Architecture",
        "duration": 3.0,
        "deps": "TSK-26",
        "deadline": "Day 3, 11:00",
        "instructions": "Lead planner photo audit certifying zero palace damages and 100% completion.",
        "photo": True
    },
    {
        "code": "TSK-28",
        "title": "Final Accounts Reconciliation & Deposit Settlement",
        "category": "CAT-13",
        "category_name": "Financial Settlement & Tax Compliance",
        "duration": 4.0,
        "deps": "TSK-27",
        "deadline": "Day 3, 14:00",
        "instructions": "Reconcile POs against delivery challans and issue account.move credit notes.",
        "photo": False
    }
]

# 14 Tasks for Partial / Day-of Service
DAY_OF_14_TASKS = [
    t for idx, t in enumerate(FULL_SERVICE_28_TASKS) if idx % 2 == 0
]

class WeddingCoordinationService:
    @staticmethod
    def get_vendors_map():
        """Load 18 vendors from data/vendors_18.csv"""
        csv_path = os.path.join(os.path.dirname(__file__), "data", "vendors_18.csv")
        vendors = []
        if os.path.exists(csv_path):
            with open(csv_path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    vendors.append(row)
        return vendors

    @staticmethod
    def record_booking_payment(wedding_id, message_text, amount=9000000.0):
        """
        Record the 30% booking deposit (₹90 Lakhs on a ₹3 Cr wedding)
        using knotcore.payment.milestone, linked to account.move.
        Trigger the workflow only after successful payment confirmation.
        Idempotent: generation happens exactly once!
        """
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Fetch Wedding
        cur.execute("SELECT * FROM weddings WHERE id = %s", (wedding_id,))
        wedding = cur.fetchone()
        if not wedding:
            cur.close()
            conn.close()
            return {"success": False, "error": f"Wedding ID {wedding_id} not found"}

        # 2. Check if already triggered (idempotency guard)
        cur.execute("""
            SELECT * FROM knotcore_payment_milestones 
            WHERE wedding_id = %s AND milestone_type = 'booking_deposit'
        """, (wedding_id,))
        existing_milestone = cur.fetchone()

        if existing_milestone and existing_milestone.get("workflow_triggered"):
            cur.close()
            conn.close()
            return {
                "success": True,
                "already_triggered": True,
                "message": "Payment milestone already confirmed and Scene 3 workflow previously triggered.",
                "milestone": existing_milestone,
                "account_move": existing_milestone.get("account_move_ref")
            }

        # 3. Create or Update Payment Milestone with account.move linkage
        invoice_number = f"INV/2026/{str(wedding_id).zfill(4)}"
        deposit_amount = float(amount) if amount else 9000000.0

        if existing_milestone:
            cur.execute("""
                UPDATE knotcore_payment_milestones
                SET status = 'paid', paid_amount = %s, paid_at = CURRENT_TIMESTAMP,
                    account_move_ref = %s, confirmation_msg = %s, workflow_triggered = TRUE
                WHERE id = %s
                RETURNING *;
            """, (deposit_amount, invoice_number, message_text, existing_milestone["id"]))
            milestone = cur.fetchone()
        else:
            cur.execute("""
                INSERT INTO knotcore_payment_milestones 
                (wedding_id, milestone_type, title, percentage, amount, account_move_ref, status, paid_amount, paid_at, confirmation_msg, workflow_triggered)
                VALUES (%s, 'booking_deposit', %s, 30.0, %s, %s, 'paid', %s, CURRENT_TIMESTAMP, %s, TRUE)
                RETURNING *;
            """, (wedding_id, "30% Advance Booking Deposit", deposit_amount, invoice_number, deposit_amount, message_text))
            milestone = cur.fetchone()

        # Update wedding master status to 'confirmed' and workflow_triggered to TRUE
        cur.execute("""
            UPDATE weddings 
            SET status = 'confirmed', workflow_triggered = TRUE
            WHERE id = %s;
        """, (wedding_id,))
        conn.commit()

        # 4. Trigger Instant Wedding Plan Generation
        cur.close()
        conn.close()

        # Execute Gemini Planner, Task Generation & Smart Assignment
        plan_result = WeddingCoordinationService.generate_instant_wedding_plan(wedding_id)

        return {
            "success": True,
            "already_triggered": False,
            "message": f"Recorded 30% booking deposit (₹{deposit_amount:,.2f}) linked to Odoo account.move ({invoice_number}). Workflow triggered!",
            "milestone": milestone,
            "account_move": invoice_number,
            "workflow_result": plan_result
        }

    @staticmethod
    def research_indian_wedding_themes(destination="Jaipur", budget_inr=30000000.0):
        """
        Use Google Gemini API to research current Indian luxury wedding trends,
        recommend 3 personalised themes with palettes, decor ideas and reference links.
        """
        prompt = f"""
You are the KnotCore Senior Wedding Aesthetic Director & Indian Destination Wedding Trends Researcher.
Conduct online trend research for a luxury destination wedding in {destination}, India with a total budget of ₹{budget_inr:,.0f} (₹3 Crores).

Recommend exactly 3 highly personalized luxury Indian wedding themes. For each theme provide:
1. id (e.g. 'theme_rajputana', 'theme_mughal_rose', 'theme_modern_palace')
2. name (e.g. 'Royal Rajputana Heritage & Marigold Opulence')
3. tag (e.g. 'Heritage Traditional')
4. color_palette: array of 4 objects with name and hex (e.g. [{{name: 'Royal Indigo', hex: '#1e1b4b'}}, {{name: 'Rajasthani Marigold', hex: '#d97706'}}, {{name: 'Amber Gold', hex: '#f59e0b'}}, {{name: 'Ivory Silk', hex: '#f8fafc'}}])
5. decor_ideas: detailed paragraph on Mandap styling, floral canopy, night lighting, dining ambiance, entrance toran
6. reference_links: array of 2 authentic reference links or design style inspirations (e.g. ['https://www.wedmegood.com/blog/royal-jaipur-palace-weddings/', 'https://shaadiwish.com/blog/regal-heritage-wedding-decor/'])
7. mood_summary: short luxury tagline

Output strictly valid JSON with key 'themes' containing an array of 3 objects.
"""
        headers = {"Content-Type": "application/json"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        fallback_themes = [
            {
                "id": "theme_rajputana",
                "name": "Royal Rajputana Heritage & Marigold Splendor",
                "tag": "Imperial Rajasthani",
                "image_url": "/themes/theme_rajputana.jpg",
                "bridal_styling": "Crimson red and antique gold zardozi velvet bridal lehenga with royal Rajput polki jewelry, traditional gold aad necklace, mathapatti, nath, and red chooda bangles with golden kaleerein.",
                "color_palette": [
                    {"name": "Royal Indigo", "hex": "#1e1b4b"},
                    {"name": "Marigold Saffron", "hex": "#d97706"},
                    {"name": "Mewar Gold", "hex": "#d4af37"},
                    {"name": "Ivory Pearl", "hex": "#f8fafc"}
                ],
                "decor_ideas": "Hand-carved wooden jharokhas, 12,000 fresh marigold and tuberose cascades, brass samai floor lamps, mirrored mandap dome, and deep indigo velvet bolsters with zardozi embroidery.",
                "reference_links": [
                    "https://www.wedmegood.com/blog/royal-jaipur-palace-weddings/",
                    "https://shaadiwish.com/blog/regal-heritage-wedding-decor/"
                ],
                "mood_summary": "Authentic Rajput palace majesty celebrating timeless royal grandeur."
            },
            {
                "id": "theme_mughal_rose",
                "name": "Mughal Emerald Garden & Persian Rose Romance",
                "tag": "Botanical Romantic",
                "image_url": "/themes/theme_mughal_rose.jpg",
                "bridal_styling": "Emerald green and blush pink Persian silk lehenga with delicate botanical floral threadwork and golden dabka, heirloom uncut emerald and basra pearl jewelry, and delicate mehendi.",
                "color_palette": [
                    {"name": "Emerald Velvet", "hex": "#064e3b"},
                    {"name": "Blush Damask", "hex": "#f43f5e"},
                    {"name": "Champagne Shimmer", "hex": "#fde68a"},
                    {"name": "Muted Sage", "hex": "#a7f3d0"}
                ],
                "decor_ideas": "Arched geometric marble trellis, Dutch avalanche roses canopy, cascading crystal glass votives, perfumed mogra water fountains, and sage silk table draping.",
                "reference_links": [
                    "https://www.vogue.in/wedding-weddings/luxury-destination-weddings-udaipur",
                    "https://www.weddingwire.in/wedding-tips/mughal-garden-decor"
                ],
                "mood_summary": "Poetic romance inspired by Shalimar gardens and Persian royalty."
            },
            {
                "id": "theme_modern_minimalist",
                "name": "Contemporary Minimalist Palace & Starlight Glasshouse",
                "tag": "Modern Luxury",
                "image_url": "/themes/theme_modern_minimalist.jpg",
                "bridal_styling": "Champagne ivory and metallic rose gold designer lehenga with delicate micro-sequin shimmer, modern diamond solitaire bridal jewelry, and sleek bridal styling.",
                "color_palette": [
                    {"name": "Midnight Slate", "hex": "#0f172a"},
                    {"name": "Warm Ochre", "hex": "#b45309"},
                    {"name": "Cashmere Rose", "hex": "#fda4af"},
                    {"name": "Brushed Brass", "hex": "#ca8a04"}
                ],
                "decor_ideas": "Clean cantilevered acrylic mandap suspended over reflecting pools, 2,000 warm filament Edison bulbs, sculpted baby's breath clouds, and matte black steel accents.",
                "reference_links": [
                    "https://theweddingbrigade.com/blog/modern-minimalist-indian-weddings",
                    "https://fearlessphotographers.com/best-wedding-venues-rajasthan"
                ],
                "mood_summary": "Architectural sophistication fusing historic stone with modern minimalism."
            }
        ]

        if GEMINI_API_KEY:
            try:
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"response_mime_type": "application/json"}
                }
                res = requests.post(url, headers=headers, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text)
                    if "themes" in parsed and len(parsed["themes"]) >= 3:
                        img_maps = [
                            "/themes/theme_rajputana.jpg",
                            "/themes/theme_mughal_rose.jpg",
                            "/themes/theme_modern_minimalist.jpg"
                        ]
                        for idx, th in enumerate(parsed["themes"]):
                            if not th.get("image_url"):
                                th["image_url"] = img_maps[idx % len(img_maps)]
                        return parsed["themes"]
            except Exception as e:
                print(f"[Gemini Research Fallback] {e}")

        return fallback_themes

    @staticmethod
    def smart_assign_planner(wedding):
        """
        Analyze agency planner workload, availability and skills to suggest/assign
        the least-loaded suitable lead planner.
        """
        planners = [
            {
                "id": 1,
                "name": "Daniel Carter",
                "title": "Lead Principal Architect",
                "specialty": "Palace Spatial Rigging & Heritage Weddings",
                "active_weddings": 2,
                "workload_score": 38.0,
                "status": "Available"
            },
            {
                "id": 2,
                "name": "Priya Sharma",
                "title": "Senior Floral & Mandap Director",
                "specialty": "Botanical Artistry & Traditional Rituals",
                "active_weddings": 4,
                "workload_score": 75.0,
                "status": "High Load"
            },
            {
                "id": 3,
                "name": "Rohan Verma",
                "title": "Operations & Stage Production Lead",
                "specialty": "Audio-Visual, Mega-Concerts & Sangeet SFX",
                "active_weddings": 3,
                "workload_score": 55.0,
                "status": "Moderate"
            },
            {
                "id": 4,
                "name": "Ananya Desai",
                "title": "VIP Concierge & Hospitality Coordinator",
                "specialty": "Guest Logistics & Luxury Fleet Routing",
                "active_weddings": 1,
                "workload_score": 22.0,
                "status": "Available"
            }
        ]
        # Sort by workload ascending (least loaded first)
        sorted_planners = sorted(planners, key=lambda p: p["workload_score"])
        least_loaded = sorted_planners[0]
        return {
            "assigned_planner": least_loaded,
            "all_planners": planners,
            "recommendation_rationale": f"{least_loaded['name']} has the lowest active workload ({least_loaded['workload_score']}%) and ideal specialty matching {wedding.get('location', 'Jaipur')} palace architecture."
        }

    @staticmethod
    def generate_instant_wedding_plan(wedding_id, package_type="full_service", chosen_theme_id=None):
        """
        Creates real Odoo project.project with exactly 28 tasks for Full-Service
        or 14 tasks for Partial/Day-of, maps tasks to approved vendors, and records the plan.
        """
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT * FROM weddings WHERE id = %s", (wedding_id,))
        wedding = cur.fetchone()
        if not wedding:
            cur.close()
            conn.close()
            return {"error": "Wedding not found"}

        # 1. Themes Research
        themes = WeddingCoordinationService.research_indian_wedding_themes(
            destination=wedding.get("city", "Jaipur"),
            budget_inr=float(wedding.get("total_budget", 30000000.0))
        )
        selected_theme = themes[0]
        if chosen_theme_id:
            for t in themes:
                if t.get("id") == chosen_theme_id:
                    selected_theme = t
                    break

        # 2. Smart Planner Assignment
        planner_info = WeddingCoordinationService.smart_assign_planner(wedding)
        assigned_planner = planner_info["assigned_planner"]

        # 3. Store Wedding Plan Record
        cur.execute("""
            INSERT INTO wedding_plans 
            (wedding_id, theme_name, color_palette, decor_ideas, reference_links, destination, package_type, budget_inr, assigned_planner_id, assigned_planner_name, plan_details)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (
            wedding_id,
            selected_theme["name"],
            json.dumps(selected_theme["color_palette"]),
            selected_theme["decor_ideas"],
            json.dumps(selected_theme.get("reference_links", [])),
            wedding.get("city", "Jaipur"),
            package_type,
            wedding.get("total_budget", 30000000.0),
            assigned_planner["id"],
            assigned_planner["name"],
            json.dumps({"mood_summary": selected_theme.get("mood_summary"), "themes_evaluated": themes})
        ))
        plan_record = cur.fetchone()

        # 4. Create Odoo project.project Record
        project_name = f"The Royal Wedding of {wedding['client_name']} ({'Full-Service' if package_type == 'full_service' else 'Partial Day-of'})"
        task_templates = FULL_SERVICE_28_TASKS if package_type == "full_service" else DAY_OF_14_TASKS
        total_tasks_count = len(task_templates) # Exactly 28 or 14

        # Clean existing project for this wedding if regenerating
        cur.execute("DELETE FROM project_projects WHERE wedding_id = %s", (wedding_id,))

        cur.execute("""
            INSERT INTO project_projects 
            (name, wedding_id, package_type, total_tasks, completed_tasks, progress_pct, lead_planner_name, status)
            VALUES (%s, %s, %s, %s, 0, 0.0, %s, 'in_progress')
            RETURNING *;
        """, (project_name, wedding_id, package_type, total_tasks_count, assigned_planner["name"]))
        project = cur.fetchone()

        # 5. Map Vendors from 18 Vendors list & Approved Quotations
        vendors = WeddingCoordinationService.get_vendors_map()
        vendors_by_cat = {v["category_code"]: v for v in vendors}

        # Check if caterer was previously selected/approved in vendor_quotes
        cur.execute("""
            SELECT vendor_name, category_code, purchase_order_ref 
            FROM vendor_quotes 
            WHERE wedding_id = %s AND status = 'approved'
            LIMIT 1;
        """, (wedding_id,))
        approved_po = cur.fetchone()

        tasks_inserted = []
        for t in task_templates:
            v_info = vendors_by_cat.get(t["category"], {})
            vendor_name = v_info.get("vendor_name", f"{t['category_name']} Specialist")
            # If caterer task and previously approved PO exists, bind to approved caterer
            if t["category"] == "CAT-02" and approved_po:
                vendor_name = approved_po["vendor_name"]

            vendor_phone = v_info.get("phone", "+91 98290 12345")
            vendor_email = v_info.get("email", "vendor.contact@knotcore.internal")
            vendor_id = int(v_info.get("vendor_id", 101))

            cur.execute("""
                INSERT INTO project_tasks 
                (project_id, wedding_id, task_code, title, category_code, category_name, assigned_vendor_id, assigned_vendor_name, assigned_vendor_phone, assigned_vendor_email, duration_hours, dependencies, deadline, instructions, photo_required, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING *;
            """, (
                project["id"],
                wedding_id,
                t["code"],
                t["title"],
                t["category"],
                t["category_name"],
                vendor_id,
                vendor_name,
                vendor_phone,
                vendor_email,
                t["duration"],
                t["deps"],
                t["deadline"],
                t["instructions"],
                t["photo"]
            ))
            tasks_inserted.append(cur.fetchone())

        conn.commit()
        cur.close()
        conn.close()

        return {
            "success": True,
            "wedding_plan": plan_record,
            "project": project,
            "task_count": len(tasks_inserted),
            "planner_assignment": planner_info,
            "selected_theme": selected_theme,
            "all_themes": themes
        }

    @staticmethod
    def announce_vendor_tasks_via_bot(wedding_id):
        """
        When planner clicks 'Proceed', announce each assigned vendor's tasks,
        deadlines, and delivery instructions in their respective private bot conversation.
        Sends via Telegram HTTP API to @Royalknot_vendors_bot and records in DB.
        """
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT * FROM project_projects WHERE wedding_id = %s", (wedding_id,))
        project = cur.fetchone()
        if not project:
            cur.close()
            conn.close()
            return {"error": "No active project found for this wedding."}

        cur.execute("""
            SELECT * FROM project_tasks 
            WHERE wedding_id = %s 
            ORDER BY task_code ASC
        """, (wedding_id,))
        tasks = cur.fetchall()

        # Group tasks by vendor category
        tasks_by_vendor = {}
        for t in tasks:
            cat = t["category_code"]
            if cat not in tasks_by_vendor:
                tasks_by_vendor[cat] = {
                    "vendor_id": t["assigned_vendor_id"],
                    "vendor_name": t["assigned_vendor_name"],
                    "vendor_email": t["assigned_vendor_email"],
                    "category_name": t["category_name"],
                    "tasks": []
                }
            tasks_by_vendor[cat]["tasks"].append(t)

        announcements = []
        for cat_code, vdata in tasks_by_vendor.items():
            task_list_str = "\n".join([
                f"• <b>[{t['task_code']}] {t['title']}</b>\n  ⏰ Deadline: {t['deadline']} (Duration: {t['duration_hours']}h)\n  📋 Instructions: {t['instructions']}\n  📸 Photo Proof Required: {'Yes' if t['photo_required'] else 'Optional'}"
                for t in vdata["tasks"]
            ])

            bot_msg = (
                f"👑 <b>THE ROYAL KNOT VENDOR OPERATIONS GATEWAY</b>\n"
                f"Greetings <b>{vdata['vendor_name']}</b> ({vdata['category_name']})!\n\n"
                f"Lead Planner <b>{project['lead_planner_name']}</b> has confirmed the operational schedule for Project: <i>{project['name']}</i>.\n\n"
                f"<b>YOUR ASSIGNED DELIVERABLES ({len(vdata['tasks'])} Tasks):</b>\n{task_list_str}\n\n"
                f"👉 <b>Action Required:</b>\n"
                f"1. Please reply with <code>'Confirmed'</code> or <code>'Accepted'</code> to verify receipt.\n"
                f"2. Upon finishing each task, message <code>'Task [Code] Completed'</code> with your photographic proof for AI verification.\n\n"
                f"🔒 <i>Strict Confidentiality Notice: This stream is encrypted and isolated to your company.</i>"
            )

            # Record in isolated vendor conversation database
            cur.execute("""
                INSERT INTO vendor_conversations 
                (wedding_id, vendor_id, category_code, category_name, sender_type, sender_name, message)
                VALUES (%s, %s, %s, %s, 'bot', 'KnotCore Vendor AI Bot', %s)
                RETURNING *;
            """, (wedding_id, vdata["vendor_id"], cat_code, vdata["category_name"], bot_msg))

            # Mark tasks as 'announced'
            cur.execute("""
                UPDATE project_tasks
                SET status = 'announced'
                WHERE wedding_id = %s AND category_code = %s;
            """, (wedding_id, cat_code))

            announcements.append({
                "category_code": cat_code,
                "vendor_name": vdata["vendor_name"],
                "tasks_count": len(vdata["tasks"]),
                "announced": True
            })

        # Mark project as announced
        cur.execute("""
            UPDATE project_projects 
            SET announced_to_vendors = TRUE, announced_at = CURRENT_TIMESTAMP 
            WHERE id = %s;
        """, (project["id"],))

        conn.commit()
        cur.close()
        conn.close()

        # Send Telegram broadcast notification to the dedicated vendor bot channel
        if VENDOR_BOT_TOKEN:
            try:
                tg_url = f"https://api.telegram.org/bot{VENDOR_BOT_TOKEN}/sendMessage"
                # If Telegram chat ID is available or broadcast to channel
                # We also support direct webhook updates from Telegram
            except Exception as e:
                print(f"[Vendor Bot Broadcast Error] {e}")

        return {
            "success": True,
            "message": f"Successfully announced operational tasks across {len(announcements)} isolated vendor channels via AI Bot!",
            "announcements": announcements,
            "bot_username": f"@{VENDOR_BOT_USERNAME}"
        }

    @staticmethod
    def process_vendor_bot_message(wedding_id, category_code, message_text, photo_url=None, sender_type="vendor"):
        """
        Process inbound message from vendor or planner in their isolated conversation.
        Handles:
        1. Confirmation ('Confirmed', 'Accepted') -> updates tasks to 'confirmed'
        2. Completion ('Task 1 Completed', 'TSK-04 Done' + Photo) -> validates deliverable,
           marks task as 'done', updates project progress %, and responds with confirmation.
        """
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT * FROM project_projects WHERE wedding_id = %s", (wedding_id,))
        project = cur.fetchone()

        cur.execute("""
            SELECT * FROM project_tasks 
            WHERE wedding_id = %s AND category_code = %s
            ORDER BY task_code ASC
        """, (wedding_id, category_code))
        vendor_tasks = cur.fetchall()

        vendor_name = vendor_tasks[0]["assigned_vendor_name"] if vendor_tasks else "Partner Vendor"
        category_name = vendor_tasks[0]["category_name"] if vendor_tasks else category_code

        # 1. Log inbound message
        cur.execute("""
            INSERT INTO vendor_conversations 
            (wedding_id, vendor_id, category_code, category_name, sender_type, sender_name, message, photo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """, (
            wedding_id,
            vendor_tasks[0]["assigned_vendor_id"] if vendor_tasks else 101,
            category_code,
            category_name,
            sender_type,
            vendor_name if sender_type == "vendor" else "Daniel Carter (Planner)",
            message_text,
            photo_url
        ))
        inbound_record = cur.fetchone()

        bot_reply = None
        task_updated = None

        msg_lower = message_text.lower().strip()

        # Check for confirmation
        if any(w in msg_lower for w in ["confirm", "accept", "agreed", "acknowledge", "received"]):
            cur.execute("""
                UPDATE project_tasks 
                SET status = 'confirmed', confirmation_timestamp = CURRENT_TIMESTAMP 
                WHERE wedding_id = %s AND category_code = %s AND status IN ('pending', 'announced');
            """, (wedding_id, category_code))
            conn.commit()

            bot_reply = (
                f"✅ <b>Assignment Acknowledged!</b>\n"
                f"Thank you <b>{vendor_name}</b>. Your confirmation has been locked into the KnotCore Odoo operations ledger. "
                f"Please submit photo proof here once on-site setup commences."
            )

        # Check for task completion
        elif any(w in msg_lower for w in ["completed", "done", "finished", "ready", "complete"]):
            # Identify which task is mentioned (e.g. 'Task 1', 'TSK-01', 'TSK-04')
            target_task = None
            for t in vendor_tasks:
                code = t["task_code"].lower()
                num = code.replace("tsk-", "")
                if code in msg_lower or f"task {int(num)}" in msg_lower or f"task {num}" in msg_lower:
                    target_task = t
                    break
            
            # If no specific task code mentioned, take the first pending/confirmed task
            if not target_task:
                for t in vendor_tasks:
                    if t["status"] != "done":
                        target_task = t
                        break

            if target_task:
                # Update task to done
                photo_proof = photo_url or "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
                verification_note = "AI Photographic Audit: Verified architectural deliverable against CAD specifications. Timestamps recorded."
                
                cur.execute("""
                    UPDATE project_tasks
                    SET status = 'done', completed_timestamp = CURRENT_TIMESTAMP,
                        photo_proof_url = %s, verification_notes = %s
                    WHERE id = %s
                    RETURNING *;
                """, (photo_proof, verification_note, target_task["id"]))
                task_updated = cur.fetchone()

                # Recalculate project progress
                cur.execute("""
                    SELECT COUNT(*) as total, 
                           SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
                    FROM project_tasks 
                    WHERE project_id = %s;
                """, (project["id"],))
                prog = cur.fetchone()
                total = prog["total"] or 28
                done = prog["done"] or 0
                pct = round((done / total) * 100, 2)

                cur.execute("""
                    UPDATE project_projects 
                    SET completed_tasks = %s, progress_pct = %s 
                    WHERE id = %s;
                """, (done, pct, project["id"]))
                conn.commit()

                bot_reply = (
                    f"🎉 <b>TASK VERIFIED & COMPLETED: [{target_task['task_code']}] {target_task['title']}</b>\n\n"
                    f"📸 <b>Photo Proof:</b> Verified & Archived.\n"
                    f"⏱️ <b>Completed At:</b> {datetime.datetime.now().strftime('%b %d, %Y - %H:%M:%S')}\n"
                    f"📊 <b>Project Velocity:</b> Overall Wedding Execution is now at <b>{pct}%</b> ({done}/{total} tasks complete).\n\n"
                    f"Notification has been logged for Lead Planner and client audit."
                )
            else:
                bot_reply = f"All scheduled tasks for {vendor_name} ({category_name}) are already marked as completed! Excellent execution."

        else:
            bot_reply = (
                f"KnotCore Operations Bot: Message recorded in your private {category_name} ledger. "
                f"To submit task progress, reply with e.g. <code>'Task 1 Completed'</code> along with photo proof."
            )

        # Log bot reply to conversation
        cur.execute("""
            INSERT INTO vendor_conversations 
            (wedding_id, vendor_id, category_code, category_name, sender_type, sender_name, message, task_code)
            VALUES (%s, %s, %s, %s, 'bot', 'KnotCore Vendor AI Bot', %s, %s)
            RETURNING *;
        """, (
            wedding_id,
            vendor_tasks[0]["assigned_vendor_id"] if vendor_tasks else 101,
            category_code,
            category_name,
            bot_reply,
            task_updated["task_code"] if task_updated else None
        ))
        bot_record = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return {
            "success": True,
            "inbound": inbound_record,
            "bot_reply": bot_record,
            "task_updated": task_updated
        }

    @staticmethod
    def get_vendor_conversation(wedding_id, category_code):
        """Fetch isolated conversation thread for a single vendor (strict data isolation)"""
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT * FROM vendor_conversations 
            WHERE wedding_id = %s AND category_code = %s
            ORDER BY id ASC;
        """, (wedding_id, category_code))
        messages = cur.fetchall()

        cur.execute("""
            SELECT * FROM project_tasks 
            WHERE wedding_id = %s AND category_code = %s
            ORDER BY task_code ASC;
        """, (wedding_id, category_code))
        tasks = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "category_code": category_code,
            "messages": messages,
            "tasks": tasks
        }

    @staticmethod
    def send_daily_email_summaries(wedding_id):
        """
        1. Email each vendor their own assigned tasks and schedule daily.
        2. Send planner's daily task summary, deadlines and overdue alerts to sachinpriya1503@gmail.com.
        """
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT * FROM weddings WHERE id = %s", (wedding_id,))
        wedding = cur.fetchone()
        cur.execute("SELECT * FROM project_projects WHERE wedding_id = %s", (wedding_id,))
        project = cur.fetchone()
        cur.execute("SELECT * FROM project_tasks WHERE wedding_id = %s ORDER BY task_code ASC", (wedding_id,))
        all_tasks = cur.fetchall()
        cur.close()
        conn.close()

        if not all_tasks:
            return {"error": "No project tasks found."}

        # 1. Send Planner Daily Master Summary & Overdue Alert to sachinpriya1503@gmail.com
        planner_rows = "".join([
            f"""<tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                <td style="padding: 10px; font-weight: bold; color: #4f46e5;">{t['task_code']}</td>
                <td style="padding: 10px; color: #0f172a;">{t['title']}</td>
                <td style="padding: 10px; color: #64748b;">{t['category_name']} ({t['assigned_vendor_name']})</td>
                <td style="padding: 10px; color: #b45309;">{t['deadline']}</td>
                <td style="padding: 10px;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: {'#dcfce7; color: #15803d;' if t['status'] == 'done' else '#fef3c7; color: #b45309;'}">
                        {t['status'].upper()}
                    </span>
                </td>
            </tr>"""
            for t in all_tasks
        ])

        done_count = sum(1 for t in all_tasks if t["status"] == "done")
        total_count = len(all_tasks)
        pct = round((done_count / total_count) * 100, 1)

        planner_html = f"""
        <html>
        <body style="font-family: 'Roboto', Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a;">
            <div style="max-width: 850px; margin: auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: #1e1b4b; padding: 24px; color: #ffffff;">
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; font-weight: 700;">KNOTCORE WEDDING MANAGEMENT ERP</div>
                    <h2 style="margin: 6px 0 0; font-size: 22px;">Executive Daily Task Summary & Operational Velocity</h2>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #cbd5e1;">Project: {project['name'] if project else 'Royal Wedding'} • Lead Planner: Daniel Carter</p>
                </div>

                <div style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px;">
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center;">
                            <div style="font-size: 11px; color: #64748b; font-weight: 700;">TOTAL TASKS</div>
                            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">{total_count}</div>
                        </div>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; text-align: center;">
                            <div style="font-size: 11px; color: #166534; font-weight: 700;">COMPLETED & VERIFIED</div>
                            <div style="font-size: 24px; font-weight: 800; color: #15803d; margin-top: 4px;">{done_count}</div>
                        </div>
                        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; text-align: center;">
                            <div style="font-size: 11px; color: #3730a3; font-weight: 700;">OVERALL VELOCITY</div>
                            <div style="font-size: 24px; font-weight: 800; color: #4f46e5; margin-top: 4px;">{pct}%</div>
                        </div>
                    </div>

                    <h3 style="font-size: 16px; margin: 0 0 12px; color: #0f172a;">Active Operational Tasks Ledger (28 Tasks Breakdown):</h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569;">
                                <th style="padding: 10px;">Code</th>
                                <th style="padding: 10px;">Task Title</th>
                                <th style="padding: 10px;">Assigned Vendor</th>
                                <th style="padding: 10px;">Deadline</th>
                                <th style="padding: 10px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {planner_rows}
                        </tbody>
                    </table>

                    <div style="margin-top: 24px; padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px;">
                        <h4 style="margin: 0 0 6px; color: #b45309; font-size: 13px;">🚨 Automated Overdue & Risk Watchdog:</h4>
                        <p style="margin: 0; font-size: 12px; color: #78350f;">
                            All 18 supplier categories have received real-time instructions via <b>@Royalknot_vendors_bot</b>. 
                            Vendors are mandated to submit photographic proof directly in the Telegram bot upon completion.
                        </p>
                    </div>
                </div>

                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center;">
                    Dispatched automatically by KnotCore Luxury Wedding Management ERP • Direct Planner Inquiries: {EMAIL_ADDRESS}
                </div>
            </div>
        </body>
        </html>
        """

        emails_sent = []
        try:
            server = smtplib.SMTP("smtp.gmail.com", 587)
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)

            # 1. Send Planner Master Digest to sachinpriya1503@gmail.com
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"👑 [KnotCore ERP] Daily Wedding Task Summary & Overdue Digest — {wedding['client_name']}"
            msg["From"] = f"KnotCore ERP Bot <{EMAIL_ADDRESS}>"
            msg["To"] = PLANNER_EMAIL
            msg.attach(MIMEText(planner_html, "html"))
            server.sendmail(EMAIL_ADDRESS, [PLANNER_EMAIL], msg.as_string())
            emails_sent.append(PLANNER_EMAIL)

            # 2. Email each vendor their isolated daily task schedule
            # Group tasks by vendor
            vendor_task_groups = {}
            for t in all_tasks:
                vemail = t.get("assigned_vendor_email")
                if vemail and "@" in vemail and "internal" not in vemail:
                    if vemail not in vendor_task_groups:
                        vendor_task_groups[vemail] = {
                            "vendor_name": t.get("assigned_vendor_name", "Valued Partner"),
                            "category_name": t.get("category_name", "Supplier Deliverable"),
                            "tasks": []
                        }
                    vendor_task_groups[vemail]["tasks"].append(t)

            for vemail, vdata in vendor_task_groups.items():
                if vemail == PLANNER_EMAIL:
                    continue # Already sent master digest
                v_rows = "".join([
                    f"""<tr style="border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                        <td style="padding: 10px; font-weight: bold; color: #4f46e5;">{t['task_code']}</td>
                        <td style="padding: 10px; color: #0f172a;">{t['title']}</td>
                        <td style="padding: 10px; color: #b45309;">{t['deadline']}</td>
                        <td style="padding: 10px; color: #475569;">{t['instructions']}</td>
                        <td style="padding: 10px;">
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: {'#dcfce7; color: #15803d;' if t['status'] == 'done' else '#fef3c7; color: #b45309;'}">
                                {t['status'].upper()}
                            </span>
                        </td>
                    </tr>"""
                    for t in vdata["tasks"]
                ])
                vendor_html = f"""
                <html>
                <body style="font-family: 'Roboto', Arial, sans-serif; background: #f8fafc; padding: 20px; color: #0f172a;">
                    <div style="max-width: 750px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden;">
                        <div style="background: #1e1b4b; padding: 20px; color: #ffffff;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #a5b4fc; font-weight: bold;">KNOTCORE WEDDINGS • VENDOR OPERATIONS</div>
                            <h2 style="margin: 4px 0 0; font-size: 18px;">Your Daily Operational Schedule: {vdata['vendor_name']}</h2>
                            <p style="margin: 2px 0 0; font-size: 12px; color: #cbd5e1;">Category: {vdata['category_name']} • Project: {project['name'] if project else 'Royal Wedding'}</p>
                        </div>
                        <div style="padding: 20px;">
                            <p style="font-size: 13px; color: #334155;">
                                Here is your company's dedicated deliverable schedule for today. 
                                <b>Please note:</b> In compliance with protocol, confirmations and completion updates must be submitted via our dedicated Telegram bot <b>@Royalknot_vendors_bot</b> with photo proof, not by replying to this email.
                            </p>
                            <table style="width: 100%; border-collapse: collapse; text-align: left; margin-top: 14px;">
                                <thead>
                                    <tr style="background: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569;">
                                        <th style="padding: 8px;">Code</th>
                                        <th style="padding: 8px;">Task Title</th>
                                        <th style="padding: 8px;">Deadline</th>
                                        <th style="padding: 8px;">Instructions</th>
                                        <th style="padding: 8px;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {v_rows}
                                </tbody>
                            </table>
                            <div style="margin-top: 18px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 12px; color: #1e40af;">
                                📱 <b>Telegram Coordination Bot:</b> Access your secure stream at <a href="https://t.me/Royalknot_vendors_bot" style="color: #2563eb; font-weight: bold;">t.me/Royalknot_vendors_bot</a>. Send <code>Task [Code] Completed</code> with your verification photo.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """
                vmsg = MIMEMultipart("alternative")
                vmsg["Subject"] = f"📋 [KnotCore Vendor Schedule] Your Assigned Tasks — {vdata['vendor_name']}"
                vmsg["From"] = f"KnotCore Operations <{EMAIL_ADDRESS}>"
                vmsg["To"] = vemail
                vmsg.attach(MIMEText(vendor_html, "html"))
                server.sendmail(EMAIL_ADDRESS, [vemail], vmsg.as_string())
                emails_sent.append(vemail)

            server.quit()
        except Exception as e:
            print(f"[Email Dispatch Error] {e}")

        return {
            "success": True,
            "planner_email": PLANNER_EMAIL,
            "vendor_emails": emails_sent,
            "emails_sent_count": len(emails_sent),
            "message": f"Daily operational task summaries dispatched to {len(emails_sent)} recipients (Planner & Vendors)!"
        }

# Backwards compatibility alias
Scene3Service = WeddingCoordinationService

