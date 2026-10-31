# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class KnotcoreBudgetCategory(models.Model):
    """
    18-Category Luxury Wedding Budget Allocation Matrix
    Standardizes luxury destination wedding expenditure allocations
    with strict mathematical sum-to-100% enforcement.
    """
    _name = 'knotcore.budget.category'
    _description = 'Wedding Budget Category'
    _order = 'sequence, id'

    name = fields.Char(string='Category Name', required=True, translate=True)
    code = fields.Char(string='Code', required=True, size=16)
    sequence = fields.Integer(string='Sequence', default=10)
    default_percentage = fields.Float(
        string='Default Budget Allocation (%)',
        required=True,
        digits=(5, 2),
        help='Benchmark percentage of total wedding budget allocated to this category.'
    )
    description = fields.Text(string='Category Scope & Benchmark Details')
    active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('code_unique', 'unique(code)', 'The budget category code must be unique!'),
    ]

    @api.constrains('default_percentage')
    def _check_default_percentage(self):
        for rec in self:
            if rec.default_percentage < 0 or rec.default_percentage > 100:
                raise ValidationError(_("Allocation percentage must be between 0.0% and 100.0%!"))

    @classmethod
    def validate_category_template_sum(cls, env):
        """Validates that the sum of all active default category percentages equals exactly 100.0%."""
        categories = env['knotcore.budget.category'].search([('active', '=', True)])
        total = sum(c.default_percentage for c in categories)
        if abs(total - 100.0) > 0.05:
            raise ValidationError(
                _("The sum of active budget category benchmark percentages must strictly equal 100.0%% (Current Total: %.2f%%).") % total
            )
        return True
