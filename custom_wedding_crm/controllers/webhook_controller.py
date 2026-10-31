# -*- coding: utf-8 -*-
import json
from odoo import http, fields, _
from odoo.http import request, Response
from ..bot_service.nlp_extractor import GeminiLeadExtractor

class WeddingWebController(http.Controller):
    """
    HTTP Controller handling:
    1. External Webhooks (WhatsApp/n8n/Telegram ingestion)
    2. Mobile Touch Digital Signing Portal for couples
    """

    @http.route('/api/wedding/webhook', type='json', auth='none', methods=['POST'], csrf=False)
    def handle_external_webhook(self, **kwargs):
        """
        Receives external webhook payloads from WhatsApp Cloud API, n8n, or mobile portals.
        Extracts structured parameters via Gemini AI and creates an unlosable crm.lead.
        """
        try:
            data = request.jsonrequest
            raw_text = data.get('message', '') or data.get('text', '')
            sender_name = data.get('sender_name', 'Prospective Couple')
            phone = data.get('phone', '')

            # Extract via Gemini
            extracted = GeminiLeadExtractor.extract_wedding_enquiry(raw_text, sender_name)
            
            # Sudo environment to create crm.lead
            env = request.env(user=request.env.ref('base.user_admin'))
            lead = env['crm.lead'].sudo().create({
                'name': f"{extracted.get('client_name')} - {extracted.get('wedding_theme')} Wedding",
                'partner_name': extracted.get('client_name'),
                'contact_name': extracted.get('client_name'),
                'phone': phone,
                'destination': extracted.get('destination', 'jaipur'),
                'guest_count': extracted.get('guest_count', 400),
                'budget_total': extracted.get('budget_total', 25000000.0),
                'wedding_theme': extracted.get('wedding_theme', 'Royal Heritage'),
                'lead_channel': data.get('channel', 'whatsapp'),
                'description': f"Original Incoming Message:\n{raw_text}",
            })

            return {
                'status': 'success',
                'lead_id': lead.id,
                'lead_reference': lead.name,
                'conversion_score': lead.conversion_probability_score,
                'message': 'Enquiry captured and converted to CRM Lead successfully.'
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    @http.route('/wedding/sign/<string:token>', type='http', auth='public', methods=['GET', 'POST'], csrf=False)
    def render_digital_signing_portal(self, token, **kwargs):
        """
        Mobile-optimized digital agreement signing portal for the couple.
        Allows digital signature capture directly on smartphone touchscreen.
        """
        agreement = request.env['wedding.agreement'].sudo().search([
            ('signing_token', '=', token)
        ], limit=1)

        if not agreement:
            return Response("<h3>Invalid or expired signing link. Please contact The Royal Knot.</h3>", status=404)

        if request.httprequest.method == 'POST':
            # Sign agreement
            agreement.action_sign_agreement(signer_ip=request.httprequest.remote_addr)
            html_success = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Agreement Signed - The Royal Knot</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #faf7f2; color: #2c2523; padding: 24px; text-align: center; }}
                    .card {{ max-width: 500px; margin: 40px auto; background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-top: 6px solid #b8860b; }}
                    h1 {{ color: #b8860b; font-size: 24px; margin-bottom: 8px; }}
                    p {{ line-height: 1.6; color: #555; }}
                    .badge {{ background: #e8f5e9; color: #2e7d32; padding: 6px 14px; border-radius: 20px; font-weight: 600; display: inline-block; margin-bottom: 16px; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="badge"> Digitally Executed &amp; Locked</div>
                    <h1>Royal Service Agreement Confirmed</h1>
                    <p>Dear <b>{agreement.partner_id.name}</b>,</p>
                    <p>Your luxury wedding agreement for <b>{agreement.wedding_id.name}</b> has been signed successfully. Our planning team has initiated your 28-task master event graph.</p>
                    <p style="font-size: 13px; color: #888;">Digital Timestamp: {fields.Datetime.now()}<br>Verification Hash: {token[:12]}...</p>
                </div>
            </body>
            </html>
            """
            return Response(html_success, content_type='text/html')

        # GET Request: Display agreement terms and signature form
        html_form = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign Agreement - The Royal Knot</title>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfbf7; color: #1f1b18; padding: 16px; margin: 0; }}
                .container {{ max-width: 540px; margin: 20px auto; background: #fff; padding: 28px; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); border: 1px solid #ebdccb; }}
                .header {{ text-align: center; border-bottom: 2px solid #f1e6d7; padding-bottom: 16px; margin-bottom: 20px; }}
                h2 {{ color: #b8860b; margin: 0 0 6px 0; font-size: 22px; }}
                .tag {{ color: #7a6e65; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }}
                .terms-box {{ background: #faf8f5; border: 1px solid #ecd9c6; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6; max-height: 220px; overflow-y: auto; margin-bottom: 20px; }}
                .btn {{ background: #b8860b; color: #fff; border: none; padding: 14px 20px; border-radius: 8px; font-size: 16px; font-weight: 600; width: 100%; cursor: pointer; }}
                .btn:hover {{ background: #966d09; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="tag">The Royal Knot · Luxury Wedding Planning</div>
                    <h2>Digital Service Agreement</h2>
                    <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">Wedding Reference: <b>{agreement.wedding_id.name}</b></p>
                </div>
                <div class="terms-box">
                    {agreement.terms_and_conditions}
                </div>
                <form method="POST">
                    <p style="font-size: 13px; color: #666;">By tapping below, you agree to The Royal Knot terms, 3-stage milestone billing, and confirm authorization on mobile.</p>
                    <button type="submit" class="btn">️ Digitally Sign &amp; Confirm Wedding</button>
                </form>
            </div>
        </body>
        </html>
        """
        return Response(html_form, content_type='text/html')
