# -*- coding: utf-8 -*-
from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError
from odoo.addons.custom_wedding_budget.models.vendor_evaluator import WeddingVendorEvaluator

class TestWeddingBudget(TransactionCase):

    def setUp(self):
        super(TestWeddingBudget, self).setUp()
        self.partner_client = self.env['res.partner'].create({
            'name': 'Aarav & Diya Test Couple',
            'email': 'aarav.diya.test@example.com',
            'phone': '+91 98290 12345',
        })
        self.partner_caterer_a = self.env['res.partner'].create({
            'name': 'Royal Rajasthani Caterers Pvt Ltd',
            'is_company': True,
        })
        self.partner_caterer_b = self.env['res.partner'].create({
            'name': 'Mewar Palace Banqueting Ltd',
            'is_company': True,
        })
        self.location_rambagh = self.env['custom.wedding.location'].create({
            'name': 'Rambagh Palace Test',
            'destination': 'jaipur',
            'capacity': 600,
        })
        self.package_full = self.env['custom.wedding.package'].create({
            'name': 'Royal Heritage Full Journey',
            'code': 'FULL_SERVICE',
            'package_type': 'full_service',
            'base_management_fee': 500000.0,
        })
        self.wedding = self.env['custom.wedding'].create({
            'client_id': self.partner_client.id,
            'location_id': self.location_rambagh.id,
            'package_id': self.package_full.id,
            'expected_guests': 400,
            'total_budget': 30000000.0, # 3 Crores
        })

    def test_18_category_benchmark_sum(self):
        """Verifies that the standard 18 luxury categories sum to 100.0%."""
        categories = self.env['knotcore.budget.category'].search([('active', '=', True)])
        self.assertGreaterEqual(len(categories), 18, "Should have at least 18 benchmark categories!")
        total_pct = sum(c.default_percentage for c in categories)
        self.assertAlmostEqual(total_pct, 100.0, places=2, msg="All 18 categories must sum strictly to 100.0%!")

    def test_wedding_budget_allocation_auto_generation(self):
        """Tests auto-populating 18 budget categories on a wedding."""
        self.wedding.action_generate_default_allocations()
        self.assertEqual(len(self.wedding.budget_allocation_ids), 18, "Wedding should have 18 allocation lines!")
        self.assertAlmostEqual(self.wedding.allocation_sum_percentage, 100.0, places=2)
        self.assertAlmostEqual(self.wedding.total_allocated_budget, 30000000.0, places=2)

    def test_vendor_evaluator_wci_scoring(self):
        """Tests Weighted Composite Index (WCI) multi-factor formula."""
        # High-performing caterer: fair price, 4.8 quality, 98% punctuality, 0 complaints, available
        wci_high = WeddingVendorEvaluator.calculate_wci(
            quoted_amount=7000000.0,
            allocated_budget=7200000.0, # 24% of 3 Cr
            quality_rating=4.8,
            punctuality_pct=98.0,
            past_complaints=0,
            availability_verified=True
        )
        self.assertGreater(wci_high, 80.0, "Top vendor WCI should exceed 80 points!")

        # Poor vendor: over-budget, 2.5 quality, 60% punctuality, 3 complaints, not available
        wci_low = WeddingVendorEvaluator.calculate_wci(
            quoted_amount=9500000.0,
            allocated_budget=7200000.0,
            quality_rating=2.5,
            punctuality_pct=60.0,
            past_complaints=3,
            availability_verified=False
        )
        self.assertLess(wci_low, 45.0, "Poor vendor WCI should be below 45 points!")

    def test_price_anomaly_detection_2sigma(self):
        """Tests +2σ price anomaly detection."""
        # Mean for catering is 4200, std is 650. Price of 6000 is (6000-4200)/650 = +2.77 sigma
        is_anomaly, sigma, reason = WeddingVendorEvaluator.detect_price_anomaly(
            category_code='CATERING',
            price_per_plate=6000.0
        )
        self.assertTrue(is_anomaly, "Quote above +2σ must trigger price anomaly flag!")
        self.assertGreaterEqual(sigma, 2.0)

        # Normal quote of 4500 is (4500-4200)/650 = +0.46 sigma
        is_normal, sigma_norm, _ = WeddingVendorEvaluator.detect_price_anomaly(
            category_code='CATERING',
            price_per_plate=4500.0
        )
        self.assertFalse(is_normal, "Quote within 2σ should not trigger anomaly!")

    def test_1_click_winner_po_generation(self):
        """Tests 1-click winner selection, PO generation, and auto-declining competing quotes."""
        self.wedding.action_generate_default_allocations()
        cat_catering = self.env['knotcore.budget.category'].search([('code', '=', 'CATERING')], limit=1)

        quote_a = self.env['custom.wedding.vendor.quote'].create({
            'wedding_id': self.wedding.id,
            'vendor_id': self.partner_caterer_a.id,
            'category_id': cat_catering.id,
            'quoted_amount': 7000000.0,
            'price_per_plate': 4200.0,
            'rating_quality': 4.9,
            'rating_punctuality': 99.0,
            'availability_verified': True,
        })

        quote_b = self.env['custom.wedding.vendor.quote'].create({
            'wedding_id': self.wedding.id,
            'vendor_id': self.partner_caterer_b.id,
            'category_id': cat_catering.id,
            'quoted_amount': 7500000.0,
            'price_per_plate': 4500.0,
            'rating_quality': 4.2,
            'rating_punctuality': 90.0,
            'availability_verified': True,
        })

        # Select Quote A as winner
        quote_a.action_select_winner()

        self.assertEqual(quote_a.state, 'winner', "Quote A should be marked as winner!")
        self.assertTrue(quote_a.purchase_order_id, "Purchase order must be automatically generated!")
        self.assertEqual(quote_a.purchase_order_id.partner_id.id, self.partner_caterer_a.id)
        self.assertEqual(quote_a.purchase_order_id.amount_total, 7000000.0)

        # Verify Quote B was automatically declined
        quote_b.refresh()
        self.assertEqual(quote_b.state, 'declined', "Competing Quote B should be automatically declined!")

        # Verify Wedding Committed amount updated
        self.wedding.refresh()
        self.assertEqual(self.wedding.total_committed_quotes, 7000000.0)
