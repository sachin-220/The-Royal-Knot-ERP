import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, Play, RefreshCw, 
  Truck, ShieldAlert, Plus, MapPin, ChevronRight, Activity 
} from 'lucide-react';

export default function OperationsView({ weddingId }) {
  const [tasks, setTasks] = useState([]);
  const [runSheet, setRunSheet] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [activeStage, setActiveStage] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(2); // Default to Day 2 (Baraat & Pheras)
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ title: '', severity: 'high', location: '', action_taken: '' });
  const [simulatingTaskId, setSimulatingTaskId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      const [resTasks, resRun, resInc, resFleet] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/tasks`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/run-sheet`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/incidents`),
        fetch(`http://127.0.0.1:5000/api/weddings/${weddingId}/geotracker`)
      ]);
      const dataT = await resTasks.json();
      const dataR = await resRun.json();
      const dataI = await resInc.json();
      const dataF = await resFleet.json();
      setTasks(dataT);
      setRunSheet(dataR);
      setIncidents(dataI);
      setFleet(dataF);
    } catch (err) {
      console.error("Operations fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, [weddingId]);

  const handleSimulateDelay = async (taskId) => {
    try {
      setSimulatingTaskId(taskId);
      const res = await fetch(`http://127.0.0.1:5000/api/tasks/${taskId}/simulate-delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay_hours: 2.0 })
      });
      if (res.ok) {
        fetchOperationsData();
      }
    } catch (err) {
      console.error("Delay simulation error:", err);
    } finally {
      setSimulatingTaskId(null);
    }
  };

  const handleUpdateRunSheet = async (itemId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/run-sheet/${itemId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, delay_minutes: newStatus === 'live' ? 10 : 0 })
      });
      if (res.ok) {
        fetchOperationsData();
      }
    } catch (err) {
      console.error("Run sheet update error:", err);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...incidentForm, wedding_id: weddingId })
      });
      if (res.ok) {
        setShowIncidentModal(false);
        setIncidentForm({ title: '', severity: 'high', location: '', action_taken: '' });
        fetchOperationsData();
      }
    } catch (err) {
      console.error("Create incident error:", err);
    }
  };

  const filteredTasks = activeStage === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.stage.includes(activeStage));

  const filteredRunSheet = runSheet.filter(item => item.day_number === selectedDay);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-gold">Operations Command Centre</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>26 Tasks DAG • Ripple Delay Engine</span>
          </div>
          <h2 className="font-royal" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
            Palace Ground Operations & Minute-by-Minute Run Sheet
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Live execution tracking with real-time incident desk and GPS fleet logistics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setShowIncidentModal(true)}
            className="btn-royal-outline" 
            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            <ShieldAlert size={16} />
            <span>Report Emergency Incident</span>
          </button>

          <button onClick={fetchOperationsData} className="btn-royal-outline">
            <RefreshCw size={15} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Row 1: Active Incidents & Fleet Logistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        
        {/* Incidents Desk */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#f87171" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Emergency Incident Desk (Active Alerts)
              </h3>
            </div>
            <span className="badge badge-ruby" style={{ fontSize: '0.7rem' }}>
              {incidents.filter(i => i.status !== 'resolved').length} Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                style={{
                  background: inc.status === 'resolved' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${inc.status === 'resolved' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.35)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: inc.status === 'resolved' ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
                      {inc.incident_code}
                    </span>
                    <span className={`badge ${inc.severity === 'critical' ? 'badge-ruby' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {inc.severity}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                    {inc.status === 'resolved' ? '✓ Resolved' : '⚡ Action In Progress'}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                  {inc.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-pink-royal)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {inc.location}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'rgba(5, 9, 20, 0.4)', padding: '8px 12px', borderRadius: '4px' }}>
                  <strong style={{ color: 'var(--color-gold-light)' }}>Action Taken:</strong> {inc.action_taken}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue GeoTracker Fleet */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Live GeoTracker Fleet
              </h3>
            </div>
            <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
              Jaipur Palace Transit
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fleet.map((v) => (
              <div 
                key={v.id}
                style={{
                  background: 'rgba(22, 38, 82, 0.4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-gold)', fontSize: '0.85rem' }}>{v.vehicle_code}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>• Driver: {v.driver_name}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{v.cargo_type}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Dest: {v.destination}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: v.eta_minutes === 0 ? '#34d399' : 'var(--color-gold-light)' }}>
                    {v.eta_minutes === 0 ? 'ARRIVED' : `${v.eta_minutes}m ETA`}
                  </div>
                  <span className={`badge ${v.eta_minutes === 0 ? 'badge-emerald' : 'badge-sapphire'}`} style={{ fontSize: '0.65rem' }}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Minute-by-Minute Run Sheet */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Live Minute-by-Minute Royal Run Sheet
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Real-time ceremonial progression with live status triggers for showrunners and banquet staff.
            </p>
          </div>

          {/* Day Selector Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedDay(1)}
              className={selectedDay === 1 ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Day 1: Mehendi & Sangeet
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={selectedDay === 2 ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Day 2: Baraat & Royal Pheras
            </button>
            <button
              onClick={() => setSelectedDay(3)}
              className={selectedDay === 3 ? 'btn-royal-gold' : 'btn-royal-outline'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              Day 3: Farewell Brunch
            </button>
          </div>
        </div>

        {/* Run Sheet Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px' }}>SCHEDULED</th>
                <th style={{ padding: '12px 14px' }}>EVENT & CEREMONY</th>
                <th style={{ padding: '12px 14px' }}>LOCATION</th>
                <th style={{ padding: '12px 14px' }}>LEAD PERSON</th>
                <th style={{ padding: '12px 14px' }}>CATEGORY</th>
                <th style={{ padding: '12px 14px' }}>STATUS</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRunSheet.map((item) => {
                const isLive = item.status === 'live';
                const isDone = item.status === 'completed';

                return (
                  <tr 
                    key={item.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isLive ? 'rgba(212, 175, 55, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-gold)' }}>
                      {item.scheduled_time}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isLive && <span className="live-dot" />}
                        <span>{item.event_name}</span>
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', fontWeight: 400, marginTop: '2px' }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--color-text-muted)' }}>
                      {item.location}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                      {item.lead_person}
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                      {item.vendor_category}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`badge ${isDone ? 'badge-emerald' : isLive ? 'badge-gold pulse-glow' : 'badge-sapphire'}`} style={{ fontSize: '0.68rem' }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {!isLive && !isDone && (
                          <button
                            onClick={() => handleUpdateRunSheet(item.id, 'live')}
                            className="btn-royal-outline"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', color: 'var(--color-gold-light)' }}
                          >
                            <Play size={11} /> Start Live
                          </button>
                        )}
                        {!isDone && (
                          <button
                            onClick={() => handleUpdateRunSheet(item.id, 'completed')}
                            className="btn-royal-outline"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                          >
                            <CheckCircle2 size={11} /> Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: 26-Node Dynamic Task Graph & Delay Simulator */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-gold)" />
              <h3 className="font-royal" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                26-Node Dynamic Task Dependency Graph (DAG)
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Interactive Ripple-Effect Simulator: Click "Simulate +2h Delay" to watch downstream dependencies adjust automatically.
            </p>
          </div>

          {/* Stage Filter */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'pre_wedding', 'day_1', 'day_2', 'day_3'].map(stage => (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                className={activeStage === stage ? 'btn-royal-gold' : 'btn-royal-outline'}
                style={{ padding: '5px 12px', fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                {stage.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
          {filteredTasks.map((t) => {
            const isCritical = t.is_critical_path;
            const isDelayed = t.delay_hours > 0;
            const isCompleted = t.status === 'completed';

            return (
              <div
                key={t.id}
                style={{
                  background: isDelayed 
                    ? 'rgba(239, 68, 68, 0.08)' 
                    : isCompleted 
                      ? 'rgba(16, 185, 129, 0.06)' 
                      : 'rgba(22, 38, 82, 0.4)',
                  border: isDelayed 
                    ? '1px solid rgba(239, 68, 68, 0.45)' 
                    : isCritical 
                      ? '1px solid var(--color-gold)' 
                      : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--color-gold)', fontSize: '0.8rem' }}>
                      {t.task_code}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {isCritical && (
                        <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          CRITICAL PATH
                        </span>
                      )}
                      <span className={`badge ${isCompleted ? 'badge-emerald' : isDelayed ? 'badge-ruby' : 'badge-sapphire'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                    {t.title}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
                    Duration: {t.duration_hours}h • Stage: {t.stage.replace('_', ' ')}
                  </div>

                  {t.dependencies && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-gold-light)', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                      Depends on: <strong>{t.dependencies}</strong>
                    </div>
                  )}

                  {isDelayed && (
                    <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginBottom: '8px' }}>
                      ⚠️ Ripple Delay: +{t.delay_hours} Hours
                    </div>
                  )}
                </div>

                {/* Simulate Ripple Delay Button */}
                <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => handleSimulateDelay(t.id)}
                    disabled={simulatingTaskId === t.id}
                    className="btn-royal-outline"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '5px' }}
                  >
                    {simulatingTaskId === t.id ? 'Simulating Ripple...' : '⚡ Simulate +2h Delay'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Modal */}
      {showIncidentModal && (
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
          <div className="glass-panel" style={{ width: '500px', padding: '28px' }}>
            <h3 className="font-royal" style={{ margin: '0 0 16px', fontSize: '1.3rem' }}>
              Report Emergency Operational Incident
            </h3>
            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>INCIDENT TITLE</label>
                <input
                  required
                  placeholder="e.g. Weather gust over South Lawn marquee"
                  value={incidentForm.title}
                  onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>SEVERITY</label>
                <select
                  value={incidentForm.severity}
                  onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>LOCATION</label>
                <input
                  required
                  placeholder="e.g. Rambagh Palace Fountain Garden"
                  value={incidentForm.location}
                  onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>ACTION TAKEN / MITIGATION</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Immediate response team dispatched with standby blowers..."
                  value={incidentForm.action_taken}
                  onChange={e => setIncidentForm({ ...incidentForm, action_taken: e.target.value })}
                  style={{ width: '100%', background: 'rgba(5,9,20,0.8)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowIncidentModal(false)} className="btn-royal-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-royal-gold">
                  Dispatch & Record Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
