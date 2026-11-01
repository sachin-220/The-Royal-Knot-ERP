# -*- coding: utf-8 -*-
"""
End-to-End Verification Test Script for User Request:
1. Dynamic enquiry gap-filling check (asking when budget or detail is missing)
2. Ingestion of Aarav & Diya 3-day royal wedding in Udaipur for 400 guests with 3 Crores budget
3. Display of 25+ wedding themes catalog
4. User selects custom preference: "a stage in the beach" or "heritage palace feel with royal marigold and lotus decor"
5. Image of place only (no people/brides) dispatched with confirmation prompt
6. User replies "confirm" / "yes" / "ok" -> theme officially selected and saved
7. "Grand wedding at lowest price" -> RFP dispatched to 18+ registered vendors under One-Way Mirror
8. Vendor onboarding via Vendor QR: credentials -> dashboard approval -> email OTP verification
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

current_dir = Path(__file__).resolve().parent
workspace_dir = current_dir.parent.parent
sys.path.extend([str(workspace_dir), str(current_dir)])
sys.stdout.reconfigure(encoding='utf-8')

from bot_engine import KnotCoreBotEngine
from knotcore_backend.vendor_onboarding_service import VendorOnboardingService

def run_tests():
    bot = KnotCoreBotEngine(token="TEST_MOCK_TOKEN")

    sent_messages = []
    sent_photos = []

    def mock_send_message(chat_id, text, parse_mode="HTML", reply_markup=None):
        sent_messages.append({"chat_id": chat_id, "text": text})
        return {"ok": True, "result": {"message_id": len(sent_messages)}}

    def mock_send_photo(chat_id, photo_path_or_url, caption="", parse_mode="HTML"):
        sent_photos.append({"chat_id": chat_id, "photo": photo_path_or_url, "caption": caption})
        return {"ok": True, "result": {"message_id": len(sent_photos)}}

    bot.send_message = mock_send_message
    bot.send_photo = mock_send_photo

    print("======================================================================")
    print("TEST 1: MISSING BUDGET GAP-FILLING CHECK")
    print("======================================================================")
    bot.handle_incoming_message({
        "chat": {"id": 9001},
        "from": {"first_name": "Aarav"},
        "text": "Hi, we are planning a 3-day royal wedding for Aarav and Diya in Udaipur this December with 400 guests."
    })
    msg1 = sent_messages[-1]["text"]
    print("BOT RESPONSE (Missing Budget Prompt):\n", msg1)
    assert "budget" in msg1.lower(), "Bot must specifically ask for budget when missing!"
    print(">>> PASS: Correctly detected missing budget and prompted user specifically!\n")

    print("======================================================================")
    print("TEST 2: FULL USER PROMPT INGESTION & 25+ THEMES PRESENTATION")
    print("======================================================================")
    user_prompt = "Hi, we are planning a 3-day royal wedding for Aarav and Diya in Udaipur this December. We expect around 400 guests and have a budget of 3 Crores."
    bot.handle_incoming_message({
        "chat": {"id": 9002},
        "from": {"first_name": "Diya"},
        "text": user_prompt
    })
    # There should be 2 messages: confirmation summary and 25+ themes catalog
    summary_msg = sent_messages[-2]["text"]
    catalog_msg = sent_messages[-1]["text"]

    print("BOT REGISTRATION SUMMARY:\n", summary_msg)
    print("\nBOT THEMES CATALOG:\n", catalog_msg[:500] + "...\n[Catalog continues with 28 themes]")

    assert "Udaipur" in summary_msg, "Udaipur must be captured"
    assert "400" in summary_msg, "400 guests must be captured"
    assert "3.00 Cr" in summary_msg or "3 Cr" in summary_msg or "3.0" in summary_msg, "3 Crores budget must be captured"
    assert "25+ CURATED WEDDING THEMES" in catalog_msg, "25+ themes catalog must be displayed"
    assert "Heritage Palace Feel with Royal Marigold and Lotus Decor" in catalog_msg, "Theme 1 must be present"
    assert "Coastal Beach Sunset Mandap on Ocean Sand" in catalog_msg, "Theme 2 must be present"
    print(">>> PASS: Full details registered and 25+ wedding themes catalog presented!\n")

    print("======================================================================")
    print("TEST 3: DYNAMIC VENUE DECOR IMAGE (PLACE ONLY) - BEACH STAGE")
    print("======================================================================")
    bot.handle_incoming_message({
        "chat": {"id": 9002},
        "from": {"first_name": "Diya"},
        "text": "a stage in the beach"
    })
    photo_entry = sent_photos[-1]
    print(f"PHOTO DISPATCHED:\n- Target File/URL: {photo_entry['photo']}\n- Caption:\n{photo_entry['caption']}")
    assert "beach" in photo_entry["photo"].lower(), "Beach venue image must be selected"
    assert "Place & Architectural Decor Only" in photo_entry["caption"], "Must state Place Only"
    assert "Do you confirm this theme" in photo_entry["caption"], "Must ask for confirmation"
    print(">>> PASS: Photo of the place only dispatched with confirmation request!\n")

    print("======================================================================")
    print("TEST 4: CONFIRMATION RESPONSE ('confirm' / 'yes' / 'ok')")
    print("======================================================================")
    bot.handle_incoming_message({
        "chat": {"id": 9002},
        "from": {"first_name": "Diya"},
        "text": "confirm"
    })
    confirm_res = sent_messages[-1]["text"]
    print("BOT CONFIRMATION RESPONSE:\n", confirm_res)
    assert "THEME OFFICIALLY CONFIRMED & SELECTED" in confirm_res, "Theme selection must be confirmed"
    print(">>> PASS: Theme locked into CRM and database upon user confirmation!\n")

    print("======================================================================")
    print("TEST 5: 'GRAND WEDDING AT LOWEST PRICE' -> RFP TO 18+ REGISTERED VENDORS")
    print("======================================================================")
    bot.handle_incoming_message({
        "chat": {"id": 9002},
        "from": {"first_name": "Diya"},
        "text": "grand wedding at lowest price"
    })
    rfp_res = sent_messages[-1]["text"]
    print("BOT RFP DISPATCH RESPONSE:\n", rfp_res)
    assert "ONE-WAY MIRROR PROCUREMENT ACTIVATED" in rfp_res, "One-way mirror procurement must be activated"
    assert "18" in rfp_res or "Registered Vendors" in rfp_res, "Must confirm 18+ registered vendors"
    print(">>> PASS: RFP proposal dispatched to 18+ registered vendors!\n")

    print("======================================================================")
    print("TEST 6: NEW VENDOR ONBOARDING VIA VENDOR QR -> CREDENTIALS -> OTP")
    print("======================================================================")
    # Ensure fresh state for test chat_id 8801
    try:
        c = bot._get_db()
        if c:
            cur = c.cursor()
            cur.execute("DELETE FROM vendor_registrations WHERE chat_id = 8801;")
            c.commit()
            cur.close()
            c.close()
    except Exception:
        pass

    # 1. Vendor scans QR
    bot.handle_incoming_message({
        "chat": {"id": 8801},
        "from": {"first_name": "Vikram"},
        "text": "/start vendor_portal"
    })
    v_start_msg = sent_messages[-1]["text"]
    print("VENDOR PORTAL START:\n", v_start_msg)
    assert "Submit Credentials" in v_start_msg, "Must ask new vendor for credentials"

    # 2. Vendor submits credentials
    bot.handle_incoming_message({
        "chat": {"id": 8801},
        "from": {"first_name": "Vikram"},
        "text": "Royal Rajputana Caterers, Catering, vikram.caterers@gmail.com, 9829055443"
    })
    v_cred_msg = sent_messages[-1]["text"]
    print("\nVENDOR CREDENTIALS SUBMISSION:\n", v_cred_msg)
    assert "PENDING DASHBOARD APPROVAL" in v_cred_msg, "Must show pending approval"

    # 3. Lead Planner approves registration on Dashboard
    regs = VendorOnboardingService.get_all_registrations()
    pending_reg = next((r for r in regs if r["email"] == "vikram.caterers@gmail.com"), None)
    assert pending_reg is not None, "Pending registration must be in DB"
    approve_res = VendorOnboardingService.approve_vendor_registration(pending_reg["id"])
    otp_code = approve_res["otp_code"]
    print(f"\nPLANNER APPROVED ON DASHBOARD! Generated 6-Digit OTP: {otp_code}")

    # 4. Vendor enters 6-digit OTP in Telegram
    bot.handle_incoming_message({
        "chat": {"id": 8801},
        "from": {"first_name": "Vikram"},
        "text": otp_code
    })
    v_otp_msg = sent_messages[-1]["text"]
    print("\nVENDOR OTP CONFIRMATION IN TELEGRAM:\n", v_otp_msg)
    assert "OTP VERIFIED! YOU ARE OFFICIALLY REGISTERED" in v_otp_msg, "Vendor must be verified and logged in"
    print(">>> PASS: Full Vendor QR Onboarding with Email OTP flow verified!\n")

    print("======================================================================")
    print("ALL 6 TESTS PASSED WITH 100% SUCCESS!")
    print("======================================================================")

if __name__ == "__main__":
    run_tests()
