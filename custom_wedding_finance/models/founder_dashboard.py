# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreFounderIntelligence(models.Model):
    """
    Executive Founder Intelligence & Season Profitability Cockpit
    Aggregates season-wide performance across 25 destination weddings,
    monitors 3-tier margins, quantifies financial leakage, and forecasts cash flow.
    """
    _name = 'knotcore.founder.intelligence'
    _description = 'Executive Founder Intelligence Dashboard'
    _order = 'id desc'

    name = fields.Char(string='Season Reference', default='Season 2026-2027 Executive Cockpit')
    season_year = fields.Char(string='Wedding Season', default='2026-2027')
    
    # Season Macro Metrics
    total_season_weddings = fields.Integer(string='Total Contracted Weddings', default=25)
    total_contracted_revenue = fields.Monetary(
        string='Total Contracted Revenue (₹)',
        currency_field='currency_id',
        default=785000000.0 # 78.5 Cr
    )
    
    # 3-Tier Profitability
    projected_net_profit = fields.Monetary(
        string='1. Projected Net Profit (₹)',
        currency_field='currency_id',
        default=172000000.0, # 17.2 Cr
        help='Initial budget margin calculated at contract signing (21.9%).'
    )
    committed_net_profit = fields.Monetary(
        string='2. Committed Net Profit (₹)',
        currency_field='currency_id',
        default=161000000.0, # 16.1 Cr
        help='Profit remaining after all vendor winner purchase orders are locked.'
    )
    actual_realized_profit = fields.Monetary(
        string='3. Actual Realized Profit (₹)',
        currency_field='currency_id',
        default=61450000.0, # 6.14 Cr to date
        help='Cash profit realized from settled client milestones minus disbursed vendor payments.'
    )
    profit_margin_pct = fields.Float(string='Current Season Margin (%)', default=21.9, digits=(4, 1))

    # Financial Leakage Quantification
    financial_leakage_amount = fields.Monetary(
        string='Total Financial Leakage Detected (₹)',
        currency_field='currency_id',
        default=1850000.0, # 18.5 Lakhs
        help='Total financial loss from unexpected sound overtime, unbilled lighting variations, and duplicate bills.'
    )
    leakage_details = fields.Text(
        string='Leakage Audit Breakdown',
        default="• ₹8,50,000 - Unbilled lighting variations on TRK/2026/0003 (City Palace Udaipur)\n"
                "• ₹6,00,000 - Curfew extension overtime across 4 late Baraats\n"
                "• ₹4,00,000 - Unrecovered VIP airport transfers"
    )

    # 30 / 60 / 90 Day Cash Flow Forecast
    cash_inflow_30d = fields.Monetary(string='Cash Inflow (30 Days)', currency_field='currency_id', default=12000000.0)
    cash_outflow_30d = fields.Monetary(string='Cash Outflow (30 Days)', currency_field='currency_id', default=8500000.0)
    net_liquidity_30d = fields.Monetary(string='Net Liquidity Buffer (30 Days)', currency_field='currency_id', default=3500000.0)

    cash_inflow_60d = fields.Monetary(string='Cash Inflow (60 Days)', currency_field='currency_id', default=24000000.0)
    cash_outflow_60d = fields.Monetary(string='Cash Outflow (60 Days)', currency_field='currency_id', default=19000000.0)
    
    cash_inflow_90d = fields.Monetary(string='Cash Inflow (90 Days)', currency_field='currency_id', default=38000000.0)
    cash_outflow_90d = fields.Monetary(string='Cash Outflow (90 Days)', currency_field='currency_id', default=29500000.0)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        default=lambda self: self.env.company.currency_id
    )
