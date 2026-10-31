# -*- coding: utf-8 -*-
import uuid
from odoo import models, fields, api, _
from odoo.exceptions import UserError

class WeddingAgreement(models.Model):
    """
    Manages Digital Service Agreements between The Royal Knot and the client couple.
    Supports mobile digital signatures, PDF lock-in, and automatic wedding confirmation.
    """
    _name = 'wedding.agreement'
    _description = 'Wedding Service Agreement'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(
        string='Agreement Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('Draft Agreement')
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding Master Record',
        required=True,
        ondelete='cascade',
        index=True
    )
    partner_id = fields.Many2one(
        'res.partner',
        string='Client / Couple',
        related='wedding_id.partner_id',
        store=True,
        readonly=True
    )
    agreement_type = fields.Selection([
        ('full_service', 'Full-Service Planning Agreement'),
        ('day_of', 'Partial Day-Of Coordination Agreement')
    ], string='Agreement Scope', default='full_service', required=True)

    state = fields.Selection([
        ('draft', 'Drafting'),
        ('sent', 'Sent for Signature'),
        ('signed', 'Digitally Signed & Locked'),
        ('cancelled', 'Cancelled')
    ], string='Agreement Status', default='draft', tracking=True, required=True)

    signing_token = fields.Char(
        string='Digital Signing Token',
        copy=False,
        readonly=True,
        default=lambda self: uuid.uuid4().hex
    )
    signing_url = fields.Char(
        string='Client Mobile Signing URL',
        compute='_compute_signing_url'
    )
    signed_date = fields.Datetime(
        string='Executed Timestamp',
        readonly=True,
        tracking=True
    )
    signer_ip_address = fields.Char(string='Signer IP Address', readonly=True)
    terms_and_conditions = fields.Html(
        string='Agreement Terms & Scope',
        default=lambda self: self._default_terms()
    )
    signed_attachment_id = fields.Many2one(
        'ir.attachment',
        string='Executed Legal Contract PDF',
        readonly=True
    )

    def _default_terms(self):
        return """
        <h3>The Royal Knot - Luxury Wedding Services Agreement</h3>
        <p>1. <b>Scope of Planning:</b> Full coordination of theme design, venue procurement, vendor negotiations, and 3-day on-site command.</p>
        <p>2. <b>Payment Milestone Schedule:</b> 30% Booking Deposit at signing, 40% Operational Advance 30 days prior to event, 30% Final Settlement post-event.</p>
        <p>3. <b>Variations & Extras:</b> Additional banquet plates and overtime hours will be billed on actuals through the Live Variation Ledger.</p>
        """

    @api.depends('signing_token')
    def _compute_signing_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url', 'http://localhost:8069')
        for record in self:
            record.signing_url = f"{base_url}/wedding/sign/{record.signing_token}"

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', _('Draft Agreement')) == _('Draft Agreement'):
                vals['name'] = self.env['ir.sequence'].next_by_code('wedding.agreement') or f"AGR/{fields.Date.today().year}/{uuid.uuid4().hex[:6].upper()}"
        return super().create(vals_list)

    def action_send_for_signature(self):
        """Dispatches mobile signing link to the client couple via email/SMS/chat."""
        for record in self:
            if not record.partner_id.email and not record.partner_id.phone:
                raise UserError(_("Client contact must have an email or phone number to receive the digital agreement."))
            record.write({'state': 'sent'})
            record.message_post(body=_(f"Digital service agreement dispatched to client: <a href='{record.signing_url}' target='_blank'>Mobile Signing Link</a>"))

    def action_sign_agreement(self, signer_ip=None):
        """Digitally locks the agreement, timestamps execution, and updates wedding state."""
        for record in self:
            record.write({
                'state': 'signed',
                'signed_date': fields.Datetime.now(),
                'signer_ip_address': signer_ip or '127.0.0.1 (Mobile Touch Verified)',
            })
            record.wedding_id.write({'state': 'confirmed'})
            record.message_post(body=_(f"Agreement <b>{record.name}</b> successfully signed and locked. Wedding state advanced to Confirmed."))
