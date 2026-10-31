# -*- coding: utf-8 -*-
from datetime import date, timedelta
from odoo.tests.common import TransactionCase
from odoo.exceptions import ValidationError, UserError

class TestWeddingCore(TransactionCase):
    """
    Automated Unit Test Suite for KnotCore Central Wedding Master Architecture.
    Validates data integrity, server-side constraints, and ML intelligence algorithms.
    """

    def setUp(self):
        super().setUp()
        self.Partner = self.env['res.partner']
        self.Wedding = self.env['custom.wedding']
        self.Package = self.env['custom.wedding.package']
        self.Location = self.env['custom.wedding.location']

        # Setup base client
        self.client_couple = self.Partner.create({
            'name': 'Aarav Sharma & Diya Mehta',
            'phone': '+91 98290 12345',
            'email': 'aarav.diya@example.com',
        })

        # Fetch or create packages
        self.package_full = self.Package.search([('code', '=', 'FULL_ROYAL')], limit=1)
        if not self.package_full:
            self.package_full = self.Package.create({
                'name': 'Full-Service Royal Wedding',
                'code': 'FULL_ROYAL',
                'description': 'Full Planning',
                'package_type': 'full_service',
                'base_task_count': 25,
            })

        # Fetch or create venue
        self.venue_rambagh = self.Location.search([('name', '=', 'Rambagh Palace')], limit=1)
        if not self.venue_rambagh:
            self.venue_rambagh = self.Location.create({
                'name': 'Rambagh Palace',
                'destination': 'jaipur',
                'venue_type': 'palace',
                'max_guest_capacity': 650,
            })

    def test_01_wedding_creation_and_sequence(self):
        """Verify custom.wedding creation, default values, and sequence assignment."""
        today = date.today()
        wedding = self.Wedding.create({
            'partner_id': self.client_couple.id,
            'package_id': self.package_full.id,
            'destination': 'jaipur',
            'location_id': self.venue_rambagh.id,
            'wedding_date_start': today + timedelta(days=60),
            'wedding_date_end': today + timedelta(days=62),
            'guest_count': 400,
            'budget_total': 30000000.0, # 3 Crores
            'theme': 'Royal Heritage Rajputana',
        })

        self.assertTrue(wedding.name.startswith('TRK/'), "Wedding reference must follow TRK/ sequence prefix.")
        self.assertEqual(wedding.duration_days, 3, "Duration for 3-day wedding must equal 3.")
        self.assertEqual(wedding.state, 'enquiry', "Initial state must be 'enquiry'.")

    def test_02_date_validation_constraint(self):
        """Assert ValidationError is raised if wedding_date_end precedes wedding_date_start."""
        today = date.today()
        with self.assertRaises(ValidationError):
            self.Wedding.create({
                'partner_id': self.client_couple.id,
                'package_id': self.package_full.id,
                'destination': 'jaipur',
                'wedding_date_start': today + timedelta(days=60),
                'wedding_date_end': today + timedelta(days=55), # Invalid end before start
                'guest_count': 400,
                'budget_total': 20000000.0,
            })

    def test_03_negative_budget_constraint(self):
        """Assert ValidationError is raised if budget_total is zero or negative."""
        today = date.today()
        with self.assertRaises(ValidationError):
            self.Wedding.create({
                'partner_id': self.client_couple.id,
                'package_id': self.package_full.id,
                'destination': 'jaipur',
                'wedding_date_start': today + timedelta(days=30),
                'wedding_date_end': today + timedelta(days=32),
                'guest_count': 400,
                'budget_total': -50000.0, # Invalid negative budget
            })

    def test_04_zero_guest_count_constraint(self):
        """Assert ValidationError is raised if guest_count is zero."""
        today = date.today()
        with self.assertRaises(ValidationError):
            self.Wedding.create({
                'partner_id': self.client_couple.id,
                'package_id': self.package_full.id,
                'destination': 'jaipur',
                'wedding_date_start': today + timedelta(days=30),
                'wedding_date_end': today + timedelta(days=32),
                'guest_count': 0, # Invalid 0 guests
                'budget_total': 15000000.0,
            })

    def test_05_ml_turnout_and_buffer_computation(self):
        """Verify ML regression accurately predicts guest surge and plate buffer."""
        today = date.today()
        wedding = self.Wedding.create({
            'partner_id': self.client_couple.id,
            'package_id': self.package_full.id,
            'destination': 'jaipur',
            'location_id': self.venue_rambagh.id,
            'wedding_date_start': today + timedelta(days=90),
            'wedding_date_end': today + timedelta(days=92),
            'guest_count': 400,
            'budget_total': 30000000.0,
        })

        # Base 400 guests in Jaipur Palace should predict turnout > 400 with a positive buffer
        self.assertGreater(wedding.predicted_guests, 400, "ML turnout prediction must account for unannounced guests.")
        self.assertGreater(wedding.recommended_plate_buffer, 0, "ML buffer must provide positive bulk plate recommendation.")
        self.assertEqual(wedding.margin_drift_risk, 'low', "Budget of 3 Cr for 400 guests has healthy margins.")

    def test_06_lifecycle_state_transitions(self):
        """Verify state transitions from enquiry to consultation to confirmed."""
        today = date.today()
        wedding = self.Wedding.create({
            'partner_id': self.client_couple.id,
            'package_id': self.package_full.id,
            'destination': 'udaipur',
            'wedding_date_start': today + timedelta(days=40),
            'wedding_date_end': today + timedelta(days=42),
            'guest_count': 400,
            'budget_total': 25000000.0,
        })

        wedding.action_set_consultation()
        self.assertEqual(wedding.state, 'consultation')

        wedding.action_confirm()
        self.assertEqual(wedding.state, 'confirmed')

        wedding.action_start_planning()
        self.assertEqual(wedding.state, 'planning')
