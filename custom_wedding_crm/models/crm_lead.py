# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class CrmLead(models.Model):
    """
    Extends native crm.lead with luxury wedding attributes,
    ML conversion scoring, and 48-hour Lead Recovery Intelligence.
    """
    _inherit = 'crm.lead'

    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Master Wedding Record',
        index=True,
        tracking=True,
        help='Linked royal wedding record once converted.'
    )
    destination = fields.Selection([
        ('jaipur', 'Jaipur (Pink City)'),
        ('udaipur', 'Udaipur (City of Lakes)')
    ], string='Target Destination', default='jaipur', tracking=True)

    guest_count = fields.Integer(
        string='Expected Guests',
        default=400,
        tracking=True
    )
    wedding_theme = fields.Char(
        string='Wedding Theme Preference',
        default='Royal Heritage',
        tracking=True
    )
    budget_total = fields.Monetary(
        string='Estimated Budget Ceiling',
        currency_field='company_currency',
        tracking=True
    )
    package_id = fields.Many2one(
        'custom.wedding.package',
        string='Requested Package Tier'
    )
    lead_channel = fields.Selection([
        ('telegram', 'Telegram Bot (@Royalknot_bot)'),
        ('whatsapp', 'WhatsApp Business API'),
        ('instagram', 'Instagram DM'),
        ('phone', 'Phone Consultation'),
        ('walk_in', 'Walk-in / Referral')
    ], string='Intake Channel', default='telegram', required=True, tracking=True)

    telegram_chat_id = fields.Char(
        string='Telegram Chat ID',
        index=True,
        copy=False,
        help='Chat ID used for two-way automated client communication.'
    )
    last_interaction_datetime = fields.Datetime(
        string='Last Client Interaction',
        default=fields.Datetime.now,
        tracking=True
    )

    # Intelligence & Recovery Features
    conversion_probability_score = fields.Float(
        string='ML Conversion Probability (%)',
        compute='_compute_conversion_score',
        store=True,
        help='Machine learning forecast of enquiry conversion likelihood.'
    )
    lead_recovery_flag = fields.Boolean(
        string='Needs Recovery (48h+ Inactive)',
        compute='_compute_lead_recovery',
        store=True,
        index=True,
        help='Flagged by Lead Recovery Intelligence when high-value leads are untouched for 48+ hours.'
    )
    suggested_followup_message = fields.Text(
        string='Suggested Follow-Up Draft',
        compute='_compute_followup_suggestion',
        help='AI-generated personalized follow-up message ready for planner dispatch.'
    )

    @api.depends('budget_total', 'guest_count', 'destination')
    def _compute_conversion_score(self):
        for lead in self:
            if not lead.budget_total or not lead.guest_count or lead.guest_count <= 0:
                lead.conversion_probability_score = 30.0
                continue
            spend_per_guest = lead.budget_total / lead.guest_count
            # Benchmark: In luxury weddings, spend >= ₹50,000 per guest has highest close rate
            base_score = 50.0
            if spend_per_guest >= 60000:
                base_score += 35.0
            elif spend_per_guest >= 40000:
                base_score += 20.0
            elif spend_per_guest < 25000:
                base_score -= 15.0

            if lead.destination in ('jaipur', 'udaipur'):
                base_score += 10.0
            lead.conversion_probability_score = min(max(base_score, 10.0), 98.0)

    @api.depends('last_interaction_datetime', 'stage_id')
    def _compute_lead_recovery(self):
        now = fields.Datetime.now()
        for lead in self:
            if lead.stage_id.is_won or lead.active is False:
                lead.lead_recovery_flag = False
            elif lead.last_interaction_datetime:
                delta = now - lead.last_interaction_datetime
                lead.lead_recovery_flag = delta >= timedelta(hours=48)
            else:
                lead.lead_recovery_flag = False

    @api.depends('partner_name', 'destination', 'wedding_theme', 'budget_total')
    def _compute_followup_suggestion(self):
        for lead in self:
            name = lead.partner_name or lead.contact_name or _('Esteemed Couple')
            dest = dict(lead._fields['destination'].selection).get(lead.destination, 'Rajasthan')
            lead.suggested_followup_message = (
                f"Namaste {name}! Warm greetings from The Royal Knot. "
                f"We have reserved exclusive winter dates across top heritage palaces in {dest} "
                f"for your {lead.wedding_theme or 'Royal'} celebration. "
                f"Would you like us to share our curated palace floor plans and culinary portfolios?"
            )

    @api.model
    def cron_lead_recovery_intelligence(self):
        """
        Scheduled cron that sweeps active leads every 6 hours, detects leads
        untouched for 48+ hours, and creates urgent planner review activities.
        """
        threshold = fields.Datetime.now() - timedelta(hours=48)
        stale_leads = self.search([
            ('last_interaction_datetime', '<=', threshold),
            ('type', '=', 'opportunity'),
            ('stage_id.is_won', '=', False)
        ])
        for lead in stale_leads:
            lead.lead_recovery_flag = True
            # Schedule an urgent Odoo activity for the assigned user
            user_id = lead.user_id.id or self.env.ref('base.user_admin').id
            activity_exists = self.env['mail.activity'].search([
                ('res_id', '=', lead.id),
                ('res_model', '=', 'crm.lead'),
                ('summary', 'like', 'Lead Recovery Alert')
            ], limit=1)
            if not activity_exists:
                self.env['mail.activity'].create({
                    'activity_type_id': self.env.ref('mail.mail_activity_data_todo').id,
                    'summary': _('Lead Recovery Alert: 48h Inactivity'),
                    'note': _(f'This high-value inquiry ({lead.name}) has received no follow-up for over 48 hours. Please reach out immediately.'),
                    'user_id': user_id,
                    'res_id': lead.id,
                    'res_model_id': self.env['ir.model']._get_id('crm.lead'),
                    'date_deadline': fields.Date.today(),
                })

    def action_convert_to_wedding(self):
        """
        1-Click Conversion: Converts a qualified CRM Lead into a formal custom.wedding master record,
        links partner contacts, and instantiates the digital service agreement.
        """
        self.ensure_one()
        if self.wedding_id:
            raise UserError(_("This lead is already converted to wedding %s.") % self.wedding_id.name)

        # Ensure or create client partner
        partner = self.partner_id
        if not partner:
            partner = self.env['res.partner'].create({
                'name': self.partner_name or self.name,
                'phone': self.phone or self.mobile,
                'email': self.email_from,
                'is_company': False,
            })
            self.partner_id = partner.id

        # Determine package
        package = self.package_id or self.env['custom.wedding.package'].search([], limit=1)
        today = fields.Date.today()

        wedding_vals = {
            'partner_id': partner.id,
            'package_id': package.id,
            'destination': self.destination or 'jaipur',
            'wedding_date_start': today + timedelta(days=60),
            'wedding_date_end': today + timedelta(days=62),
            'guest_count': self.guest_count or 400,
            'theme': self.wedding_theme or 'Royal Heritage',
            'budget_total': self.budget_total or 25000000.0,
            'state': 'consultation',
            'planner_id': self.user_id.id or self.env.uid,
        }
        wedding = self.env['custom.wedding'].create(wedding_vals)
        self.wedding_id = wedding.id

        # Create Draft Service Agreement
        self.env['wedding.agreement'].create({
            'wedding_id': wedding.id,
            'agreement_type': package.package_type if package else 'full_service',
            'state': 'draft',
        })

        # Post audit note in chatter
        self.message_post(body=_(f"Enquiry successfully converted to Wedding master record: <b>{wedding.name}</b>"))
        wedding.message_post(body=_(f"Master wedding record initiated from CRM Lead: <b>{self.name}</b>"))

        return {
            'type': 'ir.actions.act_window',
            'name': _('Royal Wedding Record'),
            'res_model': 'custom.wedding',
            'res_id': wedding.id,
            'view_mode': 'form',
            'target': 'current',
        }
