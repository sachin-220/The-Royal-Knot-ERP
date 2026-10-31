import React, { useState } from 'react';
import { Send, X, Bot, User, ShieldCheck } from 'lucide-react';

export default function ConciergeModal({ isOpen, onClose, wedding }) {
  if (!isOpen) return null;

  const [role, setRole] = useState('client');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Greetings. I am the KnotCore Concierge for ${wedding ? wedding.name : 'The Royal Knot'}. How may I assist your wedding planning requirements today?`
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
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply || "Greetings from KnotCore Concierge." }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: "KnotCore Concierge is actively coordinating palace operations. How can I assist you further?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#ffffff',
        width: '540px',
        height: '580px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: 'var(--shadow-elevated)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              KnotCore Operations Assistant
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Gemini AI Conversational Copilot
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: '#64748b' }}
          >
            
          </button>
        </div>

        {/* Role Switcher */}
        <div style={{ display: 'flex', padding: '10px 16px', gap: '6px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          {['client', 'planner', 'vendor', 'founder'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: role === r ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                background: role === r ? '#4f46e5' : '#ffffff',
                color: role === r ? '#ffffff' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((m, idx) => (
            <div 
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                background: m.sender === 'user' ? '#4f46e5' : '#f8fafc',
                color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                lineHeight: 1.5
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '0.75rem' }}>
              Processing...
            </div>
          )}
        </div>

        {/* Input Field */}
        <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            placeholder="Type your instruction or question..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '8px 16px' }}>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
