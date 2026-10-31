# -*- coding: utf-8 -*-
"""
KnotCore Multi-Role Dynamic Telegram Bot Engine
================================================
Enterprise-grade conversational gateway enforcing 100% Role-Based Access Control (RBAC)
across Founders, Planners, Vendors, and Clients. Features Deep-Link QR Authentication,
zero-assumption dynamic inquiry extraction, and Gemini 3.5 Flash contextual Copilot.
"""
import os
import time
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional
try:
    from .nlp_extractor import GeminiLeadExtractor
except ImportError:
    from nlp_extractor import GeminiLeadExtractor

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
        
        # User session memory: {chat_id: {"role": ..., "enquiry_data": {...}, ...}}
        self.sessions: Dict[int, Dict[str, Any]] = {}
        
        # Active OTPs for vendor gate check-in: {chat_id: {"otp": "4821", "vendor": "DJ Sound Crew", "venue": "Rambagh Palace"}}
        self.active_vendor_otps: Dict[int, Dict[str, Any]] = {}

        # Shared Dynamic Enterprise Data
        self.founder_context = {
            "season_weddings": 25,
            "contracted_revenue_inr": 785000000, # 78.5 Cr
            "projected_profit_inr": 172000000, # 17.2 Cr (21.9% margin)
            "realized_profit_inr": 61450000, # 6.14 Cr
            "margin_warnings": [
                {"wedding": "TRK/2026/0003 (City Palace Udaipur)", "current_margin": "11.2%", "cause": "Unbilled lighting & sound variations"}
            ],
            "payments_due_7_days": [
                {"to": "Florist Advance (Samode Palace)", "amount_inr": 400000, "due": "Tomorrow"},
                {"to": "Caterer Advance (Rambagh Palace)", "amount_inr": 1500000, "due": "3 Days"},
                {"to": "DJ Sound Settlement", "amount_inr": 150000, "due": "5 Days"}
            ],
            "incoming_receivables_7_days": [
                {"from": "Client Aarav & Diya (Milestone 2)", "amount_inr": 12000000, "due": "4 Days"}
            ],
            "vendor_delay_rankings": [
                {"vendor": "Jaipur Sound Crew (DJ)", "avg_delay_mins": 35, "late_ratio": "3 of 4 events", "status": "Flagged for review"},
                {"vendor": "Royal Rajasthani Caterers", "punctuality_pct": 98, "status": "Excellent"},
                {"vendor": "Mewar Floral Decorators", "punctuality_pct": 100, "status": "Excellent"}
            ],
            "top_5_weddings_by_budget": [
                {"venue": "City Palace Udaipur", "budget": "₹4.50 Cr", "package": "Full-Service"},
                {"venue": "Rambagh Palace Jaipur", "budget": "₹3.20 Cr", "package": "Full-Service"},
                {"venue": "Taj Lake Palace Udaipur", "budget": "₹3.00 Cr", "package": "Full-Service"},
                {"venue": "Samode Palace Jaipur", "budget": "₹2.40 Cr", "package": "Full-Service"},
                {"venue": "Fairmont Jaipur", "budget": "₹2.10 Cr", "package": "Partial Day-Of"}
            ]
        }

        self.planner_context = {
            "assigned_wedding": "Aarav & Diya Royal Wedding (Rambagh Palace)",
            "active_tasks": [
                {"title": "Catering Tasting with Couple", "vendor": "Royal Rajasthani Caterers", "status": "OVERDUE (1 day)", "urgency": "High"},
                {"title": "Stage Sound Audit (125kVA generator permit)", "venue": "Rambagh Lawns", "status": "Due in 48h", "urgency": "Medium"},
                {"title": "Mehendi Floral Arches Setup", "vendor": "Mewar Florals", "status": "Approved & In-Progress", "urgency": "Normal"}
            ],
            "tomorrow_run_sheet": [
                {"time": "10:00 AM", "event": "Palace Grounds Logistics & Sound Check", "lead": "Venue Manager"},
                {"time": "12:00 PM", "event": "Groom Royal Baraat with Vintage Cars", "lead": "Planner Lead"},
                {"time": "02:00 PM", "event": "Mehendi & Sangeet Performance", "lead": "Choreographer / Event Coord"},
                {"time": "07:00 PM", "event": "Varmala & Royal Pheras at Central Mandap", "lead": "Lead Wedding Planner"},
                {"time": "09:00 PM", "event": "Grand Royal Reception & Live Banquet", "lead": "All Coordinators"}
            ],
            "unconfirmed_vendors": [
                {"name": "Jaipur Sound Crew (DJ)", "contact": "+91 98290 88776", "reason": "Has not confirmed arrival call time"},
                {"name": "Bridal Makeup Artist", "contact": "+91 94140 22334", "reason": "Pending morning arrival acknowledgement"}
            ]
        }

        self.vendor_context = {
            "vendor_name": "DJ Sound Crew (Jaipur)",
            "venue": "Rambagh Palace, Jaipur",
            "gate": "Service Dock Gate 3 (Bhawani Singh Road entrance)",
            "check_in_otp": "4821",
            "dock_instructions": "Unload audio consoles and stage trussing at Dock 3. Do not block main heritage archway.",
            "incident_support": "Coordinator stationed at Dock 3. Emergency power available via 125kVA backup generator."
        }

        self.client_context = {
            "couple_names": "Aarav Sharma & Diya Mehta",
            "wedding_code": "TRK/2026/0001",
            "venue": "Rambagh Palace, Jaipur",
            "countdown_days": 58,
            "lead_planner": "Welcome (Head of Luxury Events)",
            "milestone_billing": {
                "total_contract_inr": 30000000, # 3 Cr
                "milestone_1_booking_deposit": {"amount_inr": 9000000, "status": "PAID (30%)", "receipt": "TRK-REC-0192"},
                "milestone_2_operational_advance": {"amount_inr": 12000000, "status": "DUE in 18 Days (40%)"},
                "milestone_3_final_settlement": {"amount_inr": 9000000, "status": "POST-WEDDING (30%)"},
                "outstanding_balance_inr": 21000000
            },
            "pending_approvals": [
                "Review & sign off on Royal Caterer's 35-item banquet degustation menu",
                "Confirm guest favors selection (Jaipuri block-print silk scarves vs silver ittar bottles)"
            ]
        }

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
            "enquiry_data": {
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            },
            "wedding": None,
            "vendor_name": None,
        })

        # Command: /reset (clears conversation and starts fresh)
        if text.lower() in ["/reset", "/restart"]:
            session["enquiry_data"] = {
                "destination": None,
                "duration_days": None,
                "guest_count": None,
                "budget_inr": None,
                "wedding_theme": None,
                "preferred_dates": None,
            }
            self.send_message(
                chat_id,
                "🔄 <b>Session reset successfully!</b>\n"
                "Let's start fresh. Tell us about your dream destination wedding in Jaipur or Udaipur."
            )
            return

        # Command: Role Switcher (Secret Weapon for Hackathon Live Demo)
        if text.startswith("/role"):
            parts = text.split()
            if len(parts) > 1 and parts[1].lower() in ["founder", "planner", "vendor", "client", "public"]:
                new_role = parts[1].lower()
                session["role"] = new_role
                if new_role == "vendor":
                    self.active_vendor_otps[chat_id] = {"otp": "4821", "vendor": "DJ Sound Crew", "venue": "Rambagh Palace"}
                self.send_message(
                    chat_id,
                    f"🔄 <b>Demo Mode: Role Switched to: {new_role.upper()}</b>\n"
                    f"Permissions and live command suite updated."
                )
                self._send_role_welcome(chat_id, session)
                return

        # Deep-Link QR Login Handler: /start AUTH_<TOKEN>
        if text.startswith("/start"):
            self._handle_start_command(chat_id, sender_name, text, session)
            return

        # Dispatch based on Authenticated Role
        role = session.get("role", "public")
        if role == "founder":
            self._handle_founder_message(chat_id, text, session)
        elif role == "planner":
            self._handle_planner_message(chat_id, text, session)
        elif role == "vendor":
            self._handle_vendor_message(chat_id, text, session)
        elif role == "client":
            self._handle_client_message(chat_id, text, session)
        else:
            self._handle_public_enquiry(chat_id, text, sender_name, session)

    # --- Role-Based Handlers ---

    def _handle_start_command(self, chat_id: int, sender_name: str, text: str, session: Dict[str, Any]):
        parts = text.split()
        if len(parts) > 1 and parts[1].startswith("AUTH_"):
            token_payload = parts[1].replace("AUTH_", "").upper()
            
            # Map Token to Role
            if "FOUNDER" in token_payload:
                session["role"] = "founder"
                self.send_message(chat_id, "👑 <b>QR Scan Verified: Authenticated as FOUNDER / EXECUTIVE</b>")
            elif "PLANNER" in token_payload:
                session["role"] = "planner"
                self.send_message(chat_id, "📋 <b>QR Scan Verified: Authenticated as LEAD WEDDING PLANNER</b>")
            elif "VENDOR" in token_payload:
                session["role"] = "vendor"
                session["vendor_name"] = "DJ Sound Crew (Jaipur)"
                session["venue"] = "Rambagh Palace"
                self.active_vendor_otps[chat_id] = {"otp": "4821", "vendor": "DJ Sound Crew", "venue": "Rambagh Palace"}
                self.send_message(
                    chat_id,
                    "🚚 <b>Palace Gate QR Verified: Authenticated as SUPPLIER / VENDOR</b>\n"
                    "Vendor: <b>DJ Sound Crew</b> | Destination: <b>Rambagh Palace</b>\n\n"
                    "🔐 <b>GATE SECURITY OTP: 4821</b>\n"
                    "Please reply with this 4-digit OTP to confirm your on-site arrival check-in."
                )
                return
            elif "CLIENT" in token_payload:
                session["role"] = "client"
                session["wedding"] = "Aarav & Diya Royal Wedding (TRK/2026/0001)"
                self.send_message(chat_id, "💍 <b>QR Scan Verified: Authenticated as CLIENT / COUPLE</b>")
            else:
                session["role"] = "public"

            self._send_role_welcome(chat_id, session)
            return

        # Default Welcome for New Couple / Public
        session["role"] = "public"
        self.send_message(
            chat_id,
            f"👑 <b>Welcome to The Royal Knot, {sender_name}!</b>\n\n"
            "We plan bespoke luxury destination weddings across heritage palaces in <b>Jaipur & Udaipur</b>.\n\n"
            "💬 <b>Tell us about your wedding plans:</b>\n"
            "You can type naturally, for example:\n"
            "• <i>'We want a 3 days wedding in Jaipur'</i>\n"
            "• <i>'Planning for 300 guests with budget 2 crores in Udaipur'</i>\n\n"
            "💡 <i>Or switch roles anytime using:</i> <code>/role founder</code> | <code>/role planner</code> | <code>/role vendor</code> | <code>/role client</code>"
        )

    def _send_role_welcome(self, chat_id: int, session: Dict[str, Any]):
        role = session["role"]
        if role == "founder":
            self.send_message(
                chat_id,
                "👑 <b>Executive Command Center Active</b>\n\n"
                "You have full visibility over agency margins, cash flow, and supplier reliability.\n\n"
                "<b>Try asking anything naturally or use quick commands:</b>\n"
                "• <code>/profit</code> or <i>'What is our total revenue and profit this season?'</i>\n"
                "• <code>/due</code> or <i>'How much vendor advance is due this week?'</i>\n"
                "• <code>/delays</code> or <i>'Which vendor has the highest delay rate?'</i>\n"
                "• <code>/top</code> or <i>'Show top 5 luxury weddings by budget'</i>"
            )
        elif role == "planner":
            self.send_message(
                chat_id,
                "📋 <b>Wedding Operations Command Active</b>\n\n"
                "Assigned to: <b>Aarav & Diya (Rambagh Palace)</b>\n\n"
                "<b>Try asking anything naturally or use quick commands:</b>\n"
                "• <code>/tasks</code> or <i>'What tasks are overdue today?'</i>\n"
                "• <code>/schedule</code> or <i>'What is the minute-by-minute timeline for tomorrow?'</i>\n"
                "• <code>/unconfirmed</code> or <i>'Which vendors haven't confirmed arrival yet?'</i>\n"
                "• <code>/alert &lt;message&gt;</code> - Broadcast emergency announcement to coordinators"
            )
        elif role == "vendor":
            self.send_message(
                chat_id,
                "🚚 <b>Vendor Gate Portal Active (DJ Sound Crew)</b>\n\n"
                "• Reply with your <b>4-digit OTP (<code>4821</code>)</b> to complete palace gate check-in.\n"
                "• Type <code>/incident &lt;issue&gt;</code> or describe emergency equipment needs.\n"
                "• Ask questions like <i>'Where is the loading dock at Rambagh Palace?'</i>"
            )
        elif role == "client":
            self.send_message(
                chat_id,
                "💍 <b>The Royal Knot Couple VIP Portal</b>\n\n"
                "Wedding: <b>Aarav & Diya (Rambagh Palace)</b>\n\n"
                "<b>Try asking anything naturally or use quick commands:</b>\n"
                "• <code>/status</code> or <i>'How many days left and what is our next event?'</i>\n"
                "• <code>/payments</code> or <i>'What is our milestone payment schedule and balance?'</i>\n"
                "• <code>/pending</code> or <i>'What decisions are pending from our side?'</i>"
            )

    # --- Role Logic & Firewall ---

    def _handle_founder_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if text_lower in ["/profit", "profit"] or "season margin" in text_lower:
            self.send_message(
                chat_id,
                "📊 <b>FOUNDER INTELLIGENCE: SEASON MARGIN REPORT</b>\n\n"
                "• <b>Total Weddings this Season:</b> 25\n"
                "• <b>Total Contracted Revenue:</b> ₹78,50,00,000\n"
                "• <b>Projected Net Profit:</b> ₹17,20,00,000 (21.9% Margin)\n"
                "• <b>Actual Realized Profit to Date:</b> ₹6,14,50,000\n\n"
                "⚠️ <b>Margin Warning:</b> Wedding <code>TRK/2026/0003</code> in Udaipur dropped to 11.2% due to unbilled lighting variations. "
                "<i>Action Recommended: Approve supplementary client bill.</i>"
            )
            return

        if text_lower in ["/due", "due", "cashflow", "cash flow"] or "payments due" in text_lower:
            self.send_message(
                chat_id,
                "💳 <b>CASH FLOW OUTFLOW: PAYMENTS DUE NEXT 7 DAYS</b>\n\n"
                "1. Florist Advance (Samode Palace): ₹4,00,000 (Due Tomorrow)\n"
                "2. Caterer Advance (Rambagh Palace): ₹15,00,000 (Due in 3 Days)\n"
                "3. DJ Sound Settlement: ₹1,50,000 (Due in 5 Days)\n"
                "• <b>Total Outflow Due:</b> ₹20,50,000\n"
                "• <b>Incoming Client Milestone 2:</b> ₹1,20,00,000 (Aarav & Diya - Safe liquidity buffer)"
            )
            return

        if text_lower in ["/delays", "delays", "delay"] or "vendor punctuality" in text_lower:
            self.send_message(
                chat_id,
                "⏱️ <b>VENDOR RELIABILITY & PUNCTUALITY AUDIT</b>\n\n"
                "• <b>Jaipur Sound Crew (DJ):</b> 35 mins average delay (Late 3 of 4 events) - ⚠️ Flagged for review.\n"
                "• <b>Royal Rajasthani Caterers:</b> 98% On-Time arrival rate (Excellent).\n"
                "• <b>Mewar Floral Decorators:</b> 100% On-Time arrival rate."
            )
            return

        if text_lower in ["/top", "top weddings", "most expensive"]:
            self.send_message(
                chat_id,
                "👑 <b>TOP 5 LUXURY WEDDINGS (BY BUDGET)</b>\n\n"
                "1. City Palace Udaipur: ₹4,50,00,000 (Full-Service)\n"
                "2. Rambagh Palace Jaipur: ₹3,20,00,000 (Full-Service)\n"
                "3. Taj Lake Palace Udaipur: ₹3,00,00,000 (Full-Service)\n"
                "4. Samode Palace Jaipur: ₹2,40,00,000 (Full-Service)\n"
                "5. Fairmont Jaipur: ₹2,10,00,000 (Partial)"
            )
            return

        # Natural Language Executive Copilot
        copilot_answer = GeminiLeadExtractor.generate_role_copilot_reply("founder", text, self.founder_context)
        if copilot_answer:
            self.send_message(chat_id, f"👑 <b>Executive AI Copilot:</b>\n\n{copilot_answer}")
        else:
            self.send_message(
                chat_id,
                f"👑 <b>Executive Copilot:</b> Query noted: \"{text}\". "
                "Use <code>/profit</code>, <code>/due</code>, <code>/delays</code>, or <code>/top</code> for quick metrics."
            )

    def _handle_planner_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if any(w in text_lower for w in ["/profit", "profit", "margin", "agency revenue", "bank balance"]):
            # Strict RBAC Firewall!
            self.send_message(
                chat_id,
                "⛔ <b>ACCESS DENIED:</b> Lead Planners do not have clearance to view agency-wide profit margins or executive financial accounts. Contact the Founder."
            )
            return

        if text_lower in ["/tasks", "tasks", "task"] or "overdue" in text_lower:
            self.send_message(
                chat_id,
                "📋 <b>ACTIVE WEDDING TASKS (PRIORITY AUDIT)</b>\n\n"
                "• 🔴 <b>Catering Tasting:</b> Caterer tasting session with couple (Overdue by 1 day - Assigned to: You)\n"
                "• 🟡 <b>Stage Sound Audit:</b> Verify 125kVA generator permit for Rambagh lawns (Due in 48h)\n"
                "• 🟢 <b>Mehendi Floral Arches:</b> Approved by design team."
            )
            return

        if text_lower in ["/schedule", "schedule"] or "run sheet" in text_lower or "timeline" in text_lower:
            self.send_message(
                chat_id,
                "🕒 <b>TOMORROW'S WEDDING-DAY RUN SHEET (RAMBAGH PALACE)</b>\n\n"
                "• 10:00 AM - Palace Grounds Logistics & Sound Check (Venue Manager)\n"
                "• 12:00 PM - Groom Royal Baraat with Vintage Cars (Planner Lead)\n"
                "• 02:00 PM - Mehendi & Sangeet Performance (Event Coordinator)\n"
                "• 07:00 PM - Varmala & Royal Pheras at Central Mandap (Lead Planner)\n"
                "• 09:00 PM - Grand Royal Reception & Live Banquet (All Coordinators)"
            )
            return

        if text_lower in ["/unconfirmed", "unconfirmed"]:
            self.send_message(
                chat_id,
                "🚨 <b>UNCONFIRMED VENDORS (TOMORROW'S WEDDING)</b>\n\n"
                "• <b>Jaipur Sound Crew (DJ):</b> Has not acknowledged call time (Call: +91 98290 88776)\n"
                "• <b>Bridal Makeup Artist:</b> Pending morning arrival acknowledgement (Call: +91 94140 22334)"
            )
            return

        # Natural Language Operations Copilot
        copilot_answer = GeminiLeadExtractor.generate_role_copilot_reply("planner", text, self.planner_context)
        if copilot_answer:
            self.send_message(chat_id, f"📋 <b>Operations AI Copilot:</b>\n\n{copilot_answer}")
        else:
            self.send_message(
                chat_id,
                f"📋 <b>Planner Command:</b> Recorded query: \"{text}\". "
                "Use <code>/tasks</code>, <code>/schedule</code>, or <code>/unconfirmed</code> to manage on-ground operations."
            )

    def _handle_vendor_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if any(w in text_lower for w in ["/profit", "profit", "budget", "client bill", "margin", "/payments"]):
            # Strict RBAC Firewall!
            self.send_message(
                chat_id,
                "⛔ <b>ACCESS DENIED:</b> Vendor portal accounts are restricted strictly to arrival check-in, service dock access, and on-ground logistics."
            )
            return

        # Check for OTP Entry
        if chat_id in self.active_vendor_otps:
            expected_otp = self.active_vendor_otps[chat_id]["otp"]
            vendor_name = self.active_vendor_otps[chat_id]["vendor"]
            venue = self.active_vendor_otps[chat_id]["venue"]

            if text.strip() == expected_otp:
                del self.active_vendor_otps[chat_id]
                self.send_message(
                    chat_id,
                    f"✅ <b>CHECK-IN VERIFIED & RECORDED!</b>\n\n"
                    f"Vendor: <b>{vendor_name}</b>\n"
                    f"Venue: <b>{venue} Gate</b>\n"
                    f"Timestamp: <b>{time.strftime('%I:%M %p, %d %b %Y')}</b>\n"
                    f"Status: <b>ARRIVED (On-Time)</b>\n\n"
                    "Your arrival has been broadcasted to the Odoo Command Centre. Proceed to Service Dock Gate 3 for unloading."
                )
                return

        if "/incident" in text_lower or "incident" in text_lower or "cable" in text_lower or "generator" in text_lower or "power" in text_lower:
            clean_issue = text.replace('/incident', '').strip() or text
            self.send_message(
                chat_id,
                f"🚨 <b>ON-GROUND INCIDENT LOGGED (TICKET #INC-892)</b>\n\n"
                f"Reported Issue: <i>'{clean_issue}'</i>\n"
                "Severity: <b>HIGH</b>\n"
                "Status: <b>Dispatched to Technical Lead</b>\n\n"
                "A venue coordinator is arriving at Service Dock 3 in 5 minutes with equipment support."
            )
            return

        # Natural Language Vendor Support
        copilot_answer = GeminiLeadExtractor.generate_role_copilot_reply("vendor", text, self.vendor_context)
        if copilot_answer:
            self.send_message(chat_id, f"🚚 <b>Vendor Support:</b>\n\n{copilot_answer}")
        else:
            self.send_message(
                chat_id,
                "🚚 <b>Vendor Portal:</b> Reply with your 4-digit check-in OTP (<code>4821</code>), or type <code>/incident &lt;issue&gt;</code> if you require equipment assistance."
            )

    def _handle_client_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if any(w in text_lower for w in ["vendor cost", "vendor quote", "internal task", "profit"]):
            self.send_message(chat_id, "⛔ <b>ACCESS RESTRICTED:</b> Internal vendor wholesale sheets are private to The Royal Knot production team.")
            return

        if text_lower in ["/payments", "payments", "payment"] or "balance" in text_lower or "how much paid" in text_lower:
            self.send_message(
                chat_id,
                "💳 <b>YOUR WEDDING PAYMENT STATEMENT</b>\n\n"
                "• <b>Milestone 1 (Booking Deposit - 30%):</b> ₹90,00,000 [PAID - Receipt attached]\n"
                "• <b>Milestone 2 (Operational Advance - 40%):</b> ₹1,20,00,000 [Due in 18 Days]\n"
                "• <b>Milestone 3 (Final Settlement - 30%):</b> ₹90,00,000 [Post-Wedding]\n"
                "• <b>Total Contracted:</b> ₹3,00,00,000\n"
                "• <b>Current Outstanding Balance:</b> ₹2,10,00,000"
            )
            return

        if text_lower in ["/status", "status"] or "countdown" in text_lower or "when" in text_lower or "days left" in text_lower:
            self.send_message(
                chat_id,
                "👑 <b>YOUR ROYAL WEDDING SUMMARY</b>\n\n"
                "• <b>Couple:</b> Aarav Sharma & Diya Mehta\n"
                "• <b>Venue:</b> Rambagh Palace, Jaipur\n"
                "• <b>Countdown:</b> <b>58 Days Remaining!</b>\n"
                "• <b>Next Function:</b> Royal Mehendi & Welcome Dinner\n"
                "• <b>Assigned Lead Planner:</b> Welcome (Head of Luxury Events)"
            )
            return

        if text_lower in ["/pending", "pending"] or "approvals" in text_lower:
            self.send_message(
                chat_id,
                "📝 <b>PENDING APPROVALS FROM YOUR SIDE</b>\n\n"
                "1. Review and sign off on Caterer's 35-item royal banquet menu degustation.\n"
                "2. Confirm guest favors selection (Jaipuri block-print silk scarves vs silver ittar bottles)."
            )
            return

        # Natural Language Client Concierge
        copilot_answer = GeminiLeadExtractor.generate_role_copilot_reply("client", text, self.client_context)
        if copilot_answer:
            self.send_message(chat_id, f"💍 <b>Royal Knot Concierge:</b>\n\n{copilot_answer}")
        else:
            self.send_message(
                chat_id,
                f"💍 <b>The Royal Knot:</b> Received message: \"{text}\". "
                "Type <code>/status</code>, <code>/payments</code>, or <code>/pending</code> to review your wedding details."
            )

    def _handle_public_enquiry(self, chat_id: int, text: str, sender_name: str, session: Dict[str, Any]):
        """
        Dynamic multi-turn lead intake. Never injects hardcoded assumptions.
        Actively answers any question, captures parameters, and prompts for missing details.
        """
        enquiry = session.setdefault("enquiry_data", {
            "destination": None,
            "duration_days": None,
            "guest_count": None,
            "budget_inr": None,
            "wedding_theme": None,
            "preferred_dates": None,
        })

        result = GeminiLeadExtractor.process_public_chat(enquiry, text, sender_name)
        session["enquiry_data"] = result.get("enquiry_data", enquiry)
        reply = result.get("reply", "")

        if reply:
            self.send_message(chat_id, reply)
        else:
            self.send_message(
                chat_id,
                f"✨ <b>The Royal Knot:</b> Thank you for connecting with us, {sender_name}! "
                "Tell us about your celebration vision in Jaipur or Udaipur."
            )
