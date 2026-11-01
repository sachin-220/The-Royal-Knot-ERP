import React, { useState, useEffect } from 'react';
import { 
  Receipt, ShieldCheck, AlertTriangle, CheckCircle2, Clock, 
  TrendingUp, RefreshCw, FileText, X, Plus, AlertOctagon,
  Users, QrCode, DollarSign, Calculator, Lock, Ban, ArrowRight,
  ShieldAlert, Sparkles, Building2, Eye, Check,
  BarChart3, PieChart, Activity
} from 'lucide-react';

export default function FinanceSettlementView({ weddingId = 1 }) {
  const [activeSubTab, setActiveSubTab] = useState('wristbands'); // 'wristbands' | 'variations' | 'threeway' | 'leakage' | 'settlement'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [wristbandsData, setWristbandsData] = useState(null);
  const [variationsData, setVariationsData] = useState(null);
  const [clientInvoices, setClientInvoices] = useState(null);
  const [threeWayData, setThreeWayData] = useState(null);
  const [leakageData, setLeakageData] = useState(null);
  const [settlementData, setSettlementData] = useState(null);

  // Scanner Simulator State
  const [scanInputCode, setScanInputCode] = useState('PASS-VIP-001');
  const [scanGate, setScanGate] = useState('Palace Toran Gate');
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [selectedWristbandForQR, setSelectedWristbandForQR] = useState(null);

  // New Variation Modal State
  const [showNewVarModal, setShowNewVarModal] = useState(false);
  const [newVarForm, setNewVarForm] = useState({
    item_description: '',
    category: 'Royal Banqueting & Catering',
    vendor_name: 'Silver Spoon Imperial Banqueting',
    quantity: 60,
    unit_rate: 2500,
    evidence_notes: 'Unannounced outstation guests arrived during Varmala. Head Steward verified 60 extra covers.',
    requested_by: 'Digvijay Singh Rathore (Host)'
  });
  const [addingVar, setAddingVar] = useState(false);

  // Supplementary Invoicing State
  const [selectedVarIdsForInvoice, setSelectedVarIdsForInvoice] = useState([]);
  const [invoicingLoading, setInvoicingLoading] = useState(false);

  // 3-Way Match Review State
  const [updatingMatchId, setUpdatingMatchId] = useState(null);

  const fetchAllFinanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resWrist, resVars, resInvs, resMatch, resLeak, resSett] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/scene5/wristbands/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene5/variations/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene5/client-invoices/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene5/three-way-matches/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene5/leakage-alerts/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene5/settlements/${weddingId}`)
      ]);

      const wData = await resWrist.json();
      const vData = await resVars.json();
      const iData = await resInvs.json();
      const mData = await resMatch.json();
      const lData = await resLeak.json();
      const sData = await resSett.json();

      setWristbandsData(wData);
      setVariationsData(vData);
      setClientInvoices(iData);
      setThreeWayData(mData);
      setLeakageData(lData);
      setSettlementData(sData);

      // Pre-select approved unbilled variations
      if (vData?.variations) {
        const unbilledApproved = vData.variations
          .filter(v => v.status === 'approved' && !v.supplementary_invoice_ref)
          .map(v => v.id);
        setSelectedVarIdsForInvoice(unbilledApproved);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFinanceData();
  }, [weddingId]);

  // Handle Wristband Scan
  const handleScanWristband = async (codeToScan = scanInputCode) => {
    try {
      setScanLoading(true);
      setScanResult(null);

      const res = await fetch('http://127.0.0.1:5000/api/scene5/scan-wristband', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          wristband_code: codeToScan,
          gate_name: scanGate
        })
      });

      const data = await res.json();
      setScanResult(data);

      // Refresh wristbands count
      fetch(`http://127.0.0.1:5000/api/scene5/wristbands/${weddingId}`)
        .then(r => r.json())
        .then(d => setWristbandsData(d));

      fetch(`http://127.0.0.1:5000/api/scene5/leakage-alerts/${weddingId}`)
        .then(r => r.json())
        .then(d => setLeakageData(d));
    } catch (err) {
      setScanResult({ success: false, error: err.message });
    } finally {
      setScanLoading(false);
    }
  };

  // Handle Add Variation
  const handleAddVariation = async (e) => {
    e.preventDefault();
    try {
      setAddingVar(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene5/add-variation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          item_description: newVarForm.item_description,
          category: newVarForm.category,
          vendor_name: newVarForm.vendor_name,
          quantity: parseInt(newVarForm.quantity),
          unit_rate: parseFloat(newVarForm.unit_rate),
          evidence_notes: newVarForm.evidence_notes,
          requested_by: newVarForm.requested_by
        })
      });

      if (res.ok) {
        setShowNewVarModal(false);
        setNewVarForm({
          item_description: '',
          category: 'Royal Banqueting & Catering',
          vendor_name: 'Silver Spoon Imperial Banqueting',
          quantity: 1,
          unit_rate: 0,
          evidence_notes: '',
          requested_by: 'Host / Couple'
        });
        fetchAllFinanceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingVar(false);
    }
  };

  // Handle Approve Variation
  const handleApproveVariation = async (varId) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/scene5/approve-variation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variation_id: varId,
          approved_by: 'Lead Planner Sachin Priya'
        })
      });

      if (res.ok) {
        fetchAllFinanceData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Generate Supplementary Invoice
  const handleGenerateSupplementaryInvoice = async () => {
    if (selectedVarIdsForInvoice.length === 0) return;
    try {
      setInvoicingLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene5/generate-supplementary-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          variation_ids: selectedVarIdsForInvoice,
          planner_name: 'Lead Planner Sachin Priya'
        })
      });

      if (res.ok) {
        fetchAllFinanceData();
        setSelectedVarIdsForInvoice([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicingLoading(false);
    }
  };

  // Handle Update 3-Way Match Status
  const handleUpdateMatchStatus = async (matchId, newStatus, noteText) => {
    try {
      setUpdatingMatchId(matchId);
      const res = await fetch('http://127.0.0.1:5000/api/scene5/update-three-way-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          status: newStatus,
          notes: noteText,
          reviewer_name: 'Lead Planner Sachin Priya'
        })
      });

      if (res.ok) {
        fetchAllFinanceData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingMatchId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* StockSense Breadcrumbs, Serif Heading, Subtitle & Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
            <span>KnotCore</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span>Intelligence</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#18181b', fontWeight: 600 }}>3-Way PO Settlement</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Finance Settlements & 3-Way PO Audit
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Three-way PO matching (PO vs Delivery vs Invoice), live variation logging, and leakage control.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchAllFinanceData}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            <RefreshCw size={13} /> Sync Ledgers
          </button>
          <button
            onClick={() => setShowNewVarModal(true)}
            className="btn-dark-pill"
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            <Plus size={14} /> Record On-Site Variation
          </button>
        </div>
      </div>

      {/* 5 StockSense KPI Cards with Yellow Icon Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        {/* Verified Guests */}
        <div className="stocksense-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={15} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
              Verified Guests
            </span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
            {wristbandsData?.summary?.verified_scanned_in || 0} / {wristbandsData?.summary?.total_registered_guests || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            {wristbandsData?.summary?.blocked_duplicates_count || 0} duplicates blocked
          </div>
        </div>

        {/* On-Site Variations */}
        <div className="stocksense-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={15} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
              Live Variations
            </span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
            ₹{((variationsData?.summary?.total_variation_inr || 0) / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '4px' }}>
            Approved: ₹{((variationsData?.summary?.approved_variation_inr || 0) / 100000).toFixed(2)} L
          </div>
        </div>

        {/* 3-Way Match Discrepancies */}
        <div className="stocksense-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={15} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
              3-Way Match Holds
            </span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
            {threeWayData?.summary?.held_discrepancies_count || 0} Invoices
          </div>
          <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 500, marginTop: '4px' }}>
            ₹{((threeWayData?.summary?.total_discrepancies_held_inr || 0) / 100000).toFixed(2)} L blocked
          </div>
        </div>

        {/* Financial Leakage Prevented */}
        <div className="stocksense-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={15} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
              Leakage Prevented
            </span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#16a34a', marginTop: '10px', letterSpacing: '-0.02em' }}>
            ₹{((leakageData?.leakage_detector?.total_leakage_prevented_inr || 0) / 100000).toFixed(2)} L
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            Duplicates + overages
          </div>
        </div>

        {/* True Net Profit & Margin */}
        <div className="stocksense-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 500 }}>
              True Net Margin
            </span>
          </div>
          <div style={{ fontSize: '1.55rem', fontWeight: 600, color: '#18181b', marginTop: '10px', letterSpacing: '-0.02em' }}>
            {settlementData?.profitability_waterfall?.true_net_margin_pct || 21.61}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            ₹{((settlementData?.profitability_waterfall?.true_net_profit_inr || 0) / 100000).toFixed(2)} L profit
          </div>
        </div>
      </div>

      {/* Analytical Visualisations: Revenue vs Expenditure & 3-Way Match Audit Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        {/* Chart A: Revenue vs Expenditure Waterfall Progress */}
        <div className="stocksense-card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                Revenue vs Expenditure Flow
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#71717a', margin: '2px 0 0' }}>
                Disbursements, supplementary recovery, and net margin retention
              </p>
            </div>
            <span className="badge-sku" style={{ fontSize: '0.68rem' }}>₹2.5 Cr Target</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                <span style={{ color: '#27272a', fontWeight: 500 }}>Vendor Direct Disbursals</span>
                <span style={{ color: '#18181b', fontWeight: 700 }}>₹1.54 Cr (61.6%)</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#f4f4f5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '61.6%', height: '100%', background: '#4f46e5', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                <span style={{ color: '#27272a', fontWeight: 500 }}>Approved Variations & Extras</span>
                <span style={{ color: '#18181b', fontWeight: 700 }}>₹18.5 L (7.4%)</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#f4f4f5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '7.4%', height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                <span style={{ color: '#27272a', fontWeight: 500 }}>Retained True Net Profit</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>₹54.0 L (21.6%)</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: '#f4f4f5', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '21.6%', height: '100%', background: '#10b981', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart B: 3-Way Match & Anti-Duplicate Security Shield */}
        <div className="stocksense-card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#18181b', margin: 0 }}>
                  Audit & Leakage Guard
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#71717a', margin: '2px 0 0' }}>
                  PO verification and Toran gate anti-duplicate enforcement
                </p>
              </div>
              <span className="status-pill status-pill-green" style={{ fontSize: '0.68rem' }}>100% Shielded</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>3-Way PO Verified</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', marginTop: '2px' }}>12 / 12</div>
                <div style={{ fontSize: '0.66rem', color: '#16a34a', marginTop: '2px' }}>Zero unit mismatches</div>
              </div>
              <div style={{ padding: '10px 12px', background: '#fafafa', borderRadius: '8px', border: '1px solid #f4f4f5' }}>
                <div style={{ fontSize: '0.68rem', color: '#71717a' }}>Leakage Blocked</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>₹18.2 L</div>
                <div style={{ fontSize: '0.66rem', color: '#16a34a', marginTop: '2px' }}>Unapproved line items</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f4f4f5', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
            <span style={{ color: '#71717a' }}>Gate Headcount Sync:</span>
            <span style={{ fontWeight: 700, color: '#18181b' }}>300 Checked In (0 Duplicates)</span>
          </div>
        </div>
      </div>

        {/* Sub-Tabs Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('wristbands')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'wristbands' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'wristbands' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <QrCode size={16} />
            Smart Guests & Anti-Duplicate Scanner
          </button>

          <button
            onClick={() => setActiveSubTab('variations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'variations' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'variations' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <Receipt size={16} />
            Live Variation Ledger & Supplementary Billing
          </button>

          <button
            onClick={() => setActiveSubTab('threeway')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'threeway' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'threeway' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={16} />
            Automated 3-Way Matching Auditor
            {threeWayData?.summary?.held_discrepancies_count > 0 && (
              <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px' }}>
                {threeWayData.summary.held_discrepancies_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('leakage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'leakage' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'leakage' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <AlertTriangle size={16} />
            Financial Leakage & Advance Due Alerts
          </button>

          <button
            onClick={() => setActiveSubTab('settlement')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: activeSubTab === 'settlement' ? '#4f46e5' : '#f1f5f9',
              color: activeSubTab === 'settlement' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <Calculator size={16} />
            Vendor Settlements & Profitability Waterfall
          </button>
        </div>

      {/* 2. SUB-TAB 1: SMART GUEST COUNT & ANTI-DUPLICATE SCANNER */}
      {activeSubTab === 'wristbands' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Interactive Gate Scanner Simulator */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Anti-Duplicate QR Wristband Gate Scanner Terminal
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Scans entry QR wristbands. Validates single redemption; immediately intercepts and blocks forwarded screenshot QR codes or wristband pass-back fraud.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Active Gate:</span>
                <select
                  value={scanGate}
                  onChange={(e) => setScanGate(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#f8fafc' }}
                >
                  <option value="Palace Toran Gate">Palace Toran Gate</option>
                  <option value="VVIP Porch Gate">VVIP Porch Gate</option>
                  <option value="Lakeside Promenade Gate">Lakeside Promenade Gate</option>
                  <option value="North Service Gate">North Service Gate</option>
                </select>
              </div>
            </div>

            {/* VISUAL GATE THROUGHPUT VELOCITY GAUGE & CAPACITY VISUALIZER */}
            {(() => {
              const capacity = wristbandsData?.guest_capacity || 600;
              const current = wristbandsData?.official_guest_count || 660;
              const blocked = wristbandsData?.blocked_duplicate_scans || 12;
              const fillPct = Math.min(130, Math.round((current / capacity) * 100));
              const surgeCovers = Math.max(0, current - capacity);

              return (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="#4f46e5" />
                      <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                        Gate Capacity & Attendance Velocity Gauge
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem' }}>
                      <span style={{ color: '#64748b' }}>Capacity Limit: <strong>{capacity}</strong></span>
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>Scanned: <strong>{current} ({fillPct}%)</strong></span>
                      {surgeCovers > 0 && (
                        <>
                          <span style={{ color: '#94a3b8' }}>|</span>
                          <span style={{ color: '#ea580c', fontWeight: 800 }}>Surge: +{surgeCovers} Covers</span>
                        </>
                      )}
                      <span style={{ color: '#94a3b8' }}>|</span>
                      <span style={{ color: '#dc2626', fontWeight: 800 }}>Fraud Blocked: {blocked}</span>
                    </div>
                  </div>

                  {/* Horizontal Capacity Bar with 100% threshold */}
                  <div style={{ position: 'relative', height: '14px', background: '#e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
                    {/* Normal base capacity fill */}
                    <div style={{
                      width: `${Math.min(100, fillPct)}%`,
                      height: '100%',
                      background: fillPct > 100 ? '#10b981' : '#4f46e5',
                      borderRadius: '7px 0 0 7px'
                    }} />
                    {/* Surge portion if > 100% */}
                    {fillPct > 100 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: '77%',
                        width: `${Math.min(23, fillPct - 100)}%`,
                        height: '100%',
                        background: '#f97316'
                      }} />
                    )}
                  </div>

                  {/* Tick Marks & Scale */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                    <span>0 Guests</span>
                    <span>300 (50%)</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>600 (100% Capacity Contracted)</span>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>660 (110% Over-Capacity Surge)</span>
                  </div>
                </div>
              );
            })()}

            {/* Quick Test Trigger Controls */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <input
                  type="text"
                  value={scanInputCode}
                  onChange={(e) => setScanInputCode(e.target.value)}
                  placeholder="Enter Wristband Code (e.g. PASS-VIP-001 or PASS-OUT-045)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                disabled={scanLoading}
                onClick={() => handleScanWristband(scanInputCode)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                {scanLoading ? 'Validating...' : 'Scan & Validate Wristband'}
              </button>
              <button
                onClick={() => {
                  setScanInputCode('PASS-VIP-001');
                  handleScanWristband('PASS-VIP-001');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #fca5a5',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Simulate Duplicate Forward Fraud (PASS-VIP-001)
              </button>
            </div>

            {/* Scan Output Banner */}
            {scanResult && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '12px',
                marginTop: '10px',
                background: scanResult.is_duplicate_blocked ? '#fef2f2' : scanResult.success ? '#f0fdf4' : '#fee2e2',
                border: scanResult.is_duplicate_blocked ? '2px solid #ef4444' : scanResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                {scanResult.is_duplicate_blocked ? (
                  <Ban size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : scanResult.success ? (
                  <CheckCircle2 size={22} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: scanResult.is_duplicate_blocked ? '#991b1b' : scanResult.success ? '#15803d' : '#991b1b'
                  }}>
                    {scanResult.is_duplicate_blocked
                      ? 'FRAUD ATTEMPT INTERCEPTED: DUPLICATE ENTRY BLOCKED'
                      : scanResult.success
                      ? 'GUEST ENTRY AUTHORIZED'
                      : 'SCAN ERROR'}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', color: scanResult.is_duplicate_blocked ? '#b91c1c' : '#334155' }}>
                    {scanResult.message || scanResult.error}
                  </div>
                  {scanResult.is_duplicate_blocked && (
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fecaca', color: '#7f1d1d' }}>
                      <strong>Financial Protection:</strong> Prevented ₹{scanResult.leakage_prevented_inr} unearned banquet plate cost leakage. Logged to Odoo fraud audit trail.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guest Wristband Database Table */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              Guest Wristband Master Registry & Anti-Duplicate Tracker
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Wristband Code</th>
                    <th style={{ padding: '12px 14px' }}>Guest Name</th>
                    <th style={{ padding: '12px 14px' }}>Category</th>
                    <th style={{ padding: '12px 14px' }}>Seats</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Scan Timestamp</th>
                    <th style={{ padding: '12px 14px' }}>Gate</th>
                    <th style={{ padding: '12px 14px' }}>Blocked Duplicates</th>
                    <th style={{ padding: '12px 14px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wristbandsData?.wristbands?.map((w, idx) => {
                    const isScanned = w.status === 'SCANNED_IN';
                    const hasBlocked = w.blocked_duplicate_attempts > 0;

                    return (
                      <tr key={w.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: hasBlocked ? '#fffaf0' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4f46e5' }}>
                          <code>{w.wristband_code}</code>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                          {w.guest_name}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {w.category}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          {w.seats_allocated}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isScanned ? '#dcfce7' : '#f1f5f9',
                            color: isScanned ? '#15803d' : '#64748b'
                          }}>
                            {isScanned ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {w.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                          {w.scanned_at ? new Date(w.scanned_at).toLocaleTimeString() : 'Pending'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          {w.gate_scanned || '-'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {hasBlocked ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              <Ban size={12} /> {w.blocked_duplicate_attempts} Blocked
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>0</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => setSelectedWristbandForQR(w)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#f1f5f9',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                          >
                            <QrCode size={13} /> View QR
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Blocked Duplicate Scans Audit Log */}
            {wristbandsData?.blocked_attempts?.length > 0 && (
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#991b1b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} color="#dc2626" />
                  Blocked Duplicate Entry Audit Trail (knotcore_blocked_duplicate_scans)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wristbandsData.blocked_attempts.map((b) => (
                    <div key={b.id} style={{
                      background: '#fef2f2',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '0.78rem'
                    }}>
                      <div>
                        <span style={{ fontWeight: 700, color: '#7f1d1d' }}>{b.wristband_code}</span> ({b.guest_name}) - Blocked at <strong>{b.gate_attempted}</strong>
                        <div style={{ color: '#b91c1c', marginTop: '2px' }}>{b.fraud_reason}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: '#15803d' }}>+₹{b.leakage_prevented_inr} Saved</span>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(b.blocked_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. SUB-TAB 2: LIVE VARIATION LEDGER & NON-DESTRUCTIVE CLIENT INVOICING */}
      {activeSubTab === 'variations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Live On-Site Variation Ledger (knotcore.wedding.variation)
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Records unforeseen ceremony extensions, extra banquet plates, and emergency fuel rentals. Automatically calculates totals and links to non-destructive supplementary client invoices.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={selectedVarIdsForInvoice.length === 0 || invoicingLoading}
                  onClick={handleGenerateSupplementaryInvoice}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: selectedVarIdsForInvoice.length > 0 ? '#16a34a' : '#cbd5e1',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: selectedVarIdsForInvoice.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: selectedVarIdsForInvoice.length > 0 ? '0 2px 8px rgba(22, 163, 74, 0.25)' : 'none'
                  }}
                >
                  <Receipt size={15} />
                  {invoicingLoading ? 'Generating Invoice...' : `Bill Selected (${selectedVarIdsForInvoice.length}) to Supplementary Invoice`}
                </button>
              </div>
            </div>

            {/* Variations Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px', width: '36px' }}>
                      <input
                        type="checkbox"
                        checked={variationsData?.variations?.filter(v => v.status === 'approved' && !v.supplementary_invoice_ref).length > 0 && selectedVarIdsForInvoice.length === variationsData?.variations?.filter(v => v.status === 'approved' && !v.supplementary_invoice_ref).length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const ids = variationsData.variations.filter(v => v.status === 'approved' && !v.supplementary_invoice_ref).map(v => v.id);
                            setSelectedVarIdsForInvoice(ids);
                          } else {
                            setSelectedVarIdsForInvoice([]);
                          }
                        }}
                      />
                    </th>
                    <th style={{ padding: '12px 14px' }}>Code</th>
                    <th style={{ padding: '12px 14px' }}>Item Description</th>
                    <th style={{ padding: '12px 14px' }}>Category & Vendor</th>
                    <th style={{ padding: '12px 14px' }}>Quantity</th>
                    <th style={{ padding: '12px 14px' }}>Unit Rate</th>
                    <th style={{ padding: '12px 14px' }}>Total Amount</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px' }}>Supplementary Invoice</th>
                    <th style={{ padding: '12px 14px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {variationsData?.variations?.map((v, idx) => {
                    const isApproved = v.status === 'approved';
                    const isSelected = selectedVarIdsForInvoice.includes(v.id);

                    return (
                      <tr key={v.id} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: v.supplementary_invoice_ref ? '#f0fdf4' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}>
                        <td style={{ padding: '12px 14px' }}>
                          <input
                            type="checkbox"
                            disabled={!isApproved || !!v.supplementary_invoice_ref}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVarIdsForInvoice([...selectedVarIdsForInvoice, v.id]);
                              } else {
                                setSelectedVarIdsForInvoice(selectedVarIdsForInvoice.filter(id => id !== v.id));
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4f46e5' }}>
                          <code>{v.variation_code}</code>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a', maxWidth: '260px' }}>
                          {v.item_description}
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            Req by: {v.requested_by}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          <div>{v.category}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{v.vendor_name || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                          {v.quantity}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>
                          ₹{parseFloat(v.unit_rate).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                          ₹{parseFloat(v.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: isApproved ? '#dcfce7' : '#fef3c7',
                            color: isApproved ? '#15803d' : '#b45309'
                          }}>
                            {v.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {v.supplementary_invoice_ref ? (
                            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.78rem' }}>
                              {v.supplementary_invoice_ref}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Unbilled</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {!isApproved && (
                            <button
                              onClick={() => handleApproveVariation(v.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#4f46e5',
                                color: '#ffffff',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Non-Destructive Invoicing Audit Section */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Lock size={18} color="#4f46e5" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Non-Destructive Invoicing Architecture (Original Contract vs Supplementary Invoices)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {/* Original Invoice Card */}
                {clientInvoices?.original_invoice && (
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {clientInvoices.original_invoice.invoice_number}
                      </span>
                      <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        CONFIRMED & IMMUTABLE
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {clientInvoices.original_invoice.description}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#64748b' }}>Contract Value:</span>
                      <strong style={{ color: '#0f172a' }}>₹{(clientInvoices.original_invoice.contract_value_inr / 10000000).toFixed(2)} Cr</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginTop: '4px' }}>
                      <span style={{ color: '#64748b' }}>Advance Paid (30%):</span>
                      <strong style={{ color: '#16a34a' }}>₹{(clientInvoices.original_invoice.advance_paid_inr / 100000).toFixed(2)} Lakhs</strong>
                    </div>
                  </div>
                )}

                {/* Supplementary Invoices Card */}
                {clientInvoices?.supplementary_invoices?.map((supp) => (
                  <div key={supp.id} style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                        {supp.invoice_number}
                      </span>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        POSTED SUPPLEMENTARY
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      Linked Variations: {supp.linked_variation_codes?.join(', ')}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span style={{ color: '#166534' }}>Subtotal (Excl Tax):</span>
                      <strong style={{ color: '#0f172a' }}>₹{parseFloat(supp.subtotal_inr).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginTop: '4px' }}>
                      <span style={{ color: '#166534' }}>GST (18%):</span>
                      <strong style={{ color: '#64748b' }}>₹{parseFloat(supp.tax_inr).toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '6px', borderTop: '1px dashed #bbf7d0', paddingTop: '6px' }}>
                      <span style={{ color: '#15803d', fontWeight: 700 }}>Total Billed:</span>
                      <strong style={{ color: '#15803d' }}>₹{parseFloat(supp.total_inr).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. SUB-TAB 3: AUTOMATED 3-WAY MATCHING AUDITOR */}
      {activeSubTab === 'threeway' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Automated 3-Way Matching Engine (Quotation vs. PO vs. Submitted Bill)
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Audits vendor invoices against signed quotations and authorized Purchase Orders. Flags unauthorized markups, phantom plate overruns, and unapproved logistics fees before payment authorization.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {threeWayData?.matches?.map((match) => {
                const isHeld = match.match_status === 'DISCREPANCY_HELD';
                const isClean = match.match_status === 'MATCHED_CLEAN';
                const hasFlags = match.discrepancy_flags && match.discrepancy_flags.length > 0;

                return (
                  <div
                    key={match.id}
                    style={{
                      background: isHeld ? '#fffaf0' : isClean ? '#fcfdfd' : '#ffffff',
                      border: isHeld ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* Top: Vendor Info & Match Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>
                          {match.category}
                        </span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                          {match.vendor_name}
                        </div>
                      </div>

                      <div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '8px',
                          background: isClean ? '#dcfce7' : isHeld ? '#fef3c7' : '#fee2e2',
                          color: isClean ? '#15803d' : isHeld ? '#b45309' : '#b91c1c'
                        }}>
                          {isClean ? <CheckCircle2 size={14} /> : <AlertOctagon size={14} />}
                          {match.match_status}
                        </span>
                      </div>
                    </div>

                    {/* 3-Column Comparative Grid: Quote vs PO vs Bill */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '12px',
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem'
                    }}>
                      {/* Column 1: Quotation */}
                      <div>
                        <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>1. Signed Quotation</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{match.quote_ref}</div>
                        <div style={{ color: '#475569', marginTop: '2px' }}>Qty: {match.quote_quantity} × ₹{parseFloat(match.quote_unit_rate).toLocaleString('en-IN')}</div>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Total: ₹{parseFloat(match.quote_total).toLocaleString('en-IN')}</div>
                      </div>

                      {/* Column 2: Approved PO */}
                      <div>
                        <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>2. Approved Purchase Order</div>
                        <div style={{ fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>{match.po_ref}</div>
                        <div style={{ color: '#475569', marginTop: '2px' }}>Qty: {match.po_quantity} × ₹{parseFloat(match.po_unit_rate).toLocaleString('en-IN')}</div>
                        <div style={{ fontWeight: 700, color: '#4f46e5', marginTop: '4px' }}>Total: ₹{parseFloat(match.po_total).toLocaleString('en-IN')}</div>
                      </div>

                      {/* Column 3: Submitted Invoice */}
                      <div>
                        <div style={{ fontWeight: 700, color: isHeld ? '#b45309' : '#64748b', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                          3. Submitted Vendor Invoice
                        </div>
                        <div style={{ fontWeight: 800, color: isHeld ? '#dc2626' : '#0f172a', marginTop: '4px' }}>{match.invoice_ref}</div>
                        <div style={{ color: '#475569', marginTop: '2px' }}>Qty: {match.invoice_quantity} × ₹{parseFloat(match.invoice_unit_rate).toLocaleString('en-IN')}</div>
                        <div style={{ fontWeight: 700, color: isHeld ? '#dc2626' : '#0f172a', marginTop: '4px' }}>
                          Total: ₹{parseFloat(match.invoice_total).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Discrepancy Warnings Box */}
                    {hasFlags && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
                          Discrepancies Caught by 3-Way Auditor:
                        </div>
                        {match.discrepancy_flags.map((flag, fidx) => (
                          <div key={fidx} style={{ color: '#b91c1c', marginTop: '2px' }}>
                            • {flag}
                          </div>
                        ))}
                        {match.surcharge_description && (
                          <div style={{ color: '#7f1d1d', marginTop: '4px', fontWeight: 600 }}>
                            Unapproved Extra: {match.surcharge_description}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reviewer Audit Notes */}
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <strong>Audit Note:</strong> {match.reviewer_notes}
                      </div>

                      {/* Control Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isHeld && (
                          <>
                            <button
                              disabled={updatingMatchId === match.id}
                              onClick={() => handleUpdateMatchStatus(match.id, 'MANAGEMENT_OVERRIDE', 'Approved by Senior Partner following host verbal sign-off.')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#334155',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Management Override
                            </button>
                            <button
                              disabled={updatingMatchId === match.id}
                              onClick={() => handleUpdateMatchStatus(match.id, 'REJECTED', 'Invoice returned to vendor for line item credit note.')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#dc2626',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Reject & Return to Vendor
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 5. SUB-TAB 4: FINANCIAL LEAKAGE DETECTOR & 7-DAY PAYMENT RISK ALERTS */}
      {activeSubTab === 'leakage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Formula Breakdown Card */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldCheck size={22} color="#15803d" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                Financial Leakage Prevention Engine
              </h3>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#166534', marginBottom: '18px' }}>
              <code>Leakage Prevented = Blocked Duplicates + Unapproved Extras Caught + Unbilled Guest Overages Recaptured</code>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>1. Blocked Duplicates</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  ₹{(leakageData?.leakage_detector?.blocked_duplicates_inr || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '2px' }}>
                  Prevented forwarded screenshot entries
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>2. Unapproved Extras Caught</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  ₹{(leakageData?.leakage_detector?.unapproved_extras_caught_inr || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '2px' }}>
                  Intercepted by 3-Way Match Auditor
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>3. Recaptured Guest Overages</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                  ₹{(leakageData?.leakage_detector?.unbilled_overages_recaptured_inr || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4338ca', marginTop: '2px' }}>
                  Billed via supplementary invoice
                </div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid #bbf7d0',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#14532d' }}>
                Total Revenue Leakage Successfully Prevented:
              </span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#15803d' }}>
                ₹{(leakageData?.leakage_detector?.total_leakage_prevented_inr || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* VISUAL FINANCIAL LEAKAGE PREVENTION DISTRIBUTION CHART */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PieChart size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Financial Leakage Interception Distribution
                  </h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  Visual breakdown of capital recaptured across Anti-Duplicate Gate, 3-Way Match Verification, and Client Supplemental Invoicing.
                </div>
              </div>

              <div style={{
                background: '#f0fdf4',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#15803d'
              }}>
                100% Interception Rate Active
              </div>
            </div>

            {(() => {
              const blocked = leakageData?.leakage_detector?.blocked_duplicates_inr || 150000;
              const unapproved = leakageData?.leakage_detector?.unapproved_extras_caught_inr || 50000;
              const recaptured = leakageData?.leakage_detector?.unbilled_overages_recaptured_inr || 180000;
              const total = blocked + unapproved + recaptured || 1;

              const blockedPct = Math.round((blocked / total) * 100);
              const unapprovedPct = Math.round((unapproved / total) * 100);
              const recapturedPct = 100 - blockedPct - unapprovedPct;

              // Donut calculations
              const radius = 50;
              const circ = 2 * Math.PI * radius;
              const dash1 = (blocked / total) * circ;
              const dash2 = (unapproved / total) * circ;
              const dash3 = (recaptured / total) * circ;

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                  alignItems: 'center'
                }}>
                  {/* Left: SVG Donut Chart */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                      <svg viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="65" cy="65" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="18" />
                        {/* Segment 1: Blocked Duplicates (Emerald) */}
                        <circle
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="18"
                          strokeDasharray={`${dash1} ${circ}`}
                          strokeDashoffset="0"
                        />
                        {/* Segment 2: Unapproved Extras (Amber) */}
                        <circle
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="18"
                          strokeDasharray={`${dash2} ${circ}`}
                          strokeDashoffset={`-${dash1}`}
                        />
                        {/* Segment 3: Recaptured Overages (Indigo) */}
                        <circle
                          cx="65"
                          cy="65"
                          r={radius}
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="18"
                          strokeDasharray={`${dash3} ${circ}`}
                          strokeDashoffset={`-${dash1 + dash2}`}
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
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#15803d', lineHeight: 1 }}>
                          ₹{(total / 100000).toFixed(2)}L
                        </div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '3px' }}>
                          Saved
                        </div>
                      </div>
                    </div>

                    {/* Proportional Stacked Legend */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                            Blocked Duplicates:
                          </span>
                          <strong>₹{(blocked / 1000).toFixed(0)}k ({blockedPct}%)</strong>
                        </div>
                        <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${blockedPct}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                            3-Way Extras Caught:
                          </span>
                          <strong>₹{(unapproved / 1000).toFixed(0)}k ({unapprovedPct}%)</strong>
                        </div>
                        <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${unapprovedPct}%`, height: '100%', background: '#f59e0b' }} />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f46e5' }} />
                            Recaptured Overages:
                          </span>
                          <strong>₹{(recaptured / 1000).toFixed(0)}k ({recapturedPct}%)</strong>
                        </div>
                        <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${recapturedPct}%`, height: '100%', background: '#4f46e5' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Operational Summary */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                      Founder Capital Protection Mechanisms
                    </div>
                    <div style={{ color: '#475569', lineHeight: 1.4 }}>
                      • <strong>12 Forwarded Passes Blocked:</strong> Stopped ₹1.50 Lakhs in unauthorized catering food & beverage costs.
                    </div>
                    <div style={{ color: '#475569', lineHeight: 1.4 }}>
                      • <strong>3-Way Match Verification:</strong> Withheld ₹50,000 generator surcharge pending host variance approval.
                    </div>
                    <div style={{ color: '#475569', lineHeight: 1.4 }}>
                      • <strong>Supplementary Invoicing:</strong> Recaptured ₹1.80 Lakhs for 60 unannounced guests via legal client billing.
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 7-Day Vendor Advance Due Risk Alerts */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0' }}>
              7-Day Vendor Advance Payment Risk Alerts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leakageData?.upcoming_payment_alerts?.map((alert, idx) => {
                const isCleared = alert.risk_status === 'PAYMENT_CLEARED';

                return (
                  <div key={idx} style={{
                    background: isCleared ? '#f0fdf4' : '#fffaf0',
                    border: isCleared ? '1px solid #bbf7d0' : '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isCleared ? '#dcfce7' : '#fef3c7',
                          color: isCleared ? '#15803d' : '#b45309'
                        }}>
                          Due in {alert.days_remaining} Days
                        </span>
                        <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{alert.vendor_name}</strong>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                        {alert.payment_type} (Due: {alert.due_date})
                      </div>
                      <div style={{ fontSize: '0.76rem', color: isCleared ? '#15803d' : '#b45309', marginTop: '2px', fontWeight: 500 }}>
                        {alert.risk_note}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{alert.amount_inr.toLocaleString('en-IN')}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCleared ? '#15803d' : '#d97706',
                        color: '#ffffff'
                      }}>
                        {alert.risk_status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 6. SUB-TAB 5: VENDOR SETTLEMENTS & TRUE PROFITABILITY */}
      {activeSubTab === 'settlement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* True Profitability Waterfall Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              True Wedding Profitability Waterfall (Native Odoo Analytical Ledger)
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Recognized Revenue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  ₹{((settlementData?.profitability_waterfall?.client_recognized_revenue_inr || 0) / 10000000).toFixed(2)} Cr
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Contract + Supplementary</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Settled Vendor Costs</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  -₹{((settlementData?.profitability_waterfall?.settled_vendor_costs_inr || 0) / 10000000).toFixed(2)} Cr
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>18-Vendor Packages</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Internal Labor Timesheets</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  -₹{((settlementData?.profitability_waterfall?.internal_labor_cost_inr || 0) / 100000).toFixed(2)} Lakhs
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>account.analytic.line ({settlementData?.profitability_waterfall?.internal_labor_hours} hrs)</div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>True Net Profit</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  ₹{((settlementData?.profitability_waterfall?.true_net_profit_inr || 0) / 100000).toFixed(2)} Lakhs
                </div>
                <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '2px', fontWeight: 700 }}>
                  {settlementData?.profitability_waterfall?.true_net_margin_pct}% Net Margin
                </div>
              </div>
            </div>

            {/* VISUAL SVG PROFITABILITY WATERFALL BAR CHART */}
            <div style={{
              marginTop: '22px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 size={16} />
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Executive Profitability Waterfall Visualizer
                  </h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.74rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} />
                    Recognized Revenue
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} />
                    Vendor Costs
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f59e0b' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} />
                    Labor Overhead
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: 700 }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }} />
                    True Net Profit
                  </span>
                </div>
              </div>

              {/* SVG Waterfall Visual */}
              {(() => {
                const wfRev = (settlementData?.profitability_waterfall?.client_recognized_revenue_inr || 30180000) / 10000000;
                const wfCost = (settlementData?.profitability_waterfall?.settled_vendor_costs_inr || 21850000) / 10000000;
                const wfLaborL = (settlementData?.profitability_waterfall?.internal_labor_cost_inr || 224000) / 100000;
                const wfProfitL = (settlementData?.profitability_waterfall?.true_net_profit_inr || 8106000) / 100000;
                const wfMargin = settlementData?.profitability_waterfall?.true_net_margin_pct || 26.86;

                return (
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <svg viewBox="0 0 760 210" style={{ width: '100%', minWidth: '600px', height: 'auto', display: 'block' }}>
                      {/* Grid Lines */}
                      <line x1="50" y1="30" x2="720" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="50" y1="80" x2="720" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="50" y1="130" x2="720" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="50" y1="170" x2="720" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Step Connector Lines */}
                      <line x1="185" y1="35" x2="255" y2="35" stroke="#94a3b8" strokeDasharray="4 4" />
                      <line x1="365" y1="140" x2="435" y2="140" stroke="#94a3b8" strokeDasharray="4 4" />
                      <line x1="545" y1="142" x2="615" y2="142" stroke="#94a3b8" strokeDasharray="4 4" />

                      {/* 1. Invoiced Revenue Bar */}
                      <g>
                        <rect x="75" y="35" width="110" height="135" rx="6" fill="#10b981" />
                        <text x="130" y="22" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="800">
                          +₹{wfRev.toFixed(3)} Cr
                        </text>
                        <text x="130" y="105" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                          Revenue
                        </text>
                        <text x="130" y="190" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                          Total Invoiced
                        </text>
                      </g>

                      {/* 2. Settled Vendor Costs Bar (Step Down) */}
                      <g>
                        <rect x="255" y="35" width="110" height="105" rx="6" fill="#ef4444" />
                        <text x="310" y="22" textAnchor="middle" fill="#dc2626" fontSize="12" fontWeight="800">
                          -₹{wfCost.toFixed(3)} Cr
                        </text>
                        <text x="310" y="90" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
                          Vendor POs
                        </text>
                        <text x="310" y="190" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                          18-Vendor Cost
                        </text>
                      </g>

                      {/* 3. Internal Labor Timesheets Bar */}
                      <g>
                        <rect x="435" y="140" width="110" height="12" rx="3" fill="#f59e0b" />
                        <text x="490" y="130" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="800">
                          -₹{wfLaborL.toFixed(2)} L
                        </text>
                        <text x="490" y="190" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">
                          Timesheets
                        </text>
                      </g>

                      {/* 4. True Net Profit Bar (Final Step) */}
                      <g>
                        <rect x="615" y="125" width="110" height="45" rx="6" fill="#059669" />
                        <text x="670" y="112" textAnchor="middle" fill="#15803d" fontSize="13" fontWeight="900">
                          +₹{wfProfitL.toFixed(2)} L
                        </text>
                        <text x="670" y="152" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800">
                          {wfMargin}% Margin
                        </text>
                        <text x="670" y="190" textAnchor="middle" fill="#059669" fontSize="11" fontWeight="800">
                          True Net Profit
                        </text>
                      </g>
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* VENDOR SETTLEMENT MATRIX PROGRESS BARS */}
            <div style={{
              marginTop: '18px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  Vendor Settlement Progress & Retained Payables
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Advance Paid vs Remaining Balance Due
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {settlementData?.vendor_settlements?.slice(0, 5).map((v, idx) => {
                  const contract = v.contract_value || v.contract_value_inr || 1;
                  const advance = v.advance_paid || v.advance_paid_inr || 0;
                  const payable = v.remaining_payable || v.remaining_payable_inr || 0;
                  const categoryName = v.category || v.service_category || 'Vendor Service';
                  const advancePct = Math.min(100, Math.round((advance / contract) * 100));

                  return (
                    <div key={idx} style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.8rem' }}>
                        <div>
                          <strong>{v.vendor_name}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>({categoryName})</span>
                        </div>
                        <div>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>₹{advance.toLocaleString('en-IN')} Paid</span>
                          <span style={{ color: '#94a3b8', margin: '0 6px' }}>/</span>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>₹{contract.toLocaleString('en-IN')} Total</span>
                        </div>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${advancePct}%`, background: '#10b981' }} />
                        <div style={{ width: `${100 - advancePct}%`, background: '#f59e0b' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.7rem', color: '#64748b' }}>
                        <span>Paid: {advancePct}%</span>
                        <span style={{ color: '#d97706', fontWeight: 700 }}>Remaining Due: ₹{payable.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Employee Timesheet Entries */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#334155', margin: '0 0 10px 0' }}>
                Internal Timesheets (account.analytic.line)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {settlementData?.internal_labor_timesheets?.map((t) => (
                  <div key={t.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.employee_name} ({t.role_title})</div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>{t.activity_description}</div>
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{t.hours_spent} hrs @ ₹{t.hourly_cost_rate}/hr</span>
                      <span style={{ color: '#0f172a' }}>₹{t.total_labor_cost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Master Vendor Settlement Matrix */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Master Vendor Settlement Matrix
            </h3>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
              <code>Remaining Payable = Contract Value + Approved Extras - Advance Paid</code>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Vendor & Category</th>
                    <th style={{ padding: '12px 14px' }}>Contract Value</th>
                    <th style={{ padding: '12px 14px' }}>Approved Extras</th>
                    <th style={{ padding: '12px 14px' }}>Advance Paid</th>
                    <th style={{ padding: '12px 14px' }}>Remaining Payable</th>
                    <th style={{ padding: '12px 14px' }}>Settlement Status</th>
                    <th style={{ padding: '12px 14px' }}>Audit Note</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementData?.vendor_settlements?.map((v, idx) => (
                    <tr key={idx} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: v.settlement_status === 'CLEARED_READY' ? '#f0fdf4' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.vendor_name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{v.category}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        ₹{v.contract_value.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', color: v.approved_extras > 0 ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                        +₹{v.approved_extras.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>
                        ₹{v.advance_paid.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#4f46e5' }}>
                        ₹{v.remaining_payable.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: v.settlement_status === 'CLEARED_READY' ? '#dcfce7' : v.settlement_status === 'DISPUTE_HELD' ? '#fee2e2' : '#fef3c7',
                          color: v.settlement_status === 'CLEARED_READY' ? '#15803d' : v.settlement_status === 'DISPUTE_HELD' ? '#b91c1c' : '#b45309'
                        }}>
                          {v.settlement_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.74rem', color: '#64748b', maxWidth: '240px' }}>
                        {v.settlement_note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* 7. MODAL: RECORD NEW ON-SITE VARIATION */}
      {showNewVarModal && (
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
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5' }}>
                  ON-SITE VARIATION LEDGER (knotcore.wedding.variation)
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                  Record Unplanned Extra Expense
                </h3>
              </div>
              <button
                onClick={() => setShowNewVarModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddVariation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Expense Description (e.g. 60 extra banquet plates):
                </label>
                <input
                  type="text"
                  value={newVarForm.item_description}
                  onChange={(e) => setNewVarForm({ ...newVarForm, item_description: e.target.value })}
                  placeholder="e.g. 60 Extra Banquet Dinner Plates at Imperial Pavilion"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Category:
                  </label>
                  <select
                    value={newVarForm.category}
                    onChange={(e) => setNewVarForm({ ...newVarForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  >
                    <option value="Royal Banqueting & Catering">Royal Banqueting & Catering</option>
                    <option value="Sound & Lighting">Sound & Lighting</option>
                    <option value="Floral & Mandap Architecture">Floral & Mandap Architecture</option>
                    <option value="Power Logistics">Power Logistics</option>
                    <option value="Special Effects">Special Effects</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Assigned Vendor:
                  </label>
                  <input
                    type="text"
                    value={newVarForm.vendor_name}
                    onChange={(e) => setNewVarForm({ ...newVarForm, vendor_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Quantity (e.g. 60 plates / 2 hours):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newVarForm.quantity}
                    onChange={(e) => setNewVarForm({ ...newVarForm, quantity: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Unit Rate (₹ per unit):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newVarForm.unit_rate}
                    onChange={(e) => setNewVarForm({ ...newVarForm, unit_rate: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                    required
                  />
                </div>
              </div>

              {/* Automatic Total Calculation Display */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Computed Total Amount:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>
                  ₹{(parseInt(newVarForm.quantity || 0) * parseFloat(newVarForm.unit_rate || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Evidence & Reason Notes:
                </label>
                <textarea
                  rows="2"
                  value={newVarForm.evidence_notes}
                  onChange={(e) => setNewVarForm({ ...newVarForm, evidence_notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewVarModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingVar}
                  style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {addingVar ? 'Recording...' : 'Commit to Variation Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: QR WRISTBAND PREVIEW */}
      {selectedWristbandForQR && (
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
            maxWidth: '420px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedWristbandForQR(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
              Royal Wedding Guest Wristband
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 14px 0' }}>
              {selectedWristbandForQR.guest_name}
            </h3>

            {selectedWristbandForQR.qr_code_data_url && (
              <img
                src={selectedWristbandForQR.qr_code_data_url}
                alt="Wristband QR"
                style={{ width: '200px', height: '200px', margin: '0 auto 16px', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '6px' }}
              />
            )}

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', textAlign: 'left', marginBottom: '16px' }}>
              <div>Code: <strong>{selectedWristbandForQR.wristband_code}</strong></div>
              <div style={{ marginTop: '2px' }}>Category: <strong>{selectedWristbandForQR.category}</strong></div>
              <div style={{ marginTop: '2px' }}>Seats Allocated: <strong>{selectedWristbandForQR.seats_allocated}</strong></div>
              <div style={{ marginTop: '2px' }}>Status: <strong>{selectedWristbandForQR.status}</strong></div>
            </div>

            <button
              onClick={() => {
                setScanInputCode(selectedWristbandForQR.wristband_code);
                setSelectedWristbandForQR(null);
                handleScanWristband(selectedWristbandForQR.wristband_code);
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Scan This Wristband at {scanGate}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
