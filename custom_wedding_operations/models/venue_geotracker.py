# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class KnotcoreVenueGeoTracker(models.Model):
    """
    Live Geographic Location Map & Vehicle Tracking Dashboard
    Monitors heritage palaces, real-time GPS of on-ground planners,
    and approaching vendor trucks with geofenced ETAs across Jaipur and Udaipur.
    """
    _name = 'knotcore.venue.geotracker'
    _description = 'Live Venue & Fleet Geographic Tracker'
    _order = 'entity_type asc, id desc'

    name = fields.Char(string='Tracked Entity', required=True)
    wedding_id = fields.Many2one(
        'custom.wedding',
        string='Wedding',
        required=True,
        ondelete='cascade',
        index=True
    )
    entity_type = fields.Selection([
        ('palace_venue', 'Heritage Palace Venue 🏰'),
        ('planner_gps', 'On-Site Planner (Live GPS) 📍'),
        ('vendor_truck', 'Approaching Vendor Delivery Truck 🚚')
    ], string='Tracking Type', required=True, default='vendor_truck')

    destination = fields.Selection([
        ('jaipur', 'Jaipur'),
        ('udaipur', 'Udaipur')
    ], string='Destination Region', default='jaipur', required=True)

    latitude = fields.Float(string='Latitude', digits=(10, 6), default=26.897800)
    longitude = fields.Float(string='Longitude', digits=(10, 6), default=75.807300)

    geofence_status = fields.Selection([
        ('inside_venue', 'Inside Venue Grounds (Docked) ✅'),
        ('approaching', 'Approaching (Within 5 km) ⏳'),
        ('traffic_delay', 'Delayed in Traffic Alert 🚨')
    ], string='Geofence & Traffic Status', default='approaching')

    eta_minutes = fields.Integer(string='Estimated ETA (Mins)', default=15)
    vendor_partner_id = fields.Many2one('res.partner', string='Associated Supplier')
    driver_phone = fields.Char(string='Driver Contact Number')
    last_gps_ping = fields.Datetime(string='Last GPS Ping', default=fields.Datetime.now)

    @api.model
    def populate_default_locations(self, wedding_id):
        """Populates baseline GPS points for venues and fleet."""
        wedding = self.env['custom.wedding'].browse(wedding_id)
        if not wedding.exists():
            return
        
        is_udaipur = wedding.destination == 'udaipur'
        lat_base = 24.5764 if is_udaipur else 26.8978
        lon_base = 73.6835 if is_udaipur else 75.8073

        points = [
            (f"{wedding.location_id.name or 'Heritage Palace'}", 'palace_venue', lat_base, lon_base, 'inside_venue', 0),
            ('Lead Planner Mobile GPS', 'planner_gps', lat_base + 0.0004, lon_base + 0.0003, 'inside_venue', 0),
            ('Catering Refrigerated Truck 1', 'vendor_truck', lat_base + 0.0120, lon_base + 0.0150, 'approaching', 12),
            ('DJ Sound Stage Trussing Truck', 'vendor_truck', lat_base + 0.0250, lon_base + 0.0200, 'traffic_delay', 35),
            ('Mewar Fresh Florals Van', 'vendor_truck', lat_base + 0.0050, lon_base + 0.0040, 'approaching', 5),
        ]

        vals = []
        for name, etype, lat, lon, gstatus, eta in points:
            vals.append({
                'name': name,
                'wedding_id': wedding.id,
                'entity_type': etype,
                'destination': wedding.destination,
                'latitude': lat,
                'longitude': lon,
                'geofence_status': gstatus,
                'eta_minutes': eta,
                'last_gps_ping': fields.Datetime.now(),
            })
        return self.create(vals)
