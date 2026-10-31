import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import CockpitView from './components/CockpitView';
import EnquiriesView from './components/EnquiriesView';
import BudgetVendorView from './components/BudgetVendorView';
import OperationsView from './components/OperationsView';
import GateFinanceView from './components/GateFinanceView';
import ConciergeModal from './components/ConciergeModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Roboto, sans-serif' }}>
      
      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dbHealth={dbHealth} 
      />

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          weddings={weddings}
          selectedWedding={selectedWedding}
          setSelectedWedding={setSelectedWedding}
        />

        {/* Database Alert Banner if Disconnected */}
        {error && (
          <div style={{
            margin: '20px 32px 0',
            padding: '14px 20px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#dc2626'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>
            </div>
            <button onClick={fetchAllData} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Main Workspace Body */}
        <main style={{ flex: 1, padding: '24px 32px 40px' }}>
          {loading && !selectedWedding ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                Connecting to PostgreSQL 16 & KnotCore ERP...
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                Syncing wedding ledgers, ML conversion models, and vendor matrices.
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

        {/* Clean Modern Footer */}
        <footer style={{
          padding: '14px 32px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <div>
            KnotCore Luxury Wedding Planning Management System. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>PostgreSQL: <strong>127.0.0.1:5432</strong></span>
            <span>Database: <strong>knotcore_db</strong></span>
            <span>Architecture: <strong>Native Odoo ERP LGPL-3.0</strong></span>
          </div>
        </footer>

      </div>

      {/* Floating Concierge Modal if needed */}
      <ConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        wedding={selectedWedding}
      />

    </div>
  );
}
