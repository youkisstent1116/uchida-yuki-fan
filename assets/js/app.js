// 住海邊的帳篷君 — 内田有紀繁體中文翻譯站

async function loadData(type) {
  const res = await fetch(`data/${type}.json`);
  if (!res.ok) throw new Error(`無法載入 ${type}.json`);
  return res.json();
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getExcerpt(text, max = 85) {
  const plain = text.replace(/\n+/g, ' ').trim();
  return plain.length > max ? plain.slice(0, max) + '…' : plain;
}

function publishedPosts(data) {
  return data.posts.filter(p => p.published);
}

// ── 首頁 ──────────────────────────────────────────
async function initHomePage() {
  try {
    const [vd, sd] = await Promise.all([loadData('voice'), loadData('schedule')]);
    const voices = publishedPosts(vd).sort((a, b) => b.original_date.localeCompare(a.original_date));
    const schedules = publishedPosts(sd).sort((a, b) => b.date.localeCompare(a.date));
    renderHomeVoice(voices.slice(0, 3));
    renderHomeSchedule(schedules.slice(0, 5));
  } catch (e) {
    console.error(e);
    setHTML('home-voice', '<p class="empty-state">資料載入失敗</p>');
    setHTML('home-schedule', '<p class="empty-state">資料載入失敗</p>');
  }
}

function renderHomeVoice(posts) {
  if (!posts.length) { setHTML('home-voice', '<p class="empty-state">尚無翻譯內容</p>'); return; }
  setHTML('home-voice', posts.map(voiceCardHTML).join(''));
}

function renderHomeSchedule(posts) {
  if (!posts.length) { setHTML('home-schedule', '<p class="empty-state">尚無行程資訊</p>'); return; }
  setHTML('home-schedule', posts.map(scheduleItemHTML).join(''));
}

// ── Voice 列表 ────────────────────────────────────
const VOICE_PER_PAGE = 9;
let _allVoice = [];

async function initVoicePage() {
  try {
    const data = await loadData('voice');
    _allVoice = publishedPosts(data).sort((a, b) => b.original_date.localeCompare(a.original_date));
    renderVoicePage(1);
  } catch (e) {
    setHTML('voice-list', '<p class="empty-state">資料載入失敗</p>');
  }
}

function renderVoicePage(page) {
  const start = (page - 1) * VOICE_PER_PAGE;
  const slice = _allVoice.slice(start, start + VOICE_PER_PAGE);
  if (!_allVoice.length) { setHTML('voice-list', '<p class="empty-state">尚無翻譯內容</p>'); return; }
  setHTML('voice-list', slice.map(voiceCardHTML).join(''));
  renderPagination('voice-pagination', _allVoice.length, VOICE_PER_PAGE, page, 'renderVoicePage');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Voice 文章詳細 ─────────────────────────────────
async function initVoicePostPage() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'voice.html'; return; }
  try {
    const data = await loadData('voice');
    const post = publishedPosts(data).find(p => p.id === id);
    if (!post) { location.href = 'voice.html'; return; }

    document.title = `${post.title || 'Voice'} — 住海邊的帳篷君`;
    const bodyLines = post.translated_content
      .split('\n')
      .map(l => l.trim() ? `<p>${escapeHTML(l)}</p>` : '<p>&nbsp;</p>')
      .join('');

    setHTML('post-content', `
      <div class="post-meta">
        <div class="post-date">${formatDate(post.original_date)}</div>
      </div>
      <div class="post-body">${bodyLines}</div>
      <div class="post-notice">
        本文為粉絲非官方翻譯，譯文版權歸原作者所有。<br>
        原文來源：<a href="https://10-beans.com/" target="_blank" rel="noopener">10-beans.com</a>（内田有紀 公式サイト）
      </div>
      <a class="back-link" href="voice.html">← 返回 Voice 列表</a>
    `);
  } catch (e) {
    setHTML('post-content', '<p class="empty-state">資料載入失敗</p>');
  }
}

// ── Schedule ──────────────────────────────────────
const SCHEDULE_PER_PAGE = 15;
let _allSchedule = [];

async function initSchedulePage() {
  try {
    const data = await loadData('schedule');
    _allSchedule = publishedPosts(data).sort((a, b) => b.date.localeCompare(a.date));
    renderSchedulePage(1);
  } catch (e) {
    setHTML('schedule-list', '<p class="empty-state">資料載入失敗</p>');
  }
}

function renderSchedulePage(page) {
  const start = (page - 1) * SCHEDULE_PER_PAGE;
  const slice = _allSchedule.slice(start, start + SCHEDULE_PER_PAGE);
  if (!_allSchedule.length) { setHTML('schedule-list', '<p class="empty-state">尚無行程資訊</p>'); return; }
  setHTML('schedule-list', slice.map(scheduleItemHTML).join(''));
  renderPagination('schedule-pagination', _allSchedule.length, SCHEDULE_PER_PAGE, page, 'renderSchedulePage');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── 共用元件 ──────────────────────────────────────
function voiceCardHTML(post) {
  return `
    <a class="voice-card" href="voice-post.html?id=${post.id}">
      <div class="voice-date">${formatDate(post.original_date)}</div>
      <div class="voice-excerpt">${escapeHTML(getExcerpt(post.translated_content))}</div>
    </a>`;
}

function scheduleItemHTML(post) {
  const dateStr = post.end_date
    ? `${formatDate(post.date)}<br>— ${formatDate(post.end_date)}`
    : formatDate(post.date);
  const desc = post.translated_content
    ? `<div class="schedule-desc">${escapeHTML(post.translated_content)}</div>` : '';
  const link = post.link
    ? `<a href="${post.link}" target="_blank" rel="noopener" class="schedule-link">→ 詳細連結</a>` : '';
  return `
    <div class="schedule-item">
      <div class="schedule-date">${dateStr}</div>
      <div><span class="schedule-type">${escapeHTML(post.media_type)}</span></div>
      <div class="schedule-content">
        <div class="schedule-title">${escapeHTML(post.title)}</div>
        ${desc}${link}
      </div>
    </div>`;
}

function renderPagination(containerId, total, perPage, current, fnName) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  if (current > 1) html += btn(`${fnName}(${current - 1})`, '‹');
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
      html += btn(`${fnName}(${i})`, i, i === current);
    } else if (Math.abs(i - current) === 2) {
      html += '<span class="page-ellipsis">…</span>';
    }
  }
  if (current < totalPages) html += btn(`${fnName}(${current + 1})`, '›');
  el.innerHTML = html;
}

function btn(onclick, label, active = false) {
  return `<button class="page-btn${active ? ' active' : ''}" onclick="${onclick}">${label}</button>`;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
