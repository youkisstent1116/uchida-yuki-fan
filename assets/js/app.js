// 住海邊的帳篷君 — 内田有紀繁體中文翻譯站

// ── 顯示設定（夜間／字體／無障礙） ──────────────────
function initControls() {
  const dark      = localStorage.getItem('dark') === '1';
  const fontLevel = parseInt(localStorage.getItem('fontLevel') || '0');
  const a11y      = localStorage.getItem('a11y') === '1';

  if (dark) document.body.classList.add('dark-mode');
  applyFontLevel(fontLevel);
  if (a11y) document.body.classList.add('a11y-mode');

  setActive('btn-dark', dark);
  setActive('btn-a11y', a11y);

  on('btn-dark', () => {
    const on = document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark', on ? '1' : '0');
    setActive('btn-dark', on);
  });
  on('btn-font-up', () => {
    const next = (parseInt(localStorage.getItem('fontLevel') || '0') + 1) % 3;
    applyFontLevel(next);
    localStorage.setItem('fontLevel', next);
  });
  on('btn-font-down', () => {
    const next = (parseInt(localStorage.getItem('fontLevel') || '0') + 2) % 3;
    applyFontLevel(next);
    localStorage.setItem('fontLevel', next);
  });
  on('btn-a11y', () => {
    const on = document.body.classList.toggle('a11y-mode');
    localStorage.setItem('a11y', on ? '1' : '0');
    setActive('btn-a11y', on);
  });
}
function applyFontLevel(n) {
  document.body.classList.remove('font-lg', 'font-xl');
  if (n === 1) document.body.classList.add('font-lg');
  if (n === 2) document.body.classList.add('font-xl');
}
function setActive(id, active) {
  document.getElementById(id)?.classList.toggle('active', active);
}
function on(id, fn) {
  document.getElementById(id)?.addEventListener('click', fn);
}
document.addEventListener('DOMContentLoaded', initControls);

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
    initCalendar();
  } catch (e) {
    setHTML('schedule-list', '<p class="empty-state">資料載入失敗</p>');
  }
}

// ── 行事曆 ─────────────────────────────────────────
let _calYear, _calMonth, _calSelected = null;

function initCalendar() {
  const now = new Date();
  _calYear = now.getFullYear();
  _calMonth = now.getMonth();
  document.getElementById('cal-prev').onclick = () => {
    if (_calMonth === 0) { _calYear--; _calMonth = 11; } else _calMonth--;
    renderCal();
  };
  document.getElementById('cal-next').onclick = () => {
    if (_calMonth === 11) { _calYear++; _calMonth = 0; } else _calMonth++;
    renderCal();
  };
  renderCal();
}

