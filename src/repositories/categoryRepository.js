const { supabase } = require('./supabaseClient');

/** @returns {Promise<import('../entities/Category').Category[]>} */
async function findAll() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data;
}

module.exports = { findAll };
