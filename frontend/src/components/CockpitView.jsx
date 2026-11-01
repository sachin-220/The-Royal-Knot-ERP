import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, Building2, Layers, Percent, TrendingUp, 
  AlertTriangle, CheckCircle2, Clock, ChevronDown, Send,
  ArrowRight, ShieldCheck, Check, BarChart2
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

export default function CockpitView({ wedding, founderData, dbHealth }) {
  const [atRiskLeads, setAtRiskLeads] = useState([]);
  const [followupStatus, setFollowupStatus] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState('30D');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const [currentTimeline, setCurrentTimeline] = useState(null);
  const [loadingChart, setLoadingChart] = useState(true);
  const [hoveredPalace, setHoveredPalace] = useState(null);
  const chartSvgRef = useRef(null);

  // Dynamically fetch revenue performance analytics from Python backend connected to PostgreSQL
  useEffect(() => {
    let isMounted = true;
    setLoadingChart(true);
    fetch(`http://127.0.0.1:5000/api/analytics/revenue-performance?timeframe=${activeTimeframe}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const { line, area } = generateSmoothPaths(data.points);
        setCurrentTimeline({
          ...data,
          pathLine: line,
          pathArea: area
        });
        setLoadingChart(false);
      })
      .catch(err => {
        console.error("Failed to load dynamic revenue performance data:", err);
        setLoadingChart(false);
      });
    return () => { isMounted = false; };
  }, [activeTimeframe]);

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

  // Dynamically fetch Cockpit Charts data directly from PostgreSQL and vendors_18.csv
  const [cockpitCharts, setCockpitCharts] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch(`http://127.0.0.1:5000/api/analytics/cockpit-charts?wedding_id=${wedding?.id || 1}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) setCockpitCharts(data);
      })
      .catch(err => console.error("Failed to fetch dynamic cockpit charts:", err));
    return () => { isMounted = false; };
  }, [wedding?.id]);

  const categoryPerformanceData = cockpitCharts?.category_performance || [];
  const weddingPortfolioData = cockpitCharts?.wedding_portfolio || [];
  const funnelStages = cockpitCharts?.funnel_stages || [];
  const portfolioAggregateMargin = cockpitCharts?.portfolio_aggregate_margin || '+21.6% Net Operating Profit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header (Breadcrumbs, Serif Title, Subtitle, Time Horizon Filters) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
            <span>Dashboard</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#a1a1aa' }}>...</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#18181b', fontWeight: 600 }}>Wedding Cockpit</span>
          </div>

          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Wedding ERP Cockpit
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Monitor client master ledger, milestone velocity, palace capacity, and financial performance.
          </p>
        </div>

        {/* Right side filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: '#ffffff',
            border: '1px solid #e7e7e4',
            borderRadius: '8px',
            padding: '3px'
          }}>
            {['7D', '30D', '90D', '1Y'].map(tf => {
              const active = activeTimeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => {
                    setActiveTimeframe(tf);
                    setHoverIndex(null);
                    setSelectedPointIndex(null);
                  }}
                  style={{
                    background: active ? '#18181b' : 'transparent',
                    color: active ? '#ffffff' : '#71717a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {tf}
                </button>
              );
            })}
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e7e7e4',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#18181b',
            fontWeight: 500
          }}>
            <span>All Palaces</span>
            <ChevronDown size={12} color="#71717a" />
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e7e7e4',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: '#18181b',
            fontWeight: 500
          }}>
            <span>All 18 Categories</span>
            <ChevronDown size={12} color="#71717a" />
          </div>
        </div>
      </div>

      {/* 2. Standout 48H Inaction Alert Banner */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '12px 18px',
          background: '#ffffff',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626'
            }}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-pill status-pill-red" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  At Risk of Loss
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#18181b' }}>
                  {atRiskLeads[0].name} ({atRiskLeads[0].preferred_city})
                </span>
                <span style={{ fontSize: '0.74rem', color: '#dc2626' }}>
                  Inaction: {atRiskLeads[0].hours_since_last_response || 48}h
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '2px' }}>
                Budget: ₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr • ML Score: {atRiskLeads[0].conversion_score}% • Venue: {atRiskLeads[0].preferred_venue || 'Rambagh Palace'}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSendFollowup(atRiskLeads[0].id)}
            className="btn-dark-pill"
            style={{ fontSize: '0.78rem', padding: '6px 14px', background: '#dc2626', borderColor: '#dc2626' }}
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
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#15803d',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={15} color="#16a34a" />
          <span>{followupStatus}</span>
        </div>
      )}

      {/* 3. EXACT FOUR PRIMARY KPI CARDS (1 ROW OF 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Card 1: Total Revenue */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Total Revenue
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            ₹68,500,000
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            +18.4% vs last season
          </div>
        </div>

        {/* Card 2: Active Weddings */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Active Weddings
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            25 Palaces
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            100% contracts executed
          </div>
        </div>

        {/* Card 3: Total Categories */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Total Categories
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            18 Categories
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            100% matrix complete
          </div>
        </div>

        {/* Card 4: Conversion Rate */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Percent size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Conversion Rate
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            91.2%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            +5.2% ML likelihood
          </div>
        </div>

      </div>

      {/* 4. PRIMARY ANALYTICAL ROW (2 COLUMNS): REVENUE TRENDS + LEAD CONVERSION FUNNEL */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.1fr', gap: '16px' }}>
        
        {/* Chart 1: Dynamic Revenue Trends Area Curve */}
        <div className="stocksense-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Revenue Trends
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717a', margin: '3px 0 0' }}>
                Contracted cash inflows across {currentTimeline?.label || 'the last 30 days'}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', background: '#f4f4f5', borderRadius: '8px', padding: '3px' }}>
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
                      background: activeTimeframe === tf ? '#18181b' : 'transparent',
                      color: activeTimeframe === tf ? '#ffffff' : '#71717a',
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
              {currentTimeline && (() => {
                const defaultIdx = activeTimeframe === '30D' ? 8 : (currentTimeline.points.length - 1);
                const effIdx = hoverIndex !== null 
                  ? hoverIndex 
                  : (selectedPointIndex !== null ? selectedPointIndex : defaultIdx);
                const pt = currentTimeline.points[effIdx] || currentTimeline.points[currentTimeline.points.length - 1];
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid #e7e7e4', minWidth: '160px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>
                        {pt.date.split(',')[0]} Inflow
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#18181b' }}>
                        {pt.value}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#a1a1aa' }}>Growth</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#16a34a' }}>
                        {pt.growth}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* DYNAMIC SVG CHART WITH REAL-TIME HOVER TRACKING */}
          {loadingChart || !currentTimeline ? (
            <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: '0.84rem', gap: '10px' }}>
              <div style={{ width: '22px', height: '22px', border: '2.5px solid #e7e7e4', borderTopColor: '#18181b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Syncing live revenue timeline from PostgreSQL database...</span>
            </div>
          ) : (() => {
            const defaultIdx = activeTimeframe === '30D' ? 8 : (currentTimeline.points.length - 1);
            const effectiveIndex = hoverIndex !== null 
              ? hoverIndex 
              : (selectedPointIndex !== null ? selectedPointIndex : defaultIdx);
            
            const activePoint = currentTimeline.points[effectiveIndex] || currentTimeline.points[currentTimeline.points.length - 1];
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
                  <line x1="0" y1="160" x2="700" y2="160" stroke="#f4f4f5" strokeWidth="1" />
                  <line x1="0" y1="120" x2="700" y2="120" stroke="#f4f4f5" strokeWidth="1" />
                  <line x1="0" y1="80" x2="700" y2="80" stroke="#f4f4f5" strokeWidth="1" />
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#f4f4f5" strokeWidth="1" />

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

                {/* Real-time Dynamic Floating Tooltip Badge matching Image 3 */}
                <div style={{
                  position: 'absolute',
                  left: `${clampedLeft}%`,
                  top: `${tooltipTop}px`,
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  border: '1px solid #e7e7e4',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  transition: 'left 0.12s ease-out, top 0.12s ease-out',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '0.66rem', color: '#a1a1aa', whiteSpace: 'nowrap' }}>{activePoint.date}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18181b', whiteSpace: 'nowrap' }}>{activePoint.value}</div>
                  <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>↑ {activePoint.growth}</div>
                </div>

                {/* Dynamic X-Axis Labels */}
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
                          color: isColActive ? '#4f46e5' : '#a1a1aa',
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

        {/* Chart 2: Lead Conversion Funnel (Replacing static pie chart) */}
        <div className="stocksense-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                  Lead Conversion Funnel
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#71717a', margin: '3px 0 16px' }}>
                  Inquiry-to-execution pipeline stages & ML qualification.
                </p>
              </div>
              <span className="badge-sku" style={{ fontSize: '0.68rem' }}>
                91.2% ML Win Rate
              </span>
            </div>

            {/* Funnel Stage Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {funnelStages.map((stg, idx) => {
                const widthPercent = (stg.count / 16) * 100;
                return (
                  <div key={stg.stage} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                      <span style={{ fontWeight: 600, color: '#27272a' }}>{stg.stage}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {stg.drop && (
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 500 }}>
                            {stg.drop}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, color: '#18181b' }}>{stg.count}</span>
                        <span style={{ color: '#71717a', fontSize: '0.68rem' }}>({stg.pct})</span>
                      </div>
                    </div>
                    {/* Tapered progress track */}
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#f4f4f5',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${widthPercent}%`,
                        height: '100%',
                        background: stg.color,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Bottom Analytical Summary */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #f4f4f5',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            textAlign: 'center'
          }}>
            <div style={{ padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>Avg Conversion Velocity</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>3.2 Days</div>
            </div>
            <div style={{ padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.65rem', color: '#71717a' }}>Lost-to-Inaction SLA</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>Zero Breaches</div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. SECONDARY ANALYTICAL ROW (2 COLUMNS): CATEGORY SPEND MATRIX + PALACE PORTFOLIO COMPARISON */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Chart 3: Category Performance & Spend Matrix (Horizontal Bar Chart) */}
        <div className="stocksense-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Category Spend Performance
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717a', margin: '3px 0 0' }}>
                Allocated budget vs contracted commitments across primary categories.
              </p>
            </div>
            <span className="badge-sku" style={{ fontSize: '0.68rem' }}>
              18 Matrix Locked
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryPerformanceData.map(cat => {
              const committedPct = (cat.committed / cat.allocated) * 100;
              const isOver = cat.committed > cat.allocated;
              return (
                <div key={cat.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#71717a', fontSize: '0.68rem' }}>{cat.code}</span>
                      <span style={{ fontWeight: 600, color: '#18181b' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#71717a', fontSize: '0.7rem' }}>
                        ₹{cat.committed.toFixed(1)}L / ₹{cat.allocated.toFixed(1)}L
                      </span>
                      <span className={`status-pill ${isOver ? 'status-pill-amber' : 'status-pill-green'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {cat.status}
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar Track */}
                  <div style={{
                    width: '100%',
                    height: '7px',
                    background: '#f4f4f5',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: `${Math.min(100, committedPct)}%`,
                      height: '100%',
                      background: isOver ? '#f59e0b' : '#4f46e5',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Wedding Portfolio Performance & Financial Comparison (Grouped Bar Chart) */}
        <div className="stocksense-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Palace Wedding Performance
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#71717a', margin: '3px 0 0' }}>
                Contracted valuation vs disbursed vendor costs across active palaces.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem', color: '#71717a' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4f46e5' }} /> Contracted
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }} /> Disbursed
              </span>
            </div>
          </div>

          {/* Grouped Bar Chart SVG */}
          <div style={{ position: 'relative', width: '100%', height: '170px' }}>
            <svg width="100%" height="170" viewBox="0 0 500 170" preserveAspectRatio="none">
              {/* Background grid */}
              <line x1="0" y1="130" x2="500" y2="130" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f4f4f5" strokeWidth="1" />
              <line x1="0" y1="10" x2="500" y2="10" stroke="#f4f4f5" strokeWidth="1" />

              {/* Grouped Bars per Palace */}
              {weddingPortfolioData.map((pal, idx) => {
                const groupX = 20 + idx * 95;
                const maxVal = 5.0; // ₹5.0 Cr max height scale
                const bar1Height = (pal.contracted / maxVal) * 120;
                const bar2Height = (pal.disbursed / maxVal) * 120;
                const isHovered = hoveredPalace === pal.palace;

                return (
                  <g 
                    key={pal.palace}
                    onMouseEnter={() => setHoveredPalace(pal.palace)}
                    onMouseLeave={() => setHoveredPalace(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Active Column Subtle Background Glow */}
                    {isHovered && (
                      <rect
                        x={groupX - 6}
                        y={4}
                        width="52"
                        height="146"
                        fill="#f4f4f5"
                        rx="6"
                        opacity="0.6"
                      />
                    )}

                    {/* Transparent Full-Height Hitbox for Reliable Hover */}
                    <rect
                      x={groupX - 8}
                      y={0}
                      width="56"
                      height="160"
                      fill="transparent"
                    />

                    {/* Contracted Bar */}
                    <rect
                      x={groupX}
                      y={130 - bar1Height}
                      width="18"
                      height={bar1Height}
                      fill={isHovered ? '#4338ca' : '#4f46e5'}
                      rx="3"
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    {/* Disbursed Bar */}
                    <rect
                      x={groupX + 22}
                      y={130 - bar2Height}
                      width="18"
                      height={bar2Height}
                      fill={isHovered ? '#059669' : '#10b981'}
                      rx="3"
                      style={{ transition: 'all 0.2s ease' }}
                    />
                    {/* Bottom Label */}
                    <text
                      x={groupX + 20}
                      y="148"
                      fill={isHovered ? '#18181b' : '#71717a'}
                      fontSize="9"
                      fontWeight={isHovered ? '700' : '600'}
                      textAnchor="middle"
                    >
                      {pal.city}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Dynamic Hover Tooltip Centered Directly Above the Active Palace Bar */}
            {hoveredPalace && (() => {
              const targetIdx = weddingPortfolioData.findIndex(p => p.palace === hoveredPalace);
              const target = weddingPortfolioData[targetIdx] || weddingPortfolioData[0];
              const pctLeft = targetIdx >= 0 ? ((20 + targetIdx * 95 + 20) / 500) * 100 : 50;
              const clampedLeft = Math.min(Math.max(pctLeft, 18), 82);

              return (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: `${clampedLeft}%`,
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  border: '1px solid #d4d4d8',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  fontSize: '0.74rem',
                  boxShadow: '0 8px 16px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  whiteSpace: 'nowrap'
                }}>
                  <div style={{ fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{target.palace}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#71717a' }}>({target.city})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 600 }}>Contracted: ₹{target.contracted} Cr</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>Disbursed: ₹{target.disbursed} Cr</span>
                  </div>
                  <div style={{ color: '#71717a', fontSize: '0.68rem', marginTop: '2px' }}>
                    Margin: <strong style={{ color: '#16a34a' }}>{target.margin}</strong> • {target.guests} Guests
                  </div>
                  {/* Downward indicator arrow */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-5px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '8px',
                    height: '8px',
                    background: '#ffffff',
                    borderRight: '1px solid #d4d4d8',
                    borderBottom: '1px solid #d4d4d8'
                  }} />
                </div>
              );
            })()}
          </div>

          {/* Bottom Aggregate Comparison Row */}
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #f4f4f5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem'
          }}>
            <span style={{ color: '#71717a' }}>Portfolio Aggregate Margin:</span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{portfolioAggregateMargin}</span>
          </div>
        </div>

      </div>

      {/* 6. BOTTOM SECTION (2 CARDS): RECENT OPERATIONAL ACTIVITY & PROCUREMENT MILESTONES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Recent Activity */}
        <div className="stocksense-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Recent Operational Activity
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#71717a', margin: '2px 0 0' }}>
                Live updates across client inquiries, OCR bids, and signed agreements
              </p>
            </div>
            <span className="status-pill status-pill-green" style={{ fontSize: '0.7rem' }}>
              Live Feed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  SM
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#18181b', fontWeight: 600 }}>Siddharth Malpani • Inquiry</div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a' }}>Rambagh Palace, Jaipur • 350 Guests • ML: 91.2%</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>2m ago</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  RC
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#18181b', fontWeight: 600 }}>Royal Marwar Caterers • OCR Bid</div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a' }}>CAT-02 • 524 plates • WCI: 96.1/100</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>18m ago</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#faf5ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                  AD
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#18181b', fontWeight: 600 }}>Aarav & Diya • Signed Agreement</div>
                  <div style={{ fontSize: '0.72rem', color: '#71717a' }}>Milestone 1 Advance Confirmed: ₹90.0 L</div>
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>42m ago</span>
            </div>
          </div>
        </div>

        {/* Procurement Milestones */}
        <div className="stocksense-card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Procurement & Ceremony Milestones
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#71717a', margin: '2px 0 0' }}>
                Execution readiness across active wedding tracks
              </p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.7rem' }}>12 Done</span>
              <span className="status-pill status-pill-neutral" style={{ fontSize: '0.7rem' }}>8 Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#18181b' }}>Catering Tasting & Plate Buffer</span>
              </div>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.7rem' }}>100% Complete</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#18181b' }}>Concert AV & DG 125kVA Generator</span>
              </div>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.7rem' }}>100% Complete</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#18181b' }}>Toran Gate Wristband Verification</span>
              </div>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.7rem' }}>Active Sync</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#4f46e5" />
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#18181b' }}>One-Way Mirror Vendor Bidding</span>
              </div>
              <span className="status-pill status-pill-amber" style={{ fontSize: '0.7rem' }}>60% In Progress</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
