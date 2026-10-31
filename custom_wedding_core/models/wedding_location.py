# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class CustomWeddingLocation(models.Model):
    """
    Manages luxury heritage venues, palaces, and destination resorts in Jaipur and Udaipur.
    """
    _name = 'custom.wedding.location'
    _description = 'Wedding Venue & Destination Location'
    _order = 'destination, name'

    name = fields.Char(string='Venue Name', required=True, index=True)
    destination = fields.Selection([
        ('jaipur', 'Jaipur (Pink City)'),
        ('udaipur', 'Udaipur (City of Lakes)')
    ], string='Destination City', required=True, default='jaipur', index=True)
    
    venue_type = fields.Selection([
        ('palace', 'Royal Palace'),
        ('heritage_fort', 'Heritage Fort'),
        ('luxury_resort', 'Luxury Lakeside / Garden Resort'),
        ('haveli', 'Historic Haveli')
    ], string='Venue Architecture', default='palace', required=True)

    max_guest_capacity = fields.Integer(string='Max Banquet Capacity', default=500, required=True)
    contact_name = fields.Char(string='Venue Manager / Spoc')
    contact_phone = fields.Char(string='Contact Number')
    contact_email = fields.Char(string='Contact Email')
    address = fields.Text(string='Full Venue Address')
    notes = fields.Html(string='Logistical & Generator Guidelines')
    is_active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('unique_venue_per_city', 'unique(name, destination)', 'A venue with this name already exists in this city!')
    ]

    @api.constrains('max_guest_capacity')
    def _check_capacity(self):
        for record in self:
            if record.max_guest_capacity < 50:
                raise ValidationError("Venue capacity must be at least 50 guests for luxury events.")
