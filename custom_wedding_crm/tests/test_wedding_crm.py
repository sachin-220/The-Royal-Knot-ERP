# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from odoo.tests.common import TransactionCase
from ..bot_service.nlp_extractor import GeminiLeadExtractor

class TestWeddingCrm(TransactionCase):
    """
    Automated Unit Test Suite for KnotCore CRM, Bot Ingestion,
    Lead Recovery Intelligence, and Digital Agreements.
    """

    def setUp(self):
        super().setUp()
        self.Lead = self.env['crm.lead']
        self.Wedding = self.env['custom.wedding']
        self.Agreement = self.env['wedding.agreement']
        self.QrToken = self.env['wedding.qr.token']
        self.Package = self.env['custom.wedding.package']

        self.pkg_full = self.Package.search([('code', '=', 'FULL_ROYAL')], limit=1)
        if not self.pkg_full:
            self.pkg_full = self.Package.create({
                'name': 'Full-Service Royal Wedding',
                'code': 'FULL_ROYAL',
                'description': 'Full Planning',
                'package_type': 'full_service',
            })

    def test_01_lead_nlp_extraction(self):
        """Verify Gemini NLP / heuristic parser extracts destination, guests, and budget."""
        raw_msg = "Hello, we want to plan a royal heritage wedding in Udaipur in December with 400 guests and budget around 3 crores."
        extracted = GeminiLeadExtractor.extract_wedding_enquiry(raw_msg, "Kabir & Ananya")
        
        self.assertEqual(extracted['destination'], 'udaipur', "Destination must be extracted as udaipur.")
        self.assertEqual(extracted['guest_count'], 400, "Guest count must be 400.")
        self.assertEqual(extracted['budget_total'], 30000000.0, "3 Crores must be 30,000,000 INR.")

    def test_02_lead_conversion_score(self):
        """Verify ML conversion probability reflects healthy budget per guest."""
        lead = self.Lead.create({
            'name': 'Kabir & Ananya Enquiry',
            'partner_name': 'Kabir Singhania',
            'destination': 'udaipur',
            'guest_count': 400,
            'budget_total': 30000000.0, # ₹75,000 per guest
        })
        self.assertGreaterEqual(lead.conversion_probability_score, 75.0, "High budget per guest must yield high conversion probability.")

    def test_03_lead_recovery_flag_48h(self):
        """Verify 48-hour inactivity triggers the Lead Recovery flag."""
        two_days_ago = fields.Datetime.now() - timedelta(hours=49)
        lead = self.Lead.create({
            'name': 'Stale Enquiry',
            'last_interaction_datetime': two_days_ago,
        })
        self.assertTrue(lead.lead_recovery_flag, "Lead untouched for 49 hours must have lead_recovery_flag=True.")
        self.assertTrue(lead.suggested_followup_message, "A follow-up draft must be auto-generated.")

    def test_04_convert_to_wedding_and_agreement(self):
        """Verify 1-click conversion creates wedding record, partner, and draft agreement."""
        lead = self.Lead.create({
            'name': 'Rohan & Priya Wedding Enquiry',
            'partner_name': 'Rohan & Priya',
            'destination': 'jaipur',
            'guest_count': 400,
            'budget_total': 25000000.0,
            'package_id': self.pkg_full.id,
        })

        action = lead.action_convert_to_wedding()
        wedding_id = action['res_id']
        wedding = self.Wedding.browse(wedding_id)

        self.assertTrue(wedding.exists(), "Master wedding record must exist.")
        self.assertEqual(wedding.guest_count, 400)
        self.assertEqual(wedding.state, 'consultation', "New converted wedding must be in consultation.")

        agreement = self.Agreement.search([('wedding_id', '=', wedding.id)], limit=1)
        self.assertTrue(agreement.exists(), "Draft agreement must be automatically generated.")
        self.assertEqual(agreement.state, 'draft')

    def test_05_digital_agreement_signing(self):
        """Verify mobile touch signature locks agreement and confirms wedding."""
        lead = self.Lead.create({
            'name': 'Vikram & Sneha Enquiry',
            'partner_name': 'Vikram Mehra',
            'destination': 'jaipur',
            'guest_count': 400,
            'budget_total': 30000000.0,
        })
        lead.action_convert_to_wedding()
        agreement = self.Agreement.search([('wedding_id', '=', lead.wedding_id.id)], limit=1)
        
        agreement.action_send_for_signature()
        self.assertEqual(agreement.state, 'sent')

        agreement.action_sign_agreement(signer_ip='192.168.1.55')
        self.assertEqual(agreement.state, 'signed')
        self.assertEqual(lead.wedding_id.state, 'confirmed', "Signed agreement must advance wedding to Confirmed.")

    def test_06_qr_token_generation_and_verification(self):
        """Verify QR tokens generate deep-links and verify role context."""
        founder_pass = self.QrToken.create({
            'name': 'Executive Founder Access Pass',
            'role': 'founder',
        })
        self.assertTrue(founder_pass.deep_link_url.startswith('https://t.me/Royalknot_bot?start=AUTH_'))
        self.assertTrue(founder_pass.qr_image, "QR image base64 must be populated.")

        verified = self.QrToken.verify_token(f"AUTH_{founder_pass.token}")
        self.assertIsNotNone(verified)
        self.assertEqual(verified['role'], 'founder')
        self.assertEqual(founder_pass.usage_count, 1)
