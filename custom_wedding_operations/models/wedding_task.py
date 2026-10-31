# -*- coding: utf-8 -*-
from datetime import timedelta
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class CustomWeddingTask(models.Model):
    """
    Luxury Wedding Operational Task Graph Node
    Auto-constructs structured wedding milestones with predecessor dependency logic.
    """
    _name = 'custom.wedding.task'
    _description = 'Wedding Operational Task'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'days_before_wedding desc, sequence, id'

    name = fields.Char(string='Task Name', required=True, tracking=True)
    sequence = fields.Integer(string='Sequence', default=10)
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    task_phase = fields.Selection([
        ('planning', '1. Planning & Venue Buyout (T-180 to T-90)'),
        ('vendor', '2. Vendor Contracting & Tasting (T-90 to T-30)'),
        ('production', '3. Production, Sound & Stage Setup (T-30 to T-2)'),
        ('wedding_day', '4. Wedding Day Live Operations (T-0)')
    ], string='Project Phase', required=True, default='planning', tracking=True)

    days_before_wedding = fields.Integer(
        string='Scheduled Days Before Big Day (T-Minus)',
        default=30,
        help='Target lead time before the wedding date.'
    )
    deadline_date = fields.Date(
        string='Target Deadline',
        compute='_compute_deadline',
        store=True,
        tracking=True
    )
    predecessor_task_id = fields.Many2one(
        'custom.wedding.task',
        string='Predecessor Milestone',
        domain="[('wedding_id', '=', wedding_id), ('id', '!=', id)]",
        help='This task cannot start until the predecessor is completed.'
    )
    assigned_user_id = fields.Many2one(
        'res.users',
        string='Assigned Planner',
        default=lambda self: self.env.user,
        tracking=True
    )
    urgency = fields.Selection([
        ('normal', 'Standard Priority'),
        ('medium', 'Medium Urgency'),
        ('high', 'High Priority'),
        ('critical', 'Critical Path / Overdue ⚠️')
    ], string='Urgency', default='normal', compute='_compute_urgency', store=True)

    state = fields.Selection([
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('blocked', 'Blocked by Predecessor'),
        ('completed', 'Completed ✅'),
        ('cancelled', 'Cancelled')
    ], string='Status', default='todo', tracking=True)

    notes = fields.Text(string='Operational Checklist & Vendor Instructions')

    @api.depends('wedding_id.wedding_date', 'days_before_wedding')
    def _compute_deadline(self):
        for rec in self:
            if rec.wedding_id.wedding_date:
                w_date = fields.Date.from_string(rec.wedding_id.wedding_date)
                rec.deadline_date = w_date - timedelta(days=rec.days_before_wedding)
            else:
                rec.deadline_date = fields.Date.today()

    @api.depends('deadline_date', 'state')
    def _compute_urgency(self):
        today = fields.Date.today()
        for rec in self:
            if rec.state == 'completed':
                rec.urgency = 'normal'
            elif rec.deadline_date and rec.deadline_date < today:
                rec.urgency = 'critical'
            elif rec.deadline_date and (rec.deadline_date - today).days <= 3:
                rec.urgency = 'high'
            elif rec.deadline_date and (rec.deadline_date - today).days <= 14:
                rec.urgency = 'medium'
            else:
                rec.urgency = 'normal'

    def action_start(self):
        self.ensure_one()
        if self.predecessor_task_id and self.predecessor_task_id.state != 'completed':
            raise UserError(
                _("Task is blocked! Predecessor milestone '%s' must be completed first.") % self.predecessor_task_id.name
            )
        self.state = 'in_progress'

    def action_complete(self):
        self.ensure_one()
        self.state = 'completed'
        self.message_post(body=_("✅ Milestone '%s' marked as COMPLETED by %s.") % (self.name, self.env.user.name))
        
        # Unlock dependent tasks
        dependents = self.search([('predecessor_task_id', '=', self.id), ('state', '=', 'blocked')])
        for dep in dependents:
            dep.state = 'todo'
            dep.message_post(body=_("Predecessor '%s' completed. This task is now unlocked!") % self.name)
