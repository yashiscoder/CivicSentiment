/**
 * Tweet Sentiment Analyzer - Main Application Script
 * Strictly integrated with FastAPI Backend API (mmodel_logistic_2.pkl & vectorizer_for_m2.pkl)
 */

const API_ENDPOINT = "http://127.0.0.1:5000/api/analyze";
const API_HEALTH_ENDPOINT = "http://127.0.0.1:5000/api/health";

// Initial Seed Data for History
const INITIAL_HISTORY = [
    {
        id: "hist-1",
        text: "Absolutely love the new feature update! Super smooth workflow.",
        sentiment: "POSITIVE",
        confidence: 98.1,
        timestamp: "2 mins ago",
        rawTime: Date.now() - 2 * 60 * 1000
    },
    {
        id: "hist-2",
        text: "The login page is timing out again. Third time this week.",
        sentiment: "NEGATIVE",
        confidence: 87.4,
        timestamp: "15 mins ago",
        rawTime: Date.now() - 15 * 60 * 1000
    },
    {
        id: "hist-3",
        text: "Wondering if the API documentation has been updated for v2.",
        sentiment: "NEUTRAL",
        confidence: 92.0,
        timestamp: "42 mins ago",
        rawTime: Date.now() - 42 * 60 * 1000
    }
];

// Application State
let historyState = [];
let currentFilter = "ALL";
let currentSearch = "";
let isApiConnected = false;

// DOM Elements
const tweetInput = document.getElementById('tweet-input');
const charCounter = document.getElementById('char-counter');
const analyzeBtn = document.getElementById('analyze-btn');
const btnText = document.getElementById('btn-text');
const btnIcon = document.getElementById('btn-icon');
const clearBtn = document.getElementById('clear-btn');
const engineStatusBadge = document.getElementById('engine-status-badge');

// Result Card Elements
const resultCard = document.getElementById('result-card');
const sentimentBadge = document.getElementById('sentiment-badge');
const badgeIcon = document.getElementById('badge-icon');
const badgeText = document.getElementById('badge-text');
const moodBgIcon = document.getElementById('mood-bg-icon');
const confidenceVal = document.getElementById('confidence-score-val');
const confidenceBar = document.getElementById('confidence-bar');
const positiveScore = document.getElementById('positive-score');
const positiveBar = document.getElementById('positive-bar');
const neutralScore = document.getElementById('neutral-score');
const neutralBar = document.getElementById('neutral-bar');
const negativeScore = document.getElementById('negative-score');
const negativeBar = document.getElementById('negative-bar');
const wordCountBadge = document.getElementById('word-count-badge');

// History Elements
const historyTbody = document.getElementById('history-tbody');
const historyFilter = document.getElementById('history-filter');
const historySearch = document.getElementById('history-search');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Navigation & Modals
const navLinks = document.querySelectorAll('.nav-link');
const modalApi = document.getElementById('modal-api');
const modalSettings = document.getElementById('modal-settings');
const closeModalBtns = document.querySelectorAll('.close-modal');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupEventListeners();
    updateCharCounter();
    checkApiHealth();
});

// Check if Python FastAPI server is running
async function checkApiHealth() {
    try {
        const res = await fetch(API_HEALTH_ENDPOINT, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
            const data = await res.json();
            isApiConnected = true;
            const modelName = data.model || "Pickle Model";
            if (engineStatusBadge) {
                engineStatusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse shadow-sm shadow-[#30D158]"></span> <span class="text-slate-300">API: <strong class="text-[#30D158] font-medium">Connected (${modelName})</strong></span>`;
            }
            console.log("FastAPI backend connected:", data);
        } else {
            setDisconnectedStatus();
        }
    } catch (e) {
        setDisconnectedStatus();
    }
}

function setDisconnectedStatus() {
    isApiConnected = false;
    if (engineStatusBadge) {
        engineStatusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-[#FF453A] animate-pulse shadow-sm shadow-[#FF453A]"></span> <span class="text-slate-300">API: <strong class="text-[#FF453A] font-medium">Disconnected (Start Server)</strong></span>`;
    }
}

// Load history
function loadHistory() {
    const saved = localStorage.getItem('sentiment_app_history');
    if (saved) {
        try {
            historyState = JSON.parse(saved);
        } catch (e) {
            historyState = [...INITIAL_HISTORY];
        }
    } else {
        historyState = [...INITIAL_HISTORY];
        saveHistory();
    }
    renderHistory();
}

function saveHistory() {
    localStorage.setItem('sentiment_app_history', JSON.stringify(historyState));
}

// Event Listeners
function setupEventListeners() {
    tweetInput.addEventListener('input', updateCharCounter);
    analyzeBtn.addEventListener('click', handleAnalyze);

    clearBtn.addEventListener('click', () => {
        tweetInput.value = '';
        updateCharCounter();
        tweetInput.focus();
    });

    historySearch.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().trim();
        renderHistory();
    });

    historyFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderHistory();
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear all analysis history?')) {
            historyState = [];
            saveHistory();
            renderHistory();
            showNotification('Analysis history cleared.');
        }
    });

    exportCsvBtn.addEventListener('click', exportToCSV);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');

            if (tab === 'api') {
                modalApi.classList.remove('hidden');
            } else if (tab === 'settings') {
                modalSettings.classList.remove('hidden');
            } else if (tab === 'history') {
                const historySec = document.getElementById('history-section');
                if (historySec) {
                    historySec.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Highlight active navbar tab
            navLinks.forEach(l => {
                l.className = "nav-link font-label-md text-label-md text-slate-400 hover:text-white transition-all flex items-center gap-1.5 font-medium";
            });
            link.className = "nav-link font-label-md text-label-md text-[#0A84FF] border-b-2 border-[#0A84FF] pb-1 transition-all flex items-center gap-1.5 font-medium";
        });
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modalApi.classList.add('hidden');
            modalSettings.classList.add('hidden');
        });
    });

    [modalApi, modalSettings].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });

    document.getElementById('btn-notifications').addEventListener('click', () => {
        checkApiHealth();
        showNotification(isApiConnected ? 'Backend API is active.' : 'API disconnected. Please start the server.', isApiConnected ? 'info' : 'warning');
    });
}

