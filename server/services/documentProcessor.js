const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function getPatientConditions() {
  const raw = process.env.PATIENT_CONDITIONS || process.env.PATIENT_CONDITION || 'autoimmune condition';
  return raw.split(',').map(c => c.trim()).filter(Boolean);
}

function getPatientMeds() {
  const raw = process.env.PATIENT_MEDICATIONS || '';
  return raw.split(',').map(m => m.trim().split(/\s+/)[0]).filter(Boolean); // first word (drug name only)
}

function getClient() {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

// ── Extract text from file ─────────────────────────────────────────────────
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  // Images — use Claude Vision
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].includes(ext)) {
    return { text: null, useVision: true, filePath };
  }

  // PDF
  if (ext === '.pdf') {
    try {
      const text = execSync(`pdftotext "${filePath}" -`, { encoding: 'utf-8', maxBuffer: 15 * 1024 * 1024 });
      if (text.trim().length > 30) return { text, useVision: false };
      // Scanned PDF with no text layer — fall back to vision
      return { text: null, useVision: true, filePath };
    } catch { return { text: null, useVision: true, filePath }; }
  }

  // Plain text / CSV
  if (['.txt', '.csv', '.text'].includes(ext)) {
    try { return { text: fs.readFileSync(filePath, 'utf-8'), useVision: false }; }
    catch { return { text: '', useVision: false }; }
  }

  return { text: `File: ${originalName}`, useVision: false };
}

// ── Process one document ───────────────────────────────────────────────────
async function processDocument(filePath, originalName) {
  const client = getClient();
  const { text, useVision } = await extractText(filePath, originalName);

  const patientName  = process.env.PATIENT_FULL_NAME || process.env.PATIENT_NAME || 'Patient';
  const dob          = process.env.PATIENT_DOB        || 'on file';
  const coordinator  = process.env.COORDINATOR_NAME   || 'Care Coordinator';
  const conditions   = getPatientConditions();
  const meds         = getPatientMeds();

  const systemPrompt = `You are a warm, caring medical document analyst working for ${coordinator} — ${patientName}'s devoted care coordinator. You speak with Irish warmth and genuine heart.

Patient: ${patientName} | DOB: ${dob}
Known conditions: ${conditions.join(', ')}
Current medications: ${meds.join(', ')}

Analyse this medical document and return ONLY a raw JSON object (no markdown fences):
{
  "doc_type": one of: "lab_report" | "clinical_note" | "imaging_report" | "discharge_summary" | "specialist_letter" | "medication_record" | "pathology_report" | "operative_note" | "referral" | "other",
  "doc_date": "YYYY-MM-DD or null",
  "provider": "doctor or facility name or null",
  "specialty": "e.g. Rheumatology, Radiology, Primary Care or null",
  "summary": "2-3 plain English sentences — what this document says and why it matters for the patient",
  "key_facts": {
    "diagnoses": ["any new or confirmed diagnoses"],
    "procedures": ["any procedures performed"],
    "medications": ["medications mentioned, started, stopped, or changed"],
    "findings": ["key clinical findings, abnormalities, or notable normals"],
    "recommendations": ["doctor recommendations or follow-up plans"],
    "timeline_event": {
      "title": "short title for the timeline (e.g. 'SSc Diagnosis' or 'ER Visit — Pancreatitis')",
      "description": "one plain English sentence",
      "event_type": "diagnosis | procedure | hospitalisation | medication_change | test_result | referral | other",
      "severity": "routine | notable | urgent | critical"
    }
  },
  "connections_to_watch": ["brief notes on anything that connects to her known conditions or medications — e.g. 'Lipase elevation may relate to Nintedanib'"]
}`;

  let content;
  if (useVision) {
    // Convert PDF page to image first if needed, or send image directly
    const ext = path.extname(originalName).toLowerCase();
    let imageData, mediaType;

    if (ext === '.pdf') {
      // Convert first 3 pages of PDF to images using pdftoppm
      try {
        const outDir = path.join(path.dirname(filePath), 'tmp_' + path.basename(filePath, '.pdf'));
        fs.mkdirSync(outDir, { recursive: true });
        execSync(`pdftoppm -r 150 -l 3 "${filePath}" "${outDir}/page"`);
        const pages = fs.readdirSync(outDir).filter(f => f.endsWith('.ppm') || f.endsWith('.png') || f.endsWith('.jpg'));
        if (pages.length > 0) {
          // Convert ppm to jpeg
          const ppmPath = path.join(outDir, pages[0]);
          const jpgPath = ppmPath.replace(/\.\w+$/, '.jpg');
          execSync(`convert "${ppmPath}" "${jpgPath}" 2>/dev/null || cp "${ppmPath}" "${jpgPath}"`);
          imageData = fs.readFileSync(jpgPath).toString('base64');
          mediaType = 'image/jpeg';
          fs.rmSync(outDir, { recursive: true, force: true });
        }
      } catch(e) { console.error('PDF→image error:', e.message); }
    } else {
      imageData = fs.readFileSync(filePath).toString('base64');
      const extMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
      mediaType = extMap[ext] || 'image/jpeg';
    }

    if (!imageData) return null;

    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageData } },
      { type: 'text', text: 'Please read and analyse this medical document.' }
    ];
  } else {
    content = [{ type: 'text', text: `Analyse this medical document:\n\n${text.substring(0, 12000)}` }];
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const result = JSON.parse(match[0]);
    result.extracted_text = text || '[Vision processed]';
    return result;
  } catch (e) {
    console.error('Document processing error:', e.message);
    return null;
  }
}

