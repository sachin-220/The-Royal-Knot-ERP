import React, { useState, useEffect } from 'react';
import {
  TrendingUp, AlertTriangle, ShieldCheck, DollarSign, Clock, Users,
  Send, Bot, CheckCircle2, ChevronRight, Layers, ArrowUpRight,
  ArrowDownRight, RefreshCw, Sparkles, Filter, Lock, PhoneCall, ExternalLink
} from 'lucide-react';

export default function ExecutiveBIView({ weddingId = 1 }) {
  // State
  const [loading, setLoading] = useState(true);
  const [seasonData, setSeasonData] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profitability' | 'scorecard' | 'cashflow' | 'copilot' | 'dispatcher'

  // AI Copilot State - Exclusively Provisioned for Planner Role
  const [copilotRole] = useState('planner');
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotHistory, setCopilotHistory] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [delaySimVendor, setDelaySimVendor] = useState('Desert Sonic Concert Sound & AV (CAT-05)');
  const [delaySimMins, setDelaySimMins] = useState(30);

  // ML Engine 2 Simulator State
  const [simBudget, setSimBudget] = useState(25000000);
  const [simGuests, setSimGuests] = useState(500);
  const [simVariance, setSimVariance] = useState(3.5);
  const [simSurge, setSimSurge] = useState(11.5);
  const [simResult, setSimResult] = useState(null);

  // Notification Banner
  const [notification, setNotification] = useState(null);

  // Fetch Master Data
  const fetchAllBI = async () => {
    try {
      setLoading(true);
      const [resSeason, resScore, resCash, resDisp] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/executive-bi/season-overview'),
        fetch('http://127.0.0.1:5000/api/executive-bi/vendor-scorecards'),
        fetch('http://127.0.0.1:5000/api/executive-bi/cash-flow'),
        fetch('http://127.0.0.1:5000/api/executive-bi/dispatches')
      ]);

      const sData = await resSeason.json();
      const scData = await resScore.json();
      const cfData = await resCash.json();
      const dData = await resDisp.json();

      setSeasonData(sData);
      setScorecards(scData);
      setCashFlow(cfData);
      setDispatches(dData);

      // Initialize default simulator result
      calculateSimulation(simBudget, simGuests, simVariance, simSurge);
    } catch (err) {
      console.error('Error fetching Executive BI:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBI();
  }, []);

  // Run ML Engine 2 Margin Drift Simulation
  const calculateSimulation = async (budget, guests, variance, surge) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/executive-bi/predict-drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: parseFloat(budget) || 25000000,
          guests: parseInt(guests) || 500,
          vendor_variance: parseFloat(variance) || 3.5,
          guest_surge: parseFloat(surge) || 11.5
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  // Submit AI Copilot Query
  const handleCopilotSubmit = async (queryText) => {
    const textToRun = queryText || copilotQuery;
    if (!textToRun.trim()) return;

    try {
      setCopilotLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/executive-bi/copilot-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: copilotRole,
          query: textToRun,
          wedding_id: weddingId
        })
      });
      const data = await res.json();
      setCopilotHistory(prev => [...prev, data]);
      setCopilotQuery('');
    } catch (err) {
      console.error('Copilot query error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Handle Apply AI Schedule Rebalance
  const handleApplyRebalance = async (option) => {
    try {
      setCopilotLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/executive-bi/apply-rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          option_id: option.id,
          delay_minutes: option.delay_minutes || 30,
          planner_name: 'Lead Planner Sachin Priya'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'AI Schedule Adjustment Committed',
          message: data.message
        });
        setCopilotHistory(prev => [
          ...prev,
          {
            role: 'planner',
            query: `Applied ${option.title}`,
            response: `<b>SCHEDULE REBALANCE COMMITTED TO ODOO ERP!</b><br/><br/>${data.message}<br/><br/>Status: <b>APPROVED_AND_BROADCAST</b>.<br/>All supplier call times and run sheet timings have been synchronized in PostgreSQL.`,
            rebalance_options: []
          }
        ]);
      }
    } catch (err) {
      console.error('Rebalance apply error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Trigger Proactive Dispatch
  const handleTriggerDispatch = async (dispatchId) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/executive-bi/trigger-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatch_id: dispatchId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Gate Alert Dispatched',
          message: data.message
        });
        fetchAllBI();
      }
    } catch (err) {
      console.error('Dispatch trigger error:', err);
    }
  };

  const snapshot = seasonData?.snapshot || {};
  const threeTier = seasonData?.three_tier_profitability || {};
  const allWeddings = seasonData?.all_weddings || [];
  const top5 = seasonData?.top_5_expensive || [];
  const marginAlerts = seasonData?.margin_alerts || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '10px',
          background: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${notification.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: notification.type === 'success' ? '#166534' : '#991b1b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{notification.title}</div>
            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>{notification.message}</div>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. StockSense Future Control Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#71717a', marginBottom: '6px', fontWeight: 500 }}>
            <span>Dashboard</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#a1a1aa' }}>...</span>
            <span style={{ margin: '0 6px', color: '#a1a1aa' }}>/</span>
            <span style={{ color: '#18181b', fontWeight: 600 }}>Future Control</span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#18181b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Executive Intelligence & Future Control
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#71717a', margin: '4px 0 0', fontWeight: 400 }}>
            Simulate inventory and procurement decisions before they happen across the 25-wedding portfolio.
          </p>
        </div>

        {/* View Mode Toggle matching StockSense Screenshot 3: [ LIVE | SIMULATE | REPLAY ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: '#ffffff',
            border: '1px solid #e7e7e4',
            borderRadius: '8px',
            padding: '3px'
          }}>
            {['LIVE', 'SIMULATE', 'REPLAY'].map((mode) => (
              <button
                key={mode}
                style={{
                  background: mode === 'SIMULATE' ? '#18181b' : 'transparent',
                  color: mode === 'SIMULATE' ? '#ffffff' : '#71717a',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: mode === 'SIMULATE' ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAllBI}
            className="btn-outline"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 4 Macro Season KPI Cards (25 Weddings Aggregate) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* 1. Total Contracted Revenue */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              25-Wedding Contract Valuation
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            ₹68.50 Cr
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            100% contracts executed
          </div>
        </div>

        {/* 2. Total Settled Vendor Costs */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Settled Vendor Costs
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            ₹42.20 Cr
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
            61.6% of contract budget
          </div>
        </div>

        {/* 3. Internal Labor Costs */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              Labor & Timesheets
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#18181b', marginTop: '12px', letterSpacing: '-0.02em' }}>
            ₹11.50 Cr
          </div>
          <div style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500, marginTop: '4px' }}>
            16.8% operational ratio
          </div>
        </div>

        {/* 4. True Net Profit */}
        <div className="stocksense-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} />
            </div>
            <span style={{ fontSize: '0.74rem', color: '#71717a', fontWeight: 500 }}>
              True Net Margin
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#16a34a', marginTop: '12px', letterSpacing: '-0.02em' }}>
            21.61%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 500, marginTop: '4px' }}>
            ₹1.82 Cr blocked leakage
          </div>
        </div>
      </div>

      {/* 2. StockSense Sub-Navigation Pill Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'ML Margin Drift Predictor' },
          { id: 'profitability', label: '3-Tier Profitability Breakdown' },
          { id: 'scorecard', label: 'Vendor Reliability Scorecard' },
          { id: 'cashflow', label: '30/60/90-Day Cash Flow' },
          { id: 'copilot', label: 'Wedding Planner AI Copilot' },
          { id: 'dispatcher', label: 'Proactive Vendor Dispatcher' }
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: active ? '1px solid #18181b' : '1px solid #e7e7e4',
                background: active ? '#18181b' : '#ffffff',
                color: active ? '#ffffff' : '#71717a',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ML ENGINE 2 MARGIN DRIFT PREDICTOR & 25 WEDDINGS PORTFOLIO */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ML Engine 2 Interactive Simulator Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Sparkles size={20} color="#4f46e5" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                ML Engine 2: Early-Warning Margin Drift Predictor
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 18px' }}>
              Evaluates spend-per-guest ratios, supplier hidden variance histories (fuel, overtime, transport), and guest surge buffers to predict actual profit margin before budget leakage occurs.
            </p>

            {/* Warning Banner Display */}
            {simResult && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: simResult.margin_drift_risk === 'Critical' ? '#fef2f2' : (simResult.margin_drift_risk === 'Moderate' ? '#fffbeb' : '#f0fdf4'),
                border: `1.5px solid ${simResult.margin_drift_risk === 'Critical' ? '#f87171' : (simResult.margin_drift_risk === 'Moderate' ? '#fcd34d' : '#86efac')}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <AlertTriangle size={24} color={simResult.margin_drift_risk === 'Critical' ? '#dc2626' : (simResult.margin_drift_risk === 'Moderate' ? '#d97706' : '#16a34a')} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      color: simResult.margin_drift_risk === 'Critical' ? '#991b1b' : (simResult.margin_drift_risk === 'Moderate' ? '#92400e' : '#14532d')
                    }}>
                      Margin Drift Status: {simResult.risk_tier_label}
                    </span>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: simResult.margin_drift_risk === 'Critical' ? '#dc2626' : (simResult.margin_drift_risk === 'Moderate' ? '#d97706' : '#16a34a')
                    }}>
                      (Predicted Margin: {simResult.predicted_margin_pct}% | Drift: -{simResult.total_drift_pct}%)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#334155', lineHeight: 1.45 }}>
                    {simResult.drift_risk_explanation}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                  Total Contracted Budget (INR):
                </label>
                <input
                  type="number"
                  value={simBudget}
                  onChange={e => {
                    setSimBudget(e.target.value);
                    calculateSimulation(e.target.value, simGuests, simVariance, simSurge);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                  Invited Guest Count:
                </label>
                <input
                  type="number"
                  value={simGuests}
                  onChange={e => {
                    setSimGuests(e.target.value);
                    calculateSimulation(simBudget, e.target.value, simVariance, simSurge);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                  Selected Vendor Variance Ratio (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simVariance}
                  onChange={e => {
                    setSimVariance(e.target.value);
                    calculateSimulation(simBudget, simGuests, e.target.value, simSurge);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                  Predicted Guest Surge (% Buffer):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={simSurge}
                  onChange={e => {
                    setSimSurge(e.target.value);
                    calculateSimulation(simBudget, simGuests, simVariance, e.target.value);
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          {/* 25 Royal Weddings Portfolio Table with Drift Badges */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  25 Royal Weddings Portfolio (Season 2026-2027)
                </h3>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                  Live ML Margin Drift Scoring & Spend-per-Guest Analysis
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>
                Showing all 25 Destination Weddings
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>ID</th>
                    <th style={{ padding: '10px 12px' }}>Client / Wedding Name</th>
                    <th style={{ padding: '10px 12px' }}>Destination Venue</th>
                    <th style={{ padding: '10px 12px' }}>Contract Budget</th>
                    <th style={{ padding: '10px 12px' }}>Guests</th>
                    <th style={{ padding: '10px 12px' }}>Spend / Guest</th>
                    <th style={{ padding: '10px 12px' }}>Predicted Margin</th>
                    <th style={{ padding: '10px 12px' }}>Drift Risk Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {allWeddings.map((w, idx) => {
                    const isAlert = w.margin_drift_risk === 'Critical';
                    return (
                      <tr
                        key={w.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isAlert ? '#fff5f5' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4f46e5' }}>
                          TRK/{String(idx + 1).padStart(3, '0')}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                          {w.client_name}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>
                          {w.location}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          ₹{Number(w.total_budget).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#334155' }}>
                          {w.confirmed_guests}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>
                          ₹{Number(w.spend_per_guest || 50000).toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: isAlert ? '#dc2626' : '#16a34a' }}>
                          {w.predicted_margin_pct || 24.5}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: isAlert ? '#fee2e2' : (w.margin_drift_risk === 'Moderate' ? '#fef3c7' : '#dcfce7'),
                            color: isAlert ? '#991b1b' : (w.margin_drift_risk === 'Moderate' ? '#92400e' : '#15803d')
                          }}>
                            {w.margin_drift_risk ? `${w.margin_drift_risk.toUpperCase()} RISK` : 'HEALTHY'}
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
      )}

      {/* TAB 2: 3-TIER PROFITABILITY BREAKDOWN */}
      {activeTab === 'profitability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              3-Tier Profitability Breakdown & Margin Waterfall
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px' }}>
              Tracks profitability erosion from initial expectation to committed purchase orders, down to actual cash settlement after timesheet labor costs.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {/* Tier 1: Projected Profit */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', background: '#faf5ff' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                  TIER 1 • PROJECTED PROFIT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 10px' }}>
                  Expected Revenue − Initial Budget Matrix
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#581c87' }}>
                  ₹20,50,00,000 <span style={{ fontSize: '0.85rem', color: '#7c3aed' }}>(29.93%)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '10px', lineHeight: 1.4 }}>
                  Assumes zero unquoted vendor variations and ideal 5% turnout buffer.
                </div>
              </div>

              {/* Tier 2: Committed Profit */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', background: '#eff6ff' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  TIER 2 • COMMITTED PROFIT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 10px' }}>
                  Agreed Client Contract − Confirmed POs
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af' }}>
                  ₹18,70,00,000 <span style={{ fontSize: '0.85rem', color: '#2563eb' }}>(27.30%)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: '10px', lineHeight: 1.4 }}>
                  Locked into binding supplier Purchase Orders (POs) following 1-Click PO generation.
                </div>
              </div>

              {/* Tier 3: Actual Profit */}
              <div style={{ border: '1px solid #bbf7d0', borderRadius: '10px', padding: '18px', background: '#f0fdf4' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  TIER 3 • ACTUAL TRUE NET PROFIT
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 10px' }}>
                  Recognized Revenue − Settled Bills − Labor Timesheets
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>
                  ₹14,80,00,000 <span style={{ fontSize: '0.85rem', color: '#166534' }}>(21.61%)</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#166534', marginTop: '10px', lineHeight: 1.4 }}>
                  Actual cash retained after settling all 18 supplier invoices and staff timesheets.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR RELIABILITY SCORECARD */}
      {activeTab === 'scorecard' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Vendor Reliability Scorecard (18 Categories)
              </h2>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                Evaluates on-time arrival %, billing variance ratio, quality ratings, and recorded complaints.
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Code</th>
                  <th style={{ padding: '10px 12px' }}>Vendor & Category</th>
                  <th style={{ padding: '10px 12px' }}>On-Time Arrival %</th>
                  <th style={{ padding: '10px 12px' }}>Avg Delay</th>
                  <th style={{ padding: '10px 12px' }}>Billing Variance</th>
                  <th style={{ padding: '10px 12px' }}>Quality Rating</th>
                  <th style={{ padding: '10px 12px' }}>Complaints</th>
                  <th style={{ padding: '10px 12px' }}>Risk Tier</th>
                  <th style={{ padding: '10px 12px' }}>Reliability Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                {scorecards.map((sc) => {
                  const isHighRisk = sc.risk_tier.includes('High') || sc.risk_tier.includes('+2σ');
                  return (
                    <tr
                      key={sc.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isHighRisk ? '#fff5f5' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4f46e5' }}>
                        {sc.category_code}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{sc.vendor_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sc.category_name}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: sc.on_time_arrival_pct < 90 ? '#dc2626' : '#16a34a' }}>
                        {sc.on_time_arrival_pct}%
                      </td>
                      <td style={{ padding: '10px 12px', color: sc.avg_delay_minutes > 15 ? '#dc2626' : '#64748b' }}>
                        {sc.avg_delay_minutes > 0 ? `+${sc.avg_delay_minutes}m` : '0m'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: sc.billing_variance_ratio > 5 ? '#dc2626' : '#334155' }}>
                        {sc.billing_variance_ratio > 0 ? `+${sc.billing_variance_ratio}%` : `${sc.billing_variance_ratio}%`}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#d97706', fontWeight: 700 }}>
                        ★ {sc.quality_rating}
                      </td>
                      <td style={{ padding: '10px 12px', color: sc.complaints_count > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        {sc.complaints_count}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: isHighRisk ? '#fee2e2' : (sc.risk_tier.includes('Medium') ? '#fef3c7' : '#dcfce7'),
                          color: isHighRisk ? '#991b1b' : (sc.risk_tier.includes('Medium') ? '#92400e' : '#15803d')
                        }}>
                          {sc.risk_tier}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.74rem', color: '#475569', maxWidth: '240px' }}>
                        {sc.reliability_notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 30/60/90-DAY CASH-FLOW FORECASTING */}
      {activeTab === 'cashflow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              30/60/90-Day Cash-Flow Forecasting
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px' }}>
              Aggregates upcoming client milestone receivables (30%-40%-30%) against scheduled vendor PO disbursements.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              {cashFlow.map((cf) => (
                <div key={cf.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                      {cf.timeframe} ROLLING WINDOW
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      Net Positive Cash Position
                    </span>
                  </div>

                  <div style={{ margin: '14px 0' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>PROJECTED NET CASH FLOW:</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                      +₹{Number(cf.net_cash_flow).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.76rem' }}>
                    <div>
                      <div style={{ color: '#64748b' }}>Receivables:</div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{Number(cf.projected_receivables).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b' }}>Payables:</div>
                      <div style={{ fontWeight: 700, color: '#b45309' }}>₹{Number(cf.scheduled_payables).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#475569', lineHeight: 1.45 }}>
                    <strong>Immediate Priority:</strong> {cf.urgent_vendor_payables}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEDDING PLANNER AI COPILOT INTERACTIVE CONSOLE */}
      {activeTab === 'copilot' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          {/* Header & Planner Role Clearance Badge */}
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={20} color="#4f46e5" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Wedding Planner AI Copilot
                </h2>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                Operational Run Sheets, Milestone Checklists & Dynamic Vendor Delay Timeline Rebalancing
              </div>
            </div>

            {/* Strict Planner Clearance Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e0e7ff',
              color: '#3730a3',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              fontWeight: 700
            }}>
              <ShieldCheck size={14} />
              Role Clearance: Lead Wedding Planner (Exclusive Access)
            </div>
          </div>

          {/* AI Vendor Delay Timeline Rebalancer Simulator */}
          <div style={{ padding: '16px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#4f46e5" />
              Vendor Late Arrival Simulator & Timeline Rebalancer (No Emergency SOS Required)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <select
                value={delaySimVendor}
                onChange={e => setDelaySimVendor(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <option value="Desert Sonic Concert Sound & AV (CAT-05)">Desert Sonic Concert Sound & AV (CAT-05)</option>
                <option value="Shahi Mewar Gourmet Feasts (CAT-02)">Shahi Mewar Gourmet Feasts (CAT-02)</option>
                <option value="Rajputana Royal Mandap Designers (CAT-06)">Rajputana Royal Mandap Designers (CAT-06)</option>
                <option value="Mewar Royal Cinema & Photography (CAT-04)">Mewar Royal Cinema & Photography (CAT-04)</option>
              </select>

              <select
                value={delaySimMins}
                onChange={e => setDelaySimMins(parseInt(e.target.value))}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <option value="15">+15 Mins Late (Minor Delay)</option>
                <option value="30">+30 Mins Late (Traffic Jam)</option>
                <option value="45">+45 Mins Late (Logistics Transit)</option>
                <option value="60">+60 Mins Late (Significant Shift)</option>
              </select>

              <button
                onClick={() => handleCopilotSubmit(`${delaySimVendor} is reported ${delaySimMins} minutes late - generate AI timeline extension options`)}
                disabled={copilotLoading}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copilotLoading ? 'Analyzing...' : 'Generate AI Extension Options'}
              </button>
            </div>
          </div>

          {/* Recommended Planner Query Shortcuts */}
          <div style={{ padding: '12px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
              RECOMMENDED PLANNER QUERIES:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                'Desert Sonic AV is 45 minutes late in traffic - recommend timeline adjustment options',
                'Shahi Mewar Catering is 30 minutes delayed - suggest schedule rebalance',
                'Generate a checklist for a three-day wedding.',
                "Which vendors haven't confirmed attendance for tomorrow?",
                'What tasks are overdue?',
                "Show me tomorrow's schedule and ceremony run sheet."
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCopilotSubmit(q)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Stream */}
          <div style={{ padding: '20px', minHeight: '340px', maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fafafa' }}>
            {copilotHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <Bot size={36} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Wedding Planner AI Copilot Ready</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Select a vendor delay simulation above or ask questions to receive AI schedule rebalancing options and run sheet adjustments.
                </div>
              </div>
            ) : (
              copilotHistory.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* User Question */}
                  <div style={{ alignSelf: 'flex-end', background: '#4f46e5', color: '#ffffff', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', maxWidth: '75%' }}>
                    {item.query}
                  </div>
                  {/* Copilot Response */}
                  <div style={{ alignSelf: 'flex-start', background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '14px 18px', borderRadius: '8px', fontSize: '0.82rem', maxWidth: '90%', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5', marginBottom: '6px' }}>
                      KNOTCORE PLANNER COPILOT
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: item.response }} style={{ lineHeight: 1.5 }} />

                    {/* AI Rebalance Options Cards */}
                    {item.rebalance_options && item.rebalance_options.length > 0 && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#3730a3', textTransform: 'uppercase' }}>
                          Actionable AI Timeline Adjustment Options:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                          {item.rebalance_options.map((opt) => (
                            <div key={opt.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{opt.title}</div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>
                                  +{opt.delay_minutes}m Adjustment
                                </span>
                              </div>
                              <div style={{ fontSize: '0.76rem', color: '#475569' }}>{opt.summary}</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                {opt.extensions.map((ext, eIdx) => (
                                  <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: eIdx < opt.extensions.length - 1 ? '1px dashed #f1f5f9' : 'none', paddingBottom: '3px' }}>
                                    <span style={{ fontWeight: 600, color: '#334155' }}>{ext.event}:</span>
                                    <span style={{ color: '#0284c7', fontWeight: 600 }}>{ext.adjusted}</span>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => handleApplyRebalance(opt)}
                                disabled={copilotLoading}
                                style={{
                                  alignSelf: 'flex-start',
                                  marginTop: '6px',
                                  padding: '7px 14px',
                                  background: '#4f46e5',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Apply AI Schedule Adjustment
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Box */}
          <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={copilotQuery}
              onChange={e => setCopilotQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCopilotSubmit()}
              placeholder="Ask as Lead Planner (e.g. 'Vendor is 45m late - suggest timeline extension options')..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem'
              }}
            />
            <button
              onClick={() => handleCopilotSubmit()}
              disabled={copilotLoading}
              style={{
                padding: '10px 18px',
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={15} /> Ask Copilot
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: PROACTIVE WHATSAPP/TELEGRAM VENDOR DISPATCHER */}
      {activeTab === 'dispatcher' && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Proactive Vendor Dispatcher (24h & 4h Automated Engine)
              </h2>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                Automatically sends WhatsApp/Telegram notifications with palace gate directions, coordinator contact, and mandatory QR check-in links.
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Supplier / Deliverable</th>
                  <th style={{ padding: '10px 12px' }}>Stage</th>
                  <th style={{ padding: '10px 12px' }}>Mandatory Call Time</th>
                  <th style={{ padding: '10px 12px' }}>Assigned Palace Gate</th>
                  <th style={{ padding: '10px 12px' }}>Operations Coordinator</th>
                  <th style={{ padding: '10px 12px' }}>Check-In Token</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dispatches.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.vendor_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.category_name}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: d.alert_stage.includes('4h') ? '#fee2e2' : '#fef3c7',
                        color: d.alert_stage.includes('4h') ? '#991b1b' : '#92400e'
                      }}>
                        {d.alert_stage.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 600 }}>
                      {new Date(d.call_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {d.palace_gate}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div>{d.coordinator_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{d.coordinator_phone}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#4f46e5' }}>
                      {d.check_in_token}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: d.status === 'sent' ? '#dcfce7' : '#f1f5f9',
                        color: d.status === 'sent' ? '#15803d' : '#64748b'
                      }}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <button
                        onClick={() => handleTriggerDispatch(d.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Dispatch Alert
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
