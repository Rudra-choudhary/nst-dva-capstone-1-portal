const searchInput = document.querySelector('#doc-search');
const searchStatus = document.querySelector('#search-status');
const docCards = Array.from(document.querySelectorAll('.doc-card'));
const chips = Array.from(document.querySelectorAll('.chip'));
const surpriseBtn = document.querySelector('#surprise-btn');
const readyItems = Array.from(document.querySelectorAll('.ready-item'));
const readyScore = document.querySelector('#ready-score');
const scrollProgress = document.querySelector('#scroll-progress');
const revealItems = Array.from(document.querySelectorAll('.reveal'));
const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
const sectionNodes = Array.from(document.querySelectorAll('[data-section]'));
const focusBtn = document.querySelector('#focus-btn');
const focusText = document.querySelector('#focus-text');
const openPaletteBtn = document.querySelector('#open-palette');
const palette = document.querySelector('#palette');
const paletteInput = document.querySelector('#palette-input');
const paletteList = document.querySelector('#palette-list');
const teamSearchInput = document.querySelector('#team-search');
const teamResults = document.querySelector('#team-results');
const teamStatus = document.querySelector('#team-status');
const teamChips = Array.from(document.querySelectorAll('.team-chip'));
const focusTeamSearchBtn = document.querySelector('#focus-team-search');
const teamFilterChipsWrap = document.querySelector('#team-filter-chips');
const sectionLinks = Array.from(document.querySelectorAll('.section-link[data-team-section]'));

const STAR_KEY = 'dva_capstone_starred';
const CSV_SOURCES = [
  { section: 'A', file: 'data/section-a.csv' },
  { section: 'B', file: 'data/section-b.csv' },
  { section: 'C', file: 'data/section-c.csv' },
  { section: 'D', file: 'data/section-d.csv' },
  { section: 'E', file: 'data/section-e.csv' }
];

let activeFilter = 'all';
let activeTeamFilter = 'all';
let starredSet = new Set();
let teamDirectory = Array.isArray(window.__TEAM_DIRECTORY__) ? window.__TEAM_DIRECTORY__ : [];

const focusIdeas = [
  'Draft KPI definitions and map each KPI to a decision question.',
  'Audit missing values and prepare a cleaning approach in Google Sheets.',
  'Build one exploratory pivot and note one unexpected pattern.',
  'Define your dashboard audience and the top 3 must-answer questions.',
  'Write one recommendation backed by at least two data points.'
];

function normalize(value) {
  return (value || '').toLowerCase().trim();
}

function jumpTo(hash) {
  const el = document.querySelector(hash);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadStars() {
  try {
    const saved = JSON.parse(localStorage.getItem(STAR_KEY) || '[]');
    starredSet = new Set(saved);
  } catch {
    starredSet = new Set();
  }
}

function saveStars() {
  localStorage.setItem(STAR_KEY, JSON.stringify(Array.from(starredSet)));
}

function syncStarsUI() {
  docCards.forEach((card) => {
    const id = card.dataset.id;
    const btn = card.querySelector('.star-btn');
    const on = starredSet.has(id);
    btn?.classList.toggle('is-on', on);
    if (btn) btn.textContent = on ? '★' : '☆';
  });
}

function applyDocFilters() {
  if (!searchStatus) return;
  const query = normalize(searchInput?.value || '');
  let visibleCount = 0;

  docCards.forEach((card) => {
    const title = normalize(card.querySelector('h3')?.textContent);
    const file = normalize(card.querySelector('p')?.textContent);
    const keywords = normalize(card.dataset.keywords);
    const type = normalize(card.dataset.type);
    const id = card.dataset.id;

    const matchesQuery = !query || title.includes(query) || file.includes(query) || keywords.includes(query);
    const matchesFilter =
      activeFilter === 'all' ||
      type === activeFilter ||
      (activeFilter === 'starred' && starredSet.has(id));

    const match = matchesQuery && matchesFilter;
    card.classList.toggle('is-hidden', !match);
    if (match) visibleCount += 1;
  });

  const label = activeFilter === 'all' ? 'all categories' : activeFilter;
  searchStatus.textContent = `${visibleCount} document${visibleCount === 1 ? '' : 's'} shown (${label}).`;
}

function setActiveChip(next) {
  activeFilter = next;
  chips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.filter === next));
  applyDocFilters();
}

function updateReadyScore() {
  const done = readyItems.filter((item) => item.checked).length;
  if (readyScore) readyScore.textContent = `${done}/${readyItems.length} complete`;
}

function pickRandomDocument() {
  const visible = docCards.filter((card) => !card.classList.contains('is-hidden'));
  if (!visible.length) return;
  docCards.forEach((card) => card.classList.remove('is-pick'));
  const picked = visible[Math.floor(Math.random() * visible.length)];
  picked.classList.add('is-pick');
  picked.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateScrollProgress() {
  if (!scrollProgress) return;
  const y = window.scrollY || document.documentElement.scrollTop;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (y / total) * 100 : 0;
  scrollProgress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

function activateReveals() {
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealItems.forEach((el) => io.observe(el));
}

function activateSectionSpy() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          const hit = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', hit);
        });
      });
    },
    { threshold: 0.45 }
  );

  sectionNodes.forEach((node) => io.observe(node));
}

