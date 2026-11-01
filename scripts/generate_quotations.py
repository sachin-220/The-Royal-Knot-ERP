# -*- coding: utf-8 -*-
"""
KnotCore Luxury Wedding ERP - Quotation PDF Generator
======================================================
Generates high-definition, luxury-styled PDF quotation documents:
1. Vendor_Quotation_CAT02_Catering.pdf (Supplier commercial quote with itemized scope, plates, rates)
2. Wedding_Master_Quotation.pdf (Master wedding cost estimate and 18-category breakdown)
"""
import os
import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)

def create_vendor_quotation_pdf(output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Premium Luxury Color Palette
    navy_primary = colors.HexColor("#0b132b")
    gold_accent = colors.HexColor("#b8860b")
    slate_dark = colors.HexColor("#1e293b")
    slate_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    green_approved = colors.HexColor("#15803d")

    title_style = ParagraphStyle(
        'VendorTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=navy_primary,
        alignment=0
    )

    sub_style = ParagraphStyle(
        'VendorSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#64748b")
    )

    h2_style = ParagraphStyle(
        'VendorH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=navy_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'VendorBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=slate_dark
    )

    body_bold = ParagraphStyle(
        'VendorBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    legal_style = ParagraphStyle(
        'VendorLegal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#475569")
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>ROYAL RAJPUTANA CATERERS & BANQUETING</b><br/><font size=8 color='#64748b'>ISO 22000:2018 Certified Imperial Hospitality Services</font><br/><font size=7 color='#64748b'>GSTIN: 08AAACR4921N1ZS • FSSAI Lic: 10821005000214</font>", title_style),
            Paragraph("<font size=14 color='#b8860b'><b>COMMERCIAL QUOTATION</b></font><br/><b>Quote Ref:</b> <code>QTE-2026-CAT02-088</code><br/><b>Date:</b> November 1, 2026<br/><b>Valid Until:</b> December 15, 2026", ParagraphStyle('RightMeta', parent=body_style, alignment=2))
        ]
    ]
    header_table = Table(header_data, colWidths=[330, 190])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=gold_accent, spaceBefore=2, spaceAfter=8))

    # 2. Client & Event Specifications Card
    client_info = [
        [
            Paragraph("<b>CLIENT / PROCUREMENT AUTHORITY:</b><br/>The Royal Knot Luxury Wedding Management ERP<br/>Executive Procurement & Lead Planner Command<br/><b>Inquiry Ref:</b> <code>INQ-0011</code> (Aarav & Diya Wedding)<br/><b>Submission Command:</b> <code>/quoteINQ-0011</code>", body_style),
            Paragraph("<b>EVENT & VENUE DETAILS:</b><br/><b>Event:</b> 3-Day Royal Destination Wedding<br/><b>Venue:</b> City Palace & Jagmandir Island, Udaipur<br/><b>Dates:</b> December 18-20, 2026<br/><b>Turnout Scope:</b> 400 Guests (524 Buffet Plates)", body_style)
        ]
    ]
    client_table = Table(client_info, colWidths=[260, 260])
    client_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), slate_light),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(client_table)
    story.append(Spacer(1, 10))

    # 3. Itemized Scope of Work Table
    story.append(Paragraph("<b>ITEMIZED COMMERCIAL SERVICE SCOPE (CATEGORY: CAT-02)</b>", h2_style))
    
    items_data = [
        [
            Paragraph("<b>#</b>", body_bold),
            Paragraph("<b>Service Description & Menu Architecture</b>", body_bold),
            Paragraph("<b>UOM</b>", body_bold),
            Paragraph("<b>Qty</b>", body_bold),
            Paragraph("<b>Rate (INR)</b>", body_bold),
            Paragraph("<b>Total (INR)</b>", body_bold),
        ],
        [
            Paragraph("1", body_style),
            Paragraph("<b>Imperial Rajasthani Royal Thali & Live Heritage Counters</b><br/><font size=7 color='#64748b'>Shahi Dal Baati Churma (5 varieties), Gatte ki Subzi, Ker Sangri dry fruit roast, Jodhpur Mirchi Vada live counter, Bikaneri Papads & Chutneys.</font>", body_style),
            Paragraph("Plates", body_style),
            Paragraph("524", body_bold),
            Paragraph("₹3,200", body_style),
            Paragraph("₹16,76,800", body_bold),
        ],
        [
            Paragraph("2", body_style),
            Paragraph("<b>Awadhi Dum Biryani & Mughlai Gourmet Pavilion</b><br/><font size=7 color='#64748b'>Slow-cooked Dum Biryani in clay handis, Galouti Kebabs with Sheermal, Paneer Tikka Angara, Dal Bukhara simmered 18 hours over charcoal embers.</font>", body_style),
            Paragraph("Plates", body_style),
            Paragraph("524", body_bold),
            Paragraph("₹3,100", body_style),
            Paragraph("₹16,24,400", body_bold),
        ],
        [
            Paragraph("3", body_style),
            Paragraph("<b>Contemporary Pan-Asian & Woodfired Italian Stations</b><br/><font size=7 color='#64748b'>Handcrafted Sushi bar, Truffle Dimsums, Neapolitan sourdough pizzas fired on-site, artisanal Mezze platters with house-made lavash.</font>", body_style),
            Paragraph("Plates", body_style),
            Paragraph("524", body_bold),
            Paragraph("₹1,950", body_style),
            Paragraph("₹10,21,800", body_bold),
        ],
        [
            Paragraph("4", body_style),
            Paragraph("<b>Shahi Royal Dessert Lounge & Molecular Gastronomy</b><br/><font size=7 color='#64748b'>Rabdi Malpua, Mini Ghewar tarts with 24k edible gold leaf, Nitrogen Kulfi station, Belgian chocolate fountains with exotic fruits.</font>", body_style),
            Paragraph("Plates", body_style),
            Paragraph("524", body_bold),
            Paragraph("₹1,482", body_style),
            Paragraph("₹7,77,000", body_bold),
        ],
        [
            Paragraph("5", body_style),
            Paragraph("<b>Uniformed Royal Butler Service & Silverware Crockery</b><br/><font size=7 color='#64748b'>45 dressed stewards, copper chafer units, imported bone china, German glassware, kitchen logistics & zero-waste hygiene clearance.</font>", body_style),
            Paragraph("Package", body_style),
            Paragraph("1", body_bold),
            Paragraph("Included", body_style),
            Paragraph("₹0", body_bold),
        ]
    ]

    items_table = Table(items_data, colWidths=[20, 270, 45, 40, 65, 80])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0b132b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (3, -1), 'CENTER'),
        ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, slate_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))

    # 4. Totals Summary Table
    total_data = [
        ["Subtotal (524 Plates x ₹9,732.82/plate):", "₹51,00,000.00"],
        ["Hospitality GST / Service Cess (Included):", "₹0.00 (Inclusive)"],
        ["TOTAL QUOTED COMMERCIAL PRICE:", "INR ₹51,00,000.00"]
    ]
    total_table = Table(total_data, colWidths=[380, 140])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -2), 9),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 10.5),
        ('TEXTCOLOR', (0, -1), (-1, -1), navy_primary),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#fef3c7")),
        ('BOX', (0, -1), (-1, -1), 1, gold_accent),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 10))

    # 5. Payment Milestones & Terms
    terms_info = [
        [
            Paragraph("<b>PAYMENT MILESTONE SCHEDULE:</b><br/>"
                      "• <b>Milestone 1 (Advance 40%):</b> ₹20,40,000 upon PO Award (locks dates)<br/>"
                      "• <b>Milestone 2 (Progress 40%):</b> ₹20,40,000 7 days prior to Day 1<br/>"
                      "• <b>Milestone 3 (Final 20%):</b> ₹10,20,000 upon 3-Way Match & Bill Clearance", body_style),
            Paragraph("<b>BLIND BIDDING & SETTLEMENT PROTOCOL:</b><br/>"
                      "• Submitted under KnotCore One-Way Mirror Procurement Protocol.<br/>"
                      "• Guaranteed rate protection: zero phantom plate surcharge or hidden transport fees.<br/>"
                      "• All staff adhere to palace security check-in via <code>/checkin</code> and OTP gate clearance.", body_style)
        ]
    ]
    terms_table = Table(terms_info, colWidths=[260, 260])
    terms_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), slate_light),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(terms_table)
    story.append(Spacer(1, 12))

    # 6. Digital Stamp & Authorized Signatory
    sig_data = [
        [
            Paragraph("<b>SUBMITTED BY:</b><br/>Vikramaditya Rathore<br/>Managing Director, Royal Rajputana Caterers<br/>Phone: +91 98290 55443<br/>Email: vikram.caterers@gmail.com", body_style),
            Paragraph("<b>KNOTCORE PROTOCOL VERIFICATION:</b><br/>"
                      "<font color='#15803d'><b>[ONE-WAY MIRROR SECURED]</b></font><br/>"
                      "WCI Suitability Score: <b>94.8% (Tier 1 Preferred)</b><br/>"
                      "Price Anomaly Check: <b>Passed (+0.2 Sigma Benchmark)</b><br/>"
                      "Digital Verification Token: <code>TRK-CAT02-VET-9941</code>", body_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('LINEBEFORE', (1, 0), (1, -1), 1, gold_accent),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(sig_table)

    doc.build(story)
    print(f"[SUCCESS] Generated Vendor Quotation PDF at {output_path}")

def create_master_wedding_quotation_pdf(output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    navy_primary = colors.HexColor("#0b132b")
    gold_accent = colors.HexColor("#aa771c")
    slate_dark = colors.HexColor("#1e293b")
    slate_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    title_style = ParagraphStyle(
        'MasterTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=navy_primary,
        alignment=1
    )

    sub_style = ParagraphStyle(
        'MasterSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=gold_accent,
        alignment=1
    )

    h2_style = ParagraphStyle(
        'MasterH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=navy_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'MasterBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=slate_dark
    )

    body_bold = ParagraphStyle(
        'MasterBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("THE ROYAL KNOT", title_style))
    story.append(Paragraph("LUXURY WEDDING MANAGEMENT ERP • JAIPUR & UDAIPUR", sub_style))
    story.append(Paragraph("<b>MASTER WEDDING COST ESTIMATE & CLIENT QUOTATION</b>", ParagraphStyle('SubSub', parent=sub_style, fontSize=11, textColor=navy_primary, spaceBefore=4)))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=2, color=gold_accent, spaceBefore=2, spaceAfter=8))

    # 2. Wedding Summary Card
    summary_data = [
        [
            Paragraph("<b>CLIENT:</b> Aarav Singhania & Diya Rathore<br/><b>Inquiry Ref:</b> <code>INQ-0011</code><br/><b>Vendor Submission:</b> <code>/quoteINQ-0011</code><br/><b>Destination:</b> Udaipur Heritage Palace Grounds<br/><b>Span:</b> 3 Days (Mehendi, Sangeet, Royal Pheras, Reception)", body_style),
            Paragraph("<b>COMMERCIAL SUMMARY:</b><br/><b>Confirmed Guests:</b> 400 Pax<br/><b>ML Predicted Turnout:</b> 468 Pax (+17% Buffer)<br/><b>Shahi Banqueting Plates:</b> 524 Plates (+31% Buffer)<br/><b>Contracted Total Budget:</b> ₹3,00,00,000 (₹3.00 Cr)", body_style)
        ]
    ]
    summary_table = Table(summary_data, colWidths=[260, 260])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), slate_light),
        ('BOX', (0, 0), (-1, -1), 1, gold_accent),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. 18-Category Budget Breakdown Table
    story.append(Paragraph("<b>18-CATEGORY DYNAMIC BUDGET ALLOCATION & QUOTATION BREAKDOWN</b>", h2_style))
    
    categories = [
        ("CAT-01", "Palace Venue & Heritage Grounds", "₹65,00,000", "21.7%", "Direct Palace Lease", "LOCKED"),
        ("CAT-02", "Royal Catering & Banqueting (524 Plates)", "₹51,00,000", "17.0%", "Royal Rajputana Caterers", "QUOTED"),
        ("CAT-03", "Floral Architecture & Mandap Pavilions", "₹38,00,000", "12.7%", "Petals & Bloom Luxury Floral", "QUOTED"),
        ("CAT-04", "Production, Staging, Trussing & Rigging", "₹24,00,000", "8.0%", "Jaipur Stagecraft & Rigging", "BENCHMARK"),
        ("CAT-05", "Concert Light, Sound & Audio Visual", "₹22,00,000", "7.3%", "Acoustic Mirage Sound Labs", "BENCHMARK"),
        ("CAT-06", "Luxury Photography, Cinema & Drone", "₹18,00,000", "6.0%", "Heritage Lens Fine Art Cinema", "BENCHMARK"),
        ("CAT-07", "Celebrity Artist & Royal Sangeet Band", "₹20,00,000", "6.7%", "Sufi & Bollywood Collective", "BENCHMARK"),
        ("CAT-08", "Guest Hospitality & Chauffeur Fleet", "₹15,00,000", "5.0%", "Desert Star Royal Fleet", "BENCHMARK"),
        ("CAT-09", "Custom Invitations & Gifting Hampers", "₹8,00,000", "2.7%", "Royal Kankotri Calligraphy", "BENCHMARK"),
        ("CAT-10", "Bridal & Groom Couture Styling", "₹10,00,000", "3.3%", "Sabyasachi & Rawal Concierge", "BENCHMARK"),
        ("CAT-11", "Bar Architecture, Mixology & Spirits", "₹7,00,000", "2.3%", "Cocktail Alchemy & Flair", "BENCHMARK"),
        ("CAT-12", "Hair, Makeup & Saree Draping Guild", "₹4,50,000", "1.5%", "Shringar Bridal Artistry", "BENCHMARK"),
        ("CAT-13", "Mehendi Artists & Henna Pavilion", "₹2,50,000", "0.8%", "Marwar Henna Guild", "BENCHMARK"),
        ("CAT-14", "Security, Bouncers & Anti-Duplicate QR", "₹4,00,000", "1.3%", "Fortress Elite Security", "BENCHMARK"),
        ("CAT-15", "Fireworks, Cold Pyro & Sparkler SFX", "₹3,00,000", "1.0%", "SparkleCraft Pyro Systems", "BENCHMARK"),
        ("CAT-16", "Vedic Pundits, Shehnai & Folk Troupes", "₹2,00,000", "0.7%", "Kashi Vedic Purohit Council", "BENCHMARK"),
        ("CAT-17", "Power Backup & 125kVA Generators", "₹2,00,000", "0.7%", "PowerShield DG Systems", "BENCHMARK"),
        ("CAT-18", "Contingency Buffer & Variation Reserve", "₹4,00,000", "1.3%", "KnotCore Variation Ledger", "RESERVED"),
    ]

    cat_table_data = [
        [
            Paragraph("<b>Code</b>", body_bold),
            Paragraph("<b>Procurement Category & Description</b>", body_bold),
            Paragraph("<b>Quoted (INR)</b>", body_bold),
            Paragraph("<b>Weight</b>", body_bold),
            Paragraph("<b>Assigned Partner / Benchmark</b>", body_bold),
            Paragraph("<b>Status</b>", body_bold)
        ]
    ]

    for c in categories:
        cat_table_data.append([
            Paragraph(c[0], body_style),
            Paragraph(c[1], body_style),
            Paragraph(c[2], body_bold),
            Paragraph(c[3], body_style),
            Paragraph(c[4], body_style),
            Paragraph(f"<font color='#15803d'><b>{c[5]}</b></font>", body_style)
        ])

    cat_table = Table(cat_table_data, colWidths=[45, 195, 75, 45, 120, 40])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0b132b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
        ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, slate_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(cat_table)
    story.append(Spacer(1, 8))

    # 4. Total Banner
    total_data = [
        ["TOTAL CONTRACTED WEDDING QUOTATION:", "INR ₹3,00,00,000.00 (₹3.00 Crores)"],
        ["Milestone 1 Advance (30% Confirmed & Held):", "INR ₹90,00,000.00 [HELD TO LOCK PALACE]"]
    ]
    tot_table = Table(total_data, colWidths=[360, 160])
    tot_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
        ('TEXTCOLOR', (0, 0), (-1, 0), navy_primary),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fef3c7")),
        ('BOX', (0, 0), (-1, -1), 1, gold_accent),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tot_table)

    doc.build(story)
    print(f"[SUCCESS] Generated Master Wedding Quotation PDF at {output_path}")

if __name__ == "__main__":
    workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_public = os.path.join(workspace_root, "frontend", "public")
    
    # 1. Vendor Quotation PDF
    vendor_pdf = os.path.join(frontend_public, "Vendor_Quotation_CAT02_Catering.pdf")
    create_vendor_quotation_pdf(vendor_pdf)

    # 2. Master Wedding Quotation PDF
    master_pdf = os.path.join(frontend_public, "Wedding_Master_Quotation.pdf")
    create_master_wedding_quotation_pdf(master_pdf)
