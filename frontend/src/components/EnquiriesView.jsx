import React, { useState, useEffect } from 'react';
import { 
  Users, QrCode, FileText, CheckCircle2, Send, ShieldAlert, Sparkles, 
  ArrowRight, RefreshCw, Eye, Download, Shield, Clock, Award, AlertCircle 
} from 'lucide-react';

export default function EnquiriesView() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/inquiries');
      const data = await res.json();
      setInquiries(data);
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
        if (selectedInquiry) {
          setSelectedInquiry(data.inquiry);
        }
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
        if (selectedInquiry) {
          setSelectedInquiry(data.inquiry);
        }
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
        if (selectedInquiry) {
          setSelectedInquiry(data.inquiry);
        }
      }
    } catch (err) {
      console.error("Broadcast RFP error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = filterStatus === 'ALL' 
    ? inquiries 
    : inquiries.filter(i => i.status === filterStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">CRM Lead Intake Layer</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Unified Telegram Bot (@Royalknot_bot) • n8n & Gemini</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            User Enquiries & One-Way Mirror Procurement Protocol
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Couple scans QR $\rightarrow$ 4-Step guided interview $\rightarrow$ Dashboard Action $\rightarrow$ Digital Signing $\rightarrow$ Blind Vendor RFQs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchInquiries} className="btn-royal-outline">
            <RefreshCw size={15} />
            <span>Sync Live Enquiries</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert Banner */}
      {actionSuccess && (
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
            <CheckCircle2 size={24} color="#34d399" />
            <div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                {actionSuccess.message}
              </div>
              {actionSuccess.ml_metrics && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-main)', marginTop: '2px' }}>
                  Confirmed: <strong>{actionSuccess.ml_metrics.confirmed_guests} Guests</strong> • 
                  ML Turnout: <strong style={{ color: 'var(--color-gold-light)' }}>{actionSuccess.ml_metrics.predicted_turnout}</strong> • 
                  Plate Buffer: <strong style={{ color: '#34d399' }}>{actionSuccess.ml_metrics.plate_buffer} Plates</strong> • 
                  Booking Advance (30%): <strong>₹{(actionSuccess.ml_metrics.advance_due/100000).toFixed(1)} Lakhs</strong>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a 
              href="/Aarav_Diya_Proposal.pdf" 
              target="_blank" 
              rel="noreferrer"
              className="btn-royal-gold" 
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Download size={13} /> View Proposal PDF
            </a>
            <button onClick={() => setActionSuccess(null)} className="btn-royal-outline" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Scannable QR Codes Panel (scan.png & vendor_scan.png) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Client QR Box */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(13, 22, 48, 0.85) 0%, rgba(22, 38, 82, 0.7) 100%)'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            flexShrink: 0
          }}>
            <img 
              src="/scan.png" 
              alt="Scan for Client Enquiry" 
              style={{ width: '130px', height: '170px', objectFit: 'contain', display: 'block' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>CLIENT QR SCANNER</span>
              <span style={{ fontSize: '0.75rem', color: '#34d399' }}>● scan.png</span>
            </div>
            <h3 className="font-royal" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>
              Couple Royal Wedding Enquiry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
              Couples scan <code>scan.png</code> with any smartphone camera to launch the <strong>Unified Bot (@Royalknot_bot)</strong>. 
              The bot conducts the structured <strong>4-Step Guided Interview</strong> with zero-assumption Gemini parsing.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a 
                href="https://t.me/Royalknot_bot?start=client_enquiry" 
                target="_blank" 
                rel="noreferrer"
                className="btn-royal-gold" 
                style={{ fontSize: '0.75rem', padding: '6px 14px' }}
              >
                Open Bot Directly (Client)
              </a>
              <a href="/scan.png" download="scan.png" className="btn-royal-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                <Download size={13} /> Download scan.png
              </a>
            </div>
          </div>
        </div>

        {/* Vendor QR Box (One-Way Mirror) */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(22, 38, 82, 0.85) 0%, rgba(13, 22, 48, 0.7) 100%)'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            flexShrink: 0
          }}>
            <img 
              src="/vendor_scan.png" 
              alt="Scan for Vendor One-Way Mirror" 
              style={{ width: '130px', height: '170px', objectFit: 'contain', display: 'block' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-sapphire" style={{ fontSize: '0.68rem' }}>VENDOR GROUP QR</span>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>● vendor_scan.png</span>
            </div>
            <h3 className="font-royal" style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>
              One-Way Mirror Blind Procurement
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
              Vendors scan <code>vendor_scan.png</code> to enter the group. Vendors <strong>do not know each other</strong> and cannot view other bids. 
              Only the <strong>Platform Admin</strong> receives all confidential quotes!
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a 
                href="https://t.me/Royalknot_bot?start=vendor_portal" 
                target="_blank" 
                rel="noreferrer"
                className="btn-royal-outline" 
                style={{ fontSize: '0.75rem', padding: '6px 14px', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)' }}
              >
                Open Vendor RFQ Portal
              </a>
              <a href="/vendor_scan.png" download="vendor_scan.png" className="btn-royal-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                <Download size={13} /> Download Barcode
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Live Enquiries List & Take Action Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Live Inquiries Intake Queue (Unified Bot)
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Enquiries captured via @Royalknot_bot 4-step interview with zero-assumption extraction.
            </p>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'new', 'proposal_sent', 'signed', 'rfp_broadcast'].map(st => (
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
                <th style={{ padding: '12px 14px' }}>TELEGRAM ID</th>
                <th style={{ padding: '12px 14px' }}>DESTINATION</th>
                <th style={{ padding: '12px 14px' }}>GUESTS</th>
                <th style={{ padding: '12px 14px' }}>BUDGET (INR)</th>
                <th style={{ padding: '12px 14px' }}>SENTIMENT</th>
                <th style={{ padding: '12px 14px' }}>STATUS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inq) => {
                const budgetCr = inq.budget_inr ? `₹${(inq.budget_inr / 10000000).toFixed(2)} Cr` : 'Pending';
                const isSigned = inq.status === 'signed' || inq.status === 'rfp_broadcast';
                const isPropSent = inq.status === 'proposal_sent';

                return (
                  <tr 
                    key={inq.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px', fontWeight: 800, color: 'var(--color-gold)', fontFamily: 'monospace' }}>
                      INQ-{inq.id.toString().padStart(4, '0')}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700 }}>
                      <div>{inq.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', fontWeight: 400 }}>
                        {inq.phone || '+91 98290 11223'}
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: '#60a5fa', fontFamily: 'monospace' }}>
                      {inq.telegram_id || '@client'}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                      {inq.preferred_city} ({inq.duration_days || 3} Days)
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace' }}>
                      {inq.guest_count} Confirmed
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                      {budgetCr}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>
                        {((inq.sentiment_score || 0.95) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${
                        isSigned ? 'badge-emerald' : 
                        isPropSent ? 'badge-sapphire' : 'badge-amber'
                      }`} style={{ fontSize: '0.68rem' }}>
                        {inq.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="btn-royal-gold"
                        style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      >
                        Take Action <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Drawer Modal */}
      {selectedInquiry && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{
            width: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginBottom: '6px' }}>
                  ACTION PROTOCOL: INQ-{selectedInquiry.id.toString().padStart(4, '0')}
                </span>
                <h3 className="font-royal" style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800 }}>
                  {selectedInquiry.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {selectedInquiry.preferred_city} • {selectedInquiry.duration_days || 3} Days • Telegram: {selectedInquiry.telegram_id}
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

            {/* ML Calculations Preview */}
            <div style={{
              background: 'rgba(5, 9, 20, 0.7)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} /> ML BUFFER PREVIEW & MILESTONE SETTLEMENT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>CONFIRMED GUESTS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedInquiry.guest_count}</div>
                </div>
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-gold)' }}>ML TURNOUT BUFFER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-gold-light)' }}>
                    {Math.round((selectedInquiry.guest_count || 400) * 1.17)} (+17%)
                  </div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#34d399' }}>SHAHI BUFFET PLATES</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                    {Math.round((selectedInquiry.guest_count || 400) * 1.31)} Plates
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                Milestone 1 Advance (30%): <strong style={{ color: 'var(--color-gold-light)' }}>₹{((selectedInquiry.budget_inr || 25000000) * 0.30 / 100000).toFixed(1)} Lakhs</strong> (Held to reserve palace dates)
              </div>
            </div>

            {/* 3 Step Action Execution Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Action 1: Compile PDF Proposal & Send to Client Bot */}
              <div style={{ background: 'rgba(22, 38, 82, 0.4)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                    1. Compile Luxury Proposal PDF & Dispatch to Bot
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Runs ReportLab engine, formats 18 categories, and sends confirmation prompt to client.
                  </div>
                </div>
                <button
                  onClick={() => handleTakeAction(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-gold"
                  style={{ fontSize: '0.78rem', padding: '8px 16px', flexShrink: 0 }}
                >
                  {actionLoading ? 'Compiling...' : '⚡ Take Action (Generate PDF)'}
                </button>
              </div>

              {/* Action 2: Digital Counter-Signature & Advance Confirmation */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#34d399' }}>
                    2. Confirm Digital Signing & Advance Paid
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Stamps client counter-signature, marks booking confirmed, locks palace date.
                  </div>
                </div>
                <button
                  onClick={() => handleConfirmSigning(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-outline"
                  style={{ fontSize: '0.78rem', padding: '8px 16px', color: '#34d399', borderColor: 'rgba(16,185,129,0.4)', flexShrink: 0 }}
                >
                  ✍️ Confirm Signed
                </button>
              </div>

              {/* Action 3: Release to One-Way Mirror Vendor Group */}
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#60a5fa' }}>
                    3. Release RFQs to One-Way Mirror Vendor Group
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Distributes blind RFPs. Competing vendors cannot view each other's quotes; platform receives all bids.
                  </div>
                </div>
                <button
                  onClick={() => handleBroadcastRFP(selectedInquiry.id)}
                  disabled={actionLoading}
                  className="btn-royal-outline"
                  style={{ fontSize: '0.78rem', padding: '8px 16px', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.4)', flexShrink: 0 }}
                >
                  📢 Broadcast Blind RFPs
                </button>
              </div>

            </div>

            {/* Footer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a 
                href="/Aarav_Diya_Proposal.pdf" 
                target="_blank" 
                rel="noreferrer"
                className="btn-royal-outline"
                style={{ fontSize: '0.78rem' }}
              >
                <Eye size={13} /> Preview Proposal PDF
              </a>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="btn-royal-gold"
                style={{ fontSize: '0.78rem', padding: '8px 16px' }}
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
