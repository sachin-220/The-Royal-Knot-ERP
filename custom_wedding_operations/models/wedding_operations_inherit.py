# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class CustomWeddingOperationsInherit(models.Model):
    """
    Extends custom.wedding with Dynamic Operational Task Graphs,
    Ripple-Effect Simulator, Gate Security Check-In Passes, and Incident Desk.
    """
    _inherit = 'custom.wedding'

    task_ids = fields.One2many(
        'custom.wedding.task',
        'wedding_id',
        string='Operational Milestone Tasks'
    )
    delay_simulator_ids = fields.One2many(
        'knotcore.delay.simulator',
        'wedding_id',
        string='Delay Scenarios'
    )
    gate_checkin_ids = fields.One2many(
        'knotcore.vendor.gate.checkin',
        'wedding_id',
        string='Palace Gate Check-Ins'
    )
    incident_ids = fields.One2many(
        'knotcore.wedding.incident',
        'wedding_id',
        string='Emergency Incidents'
    )
    run_sheet_ids = fields.One2many(
        'knotcore.wedding.run.sheet',
        'wedding_id',
        string='Wedding-Day Run Sheet'
    )

    open_task_count = fields.Integer(
        string='Open Tasks',
        compute='_compute_operations_counters'
    )
    incident_count = fields.Integer(
        string='Active Incidents',
        compute='_compute_operations_counters'
    )
    unconfirmed_vendor_count = fields.Integer(
        string='Unconfirmed Gate Passes',
        compute='_compute_operations_counters'
    )

    @api.depends('task_ids.state', 'incident_ids.state', 'gate_checkin_ids.status')
    def _compute_operations_counters(self):
        for rec in self:
            rec.open_task_count = len(rec.task_ids.filtered(lambda t: t.state in ['todo', 'in_progress', 'blocked']))
            rec.incident_count = len(rec.incident_ids.filtered(lambda i: i.state in ['reported', 'dispatched']))
            rec.unconfirmed_vendor_count = len(rec.gate_checkin_ids.filtered(lambda g: g.status in ['pending', 'delayed_alert']))

    def action_generate_operational_task_graph(self):
        """
        Dynamic Task Graph Constructor:
        Auto-generates 25+ structured operational milestones across 4 distinct phases
        with predecessor linking and date calculations.
        """
        self.ensure_one()
        # Remove existing tasks to regenerate clean graph
        self.task_ids.unlink()

        # 25+ Structured Operational Milestones across 4 distinct phases
        milestone_templates = [
            # Phase 1: Planning & Venue Buyout (T-180 to T-90)
            ('Execute Palace Venue Master Buyout & Courtyard Contracts', 'planning', 180, 10, 'Secures main heritage lawns, banqueting suites, and guest accommodation.'),
            ('Confirm Royal Wedding Astrological Muhurat & Priest Consultation', 'planning', 170, 20, 'Finalizes Vedic ceremony hours with head palace priest.'),
            ('Engage Bespoke Floral & Palace Scenography Designers', 'planning', 160, 30, 'Drafts 3D renders for grand mandap, floral pavilions, and lighting.'),
            ('Design Couple Custom Royal Crest & Calligraphed Invitations', 'planning', 150, 40, 'Produces heirloom box suites with wax seals.'),
            ('Draft Master Guest List & Destination RSVP Management System', 'planning', 140, 50, 'Establishes guest dietary preferences, arrivals, and suite allocations.'),
            ('Dispatch Luxury Wedding Save-The-Dates & Travel Concierge Guide', 'planning', 120, 60, 'Sends digital concierge microsite and flight schedules.'),
            ('Confirm Palace Curfew Agreements & IPRS/PPL Sound Permissions', 'planning', 100, 70, 'Submits municipal clearance and police NOC for outdoor music.'),

            # Phase 2: Vendor Contracting & Menu Tasting (T-90 to T-30)
            ('Execute 35-Course Royal Banquet Degustation & Menu Selection', 'vendor', 90, 80, 'Tasting session with couple covering royal Rajasthani and global delicacies.'),
            ('Contract Royal Rajasthani Brass Band, Tusker Elephant & Vintage Cars', 'vendor', 80, 90, 'Books ceremonial baraat procession assets.'),
            ('Finalize Master Photography & Aerial Cinematic Drone Crew', 'vendor', 75, 100, 'Confirms shot lists, heirloom album specs, and live stream link.'),
            ('Conduct Sound Engineering & 125kVA Generator Power Load Audit', 'vendor', 60, 110, 'Audits electrical phase distribution across palace lawns.'),
            ('Approve Bridal Makeup & Family Salon Styling Schedules', 'vendor', 50, 120, 'Assigns master stylists and suite dressing times.'),
            ('Contract Celebrity Sangeet Artists & Club DJ Production Team', 'vendor', 45, 130, 'Finalizes technical riders, audio consoles, and green room hospitality.'),
            ('Curate Luxury Welcome Hampers & Silver Ittar Favors', 'vendor', 35, 140, 'Procures artisanal sweets, silk shawls, and emergency recovery kits.'),

            # Phase 3: Production, Sound Permits & Stage Setup (T-30 to T-2)
            ('Complete Second Milestone Client Invoice Audit & Advance Clearing', 'production', 30, 150, 'Verifies 40% operational advance receipt.'),
            ('Issue Palace Gate Security Passes & Dynamic OTP Codes to Suppliers', 'production', 20, 160, 'Generates gate passes and service dock delivery slots.'),
            ('Conduct On-Site Palace Grounds Technical Walkthrough with Leads', 'production', 14, 170, 'Inspects staging lawns, fire safety equipment, and emergency exits.'),
            ('Erect Heavy Trussing, LED Wall Staging & Mandap Pillars', 'production', 5, 180, 'Constructs central heritage mandap and sound towers.'),
            ('Deploy Waterproof Rain Canopies & Climate Misting Fans', 'production', 3, 190, 'Contingency climate protection for lawn amphitheater.'),
            ('Complete Rehearsal Sound Check & Facade Projection Mapping Test', 'production', 2, 200, 'Calibrates line-array speakers to meet 10:00 PM noise curbs.'),

            # Phase 4: Wedding Day Live Operations (T-0)
            ('08:00 AM - Palace Service Dock Supplier Arrival & OTP Verification', 'wedding_day', 0, 210, 'Gate check-in for floral trucks, catering provisions, and sound crews.'),
            ('10:00 AM - Floral Mandap Fresh Jasmine & Marigold Installation', 'wedding_day', 0, 220, 'Drapes fresh floral chadar and completes havan sacred area.'),
            ('12:00 PM - Groom Royal Baraat Assembly & Vintage Car Procession', 'wedding_day', 0, 230, 'Leads baraat procession with live shehnai and brass band.'),
            ('02:00 PM - Mehendi & Sangeet Performance Live Cueing', 'wedding_day', 0, 240, 'Coordinates family choreographies and celebrity DJ playlist.'),
            ('07:00 PM - Varmala Exchange & Sacred Vedic Pheras at Central Mandap', 'wedding_day', 0, 250, 'Executes cold pyrotechnics and priest ritual timings.'),
            ('09:00 PM - Grand Royal Reception Banquet & Live Degustation', 'wedding_day', 0, 260, 'Oversees 400-guest culinary service, dessert bar, and guest farewells.'),
        ]

        task_vals = []
        for name, phase, days, seq, notes in milestone_templates:
            task_vals.append((0, 0, {
                'name': name,
                'task_phase': phase,
                'days_before_wedding': days,
                'sequence': seq,
                'notes': notes,
                'state': 'todo',
            }))

        self.task_ids = task_vals
        self.message_post(body=_("🚀 Auto-constructed 26-node operational task graph across 4 lifecycle phases."))
        return True

    def action_generate_default_run_sheet(self):
        """Populates the minute-by-minute wedding day command run sheet."""
        self.ensure_one()
        self.run_sheet_ids.unlink()

        runs = [
            (10, '10:00 AM', '11:30 AM', 'Palace Grounds Logistics & Sound Check', 'Palace Service Dock 3', 'Logistics Lead', 'Check line-array audio, line up golf buggies, verify generator diesel.'),
            (20, '12:00 PM', '01:30 PM', 'Groom Royal Baraat & Vintage Fleet Arrival', 'Grand Palace Forecourt', 'Lead Planner', 'Cue royal brass band, groom vintage car arrival, rose petal shower.'),
            (30, '02:00 PM', '05:30 PM', 'Royal Mehendi & Sangeet Performance', 'Zenana Courtyard', 'Event Coordinator', 'Manage 14 family dance performances, celebrity artist set, live chaat counters.'),
            (40, '07:00 PM', '08:30 PM', 'Grand Varmala & Sacred Vedic Pheras', 'Central Water Amphitheater', 'Lead Wedding Planner', 'Execute cold pyrotechnic fountains, priest havan holy sacred chants.'),
            (50, '09:00 PM', '11:00 PM', 'Grand Royal Banquet & Live Culinary Stations', 'Mughal Banqueting Lawns', 'All Coordinators', 'Open 35-item royal feast, monitor buffet flow, oversee guest VIP favors.'),
        ]

        sheet_vals = []
        for seq, t_start, t_end, ev_name, zone, lead, notes in runs:
            sheet_vals.append((0, 0, {
                'sequence': seq,
                'time_start': t_start,
                'time_end': t_end,
                'event_name': ev_name,
                'venue_zone': zone,
                'lead_coordinator': lead,
                'cue_notes': notes,
                'status': 'upcoming',
            }))

        self.run_sheet_ids = sheet_vals
        self.message_post(body=_("📋 Initialized minute-by-minute wedding day command run sheet."))
        return True
