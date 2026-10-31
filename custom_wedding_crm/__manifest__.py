# -*- coding: utf-8 -*-
{
    'name': 'KnotCore - Wedding CRM & Omnichannel Bot Ingestion',
    'version': '1.0.0',
    'category': 'CRM / Event Management',
    'summary': 'Zero-input lead intake, QR-code deep-link bot gateway, and digital agreements',
    'description': """
KnotCore: Omnichannel CRM & Intelligence Ingestion
==================================================
Eliminates forgotten client inquiries and manual paperwork through automated chat ingestion:
- Multi-Role Telegram / WhatsApp Bot Gateway (@Royalknot_bot) with Deep-Link QR Authentication
- Zero-Input Gemini AI extraction converting natural chat inquiries into structured Odoo CRM leads
- Lead Recovery Intelligence flagging high-value inquiries untouched for 48+ hours
- Digital Service Agreement generation and mobile touch-screen signature capture
- 100% Role-Based Access Control (RBAC) firewall separating Clients, Vendors, Planners, and Founders
    """,
    'author': 'The Royal Knot Engineering Team',
    'website': 'https://theroyalknot.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'crm',
        'mail',
        'custom_wedding_core',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/crm_recovery_cron.xml',
        'views/crm_lead_views.xml',
        'views/wedding_agreement_views.xml',
        'views/qr_portal_views.xml',
        'views/crm_menus.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
