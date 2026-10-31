# -*- coding: utf-8 -*-
{
    'name': 'KnotCore - Luxury Wedding Budget & Vendor Intelligence',
    'version': '17.0.1.0.0',
    'category': 'Events/Weddings',
    'summary': '18-Category Budget Allocation, AI Document OCR, Price Anomaly Detection, Multi-Factor Vendor Scoring & 1-Click Purchase Order Generation',
    'sequence': 12,
    'author': 'The Royal Knot Luxury Weddings',
    'website': 'https://www.royalknot.in',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'mail',
        'purchase',
        'custom_wedding_core',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/budget_category_data.xml',
        'views/budget_category_views.xml',
        'views/budget_allocation_views.xml',
        'views/vendor_quote_views.xml',
        'views/budget_menus.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
