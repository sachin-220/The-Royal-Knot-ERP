# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreWeddingIncident(models.Model):
    """
    On-Ground Wedding Day Emergency Incident & Equipment Ticket
    Tracks unexpected emergencies (generator trip, broken cable, rain protection)
    with rapid-dispatch SLA and resolution logging.
    """
    _name = 'knotcore.wedding.incident'
    _description = 'Wedding Emergency Incident Ticket'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Ticket ID',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New')
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    title = fields.Char(string='Incident Summary', required=True, tracking=True)
    description = fields.Text(string='Detailed Description & Equipment Required', required=True)
    
    severity = fields.Selection([
        ('low', 'Low - Minor Cosmetic / Favors'),
        ('medium', 'Medium - 15m Schedule Delay / Sound Glitch'),
        ('high', 'High - Stage Power / Food Shortage / Rain Risk ⚠️'),
        ('critical', 'Emergency - Generator Failure / Medical / Curfew Breach 🚨')
    ], string='Severity Level', required=True, default='high', tracking=True)

    category = fields.Selection([
        ('power', 'Power, Generator & Electrical Cables'),
        ('audio', 'Audio, DJ Console & Stage Trussing'),
        ('decor', 'Floral, Mandap & Rain Waterproofing'),
        ('catering', 'Catering, Extra Plates & Buffet Refills'),
        ('guest', 'VIP Guest Concierge & Medical Standby'),
        ('curfew', 'Palace Gate Security & Police Curfew')
    ], string='Equipment / Service Category', required=True, default='power', tracking=True)

    state = fields.Selection([
        ('reported', 'Reported via Bot / Radio 📢'),
        ('dispatched', 'Technical Team Dispatched 🚚'),
        ('resolved', 'Resolved & Tested ✅')
    ], string='Status', default='reported', tracking=True)

    assigned_user_id = fields.Many2one(
        'res.users',
        string='Lead Responding Coordinator',
        default=lambda self: self.env.user,
        tracking=True
    )
    resolution_time_minutes = fields.Integer(string='Resolution Time (Mins)', default=0)
    resolution_notes = fields.Text(string='Resolution Actions & Preventive Measures')

    @api.model
    def create(self, vals):
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('knotcore.wedding.incident') or _('New')
        return super(KnotcoreWeddingIncident, self).create(vals)

    def action_dispatch(self):
        self.ensure_one()
        self.state = 'dispatched'
        self.message_post(body=_("🚚 Response team dispatched to resolve ticket '%s'.") % self.title)

    def action_resolve(self):
        self.ensure_one()
        self.state = 'resolved'
        self.message_post(body=_("✅ Incident ticket '%s' successfully resolved.") % self.title)
