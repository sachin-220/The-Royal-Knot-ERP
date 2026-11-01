# -*- coding: utf-8 -*-
"""
Dual-Bot Runner for KnotCore Luxury Wedding ERP
================================================
Concurrently runs:
1. Customer Concierge & VIP Portal Bot (@Royalknot_bot)
2. Dedicated Vendor Procurement & Coordination Bot (@Royalknot_vendors_bot)
"""
import os
import sys
import threading
import time
from pathlib import Path
from dotenv import load_dotenv

# Load workspace .env
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Ensure parent directory is in python path
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
workspace_dir = parent_dir.parent
sys.path.extend([str(workspace_dir), str(parent_dir), str(current_dir)])

from bot_engine import KnotCoreBotEngine

def run_customer_bot(token):
    print("[CustomerBotThread] Launching @Royalknot_bot daemon...", flush=True)
    engine = KnotCoreBotEngine(token=token, role_mode="customer")
    engine.start_polling()

def run_vendor_bot(token):
    print("[VendorBotThread] Launching @Royalknot_vendors_bot daemon...", flush=True)
    engine = KnotCoreBotEngine(token=token, role_mode="vendor")
    engine.start_polling()

def main():
    customer_token = os.getenv("TELEGRAM_BOT_TOKEN")
    vendor_token = os.getenv("VENDOR_BOT_TOKEN")

    if not customer_token:
        print("[ERROR] TELEGRAM_BOT_TOKEN not found in .env file!", flush=True)
        sys.exit(1)

    sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 70, flush=True)
    print("   THE ROYAL KNOT - DUAL-BOT HIGH CONCURRENCY DAEMON SYSTEM        ", flush=True)
    print("=" * 70, flush=True)
    print(f"Customer Bot: @Royalknot_bot ({customer_token[:10]}...)", flush=True)
    if vendor_token:
        print(f"Vendor Bot:   @Royalknot_vendors_bot ({vendor_token[:10]}...)", flush=True)
    print("Role Isolation: Client VIP / Public Intake vs Vendor Procurement", flush=True)
    print("=" * 70, flush=True)

    threads = []
    # 1. Customer Bot Thread
    t_customer = threading.Thread(target=run_customer_bot, args=(customer_token,), name="CustomerBotThread", daemon=True)
    t_customer.start()
    threads.append(t_customer)

    # 2. Vendor Bot Thread
    if vendor_token:
        t_vendor = threading.Thread(target=run_vendor_bot, args=(vendor_token,), name="VendorBotThread", daemon=True)
        t_vendor.start()
        threads.append(t_vendor)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[DualBotRunner] Gracefully shutting down both bots...", flush=True)

if __name__ == "__main__":
    main()