function rotateFocus() {
  if (!focusText) return;
  const current = normalize(focusText.textContent);
  const next = focusIdeas.find((item) => normalize(item) !== current) || focusIdeas[0];
  const idx = focusIdeas.indexOf(next);
  focusText.textContent = focusIdeas[(idx + Math.floor(Math.random() * focusIdeas.length)) % focusIdeas.length];
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if (ch === '\n' && !inQuotes) {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (ch === '\r') continue;
    field += ch;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(header) {
  return normalize(header).replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function fromRow(row, map, keys) {
  for (const key of keys) {
    const idx = map[normalizeHeader(key)];
    if (idx !== undefined && row[idx] !== undefined) return String(row[idx]).trim();
  }
  return '';
}

function toGroupLabel(rawGroup) {
  const clean = String(rawGroup || '').trim();
  if (!clean) return '';
  return /^g[-\s]?/i.test(clean) ? clean.replace(/\s+/g, '') : `G-${clean}`;
}

async function loadTeamDirectory() {
  if (teamDirectory.length) {
    applyTeamFilters();
    return;
  }

  if (teamStatus) teamStatus.textContent = 'Loading team directory...';

  try {
    const files = await Promise.all(
      CSV_SOURCES.map(async (src) => {
        const res = await fetch(src.file);
        if (!res.ok) throw new Error(`Could not load ${src.file}`);
        return { section: src.section, text: await res.text() };
      })
    );

    const entries = [];
    files.forEach(({ section: fallbackSection, text }) => {
      const rows = parseCSV(text);
      if (!rows.length) return;
      const headers = rows[0].map((h) => String(h || '').trim());
      const map = {};
      headers.forEach((h, idx) => {
        map[normalizeHeader(h)] = idx;
      });

      rows.slice(1).forEach((row) => {
        const section = fromRow(row, map, ['Section', 'Section ']) || fallbackSection;
        const group = toGroupLabel(fromRow(row, map, ['Group No', 'Group']));
        const enrollment = fromRow(row, map, ['Enrollment No']);
        const name = fromRow(row, map, ['Name']);

        if (!name && !enrollment) return;
        entries.push({ section, group, enrollment, name });
      });
    });

    teamDirectory = entries;
    applyTeamFilters();
  } catch (error) {
    teamDirectory = [];
    if (teamStatus) teamStatus.textContent = 'Unable to load team CSV files. Use hosted mode or data/team-directory.js.';
  }
}

function renderTeamResults(items) {
  if (!teamResults) return;
  teamResults.innerHTML = '';

  items.slice(0, 80).forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'team-item';
    li.innerHTML = `
      <div class="team-meta">
        <span>Section ${entry.section}</span>
        <span>${entry.group || 'Group N/A'}</span>
      </div>
      <strong>${entry.name || 'Name unavailable'}</strong>
      <p>Enrollment: ${entry.enrollment || 'N/A'}</p>
    `;
    teamResults.appendChild(li);
  });
}

function applyTeamFilters() {
  const query = normalize(teamSearchInput?.value || '');
  const base = teamDirectory.filter((entry) => {
    const matchesSection = activeTeamFilter === 'all' || normalize(entry.section) === normalize(activeTeamFilter);
    return matchesSection;
  });

  if (!query) {
    renderTeamSummary(base);
    if (teamStatus) {
      if (activeTeamFilter === 'all') {
        teamStatus.textContent = `Showing section summaries • ${teamDirectory.length} students loaded. Search by Group / Enrollment / Name for direct match.`;
      } else {
        teamStatus.textContent = `Showing group summaries for section ${activeTeamFilter}. Search to see student-level matches.`;
      }
    }
    return;
  }

  const filtered = base.filter((entry) => {
    const haystack = normalize(`${entry.name} ${entry.enrollment} ${entry.group} ${entry.section}`);
    const matchesQuery = !query || haystack.includes(query);
    return matchesQuery;
  });

  renderTeamResults(filtered.slice(0, 60));

  if (teamStatus) {
    const label = activeTeamFilter === 'all' ? 'all sections' : `section ${activeTeamFilter}`;
    teamStatus.textContent = `${filtered.length} match${filtered.length === 1 ? '' : 'es'} in ${label}.`;
  }
}

function setActiveTeamChip(next) {
  activeTeamFilter = next;
  teamChips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.teamFilter === next));
  applyTeamFilters();
}

