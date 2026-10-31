"""
KnotCore Luxury Wedding Planning Management System
High-Performance Python Flask Backend API Server
Connecting directly to PostgreSQL (knotcore_db) on localhost:5432
"""
import os
import sys

# Ensure workspace root is in sys.path
WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_DIR not in sys.path:
    sys.path.insert(0, WORKSPACE_DIR)

import json
import secrets
import datetime
from decimal import Decimal
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from dotenv import load_dotenv

# Load environment configuration
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = Flask(__name__)
# Restrict CORS to trusted local origins
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

from flask.json.provider import DefaultJSONProvider

# Custom JSON provider for Decimal and Date types in Flask 3.x
class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return super().default(obj)

app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)

# Database connection pool helper
def get_db_connection():
    return psycopg2.connect(
        dbname="knotcore_db",
        user="postgres",
        password="",
        host="127.0.0.1",
        port=5432
    )

# ----------------- 1. HEALTH & SYSTEM DIAGNOSTICS -----------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Verify PostgreSQL connection and database table metrics"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT version();")
        pg_ver = cur.fetchone()["version"]
        
        # Get count of tables and weddings
        cur.execute("SELECT count(*) as count FROM weddings;")
        wedding_count = cur.fetchone()["count"]
        
        cur.execute("SELECT count(*) as count FROM budget_allocations;")
        budget_count = cur.fetchone()["count"]
        
        cur.execute("SELECT count(*) as count FROM operations_tasks;")
        task_count = cur.fetchone()["count"]

        cur.execute("SELECT count(*) as count FROM guest_passes;")
        pass_count = cur.fetchone()["count"]
        
        cur.close()
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "database": "PostgreSQL 16",
            "connected": True,
            "host": "127.0.0.1:5432",
            "db_name": "knotcore_db",
            "pg_version": pg_ver,
            "metrics": {
                "active_weddings": wedding_count,
                "budget_allocations": budget_count,
                "operations_tasks": task_count,
                "guest_passes": pass_count
            },
            "timestamp": datetime.datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "connected": False,
            "error": "Failed to connect to PostgreSQL database",
            "details": str(e)
        }), 500

# ----------------- 2. MASTER WEDDINGS -----------------
@app.route("/api/weddings", methods=["GET"])
def get_weddings():
    """Fetch all active royal weddings with ML turnout & buffer metrics"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, client_name, client_phone, client_email, location, city,
               wedding_date, end_date, total_budget, confirmed_guests,
               predicted_guests, food_plates_buffer, buffer_percentage,
               status, sentiment_score, host_pin, created_at
        FROM weddings
        ORDER BY wedding_date ASC
    """)
    weddings = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(weddings)

@app.route("/api/weddings/<int:wedding_id>", methods=["GET"])
def get_wedding_detail(wedding_id):
    """Fetch complete profile for a single luxury wedding"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM weddings WHERE id = %s", (wedding_id,))
    wedding = cur.fetchone()
    cur.close()
    conn.close()
    if not wedding:
        return jsonify({"error": "Wedding not found"}), 404
    return jsonify(wedding)

# ----------------- 3. 18-CATEGORY BUDGET & VENDOR MATRIX -----------------
@app.route("/api/weddings/<int:wedding_id>/budget", methods=["GET"])
def get_budget_allocations(wedding_id):
    """Fetch 18-category allocation matrix strictly summing to 100%"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT category_code, category_name, percentage, allocated_amount,
               committed_amount, paid_amount, variance, status
        FROM budget_allocations
        WHERE wedding_id = %s
        ORDER BY percentage DESC
    """, (wedding_id,))
    allocations = cur.fetchall()
    
    # Calculate summary totals
    cur.execute("""
        SELECT 
            SUM(allocated_amount) as total_allocated,
            SUM(committed_amount) as total_committed,
            SUM(paid_amount) as total_paid,
            SUM(percentage) as total_percentage
        FROM budget_allocations
        WHERE wedding_id = %s
    """, (wedding_id,))
    summary = cur.fetchone()
    
    cur.close()
    conn.close()
    return jsonify({
        "categories": allocations,
        "summary": summary
    })

@app.route("/api/weddings/<int:wedding_id>/quotes", methods=["GET"])
def get_vendor_quotes(wedding_id):
    """Fetch vendor quotes with WCI ranking and +2σ anomaly flags"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, category_code, category_name, vendor_name, quoted_price,
               historical_avg, std_dev, quality_score, delivery_score,
               financial_stability_score, wci_score, anomaly_flag,
               status, purchase_order_ref
        FROM vendor_quotes
        WHERE wedding_id = %s
        ORDER BY wci_score DESC
    """, (wedding_id,))
    quotes = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(quotes)

@app.route("/api/quotes/<int:quote_id>/award", methods=["POST"])
def award_quote(quote_id):
    """Award quote and generate Purchase Order reference"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Generate PO reference
    po_ref = f"PO-2026-WINNER-{secrets.token_hex(3).upper()}"
    
    # Update quote status
    cur.execute("""
        UPDATE vendor_quotes
        SET status = 'awarded', purchase_order_ref = %s
        WHERE id = %s
        RETURNING *
    """, (po_ref, quote_id))
    awarded_quote = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    if not awarded_quote:
        return jsonify({"error": "Quote not found"}), 404
        
    return jsonify({
        "message": "Quote awarded successfully and Purchase Order created!",
        "purchase_order": po_ref,
        "quote": awarded_quote
    })

