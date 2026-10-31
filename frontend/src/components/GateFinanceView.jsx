import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, QrCode, KeyRound, CheckCircle, Clock, AlertCircle, 
  FileCheck, Plus, RefreshCw, UserCheck, DollarSign 
} from 'lucide-react';

export default function GateFinanceView({ weddingId }) {
  const [passes, setPasses] = useState([]);
  const [variations, setVariations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [countdown, setCountdown] = useState(60);
  const [selectedPass, setSelectedPass] = useState(null);
  const [gateInput, setGateInput] = useState('Palace Imperial Gate');
  const [hostPinInput, setHostPinInput] = useState('2026');
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [varForm, setVarForm] = useState({ description: '', quantity: 10, rate: 3200, pin: '2026', signedBy: 'Host Authorized Signatory' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPasses, resVars, resMiles] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/guest-passes`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/variations`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/milestones`)
      ]);
      const dataP = await resPasses.json();
      const dataV = await resVars.json();
      const dataM = await resMiles.json();
      setPasses(dataP);
      setVariations(dataV);
      setMilestones(dataM);
      if (dataP.length > 0 && !selectedPass) {
        setSelectedPass(dataP[0]);
      }
    } catch (err) {
      console.error("Gate & Finance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [weddingId]);

  // Rolling 60s countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerifyPass = async () => {
    if (!selectedPass) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/guest-passes/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pass_code: selectedPass.pass_code,
          gate: gateInput,
          host_pin: hostPinInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyMessage(data.message);
        fetchData();
        setTimeout(() => setVerifyMessage(null), 5000);
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (err) {
      console.error("Pass verification error:", err);
    }
  };

  const handleAddVariation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/variations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          item_description: varForm.description,
          quantity: parseInt(varForm.quantity),
          unit_rate: parseFloat(varForm.rate),
          host_pin: varForm.pin,
          counter_signed_by: varForm.signedBy
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowVariationModal(false);
        setVarForm({ description: '', quantity: 10, rate: 3200, pin: '2026', signedBy: 'Host Authorized Signatory' });
        fetchData();
      } else {
        alert(data.error || "Approval failed");
      }
    } catch (err) {
      console.error("Variation approve error:", err);
    }
  };

  const totalVariationsAmount = variations.reduce((acc, v) => acc + parseFloat(v.total_amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Phase 5 Security & Finance</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>60s Dynamic Tokens • Host PIN 2026</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Palace Gate Protocol & Live Variations Ledger
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Anti-duplicate dynamic QR guest check-in with real-time walk-in catering counter-signing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button onClick={() => setShowVariationModal(true)} className="btn-royal-gold">
            <Plus size={16} />
            <span>Sign New Variation</span>
          </button>
          <button onClick={fetchData} className="btn-royal-outline">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Row 1: Dynamic Rolling 60s Pass & Gate Check-In Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        
        {/* Dynamic Rolling Pass Visual Card */}
        <div className="glass-panel" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(13, 22, 48, 0.9) 0%, rgba(22, 38, 82, 0.8) 100%)',
          border: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Moving Anti-Screenshot Hologram Border */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, height: '4px',
            background: 'linear-gradient(90deg, #d4af37, #10b981, #e07a5f, #d4af37)',
            animation: 'liveBlink 2s infinite linear'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '14px' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>ANTI-SCREENSHOT PASS</span>
            <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Token Expires in {countdown}s
            </span>
          </div>

          {/* QR Code Container */}
          <div style={{
            width: '180px',
            height: '180px',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            marginBottom: '16px',
            position: 'relative'
          }}>
            {/* SVG QR Code Simulation */}
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <rect width="100" height="100" fill="white" />
              <rect x="10" y="10" width="25" height="25" fill="#0b132b" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="19" y="19" width="7" height="7" fill="#d4af37" />
              
              <rect x="65" y="10" width="25" height="25" fill="#0b132b" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="74" y="19" width="7" height="7" fill="#d4af37" />
              
              <rect x="10" y="65" width="25" height="25" fill="#0b132b" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="19" y="74" width="7" height="7" fill="#d4af37" />

              <circle cx="50" cy="50" r="10" fill="#0b132b" />
              <rect x="42" y="20" width="16" height="6" fill="#0b132b" />
              <rect x="42" y="74" width="16" height="6" fill="#0b132b" />
              <rect x="70" y="48" width="18" height="6" fill="#0b132b" />
              <rect x="15" y="48" width="18" height="6" fill="#0b132b" />
            </svg>
            <div style={{ position: 'absolute', bottom: '6px', fontSize: '0.6rem', color: '#0b132b', fontWeight: 800 }}>
              TOKEN-{(countdown * 17) % 9999}
            </div>
          </div>

          <h4 className="font-royal" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px' }}>
            {selectedPass?.guest_name || 'VIP Guest Pass'}
          </h4>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)', marginBottom: '8px' }}>
            {selectedPass?.pass_code} • {selectedPass?.category}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {selectedPass?.checked_in ? (
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                <CheckCircle size={12} /> CHECKED IN ({selectedPass.check_in_gate})
              </span>
            ) : (
              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                AWAITING PALACE GATE CHECK-IN
              </span>
            )}
          </div>
        </div>

        {/* Palace Gate Scanner & Verification Controls */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Palace Gate Scanner Verification
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
              Host Counter-Signature PIN: <strong style={{ color: 'var(--color-gold-light)' }}>2026</strong>
            </span>
          </div>

          {verifyMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: '#34d399',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} />
              <span>{verifyMessage}</span>
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                SELECT GUEST PASS
              </label>
              <select
                value={selectedPass?.pass_code || ''}
                onChange={(e) => {
                  const p = passes.find(item => item.pass_code === e.target.value);
                  if (p) setSelectedPass(p);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(5, 9, 20, 0.6)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '0.82rem'
                }}
              >
                {passes.map(p => (
                  <option key={p.pass_code} value={p.pass_code} style={{ background: '#0b132b' }}>
                    {p.guest_name} ({p.pass_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                PALACE GATE
              </label>
              <select
                value={gateInput}
                onChange={e => setGateInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(5, 9, 20, 0.6)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#fff',
                  fontSize: '0.82rem'
                }}
              >
                <option value="Palace Imperial Gate">Palace Imperial Gate</option>
                <option value="Palace North Service Gate">Palace North Gate</option>
                <option value="VVIP Chauffeur Porch">VVIP Chauffeur Porch</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                HOST OVERRIDE PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={hostPinInput}
                onChange={e => setHostPinInput(e.target.value)}
                placeholder="2026"
                style={{
                  width: '100%',
                  background: 'rgba(5, 9, 20, 0.6)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: 'var(--color-gold-light)',
                  fontWeight: 700,
                  fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          <button
            onClick={handleVerifyPass}
            className="btn-royal-gold"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            <ShieldCheck size={16} />
            <span>Scan QR & Verify Check-In at {gateInput}</span>
          </button>

          {/* Quick Passes List */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              RECENT PALACE GUEST ENTRIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {passes.map(p => (
                <div
                  key={p.pass_code}
                  onClick={() => setSelectedPass(p)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: selectedPass?.pass_code === p.pass_code ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255,255,255,0.03)',
                    border: selectedPass?.pass_code === p.pass_code ? '1px solid var(--color-gold)' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={14} color={p.checked_in ? '#34d399' : 'var(--color-text-dim)'} />
                    <span style={{ fontWeight: 600 }}>{p.guest_name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>• {p.category}</span>
                  </div>
                  <span className={`badge ${p.checked_in ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                    {p.checked_in ? 'Checked In' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Live Variations Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Live Variations Ledger (Host Counter-Signed)
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Instant digital sign-off with Host PIN 2026. Avoids post-wedding billing disputes by locking rates live.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL VARIATIONS COMMITTED</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-gold-light)' }} className="font-royal">
              ₹{(totalVariationsAmount / 100000).toFixed(2)} Lakhs
            </div>
          </div>
        </div>

        {/* Variations Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px' }}>CODE</th>
                <th style={{ padding: '12px 14px' }}>VARIATION DESCRIPTION</th>
                <th style={{ padding: '12px 14px' }}>QTY</th>
                <th style={{ padding: '12px 14px' }}>UNIT RATE</th>
                <th style={{ padding: '12px 14px' }}>TOTAL (INR)</th>
                <th style={{ padding: '12px 14px' }}>COUNTER-SIGNED BY</th>
                <th style={{ padding: '12px 14px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--color-gold)' }}>
                    {v.variation_code}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                    {v.item_description}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                    {v.quantity}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>
                    ₹{parseFloat(v.unit_rate).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                    ₹{parseFloat(v.total_amount).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--color-text-muted)' }}>
                    {v.counter_signed_by} (PIN: ****)
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                      ✓ {v.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variation Sign Modal */}
      {showVariationModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-panel" style={{ width: '480px', padding: '28px' }}>
            <h3 className="font-royal" style={{ margin: '0 0 16px', fontSize: '1.3rem' }}>
              Counter-Sign Live Variation
            </h3>
            <form onSubmit={handleAddVariation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  DESCRIPTION
                </label>
                <input
                  required
                  placeholder="e.g. 25 Additional Outstation VIP Suites"
                  value={varForm.description}
                  onChange={e => setVarForm({ ...varForm, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    QUANTITY
                  </label>
                  <input
                    type="number"
                    required
                    value={varForm.quantity}
                    onChange={e => setVarForm({ ...varForm, quantity: e.target.value })}
                    style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    UNIT RATE (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={varForm.rate}
                    onChange={e => setVarForm({ ...varForm, rate: e.target.value })}
                    style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  COUNTER-SIGNED BY
                </label>
                <input
                  required
                  value={varForm.signedBy}
                  onChange={e => setVarForm({ ...varForm, signedBy: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  HOST AUTHORIZATION PIN (Required: 2026)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={varForm.pin}
                  onChange={e => setVarForm({ ...varForm, pin: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-gold)', borderRadius: '6px', padding: '8px 12px', color: 'var(--color-gold-light)', fontWeight: 700, fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowVariationModal(false)} className="btn-royal-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-royal-gold">
                  Authorize & Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
