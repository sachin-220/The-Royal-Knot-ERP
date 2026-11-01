import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import CockpitView from './components/CockpitView';
import EnquiriesView from './components/EnquiriesView';
import InquiryQuotationsView from './components/InquiryQuotationsView';
import EventScheduleView from './components/EventScheduleView';
import BudgetVendorView from './components/BudgetVendorView';
import VendorDirectoryView from './components/VendorDirectoryView';
import WeddingPlanSetterView from './components/WeddingPlanSetterView';
import VendorCoordinationView from './components/VendorCoordinationView';
import ExecutiveBIView from './components/ExecutiveBIView';
import BigDayScheduleView from './components/BigDayScheduleView';
import FinanceSettlementView from './components/FinanceSettlementView';
import WristbandVisitorScannerView from './components/WristbandVisitorScannerView';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('knotcore_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('cockpit');
  const [weddings, setWeddings] = useState([]);
  const [selectedWedding, setSelectedWedding] = useState(null);
  const [founderData, setFounderData] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validate session on mount
  useEffect(() => {
    const token = localStorage.getItem('knotcore_access_token');
    if (token) {
      fetch('http://127.0.0.1:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      })
      .then(res => {
        if (!res.ok) throw new Error("Session expired or invalid");
        return res.json();
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('knotcore_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {
        localStorage.removeItem('knotcore_access_token');
        localStorage.removeItem('knotcore_user');
        setCurrentUser(null);
      });
    }
  }, []);

  // Fetch Master Data & DB Health when user is authenticated
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
    if (currentUser) {
      fetchAllData();
      // Periodic DB heartbeat check every 15 seconds
      const interval = setInterval(() => {
        fetch('http://127.0.0.1:5000/api/health')
          .then(res => res.json())
          .then(data => setDbHealth(data))
          .catch(err => console.warn("DB heartbeat ping failed", err));
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Enforce RBAC route protection: if current role is not authorized for activeTab, fallback to cockpit
  useEffect(() => {
    if (currentUser && currentUser.allowed_modules) {
      if (!currentUser.allowed_modules.includes(activeTab)) {
        setActiveTab('cockpit');
      }
    }
  }, [currentUser, activeTab]);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    if (user?.allowed_modules && !user.allowed_modules.includes(activeTab)) {
      setActiveTab('cockpit');
    }
    fetchAllData();
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('knotcore_access_token');
      await fetch('http://127.0.0.1:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      localStorage.removeItem('knotcore_access_token');
      localStorage.removeItem('knotcore_user');
      setCurrentUser(null);
      setActiveTab('cockpit');
    }
  };

  // Helper to check if a module is allowed for the user
  const isModuleAuthorized = (moduleKey) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return currentUser.allowed_modules ? currentUser.allowed_modules.includes(moduleKey) : false;
  };

  // If user is unauthenticated, show the redesigned luxury split-screen LoginView
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f4', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navigation Navbar with Dropdown Submenus & RBAC Filtering */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weddings={weddings}
        selectedWedding={selectedWedding}
        setSelectedWedding={setSelectedWedding}
        dbHealth={dbHealth}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Database Alert Banner if Disconnected */}
      {error && (
        <div style={{
          maxWidth: '1440px',
          margin: '20px auto 0',
          width: 'calc(100% - 64px)',
          padding: '14px 20px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#dc2626'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{error}</div>
          </div>
          <button onClick={fetchAllData} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* Main Centered Content Canvas */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 32px 48px',
        boxSizing: 'border-box'
      }}>
        {loading && !selectedWedding ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#71717a' }}>
            <div className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#18181b', marginBottom: '8px' }}>
              Connecting to PostgreSQL 16 & KnotCore ERP
            </div>
            <div style={{ fontSize: '0.84rem' }}>
              Syncing wedding ledgers, ML conversion models, and vendor matrices.
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'cockpit' && isModuleAuthorized('cockpit') && (
              <CockpitView 
                wedding={selectedWedding} 
                founderData={founderData} 
                dbHealth={dbHealth} 
              />
            )}

            {activeTab === 'finance_settlement' && isModuleAuthorized('finance_settlement') && (
              <FinanceSettlementView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'command_centre' && isModuleAuthorized('command_centre') && (
              <BigDayScheduleView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'wristband_tracker' && isModuleAuthorized('wristband_tracker') && (
              <WristbandVisitorScannerView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'executive_bi' && isModuleAuthorized('executive_bi') && (
              <ExecutiveBIView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'enquiries' && isModuleAuthorized('enquiries') && (
              <EnquiriesView />
            )}

            {activeTab === 'event_schedule' && isModuleAuthorized('event_schedule') && (
              <EventScheduleView />
            )}

            {activeTab === 'inquiry_quotations' && isModuleAuthorized('inquiry_quotations') && (
              <InquiryQuotationsView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'budget' && isModuleAuthorized('budget') && (
              <BudgetVendorView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {activeTab === 'vendors' && isModuleAuthorized('vendors') && (
              <VendorDirectoryView />
            )}

            {activeTab === 'plansetter' && isModuleAuthorized('plansetter') && (
              <WeddingPlanSetterView />
            )}

            {activeTab === 'vendor_coordination' && isModuleAuthorized('vendor_coordination') && (
              <VendorCoordinationView 
                weddingId={selectedWedding?.id || 1} 
              />
            )}

            {/* If tab is not authorized for role, show clean Least-Privilege Notice */}
            {!isModuleAuthorized(activeTab) && (
              <div style={{
                padding: '60px 30px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e4e4e7',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <ShieldAlert size={44} color="#dc2626" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#18181b', margin: '0 0 8px 0' }}>
                  Restricted Least-Privilege Module
                </h2>
                <p style={{ fontSize: '0.86rem', color: '#71717a', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Your assigned role (<strong>{currentUser?.role?.replace('_', ' ')}</strong>) does not have access permissions for this module.
                </p>
                <button
                  onClick={() => setActiveTab('cockpit')}
                  style={{
                    background: '#18181b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Clean Editorial Footer */}
      <footer style={{
        borderTop: '1px solid #e7e7e4',
        background: '#ffffff',
        padding: '16px 32px',
        fontSize: '0.76rem',
        color: '#71717a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          KnotCore ERP Architecture • Luxury Wedding Planning & Venue Management
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <span>PostgreSQL: <strong>127.0.0.1:5432</strong></span>
          <span>Database: <strong>knotcore_db</strong></span>
          <span>Role: <strong>{currentUser?.role?.replace('_', ' ').toUpperCase()}</strong></span>
        </div>
      </footer>

    </div>
  );
}
