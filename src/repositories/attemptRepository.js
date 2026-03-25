const { supabase } = require('./supabaseClient');

/**
 * @param {Object} data
 * @param {string} data.user_id
 * @param {string} data.question_id
 * @param {'A'|'B'|'C'|'D'|'E'} data.selected_answer
 * @param {boolean} data.is_correct
 * @param {number|null} [data.time_spent_seconds]
 */
async function insert(data) {
  const { error } = await supabase.from('attempts').insert(data);
  if (error) throw error;
}

module.exports = { insert };
