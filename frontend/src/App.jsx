import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CockpitView from './components/CockpitView';
import EnquiriesView from './components/EnquiriesView';
import BudgetVendorView from './components/BudgetVendorView';
import OperationsView from './components/OperationsView';
import GateFinanceView from './components/GateFinanceView';
import ConciergeModal from './components/ConciergeModal';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [founderData, setFounderData] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Master Data & DB Health
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check DB Health
      const resHealth = await fetch('http://127.0.0.1:5000/api/health');
      if (!resHealth.ok) throw new Error("Database health check failed");
      const healthData = await resHealth.json();
      setDbHealth(healthData);

      // Fetch Weddings & Founder Cockpit Data
      const [resWeddings, resFounder] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/weddings'),
        fetch('http://127.0.0.1:5000/api/founder/cockpit')
      ]);

      const wData = await resWeddings.json();
      const fData = await resFounder.json();

      setWeddings(wData);
      setFounderData(fData);

      if (wData && wData.length > 0 && !selectedWedding) {
        setSelectedWedding(wData[0]);
      }
    } catch (err) {
      console.error("Connection or fetch error:", err);
      setError("Unable to connect to KnotCore Backend / PostgreSQL Database. Ensure backend is running on http://127.0.0.1:5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Periodic DB heartbeat check every 15 seconds
    const interval = setInterval(() => {
      fetch('http://127.0.0.1:5000/api/health')
        .then(res => res.json())
        .then(data => setDbHealth(data))
        .catch(err => console.warn("DB heartbeat ping failed", err));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weddings={weddings}
        selectedWedding={selectedWedding}
        setSelectedWedding={setSelectedWedding}
        dbHealth={dbHealth}
        refreshData={fetchAllData}
        onOpenConcierge={() => setIsConciergeOpen(true)}
      />

      {/* Disconnection Warning Banner if any */}
      {error && (
        <div style={{
          margin: '0 24px 20px',
          padding: '16px 24px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#f87171'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Database Connection Alert</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)' }}>{error}</div>
            </div>
          </div>
          <button onClick={fetchAllData} className="btn-royal-outline" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main style={{ flex: 1, padding: '0 24px 40px' }}>
        {loading && !selectedWedding ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--color-gold-light)' }}>
            <div className="font-royal" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
              Connecting to PostgreSQL 16 & KnotCore ERP...
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Fetching real-time wedding ledgers, ML plate buffers, and 18-category matrix.
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'cockpit' && (
              <CockpitView 
                wedding={selectedWedding} 
                founderData={founderData} 
                dbHealth={dbHealth} 
              />
            )}

            {activeTab === 'enquiries' && (
              <EnquiriesView />
            )}

            {activeTab === 'budget' && (
              <BudgetVendorView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'operations' && (
              <OperationsView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'gate_finance' && (
              <GateFinanceView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}
          </>
        )}
      </main>

      {/* Floating AI Concierge Modal */}
      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        wedding={selectedWedding}
      />

      {/* Footer */}
      <footer style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        background: 'rgba(5, 9, 20, 0.85)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: 'var(--color-text-dim)'
      }}>
        <div>
          © 2026-2027 The Royal Knot Luxury Destination Weddings (Jaipur & Udaipur). All Rights Reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>PostgreSQL: <strong>127.0.0.1:5432</strong></span>
          <span>Database: <strong>knotcore_db</strong></span>
          <span>Architecture: <strong>Native Odoo ERP LGPL-3.0</strong></span>
        </div>
      </footer>

    </div>
  );
}
