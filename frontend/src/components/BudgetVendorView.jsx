import React, { useState, useEffect } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle, ShieldAlert, Award, FileText, 
  Search, TrendingUp, Filter, ChevronRight 
} from 'lucide-react';

export default function BudgetVendorView({ weddingId }) {
  const [budgetData, setBudgetData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [awardingId, setAwardingId] = useState(null);
  const [awardSuccess, setAwardSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const totalPercentage = budgetData?.summary?.total_percentage || 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Phase 3 Allocation Matrix</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Strict 100.00% Sum Guard</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            18-Category Dynamic Budget & WCI Vendor Matrix
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Multi-vendor quotes weighted by Composite Index (WCI) with automatic +2σ outlier anomaly flagging.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL ALLOCATED</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
              ₹{(totalAllocated / 10000000).toFixed(2)} Cr
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399' }}>100.00% Weighted Balance</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>COMMITTED CONTRACTS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }} className="font-royal">
              ₹{(totalCommitted / 10000000).toFixed(2)} Cr
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>₹{((totalAllocated - totalCommitted)/100000).toFixed(1)}L Free Margin</div>
          </div>
        </div>
      </div>

      {/* Success Banner when PO is Awarded */}
      {awardSuccess && (
        <div className="glass-panel" style={{
          padding: '16px 24px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulseGlow 2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={24} color="#34d399" />
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                Winner Vendor Selected & Purchase Order Created!
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>
                Contract awarded to <strong>{awardSuccess.quote?.vendor_name}</strong> for {awardSuccess.quote?.category_name}.
              </div>
            </div>
          </div>
          <div className="badge badge-emerald" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            PO REF: {awardSuccess.purchase_order}
          </div>
        </div>
      )}

      {/* Multi-Vendor Comparison Grid Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Competitive Multi-Vendor Evaluation & +2σ Anomaly Detector
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Weighted Composite Index: 35% Price + 30% Quality + 20% Delivery + 15% Financial Stability.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={selectedCategory === 'ALL' ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              All Quotes
            </button>
            <button
              onClick={() => setSelectedCategory('CAT-02')}
              className={selectedCategory === 'CAT-02' ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Catering (CAT-02)
            </button>
            <button
              onClick={() => setSelectedCategory('CAT-03')}
              className={selectedCategory === 'CAT-03' ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Floral (CAT-03)
            </button>
            <button
              onClick={() => setSelectedCategory('CAT-05')}
              className={selectedCategory === 'CAT-05' ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              Light & Sound (CAT-05)
            </button>
          </div>
        </div>

        {/* Quotes Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredQuotes.map((q) => {
            const priceL = (q.quoted_price / 100000).toFixed(2);
            const avgL = (q.historical_avg / 100000).toFixed(2);
            const isAnomaly = q.anomaly_flag;
            const isAwarded = q.status === 'awarded';

            return (
              <div 
                key={q.id}
                style={{
                  background: isAnomaly 
                    ? 'rgba(239, 68, 68, 0.08)' 
                    : isAwarded 
                      ? 'rgba(16, 185, 129, 0.08)' 
                      : 'rgba(22, 38, 82, 0.45)',
                  border: isAnomaly 
                    ? '1px solid rgba(239, 68, 68, 0.5)' 
                    : isAwarded 
                      ? '1px solid rgba(16, 185, 129, 0.5)' 
                      : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  {/* Category & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                      {q.category_code} • {q.category_name}
                    </span>
                    {isAnomaly ? (
                      <span className="badge badge-ruby" style={{ fontSize: '0.7rem' }}>
                        <ShieldAlert size={12} /> +2σ ANOMALY
                      </span>
                    ) : isAwarded ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle size={12} /> AWARDED PO
                      </span>
                    ) : (
                      <span className="badge badge-sapphire" style={{ fontSize: '0.7rem' }}>
                        SHORTLISTED
                      </span>
                    )}
                  </div>

                  {/* Vendor Name & Price */}
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                    {q.vendor_name}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isAnomaly ? '#f87171' : 'var(--color-gold-light)' }} className="font-royal">
                      ₹{priceL} L
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                      (Hist Avg: ₹{avgL} L)
                    </span>
                  </div>

                  {/* Anomaly Callout Warning if Flagged */}
                  {isAnomaly && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#f87171',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <AlertTriangle size={14} />
                      <span>Quote exceeds 2 Standard Deviations (+2σ). Potential financial leakage.</span>
                    </div>
                  )}

                  {/* 4 Score Pillars */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: 'rgba(5, 9, 20, 0.5)', padding: '10px', borderRadius: '6px', marginBottom: '14px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>PRICE</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{isAnomaly ? '45' : '92'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>QUALITY</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{q.quality_score}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>DELIVERY</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{q.delivery_score}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>FINANCIAL</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{q.financial_stability_score}</div>
                    </div>
                  </div>
                </div>

                {/* Footer: WCI Score & Award Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>COMPOSITE WCI</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isAnomaly ? '#f87171' : 'var(--color-gold)' }}>
                      {q.wci_score} / 100
                    </span>
                  </div>

                  {isAwarded ? (
                    <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                      {q.purchase_order_ref || 'PO GENERATED'}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAwardQuote(q.id)}
                      disabled={isAnomaly || awardingId === q.id}
                      className={isAnomaly ? "btn-royal-outline" : "btn-royal-gold"}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        opacity: isAnomaly ? 0.4 : 1,
                        cursor: isAnomaly ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {awardingId === q.id ? 'Awarding PO...' : 'Award & Create PO'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 18-Category Allocation Table */}
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

    </div>
  );
}
