# -*- coding: utf-8 -*-
from odoo import models, fields

class PurchaseOrderInheritWedding(models.Model):
    """
    Extends Odoo's native purchase.order to seamlessly link to KnotCore weddings
    and track winning quotations.
    """
    _inherit = 'purchase.order'

    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Linked Wedding',
        index=True,
        help='The luxury royal wedding associated with this purchase contract.'
    )
    wedding_quote_id = fields.Many2one(
        'custom.wedding.vendor.quote',
        string='Winning Supplier Quote',
        readonly=True
    )
    budget_category_id = fields.Many2one(
        'knotcore.budget.category',
        string='Budget Category',
        index=True
    )
