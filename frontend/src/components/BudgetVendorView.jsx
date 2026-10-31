import React, { useState, useEffect } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle, ShieldAlert, Award, FileText, 
  Search, TrendingUp, Filter, ChevronRight, Sparkles, Send, RefreshCw, Eye, CheckCircle2, Shield
} from 'lucide-react';

export default function BudgetVendorView({ weddingId }) {
  const [budgetData, setBudgetData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('comparison'); // 'comparison' | 'ocr_simulator' | 'matrix'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [awardingId, setAwardingId] = useState(null);
  const [awardSuccess, setAwardSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchBudgetAndQuotes();
  }, [weddingId]);

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
        fetchBudgetAndQuotes();
        setTimeout(() => setAwardSuccess(null), 6000);
      }
    } catch (err) {
      console.error("Award quote error:", err);
    } finally {
      setAwardingId(null);
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

  const categories = budgetData?.categories || [];
  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuotes = selectedCategory === 'ALL' 
    ? quotes 
    : quotes.filter(q => q.category_code === selectedCategory);

  const totalAllocated = budgetData?.summary?.total_allocated || 25000000;
  const totalCommitted = budgetData?.summary?.total_committed || 24900000;

  const categoryBenchmarks = {
    "CAT-02": { name: "Royal Catering & Banqueting", avg: 5000000, std: 400000, unit: "plates" },
    "CAT-03": { name: "Floral Architecture & Production", avg: 3000000, std: 250000, unit: "pavilions" },
    "CAT-05": { name: "Light, Sound & Concert AV", avg: 1500000, std: 120000, unit: "stage rigs" },
    "CAT-01": { name: "Palace Venue Licensing & Security", avg: 6000000, std: 500000, unit: "days" },
    "CAT-04": { name: "Cinematography & Drone Production", avg: 1800000, std: 150000, unit: "crew shoots" },
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

      {/* Award Success Alert */}
      {awardSuccess && (
        <div style={{
          padding: '12px 18px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#065f46',
          fontSize: '0.84rem'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>Purchase Order Issued Successfully. Reference: <code>{awardSuccess.purchase_order}</code></span>
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
          Vendor Comparison Grid
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

      {/* SUB-TAB 1: MULTI-VENDOR QUOTATION COMPARISON TABLE */}
      {activeSubTab === 'comparison' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          
          {/* Header & Category Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Multi-Vendor Quotation Comparison
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Side-by-side evaluation weighted by Composite Index (WCI) with automatic +2-sigma outlier detection.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'CAT-02', 'CAT-03', 'CAT-05'].map((code) => {
                const label = code === 'ALL' ? 'All Bids' : `${code}`;
                return (
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
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Table */}
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
                  <th>WCI SCORE</th>
                  <th>ANOMALY AUDIT</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => {
                  const isAnomaly = q.anomaly_flag || (q.quoted_price > (q.historical_avg + 2 * q.std_dev));
                  const isAwarded = q.status === 'awarded';
                  const unitRate = q.unit_rate ? `₹${parseFloat(q.unit_rate).toLocaleString('en-IN')}` : 'Included';
                  const qtyDisplay = q.quantity ? `${q.quantity} units` : '524 plates';
                  const scopeDisplay = q.item_description || (q.category_code === 'CAT-02' ? 'Heritage Royal Rajasthani Banquet Buffet' : 'Palace Decor Architecture & Production');

                  return (
                    <tr 
                      key={q.id}
                      style={{ 
                        background: isAwarded ? '#ecfdf5' : isAnomaly ? '#fef2f2' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{q.vendor_name}</span>
                          {q.wci_score >= 90 && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              Top WCI
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Ref: <code>BID-{q.id.toString().padStart(4, '0')}</code> • OCR Verified
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{q.category_code}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{q.category_name}</div>
                      </td>

                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {scopeDisplay}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#4f46e5' }}>One-Way Mirror Blind Bid</div>
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
                          {q.quoted_price > q.historical_avg ? `+₹${((q.quoted_price - q.historical_avg)/100000).toFixed(1)}L vs Avg` : `-₹${((q.historical_avg - q.quoted_price)/100000).toFixed(1)}L vs Avg`}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isAnomaly ? '#dc2626' : '#4f46e5' }}>
                            {q.wci_score}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>/ 100</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          P:{q.quality_score || 92} | D:{q.delivery_score || 90}
                        </div>
                      </td>

                      <td>
                        {isAnomaly ? (
                          <span className="badge badge-ruby">
                            +2-Sigma Outlier
                          </span>
                        ) : (
                          <span className="badge badge-emerald">
                            Competitive
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isAwarded ? (
                          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                            {q.purchase_order_ref || 'PO Issued'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAwardQuote(q.id)}
                            disabled={isAnomaly || awardingId === q.id}
                            className="btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.75rem',
                              opacity: isAnomaly ? 0.35 : 1,
                              cursor: isAnomaly ? 'not-allowed' : 'pointer'
                            }}
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

      {/* SUB-TAB 2: OCR & FILL-IN-THE-BLANKS SIMULATOR */}
      {activeSubTab === 'ocr_simulator' && (
        <div className="saas-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Quotation OCR & Fill-in-the-Blanks Testing Sandbox
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Simulate document ingestion, non-quotation rejection, and missing parameter prompts.
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => {
                setOcrInputText("Hello sir, wedding date kab finalize hogi? Humari team tayar hai party ke liye.");
                setOcrVendorName("Ramesh Kumar (Sound Tech)");
                setOcrPendingSession(null);
              }}
              className="btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              1. Test Non-Quotation (Chit-Chat)
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
              onClick={() => handleRunOcr(null, Boolean(ocrPendingSession))}
              disabled={ocrProcessing || !ocrInputText.trim()}
              className="btn-primary"
              style={{ fontSize: '0.82rem', padding: '8px 18px' }}
            >
              {ocrProcessing ? 'Processing...' : ocrPendingSession ? 'Submit Fill-in-the-Blanks' : 'Scan & Ingest Quote'}
            </button>
          </div>

          {/* Live Output */}
          {ocrResult && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '10px',
              background: ocrResult.status === 'rejected_not_quotation' ? '#fef2f2' : ocrResult.needs_fill_blank ? '#fffbeb' : '#ecfdf5',
              border: `1px solid ${ocrResult.status === 'rejected_not_quotation' ? '#fecaca' : ocrResult.needs_fill_blank ? '#fde68a' : '#a7f3d0'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: ocrResult.status === 'rejected_not_quotation' ? '#b91c1c' : ocrResult.needs_fill_blank ? '#b45309' : '#047857'
                }}>
                  {ocrResult.status === 'rejected_not_quotation' ? 'OCR STATUS: REJECTED (NOT A VALID QUOTATION)' : ocrResult.needs_fill_blank ? 'OCR STATUS: MISSING PARAMETERS (FILL IN THE BLANKS REQUIRED)' : 'OCR STATUS: ACCEPTED & PLACED IN COMPARISON GRID'}
                </span>
              </div>

              <div 
                style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#334155' }}
                dangerouslySetInnerHTML={{ __html: ocrResult.message ? ocrResult.message.replace(/\n/g, '<br/>') : '' }}
              />

              {ocrResult.wci_score && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '16px', fontSize: '0.78rem' }}>
                  <span>WCI Score: <strong>{ocrResult.wci_score} / 100</strong></span>
                  <span>Anomaly Flag: <strong>{ocrResult.anomaly_flag ? 'Outlier (+2σ)' : 'Normal'}</strong></span>
                  <span>Grid Status: <strong style={{ color: '#4f46e5' }}>Active in Table</strong></span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
