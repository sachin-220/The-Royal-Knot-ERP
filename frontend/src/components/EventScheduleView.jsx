import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck, 
  MapPin, Sun, Moon, ArrowRight, Play, RotateCcw, Building2, 
  Search, RefreshCw, Send, Check, AlertOctagon, UserCheck, Flame
} from 'lucide-react';

export default function EventScheduleView() {
  const [inquiryRef, setInquiryRef] = useState('INQ-0011');
  const [searchInput, setSearchInput] = useState('INQ-0011');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Event & Timer State
  const [activeEvent, setActiveEvent] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [simulatingVendorId, setSimulatingVendorId] = useState(null);
  const timerRef = useRef(null);

  // Fetch Event Schedule and Assigned Vendors
  const fetchScheduleData = async (ref = inquiryRef) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://127.0.0.1:5000/api/inquiries/${ref}/events`);
      if (!res.ok) throw new Error(`Failed to load event itinerary for ${ref}`);
      const json = await res.json();
      setData(json);

      // Check if any event is currently ACTIVE
      const runningEvent = json.events?.find(e => e.status === 'ACTIVE');
      if (runningEvent) {
        setActiveEvent(runningEvent);
        if (runningEvent.timer_expires_at) {
          const expires = new Date(runningEvent.timer_expires_at).getTime();
          const now = Date.now();
          const diff = Math.max(0, Math.floor((expires - now) / 1000));
          setSecondsRemaining(diff);
          setTimerExpired(diff === 0);
        } else {
          setSecondsRemaining(600);
        }
      } else if (json.events && json.events.length > 0) {
        // Default select first event for preview
        setActiveEvent(json.events[0]);
      } else {
        setActiveEvent(null);
        setSecondsRemaining(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData(inquiryRef);
  }, [inquiryRef]);

  // Countdown Timer Hook
  useEffect(() => {
    if (activeEvent?.status === 'ACTIVE' && secondsRemaining !== null && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEvent?.status, secondsRemaining]);

  // Periodic poll to sync vendor check-in status from Telegram bot
  useEffect(() => {
    if (activeEvent?.status === 'ACTIVE') {
      const pollInterval = setInterval(() => {
        fetch(`http://127.0.0.1:5000/api/inquiries/${inquiryRef}/events`)
          .then(r => r.json())
          .then(resData => {
            if (resData?.chosen_vendors) {
              setData(prev => prev ? { ...prev, chosen_vendors: resData.chosen_vendors } : prev);
            }
          })
          .catch(e => console.warn("Vendor sync ping failed", e));
      }, 3000);
      return () => clearInterval(pollInterval);
    }
  }, [activeEvent?.status, inquiryRef]);

  // Handle Start Event (Starts 10-minute timer)
  const handleStartEvent = async (event) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/events/${event.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error("Failed to start event");
      const resJson = await res.json();
      setActiveEvent(resJson.event);
      setSecondsRemaining(600); // 10 minutes
      setTimerExpired(false);
      fetchScheduleData(inquiryRef);
    } catch (err) {
      alert(`Error starting event: ${err.message}`);
    }
  };

  // Handle Reset Event
  const handleResetEvent = async (event) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/events/${event.id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error("Failed to reset event");
      const resJson = await res.json();
      setActiveEvent(resJson.event);
      setSecondsRemaining(null);
      setTimerExpired(false);
      fetchScheduleData(inquiryRef);
    } catch (err) {
      alert(`Error resetting event: ${err.message}`);
    }
  };

  // Quick Simulation of Vendor /attend Check-In from UI
  const handleSimulateVendorAttendance = async (vendorId) => {
    try {
      setSimulatingVendorId(vendorId);
      const res = await fetch('http://127.0.0.1:5000/api/events/verify-vendor-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId })
      });
      const resJson = await res.json();
      if (!resJson.success) {
        alert(resJson.error || "Check-in failed");
      } else {
        fetchScheduleData(inquiryRef);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingVendorId(null);
    }
  };

  const formatTimer = (secs) => {
    if (secs === null || secs === undefined) return "10:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const inquiry = data?.inquiry || {};
  const events = data?.events || [];
  const chosenVendors = data?.chosen_vendors || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Roboto, sans-serif' }}>
      
      {/* 1. Header & Inquiry Filter Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                background: '#e0e7ff',
                color: '#4338ca',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '0.04em'
              }}>
                WEATHER-SYNCHRONIZED MASTER ITINERARY
              </span>
              <span style={{
                background: '#fef3c7',
                color: '#92400e',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                10:00 AM – 10:00 PM RESTRICTION ENFORCED
              </span>
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Event Schedule & Live Gate Check-In (INQ Filter)
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '780px', lineHeight: 1.5 }}>
              AI-generated wedding plan synchronized with local weather advisories and diurnal temperature profiles. Starting an event initiates a 10-minute gate attendance countdown for all contracted suppliers.
            </p>
          </div>

          {/* Search by Inquiry Ref */}
          <form 
            onSubmit={(e) => { e.preventDefault(); setInquiryRef(searchInput.trim().toUpperCase()); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter by INQ Ref (e.g. INQ-0011)"
                style={{
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  width: '210px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Filter
            </button>
            <button
              type="button"
              onClick={() => fetchScheduleData(inquiryRef)}
              className="btn-outline"
              style={{ padding: '9px 12px', borderRadius: '10px' }}
              title="Refresh Schedule"
            >
              <RefreshCw size={15} />
            </button>
          </form>
        </div>

        {/* Inquiry Context Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Wedding Couple & ID</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: inquiry.exists === false || inquiry.name === 'Not Assigned' ? '#b91c1c' : '#0f172a', marginTop: '2px' }}>
              {inquiry.name || (inquiry.exists === false ? "Not Assigned" : "Aarav & Diya")}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 600 }}>{inquiryRef}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Palace Destination</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {inquiry.exists !== false && inquiry.preferred_city && inquiry.preferred_city !== 'Not Assigned' ? `${inquiry.preferred_city}, Rajasthan` : "Not Assigned"}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {inquiry.exists !== false && inquiry.name !== 'Not Assigned' ? "The City Palace & Jagmandir" : "No Venue Contracted"}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cultural Protocol</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {inquiry.culture_name && inquiry.culture_name !== 'Not Assigned' ? inquiry.culture_name : (inquiry.exists !== false && inquiry.name !== 'Not Assigned' ? "Rajputana & Mewar Royal" : "Not Assigned")}
            </div>
            <div style={{ fontSize: '0.75rem', color: inquiry.exists !== false && inquiry.name !== 'Not Assigned' ? '#16a34a' : '#64748b', fontWeight: 600 }}>
              {inquiry.exists !== false && inquiry.name !== 'Not Assigned' ? "Heritage Protocol Verified" : "Pending Client Input"}
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Operating Window</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              10:00 AM – 10:00 PM
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>Strict Daylight & Sound Curfew</div>
          </div>
        </div>
      </div>

      {/* When no events are assigned to this inquiry, show clear empty state */}
      {events.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px dashed #cbd5e1',
          borderRadius: '16px',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#b45309'
          }}>
            <AlertTriangle size={30} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
            No Master Itinerary Assigned for {inquiryRef}
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            {inquiry.exists === false
              ? `Inquiry "${inquiryRef}" does not exist in KnotCore CRM records. Please enter a valid inquiry reference or register a new wedding inquiry in the Telegram Bot.`
              : `Inquiry "${inquiryRef}" has been registered, but its weather-synchronized master itinerary is currently pending client confirmation in the Telegram AI Wedding Planner Bot.`}
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => { setSearchInput('INQ-0011'); setInquiryRef('INQ-0011'); }}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Switch to Active Itinerary (INQ-0011)
            </button>
            <button
              onClick={() => fetchScheduleData(inquiryRef)}
              className="btn-outline"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} /> Re-Check {inquiryRef}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 2. LIVE ACTIVE EVENT GATE CHECK-IN COMMAND HERO (If an event is ACTIVE or selected) */}
          {activeEvent && (
        <div style={{
          background: activeEvent.status === 'ACTIVE' 
            ? (timerExpired ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)')
            : '#ffffff',
          color: activeEvent.status === 'ACTIVE' ? (timerExpired ? '#991b1b' : '#ffffff') : '#0f172a',
          border: activeEvent.status === 'ACTIVE'
            ? (timerExpired ? '2px solid #ef4444' : '1px solid #4338ca')
            : '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: activeEvent.status === 'ACTIVE' ? '0 8px 24px rgba(79, 70, 229, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{
                  background: activeEvent.status === 'ACTIVE' 
                    ? (timerExpired ? '#dc2626' : '#22c55e') 
                    : '#e2e8f0',
                  color: activeEvent.status === 'ACTIVE' ? '#ffffff' : '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {activeEvent.status === 'ACTIVE' ? (timerExpired ? '10-MIN GRACE EXPIRED' : 'EVENT IN PROGRESS') : 'SCHEDULED'}
                </span>
                <span style={{ fontSize: '0.82rem', opacity: 0.85, fontWeight: 500 }}>
                  Day {activeEvent.day_number} • {activeEvent.event_date} • {activeEvent.start_time} to {activeEvent.end_time}
                </span>
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {activeEvent.event_name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.84rem', opacity: 0.9 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={14} /> {activeEvent.venue_zone}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sun size={14} /> {activeEvent.weather_forecast}
                </span>
              </div>
            </div>

            {/* Countdown Timer Display */}
            {activeEvent.status === 'ACTIVE' && (
              <div style={{
                background: timerExpired ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                padding: '16px 24px',
                borderRadius: '14px',
                border: timerExpired ? '1px solid #fecaca' : '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                minWidth: '220px'
              }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', color: timerExpired ? '#dc2626' : '#a5b4fc' }}>
                  {timerExpired ? 'LATE PENALTY PROTOCOL' : '10-MIN GATE CHECK-IN TIMER'}
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em',
                  color: timerExpired ? '#dc2626' : '#ffffff',
                  marginTop: '4px'
                }}>
                  {formatTimer(secondsRemaining)}
                </div>
                <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '2px', color: timerExpired ? '#991b1b' : '#c7d2fe' }}>
                  {timerExpired ? 'Grace expired. Backup vendors alerted.' : 'Vendors must send /attend <ID> in bot'}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {activeEvent.status !== 'ACTIVE' ? (
                <button
                  onClick={() => handleStartEvent(activeEvent)}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <Play size={16} /> Start Event (10-Min Timer)
                </button>
              ) : (
                <button
                  onClick={() => handleResetEvent(activeEvent)}
                  style={{
                    background: timerExpired ? '#dc2626' : '#ffffff',
                    color: timerExpired ? '#ffffff' : '#312e81',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={15} /> Reset Demo Event
                </button>
              )}
            </div>
          </div>

          {/* Late Alert Banner if timer expired and vendors still pending */}
          {activeEvent.status === 'ACTIVE' && timerExpired && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px 18px',
              marginTop: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#991b1b'
            }}>
              <AlertTriangle size={20} color="#dc2626" />
              <div style={{ fontSize: '0.84rem' }}>
                <b>GATE WINDOW TIMEOUT (10 MINUTES EXCEEDED):</b> Any contracted vendor that has not submitted gate clearance via <code>/attend &lt;ID&gt;</code> is automatically flagged as <b>RED - LATE</b>. KnotCore Contingency Standby and Overtime Penalty Guards have been notified.
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. ASSIGNED CHOSEN VENDORS GATE CHECK-IN MANIFEST (Only Contracted Suppliers 1, 2, 6, 9) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Assigned Chosen Vendors Gate Manifest ({chosenVendors.length} Contracted Suppliers)
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
              Only awarded vendors holding official Purchase Orders are authorized for gate access. Uncontracted vendors typing <code>/attend</code> will receive access denied.
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 }}>
            Telegram: @Royalknot_vendors_bot
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Vendor ID</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Supplier Name</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Category</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Purchase Order</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Call Time</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Gate Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chosenVendors.map((v) => {
                const isCheckedIn = v.live_status === 'CHECKED_IN' || v.checkin_status === 'CHECKED_IN';
                const isLate = timerExpired && !isCheckedIn;

                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#4f46e5' }}>
                      #{v.id}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{v.phone} • {v.city}</div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {v.category_name} ({v.category_code})
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>
                      {v.purchase_order_ref}
                    </td>
                    <td style={{ padding: '14px', color: '#64748b', fontWeight: 600 }}>
                      {v.call_time}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {isCheckedIn ? (
                        <span style={{
                          background: '#f0fdf4',
                          color: '#15803d',
                          border: '1px solid #bbf7d0',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <CheckCircle2 size={13} /> VERIFIED ARRIVAL
                        </span>
                      ) : isLate ? (
                        <span style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <AlertOctagon size={13} /> RED - LATE (TIMEOUT)
                        </span>
                      ) : (
                        <span style={{
                          background: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <Clock size={13} /> PENDING (/attend {v.id})
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {!isCheckedIn && (
                        <button
                          onClick={() => handleSimulateVendorAttendance(v.id)}
                          disabled={simulatingVendorId === v.id}
                          className="btn-outline"
                          style={{
                            fontSize: '0.78rem',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <UserCheck size={13} />
                          {simulatingVendorId === v.id ? 'Checking In...' : `Simulate /attend ${v.id}`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MASTER 3-DAY WEATHER-SYNCHRONIZED ITINERARY CARDS (10:00 AM - 10:00 PM) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              Full 3-Day Wedding Itinerary & Hourly Timeline
            </h3>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
              All events conform strictly to 10:00 AM – 10:00 PM operating bounds. Click any event to set it active or start its 10-minute check-in timer.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={14} color="#f59e0b" /> Day Events (10 AM - 5 PM)
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
              <Moon size={14} color="#6366f1" /> Evening Events (5 PM - 10 PM)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {events.map((ev, idx) => {
            const isCurrent = activeEvent?.id === ev.id;
            const isEvening = ev.start_time.includes('PM') && parseInt(ev.start_time) >= 5 && parseInt(ev.start_time) !== 12;

            return (
              <div
                key={ev.id}
                onClick={() => setActiveEvent(ev)}
                style={{
                  border: isCurrent ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  background: isCurrent ? '#f5f3ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: isEvening ? '#ede9fe' : '#fef3c7',
                    color: isEvening ? '#6d28d9' : '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}>
                    D{ev.day_number}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {ev.event_name}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: ev.status === 'ACTIVE' ? '#22c55e' : '#f1f5f9',
                        color: ev.status === 'ACTIVE' ? '#ffffff' : '#64748b'
                      }}>
                        {ev.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#4f46e5' }}>
                        <Clock size={13} /> {ev.start_time} – {ev.end_time}
                      </span>
                      <span>•</span>
                      <span>{ev.event_date}</span>
                      <span>•</span>
                      <span>{ev.venue_zone}</span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sun size={12} /> {ev.weather_forecast}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {ev.status !== 'ACTIVE' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEvent(ev); }}
                      style={{
                        background: '#4f46e5',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Play size={13} /> Start Event
                    </button>
                  ) : (
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s infinite' }}></span>
                      Active Timer Running
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
