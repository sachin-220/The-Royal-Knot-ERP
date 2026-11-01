# -*- coding: utf-8 -*-
from datetime import timedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class KnotcoreClientMilestone(models.Model):
    """
    3-Stage Client Milestone Billing Architecture
    Enforces strict milestone billing:
    - Milestone 1: 30% Booking Deposit (on contract confirmation)
    - Milestone 2: 40% Operational Advance (30 days prior to wedding)
    - Milestone 3: 30% Final Settlement (post-wedding reconciliation)
    """
    _name = 'knotcore.client.milestone'
    _description = 'Client Wedding Milestone Invoice'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'milestone_type asc, id asc'

    name = fields.Char(string='Milestone Title', required=True)
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    milestone_type = fields.Selection([
        ('m1_booking', 'Milestone 1: Booking Deposit (30%)'),
        ('m2_advance', 'Milestone 2: Operational Advance (40%)'),
        ('m3_settlement', 'Milestone 3: Final Settlement (30%)')
    ], string='Milestone Stage', required=True, default='m1_booking')

    percentage = fields.Float(
        string='Contract Share (%)',
        required=True,
        digits=(5, 2),
        default=30.0
    )
    amount = fields.Monetary(
        string='Milestone Amount (₹)',
        compute='_compute_amount',
        store=True,
        currency_field='currency_id',
        tracking=True
    )
    due_date = fields.Date(
        string='Payment Due Date',
        required=True,
        tracking=True
    )
    invoice_id = fields.Many2one(
        'account.move',
        string='Generated Customer Invoice',
        readonly=True
    )
    state = fields.Selection([
        ('pending', 'Pending Invoicing'),
        ('invoiced', 'Invoiced / Awaiting Payment 🕒'),
        ('paid', 'Settled & Paid ✅'),
        ('overdue', 'Overdue ⚠️')
    ], string='Payment Status', default='pending', tracking=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='wedding_id.currency_id',
        store=True
    )

    @api.depends('wedding_id.total_budget', 'percentage')
    def _compute_amount(self):
        for rec in self:
            budget = rec.wedding_id.total_budget or 0.0
            rec.amount = (budget * rec.percentage) / 100.0

    def action_create_invoice(self):
        """Creates native account.move customer invoice for this milestone."""
        self.ensure_one()
        if self.invoice_id:
            return True

        inv_vals = {
            'move_type': 'out_invoice',
            'partner_id': self.wedding_id.client_id.id,
            'invoice_date': fields.Date.today(),
            'invoice_date_due': self.due_date,
            'invoice_line_ids': [(0, 0, {
                'name': f"{self.name} - {self.wedding_id.name}",
                'quantity': 1.0,
                'price_unit': self.amount,
            })]
        }
        inv = self.env['account.move'].create(inv_vals)
        self.invoice_id = inv.id
        self.state = 'invoiced'
        self.message_post(body=_("📄 Customer Invoice %s generated for %s (₹%s).") % (inv.name or 'Draft', self.name, f"{self.amount:,.2f}"))
        return True

    def action_mark_paid(self):
        self.ensure_one()
        self.state = 'paid'
        self.message_post(body=_("✅ Milestone '%s' marked as SETTLED & PAID (₹%s).") % (self.name, f"{self.amount:,.2f}"))
        self.wedding_id.message_post(body=_("💳 <b>Client Payment Received:</b> %s settled for ₹%s.") % (self.name, f"{self.amount:,.2f}"))
