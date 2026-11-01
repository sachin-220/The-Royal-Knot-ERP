# The Royal Knot — KnotCore Enterprise Luxury Wedding ERP

An enterprise-grade luxury wedding management ecosystem powered by **Odoo 17**, a high-performance **KnotCore Flask backend**, an interactive **React Vite** control suite, and an **Autonomous Dual-Telegram Bot Ecosystem**.

---

## System Architecture

```
                       +------------------------------------------+
                       |           The Royal Knot ERP             |
                       +------------------------------------------+
                                     |               |
             +-----------------------+               +-----------------------+
             |                                                               |
+---------------------------+                                   +---------------------------+
|    Client Experience      |                                   |   Vendor Operations       |
|  (@Royalknot_bot Telegram)|                                   | (@Royalknot_vendors_bot)  |
+---------------------------+                                   +---------------------------+
             |                                                               |
             +-----------------------+               +-----------------------+
                                     |               |
                                     v               v
                       +------------------------------------------+
                       |             KnotCore Backend             |
                       |          (Flask Microservice)            |
                       +------------------------------------------+
                               |              |             |
            +------------------+              |             +------------------+
            |                                 |                                |
            v                                 v                                v
+----------------------+           +----------------------+          +----------------------+
|   Odoo 17 Modules    |           | React Vite Dashboard |          |  Autonomous Engines  |
| - custom_wedding_core|           | - Role-Based Access  |          | - OCR Parser         |
| - custom_wedding_crm |           | - Live Palace Map    |          | - ML Delay Simulator |
| - custom_wedding_budg|           | - 3-Way PO Matching  |          | - Blind Bidding RFP  |
| - custom_wedding_oper|           | - QR Gate Pass Entry |          | - Proposal Generator |
| - custom_wedding_fina|           | - Founder Telemetry  |          | - Dynamic QR Tokens  |
+----------------------+           +----------------------+          +----------------------+
```

---

## Key Modules and Capabilities

### 1. Dual Telegram Bot Automation
- **Customer Intake Gateway (`@Royalknot_bot`)**:
  - Parses couple names, aesthetic preferences, guest count, and budgets using an integrated NLP extractor.
  - Automatically provisions `CRM Lead` records and delivers customized luxury PDF proposals instantly.
- **Vendor B2B Gateway (`@Royalknot_vendors_bot`)**:
  - Secure phone-based OTP verification against verified vendor master records.
  - Enables blind RFP quotation submissions, purchase order confirmations, and arrival status telemetry.

### 2. Odoo 17 Enterprise Modules
- `custom_wedding_core`: Core wedding master data, location registry, curated packages, and ML-driven cost predictors.
- `custom_wedding_crm`: Lead intake pipeline, dynamic QR wristband issuance, and e-signature agreement workflows.
- `custom_wedding_budget`: Budget allocation matrices, Weighted Capability Index (WCI) vendor evaluator, and comparative quote analytics.
- `custom_wedding_operations`: Live palace geo-tracking, incident management, gate check-in logging, and ripple-effect delay simulation engine.
- `custom_wedding_finance`: Milestone billing schedules, automated 3-Way PO Matching, digital guest passes, and founder executive telemetry.

### 3. KnotCore Backend Services (`knotcore_backend/`)
- **Quotation OCR Engine**: Extracts line items, tax IDs, and payment milestones from uploaded vendor PDF/image invoices.
- **Proposal Generation Engine**: Renders bespoke PDF proposals complete with color palettes, itineraries, and estimated cost breakdowns.
- **Big Day Delay Cascade Simulator**: Simulates cascading impacts of ceremony delays on dining, lighting, and load-in schedules.
- **Executive BI Service**: Computes gross margins, vendor risk scores, cash flow forecasting, and multi-wedding portfolio health.