window.setText = function(text) {
    tweetInput.value = text;
    updateCharCounter();
    tweetInput.focus();
};

function updateCharCounter() {
    const len = tweetInput.value.length;
    charCounter.textContent = `${len} / 280`;
    if (len > 280) {
        charCounter.classList.add('text-tertiary-container', 'font-bold');
    } else {
        charCounter.classList.remove('text-tertiary-container', 'font-bold');
    }
}

// Analyze Handler with API Call (Strict Pickle Model)
async function handleAnalyze() {
    const text = tweetInput.value.trim();
    if (!text) {
        showNotification('Please enter text to analyze.', 'warning');
        return;
    }

    // Loading UI state
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('opacity-80', 'cursor-not-allowed');
    btnText.textContent = 'Analyzing...';
    btnIcon.textContent = 'progress_activity';
    btnIcon.classList.add('loading-spinner');

    try {
        // Call Python FastAPI backend (Pickle Model)
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `API error (${response.status})`);
        }

        const data = await response.json();
        isApiConnected = true;
        
        const probs = data.probabilities || {};
        const posP = probs["Positive"] || 0;
        const negP = probs["Negative"] || 0;
        const neuP = (probs["Neutral"] || 0) + (probs["Irrelevant"] || 0);

        const result = {
            sentiment: data.sentiment.toUpperCase(),
            confidence: data.confidence,
            posPercent: posP,
            neuPercent: neuP,
            negPercent: negP,
            wordCount: data.word_count,
            modelName: data.model_name
        };

        updateResultCard(result);

        // Normalize sentiment for history tag
        let histSent = "NEUTRAL";
        if (result.sentiment.includes("POS")) histSent = "POSITIVE";
        else if (result.sentiment.includes("NEG")) histSent = "NEGATIVE";

        const newHistoryItem = {
            id: `hist-${Date.now()}`,
            text: text,
            sentiment: histSent,
            confidence: result.confidence,
            timestamp: 'Just now',
            rawTime: Date.now()
        };

        historyState.unshift(newHistoryItem);
        saveHistory();
        renderHistory();

        showNotification(`Analysis complete using ${result.modelName || 'pickle model'}`);
    } catch (err) {
        console.error("API error:", err);
        setDisconnectedStatus();
        showNotification(`API Error: ${err.message}. Make sure backend server is running.`, 'warning');
    } finally {
        // Restore button state
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-80', 'cursor-not-allowed');
        btnText.textContent = 'Analyze Sentiment';
        btnIcon.textContent = 'analytics';
        btnIcon.classList.remove('loading-spinner');
    }
}

