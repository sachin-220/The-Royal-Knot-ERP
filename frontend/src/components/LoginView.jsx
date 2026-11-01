import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Award, KeyRound } from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('KnotCore#SuperAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRolePreview, setSelectedRolePreview] = useState('super_admin');
  
  // Animation states: 'idle' | 'sliding' | 'authenticating' | 'success' | 'error'
  const [authStatus, setAuthStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Quick preset accounts for testing
  const demoAccounts = [
    {
      role: 'super_admin',
      label: 'Super Admin',
      badge: 'All Modules + Security',
      username: 'superadmin',
      pass: 'KnotCore#SuperAdmin2026!'
    },
    {
      role: 'admin',
      label: 'Admin',
      badge: 'Operations & Procurement',
      username: 'opsadmin',
      pass: 'KnotCore#OpsAdmin2026!'
    },
    {
      role: 'financial_manager',
      label: 'Financial Manager',
      badge: 'Ledgers, Settlements, Audits',
      username: 'finmanager',
      pass: 'KnotCore#FinManager2026!'
    }
  ];

  const handleSelectPreset = (acc) => {
    setIdentifier(acc.username);
    setPassword(acc.pass);
    setSelectedRolePreview(acc.role);
    setErrorMessage('');
  };

  const handleTriggerLogin = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your identifier and password.');
      return;
    }

    setErrorMessage('');
    // Step 1: Trigger the smooth card sliding animation from right to left
    setAuthStatus('sliding');

    // Step 2: Transition into the circular roller loading state
    setTimeout(async () => {
      setAuthStatus('authenticating');

      try {
        const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed. Please verify credentials.');
        }

        // Authentication Succeeded
        setSuccessInfo(data.user);
        setAuthStatus('success');

        // Store auth token in localStorage for persistence
        if (data.access_token) {
          localStorage.setItem('knotcore_access_token', data.access_token);
        }
        if (data.user) {
          localStorage.setItem('knotcore_user', JSON.stringify(data.user));
        }

        // Smooth redirect callback after brief confirmation
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user, data.access_token);
          }
        }, 850);

      } catch (err) {
        console.error('Login error:', err);
        setErrorMessage(err.message || 'Unable to authenticate. Please check backend connection.');
        setAuthStatus('error');
        // Reset back to idle after 1.8 seconds so user can correct credentials
        setTimeout(() => {
          setAuthStatus('idle');
        }, 1800);
      }
    }, 600);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Full-Page Background: wedding.png with low opacity & warm cream overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url('/wedding.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(3px)',
        transform: 'scale(1.03)',
        zIndex: 1
      }} />

      {/* Warm Cream, Soft Yellow and White Overlay for optimal contrast & readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 50% 45%, rgba(254, 252, 246, 0.82) 0%, rgba(248, 244, 233, 0.92) 55%, rgba(241, 236, 222, 0.97) 100%)',
        backdropFilter: 'blur(10px)',
        zIndex: 2
      }} />

      {/* Subtle Luxury Floral/Geometry Pattern Accents */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0) 70%)',
        top: '-10%',
        right: '-5%',
        zIndex: 3,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, rgba(217, 119, 6, 0) 70%)',
        bottom: '-10%',
        left: '-5%',
        zIndex: 3,
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphic Split-Screen Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '1000px',
        minHeight: '620px',
        borderRadius: '28px',
        background: 'rgba(255, 255, 255, 0.88)',
        border: '1px solid rgba(230, 220, 198, 0.75)',
        boxShadow: '0 30px 70px -15px rgba(24, 24, 27, 0.14), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        transition: 'all 0.4s ease'
      }}>

        {/* LEFT SECTION: Minimal Credentials Form */}
        <div style={{
          flex: '1 1 50%',
          padding: '48px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.94)',
          position: 'relative',
          zIndex: 5
        }}>
          <div>
            {/* Top Brand Monogram & Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.28)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 4.5L17.5 12 12 17.5 6.5 12 12 6.5z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '1.18rem', fontWeight: 700, color: '#18181b', letterSpacing: '-0.02em' }}>
                  KnotCore
                </div>
                <div style={{ fontSize: '0.70rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Luxury Wedding ERP
                </div>
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{
                margin: '0 0 6px 0',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#18181b',
                letterSpacing: '-0.03em',
                fontFamily: "'Playfair Display', Georgia, serif"
              }}>
                Welcome to KnotCore
              </h1>
              <p style={{
                margin: 0,
                fontSize: '0.86rem',
                color: '#71717a',
                lineHeight: 1.45
              }}>
                Enterprise identity authentication with role-based governance.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div style={{
                marginBottom: '20px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleTriggerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#3f3f46',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Email or Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                  <input
                    type="text"
                    id="login-identifier-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. superadmin"
                    disabled={authStatus === 'sliding' || authStatus === 'authenticating'}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #e4e4e7',
                      background: '#fafaf9',
                      fontSize: '0.88rem',
                      color: '#18181b',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d97706';
                      e.target.style.boxShadow = '0 0 0 3px rgba(217, 119, 6, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e4e4e7';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#3f3f46',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Password
                  </label>
                  <span style={{ fontSize: '0.74rem', color: '#b45309', cursor: 'pointer', fontWeight: 500 }}>
                    Encrypted Bcrypt
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={authStatus === 'sliding' || authStatus === 'authenticating'}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 42px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #e4e4e7',
                      background: '#fafaf9',
                      fontSize: '0.88rem',
                      color: '#18181b',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d97706';
                      e.target.style.boxShadow = '0 0 0 3px rgba(217, 119, 6, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e4e4e7';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#71717a',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Quick Role Preset Badges for Verification */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a', marginBottom: '8px' }}>
                  Quick RBAC Role Testing:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {demoAccounts.map((acc) => {
                    const isSelected = identifier === acc.username;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleSelectPreset(acc)}
                        style={{
                          background: isSelected ? '#fef3c7' : '#fafaf9',
                          border: isSelected ? '1px solid #d97706' : '1px solid #e4e4e7',
                          borderRadius: '8px',
                          padding: '8px 6px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: isSelected ? '#92400e' : '#27272a'
                        }}>
                          {acc.label}
                        </div>
                        <div style={{
                          fontSize: '0.64rem',
                          color: isSelected ? '#b45309' : '#71717a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {acc.username}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sign In CTA button */}
              <button
                type="submit"
                id="submit-auth-btn"
                disabled={authStatus === 'sliding' || authStatus === 'authenticating'}
                style={{
                  marginTop: '10px',
                  background: '#18181b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '0.90rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s, transform 0.1s',
                  boxShadow: '0 4px 12px rgba(24, 24, 27, 0.15)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#18181b'}
              >
                <span>Authorize & Sign In</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Bottom Security Assurance Footnote */}
          <div style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid #f4f4f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#a1a1aa'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#16a34a" />
              <span>Bcrypt Salted • HS256 JWT Signed</span>
            </div>
            <span>Port 5432 / PostgreSQL 16</span>
          </div>
        </div>

        {/* RIGHT SECTION: Interactive "LOGIN" Card with Sliding Animation & Circular Roller */}
        <div style={{
          flex: '1 1 50%',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #18181b 0%, #27272a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          {/* Subtle Warm Amber Glow Behind */}
          <div style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, rgba(0, 0, 0, 0) 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }} />

          {/* BACKGROUND ROLLER / LOADING VIEW (Revealed during authentication) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px',
            textAlign: 'center',
            color: '#ffffff',
            opacity: authStatus !== 'idle' ? 1 : 0,
            transition: 'opacity 0.4s ease'
          }}>
            {authStatus === 'success' ? (
              <div style={{ animation: 'fadeInScale 0.4s ease' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(22, 163, 74, 0.2)',
                  border: '2px solid #22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#22c55e'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fef3c7', marginBottom: '6px' }}>
                  Access Granted
                </div>
                <div style={{ fontSize: '0.86rem', color: '#e4e4e7', marginBottom: '14px' }}>
                  {successInfo?.full_name}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#fef3c7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Role: {successInfo?.role?.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#a1a1aa', marginTop: '16px' }}>
                  Redirecting to KnotCore dashboard...
                </div>
              </div>
            ) : authStatus === 'error' ? (
              <div style={{ animation: 'shake 0.4s ease' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(220, 38, 38, 0.2)',
                  border: '2px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#ef4444'
                }}>
                  <AlertTriangle size={36} />
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fee2e2', marginBottom: '8px' }}>
                  Authentication Denied
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fca5a5', maxWidth: '280px', lineHeight: 1.4 }}>
                  {errorMessage || 'Credentials could not be verified.'}
                </div>
              </div>
            ) : (
              /* CIRCULAR LOADING ROLLER ANIMATION */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Elegant Circular Dual Roller */}
                <div style={{
                  position: 'relative',
                  width: '74px',
                  height: '74px',
                  marginBottom: '22px'
                }}>
                  {/* Outer spinning ring */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px solid rgba(245, 158, 11, 0.15)',
                    borderTopColor: '#f59e0b',
                    animation: 'spinRoller 1s linear infinite'
                  }} />
                  {/* Inner counter-spinning ring */}
                  <div style={{
                    position: 'absolute',
                    inset: '8px',
                    borderRadius: '50%',
                    border: '3px solid rgba(254, 243, 199, 0.15)',
                    borderBottomColor: '#fef3c7',
                    animation: 'spinRollerReverse 0.8s linear infinite'
                  }} />
                  {/* Center glowing dot */}
                  <div style={{
                    position: 'absolute',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    top: 'calc(50% - 5px)',
                    left: 'calc(50% - 5px)',
                    boxShadow: '0 0 10px #f59e0b'
                  }} />
                </div>

                <div style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginBottom: '6px',
                  letterSpacing: '0.02em'
                }}>
                  Verifying KnotCore Identity
                </div>
                <div style={{
                  fontSize: '0.80rem',
                  color: '#a1a1aa',
                  maxWidth: '260px',
                  lineHeight: 1.4
                }}>
                  Checking Argon2id/Bcrypt hash & establishing cryptographic JWT session...
                </div>
              </div>
            )}
          </div>

          {/* FOREGROUND INTERACTIVE "LOGIN" CARD: Slides Left on Click */}
          <div
            id="interactive-login-card"
            onClick={authStatus === 'idle' ? () => handleTriggerLogin() : undefined}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center',
              cursor: authStatus === 'idle' ? 'pointer' : 'default',
              userSelect: 'none',
              background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
              borderLeft: '1px solid rgba(245, 158, 11, 0.25)',
              transform: (authStatus === 'sliding' || authStatus === 'authenticating' || authStatus === 'success')
                ? 'translateX(-100%)'
                : 'translateX(0)',
              transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Wedding Visual Motif & Monogram Frame */}
            <div style={{
              position: 'relative',
              width: '92px',
              height: '92px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Outer Golden Geometric Ring */}
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '1px dashed rgba(245, 158, 11, 0.45)',
                borderRadius: '50%',
                animation: 'spinRoller 20s linear infinite'
              }} />
              {/* Inner Solid Crest */}
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)'
              }}>
                <KeyRound size={30} />
              </div>
            </div>

            {/* Prominent "LOGIN" Title as requested in Reference */}
            <h2 style={{
              margin: '0 0 10px 0',
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.12em',
              fontFamily: "'Playfair Display', Georgia, serif",
              textTransform: 'uppercase'
            }}>
              LOGIN
            </h2>

            <div style={{
              width: '40px',
              height: '2px',
              background: '#f59e0b',
              margin: '0 auto 16px'
            }} />

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.86rem',
              color: '#d4d4d8',
              maxWidth: '280px',
              lineHeight: 1.5
            }}>
              Interactive Wedding Portal Gate. Click this card to authenticate and enter the KnotCore suite.
            </p>

            {/* Visual Action Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              color: '#fef3c7',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'background 0.2s'
            }}>
              <span>Click to Authorize</span>
              <ArrowRight size={14} />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '24px',
              fontSize: '0.70rem',
              color: '#71717a',
              letterSpacing: '0.05em'
            }}>
              KNOTCORE V2.4 • PALACE PROTOCOL
            </div>
          </div>
        </div>

      </div>

      {/* Embedded CSS animations for sliding, circular roller, and shake */}
      <style>{`
        @keyframes spinRoller {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinRollerReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
