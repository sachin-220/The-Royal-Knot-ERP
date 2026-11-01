import React from 'react';
import { Search, Calendar, ChevronDown, Bell } from 'lucide-react';

export default function TopHeader({ 
  activeTab, 
  weddings, 
  selectedWedding, 
  setSelectedWedding 
}) {
  const titles = {
    cockpit: {
      title: 'Founder Dashboard Overview',
      subtitle: 'Lead recovery intelligence, revenue performance, and vendor procurement overview.'
    },
    enquiries: {
      title: 'User Enquiries & Lead Intelligence',
      subtitle: 'Telegram intake, ML conversion prediction (0-100%), and 48-hour recovery intelligence.'
    },
    budget: {
      title: 'Vendor Quotations & Comparison Grid',
      subtitle: 'OCR quotation confirmation, fill-in-the-blanks engine, and side-by-side comparison.'
    },
    vendors: {
      title: 'Vendor Directory & Partner Network (18 Categories)',
      subtitle: 'Complete 18-category vendor master with full CRUD operations and dynamic email routing.'
    },
    plansetter: {
      title: 'Wedding Plan & Floor Layout Setter',
      subtitle: 'Interactive hall dimension architecture, drag & drop elements, custom partition lines & client export engine.'
    }
  };

  const current = titles[activeTab] || titles.cockpit;

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '18px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Left: Heading and Subheading */}
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
          {current.title}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0', fontWeight: 400 }}>
          {current.subtitle}
        </p>
      </div>

      {/* Right: Controls & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search anything..."
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '8px 14px 8px 34px',
              fontSize: '0.82rem',
              color: '#0f172a',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Wedding / Season Selector Pill */}
        {weddings && weddings.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: '#334155',
              fontWeight: 500
            }}>
              <Calendar size={14} color="#64748b" />
              <select
                value={selectedWedding?.id || ''}
                onChange={(e) => {
                  const found = weddings.find(w => w.id === parseInt(e.target.value));
                  if (found) setSelectedWedding(found);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#0f172a',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.client_name} ({w.city})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} color="#64748b" />
            </div>
          </div>
        )}

        {/* Notification Bell */}
        <div style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748b'
        }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444'
          }} />
        </div>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#4f46e5',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            DC
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
              Daniel Carter
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Lead Planner
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