### 4. Interactive React Control Suite (`frontend/`)
- **Role-Based Access Control (RBAC)**: Super Admin vs Financial Manager view segregation.
- **Real-Time Command Centre**: Interactive palace zone layout with live vendor GPS coordinates and incident heatmaps.
- **Anti-Passback QR Scanner**: Rotating HMAC-SHA256 dynamic wristband tokens with 15-second refresh intervals.
- **3-Way PO Matching Matrix**: Line-item reconciliation between Purchase Orders, Goods Delivery Receipts, and Invoices.
- **Vendor Quotation Box Plots**: Empirical pricing distribution analysis across 18 accredited luxury suppliers.

---

## Directory Structure

```
.
├── .gitignore                                 # Strict media & secret exclusion rules
├── README.md                                  # Enterprise documentation
├── poster 1.png                               # Customer QR Portal Gateway Poster
├── vendor poster.png                          # Vendor B2B Portal Gateway Poster
├── custom_wedding_core/                       # Odoo 17 Core Wedding Module
├── custom_wedding_crm/                        # Odoo 17 CRM & Bot Service Module
├── custom_wedding_budget/                     # Odoo 17 Budget & Vendor Evaluation
├── custom_wedding_operations/                 # Odoo 17 Operations & Delay Simulator
├── custom_wedding_finance/                    # Odoo 17 Finance & 3-Way Matching
├── knotcore_backend/                          # Python Flask API & Microservices
│   ├── auth_service.py                        # RBAC & Session Security
│   ├── big_day_schedule_service.py            # Event Timeline & Run-Sheet Engine
│   ├── executive_bi_service.py                # Executive Portfolio Analytics
│   ├── finance_settlement_service.py          # 3-Way PO Settlement Logic
│   ├── geotag_ocr_service.py                  # Live Geotag & Load-in Verification
│   ├── lead_intelligence.py                   # CRM Lead Intelligence
│   ├── proposal_generator.py                  # PDF Proposal Generation
│   ├── quotation_ocr_engine.py                # Vendor Invoice OCR
│   ├── server.py                              # Flask API Entry Point
│   ├── vendor_onboarding_service.py           # B2B Vendor Management
│   └── wedding_coordination_service.py        # Central Wedding Coordination
├── frontend/                                  # React + Vite Interactive Client
│   ├── src/
│   │   ├── components/                        # Full Dashboard & Control Modules
│   │   ├── App.jsx                            # Routing & Global State
│   │   └── index.css                          # Luxury Design System
│   └── public/                                # Public Assets & Proposals
├── n8n/                                       # Workflow Automation Blueprints
└── scripts/                                   # Database Seeding & QR Generation Tools
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Odoo 17.0 Community or Enterprise

### 1. KnotCore Backend Setup
```bash
# Navigate to workspace root
pip install -r requirements.txt # (Flask, ReportLab, Pillow, etc.)

# Start KnotCore Flask Server (default port: 5000)
python -m knotcore_backend.server
```

### 2. Frontend React Dashboard Setup
```bash
cd frontend
npm install
npm run dev
# Dashboard launches at http://localhost:5173
```

### 3. Telegram Bot Activation
```bash
# Configure BOT_TOKEN in environment or configuration
python -m custom_wedding_crm.bot_service.run_bot
```

### 4. Odoo 17 Addons Installation
Add the repository root to your Odoo configuration `addons_path`:
```ini
[options]
addons_path = /path/to/odoo/addons,e:/Users/Welcome/Desktop/Odoo final
```
Update your Odoo app list and install:
- `custom_wedding_core`
- `custom_wedding_crm`
- `custom_wedding_budget`
- `custom_wedding_operations`
- `custom_wedding_finance`

---

## Security and Verification
- **Zero Raw Secrets**: API keys and tokens are managed via environment variables.
- **Anti-Passback Gate Security**: Dynamic QR codes cannot be reused or transferred.
- **Immutable Financial Audit Trail**: Discrepancies in 3-way matching automatically trigger audit flags and lock payouts.

---

## License
Proprietary & Confidential — All rights reserved by The Royal Knot.
