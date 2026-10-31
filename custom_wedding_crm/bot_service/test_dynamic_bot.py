import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add bot_service to path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))
sys.stdout.reconfigure(encoding='utf-8')

from bot_engine import KnotCoreBotEngine

def run_simulation():
    bot = KnotCoreBotEngine(token="TEST_MOCK_TOKEN")
    
    # Intercept send_message to capture outputs
    sent_messages = []
    def mock_send(chat_id, text, parse_mode="HTML", reply_markup=None):
        sent_messages.append({"chat_id": chat_id, "text": text})
        return {"ok": True}
    bot.send_message = mock_send

    print("--- TEST 1: Public user says 'we want a 3 days wedding in jaipur' ---")
    bot.handle_incoming_message({
        "chat": {"id": 101},
        "from": {"first_name": "Rohan"},
        "text": "we want a 3 days wedding in jaipur"
    })
    msg1 = sent_messages[-1]["text"]
    print("BOT RESPONSE 1:\n", msg1)
    assert "Jaipur" in msg1, "Destination Jaipur should be captured"
    assert "3 Days" in msg1, "3 Days should be captured"
    assert "400" not in msg1, "Should NOT assume 400 guests!"
    assert "2.5" not in msg1, "Should NOT assume 2.5 Crores!"
    assert "Guest Count:" in msg1 or "guests" in msg1.lower(), "Should ask for guest count!"
    assert "Budget" in msg1, "Should ask for budget!"
    print(">>> PASS: Correctly asked for missing details without fake defaults!\n")

    print("--- TEST 2: Public user provides missing details 'around 250 guests and our budget is 1.8 cr' ---")
    bot.handle_incoming_message({
        "chat": {"id": 101},
        "from": {"first_name": "Rohan"},
        "text": "around 250 guests and our budget is 1.8 cr"
    })
    msg2 = sent_messages[-1]["text"]
    print("BOT RESPONSE 2:\n", msg2)
    assert "250 Guests" in msg2, "250 guests must be captured!"
    assert "1.80 Crores" in msg2 or "1.8" in msg2, "1.8 Crores budget must be captured!"
    assert "LEAD-" in msg2, "Lead must be created"
    print(">>> PASS: Correctly captured exact dynamic numbers and confirmed enquiry!\n")

    print("--- TEST 3: Switch to Founder and test /profit and natural language ---")
    bot.handle_incoming_message({
        "chat": {"id": 102},
        "from": {"first_name": "Boss"},
        "text": "/role founder"
    })
    bot.handle_incoming_message({
        "chat": {"id": 102},
        "from": {"first_name": "Boss"},
        "text": "/profit"
    })
    msg3 = sent_messages[-1]["text"]
    assert "78,50,00,000" in msg3, "Revenue must be in founder profit"
    print(">>> PASS: Founder /profit returned live metrics!\n")

    print("--- TEST 4: Switch to Planner and test RBAC Firewall on profit ---")
    bot.handle_incoming_message({
        "chat": {"id": 103},
        "from": {"first_name": "Pooja"},
        "text": "/role planner"
    })
    bot.handle_incoming_message({
        "chat": {"id": 103},
        "from": {"first_name": "Pooja"},
        "text": "/profit"
    })
    msg4 = sent_messages[-1]["text"]
    assert "ACCESS DENIED" in msg4, "Planner must be denied access to profit"
    print("BOT RESPONSE 4:\n", msg4)
    print(">>> PASS: RBAC Firewall blocked Planner from Founder profit data!\n")

    print("--- TEST 5: Switch to Vendor, test OTP Check-in and Firewall ---")
    bot.handle_incoming_message({
        "chat": {"id": 104},
        "from": {"first_name": "Vikram"},
        "text": "/role vendor"
    })
    # Enter correct OTP
    bot.handle_incoming_message({
        "chat": {"id": 104},
        "from": {"first_name": "Vikram"},
        "text": "4821"
    })
    msg5 = sent_messages[-1]["text"]
    assert "CHECK-IN VERIFIED" in msg5, "Vendor check-in should succeed"
    print("BOT RESPONSE 5:\n", msg5)

    # Vendor tries to view client budget
    bot.handle_incoming_message({
        "chat": {"id": 104},
        "from": {"first_name": "Vikram"},
        "text": "/payments"
    })
    msg6 = sent_messages[-1]["text"]
    assert "ACCESS DENIED" in msg6, "Vendor must be blocked from payments"
    print("BOT RESPONSE 6:\n", msg6)
    print(">>> PASS: Vendor OTP check-in passed and firewall protected payments!\n")

    print("--- TEST 6: Switch to Client, test /payments and /status ---")
    bot.handle_incoming_message({
        "chat": {"id": 105},
        "from": {"first_name": "Diya"},
        "text": "/role client"
    })
    bot.handle_incoming_message({
        "chat": {"id": 105},
        "from": {"first_name": "Diya"},
        "text": "/payments"
    })
    msg7 = sent_messages[-1]["text"]
    assert "Milestone 1" in msg7 and "90,00,000" in msg7, "Milestone payment statement must be shown"
    print("BOT RESPONSE 7:\n", msg7)
    print(">>> PASS: Client received milestone billing statement!\n")

    print("==================================================")
    print("   ALL 6 MULTI-ROLE DYNAMIC TESTS PASSED 100%!    ")
    print("==================================================")

if __name__ == "__main__":
    run_simulation()
