# -*- coding: utf-8 -*-
from datetime import timedelta
from odoo import models, fields, api, _

class CustomWeddingFinanceInherit(models.Model):
    """
    Extends custom.wedding with 3-Stage Client Milestone Billing,
    Anti-Duplicate Guest Passes, Live Variation Ledger, and Vendor Settlements.
    """
    _inherit = 'custom.wedding'

    milestone_ids = fields.One2many(
        'knotcore.client.milestone',
        'wedding_id',
        string='Milestone Billing Schedule'
    )
    guest_pass_ids = fields.One2many(
        'knotcore.guest.pass',
        'wedding_id',
        string='Guest Digital Passes'
    )
    variation_ids = fields.One2many(
        'knotcore.wedding.variation',
        'wedding_id',
        string='Live Variation Ledger'
    )
    settlement_ids = fields.One2many(
        'knotcore.vendor.settlement',
        'wedding_id',
        string='Vendor Final Settlements'
    )

    total_milestones_invoiced = fields.Monetary(
        string='Total Invoiced (₹)',
        compute='_compute_finance_summaries',
        currency_field='currency_id'
    )
    total_milestones_paid = fields.Monetary(
        string='Total Paid by Couple (₹)',
        compute='_compute_finance_summaries',
        currency_field='currency_id'
    )
    total_variations_client = fields.Monetary(
        string='Total Variations Billed (₹)',
        compute='_compute_finance_summaries',
        currency_field='currency_id'
    )
    total_guest_passes_count = fields.Integer(
        string='Total Guest Passes',
        compute='_compute_finance_summaries'
    )
    walkin_guests_count = fields.Integer(
        string='Walk-In Extra Guests',
        compute='_compute_finance_summaries'
    )

    @api.depends('milestone_ids.state', 'milestone_ids.amount',
                 'variation_ids.state', 'variation_ids.variation_amount_client',
                 'guest_pass_ids.guest_category')
    def _compute_finance_summaries(self):
        for rec in self:
            invoiced = sum(m.amount for m in rec.milestone_ids if m.state in ['invoiced', 'paid'])
            paid = sum(m.amount for m in rec.milestone_ids if m.state == 'paid')
            vars_client = sum(v.variation_amount_client for v in rec.variation_ids if v.state == 'approved')

            rec.total_milestones_invoiced = invoiced
            rec.total_milestones_paid = paid
            rec.total_variations_client = vars_client
            rec.total_guest_passes_count = len(rec.guest_pass_ids)
            rec.walkin_guests_count = len(rec.guest_pass_ids.filtered(lambda g: g.guest_category == 'walkin'))

    def action_generate_milestones(self):
        """
        Auto-generates the 3-Stage Client Milestone Billing Schedule:
        - Milestone 1: 30% Booking Deposit (Due immediately on booking)
        - Milestone 2: 40% Operational Advance (Due 30 days prior to wedding)
        - Milestone 3: 30% Final Settlement (Due post-wedding)
        """
        self.ensure_one()
        self.milestone_ids.unlink()

        w_date = self.wedding_date or fields.Date.today() + timedelta(days=60)
        today = fields.Date.today()

        milestones = [
            (0, 0, {
                'name': 'Milestone 1: Booking Deposit (30%)',
                'milestone_type': 'm1_booking',
                'percentage': 30.0,
                'due_date': today,
                'state': 'pending',
            }),
            (0, 0, {
                'name': 'Milestone 2: Operational Advance (40%)',
                'milestone_type': 'm2_advance',
                'percentage': 40.0,
                'due_date': w_date - timedelta(days=30),
                'state': 'pending',
            }),
            (0, 0, {
                'name': 'Milestone 3: Final Settlement (30%)',
                'milestone_type': 'm3_settlement',
                'percentage': 30.0,
                'due_date': w_date + timedelta(days=5),
                'state': 'pending',
            }),
        ]
        self.milestone_ids = milestones
        self.message_post(body=_("💳 Generated 3-Stage Client Milestone Billing Schedule (30% - 40% - 30%)."))
        return True
