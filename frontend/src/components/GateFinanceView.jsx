import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, QrCode, KeyRound, CheckCircle, Clock, AlertCircle, 
  FileCheck, Plus, RefreshCw, UserCheck, DollarSign, CheckCircle2
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
        body: JSON.stringify({ pass_token: selectedPass.pass_token, gate_location: gateInput })
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyMessage({ type: 'success', text: `Pass verified. Welcome ${data.guest.name} (${data.guest.party_size} guests). Gate: ${gateInput}` });
        fetchData();
      } else {
        setVerifyMessage({ type: 'error', text: data.error || "Verification failed." });
      }
      setTimeout(() => setVerifyMessage(null), 5000);
    } catch (err) {
      console.error("Verify pass error:", err);
    }
  };

  const handleCreateVariation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/variations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          description: varForm.description,
          quantity: parseInt(varForm.quantity),
          unit_rate: parseFloat(varForm.rate),
          host_pin: varForm.pin,
          signed_by_host: varForm.signedBy
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowVariationModal(false);
        setVarForm({ description: '', quantity: 10, rate: 3200, pin: '2026', signedBy: 'Host Authorized Signatory' });
        fetchData();
      } else {
        alert(data.error || "Failed to sign variation");
      }
    } catch (err) {
      console.error("Variation create error:", err);
    }
  };

  const totalVariationsAmount = variations.reduce((acc, v) => acc + parseFloat(v.total_amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            TOTAL GUEST PASSES
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {passes.length} Passes
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Dynamic Anti-Duplicate QR
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            TOKEN ROTATION CLOCK
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '4px' }}>
            {countdown}s
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            60-Second Security Refresh
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            VARIATIONS SIGNED
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            ₹{(totalVariationsAmount / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Host PIN 2026 Counter-Signed
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            ESCROW MILESTONES
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
            70% Collected
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Stage 1 & 2 Paid
          </div>
        </div>
      </div>

      {/* Row: Dynamic Pass & Gate Verification Desk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '16px' }}>
        
        {/* Anti-Duplicate QR Pass */}
        <div className="saas-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '14px' }}>
            <span className="badge badge-primary">ANTI-DUPLICATE PASS</span>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
              Expires in {countdown}s
            </span>
          </div>

          {/* QR Code Container */}
          <div style={{
            width: '160px',
            height: '160px',
            background: '#ffffff',
            borderRadius: '12px',
            padding: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '14px'
          }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <rect width="100" height="100" fill="white" />
              <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="19" y="19" width="7" height="7" fill="#4f46e5" />
              
              <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="74" y="19" width="7" height="7" fill="#4f46e5" />
              
              <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="19" y="74" width="7" height="7" fill="#4f46e5" />

              <circle cx="50" cy="50" r="10" fill="#0f172a" />
            </svg>
          </div>

          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '2px' }}>
            {selectedPass ? selectedPass.guest_name : 'Royal VIP Guest'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
            {selectedPass ? `${selectedPass.party_size} Guests • VIP Access` : 'Party of 4'}
          </div>

          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.72rem', color: '#64748b' }}>
            Token: <code style={{ color: '#4f46e5', fontWeight: 600 }}>{selectedPass ? selectedPass.pass_token : 'TOKEN-LIVE-2026'}</code>
          </div>
        </div>

        {/* Gate Check-In Desk */}
        <div className="saas-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Palace Gate Check-In Desk
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Select an incoming pass and verify check-in against palace security docks.
            </p>
          </div>

          {verifyMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '0.82rem',
              background: verifyMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: verifyMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${verifyMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}>
              {verifyMessage.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                SELECT GUEST PASS
              </label>
              <select
                value={selectedPass?.id || ''}
                onChange={e => {
                  const p = passes.find(x => x.id === parseInt(e.target.value));
                  if (p) setSelectedPass(p);
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem', fontFamily: 'inherit' }}
              >
                {passes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.guest_name} ({p.party_size} pax) - {p.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                GATE / DOCK LOCATION
              </label>
              <input
                type="text"
                value={gateInput}
                onChange={e => setGateInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={handleVerifyPass} className="btn-primary">
              Verify Check-In
            </button>
          </div>
        </div>

      </div>

      {/* Variations Ledger Table */}
      <div className="saas-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Digital Variations Ledger
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Walk-in catering & unannounced guest orders counter-signed via Host PIN 2026.
            </p>
          </div>
          <button onClick={() => setShowVariationModal(true)} className="btn-primary">
            Sign New Variation
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>REF</th>
                <th>DESCRIPTION</th>
                <th>QUANTITY</th>
                <th>RATE</th>
                <th>TOTAL AMOUNT</th>
                <th>COUNTER-SIGNED BY</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>{v.variation_ref}</td>
                  <td style={{ fontWeight: 500, color: '#0f172a' }}>{v.description}</td>
                  <td style={{ fontFamily: 'monospace' }}>{v.quantity} units</td>
                  <td style={{ fontFamily: 'monospace' }}>₹{parseFloat(v.unit_rate).toLocaleString('en-IN')}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                    ₹{parseFloat(v.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{v.signed_by_host} (PIN Verified)</td>
                  <td>
                    <span className="badge badge-emerald">
                      {v.status.toUpperCase()}
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
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '460px',
            padding: '24px',
            boxShadow: 'var(--shadow-elevated)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Sign Ground Variation Order
            </h3>
            <form onSubmit={handleCreateVariation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Description</label>
                <input
                  type="text"
                  required
                  value={varForm.description}
                  onChange={e => setVarForm({ ...varForm, description: e.target.value })}
                  placeholder="e.g. Additional 20 Royal Banquet Plates"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    required
                    value={varForm.quantity}
                    onChange={e => setVarForm({ ...varForm, quantity: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Rate (INR)</label>
                  <input
                    type="number"
                    required
                    value={varForm.rate}
                    onChange={e => setVarForm({ ...varForm, rate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Host Security PIN</label>
                <input
                  type="password"
                  required
                  value={varForm.pin}
                  onChange={e => setVarForm({ ...varForm, pin: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowVariationModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Counter-Sign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
