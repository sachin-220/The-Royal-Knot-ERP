# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class CustomWeddingBudgetInherit(models.Model):
    """
    Extends custom.wedding with 18-Category Budget Allocations,
    Vendor Quotations, and Live Financial Variance Summaries.
    """
    _inherit = 'custom.wedding'

    budget_allocation_ids = fields.One2many(
        'knotcore.budget.allocation',
        'wedding_id',
        string='Budget Allocations'
    )
    vendor_quote_ids = fields.One2many(
        'custom.wedding.vendor.quote',
        'wedding_id',
        string='Supplier Quotations'
    )
    
    total_allocated_budget = fields.Monetary(
        string='Total Allocated (₹)',
        compute='_compute_budget_totals',
        currency_field='currency_id'
    )
    total_committed_quotes = fields.Monetary(
        string='Total Committed (₹)',
        compute='_compute_budget_totals',
        currency_field='currency_id'
    )
    total_budget_variance = fields.Monetary(
        string='Budget Balance Remaining (₹)',
        compute='_compute_budget_totals',
        currency_field='currency_id'
    )
    allocation_sum_percentage = fields.Float(
        string='Total Allocation Sum (%)',
        compute='_compute_budget_totals',
        digits=(5, 2)
    )

    @api.depends('budget_allocation_ids.percentage', 'budget_allocation_ids.allocated_amount',
                 'budget_allocation_ids.committed_amount', 'total_budget')
    def _compute_budget_totals(self):
        for rec in self:
            alloc_pct = sum(a.percentage for a in rec.budget_allocation_ids)
            rec.allocation_sum_percentage = alloc_pct
            rec.total_allocated_budget = sum(a.allocated_amount for a in rec.budget_allocation_ids)
            rec.total_committed_quotes = sum(a.committed_amount for a in rec.budget_allocation_ids)
            rec.total_budget_variance = rec.total_budget - rec.total_committed_quotes

    def action_generate_default_allocations(self):
        """
        Auto-populates the 18 standard luxury wedding budget categories
        using the agency benchmark percentages (strictly summing to 100%).
        """
        self.ensure_one()
        # Delete existing draft allocations if any
        self.budget_allocation_ids.unlink()

        categories = self.env['knotcore.budget.category'].search([('active', '=', True)], order='sequence asc')
        allocations = []
        for cat in categories:
            allocations.append((0, 0, {
                'category_id': cat.id,
                'percentage': cat.default_percentage,
            }))
        self.budget_allocation_ids = allocations
        self.message_post(body=_("Initialized 18 standard luxury wedding budget categories with benchmark percentages."))
        return True
