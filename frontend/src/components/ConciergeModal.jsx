import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, Crown, Shield } from 'lucide-react';

export default function ConciergeModal({ isOpen, onClose, wedding }) {
  if (!isOpen) return null;

  const [role, setRole] = useState('client');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Padharo Sa! I am the Royal Concierge for ${wedding ? wedding.name : 'The Royal Knot'}. How may I orchestrate your luxury wedding requirements today?`
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userText = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, role })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply || "Greetings from The Royal Knot." }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "The Royal Knot Concierge is actively coordinating palace operations. How can I assist you further?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-panel" style={{
        width: '560px',
        height: '620px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(22, 38, 82, 0.95) 0%, rgba(13, 22, 48, 0.95) 100%)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--color-gold-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#070d1e'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className="font-royal" style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                Royal AI Concierge
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="live-dot" /> Connected to Gemini 3.5 Flash & DB
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Role Switcher */}
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{
                background: 'rgba(5, 9, 20, 0.7)',
                color: 'var(--color-gold-light)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              <option value="client">Client View</option>
              <option value="founder">Founder View</option>
              <option value="planner">Planner View</option>
              <option value="vendor">Vendor View</option>
            </select>

            <button onClick={onClose} className="btn-royal-outline" style={{ padding: '6px', borderRadius: '50%' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {messages.map((m, idx) => {
            const isBot = m.sender === 'bot';
            return (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  maxWidth: '85%'
                }}
              >
                {isBot && (
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    border: '1px solid var(--color-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold)',
                    flexShrink: 0
                  }}>
                    <Crown size={16} />
                  </div>
                )}

                <div style={{
                  background: isBot ? 'rgba(22, 38, 82, 0.75)' : 'var(--color-gold-gradient)',
                  color: isBot ? '#f8fafc' : '#070d1e',
                  border: isBot ? '1px solid var(--color-border)' : 'none',
                  borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  fontWeight: isBot ? 400 : 600,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-gold-light)', fontSize: '0.8rem', paddingLeft: '40px' }}>
              <Sparkles size={14} className="pulse-glow" />
              <span>Orchestrating royal response...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(5, 9, 20, 0.8)',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            placeholder={`Ask anything as ${role.toUpperCase()} (e.g. check catering buffer, milestone due, vendor status)...`}
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(22, 38, 82, 0.5)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button type="submit" disabled={loading} className="btn-royal-gold" style={{ padding: '10px 16px' }}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
