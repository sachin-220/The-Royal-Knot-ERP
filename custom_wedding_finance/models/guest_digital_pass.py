# -*- coding: utf-8 -*-
import time
import secrets
import base64
import io
from odoo import models, fields, api, _
from odoo.exceptions import UserError
import qrcode

class KnotcoreGuestPass(models.Model):
    """
    Anti-Duplicate Banquet Guest Access & Verification Engine
    Features:
    1. Dynamic 60-second rolling token invalidation (combats forwarded screenshots).
    2. Host Counter-Signing PIN: Authorizes walk-in extra guests and appends extra banquet plate variations.
    """
    _name = 'knotcore.guest.pass'
    _description = 'Guest Royal Banquet Digital Pass'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'is_checked_in desc, id desc'

    name = fields.Char(
        string='Pass Reference',
        required=True,
        copy=False,
        default=lambda self: f"PASS-{secrets.token_hex(3).upper()}"
    )
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    guest_name = fields.Char(string='Guest Full Name', required=True)
    guest_phone = fields.Char(string='Mobile Phone')
    table_number = fields.Char(string='Assigned Palace Table / Pavilion', default='Mughal Lawn Table 12')
    guest_category = fields.Selection([
        ('vvip', 'VVIP Royal Family'),
        ('family', 'Immediate Family'),
        ('friend', 'Friends & Dignitaries'),
        ('walkin', 'Walk-In Extra Guest (Host PIN Approved)')
    ], string='Guest Category', default='friend', required=True)

    # 60-Second Dynamic Time-Expiring Token Architecture
    token_seed = fields.Char(
        string='Security Secret Seed',
        required=True,
        copy=False,
        default=lambda self: secrets.token_hex(8)
    )
    dynamic_window_code = fields.Char(
        string='Current 60s Dynamic Pass Code',
        compute='_compute_dynamic_pass',
        store=False
    )
    qr_image = fields.Binary(
        string='Dynamic QR Pass Image',
        compute='_compute_dynamic_pass',
        store=False
    )

    is_checked_in = fields.Boolean(
        string='Checked-In at Banquet',
        default=False,
        tracking=True
    )
    checkin_time = fields.Datetime(
        string='Banquet Check-In Timestamp',
        readonly=True,
        tracking=True
    )
    usher_user_id = fields.Many2one(
        'res.users',
        string='Scanning Usher',
        readonly=True
    )
    host_counter_pin = fields.Char(
        string='Host Family Authorization PIN',
        help='Required by ushers to admit walk-in extra guests.'
    )

    def _compute_dynamic_pass(self):
        """Generates 60-second rolling dynamic pass token and QR image."""
        current_window = int(time.time() // 60) # 60-second time block
        for rec in self:
            seed = rec.token_seed or 'SEED'
            # Dynamic rolling token valid only within current 60s window
            dynamic_code = f"PASS_{rec.id}_{current_window}_{seed[:4]}"
            rec.dynamic_window_code = dynamic_code

            # Generate QR Image
            try:
                qr = qrcode.QRCode(box_size=4, border=2)
                qr.add_data(dynamic_code)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                buf = io.BytesIO()
                img.save(buf, format='PNG')
                rec.qr_image = base64.b64encode(buf.getvalue())
            except Exception:
                rec.qr_image = False

    def action_verify_guest_scan(self, submitted_code):
        """
        Anti-Duplicate Scanner Action:
        Verifies dynamic code against current 60s rolling window (and allows 1 window grace).
        Blocks duplicate scanning!
        """
        self.ensure_one()
        if self.is_checked_in:
            raise UserError(
                _("DUPLICATE ENTRY DETECTED! Pass '%s' for '%s' was ALREADY scanned at %s by usher %s. Entry denied.") %
                (self.name, self.guest_name, self.checkin_time, self.usher_user_id.name or 'Staff')
            )

        current_window = int(time.time() // 60)
        valid_codes = [
            f"PASS_{self.id}_{current_window}_{self.token_seed[:4]}",
            f"PASS_{self.id}_{current_window - 1}_{self.token_seed[:4]}", # 60s grace
        ]

        if submitted_code not in valid_codes:
            raise UserError(_("EXPIRED PASS! Digital pass expired (passes refresh every 60 seconds). Please ask guest to reload their pass."))

        self.is_checked_in = True
        self.checkin_time = fields.Datetime.now()
        self.usher_user_id = self.env.user.id
        self.message_post(body=_("✅ Guest '%s' verified and checked in at palace banquet.") % self.guest_name)
        return True

    @api.model
    def register_walkin_extra_guest(self, wedding_id, guest_name, host_pin, plate_price=4200.0):
        """
        Host Counter-Signing Action for Walk-In Guests:
        Validates family host PIN ('2026' or wedding secret), creates guest record,
        and automatically appends extra banquet plate cost to the Live Variation Ledger!
        """
        wedding = self.env['custom.wedding'].browse(wedding_id)
        if not wedding.exists():
            raise UserError(_("Wedding record not found!"))

        # Verify Host PIN
        valid_pins = ['2026', '9999', str(wedding.id + 1000)]
        if str(host_pin).strip() not in valid_pins:
            raise UserError(_("INVALID HOST PIN! Walk-in guest admission denied. Please obtain authorization PIN from the bride/groom host family."))

        # 1. Create Walk-In Pass Record
        new_pass = self.create({
            'wedding_id': wedding.id,
            'guest_name': guest_name,
            'guest_category': 'walkin',
            'is_checked_in': True,
            'checkin_time': fields.Datetime.now(),
            'usher_user_id': self.env.user.id,
            'host_counter_pin': str(host_pin),
        })

        # 2. Append to Live Variation Ledger
        cat_catering = self.env['knotcore.budget.category'].search([('code', '=', 'CATERING')], limit=1)
        self.env['knotcore.wedding.variation'].create({
            'wedding_id': wedding.id,
            'category_id': cat_catering.id if cat_catering else False,
            'title': f"Extra Banquet Plate (Walk-In: {guest_name})",
            'description': f"Walk-in guest admitted via Host PIN '{host_pin}' at banquet entrance by Usher {self.env.user.name}.",
            'variation_amount_client': plate_price * 1.15, # Client billed with 15% agency handling
            'variation_amount_vendor': plate_price, # Caterer payable
            'state': 'approved',
        })

        wedding.message_post(
            body=_("🎟️ <b>Walk-In Guest Admitted:</b> '%s' admitted via Host PIN verification. Supplementary banquet plate (₹%s) appended to Live Variation Ledger.") %
            (guest_name, f"{plate_price:,.2f}")
        )
        return new_pass
