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

  // Dynamic datasets for timeframe switching
  const timelineData = {
    '7D': {
      totalRevenue: '₹14,250,000',
      growthRate: '+18.2%',
      tooltipDate: 'Oct 29, 2026',
      tooltipVal: '₹3,850,000',
      tooltipGrowth: '+14.6%',
      tooltipPos: { x: '58%', y: '35px' },
      pin: { cx: 406, cy: 95 },
      xLabels: ['Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31'],
      pathArea: "M 0 170 C 60 160, 120 165, 180 140 C 240 115, 300 130, 360 110 C 420 90, 480 120, 540 85 C 600 55, 650 70, 700 45 L 700 180 L 0 180 Z",
      pathLine: "M 0 170 C 60 160, 120 165, 180 140 C 240 115, 300 130, 360 110 C 420 90, 480 120, 540 85 C 600 55, 650 70, 700 45"
    },
    '30D': {
      totalRevenue: '₹68,500,000',
      growthRate: '+12.8%',
      tooltipDate: 'Nov 22, 2026',
      tooltipVal: '₹18,245,000',
      tooltipGrowth: '+12.4%',
      tooltipPos: { x: '55%', y: '15px' },
      pin: { cx: 390, cy: 80 },
      xLabels: ['Nov 14', 'Nov 17', 'Nov 20', 'Nov 23', 'Nov 26', 'Nov 29', 'Dec 2', 'Dec 5', 'Dec 8'],
      pathArea: "M 0 160 C 50 150, 90 145, 140 135 C 190 125, 230 110, 280 115 C 320 120, 350 75, 390 80 C 430 85, 470 120, 510 100 C 560 80, 610 95, 650 65 C 680 45, 700 40, 700 40 L 700 180 L 0 180 Z",
      pathLine: "M 0 160 C 50 150, 90 145, 140 135 C 190 125, 230 110, 280 115 C 320 120, 350 75, 390 80 C 430 85, 470 120, 510 100 C 560 80, 610 95, 650 65 C 680 45, 700 40, 700 40"
    },
    '90D': {
      totalRevenue: '₹184,200,000',
      growthRate: '+24.5%',
      tooltipDate: 'Sep 28, 2026',
      tooltipVal: '₹42,500,000',
      tooltipGrowth: '+22.1%',
      tooltipPos: { x: '68%', y: '10px' },
      pin: { cx: 480, cy: 60 },
      xLabels: ['Aug 1', 'Aug 15', 'Sep 1', 'Sep 15', 'Oct 1', 'Oct 15', 'Oct 31'],
      pathArea: "M 0 175 C 70 165, 130 150, 200 140 C 270 130, 340 115, 410 90 C 480 60, 550 85, 620 50 C 660 30, 690 35, 700 25 L 700 180 L 0 180 Z",
      pathLine: "M 0 175 C 70 165, 130 150, 200 140 C 270 130, 340 115, 410 90 C 480 60, 550 85, 620 50 C 660 30, 690 35, 700 25"
    },
    '1Y': {
      totalRevenue: '₹685,000,000',
      growthRate: '+31.4%',
      tooltipDate: 'Peak Winter Dec',
      tooltipVal: '₹145,000,000',
      tooltipGrowth: '+38.5%',
      tooltipPos: { x: '82%', y: '8px' },
      pin: { cx: 580, cy: 35 },
      xLabels: ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
      pathArea: "M 0 170 C 80 165, 150 145, 230 130 C 310 115, 380 95, 460 70 C 530 45, 580 35, 640 40 C 670 42, 690 20, 700 15 L 700 180 L 0 180 Z",
      pathLine: "M 0 170 C 80 165, 150 145, 230 130 C 310 115, 380 95, 460 70 C 530 45, 580 35, 640 40 C 670 42, 690 20, 700 15"
    }
  };

  const currentTimeline = timelineData[activeTimeframe] || timelineData['30D'];

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 48H STANDOUT FEATURE: CLEAN AT-RISK BANNER */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '14px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-ruby">At Risk of Loss</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#991b1b' }}>
                  {atRiskLeads[0].name} ({atRiskLeads[0].preferred_city})
                </span>
                <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                  Inaction: {atRiskLeads[0].hours_since_last_response || 48}h
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#7f1d1d', marginTop: '2px' }}>
                Budget: ₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr • ML Score: {atRiskLeads[0].conversion_score}% • Venue: {atRiskLeads[0].preferred_venue || 'Rambagh Palace'}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSendFollowup(atRiskLeads[0].id)}
            className="btn-primary"
            style={{ fontSize: '0.78rem', padding: '7px 14px', background: '#dc2626', borderColor: '#dc2626' }}
          >
            <Send size={12} /> Send Venue Follow-Up
          </button>
        </div>
      )}

      {/* Follow-up Success Notification */}
      {followupStatus && (
        <div style={{
          padding: '10px 16px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={15} color="#059669" />
          <span>{followupStatus}</span>
        </div>
      )}

      {/* TOP 4 METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Card 1: Total Revenue */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
              TOTAL REVENUE
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            ₹68,500,000
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>↑ +18.4% vs last season</span>
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M2 16 C12 14, 20 18, 30 10 C40 4, 50 8, 58 2" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Active Weddings */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
              ACTIVE WEDDINGS
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            25 Palaces
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>↑ +12.8% confirmed</span>
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M2 17 C12 15, 22 17, 32 9 C42 5, 50 7, 58 3" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Categories */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
              TOTAL CATEGORIES
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Folder size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            18 Categories
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>↑ +8.6% 100% balanced</span>
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M2 16 C12 14, 22 16, 32 10 C42 6, 50 8, 58 2" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
              CONVERSION RATE
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f0f9ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Percent size={15} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            91.2%
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>↑ +5.2% ML Likelihood</span>
            <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
              <path d="M2 15 C12 17, 22 13, 32 9 C42 6, 50 9, 58 2" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* DYNAMIC REVENUE PERFORMANCE & DONUT BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        
        {/* Left Card: Dynamic Revenue Performance Area Chart */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Revenue Performance
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '3px 0 0' }}>
                Contracted cash inflows across {currentTimeline.label}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Dynamic timeframe pills */}
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
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Dynamic Metric indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Revenue</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{currentTimeline.totalRevenue}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Growth</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{currentTimeline.growthRate}</div>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SVG CHART WITH SMOOTH TRANSITION */}
          <div style={{ position: 'relative', width: '100%', height: '220px', marginTop: '10px' }}>
            <svg width="100%" height="190" viewBox="0 0 700 190" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dynRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="160" x2="700" y2="160" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="80" x2="700" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />

              {/* Dynamic Area Fill */}
              <path
                d={currentTimeline.pathArea}
                fill="url(#dynRevenueGradient)"
                style={{ transition: 'd 0.35s ease' }}
              />

              {/* Dynamic Line Curve */}
              <path
                d={currentTimeline.pathLine}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.8"
                strokeLinecap="round"
                style={{ transition: 'd 0.35s ease' }}
              />

              {/* Dynamic Highlight Pin */}
              <line 
                x1={currentTimeline.pin.cx} 
                y1={currentTimeline.pin.cy} 
                x2={currentTimeline.pin.cx} 
                y2="160" 
                stroke="#c7d2fe" 
                strokeWidth="1.5" 
                strokeDasharray="3 3" 
              />
              <circle 
                cx={currentTimeline.pin.cx} 
                cy={currentTimeline.pin.cy} 
                r="5" 
                fill="#4f46e5" 
                stroke="#ffffff" 
                strokeWidth="2.5" 
              />
            </svg>

            {/* Dynamic Tooltip Badge */}
            <div style={{
              position: 'absolute',
              left: currentTimeline.tooltipPos.x,
              top: currentTimeline.tooltipPos.y,
              transform: 'translateX(-50%)',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: 'var(--shadow-elevated)',
              textAlign: 'center',
              pointerEvents: 'none',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{currentTimeline.tooltipDate}</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{currentTimeline.tooltipVal}</div>
              <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>↑ {currentTimeline.tooltipGrowth}</div>
            </div>

            {/* Dynamic X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
              {currentTimeline.xLabels.map((xl, i) => (
                <span key={i}>{xl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Budget Breakdown Donut */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
            Budget Allocation
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px' }}>
            Category distribution for ₹2.5 Cr target.
          </p>

          {/* Donut SVG */}
          <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px' }}>
            <svg width="130" height="130" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r="55" fill="none" stroke="#e2e8f0" strokeWidth="18" />
              <circle cx="75" cy="75" r="55" fill="none" stroke="#4f46e5" strokeWidth="18" strokeDasharray="120.9 345.5" strokeDashoffset="0" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="55" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray="86.3 345.5" strokeDashoffset="-120.9" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="55" fill="none" stroke="#f59e0b" strokeWidth="18" strokeDasharray="55.2 345.5" strokeDashoffset="-207.2" transform="rotate(-90 75 75)" />
              <circle cx="75" cy="75" r="55" fill="none" stroke="#0ea5e9" strokeWidth="18" strokeDasharray="34.5 345.5" strokeDashoffset="-262.4" transform="rotate(-90 75 75)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>₹2.5 Cr</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Total</div>
            </div>
          </div>

          {/* Clean Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#334155' }}>Royal Catering (35%)</span>
              <strong style={{ color: '#0f172a' }}>₹87.5 L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#334155' }}>Palace Licensing (25%)</span>
              <strong style={{ color: '#0f172a' }}>₹62.5 L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#334155' }}>Floral Architecture (16%)</span>
              <strong style={{ color: '#0f172a' }}>₹40.0 L</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#334155' }}>Concert AV & Sound (10%)</span>
              <strong style={{ color: '#0f172a' }}>₹25.0 L</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ROW 3: RECENT ACTIVITY & PROCUREMENT STATUS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Recent Activity */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Recent Activity
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#4f46e5', fontWeight: 600 }}>Live Feed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  SM
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>Siddharth Malpani • Inquiry</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rambagh Palace, Jaipur • 350 Guests • ML: 91.2%</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>2m ago</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  RC
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>Royal Marwar Caterers • OCR Bid</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>CAT-02 • 524 plates • WCI: 96.1/100</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>18m ago</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#faf5ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  AD
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>Aarav & Diya • Signed Agreement</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Milestone 1 (30%) Advance Confirmed: ₹90.0 L</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>42m ago</span>
            </div>
          </div>
        </div>

        {/* Procurement Status */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Procurement Milestones
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>12 Done</span>
              <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>8 Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>Catering Tasting & Plate Buffer</span>
              </div>
              <span className="badge badge-emerald">100% Complete</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>Concert AV & DG 125kVA Generator</span>
              </div>
              <span className="badge badge-emerald">100% Complete</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#4f46e5" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>One-Way Mirror Vendor Bidding</span>
              </div>
              <span className="badge badge-indigo">60% In Progress</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
