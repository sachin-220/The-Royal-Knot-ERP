import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, Calendar, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3, Database,
  AlertTriangle, Send, ChevronRight, MoreVertical, Folder, Percent, 
  Check, Clock, MessageSquare, ArrowRight, UserPlus
} from 'lucide-react';

export default function CockpitView({ wedding, founderData, dbHealth }) {
  const [atRiskLeads, setAtRiskLeads] = useState([]);
  const [followupStatus, setFollowupStatus] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState('30D');

  // Monitor high-value leads for 48h SLA inaction
  useEffect(() => {
    const fetchLeadRisks = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/leads/conversion-overview');
        const data = await res.json();
        const flagged = data.filter(i => i.risk_status === 'at_risk' || (i.hours_since_last_response >= 48 && i.risk_status !== 'recovered'));
        setAtRiskLeads(flagged);
      } catch (e) {
        console.warn("Failed to check lead risks in CockpitView:", e);
      }
    };
    fetchLeadRisks();
    const interval = setInterval(fetchLeadRisks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendFollowup = async (inquiryId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/leads/${inquiryId}/send-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setFollowupStatus(`Follow-up dispatched to ${data.lead.name}. Lead marked as recovered.`);
        setAtRiskLeads(prev => prev.filter(i => i.id !== inquiryId));
        setTimeout(() => setFollowupStatus(null), 5000);
      }
    } catch (err) {
      console.error("Failed to send follow-up from cockpit:", err);
    }
  };

  const macro = founderData?.macro_metrics || {
    season: "Winter Season 2026-2027",
    total_weddings: 25,
    gross_revenue: 685000000,
    operating_margin_pct: 28.40,
    net_margin_pct: 21.60,
    financial_leakage_prevented: 18200000,
    cash_flow_30d: 24500000,
    cash_flow_60d: 38000000,
    cash_flow_90d: 52000000
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 48H STANDOUT FEATURE: FOUNDER AT RISK OF LOSS ALERT BANNER (Clean Light Style, No Emojis) */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span className="badge badge-ruby">
                  LEAD RECOVERY ALERT
                </span>
                <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
                  48-Hour Inaction Detected
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>
                High-Value Lead: {atRiskLeads[0].name} (₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr, {atRiskLeads[0].preferred_city}) has received no planner response for {atRiskLeads[0].hours_since_last_response || 48} hours.
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                ML Conversion Likelihood: <strong>{atRiskLeads[0].conversion_score}%</strong>. Bespoke venue follow-up has been drafted for Rambagh Palace.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => handleSendFollowup(atRiskLeads[0].id)}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 16px', background: '#dc2626', borderColor: '#dc2626' }}
            >
              <Send size={13} /> Send Follow-Up
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Success Notification */}
      {followupStatus && (
        <div style={{
          padding: '12px 18px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          color: '#065f46',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{followupStatus}</span>
        </div>
      )}

      {/* ROW 1: 4 TOP METRIC CARDS WITH SPARKLINES (Exactly like Reference) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Card 1: Total Revenue */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={18} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
                TOTAL REVENUE
              </span>
            </div>
            <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            ₹68,500,000
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                ↑ +18.4%
              </span>
              <span style={{ color: '#94a3b8' }}>vs. last season</span>
            </div>
            
            {/* Sparkline Wave */}
            <svg width="84" height="28" viewBox="0 0 84 28" fill="none">
              <path d="M2 24 C14 22, 18 16, 28 17 C38 18, 44 8, 54 11 C64 14, 72 4, 82 2" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Active Weddings / Palaces */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={18} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
                ACTIVE WEDDINGS
              </span>
            </div>
            <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            25 Palaces
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                ↑ +12.8%
              </span>
              <span style={{ color: '#94a3b8' }}>confirmed</span>
            </div>
            
            <svg width="84" height="28" viewBox="0 0 84 28" fill="none">
              <path d="M2 20 C14 18, 22 22, 32 14 C42 6, 52 16, 62 10 C72 4, 78 6, 82 3" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: 18 Budget Categories */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#faf5ff',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Folder size={18} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
                TOTAL CATEGORIES
              </span>
            </div>
            <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            18 Categories
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                ↑ +8.6%
              </span>
              <span style={{ color: '#94a3b8' }}>100% balanced</span>
            </div>
            
            <svg width="84" height="28" viewBox="0 0 84 28" fill="none">
              <path d="M2 22 C14 20, 26 24, 38 16 C50 8, 60 12, 70 8 C76 5, 80 4, 82 2" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f0f9ff',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Percent size={18} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
                CONVERSION RATE
              </span>
            </div>
            <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
          </div>

          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
            91.2%
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                ↑ +5.2%
              </span>
              <span style={{ color: '#94a3b8' }}>ML Likelihood</span>
            </div>
            
            <svg width="84" height="28" viewBox="0 0 84 28" fill="none">
              <path d="M2 18 C14 22, 24 16, 36 12 C48 8, 58 14, 68 8 C74 4, 78 5, 82 2" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* ROW 2: REVENUE PERFORMANCE CHART & REVENUE BREAKDOWN DONUT (Exactly like Reference) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        
        {/* Left Card: Revenue Performance Area Chart */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Revenue Performance
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
                Your revenue and growth over the selected period.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Timeframe selector pills */}
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
                {['7D', '30D', '90D', '1Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeTimeframe === tf ? '#4f46e5' : 'transparent',
                      color: activeTimeframe === tf ? '#ffffff' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Metric indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Revenue</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>₹68,500,000</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Growth Rate</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981' }}>+12.8%</div>
                </div>
              </div>
            </div>
          </div>

          {/* SVG Area Line Chart with Axis and Data Tooltip Pin */}
          <div style={{ position: 'relative', width: '100%', height: '240px', marginTop: '12px' }}>
            <svg width="100%" height="210" viewBox="0 0 700 210" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="180" x2="700" y2="180" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="135" x2="700" y2="135" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="45" x2="700" y2="45" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area fill */}
              <path
                d="M 0 160 
                   C 50 150, 90 145, 140 135 
                   C 190 125, 230 110, 280 115 
                   C 320 120, 350 75, 390 80 
                   C 430 85, 470 120, 510 100 
                   C 560 80, 610 95, 650 65 
                   C 680 45, 700 40, 700 40 
                   L 700 180 L 0 180 Z"
                fill="url(#revenueGradient)"
              />

              {/* Main curve line */}
              <path
                d="M 0 160 
                   C 50 150, 90 145, 140 135 
                   C 190 125, 230 110, 280 115 
                   C 320 120, 350 75, 390 80 
                   C 430 85, 470 120, 510 100 
                   C 560 80, 610 95, 650 65 
                   C 680 45, 700 40, 700 40"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Highlight Data Dot at x=390, y=80 */}
              <line x1="390" y1="80" x2="390" y2="180" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="390" cy="80" r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2.5" />
            </svg>

            {/* Floating Tooltip Card at x=390 */}
            <div style={{
              position: 'absolute',
              left: '52%',
              top: '15px',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: 'var(--shadow-elevated)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Nov 22, 2026</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>₹18,245,000</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>↑ 12.4%</div>
            </div>

            {/* X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
              <span>Nov 14</span>
              <span>Nov 17</span>
              <span>Nov 20</span>
              <span>Nov 23</span>
              <span>Nov 26</span>
              <span>Nov 29</span>
              <span>Dec 2</span>
              <span>Dec 5</span>
              <span>Dec 8</span>
            </div>
          </div>
        </div>

        {/* Right Card: Budget / Revenue Breakdown Donut */}
        <div className="saas-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Revenue Breakdown
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 16px' }}>
              Category allocation across contracted budget.
            </p>

            {/* Donut Chart SVG */}
            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 18px' }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                {/* Donut Segments */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                {/* Segment 1: Catering (35%) */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#4f46e5" strokeWidth="20"
                  strokeDasharray="120.9 345.5" strokeDashoffset="0" transform="rotate(-90 75 75)" />
                {/* Segment 2: Venue (25%) */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#10b981" strokeWidth="20"
                  strokeDasharray="86.3 345.5" strokeDashoffset="-120.9" transform="rotate(-90 75 75)" />
                {/* Segment 3: Floral (16%) */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#f59e0b" strokeWidth="20"
                  strokeDasharray="55.2 345.5" strokeDashoffset="-207.2" transform="rotate(-90 75 75)" />
                {/* Segment 4: AV / Sound (10%) */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#0ea5e9" strokeWidth="20"
                  strokeDasharray="34.5 345.5" strokeDashoffset="-262.4" transform="rotate(-90 75 75)" />
                {/* Segment 5: Other (14%) */}
                <circle cx="75" cy="75" r="55" fill="none" stroke="#94a3b8" strokeWidth="20"
                  strokeDasharray="48.3 345.5" strokeDashoffset="-296.9" transform="rotate(-90 75 75)" />
              </svg>
              
              {/* Center Total Text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹2.5 Cr
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                  Total Budget
                </div>
              </div>
            </div>

            {/* Breakdown Legend List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>Royal Catering</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                  <span>35.0%</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹87.5 L</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>Palace Licensing</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                  <span>25.0%</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹62.5 L</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>Floral Architecture</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                  <span>16.0%</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹40.0 L</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }} />
                  <span style={{ color: '#334155', fontWeight: 500 }}>Concert Sound & Light</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                  <span>10.0%</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>₹25.0 L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: RECENT ACTIVITY & TASKS (Exactly like Reference) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Left Card: Recent Activity */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Activity
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
              View all →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Activity 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  SM
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 600 }}>
                    Siddharth Malpani <span style={{ fontWeight: 400, color: '#64748b' }}>submitted wedding inquiry</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Rambagh Palace, Jaipur • 350 Guests • ML Score: 91.2%
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>2 min ago</span>
            </div>

            {/* Activity 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  RC
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 600 }}>
                    Royal Marwar Caterers <span style={{ fontWeight: 400, color: '#64748b' }}>submitted OCR bid</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    CAT-02 Royal Catering • 524 plates • WCI: 96.1/100
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>18 min ago</span>
            </div>

            {/* Activity 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#faf5ff',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  AD
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 600 }}>
                    Aarav & Diya <span style={{ fontWeight: 400, color: '#64748b' }}>counter-signed proposal</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Milestone 1 (30%) Advance Received: ₹90.0 L
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>42 min ago</span>
            </div>

            {/* Activity 4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}>
                  DR
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 600 }}>
                    Digvijay Singh Rathore <span style={{ fontWeight: 400, color: '#64748b' }}>assigned as backup</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Lead Recovery SLA escalation ready
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>1 hr ago</span>
            </div>
          </div>
        </div>

        {/* Right Card: Tasks & Procurement Milestones */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Tasks & Procurement Status
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
              View all →
            </span>
          </div>

          {/* Top mini-stats */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> 12 Completed
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eef2ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>
              <Clock size={13} /> 8 In Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#faf5ff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
              <Calendar size={13} /> 5 Upcoming
            </div>
          </div>

          {/* Task Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Task 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  Catering Tasting Menu & Plate Buffer
                </span>
                <span className="badge badge-ruby" style={{ fontSize: '0.65rem' }}>High</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nov 16, 2026</span>
                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#10b981' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', width: '32px', textAlign: 'right' }}>100%</span>
              </div>
            </div>

            {/* Task 2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  Stage Sound & DG 125kVA Generator
                </span>
                <span className="badge badge-ruby" style={{ fontSize: '0.65rem' }}>High</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nov 18, 2026</span>
                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: '#10b981' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', width: '32px', textAlign: 'right' }}>100%</span>
              </div>
            </div>

            {/* Task 3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  One-Way Mirror Vendor Bidding
                </span>
                <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Medium</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nov 20, 2026</span>
                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: '#4f46e5' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', width: '32px', textAlign: 'right' }}>60%</span>
              </div>
            </div>

            {/* Task 4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" style={{ accentColor: '#4f46e5', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                  Digital Guest Pass Generation
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Normal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Nov 22, 2026</span>
                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '30%', height: '100%', background: '#4f46e5' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', width: '32px', textAlign: 'right' }}>30%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
