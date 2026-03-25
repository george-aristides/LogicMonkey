const { getUserId } = require('../repositories/supabaseClient');
const questionRepository = require('../repositories/questionRepository');
const attemptRepository = require('../repositories/attemptRepository');
const userStatsRepository = require('../repositories/userStatsRepository');

/**
 * @param {import('../entities/Question').QuestionFilter} filter
 */
async function getQuestions(filter) {
  return questionRepository.findByFilter(filter);
}

/**
 * @param {Object} payload
 * @param {string} payload.questionId
 * @param {'A'|'B'|'C'|'D'|'E'} payload.selectedAnswer
 * @param {number} payload.categoryId
 * @param {'easy'|'medium'|'hard'} payload.difficulty
 * @param {number} [payload.timeSpent]
 * @returns {Promise<import('../entities/Question').AnswerResult>}
 */
async function submitAnswer(payload) {
  const userId = getUserId();

  // 1. Get correct answer + explanations
  const question = await questionRepository.findAnswerById(payload.questionId);

  // 2. Check correctness
  const isCorrect = payload.selectedAnswer === question.correct_answer;

  // 3. Record attempt
  await attemptRepository.insert({
    user_id: userId,
    question_id: payload.questionId,
    selected_answer: payload.selectedAnswer,
    is_correct: isCorrect,
    time_spent_seconds: payload.timeSpent || null,
  });

  // 4. Upsert user stats
  const existing = await userStatsRepository.findByUserCategoryDifficulty(
    userId, payload.categoryId, payload.difficulty
  );

  if (existing) {
    await userStatsRepository.update(userId, payload.categoryId, payload.difficulty, {
      total_attempted: existing.total_attempted + 1,
      total_correct: existing.total_correct + (isCorrect ? 1 : 0),
      last_attempted_at: new Date().toISOString(),
    });
  } else {
    await userStatsRepository.insert({
      user_id: userId,
      category_id: payload.categoryId,
      difficulty: payload.difficulty,
      total_attempted: 1,
      total_correct: isCorrect ? 1 : 0,
      last_attempted_at: new Date().toISOString(),
    });
  }

  // 5. Return result
  return {
    isCorrect,
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
    explanations: {
      A: question.explanation_a,
      B: question.explanation_b,
      C: question.explanation_c,
      D: question.explanation_d,
      E: question.explanation_e,
    },
  };
}

module.exports = { getQuestions, submitAnswer };
