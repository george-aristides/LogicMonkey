const router = require('../router');

function render(container, params) {
  const { sessionResults = [], categoryName = '', difficulty = '' } = params || {};
  const correct = sessionResults.filter((r) => r.isCorrect).length;
  const total = sessionResults.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const breakdownHTML = sessionResults.map((r) => `
    <div class="result-row ${r.isCorrect ? 'result-correct' : 'result-incorrect'}">
      <div class="result-summary" data-idx="${r.questionNum}">
        <span class="result-num">#${r.questionNum}</span>
        <span class="result-icon">${r.isCorrect ? 'O' : 'X'}</span>
        <span class="result-answers">You: ${r.selectedAnswer} ${r.isCorrect ? '' : '| Correct: ' + r.correctAnswer}</span>
        <span class="result-expand">+</span>
      </div>
      <div class="result-detail hidden" id="detail-${r.questionNum}">
        <div class="result-stimulus">${r.stimulus}</div>
        <div class="result-stem">${r.stem}</div>
        <div class="result-explanation">${r.explanation || ''}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="results">
      <header class="results-header">
        <h1>Session Results</h1>
        <p class="results-meta">${categoryName} — ${difficulty}</p>
      </header>

      <div class="score-card">
        <div class="score-big">${correct} / ${total}</div>
        <div class="score-pct">${pct}%</div>
        <div class="score-bar-bg">
          <div class="score-bar" style="width:${pct}%;background:${pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444'}"></div>
        </div>
      </div>

      <div class="breakdown">
        <h2>Question Breakdown</h2>
        ${breakdownHTML}
      </div>

      <div class="results-actions">
        <button id="back-dash-btn" class="primary-btn">Back to Dashboard</button>
      </div>
    </div>
  `;

  // Toggle detail on click
  document.querySelectorAll('.result-summary').forEach((row) => {
    row.addEventListener('click', () => {
      const idx = row.dataset.idx;
      const detail = document.getElementById(`detail-${idx}`);
      const expand = row.querySelector('.result-expand');
      if (detail.classList.contains('hidden')) {
        detail.classList.remove('hidden');
        expand.textContent = '-';
      } else {
        detail.classList.add('hidden');
        expand.textContent = '+';
      }
    });
  });

  document.getElementById('back-dash-btn').addEventListener('click', () => {
    router.navigate('#dashboard');
  });
}

function cleanup() {}

module.exports = { render, cleanup };
