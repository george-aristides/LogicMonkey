const { supabase } = require('./supabaseClient');

async function findByUserCategoryDifficulty(userId, categoryId, difficulty) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('difficulty', difficulty)
    .single();

  // PGRST116 = no rows found, which is expected for first attempt
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function insert(row) {
  const { error } = await supabase.from('user_stats').insert(row);
  if (error) throw error;
}

async function update(userId, categoryId, difficulty, updates) {
  const { error } = await supabase
    .from('user_stats')
    .update(updates)
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('difficulty', difficulty);
  if (error) throw error;
}

/** @returns {Promise<import('../entities/UserStats').UserStatsWithCategory[]>} */
async function findAllByUser(userId) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*, categories(name, slug)')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}

module.exports = { findByUserCategoryDifficulty, insert, update, findAllByUser };
