require('dotenv').config();
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || './mirla_medical.db';
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS mirla_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition TEXT DEFAULT 'Systemic Sclerosis',
    current_medications TEXT DEFAULT 'MMF, Nifedipine, Sildenafil, Omeprazole',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    il6 REAL, tgf_beta REAL, a20 REAL,
    potassium REAL, creatinine REAL, wbc REAL,
    mrss REAL, fvc REAL, hemoglobin REAL,
    platelets REAL, alt REAL, ast REAL,
    notes TEXT, source_file TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    mechanism TEXT, target_pathways TEXT,
    efficacy_score REAL, safety_score REAL,
    evidence_score REAL, trial_score REAL,
    final_score REAL, drug_class TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS drug_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, drug_name TEXT NOT NULL,
    match_percentage REAL, mechanism_score REAL,
    evidence_score REAL, safety_score REAL, trial_score REAL,
    reasoning TEXT, evidence_summary TEXT, contraindications TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS research_papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_name TEXT, pubmed_id TEXT UNIQUE,
    title TEXT, authors TEXT, year INTEGER,
    abstract TEXT, key_findings TEXT,
    evidence_level INTEGER, doi TEXT, url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS clinical_trials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nct_id TEXT UNIQUE, drug_name TEXT,
    title TEXT, phase TEXT, status TEXT,
    location TEXT, institution TEXT,
    inclusion_criteria TEXT, contact_name TEXT,
    contact_email TEXT, contact_phone TEXT,
    enrollment_count INTEGER, start_date TEXT,
    completion_date TEXT, url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS mirla_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE, note_text TEXT NOT NULL,
    mood TEXT, pain_level INTEGER, energy_level INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    included_in_weekly BOOLEAN DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL, week_end TEXT NOT NULL,
    sent_to_robbie BOOLEAN DEFAULT 0, sent_date DATETIME,
    full_content TEXT, red_flags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS drug_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_a TEXT NOT NULL, drug_b TEXT NOT NULL,
    severity TEXT, description TEXT, recommendation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  INSERT OR IGNORE INTO mirla_profile (id, condition, current_medications)
  VALUES (1, 'Systemic Sclerosis', 'MMF, Nifedipine, Sildenafil, Omeprazole');
  INSERT OR IGNORE INTO lab_results (date, il6, tgf_beta, mrss, fvc, notes)
  VALUES ('2025-01-01', 45, 22.5, 28, 68, 'Baseline values');
`);

console.log('✅ Database ready:', DB_PATH);
module.exports = db;
