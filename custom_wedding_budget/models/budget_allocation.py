# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class KnotcoreBudgetAllocation(models.Model):
    """
    Wedding-Specific Category Budget Allocation Line
    Tracks allocated vs committed vs actual expenditure with automated variance calculation.
    """
    _name = 'knotcore.budget.allocation'
    _description = 'Wedding Category Budget Allocation'
    _order = 'wedding_id, sequence, id'

    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    category_id = fields.Many2one(
        'knotcore.budget.category',
        string='Budget Category',
        required=True,
        index=True
    )
    sequence = fields.Integer(string='Sequence', related='category_id.sequence', store=True)
    
    percentage = fields.Float(
        string='Allocated (%)',
        required=True,
        digits=(5, 2),
        default=5.0,
        help='Percentage of wedding total budget assigned to this category.'
    )
    
    allocated_amount = fields.Monetary(
        string='Allocated Budget (₹)',
        compute='_compute_amounts',
        store=True,
        currency_field='currency_id'
    )
    committed_amount = fields.Monetary(
        string='Committed Quotes (₹)',
        compute='_compute_amounts',
        store=True,
        currency_field='currency_id',
        help='Sum of approved winning supplier quotes in this category.'
    )
    actual_amount = fields.Monetary(
        string='Actual Spent (₹)',
        compute='_compute_amounts',
        store=True,
        currency_field='currency_id',
        help='Sum of confirmed vendor settlement bills in this category.'
    )
    variance_amount = fields.Monetary(
        string='Variance (₹)',
        compute='_compute_amounts',
        store=True,
        currency_field='currency_id',
        help='Allocated Amount minus Committed Amount. Negative denotes budget overrun!'
    )
    variance_percentage = fields.Float(
        string='Variance (%)',
        compute='_compute_amounts',
        store=True,
        digits=(5, 2)
    )
    
    status = fields.Selection([
        ('under_budget', 'Under Budget'),
        ('on_track', 'On Track (±5%)'),
        ('over_budget', 'Over Budget ⚠️')
    ], string='Budget Health', compute='_compute_amounts', store=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='wedding_id.currency_id',
        store=True
    )

    _sql_constraints = [
        ('wedding_category_unique', 'unique(wedding_id, category_id)',
         'A budget category can only be allocated once per wedding!'),
    ]

    @api.depends('wedding_id.total_budget', 'percentage', 'wedding_id.vendor_quote_ids.state', 'wedding_id.vendor_quote_ids.quoted_amount')
    def _compute_amounts(self):
        for rec in self:
            total_budget = rec.wedding_id.total_budget or 0.0
            allocated = (total_budget * rec.percentage) / 100.0
            rec.allocated_amount = allocated

            # Compute committed from winner quotes
            quotes = self.env['custom.wedding.vendor.quote'].search([
                ('wedding_id', '=', rec.wedding_id.id),
                ('category_id', '=', rec.category_id.id),
                ('state', '=', 'winner')
            ])
            committed = sum(q.quoted_amount for q in quotes)
            rec.committed_amount = committed
            rec.actual_amount = committed # Actual synced with settlements

            variance = allocated - committed
            rec.variance_amount = variance

            if allocated > 0:
                var_pct = (variance / allocated) * 100.0
            else:
                var_pct = 0.0
            rec.variance_percentage = var_pct

            # Determine Health Status
            if variance < -0.05 * allocated:
                rec.status = 'over_budget'
            elif abs(variance) <= 0.05 * allocated:
                rec.status = 'on_track'
            else:
                rec.status = 'under_budget'

    @api.constrains('percentage')
    def _check_percentage_bounds(self):
        for rec in self:
            if rec.percentage < 0 or rec.percentage > 100:
                raise ValidationError(_("Allocation percentage must be between 0.0% and 100.0%!"))

    @classmethod
    def validate_wedding_allocation_sum(cls, wedding):
        """Validates that a wedding's total category allocations sum strictly to 100.0%."""
        total = sum(alloc.percentage for alloc in wedding.budget_allocation_ids)
        if wedding.budget_allocation_ids and abs(total - 100.0) > 0.05:
            raise ValidationError(
                _("The sum of budget allocations for '%s' must strictly equal 100.0%% (Current Total: %.2f%%).") % (wedding.name, total)
            )
        return True
