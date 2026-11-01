import React, { useState, useEffect } from 'react';
import { 
  Clock, QrCode, AlertTriangle, CheckCircle2, ShieldAlert, Send, 
  Camera, MapPin, AlertOctagon, RefreshCw, UserCheck, Zap, 
  ArrowRight, PhoneCall, Check, X, Eye, FileText, ChevronRight,
  Sparkles, Radio, ShieldCheck, Flame, Info,
  BarChart3, PieChart, Activity, Image as ImageIcon, Upload,
  Download, Copy, ExternalLink
} from 'lucide-react';

export default function BigDayScheduleView({ weddingId = 1 }) {
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance' | 'delay' | 'incidents'
  const [arrivalsData, setArrivalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Geotag OCR Intelligence State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrImageSrc, setOcrImageSrc] = useState('/geotag1.jpeg');
  const [ocrMode, setOcrMode] = useState('geotag1'); // 'geotag1' | 'door' | 'upload'
  const [customFilePreview, setCustomFilePreview] = useState(null);

  // Dynamic Gate QR Code & Late Penalty Deduction State
  const [dynamicQrVendorId, setDynamicQrVendorId] = useState(6);
  const [dynamicQrData, setDynamicQrData] = useState(null);
  const [dynamicQrLoading, setDynamicQrLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(45);
  const [copiedToken, setCopiedToken] = useState(false);

  // Geo-CheckIn Modal / Drawer State
  const [selectedVendorForCheckin, setSelectedVendorForCheckin] = useState(null);
  const [checkinForm, setCheckinForm] = useState({
    qr_token: '',
    otp_code: '',
    gps_lat: 24.5764,
    gps_lng: 73.6835,
    photo_proof_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'
  });
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);

  // Delay Intelligence State
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [simulationData, setSimulationData] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [plannerName, setPlannerName] = useState('Lead Planner Sachin Priya');

  // Incidents State
  const [incidents, setIncidents] = useState([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [newIncidentForm, setNewIncidentForm] = useState({
    vendor_id: 102,
    vendor_name: 'Petals & Bloom Luxury Floral Architecture',
    title: 'Emergency 45kVA Silent Generator required for Mandap chiller halo',
    description: 'Phase voltage fluctuating on main stage power feeder. Need backup 45kVA silent generator before Baraat arrival.',
    severity: 'CRITICAL',
    location: 'Central Mandap Lawn / Palace Courtyard',
    category: 'ELECTRICAL_POWER'
  });
  const [reportingIncident, setReportingIncident] = useState(false);
  const [updatingIncidentId, setUpdatingIncidentId] = useState(null);

  // Fetch all arrivals
  const fetchArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://127.0.0.1:5000/api/scene4/arrivals/${weddingId}`);
      if (!res.ok) throw new Error('Failed to fetch vendor arrivals');
      const data = await res.json();
      setArrivalsData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Delay Simulation
  const runDelaySimulation = async (mins = delayMinutes) => {
    try {
      setSimLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene4/simulate-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingId, delay_minutes: mins })
      });
      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      setSimulationData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  // Fetch Broadcast History
  const fetchBroadcastHistory = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scene4/broadcast-history/${weddingId}`);
      if (res.ok) {
        const data = await res.json();
        setBroadcastHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Incidents
  const fetchIncidents = async () => {
    try {
      setIncidentsLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/scene4/incidents/${weddingId}`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIncidentsLoading(false);
    }
  };

  // Run Geotag OCR Analysis
  const handleRunGeotagOCR = async (mode = 'geotag1', customBase64 = null) => {
    try {
      setOcrLoading(true);
      setOcrMode(mode);
      let payload = {};
      if (mode === 'geotag1') {
        payload = { use_geotag1: true };
        setOcrImageSrc('/geotag1.jpeg');
      } else if (mode === 'door') {
        payload = { use_non_geotag: true };
        setOcrImageSrc('/door.png');
      } else if (mode === 'upload' && customBase64) {
        payload = { image_base64: customBase64, filename: 'custom_upload.jpeg' };
        setOcrImageSrc(customBase64);
      }

      const res = await fetch('http://127.0.0.1:5000/api/scene4/analyze-geotag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setOcrResult(data);
    } catch (err) {
      console.error(err);
      setOcrResult({
        success: false,
        is_geotagged: false,
        error: err.message,
        flag_reason: 'NETWORK_ERROR'
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      setCustomFilePreview(base64Data);
      handleRunGeotagOCR('upload', base64Data);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchArrivals();
    runDelaySimulation(45);
    fetchBroadcastHistory();
    fetchIncidents();
    handleRunGeotagOCR('geotag1');
  }, [weddingId]);

  // Fetch Dynamic QR Code Data for Selected Vendor
  const fetchDynamicQR = async (vId = dynamicQrVendorId) => {
    try {
      setDynamicQrLoading(true);
      const res = await fetch(`http://127.0.0.1:5000/api/scene4/dynamic-qr/${vId}`);
      if (res.ok) {
        const data = await res.json();
        setDynamicQrData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDynamicQrLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicQR(dynamicQrVendorId);
  }, [dynamicQrVendorId]);

  // Dynamic QR Code rotating timer (45-second cycle)
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchDynamicQR(dynamicQrVendorId);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [dynamicQrVendorId]);

  const handleDownloadQrImage = () => {
    if (!dynamicQrData?.qr_code_data_url) return;
    const link = document.createElement('a');
    link.href = dynamicQrData.qr_code_data_url;
    link.download = `dynamic_gate_attendance_qr_${dynamicQrData.qr_token || 'token'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyQrToken = () => {
    const textToCopy = dynamicQrData?.qr_token || 'KNOT-QR-6-CAT-03';
    navigator.clipboard.writeText(textToCopy);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  // Handle Verify Arrival
  const handleVerifyAttendance = async (e) => {
    e.preventDefault();
    if (!selectedVendorForCheckin) return;
    try {
      setCheckinLoading(true);
      setCheckinResult(null);

      const res = await fetch('http://127.0.0.1:5000/api/scene4/verify-arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          vendor_id: selectedVendorForCheckin.vendor_id,
          qr_token: checkinForm.qr_token,
          otp_code: checkinForm.otp_code,
          gps_lat: parseFloat(checkinForm.gps_lat),
          gps_lng: parseFloat(checkinForm.gps_lng),
          photo_proof_url: checkinForm.photo_proof_url
        })
      });

      const data = await res.json();
      setCheckinResult(data);

      if (data.success) {
        // Refresh arrivals list
        fetchArrivals();
        setTimeout(() => {
          setSelectedVendorForCheckin(null);
          setCheckinResult(null);
        }, 2200);
      }
    } catch (err) {
      setCheckinResult({ success: false, error: err.message });
    } finally {
      setCheckinLoading(false);
    }
  };

  // Handle Approve & Broadcast
  const handleApproveAndBroadcast = async () => {
    if (!simulationData?.simulation_id) return;
    try {
      setBroadcastLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene4/approve-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          broadcast_id: simulationData.simulation_id,
          planner_name: plannerName
        })
      });

      const data = await res.json();
      setBroadcastResult(data);
      if (data.success) {
        setShowApprovalModal(false);
        fetchBroadcastHistory();
        runDelaySimulation(delayMinutes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Handle Report Emergency
  const handleReportEmergency = async (e) => {
    e.preventDefault();
    try {
      setReportingIncident(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene4/report-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          vendor_id: newIncidentForm.vendor_id,
          vendor_name: newIncidentForm.vendor_name,
          title: newIncidentForm.title,
          description: newIncidentForm.description,
          severity: newIncidentForm.severity,
          location: newIncidentForm.location,
          category: newIncidentForm.category
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowNewIncidentModal(false);
        fetchIncidents();
        setNewIncidentForm({
          vendor_id: 102,
          vendor_name: 'Petals & Bloom Luxury Floral Architecture',
          title: '',
          description: '',
          severity: 'HIGH',
          location: 'Central Mandap Lawn',
          category: 'OPERATIONS'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportingIncident(false);
    }
  };

  // Handle Status Update for Incident
  const handleUpdateIncidentStatus = async (incidentId, nextStatus, resolutionText) => {
    try {
      setUpdatingIncidentId(incidentId);
      const res = await fetch('http://127.0.0.1:5000/api/scene4/update-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          new_status: nextStatus,
          action_taken: resolutionText,
          resolver_name: plannerName
        })
      });

      if (res.ok) {
        fetchIncidents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingIncidentId(null);
    }
  };

  const openCheckinForVendor = (v) => {
    setSelectedVendorForCheckin(v);
    setCheckinForm({
      qr_token: v.qr_token,
      otp_code: v.otp_code,
      gps_lat: 24.5764,
      gps_lng: 73.6835,
      photo_proof_url: v.photo_proof_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80'
    });
    setCheckinResult(null);
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
            <span style={{ color: '#18181b', fontWeight: 600 }}>Big Day Schedule Engine</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Big Day Schedule Engine
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Real-time GPS gate arrivals, delay cascade simulation, and curfew penalty protection.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => { fetchArrivals(); runDelaySimulation(delayMinutes); fetchIncidents(); }}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <RefreshCw size={13} /> Sync Odoo State
          </button>
        </div>
      </div>

      {/* 5 StockSense KPI Cards with Yellow Icon Boxes */}
      {arrivalsData?.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
          {/* Assigned Vendors */}
          <div className="stocksense-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
                Assigned Vendors
              </span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {arrivalsData.summary.total_vendors}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
              100% contracts bound
            </div>
          </div>

          {/* Verified Checked-In */}
          <div className="stocksense-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
                Verified Checked-In
              </span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#16a34a', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {arrivalsData.summary.checked_in_count}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
              GPS & photo validated
            </div>
          </div>

          {/* Late Alerts */}
          <div className="stocksense-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
                Late Alerts (15m Grace)
              </span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 600, color: arrivalsData.summary.red_late_count > 0 ? '#dc2626' : '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {arrivalsData.summary.red_late_count}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
              Backup team on standby
            </div>
          </div>

          {/* Punctuality Rate */}
          <div className="stocksense-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
                Punctuality Rate
              </span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
              {arrivalsData.summary.punctuality_rate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
              Based on call times
            </div>
          </div>

          {/* Curfew Overtime Guard */}
          <div className="stocksense-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={15} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
                Curfew Guard
              </span>
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
              ₹1.75 L
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
              Midnight surcharge shielded
            </div>
          </div>
        </div>
      )}

        {/* Sub-Tabs Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setActiveSubTab('attendance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'attendance' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'attendance' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <UserCheck size={16} />
            Vendor Geo-Attendance & Late Alerts
            {arrivalsData?.summary?.red_late_count > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '12px'
              }}>
                {arrivalsData.summary.red_late_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('delay')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'delay' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'delay' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={16} />
            Wedding Delay Intelligence & Ripple Engine
          </button>

        </div>

      {/* 2. SUB-TAB 1: VENDOR GEO-TAGGED ATTENDANCE & LATE ALERT ENGINE */}
      {activeSubTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Late Alert Banner if vendors late */}
          {arrivalsData?.arrivals?.some(a => a.status === 'RED_LATE') && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>
                    AUTOMATED LATE ALERT TRIGGERED: 15-Minute Grace Period Expired
                  </div>
                  <span style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    RED - LATE
                  </span>
                </div>
                <p style={{ margin: '6px 0 10px 0', fontSize: '0.84rem', color: '#b91c1c', lineHeight: 1.5 }}>
                  <strong>Royal Rajputana Brass Band & Dhol Squad</strong> was assigned call time <strong>14:00</strong>. Grace period expired at <strong>14:15</strong> without QR scan or OTP verification. Automated late alert dispatched to Lead Planner.
                </p>
                <div style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>
                    <strong>Active Contingency:</strong> Marwar Heritage Royal Band on Standby (+91 98290 99441) at Service Gate 4.
                  </div>
                  <button
                    onClick={() => {
                      const lateVendor = arrivalsData.arrivals.find(a => a.status === 'RED_LATE');
                      if (lateVendor) openCheckinForVendor(lateVendor);
                    }}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Simulate Vendor Bot Check-In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KPI CARDS & ATTENDANCE READINESS RING CHART */}
          {(() => {
            const checkedIn = arrivalsData?.arrivals?.filter(a => a.status === 'CHECKED_IN').length || 0;
            const late = arrivalsData?.arrivals?.filter(a => a.status === 'RED_LATE').length || 0;
            const scheduled = arrivalsData?.arrivals?.filter(a => a.status === 'SCHEDULED').length || 0;
            const total = arrivalsData?.arrivals?.length || 1;
            const onTimePct = Math.round((checkedIn / total) * 100);
            const latePct = Math.round((late / total) * 100);

            // SVG Donut calculation
            const radius = 45;
            const circ = 2 * Math.PI * radius;
            const checkedInDash = (checkedIn / total) * circ;
            const lateDash = (late / total) * circ;
            const scheduledDash = (scheduled / total) * circ;

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {/* 1. Visual SVG Punctuality Donut Chart */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '22px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px'
                }}>
                  <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                    <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      {/* Background Circle */}
                      <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                      {/* Scheduled Segment (Amber) */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="16"
                        strokeDasharray={`${scheduledDash} ${circ}`}
                        strokeDashoffset="0"
                      />
                      {/* Late Segment (Red) */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="16"
                        strokeDasharray={`${lateDash} ${circ}`}
                        strokeDashoffset={`-${scheduledDash}`}
                      />
                      {/* Checked-In Segment (Emerald) */}
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="16"
                        strokeDasharray={`${checkedInDash} ${circ}`}
                        strokeDashoffset={`-${scheduledDash + lateDash}`}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                        {onTimePct}%
                      </div>
                      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
                        Punctuality
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                      Vendor Arrival Distribution
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                          Checked-In (On-Time):
                        </span>
                        <strong>{checkedIn} ({onTimePct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                          Red Alert (Late):
                        </span>
                        <strong style={{ color: late > 0 ? '#ef4444' : '#0f172a' }}>{late} ({latePct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                          Scheduled (Pending):
                        </span>
                        <strong>{scheduled} ({Math.round((scheduled / total) * 100)}%)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Automated Attendance Summary KPIs */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Active Call Time Window
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                      14:00 - 16:30
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                      Mandatory 15-min grace period
                    </div>
                  </div>

                  <div style={{
                    background: late > 0 ? '#fff1f2' : '#f0fdf4',
                    border: late > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: late > 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase' }}>
                      Backup Contingency
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: late > 0 ? '#dc2626' : '#16a34a', margin: '4px 0' }}>
                      {late > 0 ? 'ACTIVE ON STANDBY' : 'STANDBY READY'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: late > 0 ? '#991b1b' : '#166534' }}>
                      {late > 0 ? 'Marwar Brass Band on Gate 4' : 'All critical vendors aligned'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. INTERACTIVE GEOTAGGED PHOTO OCR & ANTI-SPOOFING TERMINAL */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#e0e7ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Camera size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Vendor Geo-Tagged Photo OCR & Anti-Spoofing Intelligence
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Inspects visual GPS Map Camera watermarks, coordinates, timestamps, and geofence validity before Odoo attendance confirmation.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRunGeotagOCR('geotag1')}
                  disabled={ocrLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: ocrMode === 'geotag1' ? '#4f46e5' : '#f1f5f9',
                    color: ocrMode === 'geotag1' ? '#ffffff' : '#475569',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} style={{ animation: ocrLoading && ocrMode === 'geotag1' ? 'spin 1.5s linear infinite' : 'none' }} />
                  Run OCR on geotag1.jpeg
                </button>

                <button
                  onClick={() => handleRunGeotagOCR('door')}
                  disabled={ocrLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: ocrMode === 'door' ? '#dc2626' : '#fef2f2',
                    color: ocrMode === 'door' ? '#ffffff' : '#b91c1c',
                    border: '1px solid #fecaca',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <AlertOctagon size={14} />
                  Test Non-Geotagged Rejection
                </button>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  <Upload size={14} />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCustomImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* OCR Live Terminal Content: Image Left, Intelligence Right */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px'
            }}>
              {/* Image Preview Box */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569'
                }}>
                  <span>Visual Photo Proof Under Inspection</span>
                  <span style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {ocrMode === 'geotag1' ? 'geotag1.jpeg (GPS Map Camera)' : ocrMode === 'door' ? 'door.png (Standard Un-geotagged)' : 'Custom Upload'}
                  </span>
                </div>

                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#0f172a',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={ocrImageSrc}
                    alt="Geotag Evidence Proof"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  {ocrLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(15, 23, 42, 0.75)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      gap: '12px'
                    }}>
                      <RefreshCw size={32} style={{ animation: 'spin 1.2s linear infinite' }} />
                      <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                        Scanning GPS Map Camera Watermarks...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OCR Multimodal Analysis Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Result Banner */}
                {ocrLoading ? (
                  <div style={{
                    padding: '16px',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '10px',
                    color: '#4338ca',
                    fontSize: '0.84rem',
                    fontWeight: 600
                  }}>
                    Contacting Multimodal OCR Engine with prompt instructions...
                  </div>
                ) : ocrResult?.is_geotagged ? (
                  <div style={{
                    padding: '14px 18px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <ShieldCheck size={26} color="#16a34a" />
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534' }}>
                        GEOTAGGED PHOTO VERIFIED: GPS WATERMARK AUTHENTICATED
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '2px' }}>
                        Visual latitude, longitude, and live timestamp extracted accurately.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '14px 18px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <AlertTriangle size={26} color="#dc2626" />
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#991b1b' }}>
                        NON-GEOTAGGED PHOTO DETECTED: ATTENDANCE REJECTED
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                        {ocrResult?.flag_reason || 'Missing visual GPS coordinates, location stamp, or date-time watermark.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Extracted Information Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Extracted Latitude</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: ocrResult?.latitude ? '#0f172a' : '#94a3b8', fontFamily: 'monospace' }}>
                      {ocrResult?.latitude ? `${ocrResult.latitude}°` : 'None / Not Found'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Extracted Longitude</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: ocrResult?.longitude ? '#0f172a' : '#94a3b8', fontFamily: 'monospace' }}>
                      {ocrResult?.longitude ? `${ocrResult.longitude}°` : 'None / Not Found'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Visual Stamped Address</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: ocrResult?.address ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                      {ocrResult?.address || 'No visual address watermark stamped'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Stamped Date & Time</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: ocrResult?.date_time ? '#0f172a' : '#94a3b8' }}>
                      {ocrResult?.date_time || 'None detected'}
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Geofence Proximity</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                      {ocrResult?.distance_to_venue_km !== null && ocrResult?.distance_to_venue_km !== undefined
                        ? `${ocrResult.distance_to_venue_km} km to Venue`
                        : 'Geofence check pending'}
                    </div>
                  </div>
                </div>

                {/* Scene Understanding & Raw Text */}
                {ocrResult?.scene_description && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.78rem'
                  }}>
                    <strong style={{ color: '#0f172a' }}>Scene Understanding:</strong> {ocrResult.scene_description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamically Changing Palace Gate Attendance QR Code (Two-Factor Stage 2) */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid #312e81',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            color: '#f8fafc',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
          }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.25)',
                    color: '#c7d2fe',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Two-Factor Gate Protocol • Stage 2
                  </span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', animation: 'pulse 1.5s infinite' }} />
                    Rotating Token • Refreshes in {qrCountdown}s
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                  Dynamically Changing Palace Gate Attendance QR Code
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '820px', lineHeight: 1.5 }}>
                  After the geotagged photo is uploaded and verified above, take this live dynamic QR code and upload it to the dedicated <strong>Vendor Bot (@Royalknot_vendors_bot)</strong>. Attendance is marked ONLY after BOTH Geotag photo analysis and QR code scanning. If one is missing, attendance is NOT marked in Odoo ERP.
                </div>
              </div>

              <button
                onClick={() => fetchDynamicQR(dynamicQrVendorId)}
                disabled={dynamicQrLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} style={{ animation: dynamicQrLoading ? 'spin 1s linear infinite' : 'none' }} />
                Regenerate Token
              </button>
            </div>

            {/* Vendor Selector Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginRight: '4px' }}>
                Select Contracted Supplier:
              </span>
              {[
                { id: 6, name: 'Vendor 6: Rajputana Mandap', cat: 'Mandap & Floral', call: '11:00 AM', amount: '₹29,00,000' },
                { id: 2, name: 'Vendor 2: Shahi Mewar Catering', cat: 'Royal Catering', call: '10:30 AM', amount: '₹51,00,000' },
                { id: 1, name: 'Vendor 1: Rambagh Palace', cat: 'Heritage Venue', call: '09:30 AM', amount: '₹55,00,000' },
                { id: 9, name: 'Vendor 9: Desert Sonic AV', cat: 'Light & Sound', call: '11:30 AM', amount: '₹14,80,000' }
              ].map((v) => {
                const isSelected = dynamicQrVendorId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setDynamicQrVendorId(v.id)}
                    style={{
                      background: isSelected ? '#4f46e5' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#ffffff' : '#cbd5e1',
                      border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{v.name}</span>
                    <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>({v.call})</span>
                  </button>
                );
              })}
            </div>

            {/* Main Content Grid: QR Code + 2FA Protocol Status + Late Penalty Slabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 320px) minmax(320px, 1fr) minmax(340px, 1.2fr)',
              gap: '20px',
              alignItems: 'stretch'
            }}>
              {/* Box 1: Dynamic QR Code Box */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '18px',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Gate Entry Verification Token
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                    {dynamicQrData?.vendor_name || 'Rajputana Royal Mandap & Floral Architecture'}
                  </div>

                  {/* QR Image */}
                  <div style={{
                    width: '210px',
                    height: '210px',
                    margin: '0 auto 12px auto',
                    padding: '8px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {dynamicQrLoading ? (
                      <RefreshCw size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : dynamicQrData?.qr_code_data_url ? (
                      <img
                        src={dynamicQrData.qr_code_data_url}
                        alt="Dynamic Gate Attendance QR Code"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <QrCode size={120} color="#cbd5e1" />
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{
                      background: '#e0e7ff',
                      color: '#3730a3',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Token: <code>{dynamicQrData?.qr_token || 'KNOT-QR-6-CAT-03'}</code>
                    </span>
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      OTP: <code>{dynamicQrData?.otp_code || '49623'}</code>
                    </span>
                  </div>
                </div>

                {/* Actions: Download QR + Open Bot */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={handleDownloadQrImage}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <Download size={14} /> Download QR Code Image
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleCopyQrToken}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {copiedToken ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      {copiedToken ? 'Copied!' : 'Copy Token'}
                    </button>

                    <a
                      href={`https://t.me/${dynamicQrData?.bot_username || 'Royalknot_vendors_bot'}?start=CHECKIN_${dynamicQrData?.qr_token || 'KNOT-QR-6-CAT-03'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: '#f8fafc',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={13} /> Open Vendor Bot
                    </a>
                  </div>
                </div>
              </div>

              {/* Box 2: Two-Factor Attendance Verification Rules */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Attendance Integrity Rule
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px 0' }}>
                    Two-Factor Verification Engine
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                    To eliminate proxy check-ins, KnotCore requires two independent factors. If one is missing, attendance is NOT marked:
                  </div>

                  {/* Factor 1: Geotag Photo */}
                  <div style={{
                    background: ocrResult?.is_geotagged ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: ocrResult?.is_geotagged ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                        Factor 1: Visual GPS Geotag Photo
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: ocrResult?.is_geotagged ? '#34d399' : '#fbbf24',
                        background: ocrResult?.is_geotagged ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {ocrResult?.is_geotagged ? 'VERIFIED' : 'PENDING UPLOAD'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                      {ocrResult?.is_geotagged
                        ? `GPS: ${ocrResult.latitude}° N, ${ocrResult.longitude}° E (${ocrResult.distance_to_venue_km || 0} km to Palace Gate)`
                        : 'Upload photo with visible GPS camera watermark & date-time above.'}
                    </div>
                  </div>

                  {/* Factor 2: Dynamic QR Scan */}
                  <div style={{
                    background: dynamicQrData?.is_checked_in ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    border: dynamicQrData?.is_checked_in ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                        Factor 2: Dynamic QR Code Scan
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: dynamicQrData?.is_checked_in ? '#34d399' : '#60a5fa',
                        background: dynamicQrData?.is_checked_in ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {dynamicQrData?.is_checked_in ? 'CHECKED IN' : 'AWAITING BOT UPLOAD'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                      {dynamicQrData?.is_checked_in
                        ? 'Token authenticated and matched against awarded purchase order.'
                        : 'Take the dynamic QR code above and upload it to @Royalknot_vendors_bot.'}
                    </div>
                  </div>
                </div>

                {/* Strict Enforcement Box */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.75rem',
                  color: '#fca5a5',
                  lineHeight: 1.45
                }}>
                  <strong style={{ color: '#ffffff' }}>Strict Odoo ERP Enforcement:</strong> If either factor is missing, the Vendor Bot explicitly halts check-in. Attendance is confirmed ONLY when BOTH the GPS geotag analysis and dynamic QR code token match.
                </div>
              </div>

              {/* Box 3: Predefined Late Attendance Deduction Formula */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    Financial Settlement Matrix
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
                    Predefined Late Penalty Formula
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.45, marginBottom: '14px' }}>
                    Contract: <strong>₹{(dynamicQrData?.contract_amount_inr || 2900000).toLocaleString('en-IN')}</strong>. Very low percentage (0.5% – 3.5%) protects supplier margins while enforcing royal punctuality:
                  </div>

                  {/* Slabs Table */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    fontSize: '0.73rem',
                    marginBottom: '14px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.8fr 1fr', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', fontWeight: 700, color: '#94a3b8' }}>
                      <span>Delay Past Grace</span>
                      <span>Deduction</span>
                      <span style={{ textAlign: 'right' }}>Net Payable</span>
                    </div>

                    {[
                      { delay: '<= 10m grace', pct: '0.0%', ded: '₹0', pay: `₹${(dynamicQrData?.contract_amount_inr || 2900000).toLocaleString('en-IN')}` },
                      { delay: '1 - 15 mins late', pct: '0.5%', ded: `-₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.005).toLocaleString('en-IN')}`, pay: `₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.995).toLocaleString('en-IN')}` },
                      { delay: '16 - 30 mins late', pct: '1.0%', ded: `-₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.01).toLocaleString('en-IN')}`, pay: `₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.99).toLocaleString('en-IN')}` },
                      { delay: '31 - 60 mins late', pct: '2.0%', ded: `-₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.02).toLocaleString('en-IN')}`, pay: `₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.98).toLocaleString('en-IN')}` },
                      { delay: '> 60 mins late', pct: '3.5%', ded: `-₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.035).toLocaleString('en-IN')}`, pay: `₹${Math.round((dynamicQrData?.contract_amount_inr || 2900000) * 0.965).toLocaleString('en-IN')}` }
                    ].map((row, idx) => (
                      <div key={idx} style={{
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 0.8fr 1fr',
                        padding: '6px 10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        color: idx === 0 ? '#6ee7b7' : '#cbd5e1'
                      }}>
                        <span>{row.delay}</span>
                        <span style={{ fontWeight: 700, color: idx === 0 ? '#34d399' : '#f87171' }}>{row.pct}</span>
                        <span style={{ textAlign: 'right', fontWeight: 700 }}>{row.pay}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Settlement Status */}
                <div style={{
                  background: dynamicQrData?.is_checked_in
                    ? (dynamicQrData?.penalty_deduction_pct > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                    : 'rgba(255, 255, 255, 0.05)',
                  border: dynamicQrData?.is_checked_in
                    ? (dynamicQrData?.penalty_deduction_pct > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)')
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Live Settlement Audit:</span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: dynamicQrData?.is_checked_in ? (dynamicQrData?.penalty_deduction_pct > 0 ? '#fca5a5' : '#6ee7b7') : '#94a3b8'
                    }}>
                      {dynamicQrData?.is_checked_in
                        ? (dynamicQrData?.penalty_deduction_pct > 0 ? `Late Penalty: -${dynamicQrData.penalty_deduction_pct}%` : 'Punctual (0.0% Deduction)')
                        : 'Awaiting Check-In'}
                    </span>
                  </div>
                  {dynamicQrData?.is_checked_in && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                        Delay: {dynamicQrData?.delay_minutes}m past grace
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                        Net Payable: ₹{Number(dynamicQrData?.net_payout_inr).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Vendors Attendance Table / Grid */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Big Day Vendor Attendance Roster (10 Critical Vendors)
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Venue Reference: {arrivalsData?.venue?.name} (GPS Geofence: 2.5 km radius)
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '8px' }} />
                <div>Loading Odoo Vendor Arrivals...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {arrivalsData?.arrivals?.map((vendor) => {
                  const isCheckedIn = vendor.status === 'CHECKED_IN';
                  const isLate = vendor.status === 'RED_LATE';
                  const isScheduled = vendor.status === 'SCHEDULED';

                  return (
                    <div
                      key={vendor.id}
                      style={{
                        background: isLate ? '#fffaf0' : isCheckedIn ? '#fcfdfd' : '#ffffff',
                        border: isLate ? '2px solid #ef4444' : isCheckedIn ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        boxShadow: isLate ? '0 4px 12px rgba(239, 68, 68, 0.12)' : 'none'
                      }}
                    >
                      {/* Top: Vendor Info & Status Badge */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <span style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              {vendor.category_name}
                            </span>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                              {vendor.vendor_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                              <PhoneCall size={12} /> {vendor.vendor_phone}
                            </div>
                          </div>

                          {/* Status Pill */}
                          {isCheckedIn && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              <CheckCircle2 size={13} /> CHECKED IN
                            </span>
                          )}

                          {isLate && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#dc2626',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              animation: 'pulse 1.5s infinite'
                            }}>
                              <AlertTriangle size={13} /> RED - LATE
                            </span>
                          )}

                          {isScheduled && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              <Clock size={13} /> SCHEDULED
                            </span>
                          )}
                        </div>

                        {/* Timing Matrix */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          background: '#f8fafc',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          margin: '12px 0',
                          fontSize: '0.76rem'
                        }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Assigned Call Time:</span>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>{vendor.call_time}</div>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>15m Grace Cutoff:</span>
                            <div style={{ fontWeight: 700, color: isLate ? '#dc2626' : '#0f172a', fontSize: '0.84rem' }}>
                              {Math.floor(vendor.grace_deadline_minutes / 60)}:{(vendor.grace_deadline_minutes % 60).toString().padStart(2, '0')}
                            </div>
                          </div>
                        </div>

                        {/* Attendance Verification Proofs */}
                        {isCheckedIn ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.76rem', color: '#334155' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={13} color="#16a34a" />
                              <span>{vendor.location_name || 'City Palace Courtyard Gate'} ({vendor.distance_km} km away)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>OTP Verified: {vendor.otp_code}</span>
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>QR Scanned: {vendor.qr_token}</span>
                            </div>
                            {vendor.photo_proof_url && (
                              <div style={{ marginTop: '4px' }}>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>Live Geo-Tagged Photo Proof:</div>
                                <img
                                  src={vendor.photo_proof_url}
                                  alt="Vendor Arrival Proof"
                                  style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                              </div>
                            )}

                            {/* Predefined Late Attendance Penalty Settlement Pill */}
                            {vendor.penalty_deduction_pct !== undefined && vendor.penalty_deduction_pct !== null && (
                              <div style={{
                                marginTop: '6px',
                                background: Number(vendor.penalty_deduction_pct) > 0 ? '#fff1f2' : '#f0fdf4',
                                border: Number(vendor.penalty_deduction_pct) > 0 ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                                borderRadius: '8px',
                                padding: '8px 10px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, color: Number(vendor.penalty_deduction_pct) > 0 ? '#be123c' : '#15803d', fontSize: '0.74rem' }}>
                                    {Number(vendor.penalty_deduction_pct) > 0 ? `Late Penalty (-${vendor.penalty_deduction_pct}%)` : 'Punctual (0.0% Deduction)'}
                                  </span>
                                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.78rem' }}>
                                    Net: ₹{Number(vendor.net_payout_inr || vendor.contract_amount_inr || 2900000).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                {Number(vendor.delay_minutes) > 0 && (
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                                    Delay: {vendor.delay_minutes}m past grace • Deducted: -₹{Number(vendor.penalty_deduction_inr || 0).toLocaleString('en-IN')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                            {isLate ? (
                              <div style={{ color: '#b91c1c', fontWeight: 500 }}>
                                <strong>Alert:</strong> {vendor.contingency_notes}
                              </div>
                            ) : (
                              <div>
                                Call time in future. Vendor scheduled to report via private Telegram bot (@Royalknot_vendors_bot).
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Controls */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => openCheckinForVendor(vendor)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: isCheckedIn ? '#f1f5f9' : '#4f46e5',
                            color: isCheckedIn ? '#475569' : '#ffffff',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <QrCode size={14} />
                          {isCheckedIn ? 'View QR & OTP Credentials' : 'Simulate Bot Attendance Check-In'}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. SUB-TAB 2: WEDDING DELAY INTELLIGENCE & HUMAN APPROVAL BROADCAST */}
      {activeSubTab === 'delay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Delay Control Header & Presets */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  Baraat Delay Simulation & Ripple Effect Calculator
                </h3>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                  Adjust the Baraat delay to calculate cascaded impact on Varmala, Pheras, and Banquet Dinner.
                </p>
              </div>

              {/* Delay Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155' }}>Delay Duration:</span>
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setDelayMinutes(mins);
                      runDelaySimulation(mins);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: delayMinutes === mins ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                      background: delayMinutes === mins ? '#eef2ff' : '#ffffff',
                      color: delayMinutes === mins ? '#4f46e5' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    +{mins} Mins {mins === 45 && '(Target)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Critical Risk Detection Box */}
            {simulationData?.curfew_risk_detected && (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                border: '1px solid #fecaca',
                borderRadius: '14px',
                padding: '18px 22px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Flame size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991b1b' }}>
                      CRITICAL RISK DETECTED: Banquet Dinner Crosses Midnight Curfew ({simulationData.unmitigated_dinner_end})
                    </div>
                    <span style={{
                      background: '#b91c1c',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      ₹1,75,000 PENALTY RISK
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 12px 0', fontSize: '0.84rem', color: '#991b1b', lineHeight: 1.5 }}>
                    Unmitigated Baraat delay of {delayMinutes} minutes cascades directly to Banquet Dinner ending at <strong>{simulationData.unmitigated_dinner_end}</strong>, breaching the venue 00:00 midnight curfew and triggering <strong>₹1,25,000 caterer overtime charges</strong> + <strong>₹50,000 venue extension fee</strong>.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                    {simulationData.detected_risks?.map((risk, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7f1d1d' }}>{risk.title}</div>
                        <div style={{ fontSize: '0.73rem', color: '#991b1b', marginTop: '2px' }}>{risk.description}</div>
                        {risk.financial_impact_inr > 0 && (
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                            Financial Exposure: ₹{risk.financial_impact_inr.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Schedule Mitigations */}
            <div style={{ marginTop: '22px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#4f46e5" />
                Recommended Schedule Adjustments (Saved: 70 Minutes, Overtime Eliminated)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {simulationData?.recommended_mitigations?.map((mit, idx) => (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>{mit.title}</span>
                        {mit.minutes_saved > 0 && (
                          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                            -{mit.minutes_saved}m
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '4px', lineHeight: 1.4 }}>
                        {mit.action}
                      </div>
                      {mit.benefit && (
                        <div style={{ fontSize: '0.73rem', color: '#16a34a', marginTop: '4px', fontWeight: 500 }}>
                          {mit.benefit}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                      Lead: {mit.lead_responsible}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* VISUAL CEREMONY DELAY CASCADE GANTT PROGRESSION CHART */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Ceremony Delay Cascade Progression Chart (+{delayMinutes}m Baraat Impact)
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Visual comparison between Original Master Schedule and Cascaded Adjustments, showing Buffer Compression and Midnight Curfew limit (00:00).
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <span style={{ width: '14px', height: '10px', borderRadius: '3px', background: '#94a3b8' }} />
                  Original Timeline
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5' }}>
                  <span style={{ width: '14px', height: '10px', borderRadius: '3px', background: '#4f46e5' }} />
                  Cascaded / Adjusted
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '2px', background: '#dc2626' }} />
                  00:00 Midnight Curfew
                </span>
              </div>
            </div>

            {/* SVG Gantt Chart */}
            <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
              <div style={{ minWidth: '700px' }}>
                {/* Time Axis Headers (17:00 to 01:00) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '180px repeat(8, 1fr)',
                  borderBottom: '1px solid #cbd5e1',
                  paddingBottom: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#64748b'
                }}>
                  <div>Milestone Event</div>
                  <div style={{ textAlign: 'center' }}>17:00</div>
                  <div style={{ textAlign: 'center' }}>18:00</div>
                  <div style={{ textAlign: 'center' }}>19:00</div>
                  <div style={{ textAlign: 'center' }}>20:00</div>
                  <div style={{ textAlign: 'center' }}>21:00</div>
                  <div style={{ textAlign: 'center' }}>22:00</div>
                  <div style={{ textAlign: 'center' }}>23:00</div>
                  <div style={{ textAlign: 'center', color: '#dc2626' }}>00:00 (Curfew)</div>
                </div>

                {/* Timeline Bars Grid */}
                <div style={{ position: 'relative', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Curfew Vertical Line at 00:00 (7/8ths of the bar width) */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 'calc(180px + (100% - 180px) * 0.875)',
                    width: '2px',
                    background: '#dc2626',
                    zIndex: 10,
                    boxShadow: '0 0 6px rgba(220, 38, 38, 0.4)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-28px',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      Curfew 00:00
                    </div>
                  </div>

                  {/* 1. Baraat Procession */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Baraat Procession
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>Main Gate to Courtyard</div>
                    </div>
                    <div style={{ position: 'relative', height: '40px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {/* Original Bar: 17:00 to 18:30 (1.5h / 8h = 18.75%) */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '0%',
                        width: '18.75%',
                        height: '14px',
                        background: '#cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        17:00 - 18:30
                      </div>
                      {/* Adjusted Bar: 17:45 to 19:15 (start: 0.75h/8h = 9.37%, width: 18.75%) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '9.37%',
                        width: '18.75%',
                        height: '14px',
                        background: '#f59e0b',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        17:45 - 19:15 (+45m)
                      </div>
                    </div>
                  </div>

                  {/* 2. Varmala & Stage Ceremony */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Varmala & Stage
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Buffer Compressed (-20m)</div>
                    </div>
                    <div style={{ position: 'relative', height: '40px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {/* Original: 18:30 to 19:30 (18.75% to 31.25%, width: 12.5%) */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '18.75%',
                        width: '12.5%',
                        height: '14px',
                        background: '#cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        18:30 - 19:30
                      </div>
                      {/* Adjusted: 19:15 to 19:55 (start: 2.25h/8h = 28.12%, width: 0.66h/8h = 8.3%) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '28.12%',
                        width: '8.33%',
                        height: '14px',
                        background: '#4f46e5',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        19:15-19:55
                      </div>
                    </div>
                  </div>

                  {/* 3. Sacred Pheras */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Sacred Pheras
                      <div style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 600 }}>Mahurat Preserved</div>
                    </div>
                    <div style={{ position: 'relative', height: '40px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {/* Original: 19:30 to 22:30 (31.25% to 68.75%, width: 37.5%) */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '31.25%',
                        width: '37.5%',
                        height: '14px',
                        background: '#cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        19:30 - 22:30 (Original)
                      </div>
                      {/* Adjusted: 19:55 to 22:30 (start: 36.4%, width: 32.3%) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '36.45%',
                        width: '32.3%',
                        height: '14px',
                        background: '#10b981',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        19:55 - 22:30 (Protected)
                      </div>
                    </div>
                  </div>

                  {/* 4. Royal Banquet Dinner */}
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      Banquet Dinner
                      <div style={{ fontSize: '0.7rem', color: simulationData?.curfew_risk_detected ? '#dc2626' : '#15803d', fontWeight: 700 }}>
                        {simulationData?.curfew_risk_detected ? 'Overtime Curfew Risk' : 'Safely Pre-Midnight'}
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: '40px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {/* Original: 20:30 to 00:30 */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '43.75%',
                        width: '50%',
                        height: '14px',
                        background: '#cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        20:30 - 00:30 (Original)
                      </div>
                      {/* Mitigated Adjusted Dinner: 20:30 to 23:30 (Snack counters open early at 19:30) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '43.75%',
                        width: '37.5%',
                        height: '14px',
                        background: simulationData?.curfew_risk_detected ? '#ef4444' : '#10b981',
                        borderRadius: '4px',
                        fontSize: '0.66rem',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {simulationData?.curfew_risk_detected ? '21:15 - 01:15 (BREACH)' : '20:30 - 23:30 (SAFE)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Timelines */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Timeline Comparison: Original vs. Proposed Adjusted Timetable
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Proposed schedule optimizes photo sessions and opens snack counters early, ending dinner safely at 23:30.
                </div>
              </div>

              {/* Human Approval Guard & Button */}
              <button
                onClick={() => setShowApprovalModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                <Send size={16} />
                Approve & Broadcast Changes
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Ceremony / Milestone</th>
                    <th style={{ padding: '12px 14px' }}>Venue Location</th>
                    <th style={{ padding: '12px 14px', background: '#f1f5f9' }}>Original Schedule</th>
                    <th style={{ padding: '12px 14px', background: '#eef2ff' }}>Proposed Adjusted Timing</th>
                    <th style={{ padding: '12px 14px' }}>Duration</th>
                    <th style={{ padding: '12px 14px' }}>Variance</th>
                    <th style={{ padding: '12px 14px' }}>Optimization Status</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationData?.original_timeline?.map((orig, idx) => {
                    const prop = simulationData?.proposed_timeline?.find(p => p.id === orig.id) || {};
                    const isDinner = orig.id === 8;

                    return (
                      <tr key={orig.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isDinner ? '#f0fdf4' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                          {orig.event}
                        </td>
                        <td style={{ padding: '14px', color: '#64748b' }}>
                          {orig.venue}
                        </td>
                        <td style={{ padding: '14px', background: '#f8fafc', color: '#64748b', fontWeight: 600 }}>
                          {orig.start} - {orig.end}
                        </td>
                        <td style={{ padding: '14px', background: '#eef2ff', fontWeight: 700, color: '#312e81' }}>
                          {prop.start} - {prop.end}
                        </td>
                        <td style={{ padding: '14px', color: '#334155' }}>
                          {prop.duration_mins} mins
                        </td>
                        <td style={{ padding: '14px' }}>
                          {prop.delta_mins !== 0 ? (
                            <span style={{
                              color: prop.delta_mins > 0 ? '#b91c1c' : '#15803d',
                              fontWeight: 700
                            }}>
                              {prop.delta_mins > 0 ? `+${prop.delta_mins}m` : `${prop.delta_mins}m`}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>0m</span>
                          )}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isDinner ? '#dcfce7' : prop.status?.includes('OPTIMIZED') || prop.status?.includes('COMPRESSED') ? '#e0e7ff' : '#f1f5f9',
                            color: isDinner ? '#15803d' : prop.status?.includes('OPTIMIZED') || prop.status?.includes('COMPRESSED') ? '#4338ca' : '#475569'
                          }}>
                            {prop.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Broadcast History Log */}
            {broadcastHistory.length > 0 && (
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
                  Schedule Revision & Broadcast History Audit Trail (knotcore.wedding.broadcast)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {broadcastHistory.map((item) => (
                    <div key={item.id} style={{
                      background: '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      fontSize: '0.8rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {item.event_delayed} | Status: <span style={{ color: '#16a34a' }}>{item.status}</span>
                        </div>
                        <div style={{ color: '#64748b', marginTop: '2px' }}>
                          {item.broadcast_log}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#4338ca' }}>{item.approved_by || 'Lead Planner'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 4. SUB-TAB 3: EMERGENCY INCIDENT MANAGEMENT */}
      {activeSubTab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Big Day Emergency Incident Management (knotcore.wedding.incident)
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Direct emergency intake from private vendor bot conversations with automated technical lead assignment and live resolution tracking.
                </div>
              </div>

              <button
                onClick={() => setShowNewIncidentModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <ShieldAlert size={15} /> Report New Incident
              </button>
            </div>

            {/* Incidents List */}
            {incidentsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '8px' }} />
                <div>Syncing Odoo Emergency Incidents...</div>
              </div>
            ) : incidents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                <ShieldCheck size={36} color="#16a34a" style={{ marginBottom: '10px' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Zero Open Emergencies</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>All technical systems and vendor stations operating normally.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {incidents.map((inc) => {
                  const isResolved = inc.status === 'RESOLVED';
                  const isCritical = inc.severity === 'CRITICAL';

                  return (
                    <div
                      key={inc.id}
                      style={{
                        background: isResolved ? '#f8fafc' : isCritical ? '#fffaf0' : '#ffffff',
                        border: isResolved ? '1px solid #e2e8f0' : isCritical ? '2px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        boxShadow: isCritical && !isResolved ? '0 4px 14px rgba(239, 68, 68, 0.1)' : 'none'
                      }}
                    >
                      {/* Top Header of Incident */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: '6px' }}>
                              {inc.incident_code}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: inc.severity === 'CRITICAL' ? '#dc2626' : '#f59e0b',
                              color: '#ffffff'
                            }}>
                              {inc.severity}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Reported by: <strong>{inc.vendor_name}</strong>
                            </span>
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                            {inc.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                            {inc.description}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '8px',
                            background: isResolved ? '#dcfce7' : inc.status === 'IN_PROGRESS' ? '#fef3c7' : '#fee2e2',
                            color: isResolved ? '#15803d' : inc.status === 'IN_PROGRESS' ? '#b45309' : '#b91c1c'
                          }}>
                            {isResolved && <CheckCircle2 size={14} />}
                            {inc.status}
                          </span>
                        </div>
                      </div>

                      {/* Technical Lead Assignment Box */}
                      <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '12px',
                        fontSize: '0.8rem'
                      }}>
                        <div>
                          <span style={{ color: '#64748b' }}>Assigned Technical Lead:</span>
                          <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            {inc.assigned_lead} ({inc.assigned_lead_role})
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#4f46e5', marginTop: '2px' }}>
                            <PhoneCall size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {inc.assigned_lead_phone}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>Site Location:</span>
                          <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>
                            <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} color="#dc2626" />
                            {inc.location}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#64748b' }}>Action & Current Status:</span>
                          <div style={{ color: '#334155', marginTop: '2px', lineHeight: 1.3 }}>
                            {inc.action_taken || 'Site response crew assigned.'}
                          </div>
                        </div>
                      </div>

                      {/* Live Updates Chronological Log */}
                      {inc.live_updates && inc.live_updates.length > 0 && (
                        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.76rem' }}>
                          <div style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Live Response Log:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {inc.live_updates.map((log, lidx) => (
                              <div key={lidx} style={{ display: 'flex', gap: '10px', color: '#334155' }}>
                                <span style={{ fontWeight: 700, color: '#4f46e5' }}>{log.time}</span>
                                <span>{log.event}</span>
                                <span style={{ color: '#94a3b8' }}>({log.lead})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Incident Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        {inc.status === 'OPEN' && (
                          <button
                            disabled={updatingIncidentId === inc.id}
                            onClick={() => handleUpdateIncidentStatus(
                              inc.id, 
                              'IN_PROGRESS', 
                              'Lead dispatched to site with secondary equipment unit.'
                            )}
                            style={{
                              padding: '7px 16px',
                              borderRadius: '8px',
                              background: '#f59e0b',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Mark In Progress (Dispatch Team)
                          </button>
                        )}

                        {inc.status !== 'RESOLVED' && (
                          <button
                            disabled={updatingIncidentId === inc.id}
                            onClick={() => handleUpdateIncidentStatus(
                              inc.id, 
                              'RESOLVED', 
                              'Backup Cummins 65kVA generator online. Mandap power supply normal at 230V.'
                            )}
                            style={{
                              padding: '7px 16px',
                              borderRadius: '8px',
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Resolve & Close Incident
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 5. MODAL: VENDOR CHECK-IN SCANNER SIMULATOR */}
      {selectedVendorForCheckin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>
                  PRIVATE TELEGRAM VENDOR BOT INTERFACE
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Vendor Attendance & Identity Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedVendorForCheckin(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                {selectedVendorForCheckin.vendor_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Category: <strong>{selectedVendorForCheckin.category_name}</strong> | Call Time: <strong>{selectedVendorForCheckin.call_time}</strong>
              </div>
            </div>

            {/* Scannable QR & OTP Display */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#eef2ff', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              {selectedVendorForCheckin.qr_code_data_url && (
                <img
                  src={selectedVendorForCheckin.qr_code_data_url}
                  alt="QR Code"
                  style={{ width: '90px', height: '90px', borderRadius: '8px', border: '1px solid #c7d2fe', background: '#ffffff', padding: '4px' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.76rem', color: '#4338ca', fontWeight: 700 }}>DYNAMIC BADGE CREDENTIALS</div>
                <div style={{ fontSize: '0.84rem', color: '#1e1b4b', marginTop: '4px' }}>
                  Token: <code>{selectedVendorForCheckin.qr_token}</code>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                  OTP PIN: {selectedVendorForCheckin.otp_code}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6366f1', marginTop: '2px' }}>
                  Scanned via @Royalknot_vendors_bot Telegram Engine
                </div>
              </div>
            </div>

            <form onSubmit={handleVerifyAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Scanned QR Token:
                </label>
                <input
                  type="text"
                  value={checkinForm.qr_token}
                  onChange={(e) => setCheckinForm({ ...checkinForm, qr_token: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Required 6-Digit OTP:
                </label>
                <input
                  type="text"
                  value={checkinForm.otp_code}
                  onChange={(e) => setCheckinForm({ ...checkinForm, otp_code: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    GPS Latitude:
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={checkinForm.gps_lat}
                    onChange={(e) => setCheckinForm({ ...checkinForm, gps_lat: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    GPS Longitude:
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={checkinForm.gps_lng}
                    onChange={(e) => setCheckinForm({ ...checkinForm, gps_lng: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Live Geo-Tagged Photo Proof URL:
                </label>
                <input
                  type="text"
                  value={checkinForm.photo_proof_url}
                  onChange={(e) => setCheckinForm({ ...checkinForm, photo_proof_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              {/* Result Banner */}
              {checkinResult && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: checkinResult.success ? '#dcfce7' : '#fee2e2',
                  color: checkinResult.success ? '#15803d' : '#b91c1c',
                  border: checkinResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca'
                }}>
                  {checkinResult.success ? checkinResult.message : checkinResult.error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedVendorForCheckin(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkinLoading}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {checkinLoading ? 'Verifying with Odoo...' : 'Verify Attendance & Commit to Odoo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: HUMAN APPROVAL & MULTI-CHANNEL BROADCAST */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            maxWidth: '540px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>
                  HUMAN APPROVAL CONTROL GUARD
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Approve & Broadcast Schedule Changes
                </h3>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
              <strong>Strict Odoo Policy:</strong> Schedule changes are never dispatched automatically. Your explicit sign-off commits these revised timings to <code>knotcore.wedding.broadcast</code> and pushes real-time notifications to:
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#475569' }}>
                <li>18 Assigned Vendors via Private Bot (@Royalknot_vendors_bot)</li>
                <li>24 Royal Family VIPs via Concierge Bot (@Royalknot_bot)</li>
                <li>Lead Planner SMS & Email Dispatch Archive</li>
              </ul>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Approving Lead Planner:
              </label>
              <input
                type="text"
                value={plannerName}
                onChange={(e) => setPlannerName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={broadcastLoading}
                onClick={handleApproveAndBroadcast}
                style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {broadcastLoading ? 'Broadcasting to Channels...' : 'Sign & Broadcast Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: REPORT VENDOR EMERGENCY */}
      {showNewIncidentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>
                  EMERGENCY INCIDENT MANAGEMENT
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Report Urgent Site Emergency
                </h3>
              </div>
              <button
                onClick={() => setShowNewIncidentModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReportEmergency} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Reporting Vendor:
                </label>
                <select
                  value={newIncidentForm.vendor_name}
                  onChange={(e) => {
                    const sel = arrivalsData?.arrivals?.find(a => a.vendor_name === e.target.value);
                    setNewIncidentForm({
                      ...newIncidentForm,
                      vendor_name: e.target.value,
                      vendor_id: sel ? sel.vendor_id : 102
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  {arrivalsData?.arrivals?.map(a => (
                    <option key={a.id} value={a.vendor_name}>{a.vendor_name} ({a.category_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Emergency Title (e.g. Florist requesting emergency generator):
                </label>
                <input
                  type="text"
                  value={newIncidentForm.title}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, title: e.target.value })}
                  placeholder="e.g. Florist requests emergency 45kVA generator"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Technical Description:
                </label>
                <textarea
                  rows="3"
                  value={newIncidentForm.description}
                  onChange={(e) => setNewIncidentForm({ ...newIncidentForm, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Severity Level:
                  </label>
                  <select
                    value={newIncidentForm.severity}
                    onChange={(e) => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Action)</option>
                    <option value="HIGH">HIGH (Under 15 Mins)</option>
                    <option value="MEDIUM">MEDIUM (Standard Contingency)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Palace Location:
                  </label>
                  <input
                    type="text"
                    value={newIncidentForm.location}
                    onChange={(e) => setNewIncidentForm({ ...newIncidentForm, location: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingIncident}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {reportingIncident ? 'Dispatching Lead...' : 'Submit Emergency to Lead Planner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
