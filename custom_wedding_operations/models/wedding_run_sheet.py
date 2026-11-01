# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreWeddingRunSheet(models.Model):
    """
    Minute-by-Minute Wedding-Day Command Centre Run Sheet
    Orchestrates ceremonial timeline milestones with real-time live status and cue notes.
    """
    _name = 'knotcore.wedding.run.sheet'
    _description = 'Wedding Day Command Run Sheet'
    _order = 'sequence, id'

    sequence = fields.Integer(string='Seq', default=10)
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    time_start = fields.Char(string='Start Time', required=True, default='10:00 AM')
    time_end = fields.Char(string='End Time', required=True, default='11:30 AM')
    event_name = fields.Char(string='Ceremonial Milestone / Event', required=True)
    venue_zone = fields.Char(string='Palace Venue Zone', default='Central Heritage Lawns')
    lead_coordinator = fields.Char(string='Lead Coordinator in Charge', default='Lead Wedding Planner')
    cue_notes = fields.Text(string='Production Cues & Audio/Visual Prompts')
    status = fields.Selection([
        ('upcoming', 'Upcoming 🕒'),
        ('live', 'LIVE NOW 🔴'),
        ('completed', 'Completed ✅')
    ], string='Status', default='upcoming')

    def action_set_live(self):
        self.ensure_one()
        # Set all other run sheets for this wedding to upcoming/completed
        others = self.search([('wedding_id', '=', self.wedding_id.id), ('status', '=', 'live')])
        others.write({'status': 'completed'})
        self.status = 'live'

    def action_set_completed(self):
        self.ensure_one()
        self.status = 'completed'
