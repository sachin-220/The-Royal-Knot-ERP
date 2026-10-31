import React from 'react';
import { Crown, Database, Sparkles, RefreshCw, ChevronDown } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  weddings, 
  selectedWedding, 
  setSelectedWedding, 
  dbHealth, 
  refreshData,
  onOpenConcierge 
}) {
  return (
    <header className="glass-panel" style={{ 
      margin: '16px 24px', 
      padding: '14px 24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 50,
      borderRadius: 'var(--radius-lg)'
    }}>
      {/* Brand & Crest */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'var(--color-gold-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-gold)',
          color: '#070d1e'
        }}>
          <Crown size={26} strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="font-royal" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
              <span className="text-gold-gradient">THE ROYAL KNOT</span>
            </h1>
            <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>ERP V17.0</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            KnotCore — Luxury Wedding Planning & Founder Intelligence
          </p>
        </div>
      </div>

      {/* Wedding Selector & Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Active Wedding Dropdown */}
        {weddings && weddings.length > 0 && (
          <div style={{ position: 'relative', marginRight: '12px' }}>
            <select
              value={selectedWedding?.id || ''}
              onChange={(e) => {
                const found = weddings.find(w => w.id === parseInt(e.target.value));
                if (found) setSelectedWedding(found);
              }}
              style={{
                appearance: 'none',
                background: 'rgba(22, 38, 82, 0.7)',
                color: 'var(--color-gold-light)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 36px 8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id} style={{ background: '#0b132b', color: '#f8fafc' }}>
                  {w.client_name} • {w.city} (₹{(w.total_budget / 10000000).toFixed(2)} Cr)
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-gold)' }} />
          </div>
        )}

        {/* Tab Buttons */}
        <button
          onClick={() => setActiveTab('cockpit')}
          className={activeTab === 'cockpit' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          Founder Cockpit
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={activeTab === 'enquiries' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          User Enquiries & RFPs
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={activeTab === 'budget' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          18-Category Budget & WCI
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={activeTab === 'operations' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          Operations (26 Tasks & Run Sheet)
        </button>

        <button
          onClick={() => setActiveTab('gate_finance')}
          className={activeTab === 'gate_finance' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          Gate Passes & Variations
        </button>
      </div>

      {/* Right Controls: Database Health & AI Concierge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Database Pill */}
        <div 
          title={`Database: ${dbHealth?.database || 'PostgreSQL 16'} | Host: ${dbHealth?.host || 'localhost:5432'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: dbHealth?.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${dbHealth?.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            color: dbHealth?.connected ? '#34d399' : '#f87171',
            fontWeight: 600
          }}
        >
          <span className={dbHealth?.connected ? "live-dot" : "live-dot-ruby"} />
          <Database size={13} />
          <span>{dbHealth?.connected ? 'PostgreSQL 16 Connected' : 'DB Disconnected'}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshData}
          title="Refresh Live Data"
          className="btn-royal-outline"
          style={{ padding: '8px', borderRadius: '50%' }}
        >
          <RefreshCw size={15} />
        </button>

        {/* AI Concierge Trigger */}
        <button
          onClick={onOpenConcierge}
          className="btn-royal-gold pulse-glow"
          style={{ padding: '8px 16px', fontSize: '0.82rem' }}
        >
          <Sparkles size={15} />
          <span>Royal AI Concierge</span>
        </button>
      </div>
    </header>
  );
}
