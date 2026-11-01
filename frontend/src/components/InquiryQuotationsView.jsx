import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Search, Sparkles, Send, CheckCircle2, AlertTriangle, 
  ShieldAlert, Award, Clock, DollarSign, Users, ChevronRight, RefreshCw, 
  Eye, Check, Filter, ArrowUpRight, BarChart2, PieChart as PieIcon, ExternalLink, Mail, MessageSquare
} from 'lucide-react';

export default function InquiryQuotationsView({ weddingId = 1 }) {
  const [inquiryRef, setInquiryRef] = useState('INQ-0011');
  const [availableInquiries, setAvailableInquiries] = useState([
    { ref: 'INQ-0011', name: 'Aarav & Diya', city: 'Udaipur', guests: 400, budget: '₹4.00 Cr' },
    { ref: 'INQ-0001', name: 'Kabir Singhania', city: 'Jaipur', guests: 450, budget: '₹3.00 Cr' },
    { ref: 'INQ-0009', name: 'Aarav & Diya (Pre-Signing)', city: 'Udaipur', guests: 400, budget: '₹3.00 Cr' }
  ]);
  
  const [inquiryData, setInquiryData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Summarise & Send to Client State
  const [summarising, setSummarising] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Finalization State
  const [finalizingId, setFinalizingId] = useState(null);
  const [finalizeSuccess, setFinalizeSuccess] = useState(null);

  // Chart Interactive Hover & Selection States
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Fetch Available Inquiries
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/inquiries')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(i => ({
            ref: i.inquiry_ref || `INQ-${String(i.id).padStart(4, '0')}`,
            name: i.name,
            city: i.preferred_city,
            guests: i.guest_count,
            budget: `₹${(parseFloat(i.budget_inr || 0) / 10000000).toFixed(2)} Cr`,
            chat_id: i.chat_id
          }));
          setAvailableInquiries(mapped);
          if (mapped.length > 0 && !mapped.some(m => m.ref === inquiryRef)) {
            setInquiryRef(mapped[0].ref);
          }
        }
      })
      .catch(err => console.error("Could not fetch inquiries list:", err));
  }, []);

  // Fetch Quotes for Selected Inquiry
  const fetchQuotesForInquiry = async (ref) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${ref}/quotes`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setInquiryData(data.inquiry);
      setQuotes(data.quotes || []);
    } catch (err) {
      console.error("Failed to load inquiry quotes:", err);
      setError("Unable to load quotations for " + ref);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotesForInquiry(inquiryRef);
  }, [inquiryRef]);

  // Summarise & Send to Client via Telegram Bot (@Royalknot_bot)
  const handleSummariseAndSend = async () => {
    try {
      setSummarising(true);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryRef}/summarise-and-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setSummaryResult(data);
        setShowSummaryModal(true);
      } else {
        alert("Summarise error: " + (data.error || "Failed to dispatch"));
      }
    } catch (err) {
      console.error("Summarise request failed:", err);
      alert("Error sending summary: " + err.message);
    } finally {
      setSummarising(false);
    }
  };

  // Finalize Quote Directly
  const handleFinalizeQuote = async (quoteId) => {
    try {
      setFinalizingId(quoteId);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryRef}/finalize-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId })
      });
      const data = await res.json();
      if (data.success) {
        setFinalizeSuccess(data);
        fetchQuotesForInquiry(inquiryRef);
      } else {
        alert("Finalize error: " + (data.error || "Could not award quote"));
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setFinalizingId(null);
    }
  };

  // Filtered quotes based on category filter
  const displayedQuotes = categoryFilter === 'ALL' 
    ? quotes 
    : quotes.filter(q => q.category_code === categoryFilter);

  // Group quotes by category for Pie Chart
  const categoryCounts = quotes.reduce((acc, q) => {
    const code = q.category_code || 'CAT-OTHER';
    const name = q.category_name || 'Services';
    if (!acc[code]) {
      acc[code] = { code, name, count: 0, totalAmount: 0 };
    }
    acc[code].count += 1;
    acc[code].totalAmount += parseFloat(q.quoted_price || 0);
    return acc;
  }, {});

  const pieCategories = Object.values(categoryCounts);
  const totalQuoteCount = quotes.length;

  const categoryColors = {
    'CAT-02': '#4f46e5', // Royal Catering - Indigo
    'CAT-03': '#10b981', // Floral - Emerald
    'CAT-04': '#8b5cf6', // Thematic Decor - Purple
    'CAT-05': '#f59e0b', // Sound & AV - Amber
    'CAT-06': '#ec4899', // Entertainment - Pink
    'CAT-07': '#06b6d4', // Cinematography - Cyan
    'CAT-01': '#b45309', // Venue Royalty - Gold
  };

  // Data for Line Graph (Ordered by Quoted Price ascending)
  const sortedQuotesForLine = [...quotes].sort((a, b) => parseFloat(a.quoted_price) - parseFloat(b.quoted_price));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* StockSense Breadcrumbs, Serif Heading, Subtitle & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
            <span>KnotCore</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span>Procurement</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#18181b', fontWeight: 600 }}>Inquiry Quotations</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Inquiry Quotations & Multi-Vendor Comparison
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Commercial proposals mapped dynamically to client inquiries under the One-Way Mirror blind bidding protocol.
          </p>
        </div>

        {/* Top Action: Summarise & Send to Client via Bot Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSummariseAndSend}
            disabled={summarising || quotes.length === 0}
            className="btn-dark-pill"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            {summarising ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Dispatching Summary...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} color="#f59e0b" />
                <span>Summarise & Send to Client</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Inquiry Filter & Active Metadata Card */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Filter Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}>
              <Search size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Filter by Inquiry Reference ID
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={inquiryRef}
                  onChange={(e) => setInquiryRef(e.target.value.toUpperCase())}
                  placeholder="e.g. INQ-0011"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    width: '160px',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => fetchQuotesForInquiry(inquiryRef)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Quick Select Inquiry Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Quick Switch:</span>
            {availableInquiries.map((inq) => (
              <button
                key={inq.ref}
                onClick={() => setInquiryRef(inq.ref)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: inquiryRef === inq.ref ? '1.5px solid #4f46e5' : '1px solid #e2e8f0',
                  background: inquiryRef === inq.ref ? '#eef2ff' : '#ffffff',
                  color: inquiryRef === inq.ref ? '#4f46e5' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: inquiryRef === inq.ref ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {inq.ref} ({inq.name.split(' ')[0]})
              </button>
            ))}
          </div>

        </div>

        {/* Inquiry Profile Details */}
        <div style={{
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>CLIENT / COUPLE</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {inquiryData?.name || 'Aarav & Diya'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>DESTINATION & VENUE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
              {inquiryData?.preferred_city || 'Udaipur'} (Heritage Palace Grounds)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>GUEST SCOPE / TURNOUT</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
              {inquiryData?.guest_count || 400} Guests (524 Buffet Plates)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>BUDGET ALLOCATION</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e', marginTop: '2px' }}>
              ₹{(parseFloat(inquiryData?.budget_inr || 40000000) / 10000000).toFixed(2)} Crores
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>QUOTATIONS LOGGED</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
              {quotes.length} Verified Bids
            </div>
          </div>
        </div>
      </div>

      {/* 3. Success / Finalization Alert Banner if Triggered */}
      {finalizeSuccess && (
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#166534'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                Vendor Contract Finalized & Awarded!
              </div>
              <div style={{ fontSize: '0.84rem', marginTop: '2px' }}>
                Purchase Order <b>{finalizeSuccess.details?.po_ref}</b> has been issued. 
                Decline emails were automatically dispatched to competing bidders via SMTP.
              </div>
            </div>
          </div>
          <button
            onClick={() => setFinalizeSuccess(null)}
            style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. VISUAL ANALYTICS: Interactive Line Graph & Category Pie Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* CHART A: Interactive Price Dispersion Line Graph with Hover Tooltip */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Unique Price Distribution Curve
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                Price Variation at Each Quoted Point
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#64748b' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f46e5', display: 'inline-block' }} />
              <span>Quoted Bid</span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', marginLeft: '6px' }} />
              <span>+2σ Anomaly</span>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px' }}>
            Hover over any price node on the curve to inspect vendor identity, rate breakdown, and WCI rating.
          </p>

          {/* SVG Line Graph */}
          <div style={{ position: 'relative', width: '100%', minHeight: '260px' }}>
            <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              
              {/* Horizontal Reference Lines (₹10L to ₹70L) */}
              {[15, 30, 45, 60].map((val) => {
                const y = 200 - (val / 70) * 170;
                return (
                  <g key={val}>
                    <line x1="45" y1={y} x2="570" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="38" y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end" fontFamily="Roboto">
                      ₹{val}L
                    </text>
                  </g>
                );
              })}

              {/* Historical Median Benchmark Line (₹50.0L) */}
              <line x1="45" y1={200 - (50 / 70) * 170} x2="570" y2={200 - (50 / 70) * 170} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
              <text x="560" y={200 - (50 / 70) * 170 - 6} fill="#4f46e5" fontSize="9" fontWeight="700" textAnchor="end">
                Benchmark Median: ₹50.0L
              </text>

              {/* +2-Sigma Outlier Line (₹58.0L) */}
              <line x1="45" y1={200 - (58 / 70) * 170} x2="570" y2={200 - (58 / 70) * 170} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
              <text x="560" y={200 - (58 / 70) * 170 - 6} fill="#dc2626" fontSize="9" fontWeight="700" textAnchor="end">
                +2σ Threshold: ₹58.0L
              </text>

              {/* Connected Line Path */}
              {sortedQuotesForLine.length > 1 && (
                <path
                  d={sortedQuotesForLine.map((q, idx) => {
                    const step = (525 - 60) / Math.max(1, sortedQuotesForLine.length - 1);
                    const x = 60 + idx * step;
                    const priceL = parseFloat(q.quoted_price) / 100000;
                    const y = 200 - (Math.min(70, priceL) / 70) * 170;
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Unique Price Data Nodes */}
              {sortedQuotesForLine.map((q, idx) => {
                const step = (525 - 60) / Math.max(1, sortedQuotesForLine.length - 1);
                const x = 60 + idx * step;
                const priceL = parseFloat(q.quoted_price) / 100000;
                const y = 200 - (Math.min(70, priceL) / 70) * 170;
                const isAnomaly = priceL > 58.0 || q.anomaly_flag;
                const activeQuote = hoveredPoint || selectedPoint;
                const isCurrent = activeQuote?.id === q.id;

                return (
                  <g 
                    key={q.id}
                    onMouseEnter={() => setHoveredPoint(q)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => setSelectedPoint(selectedPoint?.id === q.id ? null : q)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Vertical guideline on hover/selection */}
                    {isCurrent && (
                      <line 
                        x1={x} 
                        y1={y} 
                        x2={x} 
                        y2={200} 
                        stroke={isAnomaly ? '#dc2626' : '#6366f1'} 
                        strokeWidth="1.5" 
                        strokeDasharray="3 3" 
                        opacity="0.7" 
                      />
                    )}

                    {/* Generous invisible hit-target circle */}
                    <circle cx={x} cy={y} r="22" fill="transparent" />

                    {/* Outer Pulsing Glow */}
                    {isCurrent && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        fill="none" 
                        stroke={isAnomaly ? '#dc2626' : '#4f46e5'} 
                        strokeWidth="2.5" 
                        opacity="0.45" 
                      />
                    )}
                    
                    {/* Node Circle */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isCurrent ? "8" : "5.5"} 
                      fill={isAnomaly ? '#dc2626' : (q.status === 'awarded' ? '#16a34a' : '#4f46e5')} 
                      stroke="#ffffff" 
                      strokeWidth="2" 
                    />

                    {/* Price Label */}
                    <text 
                      x={x} 
                      y={y - 10} 
                      fill={isAnomaly ? '#dc2626' : '#1e293b'} 
                      fontSize="9.5" 
                      fontWeight="700" 
                      textAnchor="middle"
                    >
                      ₹{priceL.toFixed(1)}L
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Floating Hover / Selection Details Card */}
            {(() => {
              const active = hoveredPoint || selectedPoint;
              if (active) {
                const priceNum = parseFloat(active.quoted_price || 0);
                const priceL = (priceNum / 100000).toFixed(2);
                const variance = ((priceNum - 5000000) / 5000000) * 100;
                const isAnomaly = priceNum > 5800000 || active.anomaly_flag;

                return (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '12px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                    minWidth: '260px',
                    maxWidth: '300px',
                    zIndex: 20,
                    border: isAnomaly ? '1.5px solid #dc2626' : '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
                        {active.category_code} ({active.category_name})
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: active.status === 'awarded' ? '#15803d' : (isAnomaly ? '#991b1b' : '#334155'),
                        color: '#ffffff'
                      }}>
                        {active.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc', marginBottom: '6px', lineHeight: 1.2 }}>
                      {active.vendor_name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Quoted Price:</span>
                      <span style={{ fontWeight: 800, color: '#38bdf8' }}>
                        ₹{priceL} Lakhs
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Exact INR:</span>
                      <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                        ₹{priceNum.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Unit / Plate Rate:</span>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                        {active.unit_rate ? `₹${parseFloat(active.unit_rate).toLocaleString('en-IN')}` : 'Included'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>WCI Score:</span>
                      <span style={{ fontWeight: 800, color: '#4ade80' }}>
                        {active.wci_score} / 100
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Benchmark Variance:</span>
                      <span style={{ fontWeight: 700, color: variance > 0 ? '#f87171' : '#34d399' }}>
                        {variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`} vs Median
                      </span>
                    </div>

                    {isAnomaly && (
                      <div style={{ color: '#fca5a5', background: 'rgba(220, 38, 38, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, marginTop: '8px' }}>
                        Exceeds +2-Sigma Outlier Ceiling
                      </div>
                    )}

                    <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
                      {selectedPoint?.id === active.id ? 'Card Locked • Tap point to release' : 'Tap node to lock details'}
                    </div>
                  </div>
                );
              }

              // Default Curve Overview when no node is hovered
              const lowest = sortedQuotesForLine[0];
              const highest = sortedQuotesForLine[sortedQuotesForLine.length - 1];

              return (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  maxWidth: '240px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontWeight: 800, color: '#e2e8f0', marginBottom: '4px' }}>
                    Price Curve Metrics
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.73rem', marginBottom: '6px' }}>
                    Hover over any node along the curve to inspect vendor quote details.
                  </div>
                  {lowest && highest && (
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Lowest Bid:</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>₹{(parseFloat(lowest.quoted_price)/100000).toFixed(1)}L</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Highest Bid:</span>
                        <span style={{ fontWeight: 700, color: '#f87171' }}>₹{(parseFloat(highest.quoted_price)/100000).toFixed(1)}L</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* CHART B: Interactive Quotation Volume & Category Breakdown Pie / Donut Chart */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Quotation Volume for {inquiryRef}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                Quotations Received by Service Category
              </h3>
            </div>
            <div style={{
              background: '#eef2ff',
              color: '#4f46e5',
              fontWeight: 800,
              fontSize: '0.8rem',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              {quotes.length} Quotes Received
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px' }}>
            Volume breakdown of all competing vendor proposals logged under <b>{inquiryRef}</b>. Hover or click a category to inspect volume and filter.
          </p>

          {/* SVG Pie / Donut Visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', minHeight: '220px' }}>
            
            {/* SVG Donut Circle */}
            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {(() => {
                  let accumulatedPercent = 0;
                  return pieCategories.map((cat) => {
                    const percent = totalQuoteCount > 0 ? (cat.count / totalQuoteCount) * 100 : 0;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;
                    const color = categoryColors[cat.code] || '#64748b';
                    const isHovered = hoveredSlice?.code === cat.code || categoryFilter === cat.code;

                    return (
                      <circle
                        key={cat.code}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={color}
                        strokeWidth={isHovered ? "20" : "16"}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        pathLength="100"
                        onMouseEnter={() => setHoveredSlice(cat)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => setCategoryFilter(categoryFilter === cat.code ? 'ALL' : cat.code)}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Donut Center Display */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {quotes.length}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                  Total Quotes
                </div>
              </div>
            </div>

            {/* Pie Legend & Share Breakdown */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pieCategories.map((cat) => {
                  const percent = totalQuoteCount > 0 ? ((cat.count / totalQuoteCount) * 100).toFixed(0) : 0;
                  const color = categoryColors[cat.code] || '#64748b';
                  const isHovered = hoveredSlice?.code === cat.code;
                  const isSelected = categoryFilter === cat.code;

                  return (
                    <div 
                      key={cat.code}
                      onMouseEnter={() => setHoveredSlice(cat)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => setCategoryFilter(categoryFilter === cat.code ? 'ALL' : cat.code)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: isSelected ? '#eff6ff' : (isHovered ? '#f8fafc' : 'transparent'),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid #3b82f6' : (isHovered ? `1px solid ${color}` : '1px solid transparent'),
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: color }} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                          {cat.name} ({cat.code})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                          {cat.count} quotes
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                          ({percent}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hover Highlight Box */}
              {hoveredSlice ? (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  color: '#334155'
                }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>
                    {hoveredSlice.name} ({hoveredSlice.code})
                  </div>
                  <div>
                    Quotations Received: <b>{hoveredSlice.count}</b> out of {quotes.length} ({totalQuoteCount > 0 ? ((hoveredSlice.count / totalQuoteCount) * 100).toFixed(1) : 0}%)
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    Total Value: <b>₹{(hoveredSlice.totalAmount / 100000).toFixed(2)} Lakhs</b> • Avg: <b>₹{((hoveredSlice.totalAmount / hoveredSlice.count) / 100000).toFixed(2)} Lakhs</b>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6366f1', marginTop: '4px', fontWeight: 600 }}>
                    Click category to filter table below
                  </div>
                </div>
              ) : categoryFilter !== 'ALL' ? (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#1d4ed8',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Filtering by: <b>{categoryFilter}</b></span>
                  <span 
                    onClick={() => setCategoryFilter('ALL')}
                    style={{ cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Clear Filter
                  </span>
                </div>
              ) : null}
            </div>

          </div>
        </div>

      </div>

      {/* 5. Itemized Quotations Table under this Inquiry */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Quotations Received for {inquiryRef}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
              One-Way Mirror Blind Bids ranked by Weighted Composite Index (WCI).
            </p>
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'CAT-02', 'CAT-03', 'CAT-05'].map((code) => (
              <button
                key={code}
                onClick={() => setCategoryFilter(code)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: categoryFilter === code ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                  background: categoryFilter === code ? '#0f172a' : '#ffffff',
                  color: categoryFilter === code ? '#ffffff' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {code === 'ALL' ? 'All Categories' : code}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Vendor & Company</th>
                <th style={{ padding: '12px 16px' }}>Category & Scope</th>
                <th style={{ padding: '12px 16px' }}>Plates / Qty</th>
                <th style={{ padding: '12px 16px' }}>Quoted Price</th>
                <th style={{ padding: '12px 16px' }}>WCI Score</th>
                <th style={{ padding: '12px 16px' }}>Anomaly Check</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Procurement Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    No quotations found for this category under {inquiryRef}.
                  </td>
                </tr>
              ) : (
                displayedQuotes.map((q) => {
                  const priceLakhs = (parseFloat(q.quoted_price) / 100000).toFixed(2);
                  const isAwarded = q.status === 'awarded';
                  const isRejected = q.status === 'rejected';

                  return (
                    <tr key={q.id} style={{ borderBottom: '1px solid #f1f5f9', background: isAwarded ? '#f0fdf4' : '#ffffff' }}>
                      
                      {/* Vendor Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {q.vendor_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Bid Ref: <code>BID-{q.id}</code>
                        </div>
                      </td>

                      {/* Category & Scope */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>
                          {q.category_code} ({q.category_name})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q.item_description}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#475569' }}>
                        {q.quantity || 524} Units
                        {q.unit_rate && (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ₹{(parseFloat(q.unit_rate)).toFixed(0)}/unit
                          </div>
                        )}
                      </td>

                      {/* Quoted Price */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{priceLakhs} Lakhs
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Exact: ₹{parseFloat(q.quoted_price).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* WCI Score */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: q.wci_score >= 90 ? '#dcfce7' : (q.wci_score >= 75 ? '#fef9c3' : '#fee2e2'),
                          color: q.wci_score >= 90 ? '#15803d' : (q.wci_score >= 75 ? '#a16207' : '#b91c1c'),
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {q.wci_score} / 100
                        </span>
                      </td>

                      {/* Anomaly Check */}
                      <td style={{ padding: '14px 16px' }}>
                        {q.anomaly_flag || (parseFloat(q.quoted_price) > 5800000) ? (
                          <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={14} /> +2σ Outlier
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Benchmark Fit
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          background: isAwarded ? '#dcfce7' : (isRejected ? '#fee2e2' : '#f1f5f9'),
                          color: isAwarded ? '#15803d' : (isRejected ? '#b91c1c' : '#475569')
                        }}>
                          {q.status}
                        </span>
                      </td>

                      {/* Procurement Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {isAwarded ? (
                          <div style={{ color: '#15803d', fontWeight: 700, fontSize: '0.78rem' }}>
                            PO: {q.purchase_order_ref || 'PO-2026-AWARDED'}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFinalizeQuote(q.id)}
                            disabled={finalizingId === q.id || isRejected}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#16a34a',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: finalizingId === q.id || isRejected ? 'not-allowed' : 'pointer',
                              opacity: isRejected ? 0.4 : 1
                            }}
                          >
                            {finalizingId === q.id ? 'Finalizing...' : 'Finalize & Award'}
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL: Telegram Summary Sent Preview */}
      {showSummaryModal && summaryResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '620px',
            width: '90%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Quotation Summary Dispatched via Bot
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0' }}>
                  Sent to client <b>{summaryResult.client_name}</b> in Telegram (@Royalknot_bot).
                </p>
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              maxHeight: '280px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#1e293b',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px'
            }}>
              {summaryResult.summary_text}
            </div>

            <div style={{
              background: '#fefce8',
              border: '1px solid #fef08a',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              color: '#854d0e',
              marginBottom: '20px'
            }}>
              <b>What Happens Next:</b> When the client replies to the Telegram bot with <b>'Confirm'</b>, <b>'OK'</b>, or <b>'Yes'</b>, 
              KnotCore will automatically award <b>{summaryResult.best_quote?.vendor_name}</b> and dispatch rejection letters to all competitors via SMTP.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowSummaryModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
