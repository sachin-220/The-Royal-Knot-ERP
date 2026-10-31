# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from .wedding_ml_predictor import WeddingMLPredictor

class CustomWedding(models.Model):
    """
    Central Master Model for The Royal Knot Wedding Planning Agency.
    Acts as the parent business entity connecting CRM, budget, operations, and finance.
    """
    _name = 'custom.wedding'
    _description = 'Master Wedding Event Record'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'wedding_date_start desc, id desc'

    # Master Identification
    name = fields.Char(
        string='Reference',
        required=True,
        copy=False,
        readonly=True,
        index=True,
        default=lambda self: _('New')
    )
    wedding_title = fields.Char(
        string='Wedding Title',
        compute='_compute_wedding_title',
        store=True,
        help='Display title for the wedding couple'
    )
    partner_id = fields.Many2one(
        'res.partner',
        string='Client / Couple',
        required=True,
        tracking=True,
        index=True,
        help='Primary client contact for billing and digital agreements'
    )
    company_id = fields.Many2one(
        'res.company',
        string='Agency Entity',
        required=True,
        default=lambda self: self.env.company
    )
    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='company_id.currency_id',
        readonly=True
    )

    # Agency Team Assignments
    planner_id = fields.Many2one(
        'res.users',
        string='Lead Wedding Planner',
        tracking=True,
        default=lambda self: self.env.user,
        index=True
    )
    coordinator_ids = fields.Many2many(
        'res.users',
        'wedding_coordinator_rel',
        'wedding_id',
        'user_id',
        string='On-Site Coordinators',
        help='Field planners deployed at the venue during big-day execution'
    )

    # Destination & Venue
    destination = fields.Selection([
        ('jaipur', 'Jaipur (Pink City)'),
        ('udaipur', 'Udaipur (City of Lakes)')
    ], string='Destination', required=True, default='jaipur', tracking=True, index=True)

    location_id = fields.Many2one(
        'custom.wedding.location',
        string='Primary Venue / Palace',
        domain="[('destination', '=', destination)]",
        tracking=True
    )
    package_id = fields.Many2one(
        'custom.wedding.package',
        string='Service Package',
        required=True,
        tracking=True
    )

    # Schedule & Dates
    wedding_date_start = fields.Date(
        string='Start Date',
        required=True,
        tracking=True,
        index=True
    )
    wedding_date_end = fields.Date(
        string='End Date',
        required=True,
        tracking=True,
        index=True
    )
    duration_days = fields.Integer(
        string='Duration (Days)',
        compute='_compute_duration_days',
        store=True
    )

    # Scope & Budget
    guest_count = fields.Integer(
        string='Invited Guest Count',
        required=True,
        default=400,
        tracking=True,
        help='Initial RSVP guest count contracted with the couple.'
    )
    theme = fields.Char(
        string='Wedding Theme & Design',
        default='Royal Heritage',
        tracking=True
    )
    budget_total = fields.Monetary(
        string='Maximum Client Budget',
        currency_field='currency_id',
        required=True,
        tracking=True,
        help='Ceiling budget allocated by the client in Indian Rupees (INR).'
    )

    # Lifecycle State Machine
    state = fields.Selection([
        ('enquiry', 'Enquiry Received'),
        ('consultation', 'Consultation & Proposal'),
        ('confirmed', 'Confirmed & Deposit Paid'),
        ('planning', 'Active Planning'),
        ('in_execution', 'Big Day Execution'),
        ('reconciliation', 'Financial Settlement'),
        ('done', 'Completed'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='enquiry', tracking=True, required=True, index=True)

    # Machine Learning Operational Intelligence
    predicted_guests = fields.Integer(
        string='ML Predicted Turnout',
        compute='_compute_ml_intelligence',
        store=True,
        help='Statistical regression predicting actual guest turnout including unannounced attendees.'
    )
    predicted_guest_surge = fields.Float(
        string='Predicted Influx (%)',
        compute='_compute_ml_intelligence',
        store=True,
        help='Percentage surge over base RSVP guest count.'
    )
    recommended_plate_buffer = fields.Integer(
        string='Recommended Plate Buffer',
        compute='_compute_ml_intelligence',
        store=True,
        help='Recommended bulk plate buffer to contract upfront to avoid emergency surge pricing.'
    )
    margin_drift_risk = fields.Selection([
        ('low', 'Low Risk (Healthy Margin)'),
        ('moderate', 'Moderate Risk'),
        ('critical', 'High Risk of Cost Overrun')
    ], string='Budget Drift Risk', compute='_compute_ml_intelligence', store=True)

    drift_risk_explanation = fields.Char(
        string='Risk Rationale',
        compute='_compute_ml_intelligence',
        store=True
    )

    # Relational SQL Constraints
    _sql_constraints = [
        ('name_unique', 'unique(name)', 'The wedding reference number must be unique!'),
    ]

    # --- Computes & Inversions ---

    @api.depends('partner_id', 'theme', 'destination')
    def _compute_wedding_title(self):
        for record in self:
            partner_name = record.partner_id.name or _('Client')
            city = dict(record._fields['destination'].selection).get(record.destination, '')
            record.wedding_title = f"{partner_name} - {record.theme or 'Wedding'} ({city})"

    @api.depends('wedding_date_start', 'wedding_date_end')
    def _compute_duration_days(self):
        for record in self:
            if record.wedding_date_start and record.wedding_date_end:
                delta = (record.wedding_date_end - record.wedding_date_start).days + 1
                record.duration_days = max(delta, 1)
            else:
                record.duration_days = 0

    @api.depends('guest_count', 'destination', 'location_id', 'package_id', 'budget_total')
    def _compute_ml_intelligence(self):
        for record in self:
            venue_type = record.location_id.venue_type if record.location_id else 'palace'
            pkg_type = record.package_id.package_type if record.package_id else 'full_service'

            # Run ML Turnout Predictor
            pred_guests, surge_pct, buffer_plates = WeddingMLPredictor.predict_turnout_and_buffer(
                base_guest_count=record.guest_count,
                destination=record.destination,
                venue_type=venue_type,
                package_type=pkg_type
            )
            record.predicted_guests = pred_guests
            record.predicted_guest_surge = surge_pct
            record.recommended_plate_buffer = buffer_plates

            # Run ML Margin Drift Risk Evaluator
            risk_lvl, risk_msg = WeddingMLPredictor.evaluate_margin_drift_risk(
                budget_total=record.budget_total,
                guest_count=record.guest_count,
                surge_percentage=surge_pct,
                destination=record.destination
            )
            record.margin_drift_risk = risk_lvl
            record.drift_risk_explanation = risk_msg

    # --- Business Validation Constraints ---

    @api.constrains('wedding_date_start', 'wedding_date_end')
    def _check_wedding_dates(self):
        for record in self:
            if record.wedding_date_start and record.wedding_date_end:
                if record.wedding_date_end < record.wedding_date_start:
                    raise ValidationError(_("Wedding End Date cannot be earlier than Start Date."))

    @api.constrains('budget_total')
    def _check_budget_total(self):
        for record in self:
            if record.budget_total <= 0:
                raise ValidationError(_("Total wedding budget must be greater than zero."))

    @api.constrains('guest_count')
    def _check_guest_count(self):
        for record in self:
            if record.guest_count <= 0:
                raise ValidationError(_("Expected guest count must be greater than zero."))

    # --- CRUD Overrides ---

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('custom.wedding') or _('New')
        return super().create(vals_list)

    # --- Action Workflow Handlers ---

    def action_set_consultation(self):
        self.write({'state': 'consultation'})

    def action_confirm(self):
        for record in self:
            if not record.partner_id:
                raise UserError(_("Cannot confirm a wedding without a primary client contact."))
            record.write({'state': 'confirmed'})

    def action_start_planning(self):
        self.write({'state': 'planning'})

    def action_execute_big_day(self):
        self.write({'state': 'in_execution'})

    def action_reconciliation(self):
        self.write({'state': 'reconciliation'})

    def action_done(self):
        self.write({'state': 'done'})

    def action_cancel(self):
        self.write({'state': 'cancelled'})
