# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class CustomWeddingPackage(models.Model):
    """
    Represents a wedding planning service tier offered by The Royal Knot.
    Standard tiers: Full-Service Wedding (Complete planning) vs Partial / Day-of.
    """
    _name = 'custom.wedding.package'
    _description = 'Wedding Service Package'
    _order = 'sequence, name'

    name = fields.Char(string='Package Name', required=True, translate=True)
    code = fields.Char(string='Package Code', required=True, size=32)
    sequence = fields.Integer(string='Sequence', default=10)
    description = fields.Text(string='Scope of Services', required=True)
    package_type = fields.Selection([
        ('full_service', 'Full-Service (Complete Planning)'),
        ('partial_day_of', 'Partial / Day-of Service')
    ], string='Package Category', required=True, default='full_service')
    
    # Operational configuration
    base_task_count = fields.Integer(
        string='Baseline Task Templates',
        default=25,
        help='Expected number of operational tasks generated on confirmation.'
    )
    is_active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'Package code must be unique!'),
    ]

    @api.constrains('base_task_count')
    def _check_task_count(self):
        for record in self:
            if record.base_task_count <= 0:
                raise ValidationError("Baseline task count must be at least 1.")
