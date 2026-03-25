/**
 * @typedef {Object} Question
 * @property {string} id - UUID
 * @property {number} category_id
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {string} stimulus
 * @property {string} stem
 * @property {string} choice_a
 * @property {string} choice_b
 * @property {string} choice_c
 * @property {string} choice_d
 * @property {string} choice_e
 * @property {'A'|'B'|'C'|'D'|'E'} correct_answer
 * @property {string|null} explanation
 * @property {string|null} explanation_a
 * @property {string|null} explanation_b
 * @property {string|null} explanation_c
 * @property {string|null} explanation_d
 * @property {string|null} explanation_e
 * @property {string|null} topic_area
 * @property {string[]} tags
 */

/**
 * @typedef {Object} QuestionFilter
 * @property {number} [categoryId]
 * @property {'easy'|'medium'|'hard'} [difficulty]
 * @property {number} [limit]
 */

/**
 * @typedef {Object} AnswerResult
 * @property {boolean} isCorrect
 * @property {'A'|'B'|'C'|'D'|'E'} correctAnswer
 * @property {string|null} explanation
 * @property {Object.<string, string|null>} explanations
 */

module.exports = {};
