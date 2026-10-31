# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError
from odoo import fields

class TestWeddingOperations(TransactionCase):

    def setUp(self):
        super(TestWeddingOperations, self).setUp()
        self.partner_client = self.env['res.partner'].create({
            'name': 'Aarav & Diya Royalty Test',
            'email': 'aarav.diya.ops@example.com',
        })
        self.partner_vendor = self.env['res.partner'].create({
            'name': 'Jaipur Sound & Light Crew Ltd',
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
            'total_budget': 32000000.0,
            'wedding_date': fields.Date.today() + timedelta(days=60),
        })

    def test_task_graph_construction(self):
        """Tests that auto-generating the operational task graph creates 26 structured tasks."""
        self.wedding.action_generate_operational_task_graph()
        self.assertEqual(len(self.wedding.task_ids), 26, "Should generate exactly 26 operational milestone tasks!")
        
        # Verify 4 distinct phases exist
        phases = set(t.task_phase for t in self.wedding.task_ids)
        self.assertEqual(phases, {'planning', 'vendor', 'production', 'wedding_day'})

    def test_predecessor_dependency_blocking(self):
        """Tests that a blocked task cannot start until predecessor is completed."""
        task_a = self.env['custom.wedding.task'].create({
            'name': 'Predecessor Mandap Engineering',
            'wedding_id': self.wedding.id,
            'task_phase': 'production',
            'state': 'todo',
        })
        task_b = self.env['custom.wedding.task'].create({
            'name': 'Dependent Floral Dressing',
            'wedding_id': self.wedding.id,
            'task_phase': 'production',
            'predecessor_task_id': task_a.id,
            'state': 'blocked',
        })

        # Attempt to start Task B before Task A finishes
        with self.assertRaises(UserError):
            task_b.action_start()

        # Complete Task A
        task_a.action_complete()
        task_b.refresh()
        self.assertEqual(task_b.state, 'todo', "Task B should be automatically unlocked when predecessor completes!")

    def test_ripple_effect_delay_simulation(self):
        """Tests the Ripple-Effect Delay Simulator calculations."""
        self.wedding.action_generate_default_run_sheet()
        sim = self.env['knotcore.delay.simulator'].create({
            'wedding_id': self.wedding.id,
            'delayed_event_name': 'Groom Royal Baraat Arrival',
            'delay_minutes': 45,
        })

        self.assertTrue(sim.curfew_violation_risk, "Delay >= 30 mins must trigger curfew violation risk!")
        self.assertGreater(sim.estimated_overtime_cost, 0, "Overtime surcharge must be calculated!")
        self.assertIn("RIPPLE-EFFECT DELAY ANALYSIS", sim.impact_summary)

        # Planner approval workflow
        sim.action_approve_simulation()
        self.assertEqual(sim.state, 'planner_approved')
        sim.action_publish_run_sheet()
        self.assertEqual(sim.state, 'published')

    def test_vendor_gate_otp_checkin(self):
        """Tests palace gate OTP security check-in."""
        pass_rec = self.env['knotcore.vendor.gate.checkin'].create({
            'wedding_id': self.wedding.id,
            'vendor_id': self.partner_vendor.id,
            'gate_otp': '7891',
            'scheduled_call_time': fields.Datetime.now(),
        })

        self.assertEqual(pass_rec.status, 'pending')

        # Invalid OTP must raise error
        with self.assertRaises(UserError):
            pass_rec.action_verify_otp('0000')

        # Valid OTP succeeds
        pass_rec.action_verify_otp('7891')
        self.assertEqual(pass_rec.status, 'arrived')
        self.assertTrue(pass_rec.actual_arrival_time)

    def test_emergency_incident_workflow(self):
        """Tests rapid-dispatch incident lifecycle."""
        inc = self.env['knotcore.wedding.incident'].create({
            'wedding_id': self.wedding.id,
            'title': 'Generator Tripped on Lawns',
            'description': 'Main 125kVA generator tripped. Need backup switch immediately.',
            'severity': 'critical',
            'category': 'power',
        })

        self.assertEqual(inc.state, 'reported')
        inc.action_dispatch()
        self.assertEqual(inc.state, 'dispatched')
        inc.action_resolve()
        self.assertEqual(inc.state, 'resolved')