function renderTeamSummary(items) {
  if (!teamResults) return;
  teamResults.innerHTML = '';

  if (!items.length) return;

  if (activeTeamFilter === 'all') {
    const bySection = new Map();
    items.forEach((entry) => {
      const key = entry.section || 'NA';
      const next = bySection.get(key) || { students: 0, groups: new Set() };
      next.students += 1;
      if (entry.group) next.groups.add(entry.group);
      bySection.set(key, next);
    });

    Array.from(bySection.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([section, info]) => {
        const li = document.createElement('li');
        li.className = 'team-summary';
        li.innerHTML = `
          <button type="button" data-jump-section="${section}">
            <strong>Section ${section}</strong>
            <p>${info.students} students • ${info.groups.size} groups</p>
          </button>
        `;
        teamResults.appendChild(li);
      });
    return;
  }

  const byGroup = new Map();
  items.forEach((entry) => {
    const key = entry.group || 'Unassigned';
    const next = byGroup.get(key) || { students: 0 };
    next.students += 1;
    byGroup.set(key, next);
  });

  Array.from(byGroup.entries())
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .forEach(([group, info]) => {
      const li = document.createElement('li');
      li.className = 'team-summary';
      li.innerHTML = `
        <button type="button" data-group-query="${group}">
          <strong>${group}</strong>
          <p>${info.students} students</p>
        </button>
      `;
      teamResults.appendChild(li);
    });
}

function getPaletteTargets() {
  const sectionTargets = [
    { label: 'Go to Overview', action: () => jumpTo('#context') },
    { label: 'Go to Registration', action: () => jumpTo('#registration') },
    { label: 'Go to Documents', action: () => jumpTo('#documents') },
    { label: 'Go to Datasets', action: () => jumpTo('#datasets') },
    { label: 'Go to Team Finder', action: () => jumpTo('#sections') },
    {
      label: 'Find team',
      action: () => {
        jumpTo('#sections');
        teamSearchInput?.focus();
      }
    },
    { label: 'Go to Readiness', action: () => jumpTo('#ready-check') }
  ];

  const docTargets = docCards.map((card) => ({
    label: `Open document: ${card.querySelector('h3')?.textContent || 'Untitled'}`,
    action: () => {
      const link = card.querySelector('.doc-open');
      link?.click();
    }
  }));

  return [...sectionTargets, ...docTargets];
}

function renderPalette(items) {
  if (!paletteList) return;
  paletteList.innerHTML = '';

  items.forEach((item) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      item.action();
      palette?.close();
    });
    li.appendChild(btn);
    paletteList.appendChild(li);
  });
}

function openPalette() {
  if (!palette) return;
  renderPalette(getPaletteTargets());
  palette.showModal();
  paletteInput?.focus();
}

function filterPalette() {
  const query = normalize(paletteInput?.value || '');
  const targets = getPaletteTargets();
  const next = !query ? targets : targets.filter((item) => normalize(item.label).includes(query));
  renderPalette(next);
}

loadStars();
syncStarsUI();
activateReveals();
activateSectionSpy();
updateScrollProgress();
updateReadyScore();
applyDocFilters();
applyTeamFilters();
loadTeamDirectory();

searchInput?.addEventListener('input', applyDocFilters);
chips.forEach((chip) => chip.addEventListener('click', () => setActiveChip(chip.dataset.filter || 'all')));
readyItems.forEach((item) => item.addEventListener('change', updateReadyScore));
surpriseBtn?.addEventListener('click', pickRandomDocument);
focusBtn?.addEventListener('click', rotateFocus);
window.addEventListener('scroll', updateScrollProgress, { passive: true });
teamSearchInput?.addEventListener('input', applyTeamFilters);
teamChips.forEach((chip) => chip.addEventListener('click', () => setActiveTeamChip(chip.dataset.teamFilter || 'all')));
focusTeamSearchBtn?.addEventListener('click', () => teamSearchInput?.focus());
sectionLinks.forEach((link) => {
  link.addEventListener('click', () => {
    const next = link.dataset.teamSection || 'all';
    teamFilterChipsWrap?.classList.remove('is-collapsed');
    setActiveTeamChip(next);
    teamSearchInput?.focus();
  });
});
teamResults?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const sectionBtn = target.closest('[data-jump-section]');
  if (sectionBtn instanceof HTMLElement) {
    const section = sectionBtn.dataset.jumpSection || 'all';
    setActiveTeamChip(section);
    teamSearchInput?.focus();
    return;
  }

  const groupBtn = target.closest('[data-group-query]');
  if (groupBtn instanceof HTMLElement && teamSearchInput) {
    teamSearchInput.value = groupBtn.dataset.groupQuery || '';
    applyTeamFilters();
    teamSearchInput.focus();
  }
});

for (const card of docCards) {
  card.querySelector('.star-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    const id = card.dataset.id;
    if (starredSet.has(id)) starredSet.delete(id);
    else starredSet.add(id);
    saveStars();
    syncStarsUI();
    applyDocFilters();
  });
}

openPaletteBtn?.addEventListener('click', openPalette);
paletteInput?.addEventListener('input', filterPalette);

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== searchInput) {
    event.preventDefault();
    searchInput?.focus();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openPalette();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    jumpTo('#sections');
    teamSearchInput?.focus();
  }
});
