# -*- coding: utf-8 -*-
"""
Sets up:
1. knotcore_wedding_events table in PostgreSQL knotcore_db.
2. Seeds AI-generated itinerary (10:00 AM - 10:00 PM with weather intelligence) for INQ-0011.
3. Generates knotcore_backend/data/chosen_vendors.csv for the awarded/chosen vendors (Vendors 1, 2, 6, 9).
4. Synchronizes knotcore_vendor_arrivals with ONLY the chosen vendors.
"""
import os
import csv
import json
import psycopg2

def setup():
    conn = psycopg2.connect(
        dbname="knotcore_db",
        user="postgres",
        password="password",
        host="localhost",
        port=5432
    )
    cur = conn.cursor()

    # 1. Create knotcore_wedding_events table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS knotcore_wedding_events (
        id SERIAL PRIMARY KEY,
        inquiry_ref VARCHAR(50) NOT NULL,
        wedding_id INT,
        day_number INT DEFAULT 1,
        event_date VARCHAR(50) NOT NULL,
        event_name VARCHAR(150) NOT NULL,
        culture VARCHAR(100) DEFAULT 'Rajputana & Mewar Royal Heritage',
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        venue_zone VARCHAR(150) NOT NULL,
        weather_forecast VARCHAR(255),
        weather_temp_c INT DEFAULT 24,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        started_at TIMESTAMP,
        timer_duration_seconds INT DEFAULT 600,
        timer_expires_at TIMESTAMP,
        assigned_vendor_ids JSONB DEFAULT '[1, 2, 6, 9]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    conn.commit()

    # Check if events exist for INQ-0011
    cur.execute("SELECT COUNT(*) FROM knotcore_wedding_events WHERE inquiry_ref = 'INQ-0011';")
    count = cur.fetchone()[0]
    if count == 0:
        events = [
            (
                'INQ-0011', 1, 1, 'Nov 14, 2026', 'Royal Haldi & Phoolon Ki Holi',
                'Rajputana & Mewar Royal Heritage', '10:30 AM', '01:30 PM',
                'Covered Palace Courtyard, The City Palace',
                'Sunny 24°C, gentle morning breeze, covered shade to prevent midday UV heat',
                24, 'SCHEDULED', json.dumps([2, 6, 9])
            ),
            (
                'INQ-0011', 1, 1, 'Nov 14, 2026', 'Royal Mehendi & Artisanal High Tea',
                'Rajputana & Mewar Royal Heritage', '04:00 PM', '07:00 PM',
                'Lakefront Promenade, Lake Pichola',
                'Pleasant 26°C, cool lakeside golden hour breeze',
                26, 'SCHEDULED', json.dumps([2, 6, 9])
            ),
            (
                'INQ-0011', 1, 2, 'Nov 15, 2026', 'Welcome Luncheon & Sufi Baithak',
                'Rajputana & Mewar Royal Heritage', '11:00 AM', '02:00 PM',
                'Shahi Darbar Hall, Palace Enclave',
                'Indoor air-conditioned comfort 25°C',
                25, 'SCHEDULED', json.dumps([2, 6, 9])
            ),
            (
                'INQ-0011', 1, 2, 'Nov 15, 2026', 'Grand Sangeet & Royal Cocktails',
                'Rajputana & Mewar Royal Heritage', '06:30 PM', '10:00 PM',
                'Central Palace Lawns & Stage Pavilion',
                'Cool 20°C palace night air. Strict 10:00 PM acoustic curfew adherence',
                20, 'SCHEDULED', json.dumps([2, 6, 9])
            ),
            (
                'INQ-0011', 1, 3, 'Nov 16, 2026', 'Royal Baraat, Varmala & Sunset Pheras',
                'Rajputana & Mewar Royal Heritage', '04:30 PM', '07:30 PM',
                'Lakeside Jagmandir Mandap',
                'Scenic 22°C twilight, royal lake illumination',
                22, 'SCHEDULED', json.dumps([2, 6, 9])
            ),
            (
                'INQ-0011', 1, 3, 'Nov 16, 2026', 'Royal Dastarkhwan Banquet & Reception',
                'Rajputana & Mewar Royal Heritage', '07:30 PM', '10:00 PM',
                'Shahi Banqueting Pavilion',
                'Comfortable 19°C evening dining. Curfew wrap by 10:00 PM',
                19, 'SCHEDULED', json.dumps([2, 6, 9])
            )
        ]
        cur.executemany("""
            INSERT INTO knotcore_wedding_events (
                inquiry_ref, wedding_id, day_number, event_date, event_name,
                culture, start_time, end_time, venue_zone, weather_forecast,
                weather_temp_c, status, assigned_vendor_ids
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, events)
        conn.commit()
        print("Successfully seeded 6 wedding events for INQ-0011.")

    # 2. Create data/chosen_vendors.csv
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    chosen_csv_path = os.path.join(data_dir, "chosen_vendors.csv")

    chosen_vendors_data = [
        {
            "id": 1,
            "name": "Rambagh Palace Heritage Estate",
            "category_code": "CAT-01",
            "category_name": "Venue & Heritage Royalty",
            "email": "royalty@rambaghpalace.in",
            "phone": "+91 98290 11001",
            "city": "Udaipur",
            "typical_price_inr": "5500000.0",
            "status": "AWARDED",
            "inquiry_ref": "INQ-0011",
            "purchase_order_ref": "PO-2026-CAT01-1101",
            "call_time": "10:00 AM",
            "checkin_status": "PENDING"
        },
        {
            "id": 2,
            "name": "Shahi Mewar Gourmet Feasts",
            "category_code": "CAT-02",
            "category_name": "Royal Catering & Banqueting",
            "email": "sachinpriya1503@gmail.com",
            "phone": "+91 98290 12002",
            "city": "Udaipur",
            "typical_price_inr": "5100000.0",
            "status": "AWARDED",
            "inquiry_ref": "INQ-0011",
            "purchase_order_ref": "PO-2026-CAT02-3326",
            "call_time": "10:30 AM",
            "checkin_status": "PENDING"
        },
        {
            "id": 6,
            "name": "Rajputana Royal Mandap Designers",
            "category_code": "CAT-03",
            "category_name": "Floral Architecture & Production",
            "email": "decor@rajputanamandap.in",
            "phone": "+91 98290 14001",
            "city": "Jaipur",
            "typical_price_inr": "2900000.0",
            "status": "AWARDED",
            "inquiry_ref": "INQ-0011",
            "purchase_order_ref": "PO-2026-CAT03-2222",
            "call_time": "11:00 AM",
            "checkin_status": "PENDING"
        },
        {
            "id": 9,
            "name": "Desert Sonic Concert AV & Sound",
            "category_code": "CAT-05",
            "category_name": "Light Sound & Concert AV",
            "email": "sound@desertsonic.in",
            "phone": "+91 98290 15001",
            "city": "Jaipur",
            "typical_price_inr": "1480000.0",
            "status": "AWARDED",
            "inquiry_ref": "INQ-0011",
            "purchase_order_ref": "PO-2026-CAT05-D207",
            "call_time": "11:30 AM",
            "checkin_status": "PENDING"
        }
    ]

    with open(chosen_csv_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["id", "name", "category_code", "category_name", "email", "phone", "city", "typical_price_inr", "status", "inquiry_ref", "purchase_order_ref", "call_time", "checkin_status"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for v in chosen_vendors_data:
            writer.writerow(v)

    print(f"Created chosen_vendors.csv at {chosen_csv_path} with {len(chosen_vendors_data)} chosen vendors.")

    # 3. Synchronize knotcore_vendor_arrivals to ONLY have the chosen vendors for wedding 1
    cur.execute("DELETE FROM knotcore_vendor_arrivals WHERE wedding_id = 1;")
    for v in chosen_vendors_data:
        cur.execute("""
            INSERT INTO knotcore_vendor_arrivals (
                wedding_id, vendor_id, vendor_name, vendor_phone, category_code,
                category_name, call_time, call_time_minutes, grace_deadline_minutes,
                status, qr_token, otp_code, contingency_notes
            ) VALUES (
                1, %s, %s, %s, %s, %s, %s, 630, 645, 'SCHEDULED', %s, %s, %s
            );
        """, (
            v["id"], v["name"], v["phone"], v["category_code"], v["category_name"],
            v["call_time"], f"KNOT-QR-{v['id']}-{v['category_code']}", f"49{v['id']}23",
            f"Official chosen supplier under PO {v['purchase_order_ref']} for INQ-0011."
        ))
    conn.commit()
    print("Synchronized knotcore_vendor_arrivals to contain ONLY the chosen vendors.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    setup()
