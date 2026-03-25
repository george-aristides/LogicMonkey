/**
 * @typedef {Object} UserStats
 * @property {string} user_id
 * @property {number} category_id
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {number} total_attempted
 * @property {number} total_correct
 * @property {string|null} last_attempted_at - ISO timestamp
 */

/**
 * @typedef {Object} UserStatsWithCategory
 * @property {string} user_id
 * @property {number} category_id
 * @property {'easy'|'medium'|'hard'} difficulty
 * @property {number} total_attempted
 * @property {number} total_correct
 * @property {string|null} last_attempted_at
 * @property {{ name: string, slug: string }} categories
 */

module.exports = {};
