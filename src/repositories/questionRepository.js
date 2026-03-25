const { supabase } = require('./supabaseClient');

/**
 * @param {import('../entities/Question').QuestionFilter} filter
 * @returns {Promise<import('../entities/Question').Question[]>}
 */
async function findByFilter(filter) {
  let query = supabase
    .from('questions')
    .select('id, category_id, difficulty, stimulus, stem, choice_a, choice_b, choice_c, choice_d, choice_e, topic_area');

  if (filter.categoryId) query = query.eq('category_id', filter.categoryId);
  if (filter.difficulty) query = query.eq('difficulty', filter.difficulty);
  if (filter.limit) query = query.limit(filter.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * @param {string} questionId
 */
async function findAnswerById(questionId) {
  const { data, error } = await supabase
    .from('questions')
    .select('correct_answer, explanation, explanation_a, explanation_b, explanation_c, explanation_d, explanation_e')
    .eq('id', questionId)
    .single();
  if (error) throw error;
  return data;
}

module.exports = { findByFilter, findAnswerById };
