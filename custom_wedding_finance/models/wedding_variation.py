# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreWeddingVariation(models.Model):
    """
    Live Wedding Variation Ledger
    Maintains a bulletproof supplementary audit trail for on-ground scope additions
    (extra 25 banquet plates, sound curfew extension, floral upgrades)
    WITHOUT altering confirmed baseline invoices.
    """
    _name = 'knotcore.wedding.variation'
    _description = 'Wedding Scope & Financial Variation Line'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Variation ID',
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
    category_id = fields.Many2one(
        'knotcore.budget.category',
        string='Budget Category',
        required=True
    )
    vendor_id = fields.Many2one(
        'res.partner',
        string='Supplier / Vendor',
        help='Supplier performing the supplementary service.'
    )
    title = fields.Char(string='Variation Scope Title', required=True, tracking=True)
    description = fields.Text(string='Scope Description & Justification', required=True)

    variation_amount_client = fields.Monetary(
        string='Client Supplementary Billed (₹)',
        required=True,
        currency_field='currency_id',
        tracking=True,
        help='Extra amount billed to the couple.'
    )
    variation_amount_vendor = fields.Monetary(
        string='Vendor Additional Cost (₹)',
        required=True,
        currency_field='currency_id',
        tracking=True,
        help='Extra payable to the supplier.'
    )
    agency_markup_margin = fields.Monetary(
        string='Agency Gross Margin (₹)',
        compute='_compute_margin',
        store=True,
        currency_field='currency_id'
    )

    state = fields.Selection([
        ('draft', 'Draft Variation'),
        ('approved', 'Approved by Lead Planner ✅'),
        ('invoiced', 'Supplementary Invoiced 📄'),
        ('rejected', 'Rejected ❌')
    ], string='Status', default='draft', tracking=True)

    currency_id = fields.Many2one(
        'res.currency',
        string='Currency',
        related='wedding_id.currency_id',
        store=True
    )

    @api.model
    def create(self, vals):
        if vals.get('name', _('New')) == _('New'):
            vals['name'] = self.env['ir.sequence'].next_by_code('knotcore.wedding.variation') or _('New')
        return super(KnotcoreWeddingVariation, self).create(vals)

    @api.depends('variation_amount_client', 'variation_amount_vendor')
    def _compute_margin(self):
        for rec in self:
            rec.agency_markup_margin = (rec.variation_amount_client or 0.0) - (rec.variation_amount_vendor or 0.0)

    def action_approve_variation(self):
        self.ensure_one()
        self.state = 'approved'
        self.message_post(body=_("✅ Variation '%s' approved. Added to Live Variation Ledger.") % self.title)
        self.wedding_id.message_post(
            body=_("📝 <b>Variation Approved:</b> '%s' (+₹%s client / +₹%s vendor).") %
            (self.title, f"{self.variation_amount_client:,.2f}", f"{self.variation_amount_vendor:,.2f}")
        )
