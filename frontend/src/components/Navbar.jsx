import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Building2, LayoutGrid, FileSpreadsheet, Bot,
  Clock, Calendar, ScanLine, Users, TrendingUp, Receipt, ChevronDown,
  Database, Bell, Sparkles, CheckCircle2, ShieldCheck, Layers, Package,
  LogOut, UserCheck
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  weddings, 
  selectedWedding, 
  setSelectedWedding, 
  dbHealth,
  currentUser,
  onLogout
}) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Group the 12 existing modules into 4 minimal main navigation categories
  const navCategories = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      tabId: 'cockpit',
      isDirect: true,
      submodules: []
    },
    {
      id: 'procurement',
      label: 'Procurement',
      icon: Package,
      submodules: [
        { 
          id: 'vendors', 
          label: 'Vendor Directory', 
          desc: '18 categories & partner master network', 
          icon: Building2 
        },
        { 
          id: 'budget', 
          label: 'Quotations & Comparison Grid', 
          desc: 'OCR confirmation & side-by-side pricing', 
          icon: LayoutGrid 
        },
        { 
          id: 'inquiry_quotations', 
          label: 'Inquiry Quotations', 
          desc: 'Client proposals & dynamic line items', 
          icon: FileSpreadsheet 
        },
        { 
          id: 'vendor_coordination', 
          label: 'Vendor Coordination', 
          desc: 'Automated milestone check-in bot & signoffs', 
          icon: Bot 
        }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Layers,
      submodules: [
        { 
          id: 'command_centre', 
          label: 'Big Day Schedule Engine', 
          desc: 'Real-time delay cascades & contingency engine', 
          icon: Clock 
        },
        { 
          id: 'event_schedule', 
          label: 'Event Schedule & Timeline', 
          desc: 'Master multi-day ceremony itinerary', 
          icon: Calendar 
        },
        { 
          id: 'wristband_tracker', 
          label: 'Toran Gate Wristband Scanner', 
          desc: 'Palace entrance visitor barcode plate counter', 
          icon: ScanLine 
        },
        { 
          id: 'plansetter', 
          label: 'Floor Layout Setter', 
          desc: 'Interactive hall dimension & seating planner', 
          icon: LayoutGrid 
        },
        { 
          id: 'enquiries', 
          label: 'Client CRM & Enquiries', 
          desc: 'Lead intake & 48-hour recovery intelligence', 
          icon: Users 
        }
      ]
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      icon: TrendingUp,
      submodules: [
        { 
          id: 'executive_bi', 
          label: 'Multi-Wedding BI & Copilot', 
          desc: '25-wedding margin health & planner AI assistant', 
          icon: Sparkles 
        },
        { 
          id: 'finance_settlement', 
          label: 'Finance & 3-Way PO Settlement', 
          desc: 'PO vs delivery vs invoice matching & leakage control', 
          icon: Receipt 
        },
        { 
          id: 'cockpit', 
          label: 'Founder Cockpit Analytics', 
          desc: 'Executive telemetry, ML conversion & revenue burn', 
          icon: LayoutDashboard 
        }
      ]
    }
  ];

  // RBAC Filtering based on user's authorized modules
  const allowedModules = currentUser?.allowed_modules || [
    "cockpit", "vendors", "budget", "inquiry_quotations", "vendor_coordination",
    "command_centre", "event_schedule", "wristband_tracker", "plansetter", "enquiries",
    "executive_bi", "finance_settlement"
  ];

  const visibleCategories = navCategories.map(cat => {
    if (cat.isDirect) {
      return allowedModules.includes(cat.tabId) ? cat : null;
    }
    const filteredSub = cat.submodules.filter(sub => allowedModules.includes(sub.id));
    if (filteredSub.length === 0) return null;
    return {
      ...cat,
      submodules: filteredSub
    };
  }).filter(Boolean);

  // Helper to determine if a category is currently active
  const isCategoryActive = (category) => {
    if (category.isDirect) {
      return activeTab === category.tabId;
    }
    return category.submodules.some(sub => sub.id === activeTab);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e7e7e4',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 32px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left: Brand Monogram + Minimal Navigation Items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }} ref={dropdownRef}>
        
        {/* Brand Logo matching StockSense gold/amber rounded square */}
        <div 
          onClick={() => setActiveTab('cockpit')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#18181b',
            boxShadow: '0 1px 3px rgba(245, 158, 11, 0.25)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 12l10 10 10-10L12 2zm0 4.5L17.5 12 12 17.5 6.5 12 12 6.5z"/>
            </svg>
          </div>
          <div style={{ 
            fontSize: '1.15rem', 
            fontWeight: 700, 
            color: '#18181b', 
            letterSpacing: '-0.02em',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            KnotCore
          </div>
        </div>

        {/* Minimal Navigation Items Filtered by RBAC */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {visibleCategories.map((cat) => {
            const active = isCategoryActive(cat);
            const isOpen = openDropdown === cat.id;

            if (cat.isDirect) {
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.tabId);
                    setOpenDropdown(null);
                  }}
                  style={{
                    background: active ? '#18181b' : 'transparent',
                    color: active ? '#ffffff' : '#71717a',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '7px 18px',
                    fontSize: '0.84rem',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#18181b';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#71717a';
                  }}
                >
                  <span>{cat.label}</span>
                </button>
              );
            }

            return (
              <div key={cat.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : cat.id)}
                  style={{
                    background: active ? '#18181b' : (isOpen ? '#f4f4f5' : 'transparent'),
                    color: active ? '#ffffff' : (isOpen ? '#18181b' : '#71717a'),
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '7px 16px',
                    fontSize: '0.84rem',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#18181b';
                  }}
                  onMouseLeave={(e) => {
                    if (!active && !isOpen) e.currentTarget.style.color = '#71717a';
                  }}
                >
                  <span>{cat.label}</span>
                  <ChevronDown 
                    size={13} 
                    style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.15s ease',
                      opacity: active ? 0.9 : 0.6
                    }} 
                  />
                </button>

                {/* Dropdown Menu Card */}
                {isOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '320px',
                    background: '#ffffff',
                    border: '1px solid #e7e7e4',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
                    padding: '8px',
                    zIndex: 100
                  }}>
                    <div style={{
                      padding: '6px 10px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#a1a1aa',
                      borderBottom: '1px solid #f4f4f5',
                      marginBottom: '4px'
                    }}>
                      {cat.label} Modules
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {cat.submodules.map((sub) => {
                        const Icon = sub.icon;
                        const isSubActive = activeTab === sub.id;
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              setActiveTab(sub.id);
                              setOpenDropdown(null);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: isSubActive ? '#f4f4f5' : 'transparent',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              transition: 'background 0.1s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) e.currentTarget.style.background = '#fafafa';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: isSubActive ? '#18181b' : '#f4f4f5',
                              color: isSubActive ? '#ffffff' : '#71717a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <Icon size={14} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: '0.82rem', 
                                fontWeight: isSubActive ? 600 : 500, 
                                color: isSubActive ? '#18181b' : '#27272a',
                                lineHeight: 1.2
                              }}>
                                {sub.label}
                              </div>
                              <div style={{ 
                                fontSize: '0.72rem', 
                                color: '#71717a', 
                                marginTop: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {sub.desc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Right: Wedding Context Dropdown, DB Status Badge, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Wedding / Venue Context Switcher */}
        {weddings && weddings.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #e7e7e4',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '0.8rem'
          }}>
            <Calendar size={13} color="#71717a" />
            <select
              value={selectedWedding?.id || ''}
              onChange={(e) => {
                const found = weddings.find(w => w.id === parseInt(e.target.value));
                if (found) setSelectedWedding(found);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#18181b',
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
          </div>
        )}

        {/* DB Connection Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          background: '#f4f4f5',
          borderRadius: '8px',
          fontSize: '0.74rem',
          fontWeight: 600,
          color: '#3f3f46'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dbHealth?.status === 'ok' ? '#16a34a' : '#f59e0b',
            display: 'inline-block'
          }} />
          <span>PostgreSQL 16</span>
        </div>

        {/* Notification Bell */}
        <div style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#71717a'
        }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#dc2626'
          }} />
        </div>

        {/* User Profile, Role Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            lineHeight: 1.2
          }}>
            <span style={{ fontSize: '0.80rem', fontWeight: 700, color: '#18181b' }}>
              {currentUser?.full_name || currentUser?.username || 'KnotCore User'}
            </span>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '4px',
              background: currentUser?.role === 'super_admin' ? '#fef3c7' : currentUser?.role === 'financial_manager' ? '#ecfdf5' : '#f4f4f5',
              color: currentUser?.role === 'super_admin' ? '#92400e' : currentUser?.role === 'financial_manager' ? '#065f46' : '#27272a',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {currentUser?.role === 'super_admin' ? 'Super Admin' : currentUser?.role === 'financial_manager' ? 'Financial Manager' : 'Operations Admin'}
            </span>
          </div>

          <div 
            title={currentUser?.email || 'Logged in'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
              border: '1px solid rgba(217, 119, 6, 0.4)',
              color: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.78rem'
            }}
          >
            {(currentUser?.full_name || currentUser?.username || 'KP').substring(0, 2).toUpperCase()}
          </div>

          {/* Secure Logout CTA Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out of KnotCore session"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #e4e4e7',
                background: '#ffffff',
                color: '#71717a',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.borderColor = '#fecaca';
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.borderColor = '#e4e4e7';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
