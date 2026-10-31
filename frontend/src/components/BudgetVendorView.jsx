import React, { useState, useEffect } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle, ShieldAlert, Award, FileText, 
  Search, TrendingUp, Filter, ChevronRight, Sparkles, Send, RefreshCw, 
  Eye, CheckCircle2, Shield, Mail, ArrowRight, X, AlertCircle, Sliders,
  HelpCircle, UserCheck, Layers, PieChart, BarChart2
} from 'lucide-react';

export default function BudgetVendorView({ weddingId }) {
  const [budgetData, setBudgetData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('comparison'); // 'comparison' | 'anomaly_chart' | 'alternatives' | 'ocr_simulator'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [awardingId, setAwardingId] = useState(null);
  const [awardSuccess, setAwardSuccess] = useState(null);
  const [awardModalData, setAwardModalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feature 3: Selected Quote for WCI 5-Factor Inspection
  const [selectedQuoteForWci, setSelectedQuoteForWci] = useState(null);

  // Feature 4: Alternative Vendor Recommender State
  const [altCategory, setAltCategory] = useState('CAT-03');
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [preferredUnavailable, setPreferredUnavailable] = useState(true);
  const [altSuccess, setAltSuccess] = useState(null);

  // Feature 5: Line-by-Line Caterer Comparison Toggle (incorporating ML 60-plate buffer)
  const [lineByLineMode, setLineByLineMode] = useState(false);

  // Feature 2: Visual Chart Hover/Click Point
  const [selectedChartPoint, setSelectedChartPoint] = useState(null);

  // OCR Simulator state
  const [ocrInputText, setOcrInputText] = useState('');
  const [ocrVendorName, setOcrVendorName] = useState('Royal Marwar Caterers');
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrPendingSession, setOcrPendingSession] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const fetchBudgetAndQuotes = async () => {
    try {
      setLoading(true);
      const [resBudget, resQuotes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/budget`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/quotes`)
      ]);
      const dataB = await resBudget.json();
      const dataQ = await resQuotes.json();
      setBudgetData(dataB);
      setQuotes(dataQ);
    } catch (err) {
      console.error("Failed to load budget and quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlternatives = async (categoryCode) => {
    try {
      setLoadingAlternatives(true);
      const res = await fetch(`http://127.0.0.1:5000/api/vendors/alternatives?category=${categoryCode}`);
      if (res.ok) {
        const data = await res.json();
        setAlternatives(data);
      }
    } catch (err) {
      console.error("Failed to fetch alternative vendors:", err);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  useEffect(() => {
    fetchBudgetAndQuotes();
  }, [weddingId]);

  useEffect(() => {
    if (activeSubTab === 'alternatives') {
      fetchAlternatives(altCategory);
    }
  }, [activeSubTab, altCategory]);

  const handleAwardQuote = async (quoteId) => {
    try {
      setAwardingId(quoteId);
      const res = await fetch(`http://127.0.0.1:5000/api/quotes/${quoteId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (res.ok) {
        setAwardSuccess(result);
        setAwardModalData(result);
        fetchBudgetAndQuotes();
      }
    } catch (err) {
      console.error("Award quote error:", err);
    } finally {
      setAwardingId(null);
    }
  };

  const handleRequestAlternative = async (partnerId) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/vendors/alternatives/request-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: partnerId,
          wedding_id: weddingId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAltSuccess(data.message);
        fetchBudgetAndQuotes();
        setTimeout(() => setAltSuccess(null), 5000);
      }
    } catch (err) {
      console.error("Request alternative error:", err);
    }
  };

  const handleRunOcr = async (overrideText = null, isFillBlank = false) => {
    const textToSend = overrideText !== null ? overrideText : ocrInputText;
    if (!textToSend.trim()) return;

    try {
      setOcrProcessing(true);
      const payload = {
        text: textToSend,
        vendor_name: ocrVendorName,
        pending_session: isFillBlank ? ocrPendingSession : null
      };

      const res = await fetch('http://127.0.0.1:5000/api/vendor/quotation-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setOcrResult(data);

      if (data.needs_fill_blank) {
        setOcrPendingSession(data.pending_session || {
          is_waiting_for_missing: true,
          extracted_so_far: data.extracted_so_far,
          missing_fields: data.missing_fields
        });
      } else {
        setOcrPendingSession(null);
      }

      if (data.status === 'accepted' || data.is_complete) {
        fetchBudgetAndQuotes();
      }
    } catch (err) {
      console.error("OCR API error:", err);
    } finally {
      setOcrProcessing(false);
    }
  };

  const filteredQuotes = selectedCategory === 'ALL' 
    ? quotes 
    : quotes.filter(q => q.category_code === selectedCategory);

  const totalAllocated = budgetData?.summary?.total_allocated || 25000000;
  const totalCommitted = budgetData?.summary?.total_committed || 24900000;

  // Historical benchmarks for categories
  const categoryBenchmarks = {
    "CAT-02": { name: "Royal Catering & Banqueting", median: 5000000, std: 400000, threshold2sigma: 5800000, unit: "plates" },
    "CAT-03": { name: "Floral Architecture & Production", median: 3000000, std: 250000, threshold2sigma: 3500000, unit: "pavilions" },
    "CAT-05": { name: "Light, Sound & Concert AV", median: 1500000, std: 120000, threshold2sigma: 1740000, unit: "stage rigs" },
  };

  // ML Plate Buffer Breakdown
  const mlBufferData = {
    base_guests: 400,
    outstation_arrivals: 64,
    ml_unannounced_buffer: 60,
    total_plates: 524
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            TOTAL ALLOCATED BUDGET
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            ₹{(totalAllocated / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            18 Categories Balanced (100.00%)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            COMMITTED CONTRACTS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '4px' }}>
            ₹{(totalCommitted / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Signed Purchase Orders
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            FINANCIAL LEAKAGE BLOCKED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '4px' }}>
            ₹18.2 Lakhs
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Via +2-Sigma Outlier Flagging
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            PROCUREMENT PROTOCOL
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            One-Way Mirror
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Blind Multi-Vendor Bidding
          </div>
        </div>
      </div>

      {/* Award Success Banner */}
      {awardSuccess && (
        <div style={{
          padding: '14px 20px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#065f46',
          fontSize: '0.86rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>
              <strong>Purchase Order Issued:</strong> <code>{awardSuccess.purchase_order}</code>. Competing vendor bids auto-closed with polite decline notifications dispatched.
            </span>
          </div>
          <button 
            onClick={() => setAwardModalData(awardSuccess)}
            className="btn-outline" 
            style={{ fontSize: '0.78rem', padding: '6px 12px', background: '#ffffff' }}
          >
            View Decline Email Audit
          </button>
        </div>
      )}

      {/* Sub-Tabs Navigation (Clean Light Style) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveSubTab('comparison')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeSubTab === 'comparison' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeSubTab === 'comparison' ? '#4f46e5' : '#ffffff',
            color: activeSubTab === 'comparison' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Vendor Comparison Grid & 1-Click PO
        </button>

        <button
          onClick={() => setActiveSubTab('anomaly_chart')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeSubTab === 'anomaly_chart' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeSubTab === 'anomaly_chart' ? '#4f46e5' : '#ffffff',
            color: activeSubTab === 'anomaly_chart' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Price Anomaly Detection (Visual Distribution Chart)
        </button>

        <button
          onClick={() => setActiveSubTab('alternatives')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeSubTab === 'alternatives' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeSubTab === 'alternatives' ? '#4f46e5' : '#ffffff',
            color: activeSubTab === 'alternatives' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Alternative Vendor Recommender (res.partner)
        </button>

        <button
          onClick={() => setActiveSubTab('ocr_simulator')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeSubTab === 'ocr_simulator' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
            background: activeSubTab === 'ocr_simulator' ? '#4f46e5' : '#ffffff',
            color: activeSubTab === 'ocr_simulator' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          OCR & Fill-in-the-Blanks Simulator
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: MULTI-VENDOR QUOTATION COMPARISON & 1-CLICK PO
          ========================================================================= */}
      {activeSubTab === 'comparison' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Multi-Vendor Quotation Comparison
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Multi-factor Suitability Score: (0.30 x Budget) + (0.25 x Quality) + (0.20 x Punctuality) + (0.15 x Availability) + (0.10 x Past Complaints).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Line-by-Line Caterer Toggle incorporating 60-Plate ML Buffer */}
              <button
                onClick={() => setLineByLineMode(!lineByLineMode)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: lineByLineMode ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: lineByLineMode ? '#eef2ff' : '#ffffff',
                  color: lineByLineMode ? '#4f46e5' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <Layers size={14} />
                <span>{lineByLineMode ? 'Standard Grid View' : 'Line-by-Line 3-Caterer View (ML 60-Plate Buffer)'}</span>
              </button>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'CAT-02', 'CAT-03', 'CAT-05'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setSelectedCategory(code)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: selectedCategory === code ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                      background: selectedCategory === code ? '#4f46e5' : '#ffffff',
                      color: selectedCategory === code ? '#ffffff' : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {code === 'ALL' ? 'All Categories' : code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line-by-Line ML 60-Plate Buffer Itemized Panel */}
          {lineByLineMode && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                    Line-by-Line Caterer Itemization Matrix
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Evaluates all 3 competing caterers line-by-line, incorporating the Machine Learning 60-plate unannounced outstation arrival buffer.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.76rem', background: '#ffffff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span>Base Guests: <strong>{mlBufferData.base_guests}</strong></span>
                  <span>Outstation Arrivals: <strong>+{mlBufferData.outstation_arrivals}</strong></span>
                  <span style={{ color: '#4f46e5', fontWeight: 600 }}>ML 60-Plate Buffer: <strong>+{mlBufferData.ml_unannounced_buffer}</strong></span>
                  <span>Total Commitment: <strong>{mlBufferData.total_plates} plates</strong></span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ background: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      <th>ITEMIZED SCOPE LINE</th>
                      <th>BUFFER INCLUSION</th>
                      <th>CATERER A: SHAHI MEWAR</th>
                      <th>CATERER B: GRAND RAJPUTANA</th>
                      <th>CATERER C: MAHARAJA IMPERIAL (+2σ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>1. Welcome Mocktails & High Tea</td>
                      <td style={{ fontSize: '0.76rem', color: '#64748b' }}>524 Servings (Full Buffer)</td>
                      <td style={{ fontFamily: 'monospace' }}>₹4,50,000</td>
                      <td style={{ fontFamily: 'monospace' }}>₹4,20,000</td>
                      <td style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹5,80,000</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>2. 3-Day Heritage Rajasthani Buffet</td>
                      <td style={{ fontSize: '0.76rem', color: '#64748b' }}>524 Plates (Full Buffer)</td>
                      <td style={{ fontFamily: 'monospace' }}>₹38,00,000</td>
                      <td style={{ fontFamily: 'monospace' }}>₹36,00,000</td>
                      <td style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹46,00,000</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>3. Live Chaat & Sweet Counters</td>
                      <td style={{ fontSize: '0.76rem', color: '#64748b' }}>524 Servings (Full Buffer)</td>
                      <td style={{ fontFamily: 'monospace' }}>₹5,50,000</td>
                      <td style={{ fontFamily: 'monospace' }}>₹5,10,000</td>
                      <td style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹6,20,000</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>4. ML 60-Plate Hot Holding Reserve</td>
                      <td style={{ fontSize: '0.76rem', color: '#4f46e5', fontWeight: 600 }}>60 Plates Reserved Buffer</td>
                      <td style={{ fontFamily: 'monospace', color: '#10b981' }}>Included in Total</td>
                      <td style={{ fontFamily: 'monospace', color: '#10b981' }}>Included in Total</td>
                      <td style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹4,00,000 Extra</td>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                      <td style={{ color: '#0f172a' }}>TOTAL QUOTED AMOUNT</td>
                      <td>524 Plates Total</td>
                      <td style={{ fontFamily: 'monospace', color: '#059669', fontSize: '0.95rem' }}>₹51,50,000 (₹9,828/plate)</td>
                      <td style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '0.95rem' }}>₹48,50,000 (₹9,255/plate)</td>
                      <td style={{ fontFamily: 'monospace', color: '#dc2626', fontSize: '0.95rem' }}>₹62,00,000 (₹11,832/plate)</td>
                    </tr>
                    <tr style={{ background: '#ffffff' }}>
                      <td style={{ fontWeight: 600 }}>WCI SUITABILITY SCORE</td>
                      <td>Multi-Factor Model</td>
                      <td>
                        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>97.32 / 100 [Rank #1]</span>
                      </td>
                      <td>
                        <span className="badge badge-indigo" style={{ fontWeight: 700 }}>92.40 / 100 [Rank #2]</span>
                      </td>
                      <td>
                        <span className="badge badge-rose" style={{ fontWeight: 700 }}>80.00 / 100 [+2σ Outlier]</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>1-CLICK PO DECISION</td>
                      <td>Auto-closes competing bids</td>
                      <td>
                        <button 
                          onClick={() => handleAwardQuote(1)} 
                          className="btn-primary" 
                          style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                          disabled={awardingId === 1}
                        >
                          {awardingId === 1 ? 'Generating PO...' : 'Award PO to Caterer A'}
                        </button>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleAwardQuote(2)} 
                          className="btn-outline" 
                          style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                          disabled={awardingId === 2}
                        >
                          {awardingId === 2 ? 'Generating PO...' : 'Award PO to Caterer B'}
                        </button>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                          Negotiation Required Before PO
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Main Comparison Table */}
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>VENDOR NAME</th>
                  <th>CATEGORY</th>
                  <th>QUOTED ITEM / SCOPE</th>
                  <th>QUANTITY</th>
                  <th>UNIT RATE</th>
                  <th>TOTAL PRICE</th>
                  <th>WCI SUITABILITY</th>
                  <th>ANOMALY AUDIT</th>
                  <th style={{ textAlign: 'right' }}>1-CLICK PO</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => {
                  const isAnomaly = q.anomaly_flag || (q.quoted_price > (q.historical_avg + 2 * q.std_dev));
                  const isAwarded = q.status === 'awarded';
                  const isRejected = q.status === 'rejected';
                  const unitRate = q.unit_rate ? `₹${parseFloat(q.unit_rate).toLocaleString('en-IN')}` : 'Included';
                  const qtyDisplay = q.quantity ? `${q.quantity} units` : '524 plates';
                  const scopeDisplay = q.item_description || (q.category_code === 'CAT-02' ? 'Heritage Royal Rajasthani Banquet Buffet' : 'Palace Decor Architecture & Production');
                  const suitability = q.suitability_score || q.wci_score || 94.0;

                  return (
                    <tr 
                      key={q.id}
                      style={{ 
                        background: isAwarded ? '#ecfdf5' : isRejected ? '#f8fafc' : isAnomaly ? '#fef2f2' : 'transparent',
                        opacity: isRejected ? 0.75 : 1.0,
                        transition: 'background 0.15s'
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: isRejected ? '#64748b' : '#0f172a' }}>{q.vendor_name}</span>
                          {isAwarded && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              Awarded PO
                            </span>
                          )}
                          {isRejected && (
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                              Auto-Closed
                            </span>
                          )}
                          {suitability >= 95 && !isRejected && !isAwarded && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              Top WCI
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Ref: <code>BID-{q.id.toString().padStart(4, '0')}</code> • {q.purchase_order_ref ? `PO: ${q.purchase_order_ref}` : 'One-Way Mirror'}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.category_code}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{q.category_name}</div>
                      </td>

                      <td style={{ maxWidth: '220px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {scopeDisplay}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#4f46e5' }}>Includes ML 60-Plate Buffer</div>
                      </td>

                      <td style={{ fontFamily: 'monospace', fontWeight: 500, color: '#0f172a' }}>
                        {qtyDisplay}
                      </td>

                      <td style={{ fontFamily: 'monospace', color: '#64748b' }}>
                        {unitRate}
                      </td>

                      <td style={{ fontFamily: 'monospace' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isAnomaly ? '#dc2626' : '#0f172a' }}>
                          ₹{(q.quoted_price / 100000).toFixed(2)} L
                        </div>
                        <div style={{ fontSize: '0.7rem', color: q.quoted_price > q.historical_avg ? '#dc2626' : '#10b981' }}>
                          {q.quoted_price > q.historical_avg ? `+₹${((q.quoted_price - q.historical_avg)/100000).toFixed(1)}L vs Median` : `-₹${((q.historical_avg - q.quoted_price)/100000).toFixed(1)}L vs Median`}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isAnomaly ? '#dc2626' : '#4f46e5' }}>
                            {suitability}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/ 100</span>
                        </div>
                        <button
                          onClick={() => setSelectedQuoteForWci(q)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#4f46e5',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontFamily: 'inherit',
                            marginTop: '2px'
                          }}
                        >
                          <Sliders size={10} />
                          <span>WCI 5-Factor Breakdown</span>
                        </button>
                      </td>

                      <td>
                        {isAnomaly ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge badge-rose">
                              +2-Sigma Outlier
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>
                              Negotiate Before Couple
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-emerald">
                            Competitive
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isAwarded ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '0.76rem', fontWeight: 700 }}>
                            <CheckCircle2 size={15} />
                            <span>{q.purchase_order_ref || 'PO Issued'}</span>
                          </div>
                        ) : isRejected ? (
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                            Auto-Closed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAwardQuote(q.id)}
                            disabled={awardingId === q.id}
                            className="btn-primary"
                            style={{ fontSize: '0.76rem', padding: '6px 14px' }}
                          >
                            {awardingId === q.id ? 'Issuing PO...' : 'Award PO'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: PRICE ANOMALY DETECTION (VISUAL CHARTS)
          ========================================================================= */}
      {activeSubTab === 'anomaly_chart' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Quotation Price Anomaly Detection (Visual Distribution)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Plots submitted quotes against historical seasonal distribution medians. Highlights +2σ outliers in red, alerting planners to negotiate before showing the couple.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>Competitive (&lt; +2σ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                <span>+2σ Outlier (Negotiation Required)</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Scatter & Box-Plot Chart */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Historical Seasonal Price Distribution & Submitted Quotes (in INR Lakhs)
            </div>

            <svg viewBox="0 0 900 360" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {/* Background Grid Lines (Y-Axis: 0 to 70 Lakhs) */}
              {[10, 20, 30, 40, 50, 60, 70].map((val) => {
                const y = 320 - (val / 70) * 280;
                return (
                  <g key={val}>
                    <line x1="80" y1={y} x2="860" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="70" y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="Roboto">
                      ₹{val}L
                    </text>
                  </g>
                );
              })}

              {/* Category Columns */}
              {[
                { cat: "CAT-02", name: "Royal Catering", x: 220, median: 50, q1: 46, q3: 54, sig2: 58 },
                { cat: "CAT-03", name: "Floral Decor", x: 480, median: 30, q1: 27.5, q3: 32.5, sig2: 35 },
                { cat: "CAT-05", name: "Sound & DJ AV", x: 720, median: 15, q1: 13.8, q3: 16.2, sig2: 17.4 }
              ].map((c) => {
                const yMed = 320 - (c.median / 70) * 280;
                const yQ1 = 320 - (c.q1 / 70) * 280;
                const yQ3 = 320 - (c.q3 / 70) * 280;
                const ySig2 = 320 - (c.sig2 / 70) * 280;

                return (
                  <g key={c.cat}>
                    {/* Column Header */}
                    <text x={c.x} y="345" fill="#0f172a" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="Roboto">
                      {c.name} ({c.cat})
                    </text>

                    {/* Box-Plot IQR (Q1 to Q3) */}
                    <rect 
                      x={c.x - 45} 
                      y={yQ3} 
                      width="90" 
                      height={yQ1 - yQ3} 
                      fill="#e0e7ff" 
                      opacity="0.35" 
                      rx="6" 
                      stroke="#818cf8" 
                      strokeWidth="1.5"
                    />

                    {/* Historical Median Line */}
                    <line x1={c.x - 55} y1={yMed} x2={c.x + 55} y2={yMed} stroke="#4f46e5" strokeWidth="2.5" />
                    <text x={c.x + 60} y={yMed + 4} fill="#4f46e5" fontSize="10" fontWeight="600" fontFamily="Roboto">
                      Median ₹{c.median}L
                    </text>

                    {/* +2-Sigma Outlier Threshold Line (Dashed Crimson) */}
                    <line x1={c.x - 65} y1={ySig2} x2={c.x + 65} y2={ySig2} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
                    <text x={c.x + 70} y={ySig2 + 4} fill="#dc2626" fontSize="10" fontWeight="700" fontFamily="Roboto">
                      +2σ Threshold (₹{c.sig2}L)
                    </text>
                  </g>
                );
              })}

              {/* Data Points from Actual Submitted Quotes */}
              {quotes.map((q) => {
                let colX = 220;
                let medianL = 50;
                let sig2L = 58;

                if (q.category_code === 'CAT-03') {
                  colX = 480;
                  medianL = 30;
                  sig2L = 35;
                } else if (q.category_code === 'CAT-05') {
                  colX = 720;
                  medianL = 15;
                  sig2L = 17.4;
                }

                // Add slight jitter for multiple points in same category
                const jitter = (q.id % 5 - 2) * 16;
                const priceL = q.quoted_price / 100000;
                const pointY = 320 - (priceL / 70) * 280;
                const isAnomaly = priceL > sig2L;
                const isSelected = selectedChartPoint?.id === q.id;

                return (
                  <g 
                    key={q.id}
                    onClick={() => setSelectedChartPoint(q)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing ring for +2-sigma outliers */}
                    {isAnomaly && (
                      <circle 
                        cx={colX + jitter} 
                        cy={pointY} 
                        r="12" 
                        fill="none" 
                        stroke="#dc2626" 
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                    )}

                    <circle 
                      cx={colX + jitter} 
                      cy={pointY} 
                      r={isSelected ? "9" : "7"} 
                      fill={isAnomaly ? "#dc2626" : "#4f46e5"} 
                      stroke="#ffffff" 
                      strokeWidth="2"
                    />

                    {/* Point Label */}
                    <text 
                      x={colX + jitter} 
                      y={pointY - 11} 
                      fill={isAnomaly ? "#dc2626" : "#334155"} 
                      fontSize="9" 
                      fontWeight={isAnomaly ? "700" : "500"} 
                      textAnchor="middle" 
                      fontFamily="Roboto"
                    >
                      ₹{priceL.toFixed(1)}L
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Point Inspector & Negotiation Alert Card */}
          {selectedChartPoint ? (
            <div style={{
              background: selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '12px',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? (
                    <AlertTriangle size={20} color="#dc2626" />
                  ) : (
                    <CheckCircle2 size={20} color="#059669" />
                  )}
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedChartPoint.vendor_name} ({selectedChartPoint.category_code})
                  </div>
                  {selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? (
                    <span className="badge badge-rose">+2-Sigma Price Anomaly</span>
                  ) : (
                    <span className="badge badge-emerald">Within Standard Median</span>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                  Quoted Price: <strong>₹{(selectedChartPoint.quoted_price / 100000).toFixed(2)} Lakhs</strong> | Historical Median: <strong>₹{(selectedChartPoint.historical_avg / 100000).toFixed(2)} Lakhs</strong>
                </div>

                {selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? (
                  <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '6px', fontWeight: 600 }}>
                    Alert for Planners: This quote is +₹{((selectedChartPoint.quoted_price - selectedChartPoint.historical_avg) / 100000).toFixed(2)}L (+2.4σ) above seasonal median. Negotiate menu scope or plate buffer with {selectedChartPoint.vendor_name} before client presentation.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '6px' }}>
                    This quote aligns with historical Jaipur & Udaipur winter season benchmarks. Safe for direct inclusion in client proposal.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setSelectedQuoteForWci(selectedChartPoint)} 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '8px 14px', background: '#ffffff' }}
                >
                  Inspect WCI Factors
                </button>
                <button 
                  onClick={() => setSelectedChartPoint(null)} 
                  className="btn-outline" 
                  style={{ fontSize: '0.8rem', padding: '8px 12px', background: '#ffffff' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
              Click on any scatter data point in the chart above to inspect quote deviation, historical benchmarks, and negotiation guidance.
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: ALTERNATIVE VENDOR RECOMMENDER (res.partner QUERY)
          ========================================================================= */}
      {activeSubTab === 'alternatives' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Alternative Vendor Recommender (res.partner Intelligence)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                If the couple's preferred decorator, DJ, or caterer is unavailable, KnotCore instantly queries res.partner and recommends the Top 3 Pre-Vetted Alternatives with matching style portfolios and price points.
              </p>
            </div>

            {/* Category Selector for Alternatives */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { code: 'CAT-03', label: 'Decorator (CAT-03)' },
                { code: 'CAT-05', label: 'DJ & Sound (CAT-05)' },
                { code: 'CAT-02', label: 'Caterer (CAT-02)' }
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => setAltCategory(c.code)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: altCategory === c.code ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: altCategory === c.code ? '#4f46e5' : '#ffffff',
                    color: altCategory === c.code ? '#ffffff' : '#64748b',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Vendor Availability Status Bar */}
          <div style={{
            background: preferredUnavailable ? '#fff7ed' : '#f0fdf4',
            border: `1px solid ${preferredUnavailable ? '#fed7aa' : '#bbf7d0'}`,
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} color={preferredUnavailable ? '#ea580c' : '#16a34a'} />
              <div>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                  Primary Preferred Vendor Status:
                </span>{' '}
                <span style={{ fontSize: '0.84rem', color: preferredUnavailable ? '#c2410c' : '#15803d', fontWeight: 600 }}>
                  {preferredUnavailable ? 'Unavailable / Fully Booked on Wedding Dates' : 'Confirmed Available'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setPreferredUnavailable(!preferredUnavailable)}
              className="btn-outline"
              style={{ fontSize: '0.75rem', padding: '5px 12px', background: '#ffffff' }}
            >
              Toggle Booking Simulation
            </button>
          </div>

          {/* Alert if alternative requested */}
          {altSuccess && (
            <div style={{
              padding: '12px 18px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#065f46',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>{altSuccess}</span>
            </div>
          )}

          {/* Top 3 Pre-Vetted Alternatives Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {alternatives.map((alt, idx) => (
              <div 
                key={alt.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: idx === 0 ? '0 4px 14px rgba(79, 70, 229, 0.08)' : 'none',
                  borderColor: idx === 0 ? '#818cf8' : '#e2e8f0'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className={`badge ${idx === 0 ? 'badge-indigo' : 'badge-emerald'}`}>
                      #{idx + 1} Pre-Vetted Alternative
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      res.partner #{alt.id}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    {alt.name}
                  </h4>

                  <div style={{
                    fontSize: '0.76rem',
                    color: '#334155',
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    lineHeight: 1.4
                  }}>
                    <strong style={{ color: '#4f46e5' }}>Style Portfolio:</strong> {alt.style_portfolio}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: '#475569', marginBottom: '16px' }}>
                    <div>
                      Typical Benchmark Price: <strong>₹{(alt.typical_price_inr / 100000).toFixed(2)} Lakhs</strong>
                    </div>
                    <div style={{ color: '#059669', fontWeight: 600 }}>
                      Price Match: {alt.price_point_match}
                    </div>
                    <div>
                      Quality Rating: <strong>{alt.rating} / 100</strong> | Punctuality: <strong>{alt.punctuality_pct}%</strong>
                    </div>
                    <div>
                      Location: <strong>{alt.city}</strong> | Phone: <code>{alt.phone}</code>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestAlternative(alt.id)}
                  className={idx === 0 ? "btn-primary" : "btn-outline"}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                >
                  Select Alternative & Send RFP
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: OCR & FILL-IN-THE-BLANKS SIMULATOR
          ========================================================================= */}
      {activeSubTab === 'ocr_simulator' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Vendor Quotation OCR & Dynamic Fill-in-the-Blanks Engine
            </h3>
            <p style={{ margin: '4px 0 16px', fontSize: '0.8rem', color: '#64748b' }}>
              Validates whether incoming text/document is an authentic quotation, extracts words via OCR, dynamically identifies missing fields (like quantity), and prompts the vendor.
            </p>
          </div>

          {/* Quick Test Presets */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => {
                setOcrInputText("Hi brother, when is the party starting? Send me the wedding invite location.");
                setOcrVendorName("Unknown Sender");
                setOcrPendingSession(null);
              }}
              className="btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              1. Test Non-Quotation (Rejects)
            </button>

            <button
              onClick={() => {
                setOcrInputText("COMMERCIAL ESTIMATE\nSupplier: Royal Marwar Caterers\nItem: 3-Day Heritage Rajasthani Buffet with Dal Baati Churma\nUnit Rate: 4500 per plate\nTotal Price: INR 23,58,000");
                setOcrVendorName("Royal Marwar Caterers");
                setOcrPendingSession(null);
              }}
              className="btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              2. Test Missing Quantity Quote (Triggers Blanks)
            </button>

            <button
              onClick={() => {
                setOcrInputText("524 plates");
                setOcrVendorName("Royal Marwar Caterers");
              }}
              className="btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              3. Test Fill-in-the-Blanks ('524 plates')
            </button>
          </div>

          {/* Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                VENDOR NAME
              </label>
              <input
                type="text"
                value={ocrVendorName}
                onChange={e => setOcrVendorName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                OCR / DOCUMENT TEXT INPUT
              </label>
              <textarea
                rows={3}
                value={ocrInputText}
                onChange={e => setOcrInputText(e.target.value)}
                placeholder="Paste or type vendor quotation text here..."
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => handleRunOcr(null, !!ocrPendingSession)}
              disabled={ocrProcessing || !ocrInputText.trim()}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 18px' }}
            >
              {ocrProcessing ? 'Processing OCR...' : ocrPendingSession ? 'Submit Fill-in-the-Blank Answer' : 'Parse Quotation via OCR'}
            </button>
          </div>

          {/* OCR Result Output */}
          {ocrResult && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              borderRadius: '10px',
              background: ocrResult.status === 'accepted' ? '#ecfdf5' : ocrResult.needs_fill_blank ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${ocrResult.status === 'accepted' ? '#a7f3d0' : ocrResult.needs_fill_blank ? '#fde68a' : '#fecaca'}`
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: ocrResult.status === 'accepted' ? '#065f46' : ocrResult.needs_fill_blank ? '#92400e' : '#991b1b', marginBottom: '6px' }}>
                {ocrResult.status === 'accepted' ? 'QUOTATION VERIFIED & PLACED IN COMPARISON GRID' : ocrResult.needs_fill_blank ? 'FILL-IN-THE-BLANKS REQUESTED (MISSING PARAMETERS)' : 'REJECTED: NOT A COMMERCIAL QUOTATION'}
              </div>
              <div 
                style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#1e293b' }}
                dangerouslySetInnerHTML={{ __html: ocrResult.message }}
              />
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: WCI 5-FACTOR MULTI-FACTOR SUITABILITY INSPECTION
          ========================================================================= */}
      {selectedQuoteForWci && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Multi-Factor Vendor Intelligence (WCI)
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {selectedQuoteForWci.vendor_name} ({selectedQuoteForWci.category_code})
                </p>
              </div>
              <button 
                onClick={() => setSelectedQuoteForWci(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formula Banner */}
            <div style={{
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.76rem',
              color: '#3730a3',
              marginBottom: '18px',
              lineHeight: 1.4
            }}>
              <strong>Suitability Score Formula:</strong><br />
              (0.30 x Budget Fit) + (0.25 x Quality Rating) + (0.20 x Punctuality %) + (0.15 x Availability) + (0.10 x Past Complaints)
            </div>

            {/* 5 Factors Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Budget Fit', weight: '30%', score: selectedQuoteForWci.budget_fit || 90.0, weighted: ((selectedQuoteForWci.budget_fit || 90.0) * 0.30).toFixed(2) },
                { label: 'Quality Rating', weight: '25%', score: selectedQuoteForWci.quality_rating || 95.0, weighted: ((selectedQuoteForWci.quality_rating || 95.0) * 0.25).toFixed(2) },
                { label: 'Punctuality %', weight: '20%', score: selectedQuoteForWci.punctuality_pct || 96.0, weighted: ((selectedQuoteForWci.punctuality_pct || 96.0) * 0.20).toFixed(2) },
                { label: 'Availability', weight: '15%', score: selectedQuoteForWci.availability_score || 100.0, weighted: ((selectedQuoteForWci.availability_score || 100.0) * 0.15).toFixed(2) },
                { label: 'Past Complaints (Clean Record)', weight: '10%', score: selectedQuoteForWci.past_complaints_score || 95.0, weighted: ((selectedQuoteForWci.past_complaints_score || 95.0) * 0.10).toFixed(2) },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>
                      {f.label} ({f.weight})
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>
                      <strong>{f.score} / 100</strong> (+{f.weighted} pts)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${f.score}%`, height: '100%', background: '#4f46e5', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Final Suitability Score */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Calculated Suitability Score:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5' }}>
                  {selectedQuoteForWci.suitability_score || selectedQuoteForWci.wci_score || 94.0} / 100
                </div>
              </div>

              <button
                onClick={() => setSelectedQuoteForWci(null)}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '8px 18px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: 1-CLICK PO CONFIRMATION & DECLINE EMAIL AUDIT
          ========================================================================= */}
      {awardModalData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
                  Purchase Order Confirmation & Decline Audit
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Native Odoo Purchase Order generated. Competing bids auto-closed with polite decline notices dispatched.
                </p>
              </div>
              <button 
                onClick={() => setAwardModalData(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* PO Card */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, letterSpacing: '0.04em' }}>
                  PURCHASE ORDER REFERENCE
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                  {awardModalData.purchase_order}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>
                  Vendor: <strong>{awardModalData.awarded_quote?.vendor_name}</strong> | Contract: <strong>₹{((awardModalData.awarded_quote?.quoted_price || 5150000) / 100000).toFixed(2)} Lakhs</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.76rem', color: '#065f46' }}>
                <div>ML 60-Plate Buffer: <strong>Active</strong></div>
                <div>Status: <strong>PO Issued & Linked</strong></div>
              </div>
            </div>

            {/* Auto-Closed Competing Vendors */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Auto-Closed Competing Vendor Bids ({awardModalData.rejected_bids?.length || 0}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {awardModalData.rejected_bids?.map((rb, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem'
                    }}
                  >
                    <span><strong>{rb.vendor_name}</strong> (Quoted: ₹{(rb.quoted_price / 100000).toFixed(2)}L)</span>
                    <span className="badge badge-amber">Status: Rejected / Closed</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatched Decline Emails */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={15} color="#4f46e5" />
                <span>Automated Polite Decline Emails Dispatched ({awardModalData.decline_emails?.length || 0}):</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {awardModalData.decline_emails?.map((em, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.76rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#4f46e5', fontWeight: 600 }}>To: {em.recipient_email}</span>
                      <span style={{ color: '#94a3b8' }}>{em.sent_at}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      Subject: {em.subject}
                    </div>
                    <div style={{ color: '#475569', whiteSpace: 'pre-line', lineHeight: 1.4, background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      {em.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setAwardModalData(null)}
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '8px 20px' }}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
