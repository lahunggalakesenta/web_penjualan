async function sendMessage() {
    const inp = document.getElementById('chat-input');
    const val = inp.value.trim();
    if (!val) return;
    appendMessage('You', val);
    inp.value = '';
    const resBox = document.getElementById('chat-responses');
    resBox.innerHTML += `<div class="msg loading">...</div>`;
    try {
        const resp = await fetch('/chatbot/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: val })
        });
        const data = await resp.json();
        const l = document.querySelector('.msg.loading');
        if (l) l.remove();
        appendMessage('AI', data.reply || 'Tidak ada respons');
    } catch (err) {
        console.error(err);
        const l = document.querySelector('.msg.loading');
        if (l) l.remove();
        appendMessage('AI', 'Terjadi error koneksi');
    }
}

function appendMessage(who, text) {
    const box = document.getElementById('chat-responses');
    const el = document.createElement('div');
    el.style.marginBottom = '8px';
    el.innerHTML = `<b>${who}:</b> ${escapeHtml(text)}`;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
}

function escapeHtml(text) { return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