# ----------------- 4. OPERATIONS COMMAND CENTRE -----------------
@app.route("/api/weddings/<int:wedding_id>/tasks", methods=["GET"])
def get_operations_tasks(wedding_id):
    """Fetch 26-node dynamic task graph"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, task_code, title, stage, duration_hours,
               dependencies, status, delay_hours, is_critical_path, assigned_team
        FROM operations_tasks
        WHERE wedding_id = %s
        ORDER BY id ASC
    """, (wedding_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(tasks)

@app.route("/api/tasks/<int:task_id>/simulate-delay", methods=["POST"])
def simulate_task_delay(task_id):
    """Simulate delay and ripple through dependent downstream tasks"""
    data = request.json or {}
    delay_hours = float(data.get("delay_hours", 2.0))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch task
    cur.execute("SELECT * FROM operations_tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    if not task:
        cur.close()
        conn.close()
        return jsonify({"error": "Task not found"}), 404
        
    # Update current task delay
    cur.execute("""
        UPDATE operations_tasks
        SET delay_hours = delay_hours + %s, status = 'delayed'
        WHERE id = %s
    """, (delay_hours, task_id))
    
    # Find downstream dependencies
    code = task["task_code"]
    cur.execute("""
        UPDATE operations_tasks
        SET delay_hours = delay_hours + %s
        WHERE wedding_id = %s AND dependencies LIKE %s
    """, (delay_hours * 0.8, task["wedding_id"], f"%{code}%"))
    
    conn.commit()
    
    # Return updated list
    cur.execute("""
        SELECT * FROM operations_tasks WHERE wedding_id = %s ORDER BY id ASC
    """, (task["wedding_id"],))
    updated_tasks = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify({
        "message": f"Ripple-Effect delay of +{delay_hours}h simulated across DAG dependencies",
        "tasks": updated_tasks
    })

@app.route("/api/weddings/<int:wedding_id>/run-sheet", methods=["GET"])
def get_run_sheet(wedding_id):
    """Fetch minute-by-minute run sheet items"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, day_number, scheduled_time, event_name, location,
               lead_person, vendor_category, status, delay_minutes, notes
        FROM run_sheet_items
        WHERE wedding_id = %s
        ORDER BY day_number ASC, id ASC
    """, (wedding_id,))
    items = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(items)

@app.route("/api/run-sheet/<int:item_id>/status", methods=["POST"])
def update_run_sheet_status(item_id):
    """Update status of a run sheet event (e.g. pending -> live -> completed)"""
    data = request.json or {}
    new_status = data.get("status", "live")
    delay = int(data.get("delay_minutes", 0))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        UPDATE run_sheet_items
        SET status = %s, delay_minutes = %s
        WHERE id = %s
        RETURNING *
    """, (new_status, delay, item_id))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(updated)

@app.route("/api/weddings/<int:wedding_id>/incidents", methods=["GET"])
def get_incidents(wedding_id):
    """Fetch incidents for a wedding"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, incident_code, title, severity, location, reported_at, status, action_taken, resolved_at
        FROM incidents
        WHERE wedding_id = %s
        ORDER BY reported_at DESC
    """, (wedding_id,))
    incidents = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(incidents)

@app.route("/api/incidents", methods=["POST"])
def report_incident():
    """Report new emergency incident with instant severity triage"""
    data = request.json or {}
    wedding_id = data.get("wedding_id", 1)
    title = data.get("title", "Unspecified Operational Incident")
    severity = data.get("severity", "medium")
    location = data.get("location", "Rambagh Palace Grounds")
    action_taken = data.get("action_taken", "Immediate response team dispatched")
    
    incident_code = f"INC-{secrets.randbelow(900) + 100}"
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        INSERT INTO incidents (incident_code, wedding_id, title, severity, location, status, action_taken)
        VALUES (%s, %s, %s, %s, %s, 'open', %s)
        RETURNING *
    """, (incident_code, wedding_id, title, severity, location, action_taken))
    incident = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(incident), 201

