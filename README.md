# 💛 Patient Health Intelligence Hub

A personal medical intelligence system built with love — designed to help care coordinators and patients with complex chronic illnesses track everything in one place and harness AI to understand lab results, research treatment options, and prepare for doctor appointments.

---

## What It Does

This app is a full-featured health hub built for patients with complex chronic conditions. Everything runs locally on your own computer — your medical data never leaves your machine.

### Personal Tracking
- **Appointments** — Log upcoming and past appointments with notes and prep reminders
- **Care Team / Doctors** — Store your doctors' contact details, specialties, and notes in one place
- **Gentle Movement / Exercises** — Track exercises and movement routines tailored to your body
- **Supplements** — Log daily supplements with dosing schedules; check them off each day
- **Personal Notes / Journal** — A private daily journal for how you're feeling — physical, emotional, spiritual

### AI Medical Intelligence
- **🧠 AI Medical Agent** — Upload your lab PDFs and get a full AI-generated report: what the results mean, trends over time, treatment options (conventional, integrative, and emerging), recommended tests to ask for, and questions for your next appointment. Powered by Claude + live PubMed research + ClinicalTrials.gov
- **📁 Medical History Timeline** — Upload any medical document (lab reports, clinical notes, imaging reports, letters) and the AI reads it, categorises it, extracts key facts, and builds a timeline of your health journey
- **📈 Lab Trends** — Track your lab values over time with visual trend charts
- **⬆️ Upload Labs** — Upload PDF lab reports and the AI extracts all the values automatically
- **💊 AI Drug Ranker** — Enter a drug name and get an AI-scored analysis of how well it fits your specific conditions and medications
- **🔬 Evidence Synthesiser** — Search PubMed in plain English and get AI-synthesised summaries of what the research actually says
- **🧪 Trial Matcher** — Search ClinicalTrials.gov for recruiting studies relevant to your conditions
- **⚠️ Interaction Checker** — Check for potential drug interactions with your current medications
- **📋 Doctor Briefs** — Generate a professional one-page brief to bring to your doctor when you want to discuss a specific treatment or request a test. Evidence-backed, warm in tone, designed to make the conversation a collaboration

### Weekly Summaries
- Optional automatic weekly email summary of your health data (requires Gmail app password configuration)

---

## Setting It Up for a New Patient

Everything patient-specific lives in the `.env` file. To set up for a different patient, copy the project folder and edit `.env`:

```env
# Who is this app for?
PATIENT_NAME=Jane                          # First name (shown in the UI)
PATIENT_FULL_NAME=Jane Smith               # Full name (used in doctor briefs)
PATIENT_DOB=3/22/1975                      # Date of birth
PATIENT_MRN=123456789                      # Medical record number (optional)
COORDINATOR_NAME=Sarah                     # Name of the care coordinator

# Medical profile
PATIENT_CONDITION=Lupus (SLE)             # Primary condition (used for research searches)
PATIENT_CONDITIONS=Lupus (SLE), Raynaud's Phenomenon, Sjögren's Syndrome
PATIENT_MEDICATIONS=Hydroxychloroquine 200mg, Prednisone 5mg, Methotrexate 15mg/week

# Care team
PATIENT_PCP=Dr. Jane Doe

# Optional — the AI will add warm faith context if this is set. Leave blank to omit.
PATIENT_FAITH=

# React (build-time — must match PATIENT_NAME above)
REACT_APP_PATIENT_NAME=Jane
REACT_APP_COORDINATOR_NAME=Sarah
```

**After editing `.env`**, restart the app:
```bash
./start.sh
```

The AI will automatically use the new patient's name, conditions, and medications in all reports, doctor briefs, and analysis prompts.

---

## Running the App

### First time setup
```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Configure your API keys in .env
# (CLAUDE_API_KEY is required for AI features)

# Start everything
./start.sh
```

### Starting normally
```bash
./start.sh
```
This starts the API server (port 3001), the React app (port 3000), and opens your browser.

### Starting as a background service (auto-starts on boot)
The app is set up as a systemd service. To start/stop/check status:
```bash
systemctl --user start mirla.service
systemctl --user stop mirla.service
systemctl --user status mirla.service
```

### Remote access (iPhone / other network)
A Cloudflare Tunnel is started automatically. Check the public URL:
```bash
mirla-url
```
Open that URL on your iPhone or any device — no port forwarding needed.

---

## What's Required

- **Node.js** 18+
- **pdftotext** (`sudo apt install poppler-utils`) — for reading PDF lab reports
- **Claude API key** — get one at [console.anthropic.com](https://console.anthropic.com)
- **cloudflared** binary (already installed at `~/cloudflared`) — for remote access

---

## Architecture

```
mirla-health/
├── server/               API server (Express + SQLite)
│   ├── index.js          Entry point, route registration
│   ├── database.js       SQLite schema + connection
│   ├── routes/           REST API endpoints
│   │   ├── analysis.js   AI analysis endpoints
│   │   ├── upload.js     Lab PDF upload + extraction
│   │   ├── appointments.js
│   │   ├── doctors.js
│   │   ├── exercises.js
│   │   ├── supplements.js
│   │   └── history.js    Medical document history
│   └── services/         AI + data services
│       ├── analysisAgent.js    Full lab analysis (Claude + PubMed + Trials)
│       ├── claudeService.js    Drug analysis, weekly reports, lab extraction
│       ├── doctorBrief.js      Doctor brief + test brief generation
│       ├── documentProcessor.js  Medical document AI reading
│       ├── emailService.js     Weekly email summaries
│       └── scheduler.js        Weekly email scheduler
├── src/                  React frontend
│   ├── App.jsx           Main app shell + navigation
│   └── components/       Individual tab components
├── uploads/              Uploaded lab PDFs (gitignored)
├── *.db                  SQLite database (gitignored)
├── .env                  ← EDIT THIS for each patient instance
├── start.sh              Manual start script
└── start-service.sh      Systemd service start script
```

---

## Data Privacy

- All data is stored in a local SQLite database (`*.db` file) on this machine
- Uploaded PDFs are stored locally in `uploads/`
- The only external service used is the Claude AI API (Anthropic) — lab data is sent to Claude for analysis
- Nothing is stored in the cloud or synced anywhere
- The database file is gitignored and will never be committed to version control

---

## Setting Up a Second Instance

To run this for a second patient on the same computer:

1. Copy the entire project folder: `cp -r mirla-health second-patient-health`
2. Edit `second-patient-health/.env` with the new patient's details
3. **Change the port and database path** in `.env`:
   ```env
   PORT=3002
   DATABASE_PATH=./second_patient.db
   ```
4. Update `start.sh` and `start-service.sh` to use different ports:
   ```bash
   PORT=3000   # React — change to 3002 for second instance
   ```
   Actually use a different React port too: `PORT=3003 npm start`
5. Create a separate systemd service file if you want it to auto-start

---

*Built with heart for people navigating complex chronic illness. 💛*
