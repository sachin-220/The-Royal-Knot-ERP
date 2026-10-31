import React, { useState, useEffect } from 'react';
import { 
  Users, QrCode, FileText, CheckCircle2, Send, ShieldAlert, Sparkles, 
  ArrowRight, RefreshCw, Eye, Download, Shield, Clock, Award, AlertCircle,
  TrendingUp, AlertTriangle, UserCheck, MessageSquare, Flame
} from 'lucide-react';

export default function EnquiriesView() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recovery simulation loading
  const [simulatingRecovery, setSimulatingRecovery] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/leads/conversion-overview');
      const data = await res.json();
      setInquiries(data);
      // Update selected inquiry if currently open
      if (selectedInquiry) {
        const updated = data.find(i => i.id === selectedInquiry.id);
        if (updated) setSelectedInquiry(updated);
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    const interval = setInterval(fetchInquiries, 10000); // 10s live sync
    return () => clearInterval(interval);
  }, []);

  const handleTakeAction = async (inquiryId) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryId}/take-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data);
        fetchInquiries();
      }
    } catch (err) {
      console.error("Take action error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmSigning = async (inquiryId) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data);
        fetchInquiries();
      }
    } catch (err) {
      console.error("Signing confirm error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcastRFP = async (inquiryId) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryId}/broadcast-rfp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data);
        fetchInquiries();
      }
    } catch (err) {
      console.error("Broadcast RFP error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Lead Recovery Time Elapsed (48h or 72h)
  const handleSimulateRecovery = async (inquiryId, hours) => {
    try {
      setSimulatingRecovery(true);
      const res = await fetch(`http://127.0.0.1:5000/api/leads/${inquiryId}/simulate-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: hours })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess({
          message: hours >= 72 
            ? `🚨 72h elapsed! Lead #${inquiryId} automatically reassigned to ${data.assigned_planner}.`
            : hours >= 48 
            ? `⚠️ 48h elapsed! Lead #${inquiryId} flagged as 'At Risk of Loss'. Customized venue follow-up drafted.`
            : `Lead #${inquiryId} reset to healthy status (0h elapsed).`
        });
        fetchInquiries();
      }
    } catch (err) {
      console.error("Simulate recovery error:", err);
    } finally {
      setSimulatingRecovery(false);
    }
  };

  // Dispatch Venue Follow-Up Message
  const handleSendFollowup = async (inquiryId) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/leads/${inquiryId}/send-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess({
          message: data.message
        });
        fetchInquiries();
      }
    } catch (err) {
      console.error("Send follow-up error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = filterStatus === 'ALL' 
    ? inquiries 
    : inquiries.filter(i => i.status === filterStatus);

  // Check if any high-value lead is At Risk
  const atRiskLeads = inquiries.filter(i => i.risk_status === 'at_risk' || (i.hours_since_last_response >= 48 && i.risk_status !== 'recovered'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">CRM Lead Intake & Intelligence</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Unified Telegram Bot (@Royalknot_bot) • ML Conversion & Recovery Guard</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            User Enquiries, ML Conversion Scoring & Lead Recovery Intelligence
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            QR Scan $\rightarrow$ 4-Step Dynamic Interview $\rightarrow$ ML Budget-to-Guest Scoring (0-100%) $\rightarrow$ 48h At-Risk Loss Flag $\rightarrow$ 72h Backup Reassignment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={fetchInquiries} 
            className="btn-royal-outline"
            style={{ fontSize: '0.78rem', padding: '8px 14px' }}
          >
            <RefreshCw size={13} /> Live Refresh
          </button>
        </div>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccess && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#34d399'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{actionSuccess.message}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
        </div>
      )}

      {/* STANDOUT FEATURE: 48H AT-RISK LOSS ALERT BANNER */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.25)',
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
                <span className="badge badge-amber" style={{ background: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', border: '1px solid #ef4444' }}>
                  🚨 FOUNDER STANDOUT FEATURE: AT RISK OF LOSS
                </span>
                <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>48h Inaction Detected</span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fef2f2' }}>
                {atRiskLeads[0].name} ({atRiskLeads[0].preferred_city} • ₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr) has received no planner response for {atRiskLeads[0].hours_since_last_response || 48} hours!
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#fca5a5', maxWidth: '780px', lineHeight: 1.4 }}>
                KnotCore Lead Recovery Intelligence has pre-drafted a bespoke venue follow-up customized to <strong>{atRiskLeads[0].preferred_city === 'Jaipur' ? 'Rambagh Palace' : 'Jagmandir Island'}</strong>. Leads untouched after 72 hours are automatically transferred to backup planner <strong>Digvijay Singh Rathore</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => handleSendFollowup(atRiskLeads[0].id)}
              disabled={actionLoading}
              className="btn-royal-gold"
              style={{ fontSize: '0.82rem', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} /> Send AI Venue Follow-Up
            </button>
            <button
              onClick={() => setSelectedInquiry(atRiskLeads[0])}
              className="btn-royal-outline"
              style={{ fontSize: '0.82rem', padding: '10px 16px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              Inspect Lead
            </button>
          </div>
        </div>
      )}

      {/* Row: 4 ML Intelligence KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        
        {/* ML Conversion Likelihood */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ML CONVERSION AVERAGE</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--color-gold)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
            91.2%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ★ Very High Likelihood (Top Tier)
          </div>
        </div>

        {/* Budget-to-Guest Ratio Spend */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>SPEND PER GUEST RATIO</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }} className="font-royal">
            ₹57,143 <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ guest</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Ultra-Luxury Benchmark: ₹50k+
          </div>
        </div>

        {/* Winter Peak Season Multiplier */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>WINTER SEASON FACTOR</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(224, 122, 95, 0.15)', color: 'var(--color-pink-royal)' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-pink-royal)' }} className="font-royal">
            95 / 100
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Peak Winter Season (Nov - Feb)
          </div>
        </div>

        {/* Recovery SLA Intelligence */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>RECOVERY INTELLIGENCE</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 6px', fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }} className="font-royal">
            48h / 72h
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            48h Risk Flag • 72h Auto Reassign
          </div>
        </div>

      </div>

      {/* Main Table: User Enquiries & ML Prediction */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 className="font-royal" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              Incoming Royal Enquiries & ML Lead Conversion Ledger
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Real-time ingestion from Telegram @Royalknot_bot • Budget-to-guest ratio model • Lead recovery SLA
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'new', 'proposal_sent', 'signed', 'rfp_broadcast'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={filterStatus === st ? 'btn-royal-gold' : 'btn-royal-outline'}
                style={{ padding: '5px 12px', fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px' }}>INQUIRY REF</th>
                <th style={{ padding: '12px 14px' }}>COUPLE / CLIENT</th>
                <th style={{ padding: '12px 14px' }}>DESTINATION & GUESTS</th>
                <th style={{ padding: '12px 14px' }}>BUDGET (INR)</th>
                <th style={{ padding: '12px 14px' }}>ML CONVERSION (0-100%)</th>
                <th style={{ padding: '12px 14px' }}>RECOVERY RISK (48H/72H)</th>
                <th style={{ padding: '12px 14px' }}>ASSIGNED PLANNER</th>
                <th style={{ padding: '12px 14px' }}>STATUS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inq) => {
                const budgetCr = inq.budget_inr ? `₹${(inq.budget_inr / 10000000).toFixed(2)} Cr` : 'Pending';
                const isSigned = inq.status === 'signed' || inq.status === 'rfp_broadcast';
                const isPropSent = inq.status === 'proposal_sent';
                const score = parseFloat(inq.conversion_score || 91.2);
                const isAtRisk = inq.risk_status === 'at_risk' || (inq.hours_since_last_response >= 48 && inq.risk_status !== 'recovered');
                const isReassigned = inq.risk_status === 'reassigned' || inq.hours_since_last_response >= 72;

                return (
                  <tr 
                    key={inq.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isAtRisk ? 'rgba(239, 68, 68, 0.05)' : isReassigned ? 'rgba(147, 51, 234, 0.05)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = isAtRisk ? 'rgba(239, 68, 68, 0.05)' : isReassigned ? 'rgba(147, 51, 234, 0.05)' : 'transparent'}
                  >
                    {/* Ref */}
                    <td style={{ padding: '14px', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                      INQ-{inq.id.toString().padStart(4, '0')}
                    </td>

                    {/* Client */}
                    <td style={{ padding: '14px', fontWeight: 700 }}>
                      <div>{inq.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', fontWeight: 400 }}>
                        {inq.phone || '+91 97722 33445'} • {inq.telegram_id || '@client'}
                      </div>
                    </td>

                    {/* Destination & Guests */}
                    <td style={{ padding: '14px' }}>
                      <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>
                        {inq.preferred_city} ({inq.duration_days || 3} Days)
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {inq.guest_count} Confirmed Guests
                      </div>
                    </td>

                    {/* Budget */}
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                      {budgetCr}
                      <div style={{ fontSize: '0.68rem', color: '#34d399' }}>
                        ₹{Math.round((inq.budget_inr || 20000000) / (inq.guest_count || 350)).toLocaleString('en-IN')}/guest
                      </div>
                    </td>

                    {/* ML Conversion Score (0 - 100%) */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: score >= 80 ? 'var(--color-gold-light)' : score >= 60 ? '#60a5fa' : '#f87171'
                        }}>
                          {score.toFixed(1)}%
                        </span>
                        <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                          {inq.conversion_tier || 'Very High'}
                        </span>
                      </div>
                      <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${score}%`,
                          height: '100%',
                          background: score >= 80 ? 'var(--color-gold-gradient)' : '#60a5fa'
                        }} />
                      </div>
                    </td>

                    {/* Recovery Risk Status (48h / 72h) */}
                    <td style={{ padding: '14px' }}>
                      {isReassigned ? (
                        <span className="badge" style={{ background: 'rgba(147, 51, 234, 0.2)', color: '#c084fc', border: '1px solid rgba(147, 51, 234, 0.4)', fontSize: '0.68rem' }}>
                          <UserCheck size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                          72h Reassigned
                        </span>
                      ) : isAtRisk ? (
                        <span className="badge badge-amber" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', fontSize: '0.68rem' }}>
                          <AlertTriangle size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                          At Risk of Loss (48h)
                        </span>
                      ) : (
                        <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                          <CheckCircle2 size={11} style={{ marginRight: '3px', verticalAlign: '-1px' }} />
                          Healthy (&lt;48h)
                        </span>
                      )}
                    </td>

                    {/* Assigned Planner */}
                    <td style={{ padding: '14px', fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 600, color: isReassigned ? '#c084fc' : '#f8fafc' }}>
                        {inq.assigned_planner || 'Welcome (Lead Planner)'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)' }}>
                        Backup: {inq.backup_planner ? 'Digvijay S.' : 'Digvijay S. Rathore'}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${
                        isSigned ? 'badge-emerald' : 
                        isPropSent ? 'badge-sapphire' : 'badge-amber'
                      }`} style={{ fontSize: '0.68rem' }}>
                        {inq.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="btn-royal-gold"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      >
                        Take Action & SLA <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action & Lead Recovery Drawer Modal */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '680px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                    PROTOCOL INQ-{selectedInquiry.id.toString().padStart(4, '0')}
                  </span>
                  {selectedInquiry.risk_status === 'at_risk' && (
                    <span className="badge badge-amber" style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#f87171' }}>
                      🚨 AT RISK OF LOSS (48H SLA)
                    </span>
                  )}
                  {selectedInquiry.risk_status === 'reassigned' && (
                    <span className="badge" style={{ background: 'rgba(147, 51, 234, 0.25)', color: '#c084fc' }}>
                      🔄 REASSIGNED (72H SLA)
                    </span>
                  )}
                </div>
                <h3 className="font-royal" style={{ margin: '4px 0 0', fontSize: '1.45rem', fontWeight: 800 }}>
                  {selectedInquiry.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {selectedInquiry.preferred_city} • {selectedInquiry.duration_days || 3} Days • Telegram: {selectedInquiry.telegram_id} • Assigned: <strong style={{ color: '#f8fafc' }}>{selectedInquiry.assigned_planner || 'Welcome (Lead Planner)'}</strong>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="btn-royal-outline"
                style={{ padding: '6px 10px' }}
              >
                ✕
              </button>
            </div>

            {/* 1. ML Lead Conversion Prediction Scoring Breakdown */}
            <div style={{
              background: 'rgba(5, 9, 20, 0.75)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> ML CONVERSION PREDICTION SCORING ENGINE (0% - 100%)
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                  {parseFloat(selectedInquiry.conversion_score || 91.2).toFixed(1)}% Conversion Likelihood
                </span>
              </div>

              {/* 4 ML Model Parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>BUDGET / GUEST</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>90.0</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>₹57.1k/guest</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>WINTER SEASON</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>95.0</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>Nov - Feb Peak</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>VENUE TIER</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>92.0</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>Heritage Palace</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>SENTIMENT</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>88.0</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>High Delight</div>
                </div>
              </div>
            </div>

            {/* 2. STANDOUT FEATURE: LEAD RECOVERY INTELLIGENCE CONSOLE */}
            <div style={{
              background: 'rgba(13, 22, 48, 0.7)',
              border: selectedInquiry.risk_status === 'at_risk' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedInquiry.risk_status === 'at_risk' ? '#f87171' : '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={15} /> STANDOUT FEATURE: LEAD RECOVERY INTELLIGENCE
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                  Inactivity Clock: <strong style={{ color: selectedInquiry.hours_since_last_response >= 48 ? '#f87171' : 'var(--color-gold-light)' }}>{selectedInquiry.hours_since_last_response || 0} Hours Elapsed</strong>
                </span>
              </div>

              {/* Venue-Customized Follow-Up Draft */}
              <div style={{ background: 'rgba(5, 9, 20, 0.7)', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-gold)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageSquare size={12} /> AI CUSTOMIZED FOLLOW-UP DRAFT (Tailored to {selectedInquiry.preferred_city === 'Jaipur' ? 'Rambagh Palace, Jaipur' : 'Jagmandir Island, Udaipur'}):
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#f8fafc', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{selectedInquiry.follow_up_draft || `Padharo Sa ${selectedInquiry.name},\nWe are actively holding prime heritage pavilion dates for your 3-day wedding celebration at Rambagh Palace, Jaipur. Our Executive Banqueting Chef has pre-calculated a 524-plate tasting menu. Given high winter season demand in Jaipur, shall we confirm your palace date lock today?`}"
                </p>
              </div>

              {/* Dispatch Draft Button & Simulation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  onClick={() => handleSendFollowup(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-gold"
                  style={{ fontSize: '0.78rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> {actionLoading ? 'Dispatching...' : '⚡ Send Venue Follow-Up to Telegram'}
                </button>

                {/* Simulation Time Buttons */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 48)}
                    disabled={simulatingRecovery}
                    className="btn-royal-outline"
                    style={{ fontSize: '0.7rem', padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    title="Simulate 48 hours without planner response: triggers 'At Risk of Loss' flag on Founder Dashboard"
                  >
                    ⏱️ Simulate 48h (Trigger Risk)
                  </button>

                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 72)}
                    disabled={simulatingRecovery}
                    className="btn-royal-outline"
                    style={{ fontSize: '0.7rem', padding: '6px 10px', color: '#c084fc', borderColor: 'rgba(147, 51, 234, 0.4)' }}
                    title="Simulate 72 hours untouched: automatically reassigns lead to backup planner Digvijay Singh Rathore"
                  >
                    🚨 Simulate 72h (Auto-Reassign)
                  </button>

                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 0)}
                    disabled={simulatingRecovery}
                    className="btn-royal-outline"
                    style={{ fontSize: '0.7rem', padding: '6px 10px' }}
                    title="Reset lead inactivity clock to 0 hours"
                  >
                    🔄 Reset (0h)
                  </button>
                </div>
              </div>
            </div>

            {/* 3. CRM ACTION PROTOCOL (PDF Proposal, Signing, RFP Broadcast) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Action 1: Compile PDF Proposal & Send to Client Bot */}
              <div style={{ background: 'rgba(22, 38, 82, 0.4)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                    1. Luxury Proposal PDF Generation & Bot Dispatch
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Runs ReportLab engine, formats 18 categories, and prompts client in Telegram.
                  </div>
                </div>
                <button
                  onClick={() => handleTakeAction(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-gold"
                  style={{ fontSize: '0.75rem', padding: '7px 14px', flexShrink: 0 }}
                >
                  {actionLoading ? 'Compiling...' : '⚡ Generate & Send PDF'}
                </button>
              </div>

              {/* Action 2: Digital Counter-Signature & Advance Confirmation */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>
                    2. Confirm Digital Signing & Advance Paid
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Locks booking date, advances 30% milestone deposit into escrow.
                  </div>
                </div>
                <button
                  onClick={() => handleConfirmSigning(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-outline"
                  style={{ fontSize: '0.75rem', padding: '7px 14px', color: '#34d399', borderColor: 'rgba(16,185,129,0.4)', flexShrink: 0 }}
                >
                  ✍️ Confirm Signed
                </button>
              </div>

              {/* Action 3: Release to One-Way Mirror Vendor Group */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#60a5fa' }}>
                    3. Release RFQs to One-Way Mirror Vendor Group
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    Blind bidding: competing vendors cannot view rival quotes; platform receives all bids.
                  </div>
                </div>
                <button
                  onClick={() => handleBroadcastRFP(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-outline"
                  style={{ fontSize: '0.75rem', padding: '7px 14px', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)', flexShrink: 0 }}
                >
                  📢 Broadcast Blind RFPs
                </button>
              </div>

            </div>

            {/* Footer */}
            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href="/Aarav_Diya_Proposal.pdf" 
                target="_blank" 
                rel="noreferrer"
                className="btn-royal-outline"
                style={{ fontSize: '0.75rem' }}
              >
                <Eye size={13} /> View Sample Proposal PDF
              </a>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="btn-royal-gold"
                style={{ fontSize: '0.78rem', padding: '8px 18px' }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
