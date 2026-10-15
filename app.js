/* CivicSentiment – app script */
(() => {
  'use strict';

  const BASE = 'https://civicsentiment.onrender.com/api';
  const KEY = 'sentiment_app_history';
  const PREF_KEY = 'sentiment_app_save';
  const MAX_HISTORY = 100;

  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const input = $('tweet-input'), counter = $('char-counter');
  const analyzeBtn = $('analyze-btn'), btnText = $('btn-text');
  const card = $('result-card');
  const tbody = $('history-tbody');

  let history = [];
  let filter = 'ALL';
  let query = '';
  let saveEnabled = true;

  /* ---------- storage (guarded: private mode / quota can throw) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  function loadHistory() {
    saveEnabled = store.get(PREF_KEY) !== '0';
    $('opt-save').checked = saveEnabled;
    try {
      const parsed = JSON.parse(store.get(KEY) || '[]');
      // drop the old fake seed rows from earlier versions
      history = Array.isArray(parsed) ? parsed.filter((h) => !/^hist-[123]$/.test(h.id)) : [];
    } catch { history = []; }
  }
  function saveHistory() { if (saveEnabled) store.set(KEY, JSON.stringify(history)); }

  /* ---------- helpers ---------- */
  const norm = (s) => /POS/i.test(s) ? 'POSITIVE' : /NEG/i.test(s) ? 'NEGATIVE' : 'NEUTRAL';
  const toneOf = (s) => ({ POSITIVE: 'pos', NEGATIVE: 'neg', NEUTRAL: 'neu' }[norm(s)]);
  const LABEL = { POSITIVE: 'Positive', NEGATIVE: 'Negative', NEUTRAL: 'Neutral' };

  function ago(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 45) return 'Just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  let toastTimer;
  function toast(msg, type = 'info') {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast' + (type === 'warn' ? ' warn' : '');
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4000);
  }

  async function api(path, options = {}, ms = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(BASE + path, { ...options, signal: ctrl.signal }); }
    finally { clearTimeout(timer); }
  }

  /* ---------- server status (handles Render cold starts) ---------- */
  function setStatus(state, text) {
    $('status').dataset.state = state;
    $('status-text').textContent = text;
  }

  let checking = false;
  async function checkHealth() {
    if (checking) return false;
    checking = true;
    setStatus('wait', 'Waking up server… this can take up to a minute');
    try {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await api('/health', {}, 25000);
          if (res.ok) {
            const d = await res.json().catch(() => ({}));
            setStatus('ok', `Connected${d.model ? ` · ${d.model}` : ''}`);
            return true;
          }
        } catch { /* retry */ }
      }
      setStatus('err', 'Server unreachable · click to retry');
      return false;
    } finally { checking = false; }
  }

  /* ---------- analyze ---------- */
  function updateCounter() {
    const n = input.value.length;
    counter.textContent = `${n} / ${input.maxLength}`;
    counter.classList.toggle('warn', n > input.maxLength * 0.9);
  }

  function setBusy(busy) {
    analyzeBtn.disabled = busy;
    analyzeBtn.setAttribute('aria-busy', busy);
    btnText.textContent = busy ? 'Analyzing' : 'Analyze sentiment';
  }

  async function analyze() {
    const text = input.value.trim();
    if (!text) { toast('Enter some text to analyze first.', 'warn'); input.focus(); return; }
    if (analyzeBtn.disabled) return;
    setBusy(true);

    try {
      // generous timeout: a sleeping free-tier server needs time to boot
      const res = await api('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }, 60000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === 'string' ? err.detail : `Server error (${res.status})`);
      }
      const d = await res.json();
      const p = d.probabilities || {};
      const sentiment = norm(String(d.sentiment || ''));

      showResult({
        sentiment,
        confidence: Number(d.confidence) || 0,
        pos: p.Positive || 0,
        neu: (p.Neutral || 0) + (p.Irrelevant || 0),
        neg: p.Negative || 0,
        words: d.word_count ?? text.split(/\s+/).length,
      });

      history.unshift({ id: `h-${Date.now()}`, text, sentiment, confidence: Number(d.confidence) || 0, rawTime: Date.now(), fresh: true });
      history = history.slice(0, MAX_HISTORY);
      saveHistory();
      renderHistory();
      setStatus('ok', `Connected${d.model_name ? ` · ${d.model_name}` : ''}`);
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'The server took too long to answer. It may still be waking up, so try again in a few seconds.'
        : (e.message || 'Could not reach the server.');
      setStatus('err', 'Server unreachable · click to retry');
      toast(msg, 'warn');
    } finally { setBusy(false); }
  }

  function showResult({ sentiment, confidence, pos, neu, neg, words }) {
    card.dataset.tone = toneOf(sentiment);
    $('sentiment-badge').textContent = LABEL[sentiment];
    $('confidence-score-val').textContent = `${confidence.toFixed(1)}%`;
    $('confidence-bar').style.width = `${Math.max(confidence, 3)}%`;
    for (const [id, v] of [['positive', pos], ['neutral', neu], ['negative', neg]]) {
      $(`${id}-score`).textContent = `${v.toFixed(1)}%`;
      $(`${id}-bar`).style.width = `${v}%`;
    }
    $('word-count-badge').textContent = `${words} word${words === 1 ? '' : 's'}`;
  }

  /* ---------- history ---------- */
  function renderHistory() {
    const rows = history.filter((h) =>
      (filter === 'ALL' || h.sentiment === filter) &&
      (!query || h.text.toLowerCase().includes(query)));

    tbody.replaceChildren();
    $('export-csv-btn').disabled = $('clear-history-btn').disabled = history.length === 0;
    $('hist-count').textContent = history.length
      ? `${rows.length} of ${history.length} saved ${history.length === 1 ? 'analysis' : 'analyses'}${saveEnabled ? ' · stored in this browser only' : ''}`
      : 'Your analyses are saved in this browser only.';

    if (!rows.length) {
      const td = el('td', 'empty', history.length ? 'No results match your search or filter.' : 'Nothing here yet. Analyze some text and it will show up here.');
      td.colSpan = 4;
      const tr = el('tr');
      tr.append(td);
      tbody.append(tr);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const h of rows) {
      const tr = el('tr', h.fresh ? 'new' : '');
      delete h.fresh;
      const txt = el('td', 'txt', h.text);
      txt.title = h.text;
      const tag = el('span', `tag ${toneOf(h.sentiment)}`, LABEL[norm(h.sentiment)]);
      const sent = el('td'); sent.append(tag);
      const t = el('td', 'time', ago(h.rawTime || Date.now()));
      tr.append(txt, sent, el('td', '', `${Number(h.confidence).toFixed(1)}%`), t);
      frag.append(tr);
    }
    tbody.append(frag);
  }

  function exportCSV() {
    // prefix risky leading characters so spreadsheets don't run them as formulas
    const cell = (v) => `"${String(/^[=+\-@\t\r]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`;
    const lines = ['Text,Sentiment,Confidence (%),Time'];
    for (const h of history) {
      lines.push([cell(h.text), h.sentiment, Number(h.confidence).toFixed(1), new Date(h.rawTime).toISOString()].join(','));
    }
    const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = el('a'); a.href = url; a.download = `sentiment_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- wiring ---------- */
  function init() {
    loadHistory();
    renderHistory();
    updateCounter();

    input.addEventListener('input', updateCounter);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyze(); });
    analyzeBtn.addEventListener('click', analyze);
    $('clear-btn').addEventListener('click', () => { input.value = ''; updateCounter(); input.focus(); });
    $('status').addEventListener('click', checkHealth);

    document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
      input.value = c.dataset.text; updateCounter(); input.focus();
    }));

    let searchTimer;
    $('history-search').addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { query = e.target.value.toLowerCase().trim(); renderHistory(); }, 150);
    });
    $('history-filter').addEventListener('change', (e) => { filter = e.target.value; renderHistory(); });
    $('export-csv-btn').addEventListener('click', exportCSV);
    $('clear-history-btn').addEventListener('click', () => {
      if (!confirm('Delete all saved analyses? This cannot be undone.')) return;
      history = []; saveHistory(); store.set(KEY, '[]'); renderHistory(); toast('History cleared.');
    });

    // dialogs (native <dialog>: Esc, focus trap and focus return come for free)
    document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => $(b.dataset.open).showModal()));
    document.querySelectorAll('dialog').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    });
    $('opt-save').addEventListener('change', (e) => {
      saveEnabled = e.target.checked;
      store.set(PREF_KEY, saveEnabled ? '1' : '0');
      if (saveEnabled) saveHistory(); else store.set(KEY, '[]');
      renderHistory();
    });

    // highlight "History" in the nav while it is on screen
    const navA = $('nav-analyze'), navH = $('nav-history');
    new IntersectionObserver(([entry]) => {
      navH.toggleAttribute('aria-current', entry.isIntersecting);
      navA.toggleAttribute('aria-current', !entry.isIntersecting);
    }, { rootMargin: '-45% 0px -45% 0px' }).observe($('history'));

    // keep "x min ago" fresh
    setInterval(() => { if (!document.hidden) renderHistory(); }, 60000);

    checkHealth();
  }

  init();
})();
