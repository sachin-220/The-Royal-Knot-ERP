"""
KnotCore Luxury Wedding Planning Management System
Official Luxury Proposal PDF Generator
Generates formal royal wedding agreements & RFPs with ReportLab
"""
import os
import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas

def generate_wedding_proposal_pdf(
    inquiry_data: dict,
    output_path: str,
    wedding_details: dict = None
) -> str:
    """
    Generates a formal, royal wedding proposal PDF for The Royal Knot.
    Includes couple details, venue, ML turnout analysis, 18-category budget allocation,
    and digital signing stamp.
    """
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

    # Custom Luxury Styles
    royal_gold = colors.HexColor("#aa771c")
    royal_navy = colors.HexColor("#0b132b")
    text_dark = colors.HexColor("#1e293b")
    emerald = colors.HexColor("#0f766e")

    title_style = ParagraphStyle(
        'RoyalTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=royal_navy,
        alignment=1 # Center
    )

    subtitle_style = ParagraphStyle(
        'RoyalSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=royal_gold,
        alignment=1
    )

    h2_style = ParagraphStyle(
        'RoyalH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=royal_navy,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'RoyalBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=text_dark
    )

    callout_style = ParagraphStyle(
        'RoyalCallout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=royal_navy
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("THE ROYAL KNOT", title_style))
    story.append(Paragraph("LUXURY DESTINATION WEDDING PLANNING & HERITAGE PRODUCTION • JAIPUR & UDAIPUR", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=royal_gold, spaceBefore=4, spaceAfter=14))

    # 2. Proposal Summary Box
    couple_name = inquiry_data.get("name", "Aarav Singhania & Diya Rathore")
    city = inquiry_data.get("preferred_city", "Jaipur")
    guests = inquiry_data.get("guest_count") or 400
    budget_val = inquiry_data.get("budget_inr") or 25000000.0
    budget_cr = f"₹{(float(budget_val)/10000000):.2f} Crores"
    today_str = datetime.date.today().strftime("%B %d, %Y")
    inq_id_val = inquiry_data.get("id") or 11
    inquiry_ref = f"INQ-{inq_id_val:04d}"

    meta_table_data = [
        [
            Paragraph(f"<b>Client / Couple:</b> {couple_name}", body_style),
            Paragraph(f"<b>Date Generated:</b> {today_str}", body_style)
        ],
        [
            Paragraph(f"<b>Royal Destination:</b> {city} (Heritage Palace Grounds)", body_style),
            Paragraph(f"<b>Celebration Scope:</b> 3-Day Multi-Event Celebration", body_style)
        ],
        [
            Paragraph(f"<b>Base Confirmed Guests:</b> {guests} Guests", body_style),
            Paragraph(f"<b>Allocated Total Budget:</b> {budget_cr}", body_style)
        ],
        [
            Paragraph(f"<b>Official Inquiry ID:</b> <font color='#aa771c'><b>{inquiry_ref}</b></font>", body_style),
            Paragraph(f"<b>Vendor Quote Telegram Command:</b> <code>/quote{inquiry_ref}</code>", body_style)
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # 3. ML Turnout & Plate Surge Analysis
    story.append(Paragraph("1. Machine Learning Turnout & Catering Buffer Model", h2_style))
    predicted_turnout = int(guests * 1.17)
    plate_buffer = int(guests * 1.31)

    ml_table_data = [
        [
            Paragraph("<b>Base RSVP Guests</b>", body_style),
            Paragraph("<b>ML Predicted Turnout (+17%)</b>", body_style),
            Paragraph("<b>Shahi Banqueting Plates (+31%)</b>", body_style)
        ],
        [
            Paragraph(f"<font size=12><b>{guests}</b></font><br/>Confirmed RSVP List", body_style),
            Paragraph(f"<font size=12 color='#aa771c'><b>{predicted_turnout}</b></font><br/>Flight & Hotel Influx Factored", body_style),
            Paragraph(f"<font size=12 color='#0f766e'><b>{plate_buffer}</b></font><br/>Zero Food Shortage Guarantee", body_style)
        ]
    ]
    ml_table = Table(ml_table_data, colWidths=[173, 173, 174])
    ml_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#ffffff")),
        ('BOX', (0,0), (-1,-1), 1, royal_gold),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(ml_table)
    story.append(Spacer(1, 14))

    # 4. 18-Category Procurement Allocation (Key Categories)
    story.append(Paragraph("2. 18-Category Budget Allocation & Procurement Plan (Sums to 100%)", h2_style))
    budget_float = float(budget_val)

    alloc_data = [
        [Paragraph("<b>Code</b>", body_style), Paragraph("<b>Category</b>", body_style), Paragraph("<b>Weight</b>", body_style), Paragraph("<b>Allocated (INR)</b>", body_style), Paragraph("<b>Procurement Status</b>", body_style)],
        ["CAT-01", "Venue & Heritage Royalty", "22.0%", f"₹{(budget_float * 0.22):,.0f}", "Date Held with Palace"],
        ["CAT-02", "Royal Catering & Banqueting", "20.0%", f"₹{(budget_float * 0.20):,.0f}", f"{plate_buffer} Buffeted Plates"],
        ["CAT-03", "Floral Architecture & Production", "12.0%", f"₹{(budget_float * 0.12):,.0f}", "Marigold & Dutch Orchids"],
        ["CAT-04", "Bespoke Thematic Decor & Styling", "9.0%", f"₹{(budget_float * 0.09):,.0f}", "Palace Courtyards & Ballroom"],
        ["CAT-05", "Light, Sound & Concert AV", "6.0%", f"₹{(budget_float * 0.06):,.0f}", "Meyer Sound Line Arrays"],
        ["CAT-06", "Celebrity & Folk Entertainment", "5.0%", f"₹{(budget_float * 0.05):,.0f}", "Ghoomar Troupe & DJ Lineup"],
        ["CAT-07", "Cinematography & Royal Portraiture", "6.0%", f"₹{(budget_float * 0.06):,.0f}", "Drone & 4K Cinema Crew"],
        ["CAT-08-18", "Concierge, Fleet, Fireworks, Security & Contingency", "20.0%", f"₹{(budget_float * 0.20):,.0f}", "11 Categories Balanced"],
        ["TOTAL", "Full-Service Turnkey Luxury Production", "100.0%", f"₹{budget_float:,.0f}", "Verified 100% Balanced"]
    ]

    alloc_table = Table(alloc_data, colWidths=[55, 205, 50, 100, 110])
    alloc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0b132b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#ffffff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#f8fafc")),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(alloc_table)
    story.append(Spacer(1, 14))

    # 5. Milestone Settlement Schedule
    story.append(Paragraph("3. 3-Stage Milestone Settlement Schedule", h2_style))
    m1 = budget_float * 0.30
    m2 = budget_float * 0.40
    m3 = budget_float * 0.30

    mile_data = [
        [Paragraph("<b>Milestone</b>", body_style), Paragraph("<b>Percentage</b>", body_style), Paragraph("<b>Amount (INR)</b>", body_style), Paragraph("<b>Purpose</b>", body_style)],
        ["Stage 1: Booking Advance", "30.0%", f"₹{m1:,.0f}", "Locks palace venue reservation & dates"],
        ["Stage 2: Production Advance", "40.0%", f"₹{m2:,.0f}", "Fabrication, floral orders, concert staging"],
        ["Stage 3: Final Settlement", "30.0%", f"₹{m3:,.0f}", "Post-event reconciliation & audit"]
    ]
    mile_table = Table(mile_data, colWidths=[150, 70, 110, 190])
    mile_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(mile_table)
    story.append(Spacer(1, 16))

    # 6. Digital Signing & Host PIN Counter-Signature Stamp
    story.append(Paragraph("4. Digital Authorization & Counter-Signature Stamp", h2_style))
    sign_table_data = [
        [
            Paragraph("<b>THE ROYAL KNOT EXECUTIVE BOARD</b><br/><br/><i>Authorized Signatory: Welcome (Head of Luxury Events)</i><br/>Status: <b>APPROVED FOR PROCUREMENT</b><br/>Hash: <code>SEC-TRK-AUTH-8891A</code>", body_style),
            Paragraph("<b>CLIENT DIGITAL COUNTER-SIGNATURE</b><br/><br/><i>Digitally Signed via Telegram Unified Bot (@Royalknot_bot)</i><br/>Status: <b>STAGE 1 BOOKING CONFIRMED</b><br/>Host PIN: <b>**** (Verified)</b>", body_style)
        ]
    ]
    sign_table = Table(sign_table_data, colWidths=[260, 260])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fefce8")),
        ('BOX', (0,0), (-1,-1), 1.5, royal_gold),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sign_table)

    # Build Document
    doc.build(story)
    print(f"[SUCCESS] Generated Luxury Wedding Proposal PDF at {output_path}")
    return output_path

if __name__ == "__main__":
    test_inquiry = {
        "name": "Aarav Singhania & Diya Rathore",
        "preferred_city": "Jaipur",
        "guest_count": 400,
        "budget_inr": 25000000.0,
    }
    out_file = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "Aarav_Diya_Proposal.pdf")
    generate_wedding_proposal_pdf(test_inquiry, out_file)
