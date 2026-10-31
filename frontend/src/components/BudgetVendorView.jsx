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
  const [activeSubTab, setActiveSubTab] = useState('grid'); // 'grid' | 'caterers' | 'anomaly_chart' | 'alternatives' | 'ocr'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [awardingId, setAwardingId] = useState(null);
  const [awardSuccess, setAwardSuccess] = useState(null);
  const [awardModalData, setAwardModalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // WCI 5-Factor Inspection
  const [selectedQuoteForWci, setSelectedQuoteForWci] = useState(null);

  // Alternative Vendor Recommender State
  const [altCategory, setAltCategory] = useState('CAT-03');
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [preferredUnavailable, setPreferredUnavailable] = useState(true);
  const [altSuccess, setAltSuccess] = useState(null);

  // Chart point click
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TOP 4 CLEAN METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="saas-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>
            TOTAL ALLOCATED BUDGET
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
            ₹{(totalAllocated / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            18 Categories Balanced (100%)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>
            COMMITTED CONTRACTS
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#4f46e5', marginBottom: '2px' }}>
            ₹{(totalCommitted / 10000000).toFixed(2)} Cr
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Signed Purchase Orders
          </div>
        </div>

        <div className="saas-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>
            FINANCIAL LEAKAGE BLOCKED
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0ea5e9', marginBottom: '2px' }}>
            ₹18.2 Lakhs
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Via +2-Sigma Outlier Flags
          </div>
        </div>

        <div className="saas-card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>
            PROCUREMENT PROTOCOL
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
            One-Way Mirror
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Blind Multi-Vendor Bidding
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER WHEN PO AWARDED */}
      {awardSuccess && (
        <div style={{
          padding: '12px 18px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#065f46',
          fontSize: '0.84rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>
              <strong>Purchase Order Issued:</strong> <code>{awardSuccess.purchase_order}</code>. Competing vendor bids auto-closed.
            </span>
          </div>
          <button 
            onClick={() => setAwardModalData(awardSuccess)}
            className="btn-outline" 
            style={{ fontSize: '0.76rem', padding: '5px 12px', background: '#ffffff' }}
          >
            View Decline Email Audit
          </button>
        </div>
      )}

      {/* CLEAN, FOCUSED 5-TAB NAVIGATION BAR */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { id: 'grid', label: 'All Vendor Quotations' },
          { id: 'caterers', label: '3-Caterer Line-by-Line (60-Plate Buffer)' },
          { id: 'anomaly_chart', label: 'Price Anomaly Chart' },
          { id: 'alternatives', label: 'Alternative Recommender (res.partner)' },
          { id: 'ocr', label: 'OCR Ingestion Engine' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeSubTab === tab.id ? '1px solid #4f46e5' : '1px solid #e2e8f0',
              background: activeSubTab === tab.id ? '#4f46e5' : '#ffffff',
              color: activeSubTab === tab.id ? '#ffffff' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: ALL VENDOR QUOTATIONS GRID (Clean, Uncluttered, No double-stacked tables)
          ========================================================================= */}
      {activeSubTab === 'grid' && (
        <div className="saas-card" style={{ padding: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Multi-Vendor Quotations Grid
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Evaluated by WCI Suitability: (0.30 Budget) + (0.25 Quality) + (0.20 Punctuality) + (0.15 Availability) + (0.10 Complaints).
              </p>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'CAT-02', 'CAT-03', 'CAT-05'].map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedCategory(code)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: selectedCategory === code ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: selectedCategory === code ? '#4f46e5' : '#ffffff',
                    color: selectedCategory === code ? '#ffffff' : '#64748b',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  {code === 'ALL' ? 'All Bids' : code}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>VENDOR NAME</th>
                  <th>CATEGORY</th>
                  <th>SERVICE SCOPE</th>
                  <th>TOTAL PRICE</th>
                  <th>WCI SUITABILITY</th>
                  <th>ANOMALY STATUS</th>
                  <th style={{ textAlign: 'right' }}>1-CLICK PO</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => {
                  const isAnomaly = q.anomaly_flag || (q.quoted_price > (q.historical_avg + 2 * q.std_dev));
                  const isAwarded = q.status === 'awarded';
                  const isRejected = q.status === 'rejected';
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
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Awarded</span>
                          )}
                          {isRejected && (
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Auto-Closed</span>
                          )}
                          {suitability >= 95 && !isRejected && !isAwarded && (
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>Top WCI</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          Ref: <code>BID-{q.id.toString().padStart(4, '0')}</code>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.category_code}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{q.category_name}</div>
                      </td>

                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {scopeDisplay}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {q.quantity ? `${q.quantity} units` : 'Package bid'}
                        </div>
                      </td>

                      <td style={{ fontFamily: 'monospace' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isAnomaly ? '#dc2626' : '#0f172a' }}>
                          ₹{(q.quoted_price / 100000).toFixed(2)} L
                        </div>
                        <div style={{ fontSize: '0.68rem', color: q.quoted_price > q.historical_avg ? '#dc2626' : '#10b981' }}>
                          {q.quoted_price > q.historical_avg ? `+₹${((q.quoted_price - q.historical_avg)/100000).toFixed(1)}L vs Median` : `-₹${((q.historical_avg - q.quoted_price)/100000).toFixed(1)}L vs Median`}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isAnomaly ? '#dc2626' : '#4f46e5' }}>
                            {suitability}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>/ 100</span>
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
                          <span>WCI Factors</span>
                        </button>
                      </td>

                      <td>
                        {isAnomaly ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge badge-rose">+2σ Outlier</span>
                            <span style={{ fontSize: '0.66rem', color: '#dc2626', fontWeight: 600 }}>Negotiate Before Couple</span>
                          </div>
                        ) : (
                          <span className="badge badge-emerald">Competitive</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isAwarded ? (
                          <span style={{ color: '#059669', fontSize: '0.76rem', fontWeight: 700 }}>
                            {q.purchase_order_ref || 'PO Issued'}
                          </span>
                        ) : isRejected ? (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Auto-Closed</span>
                        ) : (
                          <button
                            onClick={() => handleAwardQuote(q.id)}
                            disabled={awardingId === q.id}
                            className="btn-primary"
                            style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                          >
                            {awardingId === q.id ? 'Issuing...' : 'Award PO'}
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
          TAB 2: 3-CATERER LINE-BY-LINE ITEMIZATION (ML 60-Plate Buffer)
          ========================================================================= */}
      {activeSubTab === 'caterers' && (
        <div className="saas-card" style={{ padding: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Line-by-Line 3-Caterer Comparison (ML 60-Plate Buffer)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Side-by-side evaluation of 3 competing caterers with ML 60-plate unannounced outstation arrival protection.
              </p>
            </div>

            {/* Plate metrics summary */}
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', background: '#f8fafc', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span>Base Guests: <strong>400</strong></span>
              <span>Outstation Arrivals: <strong>+64</strong></span>
              <span style={{ color: '#4f46e5', fontWeight: 600 }}>ML Buffer: <strong>+60</strong></span>
              <span>Total: <strong>524 plates</strong></span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ITEMIZED SCOPE LINE</th>
                  <th>PLATE REQUIREMENT</th>
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
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>4. ML 60-Plate Safety Buffer</td>
                  <td style={{ fontSize: '0.76rem', color: '#4f46e5', fontWeight: 600 }}>60 Plates Reserved</td>
                  <td style={{ fontFamily: 'monospace', color: '#10b981' }}>Included in Total</td>
                  <td style={{ fontFamily: 'monospace', color: '#10b981' }}>Included in Total</td>
                  <td style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹4,00,000 Extra</td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td style={{ color: '#0f172a' }}>TOTAL QUOTED AMOUNT</td>
                  <td>524 Plates Total</td>
                  <td style={{ fontFamily: 'monospace', color: '#059669', fontSize: '0.92rem' }}>₹51,50,000 (₹9,828/plate)</td>
                  <td style={{ fontFamily: 'monospace', color: '#0f172a', fontSize: '0.92rem' }}>₹48,50,000 (₹9,255/plate)</td>
                  <td style={{ fontFamily: 'monospace', color: '#dc2626', fontSize: '0.92rem' }}>₹62,00,000 (₹11,832/plate)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>WCI SUITABILITY SCORE</td>
                  <td>Multi-Factor Model</td>
                  <td><span className="badge badge-emerald">97.32 / 100 [Rank #1]</span></td>
                  <td><span className="badge badge-indigo">92.40 / 100 [Rank #2]</span></td>
                  <td><span className="badge badge-rose">80.00 / 100 [+2σ Outlier]</span></td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>1-CLICK PO DECISION</td>
                  <td>Auto-closes competing bids</td>
                  <td>
                    <button 
                      onClick={() => handleAwardQuote(1)} 
                      className="btn-primary" 
                      style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                      disabled={awardingId === 1}
                    >
                      {awardingId === 1 ? 'Generating...' : 'Award PO to Caterer A'}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleAwardQuote(2)} 
                      className="btn-outline" 
                      style={{ fontSize: '0.74rem', padding: '5px 12px' }}
                      disabled={awardingId === 2}
                    >
                      {awardingId === 2 ? 'Generating...' : 'Award PO to Caterer B'}
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                      Negotiate Before PO
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRICE ANOMALY DETECTION (VISUAL CHARTS)
          ========================================================================= */}
      {activeSubTab === 'anomaly_chart' && (
        <div className="saas-card" style={{ padding: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Quotation Price Anomaly Detection (Visual Distribution)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Plots submitted quotes against historical seasonal medians. Highlights +2σ outliers in red for negotiation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5', display: 'inline-block' }} />
                <span>Competitive (&lt; +2σ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
                <span>+2σ Outlier</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <svg viewBox="0 0 900 340" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {[10, 20, 30, 40, 50, 60, 70].map((val) => {
                const y = 300 - (val / 70) * 260;
                return (
                  <g key={val}>
                    <line x1="80" y1={y} x2="860" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="70" y={y + 4} fill="#94a3b8" fontSize="11" textAnchor="end" fontFamily="Roboto">
                      ₹{val}L
                    </text>
                  </g>
                );
              })}

              {[
                { cat: "CAT-02", name: "Royal Catering", x: 220, median: 50, q1: 46, q3: 54, sig2: 58 },
                { cat: "CAT-03", name: "Floral Decor", x: 480, median: 30, q1: 27.5, q3: 32.5, sig2: 35 },
                { cat: "CAT-05", name: "Sound & DJ AV", x: 720, median: 15, q1: 13.8, q3: 16.2, sig2: 17.4 }
              ].map((c) => {
                const yMed = 300 - (c.median / 70) * 260;
                const yQ1 = 300 - (c.q1 / 70) * 260;
                const yQ3 = 300 - (c.q3 / 70) * 260;
                const ySig2 = 300 - (c.sig2 / 70) * 260;

                return (
                  <g key={c.cat}>
                    <text x={c.x} y="325" fill="#0f172a" fontSize="12" fontWeight="700" textAnchor="middle" fontFamily="Roboto">
                      {c.name} ({c.cat})
                    </text>
                    <rect x={c.x - 45} y={yQ3} width="90" height={yQ1 - yQ3} fill="#e0e7ff" opacity="0.35" rx="6" stroke="#818cf8" strokeWidth="1.5" />
                    <line x1={c.x - 55} y1={yMed} x2={c.x + 55} y2={yMed} stroke="#4f46e5" strokeWidth="2.5" />
                    <text x={c.x + 60} y={yMed + 4} fill="#4f46e5" fontSize="10" fontWeight="600" fontFamily="Roboto">Median ₹{c.median}L</text>
                    <line x1={c.x - 65} y1={ySig2} x2={c.x + 65} y2={ySig2} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
                    <text x={c.x + 70} y={ySig2 + 4} fill="#dc2626" fontSize="10" fontWeight="700" fontFamily="Roboto">+2σ Threshold (₹{c.sig2}L)</text>
                  </g>
                );
              })}

              {quotes.map((q) => {
                let colX = 220;
                let sig2L = 58;
                if (q.category_code === 'CAT-03') { colX = 480; sig2L = 35; }
                else if (q.category_code === 'CAT-05') { colX = 720; sig2L = 17.4; }

                const jitter = (q.id % 5 - 2) * 16;
                const priceL = q.quoted_price / 100000;
                const pointY = 300 - (priceL / 70) * 260;
                const isAnomaly = priceL > sig2L;
                const isSelected = selectedChartPoint?.id === q.id;

                return (
                  <g key={q.id} onClick={() => setSelectedChartPoint(q)} style={{ cursor: 'pointer' }}>
                    {isAnomaly && <circle cx={colX + jitter} cy={pointY} r="12" fill="none" stroke="#dc2626" strokeWidth="1.5" opacity="0.6" />}
                    <circle cx={colX + jitter} cy={pointY} r={isSelected ? "8" : "6"} fill={isAnomaly ? "#dc2626" : "#4f46e5"} stroke="#ffffff" strokeWidth="2" />
                    <text x={colX + jitter} y={pointY - 10} fill={isAnomaly ? "#dc2626" : "#334155"} fontSize="9" fontWeight={isAnomaly ? "700" : "500"} textAnchor="middle" fontFamily="Roboto">
                      ₹{priceL.toFixed(1)}L
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {selectedChartPoint && (
            <div style={{
              background: selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedChartPoint.vendor_name} ({selectedChartPoint.category_code})
                  </span>
                  {selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000) ? (
                    <span className="badge badge-rose">+2-Sigma Anomaly</span>
                  ) : (
                    <span className="badge badge-emerald">Competitive</span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                  Quoted: ₹{(selectedChartPoint.quoted_price / 100000).toFixed(2)}L • Median: ₹{(selectedChartPoint.historical_avg / 100000).toFixed(2)}L
                  {(selectedChartPoint.anomaly_flag || (selectedChartPoint.quoted_price > 5800000)) && (
                    <strong style={{ color: '#dc2626', marginLeft: '6px' }}>
                      (Alert: Negotiate with vendor before couple presentation)
                    </strong>
                  )}
                </div>
              </div>

              <button onClick={() => setSelectedChartPoint(null)} className="btn-outline" style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#ffffff' }}>
                Close
              </button>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 4: ALTERNATIVE VENDOR RECOMMENDER (res.partner)
          ========================================================================= */}
      {activeSubTab === 'alternatives' && (
        <div className="saas-card" style={{ padding: '22px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Alternative Vendor Recommender (res.partner)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Top 3 Pre-Vetted Alternatives with matching style portfolios and price points when preferred is unavailable.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { code: 'CAT-03', label: 'Decorator (CAT-03)' },
                { code: 'CAT-05', label: 'DJ & Sound (CAT-05)' },
                { code: 'CAT-02', label: 'Caterer (CAT-02)' }
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => setAltCategory(c.code)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: altCategory === c.code ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                    background: altCategory === c.code ? '#4f46e5' : '#ffffff',
                    color: altCategory === c.code ? '#ffffff' : '#64748b',
                    fontSize: '0.74rem',
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

          {/* Preferred Vendor Availability Toggle */}
          <div style={{
            background: preferredUnavailable ? '#fff7ed' : '#f0fdf4',
            border: `1px solid ${preferredUnavailable ? '#fed7aa' : '#bbf7d0'}`,
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Preferred Vendor:</strong>{' '}
              <span style={{ color: preferredUnavailable ? '#c2410c' : '#15803d', fontWeight: 600 }}>
                {preferredUnavailable ? 'Unavailable on Wedding Dates' : 'Confirmed Available'}
              </span>
            </div>
            <button
              onClick={() => setPreferredUnavailable(!preferredUnavailable)}
              className="btn-outline"
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#ffffff' }}
            >
              Toggle Booking Status
            </button>
          </div>

          {altSuccess && (
            <div style={{ padding: '10px 14px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '14px', color: '#065f46', fontSize: '0.78rem' }}>
              {altSuccess}
            </div>
          )}

          {/* Top 3 Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {alternatives.map((alt, idx) => (
              <div 
                key={alt.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderColor: idx === 0 ? '#818cf8' : '#e2e8f0'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-indigo">#{idx + 1} Alternative</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>res.partner #{alt.id}</span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                    {alt.name}
                  </h4>

                  <div style={{ fontSize: '0.74rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', marginBottom: '10px', lineHeight: 1.4 }}>
                    <strong>Style:</strong> {alt.style_portfolio}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '14px' }}>
                    <div>Benchmark Price: <strong>₹{(alt.typical_price_inr / 100000).toFixed(2)}L</strong></div>
                    <div style={{ color: '#059669', fontWeight: 600 }}>{alt.price_point_match}</div>
                    <div>Rating: <strong>{alt.rating}/100</strong> • SLA: <strong>{alt.punctuality_pct}%</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestAlternative(alt.id)}
                  className={idx === 0 ? "btn-primary" : "btn-outline"}
                  style={{ width: '100%', fontSize: '0.76rem', padding: '6px' }}
                >
                  Select & Request Quote
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 5: OCR INGESTION & FILL-IN-THE-BLANKS
          ========================================================================= */}
      {activeSubTab === 'ocr' && (
        <div className="saas-card" style={{ padding: '22px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Quotation OCR & Dynamic Fill-in-the-Blanks Engine
            </h3>
            <p style={{ margin: '2px 0 14px', fontSize: '0.78rem', color: '#64748b' }}>
              Confirms quotation validity, extracts fields via OCR, and dynamically asks fill-in-the-blanks if quantity is missing.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <button
              onClick={() => {
                setOcrInputText("Hi brother, when is the party starting? Send me the wedding invite location.");
                setOcrVendorName("Unknown Sender");
                setOcrPendingSession(null);
              }}
              className="btn-outline"
              style={{ fontSize: '0.74rem', padding: '5px 10px' }}
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
              style={{ fontSize: '0.74rem', padding: '5px 10px' }}
            >
              2. Test Missing Quantity (Triggers Blanks)
            </button>

            <button
              onClick={() => {
                setOcrInputText("524 plates");
                setOcrVendorName("Royal Marwar Caterers");
              }}
              className="btn-outline"
              style={{ fontSize: '0.74rem', padding: '5px 10px' }}
            >
              3. Test Fill-in-the-Blanks ('524 plates')
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                VENDOR NAME
              </label>
              <input
                type="text"
                value={ocrVendorName}
                onChange={e => setOcrVendorName(e.target.value)}
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '3px', fontWeight: 600 }}>
                OCR / DOCUMENT TEXT INPUT
              </label>
              <textarea
                rows={2}
                value={ocrInputText}
                onChange={e => setOcrInputText(e.target.value)}
                placeholder="Paste or type vendor quotation text here..."
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleRunOcr(null, !!ocrPendingSession)}
              disabled={ocrProcessing || !ocrInputText.trim()}
              className="btn-primary"
              style={{ fontSize: '0.78rem', padding: '7px 16px' }}
            >
              {ocrProcessing ? 'Processing...' : ocrPendingSession ? 'Submit Fill-in-the-Blank' : 'Parse Quotation via OCR'}
            </button>
          </div>

          {ocrResult && (
            <div style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '8px',
              background: ocrResult.status === 'accepted' ? '#ecfdf5' : ocrResult.needs_fill_blank ? '#fffbeb' : '#fef2f2',
              border: `1px solid ${ocrResult.status === 'accepted' ? '#a7f3d0' : ocrResult.needs_fill_blank ? '#fde68a' : '#fecaca'}`
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: ocrResult.status === 'accepted' ? '#065f46' : ocrResult.needs_fill_blank ? '#92400e' : '#991b1b', marginBottom: '4px' }}>
                {ocrResult.status === 'accepted' ? 'QUOTATION VERIFIED & PLACED IN COMPARISON GRID' : ocrResult.needs_fill_blank ? 'FILL-IN-THE-BLANKS REQUESTED (MISSING PARAMETERS)' : 'REJECTED: NOT A COMMERCIAL QUOTATION'}
              </div>
              <div style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', lineHeight: 1.4, color: '#1e293b' }} dangerouslySetInnerHTML={{ __html: ocrResult.message }} />
            </div>
          )}
        </div>
      )}

      {/* WCI INSPECTION MODAL */}
      {selectedQuoteForWci && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '22px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  WCI Suitability Breakdown
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  {selectedQuoteForWci.vendor_name} ({selectedQuoteForWci.category_code})
                </p>
              </div>
              <button onClick={() => setSelectedQuoteForWci(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '10px', fontSize: '0.74rem', color: '#3730a3', marginBottom: '14px' }}>
              <strong>Formula:</strong> (0.30 x Budget) + (0.25 x Quality) + (0.20 x Punctuality) + (0.15 x Availability) + (0.10 x Past Complaints)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Budget Fit', weight: '30%', score: selectedQuoteForWci.budget_fit || 90.0 },
                { label: 'Quality Rating', weight: '25%', score: selectedQuoteForWci.quality_rating || 95.0 },
                { label: 'Punctuality SLA', weight: '20%', score: selectedQuoteForWci.punctuality_pct || 96.0 },
                { label: 'Calendar Availability', weight: '15%', score: selectedQuoteForWci.availability_score || 100.0 },
                { label: 'Past Complaints Record', weight: '10%', score: selectedQuoteForWci.past_complaints_score || 95.0 },
              ].map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{f.label} ({f.weight})</span>
                    <span style={{ fontFamily: 'monospace' }}><strong>{f.score}</strong> / 100</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${f.score}%`, height: '100%', background: '#4f46e5' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Suitability Score: </span>
                <strong style={{ fontSize: '1.25rem', color: '#4f46e5' }}>
                  {selectedQuoteForWci.suitability_score || selectedQuoteForWci.wci_score || 94.0} / 100
                </strong>
              </div>
              <button onClick={() => setSelectedQuoteForWci(null)} className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 14px' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-CLICK PO CONFIRMATION MODAL */}
      {awardModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '22px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  Purchase Order Confirmation
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  PO generated. Competing bids auto-closed with polite decline notices.
                </p>
              </div>
              <button onClick={() => setAwardModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>PURCHASE ORDER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>{awardModalData.purchase_order}</div>
              <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                Vendor: <strong>{awardModalData.awarded_quote?.vendor_name}</strong> | Contract: <strong>₹{((awardModalData.awarded_quote?.quoted_price || 5150000) / 100000).toFixed(2)}L</strong>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Auto-Closed Competing Bids:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {awardModalData.rejected_bids?.map((rb, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                    <span><strong>{rb.vendor_name}</strong> (₹{(rb.quoted_price / 100000).toFixed(2)}L)</span>
                    <span className="badge badge-amber">Auto-Closed</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Dispatched Decline Email Sample:
              </div>
              {awardModalData.decline_emails?.[0] && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '0.74rem' }}>
                  <div style={{ color: '#4f46e5', fontWeight: 600 }}>To: {awardModalData.decline_emails[0].recipient_email}</div>
                  <div style={{ color: '#475569', marginTop: '4px', whiteSpace: 'pre-line' }}>{awardModalData.decline_emails[0].body}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAwardModalData(null)} className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
