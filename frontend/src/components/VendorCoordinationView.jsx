import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, Send, Image, Upload,
  Mail, Bot, Shield, ChevronRight, Check, RefreshCw, FileText,
  UserCheck, ExternalLink, Calendar, Lock, Layers, Zap, Eye, EyeOff
} from 'lucide-react';

export default function VendorCoordinationView({ weddingId = 1 }) {
  // Master State
  const [projectData, setProjectData] = useState(null);
  const [themes, setThemes] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Payment Confirmation State
  const [paymentMessage, setPaymentMessage] = useState('payment of 300000 is done');
  const [paymentAmount, setPaymentAmount] = useState('9000000');

  // Vendor Coordination Chat State
  const [selectedCategory, setSelectedCategory] = useState('CAT-01');
  const [activeVendorChat, setActiveVendorChat] = useState({ messages: [], tasks: [] });
  const [chatInput, setChatInput] = useState('');
  const [photoProofUrl, setPhotoProofUrl] = useState('');
  const [viewMode, setViewMode] = useState('management'); // 'management' or 'vendor_isolated'
  const [selectedVendorEmail, setSelectedVendorEmail] = useState('');

  // 28 Tasks Filter
  const [taskFilter, setTaskFilter] = useState('all');
  const chatBottomRef = useRef(null);

  // 1. Fetch Project & Plan Details
  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const [resProj, resThemes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/scene3/project/${weddingId}`),
        fetch(`http://127.0.0.1:5000/api/scene3/themes?destination=Jaipur&budget=30000000`)
      ]);

      const pData = await resProj.json();
      const tData = await resThemes.json();

      setProjectData(pData);
      setThemes(tData);

      if (pData?.plan?.theme_name) {
        const found = tData.find(t => t.name === pData.plan.theme_name);
        if (found) setSelectedThemeId(found.id);
      } else if (tData.length > 0) {
        setSelectedThemeId(tData[0].id);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Isolated Vendor Conversation
  const fetchVendorChat = async (catCode) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/scene3/vendor-chat/${weddingId}/${catCode}`);
      const data = await res.json();
      setActiveVendorChat(data);
    } catch (err) {
      console.error('Error fetching vendor chat:', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [weddingId]);

  useEffect(() => {
    if (selectedCategory) {
      fetchVendorChat(selectedCategory);
    }
  }, [selectedCategory, weddingId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeVendorChat?.messages]);

  // Handle Payment Confirmation & Trigger Workflow
  const handlePaymentConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene3/payment-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          message: paymentMessage,
          amount: parseFloat(paymentAmount) || 9000000.0
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: '30% Milestone Payment Confirmed',
          message: data.message
        });
        await fetchProjectData();
      } else {
        setNotification({
          type: 'error',
          title: 'Payment Confirmation Notice',
          message: data.error || 'Failed to record payment milestone.'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Announce to All Vendors ("Proceed" Button)
  const handleAnnounceToVendors = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene3/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Operational Tasks Broadcasted',
          message: `Dispatched ${data.announcements.length} isolated vendor schedules via @Royalknot_vendors_bot.`
        });
        await fetchProjectData();
        await fetchVendorChat(selectedCategory);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Announcement Failed',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Send Vendor Bot Message / Proof Submission
  const handleSendMessage = async (customText, customPhoto) => {
    const textToSend = customText || chatInput;
    const photoToSend = customPhoto || photoProofUrl;

    if (!textToSend.trim() && !photoToSend.trim()) return;

    try {
      setActionLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene3/vendor-chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wedding_id: weddingId,
          category_code: selectedCategory,
          message: textToSend,
          photo_url: photoToSend || null,
          sender_type: viewMode === 'vendor_isolated' ? 'vendor' : 'planner'
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatInput('');
        setPhotoProofUrl('');
        await fetchVendorChat(selectedCategory);
        await fetchProjectData();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Daily Email Summaries Dispatch
  const handleSendDailySummaries = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('http://127.0.0.1:5000/api/scene3/send-daily-summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingId })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          title: 'Daily Task Summaries Dispatched',
          message: `Sent planner task & overdue digest to sachinpriya1503@gmail.com and isolated task schedules to partner vendors!`
        });
      } else {
        setNotification({
          type: 'error',
          title: 'Email Dispatch Warning',
          message: data.error || 'Failed to dispatch emails.'
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Email Error',
        message: err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  const project = projectData?.project;
  const milestone = projectData?.milestone;
  const weddingPlan = projectData?.plan;
  const tasks = projectData?.tasks || [];
  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filter tasks for audit table
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'done') return t.status === 'done';
    if (taskFilter === 'pending') return t.status !== 'done';
    return true;
  });

  // Extract unique vendor categories from tasks
  const vendorCategories = [
    { code: 'CAT-01', name: 'Wedding Decor & Architecture', vendor: 'Rambagh Palace Estate' },
    { code: 'CAT-02', name: 'Royal Catering & Banquets', vendor: 'Shahi Mewar Gourmet Feasts' },
    { code: 'CAT-03', name: 'Sound, Acoustics & Concert Audio', vendor: 'Desert Sonic Concert AV' },
    { code: 'CAT-04', name: 'Floral Design & Fresh Botanicals', vendor: 'Marwar Heritage Florals' },
    { code: 'CAT-05', name: 'Lighting, Trussing & SFX', vendor: 'Udaipur Starburst SFX' },
    { code: 'CAT-06', name: 'Cinematography & Photography', vendor: 'Mewar Royal Cinema' },
    { code: 'CAT-07', name: 'Live Music & Celebrity Artists', vendor: 'Desert Dhol & Folk Troupe' },
    { code: 'CAT-08', name: 'Stage Choreography & Royal Shows', vendor: 'Kalakar Heritage Troupes' },
    { code: 'CAT-09', name: 'Logistics, Vintage Fleet & Shuttles', vendor: 'Heritage Vintage Carriages' },
    { code: 'CAT-12', name: 'Valet Parking & Security Concourse', vendor: 'Black Eagle VIP Security' },
    { code: 'CAT-13', name: 'Financial Settlement & Tax Compliance', vendor: 'Royal Accounts & Audit' }
  ];

  const currentCategoryInfo = vendorCategories.find(c => c.code === selectedCategory) || vendorCategories[0];

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

      {/* 1. SCENE 3 EXECUTIVE STATUS BAR: PAYMENT CONFIRMATION & PLANNER AUDIT */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: '#e0e7ff',
                color: '#4338ca',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Scene 3 • Odoo Native Workflow
              </span>
              <span style={{
                background: milestone?.status === 'paid' ? '#dcfce7' : '#fef3c7',
                color: milestone?.status === 'paid' ? '#15803d' : '#b45309',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px'
              }}>
                {milestone?.status === 'paid' ? 'Deposit Paid & Confirmed' : 'Payment Awaiting Confirmation'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Instant Wedding Plan & Automated Vendor Coordination
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
              Gemini AI-powered luxury trend research, automated 28-task scheduling, and isolated bot channel coordination.
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleSendDailySummaries}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Mail size={16} color="#4f46e5" />
              Send Daily Email Summaries
            </button>

            <a
              href="https://t.me/Royalknot_vendors_bot"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#0284c7',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <Bot size={16} />
              Open @Royalknot_vendors_bot
            </a>
          </div>
        </div>

        {/* Payment Confirmation Card (30% Deposit = ₹90 Lakhs on ₹3 Cr) */}
        <div style={{
          marginTop: '20px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '18px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Booking Deposit Milestone (knotcore.payment.milestone)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              ₹90,00,000.00 <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>(30% of ₹3.0 Cr)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>
              Linked Odoo Account Move: <strong>{milestone?.account_move_ref || 'INV/2026/0001'}</strong>
            </div>
          </div>

          {/* Trigger Workflow Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              Client Payment Message Trigger (Executes Exactly Once):
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={paymentMessage}
                onChange={e => setPaymentMessage(e.target.value)}
                placeholder="e.g. payment of 300000 is done"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem'
                }}
              />
              <button
                onClick={handlePaymentConfirm}
                disabled={actionLoading}
                style={{
                  padding: '8px 16px',
                  background: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {milestone?.workflow_triggered ? 'Confirmed in DB' : 'Confirm & Generate Plan'}
              </button>
            </div>
          </div>

          {/* Smart Assigned Planner */}
          <div style={{
            background: '#ffffff',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>
              <UserCheck size={14} color="#4f46e5" />
              SMART ASSIGNED PLANNER (LEAST-LOADED)
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {project?.lead_planner_name || 'Daniel Carter (Lead Architect)'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
              Workload: 38% (Lowest Load) • Verified Skills Match
            </div>
          </div>
        </div>
      </div>

      {/* 2. GEMINI WEDDING PLANNER: 3 LUXURY INDIAN THEMES */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={20} color="#d97706" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Gemini Wedding Planner: Researched Indian Wedding Themes
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {themes.map((theme) => {
            const isSelected = selectedThemeId === theme.id || weddingPlan?.theme_name === theme.name;
            return (
              <div
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                style={{
                  border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '18px',
                  background: isSelected ? '#faf5ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 4px 16px rgba(79, 70, 229, 0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: isSelected ? '#e0e7ff' : '#f1f5f9',
                    color: isSelected ? '#4338ca' : '#475569'
                  }}>
                    {theme.tag || 'Luxury Theme'}
                  </span>
                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700 }}>
                      <Check size={14} /> Selected
                    </span>
                  )}
                </div>

                {/* Photorealistic Bridal Theme Visual Banner */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '240px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  margin: '12px 0 10px',
                  background: '#0f172a',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}>
                  <img
                    src={theme.image_url || (theme.id === 'theme_rajputana' ? '/themes/theme_rajputana.jpg' : theme.id === 'theme_mughal_rose' ? '/themes/theme_mughal_rose.jpg' : '/themes/theme_modern_minimalist.jpg')}
                    alt={`${theme.name} Bridal Look`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(4px)',
                    color: '#fde047',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Bridal Lookbook & Palette
                  </div>
                </div>

                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
                  {theme.name}
                </h3>

                <p style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 10px' }}>
                  "{theme.mood_summary}"
                </p>

                {/* Bridal Styling & Attire Description */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '0.76rem',
                  color: '#334155',
                  lineHeight: 1.45,
                  marginBottom: '12px'
                }}>
                  <strong style={{ color: '#0f172a' }}>Bridal Styling & Regalia: </strong>
                  {theme.bridal_styling || (theme.id === 'theme_rajputana'
                    ? 'Crimson red and antique gold zardozi velvet bridal lehenga with royal Rajput polki jewelry, traditional gold aad necklace, mathapatti, nath, and red chooda bangles with golden kaleerein.'
                    : theme.id === 'theme_mughal_rose'
                    ? 'Emerald green and blush pink Persian silk lehenga with delicate botanical floral threadwork and golden dabka, heirloom uncut emerald and basra pearl jewelry, and delicate mehendi.'
                    : 'Champagne ivory and metallic rose gold designer lehenga with delicate micro-sequin shimmer, modern diamond solitaire bridal jewelry, and sleek bridal styling.')}
                </div>

                {/* Color Palette Tiles */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                    CURATED COLOR PALETTE:
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {theme.color_palette?.map((color, cIdx) => (
                      <div
                        key={cIdx}
                        title={`${color.name}: ${color.hex}`}
                        style={{
                          flex: 1,
                          height: '24px',
                          borderRadius: '4px',
                          background: color.hex,
                          border: '1px solid rgba(0,0,0,0.1)'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45, marginBottom: '14px' }}>
                  <strong>Mandap & Décor Concept:</strong> {theme.decor_ideas}
                </div>

                {/* Reference Links */}
                {theme.reference_links && theme.reference_links.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                      INSPIRATION & LOOKBOOK REFERENCES:
                    </div>
                    {theme.reference_links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.74rem',
                          color: '#4f46e5',
                          textDecoration: 'none',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <ExternalLink size={11} /> {link}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PROJECT VELOCITY & AUTOMATIC 28 TASKS CONTROLLER */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Native Odoo project.project Master
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
              {project?.name || 'The Royal Wedding Operations Master (28 Tasks)'}
            </h2>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              Standard Full-Service Workflow: Design, Floral Walkthrough, Catering, Sound Audit, Mandap & Breakdown.
            </div>
          </div>

          {/* Proceed Announcement Button */}
          <button
            onClick={handleAnnounceToVendors}
            disabled={actionLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Zap size={18} />
            {project?.announced_to_vendors ? 'Re-Announce to Vendors via AI Bot' : 'Proceed: Announce to All Vendors via AI Bot'}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
            <span style={{ color: '#0f172a' }}>
              Operational Deliverables Progress ({completedCount} of {tasks.length || 28} Tasks Completed)
            </span>
            <span style={{ color: '#4f46e5' }}>{progressPct}% Executed</span>
          </div>
          <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #4f46e5 0%, #10b981 100%)',
              borderRadius: '5px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* 4. DEDICATED ISOLATED VENDOR COORDINATION & AI BOT TAB */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* Coordination Header with Isolation Switcher */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#4f46e5" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Vendor Coordination Bot: Isolated Supplier Stream
              </h2>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Connected to <strong>@Royalknot_vendors_bot</strong> • Strict Role Isolation • Photo Proof Verification
            </div>
          </div>

          {/* Access Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Security Mode:</div>
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => setViewMode('management')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'management' ? '#ffffff' : 'transparent',
                  color: viewMode === 'management' ? '#0f172a' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Lead Planner Master
              </button>
              <button
                onClick={() => setViewMode('vendor_isolated')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'vendor_isolated' ? '#ffffff' : 'transparent',
                  color: viewMode === 'vendor_isolated' ? '#0f172a' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Vendor Isolated View
              </button>
            </div>
          </div>
        </div>

        {/* Coordination Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: '520px' }}>

          {/* Left Pane: Isolated Vendor Channels List */}
          <div style={{ borderRight: '1px solid #e2e8f0', background: '#ffffff', overflowY: 'auto', maxHeight: '600px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              ISOLATED VENDOR ROOMS (18 SUPPLIERS)
            </div>

            {vendorCategories.map((cat) => {
              const isSelected = selectedCategory === cat.code;
              const catTasks = tasks.filter(t => t.category_code === cat.code);
              const catDone = catTasks.filter(t => t.status === 'done').length;

              return (
                <div
                  key={cat.code}
                  onClick={() => setSelectedCategory(cat.code)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f8fafc',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    borderLeft: `4px solid ${isSelected ? '#3b82f6' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#2563eb' : '#64748b' }}>
                      {cat.code}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: catDone === catTasks.length && catTasks.length > 0 ? '#dcfce7' : '#fef3c7',
                      color: catDone === catTasks.length && catTasks.length > 0 ? '#15803d' : '#b45309'
                    }}>
                      {catDone}/{catTasks.length} Done
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {cat.vendor}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    {cat.name}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Pane: Active Vendor Room & AI Bot Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

            {/* Room Header with Security Notice */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {currentCategoryInfo.vendor} ({currentCategoryInfo.name})
                  </h3>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    <Lock size={10} /> Strictly Isolated Stream
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Vendors must confirm assignments & submit completions via bot, not email.
                </div>
              </div>

              {/* Bot Link */}
              <a
                href="https://t.me/Royalknot_vendors_bot"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  color: '#0284c7',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <Bot size={14} /> @Royalknot_vendors_bot
              </a>
            </div>

            {/* Deliverables Assigned to this Vendor */}
            <div style={{ padding: '12px 20px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                Assigned Operational Deliverables ({activeVendorChat.tasks?.length || 0} Tasks):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activeVendorChat.tasks?.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      border: `1px solid ${t.status === 'done' ? '#bbf7d0' : '#cbd5e1'}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>{t.task_code}: </span>
                    <span style={{ color: '#0f172a' }}>{t.title} </span>
                    <span style={{
                      fontWeight: 700,
                      color: t.status === 'done' ? '#16a34a' : '#d97706',
                      marginLeft: '4px'
                    }}>
                      [{t.status.toUpperCase()}]
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeVendorChat.messages?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Bot size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>No announcements sent yet</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                    Click "Proceed: Announce to All Vendors" above to trigger automated assignment notices.
                  </div>
                </div>
              ) : (
                activeVendorChat.messages?.map((msg) => {
                  const isBot = msg.sender_type === 'bot';
                  const isVendor = msg.sender_type === 'vendor';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isBot ? 'center' : (isVendor ? 'flex-start' : 'flex-end'),
                        maxWidth: isBot ? '90%' : '75%',
                        background: isBot ? '#ffffff' : (isVendor ? '#ffffff' : '#4f46e5'),
                        color: isBot ? '#0f172a' : (isVendor ? '#0f172a' : '#ffffff'),
                        border: isBot ? '1px solid #c7d2fe' : (isVendor ? '1px solid #e2e8f0' : 'none'),
                        borderRadius: '10px',
                        padding: '12px 16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isBot ? '#4f46e5' : (isVendor ? '#0284c7' : '#e0e7ff') }}>
                          {msg.sender_name}
                        </span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div
                        style={{ fontSize: '0.82rem', lineHeight: 1.45 }}
                        dangerouslySetInnerHTML={{ __html: msg.message }}
                      />

                      {/* Photo Proof Attachment */}
                      {msg.photo_url && (
                        <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img
                            src={msg.photo_url}
                            alt="Photographic Proof"
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                          />
                          <div style={{ padding: '6px 10px', background: '#f8fafc', fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                            📸 Verified On-Site Photographic Proof
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Bot Response Shortcuts */}
            <div style={{ padding: '8px 20px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Vendor Quick Actions:</span>
              <button
                onClick={() => handleSendMessage('Confirmed. We have received the operational schedule and will execute as planned.')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Send "Confirmed"
              </button>
              <button
                onClick={() => handleSendMessage(
                  'Task 1 Completed. Structural CAD and spatial architecture finalized with photo proof attached.',
                  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
                )}
                style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Send "Task 1 Completed" + Photo
              </button>
              <button
                onClick={() => handleSendMessage(
                  'Task 4 Completed. Catering buffer tasting approved for 60 ML safety plates.',
                  'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'
                )}
                style={{ fontSize: '0.72rem', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              >
                Send "Task 4 Completed" + Photo
              </button>
            </div>

            {/* Inbound Composer */}
            <div style={{ padding: '14px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    viewMode === 'vendor_isolated'
                      ? 'Vendor: reply "Confirmed" or "Task [Code] Completed"...'
                      : 'Lead Planner: send special instructions to this vendor...'
                  }
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem'
                  }}
                />

                <input
                  type="text"
                  value={photoProofUrl}
                  onChange={e => setPhotoProofUrl(e.target.value)}
                  placeholder="Photo Proof URL (Optional)..."
                  style={{
                    width: '200px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem'
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={actionLoading}
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
                  <Send size={15} /> Send
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 5. 28 OPERATIONAL TASKS AUDIT TABLE */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Master Operational Tasks Ledger (project.task)
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Full-Service Package: Exactly 28 Tasks with Dependencies, Durations and Proof Verification
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'done', 'pending'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: taskFilter === filter ? '#4f46e5' : '#cbd5e1',
                  background: taskFilter === filter ? '#eef2ff' : '#ffffff',
                  color: taskFilter === filter ? '#4f46e5' : '#475569',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {filter} Tasks ({filter === 'all' ? tasks.length : (filter === 'done' ? completedCount : tasks.length - completedCount)})
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Code</th>
                <th style={{ padding: '10px 12px' }}>Task Title & Scope</th>
                <th style={{ padding: '10px 12px' }}>Category & Supplier</th>
                <th style={{ padding: '10px 12px' }}>Duration</th>
                <th style={{ padding: '10px 12px' }}>Dependencies</th>
                <th style={{ padding: '10px 12px' }}>Deadline</th>
                <th style={{ padding: '10px 12px' }}>Photo Proof</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: '#4f46e5' }}>
                    {t.task_code}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                    {t.title}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                    <div>{t.category_name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{t.assigned_vendor_name}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#334155' }}>
                    {t.duration_hours}h
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.76rem' }}>
                    {t.dependencies || 'None'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#b45309', fontWeight: 600 }}>
                    {t.deadline}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {t.photo_proof_url ? (
                      <a
                        href={t.photo_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <Image size={14} /> View
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: t.status === 'done' ? '#dcfce7' : (t.status === 'confirmed' ? '#e0e7ff' : '#fef3c7'),
                      color: t.status === 'done' ? '#15803d' : (t.status === 'confirmed' ? '#4338ca' : '#b45309')
                    }}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
