import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Users, DollarSign, Calendar, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3, Database,
  AlertTriangle, Send, ChevronRight, MoreVertical, Folder, Percent, 
  Check, Clock, MessageSquare, ArrowRight, UserPlus
} from 'lucide-react';

// Catmull-Rom smooth bezier path generator guaranteeing every point is on the curve
function generateSmoothPaths(pts) {
  if (!pts || pts.length === 0) return { line: '', area: '' };
  const first = pts[0];
  const last = pts[pts.length - 1];
  
  let line = `M 0 ${first.y} L ${first.x} ${first.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[0];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  line += ` L 700 ${last.y}`;
  const area = `${line} L 700 180 L 0 180 Z`;
  return { line, area };
}

// Master timeline datasets with discrete points for real-time hover interactivity
const rawTimelineData = {
  '7D': {
    label: 'the last 7 days',
    totalRevenue: '₹14,250,000',
    growthRate: '+18.2%',
    defaultIndex: 4,
    points: [
      { x: 40,  y: 168, date: 'Oct 25, 2026', value: '₹1,420,000', growth: '+5.2%' },
      { x: 140, y: 156, date: 'Oct 26, 2026', value: '₹1,980,000', growth: '+8.1%' },
      { x: 245, y: 132, date: 'Oct 27, 2026', value: '₹2,640,000', growth: '+10.4%' },
      { x: 350, y: 114, date: 'Oct 28, 2026', value: '₹3,150,000', growth: '+12.8%' },
      { x: 450, y: 92,  date: 'Oct 29, 2026', value: '₹3,850,000', growth: '+14.6%' },
      { x: 555, y: 68,  date: 'Oct 30, 2026', value: '₹4,320,000', growth: '+16.5%' },
      { x: 660, y: 46,  date: 'Oct 31, 2026', value: '₹4,890,000', growth: '+18.2%' },
    ],
    xLabels: ['Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29', 'Oct 30', 'Oct 31']
  },
  '30D': {
    label: 'the last 30 days',
    totalRevenue: '₹68,500,000',
    growthRate: '+12.8%',
    defaultIndex: 4,
    points: [
      { x: 30,  y: 160, date: 'Nov 14, 2026', value: '₹8,450,000',  growth: '+6.5%' },
      { x: 110, y: 145, date: 'Nov 17, 2026', value: '₹11,200,000', growth: '+7.8%' },
      { x: 190, y: 132, date: 'Nov 20, 2026', value: '₹14,900,000', growth: '+9.4%' },
      { x: 270, y: 118, date: 'Nov 23, 2026', value: '₹16,400,000', growth: '+10.9%' },
      { x: 350, y: 88,  date: 'Nov 26, 2026', value: '₹18,245,000', growth: '+12.4%' },
      { x: 430, y: 104, date: 'Nov 29, 2026', value: '₹19,800,000', growth: '+11.8%' },
      { x: 510, y: 84,  date: 'Dec 02, 2026', value: '₹22,650,000', growth: '+13.7%' },
      { x: 590, y: 64,  date: 'Dec 05, 2026', value: '₹25,900,000', growth: '+14.9%' },
      { x: 670, y: 42,  date: 'Dec 08, 2026', value: '₹28,150,000', growth: '+16.1%' },
    ],
    xLabels: ['Nov 14', 'Nov 17', 'Nov 20', 'Nov 23', 'Nov 26', 'Nov 29', 'Dec 2', 'Dec 5', 'Dec 8']
  },
  '90D': {
    label: 'the last 90 days',
    totalRevenue: '₹184,200,000',
    growthRate: '+24.5%',
    defaultIndex: 3,
    points: [
      { x: 35,  y: 172, date: 'Aug 01, 2026', value: '₹18,500,000', growth: '+12.0%' },
      { x: 140, y: 154, date: 'Aug 15, 2026', value: '₹26,400,000', growth: '+14.5%' },
      { x: 245, y: 136, date: 'Sep 01, 2026', value: '₹34,100,000', growth: '+17.2%' },
      { x: 350, y: 106, date: 'Sep 15, 2026', value: '₹42,500,000', growth: '+19.8%' },
      { x: 455, y: 76,  date: 'Oct 01, 2026', value: '₹51,800,000', growth: '+22.1%' },
      { x: 560, y: 52,  date: 'Oct 15, 2026', value: '₹62,400,000', growth: '+23.9%' },
      { x: 665, y: 26,  date: 'Oct 31, 2026', value: '₹74,200,000', growth: '+25.8%' },
    ],
    xLabels: ['Aug 1', 'Aug 15', 'Sep 1', 'Sep 15', 'Oct 1', 'Oct 15', 'Oct 31']
  },
  '1Y': {
    label: 'the past 12 months',
    totalRevenue: '₹685,000,000',
    growthRate: '+31.4%',
    defaultIndex: 4,
    points: [
      { x: 35,  y: 168, date: 'Nov 2025', value: '₹48,000,000',  growth: '+18.4%' },
      { x: 140, y: 148, date: 'Jan 2026', value: '₹95,000,000',  growth: '+21.5%' },
      { x: 245, y: 126, date: 'Mar 2026', value: '₹162,000,000', growth: '+24.8%' },
      { x: 350, y: 98,  date: 'May 2026', value: '₹248,000,000', growth: '+27.4%' },
      { x: 455, y: 64,  date: 'Jul 2026', value: '₹375,000,000', growth: '+29.6%' },
      { x: 560, y: 38,  date: 'Sep 2026', value: '₹520,000,000', growth: '+32.8%' },
      { x: 665, y: 16,  date: 'Nov 2026', value: '₹685,000,000', growth: '+35.2%' },
    ],
    xLabels: ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov']
  }
};

// Precompute smooth svg paths for each timeline dataset
const timelineData = Object.keys(rawTimelineData).reduce((acc, key) => {
  const item = rawTimelineData[key];
  const { line, area } = generateSmoothPaths(item.points);
  acc[key] = {
    ...item,
    pathLine: line,
    pathArea: area
  };
  return acc;
}, {});

export default function CockpitView({ wedding, founderData, dbHealth }) {
  const [atRiskLeads, setAtRiskLeads] = useState([]);
  const [followupStatus, setFollowupStatus] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState('30D');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const chartSvgRef = useRef(null);

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
                    onClick={() => {
                      setActiveTimeframe(tf);
                      setHoverIndex(null);
                      setSelectedPointIndex(null);
                    }}
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

              {/* Dynamic Metric indicators (updates on hover) */}
              {(() => {
                const effIdx = hoverIndex !== null 
                  ? hoverIndex 
                  : (selectedPointIndex !== null ? selectedPointIndex : (currentTimeline.defaultIndex ?? 4));
                const pt = currentTimeline.points[effIdx] || currentTimeline.points[0];
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0', minWidth: '160px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                        {pt.date.split(',')[0]} Inflow
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        {pt.value}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Growth</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                        {pt.growth}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* DYNAMIC SVG CHART WITH REAL-TIME HOVER TRACKING */}
          {(() => {
            const effectiveIndex = hoverIndex !== null 
              ? hoverIndex 
              : (selectedPointIndex !== null ? selectedPointIndex : (currentTimeline.defaultIndex ?? 4));
            
            const activePoint = currentTimeline.points[effectiveIndex] || currentTimeline.points[0];
            const rawPercent = (activePoint.x / 700) * 100;
            const clampedLeft = Math.max(12, Math.min(88, rawPercent));
            const tooltipTop = Math.max(8, activePoint.y - 70);

            return (
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: '220px', 
                  marginTop: '10px', 
                  userSelect: 'none'
                }}
              >
                <svg 
                  ref={chartSvgRef}
                  width="100%" 
                  height="190" 
                  viewBox="0 0 700 190" 
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible' }}
                >
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

                  {/* Real-time Vertical Guideline to hovered point */}
                  <line 
                    x1={activePoint.x} 
                    y1={activePoint.y} 
                    x2={activePoint.x} 
                    y2="175" 
                    stroke="#818cf8" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 3" 
                    style={{ transition: 'x1 0.1s ease-out, y1 0.1s ease-out, x2 0.1s ease-out' }}
                  />

                  {/* Outer Glow Halo Ring */}
                  <circle 
                    cx={activePoint.x} 
                    cy={activePoint.y} 
                    r="9" 
                    fill="#4f46e5" 
                    fillOpacity="0.22"
                    style={{ transition: 'cx 0.1s ease-out, cy 0.1s ease-out' }}
                  />

                  {/* Discrete interactive data points on curve */}
                  {currentTimeline.points.map((pt, i) => (
                    <circle
                      key={`dot-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={i === effectiveIndex ? 6 : 4}
                      fill={i === effectiveIndex ? '#4f46e5' : '#a5b4fc'}
                      stroke="#ffffff"
                      strokeWidth={i === effectiveIndex ? 2 : 1}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => {
                        setHoverIndex(i);
                        setSelectedPointIndex(i);
                      }}
                      onClick={() => {
                        setSelectedPointIndex(i);
                        setHoverIndex(i);
                      }}
                    />
                  ))}

                  {/* Full vertical transparent slices covering every point for instant hover reaction */}
                  {currentTimeline.points.map((pt, i) => {
                    const pts = currentTimeline.points;
                    const prevX = i > 0 ? (pts[i - 1].x + pt.x) / 2 : 0;
                    const nextX = i < pts.length - 1 ? (pt.x + pts[i + 1].x) / 2 : 700;
                    const colWidth = nextX - prevX;
                    return (
                      <rect
                        key={`slice-${i}`}
                        x={prevX}
                        y="0"
                        width={colWidth}
                        height="190"
                        fill="transparent"
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        onMouseEnter={() => {
                          setHoverIndex(i);
                          setSelectedPointIndex(i);
                        }}
                        onMouseMove={() => {
                          if (hoverIndex !== i) {
                            setHoverIndex(i);
                            setSelectedPointIndex(i);
                          }
                        }}
                        onClick={() => {
                          setSelectedPointIndex(i);
                          setHoverIndex(i);
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Real-time Dynamic Floating Tooltip Badge */}
                <div style={{
                  position: 'absolute',
                  left: `${clampedLeft}%`,
                  top: `${tooltipTop}px`,
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  transition: 'left 0.12s ease-out, top 0.12s ease-out',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '0.66rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{activePoint.date}</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{activePoint.value}</div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>↑ {activePoint.growth}</div>
                </div>

                {/* Dynamic X-Axis Labels with active column highlight and clickability */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '6px', padding: '0 4px' }}>
                  {currentTimeline.xLabels.map((xl, i) => {
                    const isColActive = i === effectiveIndex;
                    return (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedPointIndex(i);
                          setHoverIndex(i);
                        }}
                        onMouseEnter={() => {
                          setHoverIndex(i);
                          setSelectedPointIndex(i);
                        }}
                        style={{
                          background: isColActive ? '#eef2ff' : 'transparent',
                          border: isColActive ? '1px solid #c7d2fe' : '1px solid transparent',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.68rem',
                          color: isColActive ? '#4f46e5' : '#94a3b8',
                          fontWeight: isColActive ? 700 : 500,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {xl}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
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
