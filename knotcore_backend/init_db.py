"""
KnotCore Luxury Wedding Planning Management System
PostgreSQL Schema Initialization & Live Seeding Script
Database: knotcore_db on localhost:5432
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime

DB_CONFIG = {
    "dbname": "knotcore_db",
    "user": "postgres",
    "password": "",
    "host": "127.0.0.1",
    "port": 5432
}

SCHEMA_SQL = """
-- Drop existing tables if needed
DROP TABLE IF EXISTS variations_ledger CASCADE;
DROP TABLE IF EXISTS guest_passes CASCADE;
DROP TABLE IF EXISTS milestone_billings CASCADE;
DROP TABLE IF EXISTS venue_geotracker CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS run_sheet_items CASCADE;
DROP TABLE IF EXISTS operations_tasks CASCADE;
DROP TABLE IF EXISTS vendor_quotes CASCADE;
DROP TABLE IF EXISTS budget_allocations CASCADE;
DROP TABLE IF EXISTS crm_inquiries CASCADE;
DROP TABLE IF EXISTS founder_intelligence CASCADE;
DROP TABLE IF EXISTS weddings CASCADE;

-- 1. Master Weddings Table (Phase 1)
CREATE TABLE weddings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    client_email VARCHAR(100),
    location VARCHAR(150) NOT NULL,
    city VARCHAR(50) NOT NULL,
    wedding_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget NUMERIC(15,2) NOT NULL,
    confirmed_guests INT NOT NULL,
    predicted_guests INT NOT NULL,
    food_plates_buffer INT NOT NULL,
    buffer_percentage NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    sentiment_score NUMERIC(5,2) DEFAULT 0.95,
    host_pin VARCHAR(10) DEFAULT '2026',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 18-Category Budget Allocations (Phase 3)
CREATE TABLE budget_allocations (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    category_code VARCHAR(20) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    allocated_amount NUMERIC(15,2) NOT NULL,
    committed_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL,
    variance NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'on_track'
);

-- 3. Vendor Quotes & WCI Scoring (Phase 3)
CREATE TABLE vendor_quotes (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    category_code VARCHAR(20) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    vendor_name VARCHAR(150) NOT NULL,
    quoted_price NUMERIC(15,2) NOT NULL,
    historical_avg NUMERIC(15,2) NOT NULL,
    std_dev NUMERIC(15,2) NOT NULL,
    quality_score NUMERIC(5,2) NOT NULL,
    delivery_score NUMERIC(5,2) NOT NULL,
    financial_stability_score NUMERIC(5,2) NOT NULL,
    wci_score NUMERIC(5,2) NOT NULL,
    anomaly_flag BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'submitted',
    purchase_order_ref VARCHAR(100)
);

-- 4. 26-Node Dynamic Task Graph (Phase 4)
CREATE TABLE operations_tasks (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    task_code VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    duration_hours NUMERIC(5,2) NOT NULL,
    dependencies TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    delay_hours NUMERIC(5,2) DEFAULT 0.0,
    is_critical_path BOOLEAN DEFAULT FALSE,
    assigned_team VARCHAR(100)
);

-- 5. Minute-by-Minute Run Sheet (Phase 4)
CREATE TABLE run_sheet_items (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    scheduled_time VARCHAR(20) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    location VARCHAR(200) NOT NULL,
    lead_person VARCHAR(100) NOT NULL,
    vendor_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delay_minutes INT DEFAULT 0,
    notes TEXT
);

-- 6. Emergency Incidents Desk (Phase 4)
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    incident_code VARCHAR(50) NOT NULL UNIQUE,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location VARCHAR(200) NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open',
    action_taken TEXT,
    resolved_at TIMESTAMP
);

-- 7. Venue GeoTracker Fleet Logistics (Phase 4)
CREATE TABLE venue_geotracker (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    vehicle_code VARCHAR(50) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    cargo_type VARCHAR(150) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    destination VARCHAR(200) NOT NULL,
    eta_minutes INT NOT NULL,
    status VARCHAR(50) DEFAULT 'in_transit'
);