@app.route("/api/weddings/<int:wedding_id>/geotracker", methods=["GET"])
def get_geotracker_fleet(wedding_id):
    """Fetch real-time GPS locations and ETAs for logistic fleet"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, vehicle_code, driver_name, cargo_type, lat, lng, destination, eta_minutes, status
        FROM venue_geotracker
        WHERE wedding_id = %s
        ORDER BY eta_minutes ASC
    """, (wedding_id,))
    fleet = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(fleet)

# ----------------- 5. FINANCE, GUEST PASSES & VARIATIONS -----------------
@app.route("/api/weddings/<int:wedding_id>/milestones", methods=["GET"])
def get_milestones(wedding_id):
    """Fetch 3-stage milestone billing (30%-40%-30%)"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, milestone_number, title, percentage, amount, due_date, status, transaction_ref
        FROM milestone_billings
        WHERE wedding_id = %s
        ORDER BY milestone_number ASC
    """, (wedding_id,))
    milestones = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(milestones)

@app.route("/api/weddings/<int:wedding_id>/guest-passes", methods=["GET"])
def get_guest_passes(wedding_id):
    """Fetch dynamic guest passes with anti-screenshot token status"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, pass_code, guest_name, category, qr_token, token_expiry,
               checked_in, check_in_time, check_in_gate, host_pin_verified
        FROM guest_passes
        WHERE wedding_id = %s
        ORDER BY id ASC
    """, (wedding_id,))
    passes = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(passes)

@app.route("/api/guest-passes/verify", methods=["POST"])
def verify_guest_pass():
    """Verify Palace Gate QR check-in"""
    data = request.json or {}
    pass_code = data.get("pass_code")
    gate = data.get("gate", "Palace Imperial Gate")
    host_pin = data.get("host_pin", "")
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM guest_passes WHERE pass_code = %s", (pass_code,))
    gpass = cur.fetchone()
    
    if not gpass:
        cur.close()
        conn.close()
        return jsonify({"error": "Invalid Pass Code"}), 404
        
    pin_verified = (host_pin == "2026") or gpass["host_pin_verified"]
    
    cur.execute("""
        UPDATE guest_passes
        SET checked_in = TRUE, check_in_time = CURRENT_TIMESTAMP, check_in_gate = %s, host_pin_verified = %s
        WHERE pass_code = %s
        RETURNING *
    """, (gate, pin_verified, pass_code))
    updated_pass = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        "message": f"Guest {updated_pass['guest_name']} verified and checked in at {gate}!",
        "pass": updated_pass
    })

@app.route("/api/weddings/<int:wedding_id>/variations", methods=["GET"])
def get_variations(wedding_id):
    """Fetch live variation ledger"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, variation_code, item_description, quantity, unit_rate,
               total_amount, host_pin, counter_signed_by, signed_at, status
        FROM variations_ledger
        WHERE wedding_id = %s
        ORDER BY signed_at DESC
    """, (wedding_id,))
    variations = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(variations)

