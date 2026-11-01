import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Send, ArrowRight, RefreshCw, Eye, Shield, Clock, 
  TrendingUp, AlertTriangle, UserCheck, MessageSquare, Flame, Sparkles
} from 'lucide-react';

export default function EnquiriesView() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatingRecovery, setSimulatingRecovery] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/leads/conversion-overview');
      const data = await res.json();
      setInquiries(data);
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
    const interval = setInterval(fetchInquiries, 10000);
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
            ? `72-hour threshold reached. Lead #${inquiryId} automatically reassigned to ${data.assigned_planner}.`
            : hours >= 48 
            ? `48-hour threshold reached. Lead #${inquiryId} flagged as At Risk of Loss. Bespoke venue follow-up drafted.`
            : `Lead #${inquiryId} reset to healthy status (0 hours elapsed).`
        });
        fetchInquiries();
      }
    } catch (err) {
      console.error("Simulate recovery error:", err);
    } finally {
      setSimulatingRecovery(false);
    }
  };

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
          message: `Venue follow-up successfully sent to client. Lead status updated to Recovered.`
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

  const atRiskLeads = inquiries.filter(i => i.risk_status === 'at_risk' || (i.hours_since_last_response >= 48 && i.risk_status !== 'recovered'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 48H AT-RISK LOSS ALERT BANNER (No Emojis) */}
      {atRiskLeads.length > 0 && (
        <div style={{
          padding: '16px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              flexShrink: 0
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span className="badge badge-ruby">
                  LEAD RECOVERY ALERT
                </span>
                <span style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
                  48-Hour Inaction Detected
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>
                High-Value Lead: {atRiskLeads[0].name} (₹{(atRiskLeads[0].budget_inr / 10000000).toFixed(2)} Cr, {atRiskLeads[0].preferred_city}) has received no planner response for {atRiskLeads[0].hours_since_last_response || 48} hours.
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                ML Conversion Likelihood: <strong>{atRiskLeads[0].conversion_score}%</strong>. Bespoke venue follow-up has been drafted for Rambagh Palace.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => handleSendFollowup(atRiskLeads[0].id)}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 16px', background: '#dc2626', borderColor: '#dc2626' }}
            >
              <Send size={13} /> Send Follow-Up
            </button>
            <button
              onClick={() => setSelectedInquiry(atRiskLeads[0])}
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            >
              Inspect Lead
            </button>
          </div>
        </div>
      )}

      {/* Action Notification */}
      {actionSuccess && (
        <div style={{
          padding: '12px 18px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '10px',
          color: '#065f46',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#059669" />
            <span>{actionSuccess.message}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontSize: '1rem' }}></button>
        </div>
      )}

      {/* 4 ML Conversion & SLA Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            AVERAGE CONVERSION LIKELIHOOD
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            91.2%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Priority 1 Tier (High-Value Leads)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            SPEND PER GUEST RATIO
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            ₹57,143 <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>/ guest</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Ultra-Luxury Benchmark (₹50k+)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            SEASON FACTOR
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            95 / 100
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Peak Winter Season (Nov - Feb)
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            SLA RECOVERY GUARD
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '4px' }}>
            48h / 72h
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            48h Inaction Flag • 72h Reassignment
          </div>
        </div>

      </div>

      {/* Analytical Visualisations: Pipeline Stage Distribution & Destination City Spread */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        {/* Chart A: Lead Stage Distribution */}
        <div className="stocksense-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Lead Pipeline Distribution
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#71717a', margin: '2px 0 0' }}>
                Progression across intake, proposal review, and signed contracts
              </p>
            </div>
            <span className="badge-sku" style={{ fontSize: '0.68rem' }}>16 Inquiries</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'New Inquiries', count: 5, pct: 31, color: '#4f46e5' },
              { label: 'Proposals Dispatched', count: 4, pct: 25, color: '#6366f1' },
              { label: 'RFP Broadcast Active', count: 4, pct: 25, color: '#818cf8' },
              { label: 'Signed Contracts', count: 3, pct: 19, color: '#10b981' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: '#27272a', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: '#18181b', fontWeight: 700 }}>{item.count} Leads ({item.pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f4f4f5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct * 2.5}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart B: Preferred Destination Cities */}
        <div className="stocksense-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                  Destination Geography
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#71717a', margin: '2px 0 0' }}>
                  Client inquiries by Rajasthan heritage destination
                </p>
              </div>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.68rem' }}>Palace Network</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Jaipur</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>7 Leads</div>
                <div style={{ fontSize: '0.66rem', color: '#4f46e5', marginTop: '2px' }}>₹3.2 Cr avg budget</div>
              </div>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Udaipur</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>6 Leads</div>
                <div style={{ fontSize: '0.66rem', color: '#4f46e5', marginTop: '2px' }}>₹3.8 Cr avg budget</div>
              </div>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Jodhpur</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>2 Leads</div>
                <div style={{ fontSize: '0.66rem', color: '#4f46e5', marginTop: '2px' }}>₹4.2 Cr avg budget</div>
              </div>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Jaisalmer</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>1 Lead</div>
                <div style={{ fontSize: '0.66rem', color: '#4f46e5', marginTop: '2px' }}>₹3.8 Cr avg budget</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: '#71717a' }}>Total Inquired Portfolio:</span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>₹56.8 Cr Total Demand</span>
          </div>
        </div>
      </div>

      {/* Main Table: User Enquiries & ML Prediction */}
      <div className="saas-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Enquiries & Lead Conversion Ledger
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Live intake from Telegram @Royalknot_bot with ML budget-to-guest evaluation and 48-hour recovery guard.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'new', 'proposal_sent', 'signed', 'rfp_broadcast'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: filterStatus === st ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: filterStatus === st ? '#4f46e5' : '#ffffff',
                  color: filterStatus === st ? '#ffffff' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontFamily: 'inherit'
                }}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>INQUIRY REF</th>
                <th>CLIENT / CONTACT</th>
                <th>DESTINATION & GUESTS</th>
                <th>BUDGET</th>
                <th>ML CONVERSION (0-100%)</th>
                <th>RECOVERY STATUS</th>
                <th>ASSIGNED PLANNER</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
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
                      background: isAtRisk ? '#fef2f2' : isReassigned ? '#faf5ff' : 'transparent',
                      transition: 'background 0.15s'
                    }}
                  >
                    <td style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>
                      INQ-{inq.id.toString().padStart(4, '0')}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{inq.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {inq.phone || '+91 97722 33445'} • {inq.telegram_id || '@client'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>
                        {inq.preferred_city} ({inq.duration_days || 3} Days)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {inq.guest_count} Confirmed Guests
                      </div>
                    </td>

                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                      {budgetCr}
                      <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                        ₹{Math.round((inq.budget_inr || 20000000) / (inq.guest_count || 350)).toLocaleString('en-IN')}/guest
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: score >= 80 ? '#059669' : '#4f46e5' }}>
                          {score.toFixed(1)}%
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {inq.conversion_tier || 'Very High'}
                        </span>
                      </div>
                      <div style={{ width: '90px', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: '#10b981' }} />
                      </div>
                    </td>

                    <td>
                      {isReassigned ? (
                        <span className="badge badge-ruby" style={{ background: '#faf5ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                          72h Reassigned
                        </span>
                      ) : isAtRisk ? (
                        <span className="badge badge-ruby">
                          At Risk of Loss (48h)
                        </span>
                      ) : (
                        <span className="badge badge-emerald">
                          Healthy (&lt;48h)
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.78rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {inq.assigned_planner || 'Welcome (Lead Planner)'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Backup: {inq.backup_planner ? 'Digvijay S.' : 'Digvijay S. Rathore'}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        isSigned ? 'badge-emerald' : 
                        isPropSent ? 'badge-primary' : 'badge-amber'
                      }`}>
                        {inq.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        Details & SLA <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail & Action Drawer (Clean Light SaaS Modal) */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-elevated)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-primary">
                    INQUIRY #{selectedInquiry.id.toString().padStart(4, '0')}
                  </span>
                  {selectedInquiry.risk_status === 'at_risk' && (
                    <span className="badge badge-ruby">
                      AT RISK OF LOSS (48H SLA)
                    </span>
                  )}
                  {selectedInquiry.risk_status === 'reassigned' && (
                    <span className="badge" style={{ background: '#faf5ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                      REASSIGNED (72H SLA)
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedInquiry.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedInquiry.preferred_city} • {selectedInquiry.duration_days || 3} Days • Assigned: <strong>{selectedInquiry.assigned_planner || 'Welcome (Lead Planner)'}</strong>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInquiry(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', fontSize: '1rem' }}
              >
                
              </button>
            </div>

            {/* 1. ML Lead Conversion Scoring Parameters */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>ML Conversion Likelihood Model</span>
                <span style={{ color: '#4f46e5', fontWeight: 800 }}>
                  {parseFloat(selectedInquiry.conversion_score || 91.2).toFixed(1)}% Likelihood
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>BUDGET / GUEST</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>90.0</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>₹57.1k/guest</div>
                </div>

                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>WINTER SEASON</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>95.0</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Nov - Feb Peak</div>
                </div>

                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>VENUE TIER</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>92.0</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Heritage Palace</div>
                </div>

                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>SENTIMENT</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>88.0</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>High Delight</div>
                </div>
              </div>
            </div>

            {/* 2. STANDOUT FEATURE: LEAD RECOVERY INTELLIGENCE */}
            <div style={{
              background: '#f8fafc',
              border: selectedInquiry.risk_status === 'at_risk' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedInquiry.risk_status === 'at_risk' ? '#dc2626' : '#0f172a' }}>
                  Lead Recovery Intelligence Console
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Inactivity Clock: <strong>{selectedInquiry.hours_since_last_response || 0} Hours Elapsed</strong>
                </span>
              </div>

              {/* Venue-Customized Follow-Up Draft */}
              <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#4f46e5', fontWeight: 600, marginBottom: '6px' }}>
                  Suggested Follow-Up Message (Customized to {selectedInquiry.preferred_city === 'Jaipur' ? 'Rambagh Palace' : 'Jagmandir Island'}):
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                  "{selectedInquiry.follow_up_draft || `Padharo Sa ${selectedInquiry.name},\nWe are actively holding prime heritage pavilion dates for your 3-day wedding celebration at Rambagh Palace, Jaipur. Our Executive Banqueting Chef has pre-calculated a 524-plate tasting menu. Given high winter season demand in Jaipur, shall we confirm your palace date lock today?`}"
                </p>
              </div>

              {/* Action & Simulation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => handleSendFollowup(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                >
                  <Send size={13} /> {actionLoading ? 'Dispatching...' : 'Send Follow-Up to Telegram'}
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 48)}
                    disabled={simulatingRecovery}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '6px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Simulate 48h (Trigger Risk)
                  </button>

                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 72)}
                    disabled={simulatingRecovery}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '6px 10px', color: '#7c3aed', borderColor: '#ddd6fe' }}
                  >
                    Simulate 72h (Auto-Reassign)
                  </button>

                  <button
                    onClick={() => handleSimulateRecovery(selectedInquiry.id, 0)}
                    disabled={simulatingRecovery}
                    className="btn-outline"
                    style={{ fontSize: '0.72rem', padding: '6px 10px' }}
                  >
                    Reset (0h)
                  </button>
                </div>
              </div>
            </div>

            {/* 3. CRM Workflow Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>1. Generate Luxury Proposal PDF</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Compiles 18 categories and delivers proposal via Telegram.</div>
                </div>
                <button
                  onClick={() => handleTakeAction(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  {actionLoading ? 'Generating...' : 'Generate PDF'}
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>2. Confirm Counter-Signature</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Locks booking dates and confirms 30% advance deposit.</div>
                </div>
                <button
                  onClick={() => handleConfirmSigning(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Confirm Signed
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>3. Broadcast Blind RFPs to Vendors</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Releases One-Way Mirror RFQ to vendor network.</div>
                </div>
                <button
                  onClick={() => handleBroadcastRFP(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-outline"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  Broadcast RFPs
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href="/Aarav_Diya_Proposal.pdf" 
                target="_blank" 
                rel="noreferrer"
                className="btn-outline"
                style={{ fontSize: '0.75rem' }}
              >
                <Eye size={13} /> View Proposal PDF
              </a>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '6px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
