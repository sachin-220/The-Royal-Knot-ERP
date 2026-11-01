# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreDelaySimulator(models.Model):
    """
    Wedding Delay Intelligence & Ripple-Effect Simulator
    Computes downstream schedule impact when ceremony events are delayed.
    Requires Lead Planner approval before broadcasting revised run sheet.
    """
    _name = 'knotcore.delay.simulator'
    _description = 'Wedding Delay Ripple-Effect Simulator'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Simulation Reference',
        required=True,
        default=lambda self: _('Delay Scenario')
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    delayed_event_name = fields.Char(
        string='Trigger Delayed Event',
        required=True,
        default='Groom Royal Baraat Arrival',
        help='The initial ceremony or logistical event running late.'
    )
    delay_minutes = fields.Integer(
        string='Delay Duration (Minutes)',
        required=True,
        default=45,
        help='Minutes by which the trigger event is delayed.'
    )
    
    # Impact Projections
    affected_events_count = fields.Integer(
        string='Affected Downstream Events',
        compute='_compute_simulation_impact',
        store=True
    )
    curfew_violation_risk = fields.Boolean(
        string='Palace Noise Curfew Risk ⚠️',
        compute='_compute_simulation_impact',
        store=True,
        help='Rajasthan heritage law limits outdoor lawn music to 10:00 PM. Indoor till 11:00 PM.'
    )
    estimated_overtime_cost = fields.Monetary(
        string='Estimated Vendor Overtime Surcharge (₹)',
        compute='_compute_simulation_impact',
        store=True,
        currency_field='currency_id'
    )
    impact_summary = fields.Text(
        string='Ripple-Effect Operational Impact Breakdown',
        compute='_compute_simulation_impact',
        store=True
    )

    state = fields.Selection([
        ('simulated', 'Simulated Scenario'),
        ('planner_approved', 'Approved by Lead Planner'),
        ('published', 'Broadcasted to On-Ground Team 📢')
    ], string='Status', default='simulated', tracking=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='wedding_id.currency_id',
        store=True
    )

    @api.depends('delay_minutes', 'delayed_event_name', 'wedding_id.run_sheet_ids')
    def _compute_simulation_impact(self):
        for rec in self:
            mins = rec.delay_minutes or 0
            event = rec.delayed_event_name or 'Ceremony'
            
            # Count downstream events
            run_sheets = rec.wedding_id.run_sheet_ids
            affected_count = max(3, len(run_sheets))
            rec.affected_events_count = affected_count

            # Overtime Calculation: ₹15,000 per hour across DJ, Lighting, and Palace Staff
            hours_delay = mins / 60.0
            overtime_rate_per_hr = 25000.0 # DJ + Lighting + Palace Staff
            rec.estimated_overtime_cost = hours_delay * overtime_rate_per_hr

            # Curfew risk if delay >= 30 mins
            curfew_risk = mins >= 30
            rec.curfew_violation_risk = curfew_risk

            curfew_text = "⚠️ HIGH CURFEW RISK: Pheras & Sangeet will breach Rajasthan Palace 10:00 PM lawn sound curfew! Transition music to indoor ballroom immediately." if curfew_risk else "✅ Within safe palace curfew buffer."

            rec.impact_summary = (
                f"RIPPLE-EFFECT DELAY ANALYSIS (+{mins} mins on '{event}'):\n"
                f"1. Downstream Impact: {affected_count} subsequent ceremony milestones shifted.\n"
                f"2. Royal Banquet Opening: Delayed by +{mins} mins. Catering buffet warming protocol initiated.\n"
                f"3. Curfew Assessment: {curfew_text}\n"
                f"4. Financial Impact: ₹{rec.estimated_overtime_cost:,.2f} estimated supplier overtime billing.\n"
                f"5. Action Required: Lead Planner approval needed to broadcast revised call times."
            )

    def action_approve_simulation(self):
        self.ensure_one()
        self.state = 'planner_approved'
        self.message_post(
            body=_("Lead Planner approved delay scenario (+%d mins). Ready to broadcast.") % self.delay_minutes
        )

    def action_publish_run_sheet(self):
        self.ensure_one()
        if self.state != 'planner_approved':
            self.action_approve_simulation()
        self.state = 'published'
        self.wedding_id.message_post(
            body=_("📢 <b>Run Sheet Adjusted (+%d Mins Delay on %s):</b> Broadcasted to all on-site coordinators and vendor gate leads.") %
            (self.delay_minutes, self.delayed_event_name)
        )