// ── Find connections across documents ─────────────────────────────────────
async function findConnections(db) {
  const client = getClient();
  const docs = db.prepare(
    `SELECT id, doc_type, doc_date, provider, summary, key_facts FROM medical_documents ORDER BY doc_date ASC LIMIT 50`
  ).all();

  if (docs.length < 2) return [];

  const docSummaries = docs.map(d => {
    const facts = JSON.parse(d.key_facts || '{}');
    return `[Doc #${d.id} | ${d.doc_type} | ${d.doc_date || 'unknown date'} | ${d.provider || 'unknown provider'}]\n${d.summary}\nKey: ${JSON.stringify(facts.findings || []).slice(0, 200)}`;
  }).join('\n\n---\n\n');

  try {
    const conditions  = getPatientConditions();
    const meds        = getPatientMeds();
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: `You are analysing the patient's complete medical history to find meaningful connections.
Patient conditions: ${conditions.join(', ')}.
Current meds: ${meds.join(', ')}.

Return ONLY a raw JSON array of connections found:
[{
  "doc_a_id": number,
  "doc_b_id": number,
  "connection_type": "temporal" | "causal" | "pattern" | "medication_effect" | "condition_overlap" | "progression",
  "description": "plain English explanation of the connection and why it matters",
  "confidence": "high" | "medium" | "low"
}]

Focus on:
- Medication changes followed by lab changes
- Symptoms that match across conditions
- Patterns over time (worsening/improving)
- Side effects visible in labs
- Connections between her different conditions`,
      messages: [{ role: 'user', content: `Find connections in the patient's medical documents:\n\n${docSummaries}` }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch (e) {
    console.error('Connection finding error:', e.message);
    return [];
  }
}

// ── Update patient profile ─────────────────────────────────────────────────
async function updatePatientProfile(db) {
  const client = getClient();
  const docs = db.prepare(
    `SELECT key_facts FROM medical_documents ORDER BY doc_date ASC`
  ).all();

  const allFacts = docs.map(d => JSON.parse(d.key_facts || '{}')).filter(f => f.diagnoses || f.procedures || f.findings);

  if (allFacts.length === 0) return;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: `Build a comprehensive patient profile from medical documents. Return ONLY raw JSON:
{
  "diagnoses": ["all confirmed diagnoses with approximate dates if known"],
  "procedures": ["all procedures and surgeries"],
  "allergies": ["any allergies or adverse reactions"],
  "key_findings": ["most important clinical findings across all documents"],
  "condition_timeline": ["chronological list of major health events — plain English"]
}`,
      messages: [{ role: 'user', content: `Build profile from these facts:\n${JSON.stringify(allFacts).substring(0, 8000)}` }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return;
    const profile = JSON.parse(match[0]);

    db.prepare(`UPDATE patient_profile SET diagnoses=?, procedures=?, allergies=?, key_findings=?, condition_timeline=?, updated_at=CURRENT_TIMESTAMP WHERE id=1`)
      .run(JSON.stringify(profile.diagnoses), JSON.stringify(profile.procedures), JSON.stringify(profile.allergies), JSON.stringify(profile.key_findings), JSON.stringify(profile.condition_timeline));
  } catch (e) {
    console.error('Profile update error:', e.message);
  }
}

module.exports = { processDocument, findConnections, updatePatientProfile };
