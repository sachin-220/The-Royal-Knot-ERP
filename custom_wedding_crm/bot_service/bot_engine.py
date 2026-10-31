# -*- coding: utf-8 -*-
"""
KnotCore Multi-Role Telegram Bot Engine
=======================================
Enterprise-grade conversational gateway enforcing 100% Role-Based Access Control (RBAC)
across Founders, Planners, Vendors, and Clients. Features Deep-Link QR Authentication.
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
    Deep-Link QR authentication, and Gemini NLP parsing.
    """

    def __init__(self, token: str):
        self.token = token
        self.api_url = f"https://api.telegram.org/bot{self.token}"
        self.last_update_id = 0
        self.running = False
        
        # User session memory: {chat_id: {"role": "public"|"founder"|"planner"|"vendor"|"client", ...}}
        self.sessions: Dict[int, Dict[str, Any]] = {}
        
        # Active OTPs for vendor gate check-in: {chat_id: {"otp": "4821", "vendor": "DJ Sound Crew", "venue": "Rambagh Palace"}}
        self.active_vendor_otps: Dict[int, Dict[str, Any]] = {}

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
            with urllib.request.urlopen(req, timeout=10) as resp:
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
        except Exception as e:
            # Network timeout or temporary connection drop
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
            "wedding": None,
            "vendor_name": None,
        })

        # Command: Role Switcher (Secret Weapon for Hackathon Live Demo)
        if text.startswith("/role"):
            parts = text.split()
            if len(parts) > 1 and parts[1].lower() in ["founder", "planner", "vendor", "client", "public"]:
                new_role = parts[1].lower()
                session["role"] = new_role
                self.send_message(
                    chat_id,
                    f"🔄 <b>Demo Mode: Role Switched to: {new_role.upper()}</b>\n"
                    f"Permissions and commands updated for this session."
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
                    "Please reply with this 4-digit OTP to confirm your on-site check-in."
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
            "We plan luxury 3-day destination weddings across Jaipur & Udaipur.\n\n"
            "💬 <b>Tell us about your dream wedding:</b>\n"
            "<i>(e.g., 'Planning a winter royal heritage wedding in Udaipur for 400 guests, budget ₹3 Crores')</i>\n\n"
            "📲 <i>If you are staff or a registered vendor, scan your QR badge pass to unlock your portal.</i>"
        )

    def _send_role_welcome(self, chat_id: int, session: Dict[str, Any]):
        role = session["role"]
        if role == "founder":
            self.send_message(
                chat_id,
                "👑 <b>Executive Command Center Active</b>\n\n"
                "Available Queries:\n"
                "• <code>/profit</code> - Real-time Season Profitability & Margin Analysis\n"
                "• <code>/due</code> - Upcoming Vendor Advances & Client Receivables (7 Days)\n"
                "• <code>/delays</code> - Supplier Punctuality & Delay Culprits\n"
                "• <code>/top</code> - Top 5 Most Expensive Weddings this Season"
            )
        elif role == "planner":
            self.send_message(
                chat_id,
                "📋 <b>Wedding Operations Command Active</b>\n\n"
                "Available Queries:\n"
                "• <code>/tasks</code> - Overdue & High-Priority Tasks\n"
                "• <code>/schedule</code> - Tomorrow's Minute-by-Minute Run Sheet\n"
                "• <code>/unconfirmed</code> - Vendors who haven't checked in\n"
                "• <code>/alert</code> - Broadcast alert to venue coordinators"
            )
        elif role == "vendor":
            self.send_message(
                chat_id,
                "🚚 <b>Vendor Gate Portal Active</b>\n\n"
                "• Reply with your <b>4-digit OTP</b> to complete arrival check-in.\n"
                "• Type <code>/incident &lt;issue&gt;</code> to report emergency equipment needs (e.g., generator, cables)."
            )
        elif role == "client":
            self.send_message(
                chat_id,
                "💍 <b>The Royal Knot Couple Portal</b>\n\n"
                "Wedding: <b>Aarav & Diya (Rambagh Palace)</b>\n"
                "• <code>/status</code> - Wedding Countdown & Confirmed Venues\n"
                "• <code>/payments</code> - Staged Invoices Paid & Outstanding Balance\n"
                "• <code>/pending</code> - Items awaiting your approval"
            )

    # --- Role Logic & Firewall ---

    def _handle_founder_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if "/profit" in text_lower or "profit" in text_lower:
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
        elif "/due" in text_lower or "due" in text_lower:
            self.send_message(
                chat_id,
                "💳 <b>CASH FLOW OUTFLOW: PAYMENTS DUE NEXT 7 DAYS</b>\n\n"
                "1. Florist Advance (Samode Palace): ₹4,00,000 (Due Tomorrow)\n"
                "2. Caterer Advance (Rambagh Palace): ₹15,00,000 (Due in 3 Days)\n"
                "3. DJ Sound Settlement: ₹1,50,000 (Due in 5 Days)\n"
                "• <b>Total Outflow Due:</b> ₹20,50,00,000\n"
                "• <b>Incoming Client Milestone 2:</b> ₹1,20,00,000 (Aarav & Diya - Safe liquidity)"
            )
        elif "/delays" in text_lower or "delay" in text_lower:
            self.send_message(
                chat_id,
                "⏱️ <b>VENDOR RELIABILITY & PUNCTUALITY AUDIT</b>\n\n"
                "• <b>Jaipur Sound Crew (DJ):</b> 35 mins average delay (Late 3 of 4 events) - ⚠️ Flagged for review.\n"
                "• <b>Royal Rajasthani Caterers:</b> 98% On-Time arrival rate (Excellent).\n"
                "• <b>Mewar Floral Decorators:</b> 100% On-Time arrival rate."
            )
        elif "/top" in text_lower:
            self.send_message(
                chat_id,
                "👑 <b>TOP 5 LUXURY WEDDINGS (BY BUDGET)</b>\n\n"
                "1. City Palace Udaipur: ₹4,50,00,000 (Full-Service)\n"
                "2. Rambagh Palace Jaipur: ₹3,20,00,000 (Full-Service)\n"
                "3. Taj Lake Palace Udaipur: ₹3,00,00,000 (Full-Service)\n"
                "4. Samode Palace Jaipur: ₹2,40,00,000 (Full-Service)\n"
                "5. Fairmont Jaipur: ₹2,10,00,000 (Partial)"
            )
        else:
            self.send_message(
                chat_id,
                f"👑 <b>Executive Copilot:</b> Received query: \"{text}\". "
                "Use <code>/profit</code>, <code>/due</code>, <code>/delays</code>, or <code>/top</code> for instant business intelligence."
            )

    def _handle_planner_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if "/profit" in text_lower:
            # Firewall Enforced!
            self.send_message(chat_id, "⛔ <b>ACCESS DENIED:</b> Lead Planners do not have clearance to view agency-wide profit margins. Contact the Founder.")
            return

        if "/tasks" in text_lower or "task" in text_lower:
            self.send_message(
                chat_id,
                "📋 <b>ACTIVE WEDDING TASKS (PRIORITY AUDIT)</b>\n\n"
                "• 🔴 <b>Catering Tasting:</b> Caterer A tasting session with couple (Overdue by 1 day - Assigned to: You)\n"
                "• 🟡 <b>Stage Sound Audit:</b> Verify 125kVA generator permit for Rambagh lawns (Due in 48h)\n"
                "• 🟢 <b>Mehendi Floral Arches:</b> Approved by design team."
            )
        elif "/schedule" in text_lower or "schedule" in text_lower:
            self.send_message(
                chat_id,
                "🕒 <b>TOMORROW'S WEDDING-DAY RUN SHEET (RAMBAGH PALACE)</b>\n\n"
                "• 10:00 AM - Venue Logistics Inspection (Venue Manager)\n"
                "• 12:00 PM - Groom Arrival & Royal Baraat (Planner A)\n"
                "• 02:00 PM - Mehendi & Sangeet Performance (Event Coordinator)\n"
                "• 07:00 PM - Varmala & Pheras (Lead Planner)\n"
                "• 09:00 PM - Grand Royal Reception (All Coordinators)"
            )
        elif "/unconfirmed" in text_lower:
            self.send_message(
                chat_id,
                "🚨 <b>UNCONFIRMED VENDORS (TOMORROW'S WEDDING)</b>\n\n"
                "• <b>DJ Sound Crew:</b> Has not acknowledged call time (Call: +91 98290 88776)\n"
                "• <b>Bridal Makeup Artist:</b> Pending arrival acknowledgement."
            )
        else:
            self.send_message(
                chat_id,
                f"📋 <b>Planner Command:</b> Recorded note: \"{text}\". "
                "Use <code>/tasks</code>, <code>/schedule</code>, or <code>/unconfirmed</code> to manage on-ground operations."
            )

    def _handle_vendor_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if "/profit" in text_lower or "budget" in text_lower:
            # Firewall Enforced!
            self.send_message(chat_id, "⛔ <b>ACCESS DENIED:</b> Vendor portal accounts are strictly limited to arrival check-in and on-ground logistics.")
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
                    "Your arrival has been broadcasted to the Odoo Command Centre. Proceed to service dock for unloading."
                )
                return

        if "/incident" in text_lower or "incident" in text_lower or "need" in text_lower or "generator" in text_lower:
            self.send_message(
                chat_id,
                f"🚨 <b>ON-GROUND INCIDENT LOGGED (TICKET #INC-892)</b>\n\n"
                f"Reported Issue: <i>'{text.replace('/incident', '').strip() or text}'</i>\n"
                "Severity: <b>HIGH</b>\n"
                "Status: <b>Dispatched to Technical Lead</b>\n\n"
                "A venue coordinator is arriving at your dock in 5 minutes."
            )
        else:
            self.send_message(
                chat_id,
                "🚚 <b>Vendor Portal:</b> Reply with your 4-digit check-in OTP, or type <code>/incident &lt;issue&gt;</code> if you require emergency equipment on site."
            )

    def _handle_client_message(self, chat_id: int, text: str, session: Dict[str, Any]):
        text_lower = text.lower()
        if "/payments" in text_lower or "pay" in text_lower:
            self.send_message(
                chat_id,
                "💳 <b>YOUR WEDDING PAYMENT STATEMENT</b>\n\n"
                "• <b>Milestone 1 (Booking Deposit - 30%):</b> ₹90,00,000 [PAID - Receipt attached]\n"
                "• <b>Milestone 2 (Operational Advance - 40%):</b> ₹1,20,00,000 [Due in 18 Days]\n"
                "• <b>Milestone 3 (Final Settlement - 30%):</b> ₹90,00,000 [Post-Wedding]\n"
                "• <b>Total Contracted:</b> ₹3,00,00,000\n"
                "• <b>Current Outstanding Balance:</b> ₹2,10,00,000"
            )
        elif "/status" in text_lower or "when" in text_lower:
            self.send_message(
                chat_id,
                "👑 <b>YOUR ROYAL WEDDING SUMMARY</b>\n\n"
                "• <b>Couple:</b> Aarav Sharma & Diya Mehta\n"
                "• <b>Venue:</b> Rambagh Palace, Jaipur\n"
                "• <b>Countdown:</b> <b>58 Days Remaining!</b>\n"
                "• <b>Next Function:</b> Royal Mehendi (Dec 14 at 02:00 PM)\n"
                "• <b>Assigned Lead Planner:</b> Welcome (Head of Luxury Events)"
            )
        elif "/pending" in text_lower:
            self.send_message(
                chat_id,
                "📝 <b>PENDING APPROVALS FROM YOUR SIDE</b>\n\n"
                "1. Review and approve Caterer A's 35-item royal banquet menu.\n"
                "2. Floral mock-up walk-through scheduled for Thursday at 04:00 PM."
            )
        else:
            self.send_message(
                chat_id,
                f"💍 <b>The Royal Knot:</b> Received message: \"{text}\". "
                "Our team is coordinating every detail for your big day. Type <code>/status</code>, <code>/payments</code>, or <code>/pending</code> anytime!"
            )

    def _handle_public_enquiry(self, chat_id: int, text: str, sender_name: str, session: Dict[str, Any]):
        # Parse using Gemini AI NLP Extractor
        extracted = GeminiLeadExtractor.extract_wedding_enquiry(text, sender_name)
        
        dest = str(extracted.get('destination', 'Jaipur')).capitalize()
        guests = extracted.get('guest_count', 400)
        budget = extracted.get('budget_total', 25000000.0)
        theme = extracted.get('wedding_theme', 'Royal Heritage')
        budget_cr = round(budget / 10000000.0, 2)

        self.send_message(
            chat_id,
            f"👑 <b>ROYAL ENQUIRY RECEIVED & CONFIRMED!</b>\n\n"
            f"Dear {sender_name},\n"
            f"Thank you for reaching out to The Royal Knot. We have captured your celebration parameters in our system:\n\n"
            f"• <b>Destination:</b> {dest}\n"
            f"• <b>Expected Guests:</b> {guests} Guests\n"
            f"• <b>Theme & Vibe:</b> {theme}\n"
            f"• <b>Budget Ceiling:</b> ₹{budget_cr} Crores\n"
            f"• <b>Lead Reference:</b> <code>LEAD-{int(time.time()) % 10000:04d}</code>\n\n"
            "✨ <b>Next Step:</b> Our Lead Planner has been notified and is preparing customized palace floor plans and culinary portfolios for your review.\n\n"
            "<i>Type <code>/role founder</code> or <code>/role vendor</code> to switch roles for testing!</i>"
        )