// Update Result Card UI
function updateResultCard(result) {
    const { sentiment, confidence, posPercent, neuPercent, negPercent, wordCount } = result;

    wordCountBadge.textContent = `${wordCount} word${wordCount === 1 ? '' : 's'}`;

    confidenceVal.textContent = `${confidence.toFixed(1)}%`;
    confidenceBar.style.width = `${Math.max(confidence, 5)}%`;

    positiveScore.textContent = `${posPercent.toFixed(1)}%`;
    positiveBar.style.width = `${posPercent}%`;

    neutralScore.textContent = `${neuPercent.toFixed(1)}%`;
    neutralBar.style.width = `${neuPercent}%`;

    negativeScore.textContent = `${negPercent.toFixed(1)}%`;
    negativeBar.style.width = `${negPercent}%`;

    if (sentiment.includes("POS")) {
        badgeText.textContent = "Positive";
        badgeIcon.textContent = "sentiment_very_satisfied";
        moodBgIcon.textContent = "mood";
        moodBgIcon.className = "material-symbols-outlined text-[150px] text-[#30D158]/20";
        sentimentBadge.className = "px-md py-xs bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-full flex items-center gap-xs font-label-md text-label-md font-semibold backdrop-blur-md transition-all shadow-lg shadow-[#30D158]/10";
        confidenceBar.className = "bg-gradient-to-r from-emerald-500 to-[#30D158] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(48,209,88,0.5)]";
        confidenceVal.className = "font-headline-md text-2xl font-bold text-[#30D158]";
    } else if (sentiment.includes("NEG")) {
        badgeText.textContent = "Negative";
        badgeIcon.textContent = "sentiment_very_dissatisfied";
        moodBgIcon.textContent = "mood_bad";
        moodBgIcon.className = "material-symbols-outlined text-[150px] text-[#FF453A]/20";
        sentimentBadge.className = "px-md py-xs bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 rounded-full flex items-center gap-xs font-label-md text-label-md font-semibold backdrop-blur-md transition-all shadow-lg shadow-[#FF453A]/10";
        confidenceBar.className = "bg-gradient-to-r from-rose-500 to-[#FF453A] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,69,58,0.5)]";
        confidenceVal.className = "font-headline-md text-2xl font-bold text-[#FF453A]";
    } else {
        badgeText.textContent = sentiment === "IRRELEVANT" ? "Irrelevant" : "Neutral";
        badgeIcon.textContent = "sentiment_neutral";
        moodBgIcon.textContent = "sentiment_neutral";
        moodBgIcon.className = "material-symbols-outlined text-[150px] text-slate-500/20";
        sentimentBadge.className = "px-md py-xs bg-white/10 text-slate-200 border border-white/15 rounded-full flex items-center gap-xs font-label-md text-label-md font-semibold backdrop-blur-md transition-all shadow-lg";
        confidenceBar.className = "bg-gradient-to-r from-blue-500 to-[#0A84FF] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(10,132,255,0.5)]";
        confidenceVal.className = "font-headline-md text-2xl font-bold text-[#0A84FF]";
    }
}

// Render History
function renderHistory() {
    historyTbody.innerHTML = '';

    const filtered = historyState.filter(item => {
        const matchesFilter = (currentFilter === "ALL") || (item.sentiment === currentFilter);
        const matchesSearch = !currentSearch || item.text.toLowerCase().includes(currentSearch);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="4" class="px-lg py-xl text-center text-slate-400 italic">No matching records.</td></tr>`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors animate-fade-in-row border-b border-white/5";

        let badgeMarkup = `<span class="px-3 py-1 bg-white/10 text-slate-300 border border-white/15 rounded-full text-label-sm font-label-sm font-semibold">Neutral</span>`;
        if (item.sentiment === "POSITIVE") {
            badgeMarkup = `<span class="px-3 py-1 bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-full text-label-sm font-label-sm font-semibold">Positive</span>`;
        } else if (item.sentiment === "NEGATIVE") {
            badgeMarkup = `<span class="px-3 py-1 bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 rounded-full text-label-sm font-label-sm font-semibold">Negative</span>`;
        }

        tr.innerHTML = `
            <td class="px-lg py-lg font-body-md text-body-md max-w-md truncate text-slate-200" title="${escapeHtml(item.text)}">
                "${escapeHtml(item.text)}"
            </td>
            <td class="px-lg py-lg">${badgeMarkup}</td>
            <td class="px-lg py-lg font-label-md text-label-md font-semibold text-[#0A84FF]">${item.confidence.toFixed(1)}%</td>
            <td class="px-lg py-lg font-label-sm text-label-sm text-slate-400 text-right">${item.timestamp}</td>
        `;

        historyTbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function exportToCSV() {
    if (historyState.length === 0) return;
    let csv = "data:text/csv;charset=utf-8,ID,Tweet Content,Sentiment,Confidence (%),Timestamp\n";
    historyState.forEach(row => {
        csv += `${row.id},"${row.text.replace(/"/g, '""')}",${row.sentiment},${row.confidence},"${row.timestamp}"\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `sentiment_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showNotification(message, type = 'info') {
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    let bgClass = type === 'warning' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-secondary-container text-on-secondary-container';
    let icon = type === 'warning' ? 'warning' : 'check_circle';

    toast.className = `fixed bottom-lg right-lg ${bgClass} px-lg py-md rounded-lg shadow-2xl font-label-md z-[100] transform transition-all duration-300 translate-y-0 opacity-100 flex items-center gap-sm border border-outline-variant/30`;
    toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> ${escapeHtml(message)}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}