-- 8. 3-Stage Milestone Billing (Phase 5)
CREATE TABLE milestone_billings (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    milestone_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_ref VARCHAR(100)
);

-- 9. Digital Dynamic Guest Passes (Phase 5)
CREATE TABLE guest_passes (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    pass_code VARCHAR(100) NOT NULL UNIQUE,
    guest_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    qr_token VARCHAR(255) NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP,
    check_in_gate VARCHAR(100),
    host_pin_verified BOOLEAN DEFAULT FALSE
);

-- 10. Live Variation Ledger (Phase 5)
CREATE TABLE variations_ledger (
    id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(id) ON DELETE CASCADE,
    variation_code VARCHAR(50) NOT NULL,
    item_description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_rate NUMERIC(15,2) NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL,
    host_pin VARCHAR(10),
    counter_signed_by VARCHAR(100),
    signed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'approved'
);

-- 11. Founder Intelligence Macro Analytics (Phase 5)
CREATE TABLE founder_intelligence (
    id SERIAL PRIMARY KEY,
    season VARCHAR(50) NOT NULL,
    total_weddings INT NOT NULL,
    gross_revenue NUMERIC(15,2) NOT NULL,
    operating_margin_pct NUMERIC(5,2) NOT NULL,
    net_margin_pct NUMERIC(5,2) NOT NULL,
    financial_leakage_prevented NUMERIC(15,2) NOT NULL,
    cash_flow_30d NUMERIC(15,2) NOT NULL,
    cash_flow_60d NUMERIC(15,2) NOT NULL,
    cash_flow_90d NUMERIC(15,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. CRM Leads & Inquiries (Phase 2)
CREATE TABLE crm_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    telegram_id VARCHAR(50),
    preferred_city VARCHAR(100),
    guest_count INT,
    budget_inr NUMERIC(15,2),
    sentiment_score NUMERIC(5,2),
    recovery_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_and_seed():
    print("Connecting to PostgreSQL at 127.0.0.1:5432...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("Creating tables...")
    cur.execute(SCHEMA_SQL)
    
    # 1. Seed Weddings
    weddings_data = [
        (
            "Aarav Singhania & Diya Rathore - Rambagh Palace Royal Wedding",
            "Aarav Singhania & Diya Rathore",
            "+91 98290 11223",
            "aarav.singhania@rajasthanheritage.in",
            "Rambagh Palace, Jaipur",
            "Jaipur",
            datetime.date(2026, 11, 20),
            datetime.date(2026, 11, 23),
            25000000.00,  # 2.50 Cr
            400,
            468,  # +17% ML predicted turnout buffer
            524,  # +12% catering plate surge buffer
            17.00,
            "in_progress",
            0.96,
            "2026"
        ),
        (
            "Vikramaditya Mewar & Radhika Chauhan - Jagmandir Island Wedding",
            "Vikramaditya Mewar",
            "+91 94140 88990",
            "vikram.mewar@lakeudaipur.com",
            "Jagmandir Island Palace, Udaipur",
            "Udaipur",
            datetime.date(2026, 12, 14),
            datetime.date(2026, 12, 17),
            42000000.00,  # 4.20 Cr
            550,
            654,  # +19% ML turnout buffer
            732,  # plate buffer
            19.00,
            "confirmed",
            0.98,
            "2026"
        ),
        (
            "Devendra Shekhawat & Ananya Birla - Samode Palace Heritage Affair",
            "Devendra Shekhawat",
            "+91 97840 55667",
            "dev.shekhawat@shekhawati.org",
            "Samode Palace, Jaipur",
            "Jaipur",
            datetime.date(2027, 1, 8),
            datetime.date(2027, 1, 11),
            18500000.00,  # 1.85 Cr
            320,
            368,  # +15% ML turnout buffer
            412,  # plate buffer
            15.00,
            "confirmed",
            0.94,
            "2026"
        )
    ]
    
    cur.executemany("""
        INSERT INTO weddings (
            name, client_name, client_phone, client_email, location, city,
            wedding_date, end_date, total_budget, confirmed_guests, predicted_guests,
            food_plates_buffer, buffer_percentage, status, sentiment_score, host_pin
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, weddings_data)
    conn.commit()
    print("Weddings seeded.")
    
    # Get wedding 1 ID
    cur.execute("SELECT id FROM weddings WHERE name LIKE '%Aarav%'")
    w1_id = cur.fetchone()[0]
    
    # 2. Seed 18-Category Budget Matrix (sums to 100%)
    # Budget: 25,000,000 INR
    categories_18 = [
        ("CAT-01", "Venue & Heritage Royalty", 22.00, 5500000.00, 5500000.00, 3500000.00, 0.00, "on_track"),
        ("CAT-02", "Royal Catering & Banqueting", 20.00, 5000000.00, 5150000.00, 2500000.00, 150000.00, "near_limit"),
        ("CAT-03", "Floral Architecture & Production", 12.00, 3000000.00, 2900000.00, 1500000.00, -100000.00, "on_track"),
        ("CAT-04", "Bespoke Thematic Decor & Styling", 9.00, 2250000.00, 2200000.00, 1000000.00, -50000.00, "on_track"),
        ("CAT-05", "Light, Sound & Concert AV", 6.00, 1500000.00, 1480000.00, 750000.00, -20000.00, "on_track"),
        ("CAT-06", "Celebrity & Folk Entertainment", 5.00, 1250000.00, 1300000.00, 650000.00, 50000.00, "on_track"),
        ("CAT-07", "Cinematography & Royal Portraiture", 6.00, 1500000.00, 1450000.00, 700000.00, -50000.00, "on_track"),
        ("CAT-08", "Bridal & Groom Haute Couture/Styling", 4.00, 1000000.00, 980000.00, 500000.00, -20000.00, "on_track"),
        ("CAT-09", "Royal Guest Concierge & Fleet", 3.00, 750000.00, 780000.00, 400000.00, 30000.00, "on_track"),
        ("CAT-10", "Fireworks, Pyrotechnics & FX", 2.00, 500000.00, 490000.00, 250000.00, -10000.00, "on_track"),
        ("CAT-11", "Rajasthani Cultural Troupe & Procession", 2.00, 500000.00, 500000.00, 250000.00, 0.00, "on_track"),
        ("CAT-12", "Invitations, Gifting & Royal Wax Seals", 2.00, 500000.00, 480000.00, 300000.00, -20000.00, "on_track"),
        ("CAT-13", "Mixology & Artisanal Bar Services", 2.00, 500000.00, 520000.00, 260000.00, 20000.00, "on_track"),
        ("CAT-14", "Vintage Car & Elephant/Horse Procession", 1.50, 375000.00, 375000.00, 200000.00, 0.00, "on_track"),
        ("CAT-15", "Security, Bouncers & Protocol Officers", 1.00, 250000.00, 240000.00, 120000.00, -10000.00, "on_track"),
        ("CAT-16", "Health, Sanitation & Medical Station", 0.50, 125000.00, 120000.00, 60000.00, -5000.00, "on_track"),
        ("CAT-17", "Permits, Licensing & Royalty Taxes", 0.50, 125000.00, 125000.00, 125000.00, 0.00, "on_track"),
        ("CAT-18", "Emergency Contingency Reserve", 0.50, 125000.00, 40000.00, 0.00, -85000.00, "on_track")
    ]
    for row in categories_18:
        cur.execute("""
            INSERT INTO budget_allocations (
                wedding_id, category_code, category_name, percentage,
                allocated_amount, committed_amount, paid_amount, variance, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (w1_id, *row))
    conn.commit()
    print("18-Category Budget Matrix seeded.")
    
    # 3. Seed Vendor Quotes with WCI & +2σ Anomaly detection
    # Formula: WCI = 0.35*(PriceScore) + 0.30*(Quality) + 0.20*(Delivery) + 0.15*(FinancialStability)
    quotes = [
        # Royal Catering quotes (Hist Avg: 5,000,000, StdDev: 400,000)
        (w1_id, "CAT-02", "Royal Catering & Banqueting", "Shahi Mewar Gourmet Feasts", 5150000.00, 5000000.00, 400000.00, 96.5, 95.0, 92.0, 94.75, False, "awarded", "PO-2026-CAT02-01"),
        (w1_id, "CAT-02", "Royal Catering & Banqueting", "Grand Rajputana Caterers", 4850000.00, 5000000.00, 400000.00, 88.0, 86.0, 85.0, 87.10, False, "shortlisted", None),
        (w1_id, "CAT-02", "Royal Catering & Banqueting", "Maharaja Imperial Kitchens (+2σ Anomaly)", 6200000.00, 5000000.00, 400000.00, 94.0, 90.0, 88.0, 71.40, True, "rejected", None),
        # Floral Production quotes (Hist Avg: 3,000,000, StdDev: 250,000)
        (w1_id, "CAT-03", "Floral Architecture & Production", "Jaipur Rose & Dutch Orchids Co.", 2900000.00, 3000000.00, 250000.00, 98.0, 97.0, 94.0, 96.85, False, "awarded", "PO-2026-CAT03-01"),
        (w1_id, "CAT-03", "Floral Architecture & Production", "Marwar Royal Florals", 3100000.00, 3000000.00, 250000.00, 91.0, 89.0, 88.0, 89.90, False, "shortlisted", None),
        (w1_id, "CAT-03", "Floral Architecture & Production", "Oberoi Botanical Art (+2σ Anomaly)", 3800000.00, 3000000.00, 250000.00, 92.0, 88.0, 90.0, 68.20, True, "rejected", None),
        # Light & Sound quotes
        (w1_id, "CAT-05", "Light, Sound & Concert AV", "Jodhpur Sound & Meyer Sound Line Arrays", 1480000.00, 1500000.00, 120000.00, 97.0, 98.0, 95.0, 96.90, False, "awarded", "PO-2026-CAT05-01"),
        (w1_id, "CAT-05", "Light, Sound & Concert AV", "Desert Sonic Productions", 1520000.00, 1500000.00, 120000.00, 89.0, 90.0, 88.0, 88.95, False, "shortlisted", None),
    ]
    cur.executemany("""
        INSERT INTO vendor_quotes (
            wedding_id, category_code, category_name, vendor_name, quoted_price,
            historical_avg, std_dev, quality_score, delivery_score,
            financial_stability_score, wci_score, anomaly_flag, status, purchase_order_ref
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, quotes)
    conn.commit()
    print("Vendor Quotes seeded.")
    
    # 4. Seed Operations: 26-Node Dynamic Task Graph
    tasks_26 = [
        (w1_id, "TK-01", "Heritage Venue Royalty & NOC Signoff", "pre_wedding", 48.0, "", "completed", 0.0, True, "Executive Team"),
        (w1_id, "TK-02", "Rajasthan Police & Fire Department Clearance", "pre_wedding", 24.0, "TK-01", "completed", 0.0, True, "Legal Desk"),
        (w1_id, "TK-03", "Aviation Drone & Pyrotechnic Permits", "pre_wedding", 36.0, "TK-02", "completed", 0.0, False, "Protocol Officer"),
        (w1_id, "TK-04", "Palace Gate RFID & QR Scanner Infrastructure Setup", "pre_wedding", 12.0, "TK-01", "completed", 0.0, False, "IT Systems"),
        (w1_id, "TK-05", "VVIP Guest Airport Chauffeur Dispatch Schedule", "pre_wedding", 18.0, "TK-04", "completed", 0.0, False, "Concierge Team"),
        (w1_id, "TK-06", "Rambagh Courtyard Weather-Proof Canopy Rigging", "day_1_mehendi", 14.0, "TK-01", "completed", 0.0, True, "Production Crew"),
        (w1_id, "TK-07", "Mehendi Marigold & Floral Pavilion Installation", "day_1_mehendi", 8.0, "TK-06", "completed", 0.0, True, "Floral Designers"),
        (w1_id, "TK-08", "Rajasthani Folk Troupe & Ghoomar Sound Check", "day_1_mehendi", 4.0, "TK-07", "completed", 0.0, False, "AV Engineers"),
        (w1_id, "TK-09", "Mehendi Artisans & Henna Station Deployment (20 Artists)", "day_1_mehendi", 3.0, "TK-07", "completed", 0.0, False, "Hospitality Lead"),
        (w1_id, "TK-10", "Live Chaat & Shahi Thali Live Counters Activation", "day_1_mehendi", 4.0, "TK-06", "completed", 0.0, False, "Executive Chef"),
        (w1_id, "TK-11", "Concert Stage Truss & LED Wall Rigging", "day_1_sangeet", 16.0, "TK-06", "completed", 0.0, True, "Lighting Team"),
        (w1_id, "TK-12", "Meyer Sound Acoustic Calibration & Rehearsals", "day_1_sangeet", 5.0, "TK-11", "completed", 0.0, True, "Sound Engineers"),
        (w1_id, "TK-13", "Sangeet Family Dance Choreography Stage Cues", "day_1_sangeet", 4.0, "TK-12", "completed", 0.0, False, "Show Director"),
        (w1_id, "TK-14", "Artisanal Cocktail & Single Malt Bar Stocking", "day_1_sangeet", 6.0, "TK-11", "completed", 0.0, False, "Mixology Team"),
        (w1_id, "TK-15", "Celebrity Singer Green Room & Hospitality Rider Check", "day_1_sangeet", 4.0, "TK-12", "completed", 0.0, False, "Artist Management"),
        (w1_id, "TK-16", "Safa Bandhai & Royal Turbans Station Setup", "day_2_baraat", 3.0, "TK-04", "completed", 0.0, False, "Cultural Troupe"),
        (w1_id, "TK-17", "Vintage Rolls Royce & 11 Elephant Procession Lineup", "day_2_baraat", 4.0, "TK-02", "in_progress", 0.5, True, "Procession Marshal"),
        (w1_id, "TK-18", "Nashik & Rajasthani Brass Band Sync Check", "day_2_baraat", 2.0, "TK-17", "in_progress", 0.0, False, "Band Master"),
        (w1_id, "TK-19", "Palace Gate Cold Pyro Fireworks Synchronizer", "day_2_baraat", 3.0, "TK-03,TK-17", "pending", 0.0, False, "Pyro Tech"),
        (w1_id, "TK-20", "Varmala Hydraulic Revolving Lotus Stage Calibration", "day_2_pheras", 6.0, "TK-11", "in_progress", 1.0, True, "Hydraulics Engineer"),
        (w1_id, "TK-21", "Vedic Pheras Mandap 100,000 Lotus Petals Infill", "day_2_pheras", 5.0, "TK-20", "pending", 0.0, True, "Master Florist"),
        (w1_id, "TK-22", "Sacred Havana Fire Rigging & Purohit Ritual Sync", "day_2_pheras", 3.0, "TK-21", "pending", 0.0, True, "Rituals Lead"),
        (w1_id, "TK-23", "Shahi Royal Banquet 524-Plates Live Service Mobilization", "day_2_pheras", 4.0, "TK-21", "pending", 0.0, True, "Banqueting Lead"),
        (w1_id, "TK-24", "45 Outstation Walk-in Guest Pass Counter-Sign (PIN 2026)", "day_2_pheras", 2.0, "TK-04", "in_progress", 0.0, False, "Gate Marshal"),
        (w1_id, "TK-25", "Royal Farewell Brunch Lakeview Terrace Setup", "day_3_departure", 6.0, "TK-23", "pending", 0.0, False, "Hospitality Lead"),
        (w1_id, "TK-26", "Final 3-Way Invoice Matching & Founder Margin Audit", "day_3_departure", 8.0, "TK-25", "pending", 0.0, True, "Chief Finance Officer")
    ]
    cur.executemany("""
        INSERT INTO operations_tasks (
            wedding_id, task_code, title, stage, duration_hours,
            dependencies, status, delay_hours, is_critical_path, assigned_team
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, tasks_26)
    conn.commit()
    print("26-Node Dynamic Task Graph seeded.")
    
    # 5. Minute-by-Minute Run Sheet
    run_sheet = [
        (w1_id, 1, "09:30 AM", "Royal Dhol & Shehnai Welcome at Rambagh Porch", "Grand Entry Gate", "Digvijay Singh", "Rajasthani Cultural Troupe", "completed", 0, "All 82 outstation guests greeted with garlands and sandalwood tika"),
        (w1_id, 1, "12:00 PM", "Mehendi by the Verandah & Henna Artistry", "Polo Lawn Verandah", "Sunita Sharma", "Floral & Decor Team", "completed", 10, "Live acoustic folk music accompanied the bride entry"),
        (w1_id, 1, "04:30 PM", "High Tea & Rajasthani Sweets Pavilion", "Fountain Gardens", "Chef Ranveer", "Royal Catering", "completed", 0, "Ghewar, Pyaaz Kachori and saffron Kahwa served hot"),
        (w1_id, 1, "07:30 PM", "Sangeet Musical Extravaganza & Family Showdowns", "Jaigarh Ballroom", "Kabir Bedi (Director)", "Light, Sound & AV", "completed", 15, "14 family choreographies completed smoothly"),
        (w1_id, 1, "11:00 PM", "Celebrity DJ Afterparty & Artisanal Mixology Bar", "Mughal Courtyard", "Rohan Mehta", "Mixology & AV", "completed", 0, "Signature cocktails: Jaipur Rose Gin & Smoked Udaipur Whiskey"),
        (w1_id, 2, "03:30 PM", "Royal Safa Bandhai Ceremony & Refreshment Drinks", "Peacock Courtyard", "Bhawani Singh", "Cultural Troupe", "completed", 0, "400 Pink and Gold Leheriya Safas tied with brooches"),
        (w1_id, 2, "05:00 PM", "Grand Baraat Procession with Vintage Fleet & 11 Elephants", "Palace Driveway", "Major R. Rathore", "Vintage Car & Procession", "live", 12, "Baraat moving at royal pace toward Grand Gateway"),
        (w1_id, 2, "07:00 PM", "Varmala Ceremony over Revolving Lotus Waterbody", "Central Lake Pavilion", "Ananya Sen", "Hydraulics & Floral", "pending", 0, "100kg rose petal shower system armed and ready"),
        (w1_id, 2, "08:30 PM", "Vedic Pheras at 100,000 Lotus Mandap", "Heritage Kesar Bagh", "Acharya Vidyadhar", "Rituals & Decor", "pending", 0, "Sacred Havana fire blessed by Purohit"),
        (w1_id, 2, "10:00 PM", "Shahi Royal Banquet (524 Buffeted Plates Live)", "Maharani Dining Lawn", "Executive Chef", "Royal Catering & Banqueting", "pending", 0, "Dal Baati Churma, Shahi Tukda & 18 Live Chef counters"),
        (w1_id, 3, "10:30 AM", "Royal Farewell Mimosa Brunch & Chauffeur Departure", "Lakeview Terrace", "Hospitality Lead", "Royal Concierge", "pending", 0, "Guest luggage loaded into luxury chauffeured fleet")
    ]
    cur.executemany("""
        INSERT INTO run_sheet_items (
            wedding_id, day_number, scheduled_time, event_name, location,
            lead_person, vendor_category, status, delay_minutes, notes
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, run_sheet)
    conn.commit()
    print("Minute-by-minute Run Sheet seeded.")
    
    # 6. Emergency Incidents Desk
    incidents = [
        (
            "INC-892",
            w1_id,
            "Sudden 15-Minute Cloudburst over Rambagh Fountain Lawn",
            "critical",
            "Fountain Gardens & Outdoor Cocktail Area",
            "mitigating",
            "Pre-staged German waterproof stretch marquee deployed in 6 minutes. High-velocity air blowers activated. 0 sound equipment damaged."
        ),
        (
            "INC-893",
            w1_id,
            "45 Unannounced Outstation Family Entourage at Palace Gate",
            "high",
            "Palace North Gate Scanner Point",
            "resolved",
            "Digital Host PIN '2026' entered by Bride's Uncle. Instant walk-in wristbands printed and catering buffer unlocked."
        )
    ]
    cur.executemany("""
        INSERT INTO incidents (
            incident_code, wedding_id, title, severity, location, status, action_taken
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, incidents)
    conn.commit()
    print("Incidents seeded.")
    
    # 7. Venue GeoTracker Fleet Logistics
    geofleet = [
        (w1_id, "FLEET-01", "Mahipal Singh", "Imported Dutch Orchids & Exotics", 26.8970, 75.8080, "Rambagh Palace Service Gate 3", 8, "in_transit"),
        (w1_id, "FLEET-02", "Vikram Gurjar", "Vintage 1938 Rolls Royce Phantom III", 26.8920, 75.8115, "Palace Main Porch Baraat Point", 0, "arrived"),
        (w1_id, "FLEET-03", "Ramesh Chand", "Concert AV Meyer Sound Spare Amps", 26.8850, 75.8200, "Jaigarh Stage Backstage", 14, "in_transit"),
        (w1_id, "FLEET-04", "Suresh Meena", "Organic Saffron & Shahi Banqueting Spices", 26.9050, 75.8010, "Central Palace Kitchen", 4, "in_transit")
    ]
    cur.executemany("""
        INSERT INTO venue_geotracker (
            wedding_id, vehicle_code, driver_name, cargo_type, lat, lng, destination, eta_minutes, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, geofleet)
    conn.commit()
    print("Venue GeoTracker fleet seeded.")
    
    # 8. 3-Stage Milestone Billing
    milestones = [
        (w1_id, 1, "Stage 1: 30% Booking Advance & Palace Date Hold", 30.00, 7500000.00, datetime.date(2026, 9, 15), "paid", "TXN-HDFC-992014"),
        (w1_id, 2, "Stage 2: 40% Production Lock-in & Stage Fabrication", 40.00, 10000000.00, datetime.date(2026, 11, 1), "paid", "TXN-ICICI-883190"),
        (w1_id, 3, "Stage 3: 30% Post-Event Final Reconciliation", 30.00, 7500000.00, datetime.date(2026, 11, 28), "due", None)
    ]
    cur.executemany("""
        INSERT INTO milestone_billings (
            wedding_id, milestone_number, title, percentage, amount, due_date, status, transaction_ref
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, milestones)
    conn.commit()
    print("Milestone Billings seeded.")
    
    # 9. Dynamic Guest Passes
    now = datetime.datetime.now()
    exp = now + datetime.timedelta(minutes=60)
    passes = [
        (w1_id, "PASS-VIP-001", "Maharaja Gajendra Singh Rathore", "VIP Bride Family", "QR-TOKEN-SEC-0991A", exp, True, now - datetime.timedelta(hours=2), "Palace Imperial Gate", True),
        (w1_id, "PASS-VIP-002", "Ranisa Gayatri Devi", "VIP Bride Family", "QR-TOKEN-SEC-0992B", exp, True, now - datetime.timedelta(hours=2), "Palace Imperial Gate", True),
        (w1_id, "PASS-VVIP-003", "Yuvraj Manvendra Gohil", "VVIP Guest", "QR-TOKEN-SEC-0993C", exp, True, now - datetime.timedelta(hours=1), "VVIP Chauffeur Porch", True),
        (w1_id, "PASS-OUT-045", "Siddharth & Priya Singhania", "Outstation Guest", "QR-TOKEN-SEC-0994D", exp, False, None, None, False),
        (w1_id, "PASS-WALK-104", "Rathore Clan Extended Entourage (45 Guests)", "Walk-in Unannounced", "QR-TOKEN-SEC-0995E", exp, True, now - datetime.timedelta(minutes=45), "Palace North Gate", True)
    ]
    cur.executemany("""
        INSERT INTO guest_passes (
            wedding_id, pass_code, guest_name, category, qr_token, token_expiry,
            checked_in, check_in_time, check_in_gate, host_pin_verified
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, passes)
    conn.commit()
    print("Guest Passes seeded.")
    
    # 10. Live Variation Ledger
    variations = [
        (w1_id, "VAR-101", "45 Unannounced Outstation Guests at Reception Banquet", 45, 3200.00, 144000.00, "2026", "Digvijay Singh Rathore (Host)", now - datetime.timedelta(minutes=45), "approved"),
        (w1_id, "VAR-102", "Emergency Waterproof Marquee Canopy Deployment (INC-892)", 1, 120000.00, 120000.00, "2026", "Aarav Singhania (Groom)", now - datetime.timedelta(hours=4), "approved"),
        (w1_id, "VAR-103", "Additional 2 Hours Celebrity DJ & Bar License Extension", 2, 85000.00, 170000.00, "2026", "Diya Rathore (Bride)", now - datetime.timedelta(hours=18), "approved")
    ]
    cur.executemany("""
        INSERT INTO variations_ledger (
            wedding_id, variation_code, item_description, quantity, unit_rate,
            total_amount, host_pin, counter_signed_by, signed_at, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, variations)
    conn.commit()
    print("Live Variations Ledger seeded.")
    
    # 11. Founder Intelligence Macro Analytics
    founder_data = (
        "Winter Season 2026-2027",
        25,
        685000000.00,  # 68.50 Cr Gross Season Revenue
        28.40,         # 28.4% Operating Margin
        21.60,         # 21.6% Net Margin
        18200000.00,   # 1.82 Cr Financial Leakage Prevented (+2σ detection & duplicate block)
        24500000.00,   # 30-Day Cash Flow projection
        38000000.00,   # 60-Day Cash Flow projection
        52000000.00    # 90-Day Cash Flow projection
    )
    cur.execute("""
        INSERT INTO founder_intelligence (
            season, total_weddings, gross_revenue, operating_margin_pct,
            net_margin_pct, financial_leakage_prevented, cash_flow_30d, cash_flow_60d, cash_flow_90d
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, founder_data)
    conn.commit()
    print("Founder Intelligence seeded.")
    
    # 12. CRM Leads
    crm_leads = [
        ("Kabir Singhania", "+91 99887 76655", "@kabirsinghania", "Jaipur", 450, 30000000.00, 0.94, "active"),
        ("Rhea Kapoor & Karan Johar Jr.", "+91 98111 22334", "@rheakapoor", "Udaipur", 600, 45000000.00, 0.98, "active"),
        ("Siddharth Malpani", "+91 97722 33445", "@smalpani", "Jaipur", 350, 20000000.00, 0.88, "48hr_nudge_sent")
    ]
    cur.executemany("""
        INSERT INTO crm_inquiries (
            name, phone, telegram_id, preferred_city, guest_count,
            budget_inr, sentiment_score, recovery_status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, crm_leads)
    conn.commit()
    print("CRM Inquiries seeded.")
    
    cur.close()
    conn.close()
    print("\n[SUCCESS] PostgreSQL knotcore_db initialized and populated with luxury royal wedding data!")

if __name__ == "__main__":
    init_and_seed()
