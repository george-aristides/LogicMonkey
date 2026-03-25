const router = require('../router');

let questions = [];
let currentIndex = 0;
let selectedAnswer = null;
let revealed = false;
let sessionResults = [];
let params = {};

async function render(container, routeParams) {
  params = routeParams || {};
  questions = [];
  currentIndex = 0;
  sessionResults = [];

  container.innerHTML = '<div class="quiz"><p class="loading">Loading questions...</p></div>';

  try {
    questions = await window.electronAPI.getQuestions({
      categoryId: params.categoryId,
      difficulty: params.difficulty,
      limit: 20,
    });
  } catch {
    container.innerHTML = '<div class="quiz"><p class="error">Failed to load questions.</p></div>';
    return;
  }

  if (!questions || questions.length === 0) {
    container.innerHTML = '<div class="quiz"><p class="error">No questions found for this selection.</p></div>';
    return;
  }

  renderQuestion(container);
}

function renderQuestion(container) {
  const q = questions[currentIndex];
  selectedAnswer = null;
  revealed = false;

  const choices = [
    { letter: 'A', text: q.choice_a },
    { letter: 'B', text: q.choice_b },
    { letter: 'C', text: q.choice_c },
    { letter: 'D', text: q.choice_d },
    { letter: 'E', text: q.choice_e },
  ];

  const choicesHTML = choices.map((c) => `
    <button class="choice-btn" data-letter="${c.letter}">
      <span class="choice-letter">${c.letter}</span>
      <span class="choice-text">${c.text}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="quiz">
      <header class="quiz-header">
        <button class="back-btn" id="back-btn">Back</button>
        <div class="quiz-info">
          <span class="quiz-cat">${params.categoryName || 'Practice'}</span>
          <span class="quiz-diff badge-${params.difficulty}">${params.difficulty}</span>
        </div>
        <span class="quiz-progress">${currentIndex + 1} / ${questions.length}</span>
      </header>

      <div class="quiz-body">
        <div class="stimulus">${q.stimulus}</div>
        <div class="stem">${q.stem}</div>
        <div class="choices">${choicesHTML}</div>
      </div>

      <div class="quiz-actions">
        <button id="submit-btn" class="submit-btn" disabled>Submit Answer</button>
      </div>

      <div id="feedback" class="feedback hidden"></div>
    </div>
  `;

  // Wire up back button
  document.getElementById('back-btn').addEventListener('click', () => {
    router.navigate('#dashboard');
  });

  // Wire up choice selection
  document.querySelectorAll('.choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (revealed) return;
      selectedAnswer = btn.dataset.letter;
      document.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('submit-btn').disabled = false;
    });
  });

  // Wire up submit
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
}

async function handleSubmit() {
  if (!selectedAnswer || revealed) return;
  revealed = true;

  const q = questions[currentIndex];
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Checking...';

  let result;
  try {
    result = await window.electronAPI.submitAnswer({
      questionId: q.id,
      selectedAnswer,
      categoryId: params.categoryId,
      difficulty: params.difficulty,
    });
  } catch {
    submitBtn.textContent = 'Error — try again';
    submitBtn.disabled = false;
    revealed = false;
    return;
  }

  // Store result for results screen
  sessionResults.push({
    questionNum: currentIndex + 1,
    stimulus: q.stimulus,
    stem: q.stem,
    selectedAnswer,
    correctAnswer: result.correctAnswer,
    isCorrect: result.isCorrect,
    explanation: result.explanation,
    explanations: result.explanations,
  });

  // Highlight choices
  document.querySelectorAll('.choice-btn').forEach((btn) => {
    btn.classList.remove('selected');
    if (btn.dataset.letter === result.correctAnswer) {
      btn.classList.add('correct');
    }
    if (btn.dataset.letter === selectedAnswer && !result.isCorrect) {
      btn.classList.add('incorrect');
    }
  });

  // Show feedback
  const feedback = document.getElementById('feedback');
  feedback.classList.remove('hidden');
  feedback.innerHTML = `
    <div class="feedback-result ${result.isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
      ${result.isCorrect ? 'Correct!' : `Incorrect — the answer is ${result.correctAnswer}`}
    </div>
    <div class="feedback-explanation">${result.explanation || ''}</div>
  `;

  // Replace submit with next/finish button
  const isLast = currentIndex >= questions.length - 1;
  submitBtn.textContent = isLast ? 'See Results' : 'Next Question';
  submitBtn.disabled = false;
  submitBtn.removeEventListener('click', handleSubmit);
  submitBtn.addEventListener('click', () => {
    if (isLast) {
      router.navigate('#results', {
        sessionResults,
        categoryName: params.categoryName,
        difficulty: params.difficulty,
      });
    } else {
      currentIndex++;
      renderQuestion(document.getElementById('app'));
    }
  });
}

function cleanup() {
  questions = [];
  currentIndex = 0;
  sessionResults = [];
  selectedAnswer = null;
  revealed = false;
}

module.exports = { render, cleanup };
