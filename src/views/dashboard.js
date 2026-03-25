const router = require('../router');

let categories = [];
let stats = [];

async function render(container) {
  container.innerHTML = '<div class="dashboard"><p class="loading">Loading...</p></div>';

  try {
    [categories, stats] = await Promise.all([
      window.electronAPI.getCategories(),
      window.electronAPI.getUserStats(),
    ]);
  } catch {
    container.innerHTML = '<div class="dashboard"><p class="error">Failed to load data. Check your internet connection.</p></div>';
    return;
  }

  const statsMap = {};
  if (Array.isArray(stats)) {
    for (const s of stats) {
      const key = `${s.category_id}-${s.difficulty}`;
      statsMap[key] = s;
    }
  }

  const cardsHTML = categories.map((cat) => {
    const difficulties = ['easy', 'medium', 'hard'];
    const diffHTML = difficulties.map((d) => {
      const s = statsMap[`${cat.id}-${d}`];
      const attempted = s ? s.total_attempted : 0;
      const correct = s ? s.total_correct : 0;
      const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : null;
      const pctText = pct !== null ? `${pct}%` : '--';
      const barWidth = attempted > 0 ? Math.min((attempted / 20) * 100, 100) : 0;
      const barColor = pct === null ? '#555' : pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';

      return `
        <div class="diff-row" data-cat="${cat.id}" data-diff="${d}">
          <span class="diff-label">${d}</span>
          <div class="diff-bar-bg"><div class="diff-bar" style="width:${barWidth}%;background:${barColor}"></div></div>
          <span class="diff-pct">${pctText}</span>
          <span class="diff-count">${attempted}/20</span>
        </div>
      `;
    }).join('');

    return `
      <div class="cat-card">
        <h3 class="cat-name">${cat.name}</h3>
        <p class="cat-desc">${cat.description || ''}</p>
        <div class="cat-diffs">${diffHTML}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="dashboard">
      <header class="dash-header">
        <h1>LogicMonkey</h1>
        <p class="subtitle">LSAT Logical Reasoning Practice</p>
      </header>

      <div class="start-section">
        <select id="cat-select">
          <option value="">Choose category...</option>
          ${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select id="diff-select">
          <option value="">Choose difficulty...</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button id="start-btn" disabled>Start Practice</button>
      </div>

      <div class="cards-grid">${cardsHTML}</div>

      <footer class="dash-footer">
        <button id="theme-btn" class="footer-btn">Toggle Theme</button>
        <button id="update-btn" class="footer-btn">Check for Updates</button>
        <span id="update-status"></span>
      </footer>
    </div>
  `;

  // Wire up start button
  const catSelect = document.getElementById('cat-select');
  const diffSelect = document.getElementById('diff-select');
  const startBtn = document.getElementById('start-btn');

  function checkReady() {
    startBtn.disabled = !(catSelect.value && diffSelect.value);
  }
  catSelect.addEventListener('change', checkReady);
  diffSelect.addEventListener('change', checkReady);

  startBtn.addEventListener('click', () => {
    const cat = categories.find((c) => c.id === parseInt(catSelect.value));
    router.navigate('#quiz', {
      categoryId: parseInt(catSelect.value),
      categoryName: cat ? cat.name : '',
      difficulty: diffSelect.value,
    });
  });

  // Clicking a difficulty row starts that specific practice
  document.querySelectorAll('.diff-row').forEach((row) => {
    row.addEventListener('click', () => {
      const catId = parseInt(row.dataset.cat);
      const diff = row.dataset.diff;
      const cat = categories.find((c) => c.id === catId);
      router.navigate('#quiz', {
        categoryId: catId,
        categoryName: cat ? cat.name : '',
        difficulty: diff,
      });
    });
  });

  // Theme toggle
  document.getElementById('theme-btn').addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  // Update button
  const updateBtn = document.getElementById('update-btn');
  const updateStatus = document.getElementById('update-status');
  let pendingDmgUrl = null;

  updateBtn.addEventListener('click', async () => {
    if (pendingDmgUrl) {
      updateBtn.disabled = true;
      updateBtn.textContent = 'Downloading...';
      window.electronAPI.onDownloadProgress((pct) => { updateStatus.textContent = `${pct}%`; });
      try {
        await window.electronAPI.installUpdate(pendingDmgUrl);
        updateBtn.textContent = 'DMG Opened!';
        updateStatus.textContent = 'Drag to Applications, then relaunch.';
      } catch {
        updateBtn.textContent = 'Download Failed';
      }
      return;
    }
    updateBtn.disabled = true;
    updateBtn.textContent = 'Checking...';
    const result = await window.electronAPI.checkForUpdate();
    if (result.hasUpdate && result.dmgUrl) {
      pendingDmgUrl = result.dmgUrl;
      updateBtn.textContent = `Install ${result.version}`;
      updateBtn.disabled = false;
      updateStatus.textContent = 'New version found!';
    } else {
      updateBtn.textContent = 'Check for Updates';
      updateBtn.disabled = false;
      updateStatus.textContent = result.error || "You're up to date!";
    }
  });
}

function cleanup() {}

module.exports = { render, cleanup };
