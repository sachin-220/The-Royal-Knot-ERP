# -*- coding: utf-8 -*-
{
    'name': 'KnotCore - Wedding Operations & Master Architecture',
    'version': '1.0.0',
    'category': 'Event Management',
    'summary': 'Central wedding master record and operational engine for The Royal Knot',
    'description': """
KnotCore: Central Wedding Operations Engine
===========================================
Unified master record architecture managing luxury destination weddings in Jaipur and Udaipur.
Features:
- Central 'custom.wedding' model unifying packages, locations, dates, guest counts, and budgets
- Built-in ML regression engine for guest overage forecasting and margin drift alerts
- Native integration with Odoo chatter, activities, and audit trails
- Granular 4-tier Role-Based Access Control (Founder, Finance, Procurement, Planner)
    """,
    'author': 'The Royal Knot Engineering Team',
    'website': 'https://theroyalknot.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
    ],
    'data': [
        'security/wedding_security.xml',
        'security/ir.model.access.csv',
        'data/ir_sequence_data.xml',
        'data/wedding_package_data.xml',
        'data/wedding_location_data.xml',
        'views/wedding_views.xml',
        'views/wedding_package_views.xml',
        'views/wedding_location_views.xml',
        'views/wedding_menus.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
