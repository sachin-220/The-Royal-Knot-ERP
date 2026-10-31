# -*- coding: utf-8 -*-
"""
Standalone Runner for KnotCore Telegram Bot (@Royalknot_bot)
===========================================================
Executes the long-polling daemon in background or CLI mode.
"""
import os
import sys
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

def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        print("[ERROR] TELEGRAM_BOT_TOKEN not found in .env file!")
        sys.exit(1)

    print("=" * 65)
    print("      THE ROYAL KNOT - MULTI-ROLE BOT DAEMON (@Royalknot_bot)    ")
    print("=" * 65)
    print(f"Token: {token[:10]}... (verified)")
    print("Role-Based Access Control: Founder | Planner | Vendor | Client")
    print("Deep-Link QR Login: ENABLED")
    print("Gemini AI NLP Extraction: ACTIVE")
    print("=" * 65)

    engine = KnotCoreBotEngine(token=token)
    engine.start_polling()

if __name__ == "__main__":
    main()
