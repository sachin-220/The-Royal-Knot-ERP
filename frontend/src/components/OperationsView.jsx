import React, { useState, useEffect } from 'react';
import { 
  Clock, AlertTriangle, CheckCircle2, Play, RefreshCw, 
  Truck, ShieldAlert, Plus, MapPin, ChevronRight, Activity, Check
} from 'lucide-react';

export default function OperationsView({ weddingId }) {
  const [tasks, setTasks] = useState([]);
  const [runSheet, setRunSheet] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [activeStage, setActiveStage] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(2);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            CRITICAL PATH TASKS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            26 Tasks
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Dynamic DAG Dependency Model
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            ACTIVE INCIDENTS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: incidents.filter(i => i.status !== 'resolved').length > 0 ? '#dc2626' : '#059669', marginBottom: '4px' }}>
            {incidents.filter(i => i.status !== 'resolved').length} Alerts
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Emergency Resolution Desk
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            TRANSIT FLEET
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '4px' }}>
            {fleet.length} Vehicles
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Live GPS Tracking
          </div>
        </div>

        <div className="saas-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>
            RUN SHEET PROGRESSION
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            Day {selectedDay} Active
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            Ceremony Sequence Synced
          </div>
        </div>
      </div>

      {/* Incidents Desk & Fleet Logistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        
        {/* Incidents Desk */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Incident Resolution Desk
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Operational safeguards and fast mitigation protocols.
              </p>
            </div>
            <button 
              onClick={() => setShowIncidentModal(true)}
              className="btn-outline" 
              style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#dc2626', borderColor: '#fca5a5' }}
            >
              Report Incident
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map((inc) => (
              <div 
                key={inc.id}
                style={{
                  background: inc.status === 'resolved' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${inc.status === 'resolved' ? '#bbf7d0' : '#fecaca'}`,
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: inc.status === 'resolved' ? '#059669' : '#dc2626', fontSize: '0.82rem' }}>
                      {inc.incident_code}
                    </span>
                    <span className={`badge ${inc.severity === 'critical' ? 'badge-ruby' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {inc.severity.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {inc.status === 'resolved' ? 'Resolved' : 'Action In Progress'}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#0f172a', marginBottom: '2px' }}>
                  {inc.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '6px' }}>
                  Location: {inc.location}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#334155', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <strong>Action:</strong> {inc.action_taken}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Venue GeoTracker Fleet */}
        <div className="saas-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Fleet Logistics
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Active palace transit vehicles.
              </p>
            </div>
            <span className="badge badge-primary">
              Live GPS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fleet.map((v) => (
              <div 
                key={v.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.82rem' }}>{v.vehicle_code}</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Driver: {v.driver_name}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{v.cargo_type}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Dest: {v.destination}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: v.eta_minutes === 0 ? '#059669' : '#0f172a' }}>
                    {v.eta_minutes === 0 ? 'ARRIVED' : `${v.eta_minutes}m ETA`}
                  </div>
                  <span className={`badge ${v.eta_minutes === 0 ? 'badge-emerald' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minute-by-Minute Run Sheet */}
      <div className="saas-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Minute-by-Minute Run Sheet
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Ceremonial progression with live status triggers for coordinators.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: selectedDay === day ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: selectedDay === day ? '#4f46e5' : '#ffffff',
                  color: selectedDay === day ? '#ffffff' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Day {day}: {day === 1 ? 'Mehendi & Sangeet' : day === 2 ? 'Baraat & Pheras' : 'Farewell Brunch'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>SCHEDULED</th>
                <th>EVENT & CEREMONY</th>
                <th>LOCATION</th>
                <th>LEAD PERSON</th>
                <th>CATEGORY</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRunSheet.map((item) => {
                const isLive = item.status === 'live';
                const isDone = item.status === 'completed';

                return (
                  <tr 
                    key={item.id}
                    style={{ background: isLive ? '#eef2ff' : 'transparent' }}
                  >
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                      {item.scheduled_time}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {item.event_name}
                      {item.notes && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ color: '#64748b' }}>{item.location}</td>
                    <td style={{ fontWeight: 500, color: '#0f172a' }}>{item.lead_person}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.vendor_category}</td>
                    <td>
                      <span className={`badge ${isDone ? 'badge-emerald' : isLive ? 'badge-primary' : 'badge-amber'}`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {!isLive && !isDone && (
                          <button
                            onClick={() => handleUpdateRunSheet(item.id, 'live')}
                            className="btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          >
                            Start Live
                          </button>
                        )}
                        {!isDone && (
                          <button
                            onClick={() => handleUpdateRunSheet(item.id, 'completed')}
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          >
                            Mark Done
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

      {/* 26-Task Dependency Table */}
      <div className="saas-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              26 Critical Tasks DAG
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Task execution sequence with automated ripple delay calculations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'Setup', 'Catering', 'Ceremony'].map((stage) => (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: activeStage === stage ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                  background: activeStage === stage ? '#4f46e5' : '#ffffff',
                  color: activeStage === stage ? '#ffffff' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>CODE</th>
                <th>TASK NAME</th>
                <th>STAGE</th>
                <th>DURATION</th>
                <th>DELAY</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>SIMULATE DELAY</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const isDelayed = t.delay_hours > 0;
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>
                      {t.task_code}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {t.name}
                    </td>
                    <td style={{ color: '#64748b' }}>{t.stage}</td>
                    <td style={{ fontFamily: 'monospace' }}>{t.duration_hours}h</td>
                    <td style={{ fontFamily: 'monospace', color: isDelayed ? '#dc2626' : '#64748b', fontWeight: isDelayed ? 700 : 400 }}>
                      {isDelayed ? `+${t.delay_hours}h` : '0h'}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'completed' ? 'badge-emerald' : isDelayed ? 'badge-ruby' : 'badge-primary'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleSimulateDelay(t.id)}
                        disabled={simulatingTaskId === t.id}
                        className="btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                      >
                        {simulatingTaskId === t.id ? 'Simulating...' : '+2h Delay'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Modal */}
      {showIncidentModal && (
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
              Report Incident Alert
            </h3>
            <form onSubmit={handleCreateIncident} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Incident Title</label>
                <input
                  type="text"
                  required
                  value={incidentForm.title}
                  onChange={e => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Location</label>
                <input
                  type="text"
                  required
                  value={incidentForm.location}
                  onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>Action Taken</label>
                <textarea
                  rows={2}
                  required
                  value={incidentForm.action_taken}
                  onChange={e => setIncidentForm({ ...incidentForm, action_taken: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowIncidentModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Submit Alert</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