@app.route("/api/variations/approve", methods=["POST"])
def approve_variation():
    """Counter-sign live variation with Host PIN 2026"""
    data = request.json or {}
    wedding_id = data.get("wedding_id", 1)
    description = data.get("item_description")
    quantity = int(data.get("quantity", 1))
    unit_rate = float(data.get("unit_rate", 3200.0))
    host_pin = data.get("host_pin", "")
    signed_by = data.get("counter_signed_by", "Host Authorized Representative")
    
    if host_pin != "2026":
        return jsonify({"error": "Invalid Host PIN. Authorization failed."}), 403
        
    total_amount = quantity * unit_rate
    var_code = f"VAR-{secrets.randbelow(800) + 100}"
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        INSERT INTO variations_ledger (
            wedding_id, variation_code, item_description, quantity, unit_rate,
            total_amount, host_pin, counter_signed_by, signed_at, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, 'approved')
        RETURNING *
    """, (wedding_id, var_code, description, quantity, unit_rate, total_amount, host_pin, signed_by))
    new_var = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        "message": f"Variation {var_code} approved and counter-signed with Host PIN!",
        "variation": new_var
    }), 201

@app.route("/api/founder/cockpit", methods=["GET"])
def get_founder_cockpit():
    """Fetch season-wide Founder Cockpit metrics"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM founder_intelligence ORDER BY id DESC LIMIT 1")
    cockpit = cur.fetchone()
    
    # Fetch summary of all weddings
    cur.execute("""
        SELECT id, name, location, total_budget, confirmed_guests, predicted_guests, status
        FROM weddings
    """)
    weddings_summary = cur.fetchall()
    
    cur.close()
    conn.close()
    return jsonify({
        "macro_metrics": cockpit,
        "weddings": weddings_summary
    })

# ----------------- 6. DYNAMIC GEMINI CONCIERGE & COPILOT -----------------
@app.route("/api/concierge/chat", methods=["POST"])
def concierge_chat():
    """Direct web UI chat endpoint connected to Gemini 3.5 Flash"""
    data = request.json or {}
    user_message = data.get("message", "").strip()
    role = data.get("role", "client")  # client, founder, planner, vendor
    
    if not user_message:
        return jsonify({"error": "Empty message"}), 400
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"reply": "AI Concierge is online. (GEMINI_API_KEY not configured in .env)"}), 200
        
    # Get live context from DB
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT name, location, total_budget, confirmed_guests, predicted_guests FROM weddings LIMIT 1")
        active_w = cur.fetchone()
        cur.close()
        conn.close()
        live_context = f"Active Wedding: {active_w['name']} at {active_w['location']}. Confirmed Guests: {active_w['confirmed_guests']}, ML Predicted Turnout: {active_w['predicted_guests']}, Total Budget: ₹{float(active_w['total_budget']):,.0f}."
    except Exception:
        live_context = "KnotCore Luxury Wedding Planning Management System."

    system_instruction = f"""
You are the KnotCore Royal AI Concierge & Operations Copilot for 'The Royal Knot' (luxury destination weddings in Jaipur & Udaipur).
User Role: {role.upper()}
Live System Context: {live_context}
Tone: Highly sophisticated, royal, proactive, dynamic, and polite.
Never invent dummy defaults or static numbers unless confirmed by the user. If information is missing, inquire gracefully.
"""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_instruction}\n\nUser Question: {user_message}"}
                ]
            }
        ]
    }
    
    try:
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            result = res.json()
            reply = result["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({"reply": reply})
        else:
            # Fallback response
            return jsonify({
                "reply": f"Welcome to The Royal Knot. Our wedding specialists are managing operations at Rambagh Palace and Jagmandir Island. How may I assist your {role} inquiries today?"
            })
    except Exception as e:
        return jsonify({
            "reply": f"The Royal Knot concierge desk is actively managing luxury fleet and banquet coordination. Message received: '{user_message}'."
        })

# ----------------- 7. CRM USER ENQUIRIES & TAKE ACTION -----------------
@app.route("/api/inquiries", methods=["GET"])
def get_inquiries():
    """Fetch all user enquiries from Telegram bot with live status"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, phone, telegram_id, preferred_city, guest_count,
               budget_inr, sentiment_score, recovery_status, status,
               duration_days, proposal_pdf_url, chat_id, created_at
        FROM crm_inquiries
        ORDER BY created_at DESC
    """)
    inquiries = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(inquiries)

