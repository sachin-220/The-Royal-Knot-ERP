"""
Generate high-resolution scannable QR codes for KnotCore:
1. scan.png -> Client inquiry entry into @Royalknot_bot
2. vendor_scan.png -> Vendor procurement entry into @Royalknot_bot (One-Way Mirror)
"""
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont

def create_styled_qr(data: str, title: str, subtitle: str, output_path: str, color="#0b132b"):
    # Generate QR Code
    qr = qrcode.QRCode(
        version=3,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=3,
    )
    qr.add_data(data)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color=color, back_color="white").convert("RGB")
    qr_w, qr_h = qr_img.size

    # Create canvas with header and footer banner
    canvas_w = qr_w + 60
    canvas_h = qr_h + 140
    canvas = Image.new("RGB", (canvas_w, canvas_h), "white")
    draw = ImageDraw.Draw(canvas)

    # Paste QR in center
    canvas.paste(qr_img, (30, 70))

    # Draw luxury border
    draw.rectangle([(8, 8), (canvas_w - 9, canvas_h - 9)], outline="#d4af37", width=3)
    draw.rectangle([(14, 14), (canvas_w - 15, canvas_h - 15)], outline="#0b132b", width=1)

    # Add text
    try:
        font_title = ImageFont.truetype("arial.ttf", 22)
        font_sub = ImageFont.truetype("arial.ttf", 13)
        font_footer = ImageFont.truetype("arial.ttf", 12)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # Draw Title
    draw.text((canvas_w // 2, 32), title, fill="#0b132b", font=font_title, anchor="mm")
    draw.text((canvas_w // 2, 54), subtitle, fill="#aa771c", font=font_sub, anchor="mm")

    # Draw Footer
    draw.text((canvas_w // 2, canvas_h - 45), "Scan with your Phone Camera", fill="#475569", font=font_footer, anchor="mm")
    draw.text((canvas_w // 2, canvas_h - 25), "Redirects to @Royalknot_bot", fill="#0b132b", font=font_footer, anchor="mm")

    # Save image
    canvas.save(output_path, "PNG")
    print(f"[SUCCESS] Saved QR code to {output_path}")

if __name__ == "__main__":
    workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_public = os.path.join(workspace_root, "frontend", "public")
    os.makedirs(frontend_public, exist_ok=True)

    # 1. Client Inquiry QR: scan.png
    client_url = "https://t.me/Royalknot_bot?start=client_enquiry"
    client_dest1 = os.path.join(workspace_root, "scan.png")
    client_dest2 = os.path.join(frontend_public, "scan.png")
    
    create_styled_qr(
        client_url, 
        "THE ROYAL KNOT", 
        "Client Wedding Enquiry | Unified Bot", 
        client_dest1
    )
    create_styled_qr(
        client_url, 
        "THE ROYAL KNOT", 
        "Client Wedding Enquiry | Unified Bot", 
        client_dest2
    )

    # 2. Vendor Portal QR: vendor_scan.png
    vendor_url = "https://t.me/Royalknot_bot?start=vendor_portal"
    vendor_dest1 = os.path.join(workspace_root, "vendor_scan.png")
    vendor_dest2 = os.path.join(frontend_public, "vendor_scan.png")

    create_styled_qr(
        vendor_url, 
        "VENDOR PROCUREMENT", 
        "One-Way Mirror Blind Bidding Group", 
        vendor_dest1,
        color="#1e293b"
    )
    create_styled_qr(
        vendor_url, 
        "VENDOR PROCUREMENT", 
        "One-Way Mirror Blind Bidding Group", 
        vendor_dest2,
        color="#1e293b"
    )
