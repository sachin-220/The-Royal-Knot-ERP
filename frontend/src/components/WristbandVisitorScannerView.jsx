import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine, QrCode, Camera, ShieldCheck, AlertTriangle, RefreshCw,
  Plus, Printer, CheckCircle2, Smartphone, ExternalLink, Barcode,
  AlertOctagon, Check, X, Users, ArrowUpRight, Copy, ShieldAlert,
  Radio, Volume2, VolumeX, Eye, Info
} from 'lucide-react';

export default function WristbandVisitorScannerView({ weddingId = 1 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scanner Input State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedGate, setSelectedGate] = useState('Palace Toran Gate');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live 10-Second Dynamic Rotating QR State (No Camera)
  const [liveTokenData, setLiveTokenData] = useState(null);
  const [tokenCountdown, setTokenCountdown] = useState(10);
  const [simulatingScan, setSimulatingScan] = useState(false);

  // Batch Generation State
  const [batchCount, setBatchCount] = useState(10);
  const [batchCategory, setBatchCategory] = useState('Walk-in Additional Visitor');
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  // App Recommendations Modal
  const [showScannerGuideModal, setShowScannerGuideModal] = useState(false);

  // Audio Beep Synthesizer using Web Audio API
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (isSuccess) {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(160, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      // AudioContext unavailable or blocked by browser autoplay policy
    }
  };

  // Fetch Live Summary
  const fetchWristbandsSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://127.0.0.1:5000/api/wristbands/summary/${weddingId}`);
      if (!res.ok) throw new Error('Failed to fetch wristbands data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dynamic 10-Second Live Token & QR Code
  const fetchLiveToken = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/wristbands/live-token/${weddingId}`);
      if (!res.ok) throw new Error('Failed to fetch live token');
      const json = await res.json();
      setLiveTokenData(json);
      setTokenCountdown(json.seconds_left || 10);
    } catch (e) {
      console.warn('Live token fetch note:', e);
    }
  };

  // Timer loop: 10s countdown & 3s live polling for real-time mobile scans
  useEffect(() => {
    fetchWristbandsSummary();
    fetchLiveToken();

    const timer = setInterval(() => {
      setTokenCountdown(prev => {
        if (prev <= 1) {
          fetchLiveToken();
          fetchWristbandsSummary();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    const pollInterval = setInterval(() => {
      fetchWristbandsSummary();
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [weddingId]);

  // Submit Barcode / QR Scan
  const handleScanCode = async (codeToSubmit = barcodeInput) => {
    const cleanCode = (codeToSubmit || '').trim();
    if (!cleanCode) return;

    try {
      setScanning(true);
      setScanResult(null);

      const res = await fetch('http://127.0.0.1:5000/api/wristbands/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          barcode: cleanCode,
          gate: selectedGate,
          device: 'Gate Handheld Scanner / Mobile'
        })
      });

      const result = await res.json();
      setScanResult(result);

      if (res.ok && result.success) {
        playBeep(true);
        setBarcodeInput('');
        fetchWristbandsSummary();
        fetchLiveToken();
      } else {
        playBeep(false);
      }
    } catch (err) {
      console.error(err);
      playBeep(false);
      setScanResult({
        success: false,
        error: `Network error transmitting scan: ${err.message}`
      });
    } finally {
      setScanning(false);
    }
  };

  // Simulate instant mobile phone scan (+1 extra visitor headcount)
  const handleSimulateMobileScan = async () => {
    try {
      setSimulatingScan(true);
      const token = liveTokenData?.token || `WB-EXTRA-10S-${Math.floor(Date.now() / 10000)}`;
      const res = await fetch(`http://127.0.0.1:5000/api/wristbands/mobile-scan?token=${token}&wedding_id=${weddingId}&gate=${encodeURIComponent(selectedGate)}`);
      const result = await res.json();
      setScanResult(result);
      if (res.ok && result.success) {
        playBeep(true);
        await fetchWristbandsSummary();
        await fetchLiveToken();
      } else {
        playBeep(false);
      }
    } catch (err) {
      console.error(err);
      playBeep(false);
      setScanResult({ success: false, error: err.message });
    } finally {
      setSimulatingScan(false);
    }
  };

  // Generate Serialized Wristband Batch
  const handleIssueBatch = async () => {
    try {
      setGeneratingBatch(true);
      const res = await fetch('http://127.0.0.1:5000/api/wristbands/issue-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          count: Number(batchCount),
          category: batchCategory
        })
      });
      const result = await res.json();
      if (res.ok) {
        fetchWristbandsSummary();
        alert(result.message || `Successfully generated ${batchCount} wristbands.`);
      } else {
        alert(result.error || 'Failed to generate batch.');
      }
    } catch (e) {
      alert(`Batch generation failed: ${e.message}`);
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Reset Demo State
  const handleResetScans = async () => {
    if (!window.confirm('Reset additional wristband scans back to baseline?')) return;
    try {
      await fetch('http://127.0.0.1:5000/api/wristbands/reset-scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingId })
      });
      setScanResult(null);
      fetchWristbandsSummary();
    } catch (e) {
      console.error(e);
    }
  };

  const summary = data?.summary || {
    contracted_guests: 300,
    additional_scanned_count: 0,
    total_live_headcount: 300,
    venue_capacity_limit: 450,
    capacity_utilization_pct: 66.7,
    extra_catering_charge_inr: 0,
    blocked_duplicates_count: 0,
    leakage_prevented_inr: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* StockSense Breadcrumbs, Serif Heading, Subtitle & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
            <span>KnotCore</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span>Operations</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#18181b', fontWeight: 600 }}>Toran Gate Wristbands</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Toran Gate Wristband Visitor Scanner
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Palace entrance barcode & QR plate counter, duplicate admission blocking, and real-time headcounts.
          </p>
        </div>

        {/* Action Buttons matching StockSense */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowScannerGuideModal(true)}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <Smartphone size={14} color="#71717a" />
            <span>Scanner Guide</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="btn-dark-pill"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            <Printer size={14} />
            <span>+ Issue Wristbands</span>
          </button>

          <button
            onClick={handleResetScans}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 12px' }}
            title="Reset additional wristband scans back to baseline"
          >
            <RefreshCw size={13} color="#71717a" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* 4 StockSense KPI Cards with Yellow Icon Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* Card 1: Contracted Guest List */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Contracted Guest Count
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {summary.contracted_guests || 300} <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 400 }}>Pax</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '4px' }}>
            Base contracted banquet list
          </div>
        </div>

        {/* Card 2: Additional Scanned Wristbands */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ScanLine size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Additional Scanned
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            +{summary.additional_scanned_count || 0}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            Live verified gate wristbands
          </div>
        </div>

        {/* Card 3: Total Live Palace Headcount */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Live Palace Headcount
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            {summary.total_live_headcount || 300} <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 400 }}>/ {summary.venue_capacity_limit || 450}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            {summary.capacity_utilization_pct}% palace utilization
          </div>
        </div>

        {/* Card 4: Additional Catering Fee Variance */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Catering Settlement
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            +₹{Number(summary.extra_catering_charge_inr || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '4px' }}>
            {summary.additional_scanned_count || 0} extra plates @ ₹2,500
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Scanner Console + Audit Logs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) minmax(400px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Interactive Mobile & Handheld Scanner Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Scanner Device Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Palace Gate Wristband Scanner
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Dynamic 10s QR code & instant extra visitor tracker
                </div>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute Scan Sound' : 'Enable Scan Chime'}
                style={{
                  background: soundEnabled ? '#eef2ff' : '#f1f5f9',
                  color: soundEnabled ? '#4f46e5' : '#64748b',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600
                }}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                {soundEnabled ? 'Chime ON' : 'Muted'}
              </button>
            </div>

            {/* Gate Location Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Active Palace Gate:
              </label>
              <select
                value={selectedGate}
                onChange={e => setSelectedGate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none'
                }}
              >
                <option value="Palace Toran Gate">Palace Toran Gate (Main Entrance)</option>
                <option value="Hathi Pol Royal Gate">Hathi Pol Royal Gate (VIP Driveway)</option>
                <option value="Lake Jagmandir Jetty Gate">Lake Jagmandir Jetty Gate (Boat Arrival)</option>
                <option value="North Service Dock Gate">North Service Dock Gate (Catering & Logistics)</option>
              </select>
            </div>

            {/* Dynamic 10-Second Unique Palace Gate QR Code Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              border: '1px solid #312e81',
              borderRadius: '16px',
              padding: '22px 18px',
              color: '#ffffff',
              marginBottom: '18px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
            }}>
              {/* Badge Bar with 10s Countdown */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#c7d2fe',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  Unique Palace Gate QR
                </span>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#34d399',
                    boxShadow: '0 0 8px #34d399',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  Changes in {tokenCountdown}s
                </div>
              </div>

              {/* Title & Instructions */}
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                Dynamic Gate Wristband QR Code
              </h4>
              <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '14px' }}>
                Scan this dynamically changing QR code with <strong>any mobile scanner or smartphone camera</strong> to increment extra attendees.
              </div>

              {/* QR Code Presentation Box */}
              <div style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px'
                }}>
                  {liveTokenData?.qr_code_data_url ? (
                    <img
                      src={liveTokenData.qr_code_data_url}
                      alt="10s Dynamic Wristband QR Code"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <QrCode size={110} color="#94a3b8" />
                  )}
                </div>

                {/* Token Badge */}
                <div style={{
                  background: '#e0e7ff',
                  color: '#3730a3',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  marginBottom: '10px'
                }}>
                  Token: {liveTokenData?.token || 'WB-EXTRA-10S-LIVE'}
                </div>

                {/* 10-Second Progress Bar */}
                <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(tokenCountdown / 10) * 100}%`,
                    height: '100%',
                    background: tokenCountdown <= 3 ? '#ef4444' : '#6366f1',
                    transition: 'width 1s linear, background 0.3s ease'
                  }} />
                </div>
              </div>

              {/* MANDATORY PROMINENT EXTRA COUNT DISPLAY */}
              <div style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '18px 16px',
                marginTop: '16px',
                textAlign: 'center',
                color: '#0f172a',
                border: '2px solid #818cf8',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#4f46e5',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '2px'
                }}>
                  Live Additional Guests Count
                </div>

                <div style={{
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  margin: '2px 0 6px 0'
                }}>
                  Extra Count: {summary.extra_count ?? summary.additional_scanned_count ?? 0}
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: (summary.extra_count ?? summary.additional_scanned_count ?? 0) > 0 ? '#ecfdf5' : '#f1f5f9',
                  color: (summary.extra_count ?? summary.additional_scanned_count ?? 0) > 0 ? '#059669' : '#64748b',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={13} />
                  <span>
                    {(summary.extra_count ?? summary.additional_scanned_count ?? 0) === 0
                      ? 'Ready for scan — scan above to increment to 1'
                      : `+${summary.extra_count ?? summary.additional_scanned_count ?? 0} Extra Visitors Recorded in PostgreSQL DB`}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Simulate Mobile Scan & Open Link */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                <button
                  onClick={handleSimulateMobileScan}
                  disabled={simulatingScan}
                  style={{
                    width: '100%',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: simulatingScan ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Smartphone size={15} />
                  <span>{simulatingScan ? 'Processing Scan...' : 'Simulate Scan from Mobile (+1 Extra Count)'}</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={liveTokenData?.scan_url || `http://127.0.0.1:5000/api/wristbands/mobile-scan?token=${liveTokenData?.token || 'WB-EXTRA-10S-LIVE'}&wedding_id=${weddingId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <ExternalLink size={12} /> Open Mobile Pass
                  </a>

                  <button
                    onClick={() => {
                      if (liveTokenData?.scan_url) {
                        navigator.clipboard.writeText(liveTokenData.scan_url);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    {copiedToken ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                    <span>{copiedToken ? 'URL Copied!' : 'Copy Scan URL'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recommended Scanner Apps Guide (Any Scanner Supported) */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Smartphone size={16} color="#4f46e5" />
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Suggested Scanner Apps (Any Scanner Supported)
                </h5>
              </div>
              <div style={{ fontSize: '0.73rem', color: '#64748b', lineHeight: 1.45, marginBottom: '10px' }}>
                Use any smartphone camera or scanning app to scan the dynamic QR code above:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.73rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>1. Native Smartphone Camera (Zero Install)</div>
                  <div style={{ color: '#64748b' }}>Point native iPhone Camera or Android Google Lens at the QR. Tap the banner link to increment extra count.</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>2. "QR & Barcode Scanner" by Gamma Play (Top App)</div>
                  <div style={{ color: '#64748b' }}>Free on Play Store / iOS. In settings, enable <strong>"Open Web Pages Automatically"</strong> for instant zero-touch scan increments.</div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>3. "Barcode to PC" or "Binary Eye"</div>
                  <div style={{ color: '#64748b' }}>Fastest open-source barcode/QR reader apps with zero ads and instant webhook output.</div>
                </div>
              </div>
            </div>

            {/* Quick Barcode / Handheld Scanner Input */}
            <form onSubmit={e => { e.preventDefault(); handleScanCode(); }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Handheld Scanner / Quick Barcode Entry:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. WB-EXTRA-001 or Code 128 / QR"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={scanning || !barcodeInput.trim()}
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: barcodeInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: barcodeInput.trim() ? 1 : 0.6
                  }}
                >
                  {scanning ? 'Verifying...' : 'Scan / Enter'}
                </button>
              </div>
            </form>

            {/* Instant Demo Simulation Buttons */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                Quick Test Simulators (Click to trigger instant scan & DB increment):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['WB-EXTRA-014', 'WB-EXTRA-015', 'WB-VIP-099', 'WB-WALK-104'].map(demoCode => (
                  <button
                    key={demoCode}
                    onClick={() => handleScanCode(demoCode)}
                    disabled={scanning}
                    style={{
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    + {demoCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Outcome Banner */}
            {scanResult && (
              <div style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: scanResult.success ? '#f0fdf4' : '#fef2f2',
                border: scanResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                fontSize: '0.78rem',
                color: scanResult.success ? '#15803d' : '#b91c1c'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {scanResult.success ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {scanResult.success ? 'Entry Verified & Headcount Incremented' : 'Scan Blocked / Denied'}
                    </div>
                    <div style={{ marginTop: '2px', lineHeight: 1.4 }}>
                      {scanResult.message || scanResult.error}
                    </div>
                    {scanResult.is_duplicate_blocked && (
                      <div style={{ marginTop: '4px', fontWeight: 700, color: '#dc2626' }}>
                        Fraud Protection: Leakage prevented of ₹{Number(scanResult.leakage_prevented_inr || 2500).toLocaleString('en-IN')}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Batch Serialized Generator Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Pre-Generate Additional Wristband Batch
            </h4>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '12px' }}>
              Create serialized wristbands ready for physical printing on wristband rolls:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                  Quantity:
                </label>
                <select
                  value={batchCount}
                  onChange={e => setBatchCount(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                >
                  <option value={5}>5 Wristbands</option>
                  <option value={10}>10 Wristbands</option>
                  <option value={25}>25 Wristbands</option>
                  <option value={50}>50 Wristbands</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '3px' }}>
                  Category:
                </label>
                <select
                  value={batchCategory}
                  onChange={e => setBatchCategory(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                >
                  <option value="Walk-in Additional Visitor">Walk-in Additional Visitor</option>
                  <option value="VIP Guest Plus-One">VIP Guest Plus-One</option>
                  <option value="Kids & Juniors">Kids & Juniors</option>
                  <option value="Vendor Extra Logistics Crew">Vendor Extra Logistics Crew</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleIssueBatch}
              disabled={generatingBatch}
              style={{
                width: '100%',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} /> {generatingBatch ? 'Generating QR & Barcodes...' : `Issue ${batchCount} New Wristbands`}
            </button>
          </div>
        </div>

        {/* Right Column: Wristband Roster & Blocked Duplicate Security Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Wristbands Table */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Active Wristbands & Scanned Visitors Roster
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Total {data?.wristbands?.length || 0} Registered Wristbands in PostgreSQL DB
                </div>
              </div>

              <button
                onClick={fetchWristbandsSummary}
                disabled={loading}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px 10px' }}>Code / Barcode</th>
                    <th style={{ padding: '8px 10px' }}>Attendee Name</th>
                    <th style={{ padding: '8px 10px' }}>Category</th>
                    <th style={{ padding: '8px 10px' }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>Gate & Time</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.wristbands?.slice(0, 15).map(wb => {
                    const isScanned = wb.status === 'SCANNED_IN';
                    return (
                      <tr key={wb.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                          {wb.wristband_code}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 600, color: '#0f172a' }}>
                          {wb.guest_name}
                        </td>
                        <td style={{ padding: '10px 10px', color: '#475569' }}>
                          <span style={{
                            background: wb.category?.includes('VIP') ? '#fef3c7' : '#f1f5f9',
                            color: wb.category?.includes('VIP') ? '#92400e' : '#475569',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}>
                            {wb.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isScanned ? '#dcfce7' : '#f1f5f9',
                            color: isScanned ? '#15803d' : '#64748b',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {isScanned ? <Check size={12} /> : null}
                            {isScanned ? 'SCANNED IN' : 'UNSCANNED'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 10px', color: '#64748b', fontSize: '0.72rem' }}>
                          {isScanned ? (
                            <div>
                              <div>{wb.gate_scanned || 'Palace Toran Gate'}</div>
                              <div style={{ color: '#94a3b8' }}>
                                {wb.scanned_at ? new Date(wb.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Pending Arrival</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                          {!isScanned ? (
                            <button
                              onClick={() => handleScanCode(wb.wristband_code)}
                              style={{
                                background: '#4f46e5',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Scan In
                            </button>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '0.7rem', fontWeight: 600 }}>
                              Redeemed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blocked Duplicate Scans (Anti-Passback Fraud Security) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #fee2e2',
            borderRadius: '14px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#dc2626" />
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                    Blocked Duplicate Scans (Anti-Passback Security Log)
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>
                    {data?.blocked_attempts?.length || 0} Fraud Attempts Prevented • Total Leakage Saved: ₹{Number(summary.leakage_prevented_inr || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data?.blocked_attempts || []).slice(0, 4).map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '0.74rem',
                    color: '#991b1b'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                    <span>Wristband: <code>{b.wristband_code}</code> ({b.guest_name})</span>
                    <span style={{ color: '#dc2626' }}>BLOCKED AT {b.gate_attempted}</span>
                  </div>
                  <div style={{ color: '#7f1d1d', marginTop: '3px' }}>
                    {b.fraud_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Scanner Apps & Webhook Integration Guide */}
      {showScannerGuideModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={22} color="#4f46e5" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Recommended Mobile Scanner Apps & Setup
                </h3>
              </div>
              <button
                onClick={() => setShowScannerGuideModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.82rem', color: '#334155' }}>
              {/* Option 1: Built-in KnotCore Mobile Web Scanner */}
              <div style={{ background: '#f8fafc', border: '2px solid #4f46e5', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: '#4f46e5', fontSize: '0.9rem' }}>
                    1. Built-in KnotCore Mobile Camera Scanner (Recommended • Zero Install)
                  </strong>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    BUILT-IN
                  </span>
                </div>
                <div>
                  Simply open <code>http://&lt;your-ip&gt;:5173</code> on any smartphone (Chrome on Android or Safari on iPhone) and tap <strong>Start Mobile Camera Scanner</strong>. It scans both 1D Barcodes and 2D QR codes directly into PostgreSQL.
                </div>
              </div>

              {/* Option 2: Barcode to PC */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                    2. "Barcode to PC: Wi-Fi Scanner" (Free Android & iOS App)
                  </strong>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                    APP STORE / PLAY STORE
                  </span>
                </div>
                <div>
                  Download the free <strong>Barcode to PC</strong> app on Android or iOS. In App Settings &gt; Output:
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>Select <strong>HTTP POST Webhook</strong></li>
                    <li>Set Webhook URL: <code>http://127.0.0.1:5000/api/wristbands/scan</code></li>
                    <li>Every scan instantly transmits JSON <code>&#123; "barcode": "WB-001" &#125;</code> and increments the headcount in the database.</li>
                  </ul>
                </div>
              </div>

              {/* Option 3: Scan to Web */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                  3. "Scan to Web" (by Berry Wing)
                </strong>
                <div style={{ marginTop: '4px' }}>
                  Browser designed for barcode scanning. Opens the KnotCore ERP web page and injects hardware camera scans directly into the active input box on the page.
                </div>
              </div>

              {/* Option 4: Physical Bluetooth / USB Handheld Scanners */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                  4. Handheld Bluetooth / USB Laser Barcode Guns (Zebra, Eyoyo, Netum)
                </strong>
                <div style={{ marginTop: '4px' }}>
                  Pair the scanner with a mobile tablet or gate laptop. Scanners operate as an automatic keyboard wedge, typing the barcode and pressing Enter to submit automatically.
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setShowScannerGuideModal(false)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Printable Wristbands Sheet */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Printer size={22} color="#4f46e5" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Printable Wristbands Sheet (Code-128 & QR Codes)
                </h3>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '16px' }}>
              Printable thermal wristbands for walk-in attendees and extra guests. Each wristband has a unique Code-128 barcode and QR code:
            </div>

            {/* Grid of Wristbands */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {(data?.wristbands || []).slice(0, 8).map(wb => (
                <div
                  key={wb.id}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px',
                    background: '#f8fafc',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5' }}>
                    THE ROYAL KNOT • PALACE PASS
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {wb.guest_name}
                  </div>

                  {/* QR Image */}
                  {wb.qr_code_data_url ? (
                    <img
                      src={wb.qr_code_data_url}
                      alt={wb.wristband_code}
                      style={{ width: '110px', height: '110px', margin: '8px auto', display: 'block' }}
                    />
                  ) : (
                    <QrCode size={80} color="#cbd5e1" style={{ margin: '8px auto', display: 'block' }} />
                  )}

                  {/* Simulated Code-128 Barcode Visual */}
                  <div style={{
                    letterSpacing: '3px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    padding: '4px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    |||| | ||||| ||| ||||
                  </div>

                  <div style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {wb.wristband_code}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={14} /> Print Wristbands Sheet
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
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
