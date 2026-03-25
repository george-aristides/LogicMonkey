-- LogicMonkey LSAT Questions Schema

-- Table 1: Categories (11 rows, static)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INT NOT NULL
);

-- Table 2: Questions (660 rows)
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  stimulus TEXT NOT NULL,
  stem TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  choice_e TEXT NOT NULL,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D','E')),
  explanation TEXT,
  explanation_a TEXT,
  explanation_b TEXT,
  explanation_c TEXT,
  explanation_d TEXT,
  explanation_e TEXT,
  topic_area TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_cat_diff ON questions(category_id, difficulty);

-- Table 3: User attempts
CREATE TABLE attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A','B','C','D','E')),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_attempts_user_question ON attempts(user_id, question_id);

-- Table 4: User stats (materialized summary)
CREATE TABLE user_stats (
  user_id TEXT NOT NULL,
  category_id INT NOT NULL REFERENCES categories(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  total_attempted INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, category_id, difficulty)
);

-- Row Level Security
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are readable by everyone" ON questions FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are readable by everyone" ON categories FOR SELECT USING (true);

ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert attempts" ON attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read attempts" ON attempts FOR SELECT USING (true);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_stats" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_stats" ON user_stats FOR UPDATE USING (true);
