# -*- coding: utf-8 -*-
from datetime import timedelta
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError
from odoo import fields

class TestWeddingFinance(TransactionCase):

    def setUp(self):
        super(TestWeddingFinance, self).setUp()
        self.partner_client = self.env['res.partner'].create({
            'name': 'Aarav & Diya Royal Couple',
            'email': 'aarav.diya.finance@example.com',
        })
        self.partner_caterer = self.env['res.partner'].create({
            'name': 'Royal Rajasthani Caterers Pvt Ltd',
            'is_company': True,
        })
        self.location_rambagh = self.env['custom.wedding.location'].create({
            'name': 'Rambagh Palace Jaipur',
            'destination': 'jaipur',
            'capacity': 600,
        })
        self.wedding = self.env['custom.wedding'].create({
            'client_id': self.partner_client.id,
            'location_id': self.location_rambagh.id,
            'expected_guests': 400,
            'total_budget': 30000000.0, # 3 Crores
            'wedding_date': fields.Date.today() + timedelta(days=60),
        })

    def test_3_stage_milestone_generation(self):
        """Tests that auto-generating client milestones creates 30% - 40% - 30% breakdown."""
        self.wedding.action_generate_milestones()
        self.assertEqual(len(self.wedding.milestone_ids), 3, "Should create exactly 3 milestone stages!")

        m1 = self.wedding.milestone_ids.filtered(lambda m: m.milestone_type == 'm1_booking')
        m2 = self.wedding.milestone_ids.filtered(lambda m: m.milestone_type == 'm2_advance')
        m3 = self.wedding.milestone_ids.filtered(lambda m: m.milestone_type == 'm3_settlement')

        # 30% of 3 Cr = 90 Lakhs, 40% = 1.20 Cr, 30% = 90 Lakhs
        self.assertEqual(m1.amount, 9000000.0)
        self.assertEqual(m2.amount, 12000000.0)
        self.assertEqual(m3.amount, 9000000.0)

        # Invoice generation
        m1.action_create_invoice()
        self.assertEqual(m1.state, 'invoiced')
        self.assertTrue(m1.invoice_id)

        # Mark paid
        m1.action_mark_paid()
        self.assertEqual(m1.state, 'paid')
        self.wedding.refresh()
        self.assertEqual(self.wedding.total_milestones_paid, 9000000.0)

    def test_anti_duplicate_dynamic_guest_pass(self):
        """Tests dynamic 60-second rolling token generation and duplicate block."""
        guest_pass = self.env['knotcore.guest.pass'].create({
            'wedding_id': self.wedding.id,
            'guest_name': 'Raja Digvijay Singh',
            'table_number': 'Royal Table 1',
            'guest_category': 'vvip',
        })

        dynamic_code = guest_pass.dynamic_window_code
        self.assertTrue(dynamic_code.startswith(f"PASS_{guest_pass.id}_"))

        # Scan pass with valid code
        guest_pass.action_verify_guest_scan(dynamic_code)
        self.assertTrue(guest_pass.is_checked_in)
        self.assertTrue(guest_pass.checkin_time)

        # Attempt to scan the pass a second time -> DUPLICATE BLOCK!
        with self.assertRaises(UserError):
            guest_pass.action_verify_guest_scan(dynamic_code)

    def test_host_pin_walkin_extra_guest_admission(self):
        """Tests host PIN admission of walk-in guests and variation ledger addition."""
        # 1. Invalid Host PIN fails
        with self.assertRaises(UserError):
            self.env['knotcore.guest.pass'].register_walkin_extra_guest(
                wedding_id=self.wedding.id,
                guest_name='Mr. Unexpected Walk-In',
                host_pin='0000'
            )

        # 2. Valid Host PIN '2026' admits walk-in and appends plate variation
        walkin_pass = self.env['knotcore.guest.pass'].register_walkin_extra_guest(
            wedding_id=self.wedding.id,
            guest_name='Mr. Unexpected Walk-In',
            host_pin='2026',
            plate_price=4200.0
        )
        self.assertEqual(walkin_pass.guest_category, 'walkin')
        self.assertTrue(walkin_pass.is_checked_in)

        # Verify variation ledger recorded extra banquet plate
        self.wedding.refresh()
        plate_var = self.wedding.variation_ids.filtered(lambda v: 'Mr. Unexpected Walk-In' in v.title)
        self.assertTrue(plate_var, "Extra banquet plate must be appended to Live Variation Ledger!")
        self.assertEqual(plate_var.variation_amount_vendor, 4200.0)
        self.assertAlmostEqual(plate_var.variation_amount_client, 4830.0, places=2) # 15% markup

    def test_live_variation_ledger_margin(self):
        """Tests Live Variation Ledger margin calculation and approvals."""
        cat_lighting = self.env['knotcore.budget.category'].search([('code', '=', 'LIGHTING')], limit=1)
        var = self.env['knotcore.wedding.variation'].create({
            'wedding_id': self.wedding.id,
            'category_id': cat_lighting.id if cat_lighting else False,
            'title': 'Midnight Lawn Curfew Lighting Extension',
            'description': '2 extra hours of floodlights and intelligent moving heads.',
            'variation_amount_client': 120000.0,
            'variation_amount_vendor': 90000.0,
        })

        self.assertEqual(var.agency_markup_margin, 30000.0, "Gross margin should be 120k - 90k = 30k!")
        var.action_approve_variation()
        self.assertEqual(var.state, 'approved')

    def test_three_way_matching_and_settlement_formula(self):
        """Tests 3-Way Matching formula: Final Settlement = Contract + Extras - Advance Paid."""
        cat_catering = self.env['knotcore.budget.category'].search([('code', '=', 'CATERING')], limit=1)
        
        # Approved Quote / PO = 70 Lakhs
        po = self.env['purchase.order'].create({
            'partner_id': self.partner_caterer.id,
            'wedding_id': self.wedding.id,
            'order_line': [(0, 0, {
                'name': 'Catering Contract',
                'product_qty': 1.0,
                'price_unit': 7000000.0,
            })]
        })

        # Extra variation approved = 25 Extra Plates (₹1,05,000)
        self.env['knotcore.wedding.variation'].create({
            'wedding_id': self.wedding.id,
            'category_id': cat_catering.id if cat_catering else False,
            'vendor_id': self.partner_caterer.id,
            'title': '25 Extra Banqueting Plates',
            'description': 'Approved extra plates',
            'variation_amount_client': 120000.0,
            'variation_amount_vendor': 105000.0,
            'state': 'approved',
        })

        settlement = self.env['knotcore.vendor.settlement'].create({
            'wedding_id': self.wedding.id,
            'vendor_id': self.partner_caterer.id,
            'category_id': cat_catering.id if cat_catering else False,
            'purchase_order_id': po.id,
            'advance_paid_amount': 2500000.0, # 25 Lakhs advance paid
            'submitted_bill_amount': 7105000.0,
        })

        # Contract (70L) + Extras (1.05L) - Advance (25L) = 46,05,000 Final Settlement Payable
        self.assertEqual(settlement.contract_amount, 7000000.0)
        self.assertEqual(settlement.approved_extras_amount, 105000.0)
        self.assertEqual(settlement.final_settlement_payable, 4605000.0)
        self.assertEqual(settlement.matching_status, 'matched')

        # Approve and disburse
        settlement.action_approve_settlement()
        self.assertEqual(settlement.state, 'approved')
        settlement.action_disburse_payment()
        self.assertEqual(settlement.state, 'disbursed')
