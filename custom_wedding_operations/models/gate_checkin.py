# -*- coding: utf-8 -*-
import random
from datetime import timedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class KnotcoreVendorGateCheckin(models.Model):
    """
    Palace Gate Security QR + OTP Check-In Engine
    Verifies supplier arrival, tracks punctuality, and enforces 15-minute late tolerance triggers.
    """
    _name = 'knotcore.vendor.gate.checkin'
    _description = 'Vendor Palace Gate Check-In Pass'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'scheduled_call_time asc, id desc'

    name = fields.Char(
        string='Pass Reference',
        required=True,
        copy=False,
        default=lambda self: f"GATE-PASS-{random.randint(1000, 9999)}"
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    vendor_id = fields.Many2one(
        'res.partner',
        string='Supplier / Vendor',
        required=True,
        tracking=True
    )
    vendor_category = fields.Char(string='Vendor Service Category', default='Sound & Production')
    venue_gate = fields.Char(
        string='Assigned Palace Gate / Dock',
        default='Service Dock Gate 3 (Bhawani Singh Road entrance)'
    )
    gate_otp = fields.Char(
        string='4-Digit Gate Security OTP',
        required=True,
        copy=False,
        default=lambda self: str(random.randint(1000, 9999)),
        tracking=True
    )
    scheduled_call_time = fields.Datetime(
        string='Scheduled Call Time',
        required=True,
        default=fields.Datetime.now,
        tracking=True
    )
    actual_arrival_time = fields.Datetime(
        string='Actual Arrival Check-In',
        readonly=True,
        tracking=True
    )
    is_delayed = fields.Boolean(
        string='Late Arrival Flag (>15 mins)',
        compute='_compute_delay_status',
        store=True,
        tracking=True
    )
    delay_minutes = fields.Integer(
        string='Delay (Minutes)',
        compute='_compute_delay_status',
        store=True
    )
    status = fields.Selection([
        ('pending', 'Awaiting Arrival'),
        ('arrived', 'Arrived On-Site ✅'),
        ('delayed_alert', '🚨 LATE TOLERANCE BREACH (>15 Mins)'),
        ('no_show', 'No-Show / Cancelled')
    ], string='Gate Status', default='pending', tracking=True)

    @api.depends('scheduled_call_time', 'actual_arrival_time', 'status')
    def _compute_delay_status(self):
        now = fields.Datetime.now()
        for rec in self:
            sched = rec.scheduled_call_time or now
            if rec.actual_arrival_time:
                diff_sec = (rec.actual_arrival_time - sched).total_seconds()
                mins = int(diff_sec / 60)
            elif rec.status == 'pending' and now > (sched + timedelta(minutes=15)):
                diff_sec = (now - sched).total_seconds()
                mins = int(diff_sec / 60)
            else:
                mins = 0

            rec.delay_minutes = max(0, mins)
            rec.is_delayed = mins > 15
            if rec.status == 'pending' and mins > 15:
                rec.status = 'delayed_alert'

    def action_verify_otp(self, entered_otp):
        """Verifies vendor OTP submitted via Telegram or Gate Security Portal."""
        self.ensure_one()
        if str(entered_otp).strip() != self.gate_otp:
            raise UserError(_("Invalid OTP! Please check the 4-digit code dispatched to your supplier pass."))

        self.actual_arrival_time = fields.Datetime.now()
        self.status = 'arrived'
        self.message_post(
            body=_("✅ Palace Gate Security verified OTP '%s'. Supplier '%s' checked in at %s.") %
            (self.gate_otp, self.vendor_id.name, self.venue_gate)
        )
        return True

    @api.model
    def cron_check_late_vendors(self):
        """Cron checking for vendors overdue past the 15-minute tolerance threshold."""
        now = fields.Datetime.now()
        late_passes = self.search([
            ('status', '=', 'pending'),
            ('scheduled_call_time', '<', now - timedelta(minutes=15))
        ])
        for pass_rec in late_passes:
            pass_rec.status = 'delayed_alert'
            pass_rec.wedding_id.message_post(
                body=_("🚨 <b>15-Minute Late Tolerance Trigger:</b> Vendor '%s' has NOT checked in at %s (Scheduled: %s). Call coordinator immediately!") %
                (pass_rec.vendor_id.name, pass_rec.venue_gate, pass_rec.scheduled_call_time)
            )
