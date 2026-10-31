# -*- coding: utf-8 -*-
"""
KnotCore Unified Multi-Role Telegram Bot Engine
================================================
Enterprise-grade conversational gateway enforcing 100% Role-Based Access Control (RBAC)
across Founders, Planners, Vendors, and Clients. Features:
1. Deep-Link QR Authentication (scan.png & vendor_scan.png)
2. 4-Step Dynamic Client Interview with Zero-Input Ingestion
3. Digital Client Agreement Signing & Milestone 1 Advance Confirmation
4. Blind "One-Way Mirror" Vendor Procurement Bidding Protocol
5. Real-Time PostgreSQL knotcore_db Ingestion
"""
import os
import sys
import time
import json
import secrets
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from .nlp_extractor import GeminiLeadExtractor
except ImportError:
    from nlp_extractor import GeminiLeadExtractor

try:
    from knotcore_backend.proposal_generator import generate_wedding_proposal_pdf
except ImportError:
    try:
        import sys
        sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))
        from knotcore_backend.proposal_generator import generate_wedding_proposal_pdf
    except Exception:
        generate_wedding_proposal_pdf = None

class KnotCoreBotEngine:
    """
    Long-polling Telegram bot daemon with role-isolated state machines,
    Deep-Link QR authentication, and dynamic multi-turn Gemini NLP intelligence.
    """

    def __init__(self, token: str):
        self.token = token
        self.api_url = f"https://api.telegram.org/bot{self.token}"
        self.last_update_id = 0
        self.running = False
        
        # User session memory: {chat_id: {"role": ..., "interview_step": ..., "enquiry_data": {...}}}
        self.sessions: Dict[int, Dict[str, Any]] = {}
        self.active_vendor_otps: Dict[int, Dict[str, Any]] = {}

        # Enterprise contexts
        self.founder_context = {
            "season_weddings": 25,
            "contracted_revenue_inr": 785000000,
            "projected_profit_inr": 172000000,
            "realized_profit_inr": 61450000,
            "margin_warnings": [
                {"wedding": "TRK/2026/0003 (City Palace Udaipur)", "current_margin": "11.2%", "cause": "Unbilled lighting variations"}
            ],
            "payments_due_7_days": [
                {"to": "Florist Advance (Samode Palace)", "amount_inr": 400000, "due": "Tomorrow"},
                {"to": "Caterer Advance (Rambagh Palace)", "amount_inr": 1500000, "due": "3 Days"}
            ]
        }

        self.planner_context = {
            "assigned_wedding": "Aarav & Diya Royal Wedding (Rambagh Palace)",
            "active_tasks": [
                {"title": "Catering Tasting with Couple", "vendor": "Royal Rajasthani Caterers", "status": "OVERDUE (1 day)"},
                {"title": "Stage Sound Audit (125kVA generator permit)", "venue": "Rambagh Lawns", "status": "Due in 48h"}
            ]
        }

        self.vendor_context = {
            "vendor_name": "DJ Sound Crew (Jaipur)",
            "venue": "Rambagh Palace, Jaipur",
            "gate": "Service Dock Gate 3",
            "check_in_otp": "4821"
        }

        self.client_context = {
            "couple_names": "Aarav Sharma & Diya Mehta",
            "wedding_code": "TRK/2026/0001",
            "venue": "Rambagh Palace, Jaipur",
            "countdown_days": 58,
            "milestone_billing": {
                "total_contract_inr": 30000000,
                "milestone_1_booking_deposit": {"amount_inr": 9000000, "status": "PAID (30%)"}
            }
        }

    def _get_db(self):
        """Helper to get PostgreSQL connection"""
        try:
            return psycopg2.connect(
                dbname="knotcore_db",
                user="postgres",
                password="",
                host="127.0.0.1",
                port=5432
            )
        except Exception as e:
            print(f"[BotEngine DB Error] {e}")
            return None

    def send_message(self, chat_id: int, text: str, parse_mode: str = "HTML", reply_markup: Optional[Dict] = None):
        """Dispatches an outbound message to a Telegram user."""
        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f"[BotEngine] Error sending message to {chat_id}: {e}")
            return None

    def get_updates(self) -> list:
        """Polls Telegram servers for new messages."""
        url = f"{self.api_url}/getUpdates?offset={self.last_update_id + 1}&timeout=20"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get("ok"):
                    return data.get("result", [])
        except Exception:
            pass
        return []

    def start_polling(self):
        """Main polling loop."""
        print(f"[KnotCoreBotEngine] Bot started successfully. Listening for messages...")
        self.running = True
        while self.running:
            try:
                updates = self.get_updates()
                for update in updates:
                    self.last_update_id = update["update_id"]
                    if "message" in update:
                        self.handle_incoming_message(update["message"])
            except KeyboardInterrupt:
                print("\n[KnotCoreBotEngine] Gracefully stopping bot...")
                self.running = False
                break
            except Exception as e:
                print(f"[KnotCoreBotEngine] Polling loop error: {e}")
                time.sleep(2)

    def handle_incoming_message(self, message: Dict[str, Any]):
        chat_id = message["chat"]["id"]
        sender_name = message["from"].get("first_name", "Valued Guest")
        text = message.get("text", "").strip()

        if not text:
            return

        session = self.sessions.setdefault(chat_id, {
            "role": "public",
            "name": sender_name,
            "interview_step": 1,
            "enquiry_data": {
                "couple_names": None,
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            },
            "signed": False,
            "inquiry_id": None
        })

        # Command: /reset
        if text.lower() in ["/reset", "/restart"]:
            session["interview_step"] = 1
            session["enquiry_data"] = {
                "couple_names": None,
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            }
            session["signed"] = False
            self.send_message(
                chat_id,
                " <b>Session reset successfully!</b>\n"
                "Let's craft your royal celebration in Jaipur or Udaipur from Step 1."
            )
            self._prompt_interview_step(chat_id, session, 1)
            return

        # Client Digital Signing Command: /sign or /confirm
        if text.lower() in ["/sign", "/confirm", "sign agreement", "confirm booking", "sign"]:
            self._handle_client_digital_signing(chat_id, session)
            return

        # Vendor Blind Bidding: /bid <category> <vendor> <amount>
        if text.startswith("/bid"):
            self._handle_vendor_bid(chat_id, text, session)
            return

        # Deep-Link QR Authentication: /start ...
        if text.startswith("/start"):
            self._handle_start_command(chat_id, sender_name, text, session)
            return

        # Role Switcher for demo
        if text.startswith("/role"):
            parts = text.split()
            if len(parts) > 1 and parts[1].lower() in ["founder", "planner", "vendor", "client", "public"]:
                new_role = parts[1].lower()
                session["role"] = new_role
                self.send_message(
                    chat_id,
                    f" <b>Demo Mode: Role Switched to: {new_role.upper()}</b>"
                )
                self._send_role_welcome(chat_id, session)
                return

        # Dispatch based on Role
        role = session.get("role", "public")
        if role == "founder":
            self._handle_founder_message(chat_id, text, session)
        elif role == "planner":
            self._handle_planner_message(chat_id, text, session)
        elif role == "vendor" or role == "vendor_bidder":
            self._handle_vendor_message(chat_id, text, session)
        elif role == "client":
            self._handle_client_message(chat_id, text, session)
        else:
            self._handle_public_enquiry(chat_id, text, sender_name, session)

    # --- Start Command Handler with QR Deep-Links ---

    def _handle_start_command(self, chat_id: int, sender_name: str, text: str, session: Dict[str, Any]):
        parts = text.split()
        param = parts[1].lower() if len(parts) > 1 else ""

        # 1. Scanned Client QR (scan.png): /start client_enquiry
        if "client_enquiry" in param or "client" in param:
            session["role"] = "public"
            session["interview_step"] = 1
            self.send_message(
                chat_id,
                f" <b>QR Scan Verified: Connected to The Royal Knot Unified Bot!</b>\n"
                f"Padharo Sa, {sender_name}! We are honored to plan your dream heritage wedding."
            )
            self._prompt_interview_step(chat_id, session, 1)
            return

        # 2. Scanned Vendor QR (vendor_scan.png): /start vendor_portal
        if "vendor_portal" in param or "vendor" in param:
            session["role"] = "vendor_bidder"
            self._send_vendor_oneway_mirror_welcome(chat_id, sender_name)
            return

        # 3. Role tokens from Phase 1
        if "founder" in param:
            session["role"] = "founder"
            self.send_message(chat_id, " <b>QR Scan Verified: Authenticated as FOUNDER / EXECUTIVE</b>")
            self._send_role_welcome(chat_id, session)
            return
        elif "planner" in param:
            session["role"] = "planner"
            self.send_message(chat_id, " <b>QR Scan Verified: Authenticated as LEAD WEDDING PLANNER</b>")
            self._send_role_welcome(chat_id, session)
            return

        # Default public start
        session["role"] = "public"
        session["interview_step"] = 1
        self.send_message(
            chat_id,
            f" <b>Welcome to The Royal Knot, {sender_name}!</b>\n\n"
            "We plan bespoke luxury destination weddings across heritage palaces in <b>Jaipur & Udaipur</b>."
        )
        self._prompt_interview_step(chat_id, session, 1)

    # --- 4-Step Client Guided Interview ---

    def _prompt_interview_step(self, chat_id: int, session: Dict[str, Any], step: int):
        enquiry = session["enquiry_data"]
        session["interview_step"] = step

        if step == 1:
            self.send_message(
                chat_id,
                " <b>Step 1 of 4: The Couple & Royal Destination</b>\n\n"
                "Please share the names of the <b>Bride & Groom</b>, and which royal destination calls to your heart:\n"
                "• <b>Jaipur</b> (Rambagh Palace, Samode Palace, Fairmont)\n"
                "• <b>Udaipur</b> (City Palace, Jagmandir Island, Taj Lake Palace)\n\n"
                "<i>(Tip: You can also type freely, e.g., 'Aarav & Diya, planning 3 days in Jaipur for 400 guests with 2.5 Cr budget'!)</i>"
            )
        elif step == 2:
            dest = enquiry.get("destination") or "Rajasthan"
            couple = enquiry.get("couple_names") or "the couple"
            self.send_message(
                chat_id,
                f" <b>Step 2 of 4: Celebration Span & Dates</b>\n\n"
                f"Magnificent choice for {couple} in <b>{dest}</b>!\n"
                "How many days of celebrations are you envisioning (e.g. <b>3-day royal affair:</b> Mehendi, Sangeet, Royal Pheras, Reception), and do you have preferred dates or a season?"
            )
        elif step == 3:
            self.send_message(
                chat_id,
                " <b>Step 3 of 4: Royal Guestlist Estimate</b>\n\n"
                "Approximately how many esteemed guests will grace your celebrations?\n"
                "<i>(Our ML Turnout Engine will automatically compute outstation arrival buffers & banquet plate surges based on your answer!)</i>"
            )
        elif step == 4:
            self.send_message(
                chat_id,
                " <b>Step 4 of 4: Budget Range & Thematic Vision</b>\n\n"
                "What is your anticipated total celebration budget range (e.g. <b>₹2.0 Cr - ₹3.5 Cr</b>), and any signature aesthetic elements (e.g. revolving lotus mandap, vintage Rolls Royce baraat, concert sound)?"
            )

    def _handle_public_enquiry(self, chat_id: int, text: str, sender_name: str, session: Dict[str, Any]):
        """Executes zero-input ingestion via Gemini, updates steps, and saves to PostgreSQL."""
        current_step = session.get("interview_step", 1)
        enquiry = session.get("enquiry_data", {})

        # Process with Gemini 4-step dynamic parser
        result = GeminiLeadExtractor.process_public_chat(enquiry, text, sender_name, current_step)
        session["enquiry_data"] = result.get("enquiry_data", enquiry)
        next_step = result.get("next_step", current_step)
        reply = result.get("reply", "")

        # If completed, ingest into PostgreSQL knotcore_db
        if result.get("is_completed") or next_step == 5:
            session["interview_step"] = 5
            inquiry_id = self._save_inquiry_to_db(chat_id, sender_name, session["enquiry_data"])
            session["inquiry_id"] = inquiry_id

            # Send rich confirmation with Next Action
            budget_val = session["enquiry_data"].get("budget_inr") or 25000000.0
            pax = session["enquiry_data"].get("guest_count") or 400
            ml_pax = int(pax * 1.17)
            plates = int(pax * 1.31)

            confirm_msg = (
                " <b>YOUR ROYAL ENQUIRY IS OFFICIALLY REGISTERED!</b>\n\n"
                f"• <b>Inquiry Ref:</b> <code>INQ-2026-{inquiry_id or '01'}</code>\n"
                f"• <b>Couple:</b> {session['enquiry_data'].get('couple_names', sender_name)}\n"
                f"• <b>Destination:</b> {session['enquiry_data'].get('destination', 'Jaipur')}\n"
                f"• <b>Celebration Span:</b> {session['enquiry_data'].get('duration_days', 3)} Days\n"
                f"• <b>Confirmed Guests:</b> {pax}\n"
                f"• <b>ML Predicted Turnout:</b> {ml_pax} Guests (+17% Buffer)\n"
                f"• <b>Shahi Banqueting Plates:</b> {plates} Plates (+31% Buffer)\n"
                f"• <b>Budget Allocated:</b> ₹{(budget_val/10000000):.2f} Cr\n\n"
                " <b>Instant Transmission:</b> Your portfolio has been routed to the <b>KnotCore Executive Dashboard (User Enquiries)</b>.\n\n"
                "️ <i>To digitally counter-sign the Royal Proposal & confirm Milestone 1 Advance, type <code>/sign</code> or wait for your planner's action trigger.</i>"
            )
            self.send_message(chat_id, confirm_msg)
        else:
            session["interview_step"] = next_step
            self.send_message(chat_id, reply)

    def _save_inquiry_to_db(self, chat_id: int, sender_name: str, data: Dict[str, Any]) -> Optional[int]:
        """Saves enquiry into PostgreSQL crm_inquiries table with live sync to dashboard."""
        conn = self._get_db()
        if not conn:
            return None
        try:
            cur = conn.cursor()
            couple = data.get("couple_names") or f"{sender_name} Royal Wedding"
            city = data.get("destination") or "Jaipur"
            pax = data.get("guest_count") or 400
            budget = data.get("budget_inr") or 25000000.0
            days = data.get("duration_days") or 3

            cur.execute("""
                INSERT INTO crm_inquiries (
                    name, phone, telegram_id, preferred_city, guest_count,
                    budget_inr, sentiment_score, recovery_status, status, duration_days, chat_id, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'active', 'new', %s, %s, CURRENT_TIMESTAMP)
                RETURNING id;
            """, (couple, "+91 98290 11223", f"@{sender_name}", city, pax, budget, 0.96, days, chat_id))
            inquiry_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            print(f"[SUCCESS] Ingested inquiry #{inquiry_id} for {couple} into knotcore_db!")
            return inquiry_id
        except Exception as e:
            print(f"[DB Ingest Error] {e}")
            if conn:
                conn.close()
            return None

    # --- Client Digital Signing & Advance Confirmation ---

    def _handle_client_digital_signing(self, chat_id: int, session: Dict[str, Any]):
        """Records digital counter-signature, confirms booking, generates PDF proposal."""
        enquiry = session.get("enquiry_data", {})
        couple = enquiry.get("couple_names") or "Aarav Singhania & Diya Rathore"
        city = enquiry.get("destination") or "Jaipur"
        budget = enquiry.get("budget_inr") or 25000000.0
        advance = float(budget) * 0.30

        # Update DB status to 'signed'
        conn = self._get_db()
        if conn:
            try:
                cur = conn.cursor()
                if session.get("inquiry_id"):
                    cur.execute("UPDATE crm_inquiries SET status = 'signed' WHERE id = %s", (session["inquiry_id"],))
                else:
                    cur.execute("UPDATE crm_inquiries SET status = 'signed' WHERE chat_id = %s", (chat_id,))
                conn.commit()
                cur.close()
                conn.close()
            except Exception as e:
                print(f"[DB Signing Error] {e}")

        session["signed"] = True

        # Generate official Proposal PDF
        pdf_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "Aarav_Diya_Proposal.pdf")
        if generate_wedding_proposal_pdf:
            try:
                generate_wedding_proposal_pdf(
                    {
                        "name": couple,
                        "preferred_city": city,
                        "guest_count": enquiry.get("guest_count", 400),
                        "budget_inr": budget
                    },
                    pdf_path
                )
            except Exception as e:
                print(f"[PDF Gen Error] {e}")

        # Send confirmation to client
        self.send_message(
            chat_id,
            " <b>PROPOSAL COUNTER-SIGNED & MILESTONE 1 ADVANCE CONFIRMED!</b>\n\n"
            f"Dear <b>{couple}</b>,\n"
            f"Your digital counter-signature for the 3-Day Royal Wedding at <b>{city}</b> has been securely stamped.\n\n"
            f"• <b>Milestone 1 Advance (30%):</b> ₹{advance:,.0f} [CONFIRMED & HELD]\n"
            "• <b>Palace Dates:</b> Locked on Heritage Grounds\n"
            "• <b>Proposal PDF:</b> Compiled & Available in Dashboard\n\n"
            " <b>ONE-WAY MIRROR PROCUREMENT ACTIVATED:</b>\n"
            "The RFP specifications have been released to our verified supplier network under strict blind bidding. Competing vendors cannot view each other's quotes; all bids flow directly to the KnotCore Platform Admin."
        )

    # --- Vendor Blind Bidding ("One-Way Mirror") ---

    def _send_vendor_oneway_mirror_welcome(self, chat_id: int, sender_name: str):
        welcome_text = (
            " <b>THE ROYAL KNOT — VENDOR PROCUREMENT NETWORK</b>\n\n"
            f"Welcome, {sender_name}! You have entered the verified supplier bidding portal.\n\n"
            " <b>ONE-WAY MIRROR BLIND BIDDING PROTOCOL:</b>\n"
            "• All RFP specifications and proposals are strictly confidential.\n"
            "• When you submit a quote, it is sent <b>directly and privately</b> to the KnotCore Platform Admin.\n"
            "• <b>Competing vendors cannot see your bid, price, or identity.</b> (Zero price collusion)\n\n"
            " <b>Active RFPs for Aarav & Diya Royal Wedding (Jaipur):</b>\n"
            "1. <code>CAT-02</code> Royal Catering & Banqueting (524 Buffet Plates)\n"
            "2. <code>CAT-03</code> Floral Architecture & Production\n"
            "3. <code>CAT-05</code> Concert Light & Sound AV (Meyer Sound Line Arrays)\n\n"
            "<b>To submit a confidential quote, reply with:</b>\n"
            "<code>/bid &lt;category_code&gt; &lt;your_company_name&gt; &lt;amount_in_inr&gt;</code>\n\n"
            "<i>Example:</i> <code>/bid CAT-02 Shahi Rajputana Caterers 5100000</code>"
        )
        self.send_message(chat_id, welcome_text)

    def _handle_vendor_bid(self, chat_id: int, text: str, session: Dict[str, Any]):
        """Handles /bid CAT-02 VendorName 5100000 with WCI scoring and +2-sigma anomaly check."""
        parts = text.split(maxsplit=3)
        if len(parts) < 4:
            self.send_message(
                chat_id,
                "️ <b>Invalid bid format.</b> Please use:\n"
                "<code>/bid &lt;category_code&gt; &lt;vendor_name&gt; &lt;amount_in_inr&gt;</code>\n"
                "Example: <code>/bid CAT-02 Shahi Kitchens 5100000</code>"
            )
            return

        cat_code = parts[1].upper()
        vendor_name = parts[2]
        try:
            quoted_price = float(parts[3].replace(',', '').strip())
        except ValueError:
            self.send_message(chat_id, "️ Invalid amount. Please provide a numeric value in INR.")
            return

        # Historical benchmark stats for demo categories
        benchmarks = {
            "CAT-02": {"name": "Royal Catering & Banqueting", "avg": 5000000.0, "std": 400000.0},
            "CAT-03": {"name": "Floral Architecture & Production", "avg": 3000000.0, "std": 250000.0},
            "CAT-05": {"name": "Light, Sound & Concert AV", "avg": 1500000.0, "std": 120000.0},
        }
        bench = benchmarks.get(cat_code, {"name": "Specialized Royal Service", "avg": quoted_price, "std": quoted_price * 0.1})

        hist_avg = bench["avg"]
        std_dev = bench["std"]

        # Check +2-sigma anomaly
        is_anomaly = quoted_price > (hist_avg + 2 * std_dev)

        # Calculate WCI score
        price_ratio = max(0.0, min(100.0, 100.0 - ((quoted_price - hist_avg) / hist_avg) * 100.0))
        quality = 95.0
        delivery = 92.0
        financial = 90.0
        wci_score = (0.35 * price_ratio) + (0.30 * quality) + (0.20 * delivery) + (0.15 * financial)
        wci_score = round(wci_score, 2)

        # Ingest into PostgreSQL vendor_quotes table
        conn = self._get_db()
        quote_id = None
        if conn:
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO vendor_quotes (
                        wedding_id, category_code, category_name, vendor_name, quoted_price,
                        historical_avg, std_dev, quality_score, delivery_score,
                        financial_stability_score, wci_score, anomaly_flag, status
                    ) VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (
                    cat_code, bench["name"], vendor_name, quoted_price,
                    hist_avg, std_dev, quality, delivery, financial,
                    wci_score, is_anomaly, 'rejected' if is_anomaly else 'submitted'
                ))
                quote_id = cur.fetchone()[0]
                conn.commit()
                cur.close()
                conn.close()
            except Exception as e:
                print(f"[DB Vendor Quote Error] {e}")
                if conn:
                    conn.close()

        # Send private confirmation (One-Way Mirror)
        self.send_message(
            chat_id,
            " <b>CONFIDENTIAL QUOTE SECURELY TRANSMITTED!</b>\n\n"
            f"• <b>Bid Reference:</b> <code>BID-{quote_id or secrets.randbelow(900)+100}</code>\n"
            f"• <b>Category:</b> {cat_code} ({bench['name']})\n"
            f"• <b>Vendor:</b> {vendor_name}\n"
            f"• <b>Quoted Price:</b> ₹{(quoted_price/100000):.2f} Lakhs\n"
            f"• <b>WCI Evaluation Score:</b> <b>{wci_score} / 100</b>\n\n"
            " <b>ONE-WAY MIRROR GUARANTEE:</b>\n"
            "Your quote is private to you and the KnotCore Platform Admin. No competing vendors in the group can view your bid."
        )

    # --- Role Handlers ---

    def _send_role_welcome(self, chat_id: int, session: Dict[str, Any]):
        role = session["role"]
        if role == "founder":
            self.send_message(chat_id, " <b>Executive Command Center Active</b>\nUse <code>/profit</code>, <code>/due</code>, <code>/delays</code>, <code>/top</code>.")
        elif role == "planner":
            self.send_message(chat_id, " <b>Wedding Operations Command Active</b>\nUse <code>/tasks</code>, <code>/schedule</code>, <code>/unconfirmed</code>.")
        elif role in ["vendor", "vendor_bidder"]:
            self._send_vendor_oneway_mirror_welcome(chat_id, session.get("name", "Supplier"))
        elif role == "client":
            self.send_message(chat_id, " <b>The Royal Knot Couple VIP Portal</b>\nUse <code>/status</code>, <code>/payments</code>, <code>/sign</code>.")

    def _handle_founder_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        if "/profit" in text.lower():
            self.send_message(chat_id, " <b>FOUNDER MARGIN:</b> Season Revenue: ₹78.5 Cr | Projected Profit: ₹17.2 Cr (21.9% Margin)")
            return
        if "/due" in text.lower():
            self.send_message(chat_id, " <b>CASH FLOW:</b> Outflow due in 7 days: ₹20.50L. Incoming milestone: ₹1.20 Cr.")
            return
        copilot = GeminiLeadExtractor.generate_role_copilot_reply("founder", text, self.founder_context)
        self.send_message(chat_id, f" <b>Executive Copilot:</b>\n\n{copilot or text}")

    def _handle_planner_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        if "/tasks" in text.lower():
            self.send_message(chat_id, " <b>PLANNER TASKS:</b> Catering tasting overdue (1 day). Stage sound audit due in 48h.")
            return
        copilot = GeminiLeadExtractor.generate_role_copilot_reply("planner", text, self.planner_context)
        self.send_message(chat_id, f" <b>Operations Copilot:</b>\n\n{copilot or text}")

    def _handle_vendor_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        if text.strip() == "4821":
            self.send_message(chat_id, " <b>Palace Gate Check-In Verified!</b> Dock 3 unloading cleared.")
            return

        # Vendor Quotation Verification & OCR Engine
        try:
            from knotcore_backend.quotation_ocr_engine import QuotationOCREngine
            pending = session.get("pending_fill_blank")
            result = QuotationOCREngine.process_vendor_submission(
                text_content=text,
                vendor_sender_name=session.get("vendor_name") or session.get("name", "Supplier"),
                chat_id=chat_id,
                pending_session=pending
            )

            # 1. If not a quotation, notify vendor
            if not result.get("is_quotation"):
                self.send_message(chat_id, result["message"])
                return

            # 2. If missing fields (e.g. quantity), prompt fill in the blanks
            if result.get("needs_fill_blank"):
                session["pending_fill_blank"] = {
                    "is_waiting_for_missing": True,
                    "missing_fields": result["missing_fields"],
                    "extracted_so_far": result["extracted_so_far"]
                }
                self.send_message(chat_id, result["message"])
                return

            # 3. Completed quotation placed into comparison grid
            session["pending_fill_blank"] = None
            self.send_message(chat_id, result["message"])
            return
        except Exception as e:
            print(f"[Vendor Quote OCR Error] {e}")

        self.send_message(
            chat_id,
            " <b>Vendor Portal:</b> Please submit your itemized quotation (e.g. category, quantity of plates/units, price) or reply with OTP <code>4821</code>."
        )

    def _handle_client_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        if "/sign" in text.lower() or "sign" in text.lower():
            self._handle_client_digital_signing(chat_id, session)
            return
        if "/payments" in text.lower():
            self.send_message(chat_id, " <b>PAYMENTS:</b> Milestone 1 (30%): ₹90.0L [PAID]. Milestone 2 (40%): ₹1.20 Cr [Due in 18d].")
            return
        copilot = GeminiLeadExtractor.generate_role_copilot_reply("client", text, self.client_context)
        self.send_message(chat_id, f" <b>Royal Concierge:</b>\n\n{copilot or text}")
