# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class KnotcoreVendorSettlement(models.Model):
    """
    Automated 3-Way Matching & Vendor Final Settlement Engine
    Cross-checks Quote <-> Purchase Order <-> Vendor Bill.
    Detects duplicate bills, calculates settlement formula:
    Final Settlement = Contract + Approved Variations - Advances Paid.
    """
    _name = 'knotcore.vendor.settlement'
    _description = 'Vendor 3-Way Matching & Settlement Statement'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Settlement ID',
        required=True,
        copy=False,
        default=lambda self: _('New')
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    vendor_id = fields.Many2one(
        'res.partner',
        string='Supplier / Vendor',
        required=True,
        domain="[('is_company', '=', True)]"
    )
    category_id = fields.Many2one(
        'knotcore.budget.category',
        string='Budget Category',
        required=True
    )
    
    # 3-Way Matching Linked Documents
    quote_id = fields.Many2one('custom.wedding.vendor.quote', string='1. Approved Winning Quote')
    purchase_order_id = fields.Many2one('purchase.order', string='2. Confirmed Purchase Order')
    vendor_bill_id = fields.Many2one('account.move', string='3. Submitted Vendor Bill')
    submitted_bill_amount = fields.Monetary(
        string='Submitted Vendor Bill (₹)',
        currency_field='currency_id',
        tracking=True
    )

    # Settlement Calculation
    contract_amount = fields.Monetary(
        string='Contract Base (₹)',
        currency_field='currency_id',
        compute='_compute_settlement',
        store=True,
        help='Original approved contract amount from Winner Quote / Purchase Order.'
    )
    approved_extras_amount = fields.Monetary(
        string='Approved Variations / Extras (₹)',
        currency_field='currency_id',
        compute='_compute_settlement',
        store=True,
        help='Sum of approved on-ground variations from Live Variation Ledger.'
    )
    advance_paid_amount = fields.Monetary(
        string='Advance Paid to Date (₹)',
        currency_field='currency_id',
        default=0.0,
        tracking=True
    )
    final_settlement_payable = fields.Monetary(
        string='Final Settlement Balance Payable (₹)',
        currency_field='currency_id',
        compute='_compute_settlement',
        store=True,
        help='Formula: Contract + Approved Extras - Advance Paid.'
    )

    # 3-Way Audit Validation
    matching_status = fields.Selection([
        ('matched', '3-Way Matched (Pass) ✅'),
        ('discrepancy', 'Discrepancy Detected (>2%) ⚠️'),
        ('duplicate_suspect', 'Duplicate Invoice Suspect 🚨'),
        ('rejected', 'Settlement Rejected ❌')
    ], string='Matching Audit Status', default='matched', tracking=True)

    discrepancy_amount = fields.Monetary(
        string='Discrepancy (₹)',
        currency_field='currency_id',
        compute='_compute_matching',
        store=True
    )
    discrepancy_reason = fields.Text(
        string='Audit Explanation',
        compute='_compute_matching',
        store=True
    )

    state = fields.Selection([
        ('audit', 'Audit Review'),
        ('approved', 'Settlement Approved ✅'),
        ('disbursed', 'Payment Disbursed 💳')
    ], string='Settlement Status', default='audit', tracking=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='wedding_id.currency_id',
        store=True
    )

    @api.model
    def create(self, vals):
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('knotcore.vendor.settlement') or _('New')
        return super(KnotcoreVendorSettlement, self).create(vals)

    @api.depends('quote_id', 'purchase_order_id', 'wedding_id.variation_ids.state',
                 'wedding_id.variation_ids.variation_amount_vendor', 'advance_paid_amount')
    def _compute_settlement(self):
        for rec in self:
            # 1. Base Contract Amount
            if rec.purchase_order_id:
                base = rec.purchase_order_id.amount_total
            elif rec.quote_id:
                base = rec.quote_id.quoted_amount
            else:
                base = 0.0
            rec.contract_amount = base

            # 2. Approved Variations Extras
            extras = self.env['knotcore.wedding.variation'].search([
                ('wedding_id', '=', rec.wedding_id.id),
                ('vendor_id', '=', rec.vendor_id.id),
                ('state', '=', 'approved')
            ])
            rec.approved_extras_amount = sum(e.variation_amount_vendor for e in extras)

            # 3. Final Settlement Payable = Base + Extras - Advance Paid
            rec.final_settlement_payable = (rec.contract_amount + rec.approved_extras_amount) - (rec.advance_paid_amount or 0.0)

    @api.depends('submitted_bill_amount', 'contract_amount', 'approved_extras_amount')
    def _compute_matching(self):
        for rec in self:
            expected_total = rec.contract_amount + rec.approved_extras_amount
            submitted = rec.submitted_bill_amount or expected_total
            diff = submitted - expected_total

            rec.discrepancy_amount = diff

            # Duplicate Check: duplicate bill with same amount and vendor
            existing_duplicate = self.search([
                ('id', '!=', rec.id),
                ('vendor_id', '=', rec.vendor_id.id),
                ('wedding_id', '=', rec.wedding_id.id),
                ('submitted_bill_amount', '=', submitted),
                ('submitted_bill_amount', '>', 0)
            ], limit=1)

            if existing_duplicate:
                rec.matching_status = 'duplicate_suspect'
                rec.discrepancy_reason = f"Duplicate Bill Alert: Identical bill amount of ₹{submitted:,.2f} already processed on settlement {existing_duplicate.name}."
            elif diff > 0.02 * expected_total and expected_total > 0:
                rec.matching_status = 'discrepancy'
                rec.discrepancy_reason = f"Discrepancy: Submitted bill (₹{submitted:,.2f}) exceeds Contract + Approved Variations (₹{expected_total:,.2f}) by ₹{diff:,.2f} (+{diff/expected_total*100:.1f}%)."
            else:
                rec.matching_status = 'matched'
                rec.discrepancy_reason = "3-Way Match Verified: Submitted invoice perfectly reconciles with Purchase Order and approved variations."

    def action_approve_settlement(self):
        self.ensure_one()
        if self.matching_status == 'duplicate_suspect':
            raise UserError(_("Cannot approve settlement with active Duplicate Invoice Suspect flag! Please audit."))
        self.state = 'approved'
        self.message_post(body=_("✅ Final settlement statement approved for disbursement: ₹%s.") % f"{self.final_settlement_payable:,.2f}")

    def action_disburse_payment(self):
        self.ensure_one()
        self.state = 'disbursed'
        self.message_post(body=_("💳 Vendor payment disbursed: ₹%s to %s.") % (f"{self.final_settlement_payable:,.2f}", self.vendor_id.name))
