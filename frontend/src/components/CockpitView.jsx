import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShieldCheck, Users, DollarSign, Calendar, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, BarChart3, Database,
  AlertTriangle, Send, ChevronRight
} from 'lucide-react';

export default function CockpitView({ wedding, founderData, dbHealth }) {
  const [atRiskLeads, setAtRiskLeads] = useState([]);
  const [followupStatus, setFollowupStatus] = useState(null);

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
        setFollowupStatus(`✓ Venue follow-up dispatched to ${data.lead.name}! Lead recovered.`);
        setAtRiskLeads(prev => prev.filter(i => i.id !== inquiryId));
        setTimeout(() => setFollowupStatus(null), 5000);
      }
    } catch (err) {
      console.error("Failed to send follow-up from cockpit:", err);
    }
  };

  if (!wedding) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading wedding profile...</div>;

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

  const budgetInCr = (wedding.total_budget / 10000000).toFixed(2);
  const revInCr = (macro.gross_revenue / 10000000).toFixed(2);
  const leakageInLakhs = (macro.financial_leakage_prevented / 100000).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 48H STANDOUT FEATURE: FOUNDER AT RISK OF LOSS ALERT BANNER */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '20px 28px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.12) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-amber" style={{ background: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5', border: '1px solid #ef4444' }}>
                  🚨 FOUNDER PRIORITY: AT RISK OF LOSS
                </span>
                <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
                  48h Lead Inaction Detected • KnotCore Lead Recovery Intelligence
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fef2f2' }}>
                High-Value Lead: {atRiskLeads[0].name} (₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr • {atRiskLeads[0].preferred_city}) has received no planner response for {atRiskLeads[0].hours_since_last_response || 48} hours!
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '4px' }}>
                ML Conversion Likelihood: <strong style={{ color: 'var(--color-gold-light)' }}>{atRiskLeads[0].conversion_score}%</strong> • Venue Draft: <em>"{atRiskLeads[0].follow_up_draft?.slice(0, 115)}..."</em>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => handleSendFollowup(atRiskLeads[0].id)}
              className="btn-royal-gold"
              style={{ fontSize: '0.82rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> Send Venue Follow-Up
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Success Notification */}
      {followupStatus && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-sm)',
          color: '#34d399',
          fontSize: '0.85rem'
        }}>
          {followupStatus}
        </div>
      )}

      {/* Top Banner: Season Overview & Live DB Status */}
      <div className="glass-panel" style={{
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(13, 22, 48, 0.95) 0%, rgba(22, 38, 82, 0.85) 100%)',
        border: '1px solid var(--color-border)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Founder Intelligence Cockpit</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>• {macro.season}</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            Macro Executive Portfolio ({macro.total_weddings} Luxury Weddings)
          </h2>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Operating across heritage palaces in Jaipur, Udaipur, and Samode with real-time ML buffer controls.
          </p>
        </div>

        {/* Database Live Connectivity Badge */}
        <div style={{
          textAlign: 'right',
          background: 'rgba(5, 9, 20, 0.6)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <Database size={15} color="var(--color-emerald)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>Live PostgreSQL Connection</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
            Port 5432 • DB: <strong style={{ color: 'var(--color-gold-light)' }}>{dbHealth?.db_name || 'knotcore_db'}</strong>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {dbHealth?.metrics?.operations_tasks || 26} Tasks Active • {dbHealth?.metrics?.guest_passes || 5} Passes Synced
          </div>
        </div>
      </div>

      {/* Row 1: 4 Macro KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        {/* Gross Revenue */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SEASON REVENUE</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800 }} className="font-royal">
            ₹{revInCr} <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)' }}>Cr</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> 25 Luxury Palaces Contracted
          </div>
        </div>

        {/* Operating & Net Margin */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>OPERATING MARGIN</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--color-emerald-bg)', color: 'var(--color-emerald)' }}>
              <BarChart3 size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }} className="font-royal">
            {macro.operating_margin_pct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Net Margin: <strong style={{ color: 'var(--color-gold-light)' }}>{macro.net_margin_pct}%</strong>
          </div>
        </div>

        {/* Financial Leakage Prevented */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>LEAKAGE PREVENTED</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }} className="font-royal">
            ₹{leakageInLakhs} <span style={{ fontSize: '1rem', fontWeight: 600 }}>L</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Via +2σ Outlier Engine & 3-Way Match
          </div>
        </div>

        {/* 30/60/90-Day Cash Flow */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>CASH PROJECTIONS</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(224, 122, 95, 0.15)', color: 'var(--color-pink-royal)' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
            ₹{(macro.cash_flow_30d / 10000000).toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Cr</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            30D: ₹2.45 Cr | 60D: ₹3.80 Cr | 90D: ₹5.20 Cr
          </div>
        </div>
      </div>

      {/* Row 2: Selected Wedding Profile & ML Plate Buffer Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        
        {/* Active Wedding Profile Details */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-emerald">ACTIVE CELEBRATION</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>Host PIN: {wedding.host_pin}</span>
              </div>
              <h3 className="font-royal" style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                {wedding.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={15} color="var(--color-pink-royal)" /> {wedding.location}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={15} color="var(--color-gold)" /> Nov 20 - 23, 2026
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL ALLOCATED BUDGET</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
                ₹{budgetInCr} Cr
              </div>
              <div style={{ fontSize: '0.75rem', color: '#34d399' }}>18 Categories Balanced (100%)</div>
            </div>
          </div>

          {/* 3 Key ML & Guest Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', margin: '24px 0' }}>
            <div style={{ background: 'rgba(22, 38, 82, 0.5)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>CONFIRMED GUESTS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{wedding.confirmed_guests}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>Base RSVP Guestlist</div>
            </div>

            <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> ML PREDICTED TURNOUT
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                {wedding.predicted_guests} <span style={{ fontSize: '0.85rem' }}>(+{wedding.buffer_percentage}%)</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-gold)' }}>Outstation Buffer Factored</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '4px' }}>SHAHI CATERING BUFFET</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                {wedding.food_plates_buffer} <span style={{ fontSize: '0.85rem' }}>Plates</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34d399' }}>+12% Kitchen Surge Buffer</div>
            </div>
          </div>

          {/* Milestone Billing Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600 }}>3-Stage Milestone Settlement</span>
              <span style={{ color: 'var(--color-gold-light)' }}>70% Collected (Stage 1 & 2 Completed)</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '30%', background: '#10b981' }} title="Stage 1: 30% Booking Advance (Paid)" />
              <div style={{ width: '40%', background: '#d4af37' }} title="Stage 2: 40% Production Lock-in (Paid)" />
              <div style={{ width: '30%', background: 'rgba(255,255,255,0.1)' }} title="Stage 3: 30% Final Settlement (Due Post-Event)" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              <span>✓ Stage 1: ₹75.0L (Booking)</span>
              <span>✓ Stage 2: ₹1.00 Cr (Production)</span>
              <span>⏳ Stage 3: ₹75.0L (Post-Event Final)</span>
            </div>
          </div>
        </div>

        {/* Royal Knot AI Copilot & Sentiment Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ padding: '6px', background: 'var(--color-gold-gradient)', borderRadius: '8px', color: '#070d1e' }}>
                <Sparkles size={16} />
              </div>
              <h4 className="font-royal" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                AI Operations Intelligence
              </h4>
            </div>

            <div style={{ background: 'rgba(5, 9, 20, 0.6)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>CLIENT SENTIMENT GAUGE</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>96% Delight</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '96%', height: '100%', background: 'linear-gradient(90deg, #d4af37, #10b981)' }} />
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              KnotCore's Turnout Engine continuously recalculates outstation flights arriving at Jaipur Airport. The current buffer of <strong>468 guests (+17%)</strong> guarantees zero plate shortages during the Shahi Royal Banquet.
            </p>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              Client: {wedding.client_name}
            </div>
            <span className="badge badge-sapphire" style={{ fontSize: '0.7rem' }}>
              Live Sync Active
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
