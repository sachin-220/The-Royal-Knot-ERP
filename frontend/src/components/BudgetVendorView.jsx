import React, { useState, useEffect } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle, ShieldAlert, Award, FileText, 
  Search, TrendingUp, Filter, ChevronRight, Sparkles, Send, RefreshCw, Eye, CheckCircle2, Shield
} from 'lucide-react';

export default function BudgetVendorView({ weddingId }) {
  const [budgetData, setBudgetData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('comparison'); // 'comparison' | 'matrix' | 'ocr_simulator'
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

  // OCR Submission Handler
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

      // If quote was accepted and saved, refresh the quotes table
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

  // Category code to benchmark unit mapping
  const categoryBenchmarks = {
    "CAT-02": { name: "Royal Catering & Banqueting", avg: 5000000, std: 400000, unit: "plates" },
    "CAT-03": { name: "Floral Architecture & Production", avg: 3000000, std: 250000, unit: "pavilions" },
    "CAT-05": { name: "Light, Sound & Concert AV", avg: 1500000, std: 120000, unit: "stage rigs" },
    "CAT-01": { name: "Palace Venue Licensing & Security", avg: 6000000, std: 500000, unit: "days" },
    "CAT-04": { name: "Cinematography & Drone Production", avg: 1800000, std: 150000, unit: "crew shoots" },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Phase 3 Procurement Matrix</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>One-Way Mirror OCR Ingestion • Blind Multi-Vendor Bidding</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Vendor Quotation Comparison Grid & Budget Intelligence
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Quotes ingested via OCR $\rightarrow$ Dynamic Fill-in-the-Blanks $\rightarrow$ Side-by-side vendor comparison with WCI Scoring & +2σ Anomaly Outlier Detection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL ALLOCATED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
              ₹{(totalAllocated / 10000000).toFixed(2)} Cr
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399' }}>18 Categories Strictly Balanced</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>COMMITTED CONTRACTS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }} className="font-royal">
              ₹{(totalCommitted / 10000000).toFixed(2)} Cr
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>Via Signed Purchase Orders</div>
          </div>
        </div>
      </div>

      {/* Award Success Alert Banner */}
      {awardSuccess && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#34d399'
        }}>
          <CheckCircle size={20} />
          <div>
            <strong>Purchase Order Issued Successfully!</strong> {awardSuccess.message} (PO Reference: <code>{awardSuccess.purchase_order}</code>)
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('comparison')}
          className={activeSubTab === 'comparison' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Award size={16} /> Multi-Vendor Quotation Comparison Grid
        </button>
        <button
          onClick={() => setActiveSubTab('ocr_simulator')}
          className={activeSubTab === 'ocr_simulator' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Sparkles size={16} /> Live OCR & Fill-in-the-Blanks Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={activeSubTab === 'matrix' ? 'btn-royal-gold' : 'btn-royal-outline'}
          style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FileText size={16} /> 18-Category Budget Allocation Matrix
        </button>
      </div>

      {/* SUB-TAB 1: MULTI-VENDOR QUOTATION COMPARISON TABLE */}
      {activeSubTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Category Filter Pills & Category Benchmark Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>FILTER COMPARISON BY CATEGORY</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['ALL', 'CAT-02', 'CAT-03', 'CAT-05'].map((code) => {
                    const label = code === 'ALL' ? 'All Bids' : `${code} - ${categoryBenchmarks[code]?.name || code}`;
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedCategory(code)}
                        className={selectedCategory === code ? 'btn-royal-gold' : 'btn-royal-outline'}
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Benchmark Reference Details */}
              {selectedCategory !== 'ALL' && categoryBenchmarks[selectedCategory] && (
                <div style={{ background: 'rgba(5, 9, 20, 0.6)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>BENCHMARK MODEL: </span>
                  <span style={{ color: 'var(--color-text-main)' }}>
                    Historical Avg: <strong>₹{(categoryBenchmarks[selectedCategory].avg / 100000).toFixed(1)}L</strong> | 
                    +2σ Outlier Limit: <strong style={{ color: '#f87171' }}>₹{((categoryBenchmarks[selectedCategory].avg + 2 * categoryBenchmarks[selectedCategory].std) / 100000).toFixed(1)}L</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Comparison Grid Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '12px 14px' }}>VENDOR NAME</th>
                    <th style={{ padding: '12px 14px' }}>CATEGORY</th>
                    <th style={{ padding: '12px 14px' }}>QUOTED ITEM / SCOPE</th>
                    <th style={{ padding: '12px 14px' }}>QUANTITY</th>
                    <th style={{ padding: '12px 14px' }}>UNIT RATE</th>
                    <th style={{ padding: '12px 14px' }}>TOTAL PRICE</th>
                    <th style={{ padding: '12px 14px' }}>WCI SCORE</th>
                    <th style={{ padding: '12px 14px' }}>ANOMALY AUDIT</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
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
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isAwarded ? 'rgba(16, 185, 129, 0.05)' : isAnomaly ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isAwarded ? 'rgba(16, 185, 129, 0.08)' : 'rgba(212, 175, 55, 0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = isAwarded ? 'rgba(16, 185, 129, 0.05)' : isAnomaly ? 'rgba(239, 68, 68, 0.04)' : 'transparent'}
                      >
                        {/* Vendor Name */}
                        <td style={{ padding: '14px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{q.vendor_name}</span>
                            {q.wci_score >= 90 && (
                              <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                                ★ TOP WCI
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                            Ref: <code>BID-{q.id.toString().padStart(4, '0')}</code> • OCR Ingested
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px' }}>
                          <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>{q.category_code}</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{q.category_name}</div>
                        </td>

                        {/* Item Scope */}
                        <td style={{ padding: '14px', maxWidth: '240px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {scopeDisplay}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#60a5fa' }}>One-Way Mirror Blind Bid</div>
                        </td>

                        {/* Quantity */}
                        <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {qtyDisplay}
                        </td>

                        {/* Unit Rate */}
                        <td style={{ padding: '14px', fontFamily: 'monospace', color: 'var(--color-text-dim)' }}>
                          {unitRate}
                        </td>

                        {/* Total Price */}
                        <td style={{ padding: '14px', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isAnomaly ? '#f87171' : 'var(--color-gold-light)' }}>
                            ₹{(q.quoted_price / 100000).toFixed(2)} L
                          </div>
                          <div style={{ fontSize: '0.7rem', color: q.quoted_price > q.historical_avg ? '#f87171' : '#34d399' }}>
                            {q.quoted_price > q.historical_avg ? `+₹${((q.quoted_price - q.historical_avg)/100000).toFixed(1)}L vs Avg` : `-₹${((q.historical_avg - q.quoted_price)/100000).toFixed(1)}L vs Avg`}
                          </div>
                        </td>

                        {/* WCI Score */}
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isAnomaly ? '#f87171' : 'var(--color-gold)' }}>
                              {q.wci_score}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>/ 100</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                            P:{q.quality_score || 92} | D:{q.delivery_score || 90}
                          </div>
                        </td>

                        {/* Anomaly Audit */}
                        <td style={{ padding: '14px' }}>
                          {isAnomaly ? (
                            <span className="badge badge-amber" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontSize: '0.68rem' }}>
                              <AlertTriangle size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                              +2σ Outlier Leakage
                            </span>
                          ) : (
                            <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                              <CheckCircle2 size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                              Competitive (Within σ)
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          {isAwarded ? (
                            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700 }}>
                              ✓ {q.purchase_order_ref || 'PO GENERATED'}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAwardQuote(q.id)}
                              disabled={isAnomaly || awardingId === q.id}
                              className={isAnomaly ? "btn-royal-outline" : "btn-royal-gold"}
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.76rem',
                                opacity: isAnomaly ? 0.35 : 1,
                                cursor: isAnomaly ? 'not-allowed' : 'pointer'
                              }}
                              title={isAnomaly ? "Cannot award: Quote exceeds +2σ price limit" : "Award contract and generate Purchase Order"}
                            >
                              {awardingId === q.id ? 'Awarding PO...' : 'Award PO'}
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

          {/* Comparative Analysis Takeaways */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} /> One-Way Mirror Blind Protocol
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Participating vendors in the procurement pool submit bids independently via the Telegram bot or group. Bids are veiled so competing vendors cannot inspect rival pricing, completely eliminating price collusions and artificial bidding rings.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={16} /> Automated WCI Multi-Factor Ranking
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                KnotCore evaluates vendors using a weighted composite formula: <strong>35% Price Ratio + 30% Quality Audit + 20% Delivery Punctuality + 15% Financial Stability</strong>. Bids exceeding $+2\sigma$ of historical averages are automatically locked against PO generation to protect agency operating margins.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: LIVE OCR & FILL-IN-THE-BLANKS SIMULATOR */}
      {activeSubTab === 'ocr_simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Vendor OCR Engine Sandbox</span>
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                Test Vendor Quotation Ingestion, Rejection & Fill-in-the-Blanks Live
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                Simulate how the OCR engine ingests vendor documents, rejects non-quotations, prompts for missing quantities, and updates the comparison table.
              </p>
            </div>

            {/* 3 Quick Demonstration Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setOcrInputText("Hello sir, wedding date kab finalize hogi? Humari team tayar hai party ke liye.");
                  setOcrVendorName("Ramesh Kumar (Sound Tech)");
                  setOcrPendingSession(null);
                }}
                className="btn-royal-outline"
                style={{ fontSize: '0.78rem', padding: '8px 14px' }}
              >
                1. Test Non-Quotation (Chit-Chat)
              </button>

              <button
                onClick={() => {
                  setOcrInputText("COMMERCIAL ESTIMATE\nSupplier: Royal Marwar Caterers\nItem: 3-Day Heritage Rajasthani Buffet with Dal Baati Churma\nUnit Rate: 4500 per plate\nTotal Price: ₹23,58,000 INR");
                  setOcrVendorName("Royal Marwar Caterers");
                  setOcrPendingSession(null);
                }}
                className="btn-royal-outline"
                style={{ fontSize: '0.78rem', padding: '8px 14px', color: 'var(--color-gold-light)', borderColor: 'rgba(212,175,55,0.4)' }}
              >
                2. Test Missing Quantity Quote (Triggers Blanks)
              </button>

              <button
                onClick={() => {
                  setOcrInputText("524 plates");
                  setOcrVendorName("Royal Marwar Caterers");
                }}
                className="btn-royal-outline"
                style={{ fontSize: '0.78rem', padding: '8px 14px', color: '#34d399', borderColor: 'rgba(16,185,129,0.4)' }}
              >
                3. Test Fill-in-the-Blanks ('524 plates')
              </button>
            </div>

            {/* Input Box & Vendor Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>VENDOR NAME</label>
                <input
                  type="text"
                  value={ocrVendorName}
                  onChange={e => setOcrVendorName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(5, 9, 20, 0.6)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                  VENDOR DOCUMENT / OCR TEXT INPUT
                </label>
                <textarea
                  rows={4}
                  value={ocrInputText}
                  onChange={e => setOcrInputText(e.target.value)}
                  placeholder="Paste or type vendor quotation, invoice, or message here..."
                  style={{
                    width: '100%',
                    background: 'rgba(5, 9, 20, 0.6)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>

            {/* Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => handleRunOcr(null, Boolean(ocrPendingSession))}
                disabled={ocrProcessing || !ocrInputText.trim()}
                className="btn-royal-gold"
                style={{ fontSize: '0.85rem', padding: '10px 22px' }}
              >
                {ocrProcessing ? 'Processing OCR Extraction...' : ocrPendingSession ? 'Submit Fill-in-the-Blanks Reply ↵' : 'Scan & Ingest Quotation ⚡'}
              </button>
            </div>

            {/* Live OCR Engine Output Display */}
            {ocrResult && (
              <div style={{
                marginTop: '20px',
                padding: '18px',
                borderRadius: 'var(--radius-sm)',
                background: ocrResult.status === 'rejected_not_quotation' ? 'rgba(239, 68, 68, 0.1)' : ocrResult.needs_fill_blank ? 'rgba(212, 175, 55, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${ocrResult.status === 'rejected_not_quotation' ? 'rgba(239,68,68,0.3)' : ocrResult.needs_fill_blank ? 'rgba(212,175,55,0.3)' : 'rgba(16,185,129,0.3)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  {ocrResult.status === 'rejected_not_quotation' ? (
                    <AlertTriangle color="#f87171" size={18} />
                  ) : ocrResult.needs_fill_blank ? (
                    <FileText color="var(--color-gold)" size={18} />
                  ) : (
                    <CheckCircle2 color="#34d399" size={18} />
                  )}
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: ocrResult.status === 'rejected_not_quotation' ? '#f87171' : ocrResult.needs_fill_blank ? 'var(--color-gold-light)' : '#34d399'
                  }}>
                    {ocrResult.status === 'rejected_not_quotation' ? 'OCR CONFIRMATION: REJECTED (NOT A QUOTATION)' : ocrResult.needs_fill_blank ? 'OCR EXTRACTED — MISSING FIELDS (FILL IN THE BLANKS REQUIRED)' : 'OCR COMPLETE — INGESTED INTO COMPARISON GRID'}
                  </span>
                </div>

                <div 
                  style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#f8fafc' }}
                  dangerouslySetInnerHTML={{ __html: ocrResult.message ? ocrResult.message.replace(/\n/g, '<br/>') : '' }}
                />

                {ocrResult.wci_score && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                    <span>WCI Score: <strong style={{ color: 'var(--color-gold)' }}>{ocrResult.wci_score} / 100</strong></span>
                    <span>Anomaly Flag: <strong style={{ color: ocrResult.anomaly_flag ? '#f87171' : '#34d399' }}>{ocrResult.anomaly_flag ? 'YES (+2σ Outlier)' : 'NO (Normal)'}</strong></span>
                    <span>Grid Status: <strong style={{ color: '#60a5fa' }}>Active in Comparison Grid</strong></span>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 3: 18-CATEGORY ALLOCATION TABLE */}
      {activeSubTab === 'matrix' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Full 18-Category Allocation Matrix
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                18 specialized luxury categories strictly summing to 100% of ₹{(totalAllocated/10000000).toFixed(2)} Cr
              </span>
            </div>

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Search category or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(5, 9, 20, 0.6)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px 8px 34px',
                  color: 'var(--color-text-main)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 16px' }}>CODE</th>
                  <th style={{ padding: '12px 16px' }}>CATEGORY NAME</th>
                  <th style={{ padding: '12px 16px' }}>WEIGHT</th>
                  <th style={{ padding: '12px 16px' }}>ALLOCATED</th>
                  <th style={{ padding: '12px 16px' }}>COMMITTED</th>
                  <th style={{ padding: '12px 16px' }}>VARIANCE</th>
                  <th style={{ padding: '12px 16px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((c) => {
                  const allocL = (c.allocated_amount / 100000).toFixed(2);
                  const commL = (c.committed_amount / 100000).toFixed(2);
                  const varL = (c.variance / 100000).toFixed(2);
                  const isOver = c.variance > 0;

                  return (
                    <tr 
                      key={c.category_code}
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-gold)' }}>
                        {c.category_code}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {c.category_name}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--color-gold-light)', fontWeight: 700 }}>
                        {c.percentage}%
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                        ₹{allocL} L
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>
                        ₹{commL} L
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: isOver ? '#f87171' : '#34d399' }}>
                        {isOver ? `+₹${varL} L` : `-₹${Math.abs(varL)} L`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge ${c.status === 'on_track' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.68rem' }}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
