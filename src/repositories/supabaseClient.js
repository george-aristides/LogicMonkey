const { createClient } = require('@supabase/supabase-js');
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ztcyexushrfgyohvysfv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Y3lleHVzaHJmZ3lvaHZ5c2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDI1MjUsImV4cCI6MjA4OTM3ODUyNX0.z1bWA8oJXFLpfNJzP6XihqnGTrDoqaIyJtR8sTDLDdY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getUserId() {
  const userDataPath = app.getPath('userData');
  const idFile = path.join(userDataPath, 'user-id.json');

  if (fs.existsSync(idFile)) {
    return JSON.parse(fs.readFileSync(idFile, 'utf-8')).id;
  }

  const id = crypto.randomUUID();
  fs.writeFileSync(idFile, JSON.stringify({ id }));
  return id;
}

module.exports = { supabase, getUserId };