function renderCal() {
  const y = _calYear, m = _calMonth;
  document.getElementById('cal-title').textContent = `${y}年${m + 1}月`;

  const eventMap = buildCalEventMap();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell cal-empty"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const events = eventMap[key] || [];
    const dow = new Date(y, m, d).getDay();
    let cls = 'cal-cell';
    if (dow === 0) cls += ' cal-sun';
    if (dow === 6) cls += ' cal-sat';
    if (key === todayKey) cls += ' cal-today';
    if (key === _calSelected) cls += ' cal-selected';
    if (events.length) cls += ' cal-has-events';

    const types = [...new Set(events.map(e => e.media_type))].slice(0, 3);
    const dots = types.map(t => `<span class="cal-dot cal-dot-${t}"></span>`).join('');
    const label = `${m+1}月${d}日${events.length ? '，有' + events.length + '個行程' : ''}`;

    html += `<div class="${cls}" onclick="calSelect('${key}')" role="button" tabindex="0"
      aria-label="${label}" onkeydown="if(event.key==='Enter'||event.key===' ')calSelect('${key}')">
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function buildCalEventMap() {
  const map = {};
  _allSchedule.forEach(s => {
    const start = new Date(s.date + 'T00:00:00');
    const end = s.end_date ? new Date(s.end_date + 'T00:00:00') : new Date(start);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
      (map[dateKey(d)] = map[dateKey(d)] || []).push(s);
  });
  return map;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function calSelect(key) {
  _calSelected = key;
  renderCal();
  const [, m, d] = key.split('-');
  document.getElementById('cal-filter-label').textContent = `${parseInt(m)}月${parseInt(d)}日的行程`;
  document.getElementById('cal-filter-bar').style.display = 'flex';

  const filtered = _allSchedule.filter(s => key >= s.date && key <= (s.end_date || s.date));
  setHTML('schedule-list', filtered.length
    ? filtered.map(scheduleItemHTML).join('')
    : '<p class="empty-state">這天沒有行程</p>');
  setHTML('schedule-pagination', '');
}

function clearCalFilter() {
  _calSelected = null;
  renderCal();
  document.getElementById('cal-filter-bar').style.display = 'none';
  renderSchedulePage(1);
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
      <div class="schedule-item-top">
        <div class="schedule-date">${dateStr}</div>
        <span class="schedule-type">${escapeHTML(post.media_type)}</span>
      </div>
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
  const isNum = typeof label === 'number';
  const ariaLabel = isNum ? `第 ${label} 頁` : (label === '‹' ? '上一頁' : '下一頁');
  const ariaCurrent = active ? ' aria-current="page"' : '';
  return `<button class="page-btn${active ? ' active' : ''}" onclick="${onclick}" aria-label="${ariaLabel}"${ariaCurrent}>${label}</button>`;
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

// ── 有紀通鑑 ──────────────────────────────────────────
let allWorks = [];
let activeFilter = 'all';

async function initWorksPage() {
  try {
    const data = await loadData('works');
    allWorks = data.works.filter(w => w.published);
    renderTimeline();
    initFilter();
  } catch (e) {
    setHTML('works-timeline', '<p class="empty-state">載入失敗，請重新整理</p>');
  }
}

function initFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.type;
      renderTimeline();
    });
  });
}

function renderTimeline() {
  const filtered = activeFilter === 'all'
    ? allWorks
    : allWorks.filter(w => w.type === activeFilter);

  if (filtered.length === 0) {
    setHTML('works-timeline', '<p class="empty-state">此類型尚無作品資料</p>');
    return;
  }

  // 依年份分組，年份內依月份降冪（0=不確定排最後）
  const byYear = {};
  filtered.forEach(w => {
    if (!byYear[w.year]) byYear[w.year] = [];
    byYear[w.year].push(w);
  });
  Object.values(byYear).forEach(arr =>
    arr.sort((a, b) => (b.month || 0) - (a.month || 0))
  );
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const html = years.map(year => `
    <div class="timeline-year-block">
      <div class="timeline-year-heading">
        <span class="timeline-year">${year}</span>
        <span class="timeline-year-line" aria-hidden="true"></span>
      </div>
      <div class="timeline-works">
        ${byYear[year].map(workHTML).join('')}
      </div>
    </div>
  `).join('');

  setHTML('works-timeline', html);
}

function workHTML(w) {
  const titleZh = w.title_zh ? `<span class="work-title-zh">${escapeHTML(w.title_zh)}</span>` : '';
  const monthTag = (w.month && w.month > 0)
    ? `<div class="work-month">${String(w.month).padStart(2,'0')}月</div>` : '';
  const metaParts = [];
  if (w.role)    metaParts.push(`飾 ${escapeHTML(w.role)}`);
  if (w.network) metaParts.push(escapeHTML(w.network));
  const meta = metaParts.length ? `<div class="work-meta">${metaParts.join('　')}</div>` : '';
  const notes = w.notes ? `<div class="work-notes">${escapeHTML(w.notes)}</div>` : '';
  const tagClass = `tag-${w.type}` in document.createElement('span').style ? `tag-${w.type}` : 'tag-其他';

  return `
    <div class="work-item">
      <div class="work-tag-col">
        ${monthTag}
        <span class="work-type-tag tag-${escapeHTML(w.type)}">${escapeHTML(w.type)}</span>
      </div>
      <div class="work-info">
        <div class="work-title">${escapeHTML(w.title)}${titleZh}</div>
        ${meta}${notes}
      </div>
    </div>`;
}
