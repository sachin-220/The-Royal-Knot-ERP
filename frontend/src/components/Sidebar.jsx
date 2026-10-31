import React from 'react';
import { 
  LayoutDashboard, Users, FileSpreadsheet, CheckSquare, 
  ShieldCheck, FileText, Settings, Database, ArrowRight
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, dbHealth }) {
  const navItems = [
    { id: 'cockpit', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries & Leads', icon: Users },
    { id: 'budget', label: 'Budget & Vendors', icon: FileSpreadsheet },
    { id: 'operations', label: 'Operations & Tasks', icon: CheckSquare },
    { id: 'gate_finance', label: 'Gate & Security', icon: ShieldCheck },
  ];

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Top: Brand Logo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '32px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <circle cx="19" cy="5" r="2"></circle>
              <circle cx="5" cy="19" r="2"></circle>
              <path d="M10.5 10.5L6.5 17.5"></path>
              <path d="M13.5 13.5L17.5 6.5"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              KnotCore
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
              ERP Architecture
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#eef2ff' : 'transparent',
                  color: isActive ? '#4f46e5' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Database Connection Card */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
        borderRadius: '14px',
        padding: '16px',
        border: '1px solid #e0e7ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Database size={15} color="#4f46e5" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e1b4b' }}>
            PostgreSQL 16
          </span>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
          {dbHealth?.db_name || 'knotcore_db'} on 127.0.0.1:5432 with native Odoo LGPL-3.0 schemas.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#4f46e5',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 600
        }}>
          <span>Live Synced</span>
          <ArrowRight size={11} />
        </div>
      </div>
    </aside>
  );
}