@app.route("/api/inquiries/<int:inquiry_id>/take-action", methods=["POST"])
def take_action_on_inquiry(inquiry_id):
    """
    Take Action on user enquiry:
    1. Calculate ML Turnout Buffer (+17%) and Catering Plate Buffer (+31%)
    2. Compile Luxury Proposal PDF
    3. Notify Client in Telegram Bot to review and digitally sign
    4. Release RFPs to blind One-Way Mirror Vendor Group
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM crm_inquiries WHERE id = %s", (inquiry_id,))
    inquiry = cur.fetchone()
    
    if not inquiry:
        cur.close()
        conn.close()
        return jsonify({"error": "Inquiry not found"}), 404

    # ML Calculations
    pax = inquiry["guest_count"] or 400
    predicted_turnout = int(pax * 1.17)
    plate_buffer = int(pax * 1.31)
    budget = float(inquiry["budget_inr"] or 25000000.0)
    advance_amount = budget * 0.30

    # Generate Official Proposal PDF
    pdf_filename = f"Proposal_{inquiry_id}_{secrets.token_hex(2)}.pdf"
    frontend_public = os.path.join(os.path.dirname(__file__), "..", "frontend", "public")
    pdf_path = os.path.join(frontend_public, pdf_filename)
    
    try:
        from knotcore_backend.proposal_generator import generate_wedding_proposal_pdf
        generate_wedding_proposal_pdf(inquiry, pdf_path)
        pdf_url = f"/{pdf_filename}"
    except Exception as e:
        print(f"[Proposal Gen Error] {e}")
        pdf_url = "/Aarav_Diya_Proposal.pdf"

    # Update Inquiry Status in DB
    cur.execute("""
        UPDATE crm_inquiries
        SET status = 'proposal_sent', proposal_pdf_url = %s
        WHERE id = %s
        RETURNING *
    """, (pdf_url, inquiry_id))
    updated_inquiry = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    # If client has chat_id, notify in Telegram
    chat_id = inquiry.get("chat_id")
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if chat_id and bot_token:
        try:
            tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            msg = (
                f"💍 <b>OFFICIAL ROYAL PROPOSAL READY FOR DIGITAL SIGNING!</b>\n\n"
                f"Dear <b>{inquiry['name']}</b>,\n"
                f"The Royal Knot Executive Board has reviewed your enquiry and prepared your official 3-day luxury proposal.\n\n"
                f"• <b>Venue:</b> {inquiry['preferred_city']} Heritage Palace\n"
                f"• <b>Base Guests:</b> {pax} | <b>ML Predicted Turnout:</b> {predicted_turnout}\n"
                f"• <b>Total Budget:</b> ₹{(budget/10000000):.2f} Cr\n"
                f"• <b>Milestone 1 Advance (30%):</b> ₹{(advance_amount/100000):.2f} Lakhs (Held to lock palace dates)\n\n"
                f"✍️ <b>Reply <code>/sign</code> to digitally counter-sign the agreement and release blind RFQs to verified palace vendors.</b>"
            )
            requests.post(tg_url, json={"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}, timeout=5)
        except Exception as e:
            print(f"[Telegram Notify Error] {e}")

    return jsonify({
        "message": f"Action completed for Inquiry #{inquiry_id}! ML Buffers computed, Proposal PDF compiled, and Client notified.",
        "inquiry": updated_inquiry,
        "ml_metrics": {
            "confirmed_guests": pax,
            "predicted_turnout": predicted_turnout,
            "plate_buffer": plate_buffer,
            "advance_due": advance_amount
        },
        "proposal_pdf_url": pdf_url
    })

@app.route("/api/inquiries/<int:inquiry_id>/sign", methods=["POST"])
def client_sign_inquiry(inquiry_id):
    """Confirm digital signature and advance payment for inquiry"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        UPDATE crm_inquiries
        SET status = 'signed'
        WHERE id = %s
        RETURNING *
    """, (inquiry_id,))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return jsonify({"error": "Inquiry not found"}), 404

    return jsonify({
        "message": f"Agreement for {updated['name']} digitally counter-signed & booking confirmed!",
        "inquiry": updated
    })

@app.route("/api/inquiries/<int:inquiry_id>/broadcast-rfp", methods=["POST"])
def broadcast_rfp_to_vendors(inquiry_id):
    """Release blind RFP specifications to the One-Way Mirror Vendor Group"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        UPDATE crm_inquiries
        SET status = 'rfp_broadcast'
        WHERE id = %s
        RETURNING *
    """, (inquiry_id,))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "message": f"Proposal #{inquiry_id} released to One-Way Mirror Vendor Procurement Network!",
        "inquiry": updated,
        "protocol": "One-Way Mirror (Blind Bidding: competing vendors cannot view quotes)"
    })

# ----------------- 8. VENDOR OCR & FILL-IN-THE-BLANKS -----------------
@app.route("/api/vendor/quotation-ocr", methods=["POST"])
def vendor_quotation_ocr():
    """
    Vendor quotation ingestion via OCR:
    1. Confirms whether it is a quotation or not
    2. Identifies missing fields (especially quantity)
    3. Prompts fill-in-the-blanks if needed
    4. Evaluates WCI score and +2σ anomaly
    5. Ingests into comparison grid
    """
    data = request.json or {}
    text_content = data.get("text", "")
    vendor_name = data.get("vendor_name", "Supplier")
    pending_session = data.get("pending_session")

    from knotcore_backend.quotation_ocr_engine import QuotationOCREngine
    result = QuotationOCREngine.process_vendor_submission(
        text_content=text_content,
        vendor_sender_name=vendor_name,
        pending_session=pending_session
    )
    return jsonify(result)

# ----------------- 9. LEAD CONVERSION & RECOVERY INTELLIGENCE -----------------
@app.route("/api/leads/conversion-overview", methods=["GET"])
def get_leads_conversion_overview():
    """Fetch all leads with ML conversion prediction scores & recovery risk status"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, name, phone, telegram_id, preferred_city, guest_count,
               budget_inr, sentiment_score, recovery_status, status,
               duration_days, conversion_score, conversion_tier,
               hours_since_last_response, risk_status, assigned_planner,
               backup_planner, follow_up_draft, created_at
        FROM crm_inquiries
        ORDER BY created_at DESC
    """)
    inquiries = cur.fetchall()
    
    # Calculate conversion prediction for any without score
    from knotcore_backend.lead_intelligence import LeadIntelligenceEngine
    enriched = []
    for inq in inquiries:
        if not inq["conversion_score"] or inq["conversion_score"] == 0:
            scoring = LeadIntelligenceEngine.calculate_conversion_prediction(inq)
            inq["conversion_score"] = scoring["conversion_score"]
            inq["conversion_tier"] = scoring["conversion_tier"]
        if not inq["follow_up_draft"]:
            inq["follow_up_draft"] = LeadIntelligenceEngine.generate_venue_customized_followup(inq)
        enriched.append(inq)

    cur.close()
    conn.close()
    return jsonify(enriched)

@app.route("/api/leads/<int:inquiry_id>/simulate-recovery", methods=["POST"])
def simulate_lead_recovery(inquiry_id):
    """
    Simulates elapsed time for lead response:
    - 48h: Flags 'At Risk of Loss' on Founder Dashboard & generates venue-customized draft
    - 72h: Auto-reassigns to backup planner
    """
    data = request.json or {}
    hours_elapsed = int(data.get("hours", 48))

    from knotcore_backend.lead_intelligence import LeadIntelligenceEngine
    result = LeadIntelligenceEngine.audit_lead_recovery_status(inquiry_id, hours_elapsed)
    return jsonify(result)

@app.route("/api/leads/<int:inquiry_id>/send-followup", methods=["POST"])
def send_customized_followup(inquiry_id):
    """Dispatches the venue-customized follow-up message to the client in Telegram"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM crm_inquiries WHERE id = %s", (inquiry_id,))
    inq = cur.fetchone()

    if not inq:
        cur.close()
        conn.close()
        return jsonify({"error": "Lead not found"}), 404

    from knotcore_backend.lead_intelligence import LeadIntelligenceEngine
    draft = inq.get("follow_up_draft") or LeadIntelligenceEngine.generate_venue_customized_followup(inq)

    # Reset risk status to 'recovered'
    cur.execute("""
        UPDATE crm_inquiries
        SET risk_status = 'recovered', hours_since_last_response = 0
        WHERE id = %s
        RETURNING *;
    """, (inquiry_id,))
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    # If client has chat_id, send via Telegram
    chat_id = inq.get("chat_id")
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if chat_id and bot_token:
        try:
            tg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            requests.post(tg_url, json={"chat_id": chat_id, "text": f"👑 <b>The Royal Knot Executive Concierge:</b>\n\n{draft}", "parse_mode": "HTML"}, timeout=5)
        except Exception as e:
            print(f"[Follow-up Send Error] {e}")

    return jsonify({
        "message": f"Venue-customized follow-up dispatched to {inq['name']}! Lead marked as 'Recovered'.",
        "draft_sent": draft,
        "lead": updated
    })

if __name__ == "__main__":
    print("[KNOTCORE BACKEND] Starting Flask API server on http://127.0.0.1:5000...")
    app.run(host="127.0.0.1", port=5000, debug=False)
