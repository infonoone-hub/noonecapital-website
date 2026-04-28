(function() {
  const API = 'https://propflow-backend-production-bfed.up.railway.app';
  const cfg = window.PropFlowConfig || {};
  const CLIENT_ID = cfg.clientId || '';
  const PROPERTY_NAME = cfg.propertyName || 'our properties';
  const COLOR = cfg.color || '#4e2c15';

  const style = document.createElement('style');
  style.textContent = `
    #pf-btn { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%; background:${COLOR}; color:white; border:none; cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.2); font-size:24px; z-index:9999; transition:transform 0.2s; display:flex; align-items:center; justify-content:center; }
    #pf-btn:hover { transform:scale(1.1); }
    #pf-window { position:fixed; bottom:92px; right:24px; width:360px; height:520px; background:white; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.15); z-index:9999; display:none; flex-direction:column; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    #pf-header { background:${COLOR}; padding:16px 20px; color:white; }
    #pf-header h3 { margin:0; font-size:15px; font-weight:700; }
    #pf-header p { margin:4px 0 0; font-size:11px; opacity:0.8; }
    #pf-status { display:flex; align-items:center; gap:6px; margin-top:6px; }
    #pf-status span { width:7px; height:7px; background:#4ade80; border-radius:50%; animation:pfpulse 2s infinite; }
    #pf-status p { margin:0; font-size:11px; opacity:0.9; }
    #pf-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:#fdf6f0; }
    .pf-msg-user { align-self:flex-end; background:${COLOR}; color:white; padding:10px 14px; border-radius:18px 18px 4px 18px; font-size:13px; max-width:80%; line-height:1.4; }
    .pf-msg-agent { align-self:flex-start; background:white; border:1px solid #f0e0d0; color:#2d1a0a; padding:10px 14px; border-radius:18px 18px 18px 4px; font-size:13px; max-width:80%; line-height:1.4; }
    .pf-agent-name { font-size:10px; color:#a86c3c; font-weight:600; margin-bottom:4px; }
    .pf-typing { display:flex; gap:4px; padding:12px 14px; }
    .pf-typing span { width:6px; height:6px; background:#c08a5a; border-radius:50%; animation:pfbounce 1.2s infinite; }
    .pf-typing span:nth-child(2){animation-delay:0.2s} .pf-typing span:nth-child(3){animation-delay:0.4s}
    #pf-input-area { padding:12px; border-top:1px solid #f0e0d0; display:flex; gap:8px; background:white; }
    #pf-input { flex:1; border:1px solid #e8c9a0; border-radius:12px; padding:10px 14px; font-size:13px; outline:none; font-family:inherit; }
    #pf-input:focus { border-color:${COLOR}; }
    #pf-send { background:${COLOR}; color:white; border:none; border-radius:12px; padding:10px 16px; cursor:pointer; font-size:13px; font-weight:600; }
    #pf-send:hover { opacity:0.9; }
    #pf-disclaimer { padding:8px 16px; font-size:10px; color:#a86c3c; text-align:center; background:white; border-top:1px solid #f0e0d0; }
    @keyframes pfpulse{0%,100%{opacity:1}50%{opacity:0.4}}
    @keyframes pfbounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'pf-btn';
  btn.innerHTML = `<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/></svg>`;
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.id = 'pf-window';
  win.innerHTML = `
    <div id="pf-header">
      <h3>PropFlow AI Assistant</h3>
      <p>${PROPERTY_NAME}</p>
      <div id="pf-status"><span></span><p>Available 24/7</p></div>
    </div>
    <div id="pf-messages">
      <div class="pf-agent-name">Receptionist · Jordan</div>
      <div class="pf-msg-agent">Hi! I'm Jordan, your virtual assistant. I can help with leasing inquiries, maintenance requests, rent questions, and more. How can I help you today?</div>
    </div>
    <div id="pf-input-area">
      <input id="pf-input" type="text" placeholder="Type your message..." />
      <button id="pf-send">Send</button>
    </div>
    <div id="pf-disclaimer">By messaging, you agree to our <a href="/sms-terms.html" style="color:#a86c3c">Terms</a></div>
  `;
  document.body.appendChild(win);

  let open = false;
  let history = [];

  btn.addEventListener('click', () => {
    open = !open;
    win.style.display = open ? 'flex' : 'none';
    btn.innerHTML = open
      ? `<svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
      : `<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="white"/></svg>`;
  });

  document.getElementById('pf-send').addEventListener('click', send);
  document.getElementById('pf-input').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  async function send() {
    const input = document.getElementById('pf-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const msgs = document.getElementById('pf-messages');
    msgs.innerHTML += `<div class="pf-msg-user">${escHtml(msg)}</div>`;

    const typingEl = document.createElement('div');
    typingEl.className = 'pf-msg-agent pf-typing-wrap';
    typingEl.innerHTML = `<div class="pf-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(typingEl);
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const res = await fetch(`${API}/agents/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, client_id: CLIENT_ID, conversation_history: history }),
      });
      const data = await res.json();
      history = data.conversation_history || history;
      typingEl.remove();
      msgs.innerHTML += `<div class="pf-agent-name">${data.agent || 'Assistant'}</div><div class="pf-msg-agent">${escHtml(data.response)}</div>`;
    } catch {
      typingEl.remove();
      msgs.innerHTML += `<div class="pf-msg-agent">Sorry, I'm having trouble connecting. Please try again in a moment.</div>`;
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
