#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars. Run with:');
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... node scripts/seed-database.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SEED_DIR = path.join(__dirname, 'seed');
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'categories.json'), 'utf-8'));
const DIFFICULTIES = ['easy', 'medium', 'hard'];

async function seed() {
  console.log('Seeding categories...');

  // Insert categories
  const { data: catData, error: catError } = await supabase
    .from('categories')
    .upsert(CATEGORIES, { onConflict: 'slug' })
    .select();

  if (catError) {
    console.error('Failed to insert categories:', catError.message);
    process.exit(1);
  }

  // Build slug -> id map
  const slugToId = {};
  for (const cat of catData) {
    slugToId[cat.slug] = cat.id;
  }
  console.log(`  Inserted ${catData.length} categories`);

  // Insert questions
  let totalInserted = 0;

  for (const cat of CATEGORIES) {
    for (const diff of DIFFICULTIES) {
      const filePath = path.join(SEED_DIR, 'questions', cat.slug, `${diff}.json`);

      if (!fs.existsSync(filePath)) {
        console.warn(`  SKIP ${cat.slug}/${diff}.json (not found)`);
        continue;
      }

      const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const rows = questions.map((q) => ({
        category_id: slugToId[cat.slug],
        difficulty: diff,
        stimulus: q.stimulus,
        stem: q.stem,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        choice_e: q.choice_e,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        explanation_a: q.explanation_a,
        explanation_b: q.explanation_b,
        explanation_c: q.explanation_c,
        explanation_d: q.explanation_d,
        explanation_e: q.explanation_e,
        topic_area: q.topic_area,
        tags: q.tags || [],
      }));

      const { error } = await supabase.from('questions').insert(rows);

      if (error) {
        console.error(`  ERROR ${cat.slug}/${diff}: ${error.message}`);
      } else {
        totalInserted += rows.length;
        console.log(`  ${cat.slug}/${diff}: ${rows.length} questions`);
      }
    }
  }

  console.log(`\nDone! Total questions inserted: ${totalInserted}`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
