const categoryRepository = require('../repositories/categoryRepository');

async function getCategories() {
  return categoryRepository.findAll();
}

module.exports = { getCategories };
