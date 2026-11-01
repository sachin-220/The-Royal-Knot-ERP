import sys
import os
import requests
sys.path.insert(0, os.path.abspath('custom_wedding_crm/bot_service'))
from bot_engine import KnotCoreBotEngine

# 1. Test HTML sanitization
engine = KnotCoreBotEngine(token='TEST_MOCK_TOKEN', role_mode='customer')

test_inputs = [
    'Line 1<br><br>Line 2',
    '<b>Test</b><ul><li>Alpha</li><li>Beta</li></ul>',
    'Rohit & Simran & Partner',
    '<p>Paragraph 1</p><p>Paragraph 2</p>',
    '<h3>Heading 3</h3>Content',
]
for inp in test_inputs:
    cleaned = engine._sanitize_telegram_html(inp)
    assert '<br' not in cleaned, f'Failed br check: {cleaned}'
    assert '<ul' not in cleaned, f'Failed ul check: {cleaned}'
    assert '<li' not in cleaned, f'Failed li check: {cleaned}'
    assert '<p' not in cleaned, f'Failed p check: {cleaned}'
    assert ('& ' not in cleaned) or ('&amp;' in cleaned), f'Failed & check: {cleaned}'

print('[PASS] Telegram HTML sanitization test verified across all cases!')

# 2. Test Step 2 single digit '3' does not trigger theme selection
engine.sessions[999999] = {
    'role': 'public',
    'interview_step': 2,
    'enquiry_data': {'couple_names': 'Aarav & Diya', 'destination': 'Jaipur'},
    'signed': False,
    'is_new_intake': True
}
sent_messages = []
engine.send_message = lambda cid, txt, **kwargs: sent_messages.append(txt)

engine.handle_incoming_message({'chat': {'id': 999999}, 'from': {'first_name': 'Tester'}, 'text': '3'})
session = engine.sessions[999999]
assert session.get('state') != 'awaiting_theme_selection', 'Error: Hijacked by theme selection!'
print(f"[PASS] Step 2 single digit 3 was not hijacked! Progressed to step: {session.get('interview_step')}")

# 3. Test API /api/inquiries
res = requests.get('http://127.0.0.1:5000/api/inquiries')
assert res.status_code == 200, f'API failed: {res.status_code}'
data = res.json()
print(f"[PASS] GET /api/inquiries returned {len(data)} inquiries. Latest: {data[0].get('inquiry_ref')} - {data[0].get('name')}")
