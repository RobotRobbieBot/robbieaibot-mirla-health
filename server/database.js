require('dotenv').config();
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_PATH || './mirla_medical.db';
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS mirla_profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition TEXT,
    current_medications TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS lab_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    il6 REAL, tgf_beta REAL, a20 REAL,
    potassium REAL, creatinine REAL, wbc REAL,
    mrss REAL, fvc REAL, hemoglobin REAL,
    platelets REAL, alt REAL, ast REAL,
    glucose REAL, sodium REAL, bun REAL,
    egfr REAL, albumin REAL, calcium REAL,
    lipase REAL, amylase REAL, magnesium REAL,
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

  -- AI agent tables (referenced by analysis routes)
  CREATE TABLE IF NOT EXISTS analysis_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lab_ids TEXT, critical_flags TEXT DEFAULT '[]',
    report_text TEXT, pubmed_refs TEXT, trials_refs TEXT,
    raw_context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES analysis_reports(id)
  );
  CREATE TABLE IF NOT EXISTS doctor_briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    drug_name TEXT NOT NULL,
    brief_text TEXT,
    papers TEXT DEFAULT '[]',
    trials TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Personal data tables (previously localStorage-only)
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT,
    prep_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT,
    phone TEXT,
    email TEXT,
    location TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS supplements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dose TEXT,
    times TEXT DEFAULT '[]',
    with_meal INTEGER DEFAULT 0,
    notes TEXT,
    color TEXT DEFAULT 'amber',
    split TEXT,
    warning TEXT,
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

`);

// Seed profile from env if not already present
const defaultCondition = process.env.PATIENT_CONDITION || 'Not specified';
const defaultMeds      = process.env.PATIENT_MEDICATIONS|| 'Not specified';
db.prepare(`INSERT OR IGNORE INTO mirla_profile (id, condition, current_medications) VALUES (1, ?, ?)`)
  .run(defaultCondition, defaultMeds);

console.log('✅ Database ready:', DB_PATH);
module.exports = db;
