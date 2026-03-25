const { getUserId } = require('../repositories/supabaseClient');
const userStatsRepository = require('../repositories/userStatsRepository');

async function getUserStats() {
  const userId = getUserId();
  return userStatsRepository.findAllByUser(userId);
}

module.exports = { getUserStats };
