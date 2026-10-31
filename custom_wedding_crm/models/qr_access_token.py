# -*- coding: utf-8 -*-
import io
import base64
import uuid
import qrcode
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class WeddingQrToken(models.Model):
    """
    Manages cryptographic Deep-Link QR Login Tokens for KnotCore.
    Allows Founders, Planners, Vendors, and Clients to authenticate into @Royalknot_bot
    by simply scanning a QR code with zero passwords or manual input.
    """
    _name = 'wedding.qr.token'
    _description = 'KnotCore Deep-Link QR Access Pass'
    _order = 'create_date desc'

    name = fields.Char(string='Pass Label', required=True)
    role = fields.Selection([
        ('founder', 'Agency Founder / Executive'),
        ('planner', 'Lead Wedding Planner'),
        ('vendor', 'Supplier / Vendor Pass'),
        ('client', 'Bride & Groom Client Portal'),
        ('guest', 'Banquet Digital Pass')
    ], string='Authorized Role', required=True, index=True)

    token = fields.Char(
        string='Cryptographic Token',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: uuid.uuid4().hex
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Associated Wedding',
        help='Scope this pass to a specific wedding (required for Vendor and Client passes).'
    )
    user_id = fields.Many2one('res.users', string='Bound System User')
    partner_id = fields.Many2one('res.partner', string='Bound Partner (Vendor or Client)')
    
    deep_link_url = fields.Char(string='Telegram Deep-Link URL', compute='_compute_links', store=True)
    qr_image = fields.Binary(string='QR Code Image (PNG)', compute='_compute_qr_image', store=True)
    is_active = fields.Boolean(string='Active & Valid', default=True)
    usage_count = fields.Integer(string='Times Scanned', default=0)
    last_scanned_at = fields.Datetime(string='Last Scanned Timestamp')

    @api.depends('token', 'role')
    def _compute_links(self):
        bot_username = self.env['ir.config_parameter'].sudo().get_param('knotcore.telegram_bot_username', 'Royalknot_bot')
        for record in self:
            record.deep_link_url = f"https://t.me/{bot_username}?start=AUTH_{record.token}"

    @api.depends('deep_link_url')
    def _compute_qr_image(self):
        for record in self:
            if not record.deep_link_url:
                record.qr_image = False
                continue
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=8,
                border=2,
            )
            qr.add_data(record.deep_link_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="#1a237e", back_color="#ffffff")
            
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            record.qr_image = base64.b64encode(buffer.getvalue())

    @api.model
    def verify_token(self, auth_string):
        """
        Validates an incoming /start AUTH_<token> payload from Telegram or WhatsApp.
        Returns a dictionary of role, bound user, partner, and wedding context.
        """
        if not auth_string:
            return None
        token_str = auth_string.replace('AUTH_', '').strip()
        pass_record = self.search([('token', '=', token_str), ('is_active', '=', True)], limit=1)
        if not pass_record:
            return None
        
        pass_record.usage_count += 1
        pass_record.last_scanned_at = fields.Datetime.now()
        return {
            'role': pass_record.role,
            'wedding_id': pass_record.wedding_id.id if pass_record.wedding_id else None,
            'wedding_name': pass_record.wedding_id.name if pass_record.wedding_id else None,
            'user_id': pass_record.user_id.id if pass_record.user_id else None,
            'partner_name': pass_record.partner_id.name if pass_record.partner_id else (pass_record.user_id.name if pass_record.user_id else 'Authorized User'),
        }
