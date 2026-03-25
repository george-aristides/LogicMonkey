#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'flaw', 'weaken', 'strengthen', 'necessary-assumption', 'sufficient-assumption',
  'must-be-true', 'resolve-paradox', 'method-of-reasoning', 'principle',
  'point-at-issue', 'parallel-reasoning'
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_ANSWERS = ['A', 'B', 'C', 'D', 'E'];
const VALID_TOPICS = ['law', 'natural_science', 'social_science', 'humanities'];
const QUESTIONS_DIR = path.join(__dirname, 'seed', 'questions');

let totalQuestions = 0;
let totalErrors = 0;
const allStimuli = [];
const globalAnswerDist = { A: 0, B: 0, C: 0, D: 0, E: 0 };
const globalTopicDist = {};

function validateBatch(categorySlug, difficulty) {
  const filePath = path.join(QUESTIONS_DIR, categorySlug, `${difficulty}.json`);

  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${categorySlug}/${difficulty}.json (not found)`);
    return;
  }

  let questions;
  try {
    questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`  ERROR ${categorySlug}/${difficulty}.json: invalid JSON — ${e.message}`);
    totalErrors++;
    return;
  }

  if (!Array.isArray(questions)) {
    console.error(`  ERROR ${categorySlug}/${difficulty}.json: not an array`);
    totalErrors++;
    return;
  }

  if (questions.length !== 20) {
    console.error(`  ERROR ${categorySlug}/${difficulty}.json: expected 20 questions, got ${questions.length}`);
    totalErrors++;
  }

  const batchAnswerDist = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  questions.forEach((q, i) => {
    const prefix = `  [${categorySlug}/${difficulty}#${i + 1}]`;

    // Check required fields
    const requiredFields = [
      'stimulus', 'stem', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'choice_e',
      'correct_answer', 'explanation', 'explanation_a', 'explanation_b', 'explanation_c',
      'explanation_d', 'explanation_e', 'topic_area'
    ];
    for (const field of requiredFields) {
      if (!q[field] || (typeof q[field] === 'string' && q[field].trim() === '')) {
        console.error(`${prefix} missing or empty field: ${field}`);
        totalErrors++;
      }
    }

    // Check stimulus word count
    if (q.stimulus) {
      const wordCount = q.stimulus.split(/\s+/).length;
      if (wordCount < 30 || wordCount > 120) {
        console.warn(`${prefix} stimulus word count ${wordCount} (expected 30-120)`);
      }
    }

    // Check correct_answer
    if (!VALID_ANSWERS.includes(q.correct_answer)) {
      console.error(`${prefix} invalid correct_answer: "${q.correct_answer}"`);
      totalErrors++;
    } else {
      batchAnswerDist[q.correct_answer]++;
      globalAnswerDist[q.correct_answer]++;
    }

    // Check topic_area
    if (q.topic_area && !VALID_TOPICS.includes(q.topic_area)) {
      console.error(`${prefix} invalid topic_area: "${q.topic_area}"`);
      totalErrors++;
    } else if (q.topic_area) {
      globalTopicDist[q.topic_area] = (globalTopicDist[q.topic_area] || 0) + 1;
    }

    // Check all 5 choices are distinct
    const choices = [q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.choice_e].filter(Boolean);
    const uniqueChoices = new Set(choices.map(c => c.toLowerCase().trim()));
    if (uniqueChoices.size < 5) {
      console.error(`${prefix} duplicate answer choices detected`);
      totalErrors++;
    }

    // Check category_slug matches
    if (q.category_slug && q.category_slug !== categorySlug) {
      console.warn(`${prefix} category_slug "${q.category_slug}" doesn't match directory "${categorySlug}"`);
    }

    // Check difficulty matches
    if (q.difficulty && q.difficulty !== difficulty) {
      console.warn(`${prefix} difficulty "${q.difficulty}" doesn't match file "${difficulty}"`);
    }

    // Collect stimuli for dedup
    if (q.stimulus) {
      allStimuli.push({ text: q.stimulus.substring(0, 80), location: `${categorySlug}/${difficulty}#${i + 1}` });
    }

    totalQuestions++;
  });

  // Check answer distribution within batch
  const maxAnswer = Math.max(...Object.values(batchAnswerDist));
  const minAnswer = Math.min(...Object.values(batchAnswerDist));
  if (maxAnswer - minAnswer > 6) {
    console.warn(`  WARN ${categorySlug}/${difficulty}: uneven answer distribution: ${JSON.stringify(batchAnswerDist)}`);
  }
}

console.log('=== LSAT Question Validation ===\n');

for (const cat of CATEGORIES) {
  console.log(`Category: ${cat}`);
  for (const diff of DIFFICULTIES) {
    validateBatch(cat, diff);
  }
  console.log('');
}

// Check for duplicate stimuli
console.log('=== Duplicate Check ===');
const seen = new Map();
let dupes = 0;
for (const { text, location } of allStimuli) {
  const key = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seen.has(key)) {
    console.error(`  DUPE: "${text}..." at ${location} matches ${seen.get(key)}`);
    dupes++;
    totalErrors++;
  } else {
    seen.set(key, location);
  }
}
if (dupes === 0) console.log('  No duplicates found.');

// Summary
console.log('\n=== Summary ===');
console.log(`Total questions: ${totalQuestions} / 660`);
console.log(`Total errors: ${totalErrors}`);
console.log(`Answer distribution: ${JSON.stringify(globalAnswerDist)}`);
console.log(`Topic distribution: ${JSON.stringify(globalTopicDist)}`);

if (totalErrors > 0) {
  console.log('\nVALIDATION FAILED');
  process.exit(1);
} else if (totalQuestions === 660) {
  console.log('\nALL CHECKS PASSED');
} else {
  console.log(`\nPARTIAL — ${totalQuestions}/660 questions validated, no errors in those found`);
}
