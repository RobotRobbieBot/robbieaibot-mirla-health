const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

function getPatientContext() {
  const name       = process.env.PATIENT_NAME        || 'Patient';
  const condition  = process.env.PATIENT_CONDITION   || 'autoimmune condition';
  const meds       = process.env.PATIENT_MEDICATIONS || 'see medication list';
  return `Patient: ${name}, ${condition}
Current Medications: ${meds}
Key Focus: autoimmune pathways, inflammation markers, medication safety`;
}

const PATIENT_CONTEXT = getPatientContext();

function getClient() {
  if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here') {
    return null;
  }
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

async function analyzeDrugForPatient(drugName, drugMechanism, researchSummary) {
  const client = getClient();
  const condition = process.env.PATIENT_CONDITION || 'autoimmune condition';
  if (!client) {
    return {
      mechanism_match: 75, evidence_score: 70, safety_score: 75,
      trial_score: 50, final_score: 72,
      reasoning: `Claude API key not configured. ${drugName} baseline analysis: targets relevant pathways.`,
      key_benefits: [`Pathway relevance to ${condition}`], risks: ['Consult physician'],
      recommendation: 'Configure CLAUDE_API_KEY for detailed AI analysis',
      monitoring_needed: ['CBC', 'CMP', 'inflammation markers']
    };
  }
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: `You are a specialized medical AI analyzing treatment options for autoimmune/rheumatological conditions. Return JSON with: mechanism_match (0-100), evidence_score (0-100), safety_score (0-100), trial_score (0-100), final_score (0-100), reasoning (string), key_benefits (array), risks (array), recommendation (string), monitoring_needed (array).`,
      messages: [{ role: 'user', content: `Analyze ${drugName} for:\n${PATIENT_CONTEXT}\n\nMechanism: ${drugMechanism}\nResearch: ${researchSummary}\n\nReturn JSON only.` }]
    });
    const text = response.content[0].text;
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { final_score: 50, reasoning: text };
  } catch (err) {
    console.error('Claude API error:', err.message);
    return { final_score: 50, reasoning: `Analysis error: ${err.message}` };
  }
}

async function extractLabsFromText(text) {
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1000,
      system: `You are extracting lab values from MyLVHN/MyChart patient portal reports. In these reports, the test name appears first, then "Normal range: X - Y unit", then the numeric value on the next line. Extract ALL values present.

Return ONLY raw JSON (no markdown fences, no explanation):
{"date":"YYYY-MM-DD (use collection date)","wbc":null,"hemoglobin":null,"platelets":null,"creatinine":null,"potassium":null,"sodium":null,"glucose":null,"bun":null,"egfr":null,"albumin":null,"calcium":null,"alt":null,"ast":null,"lipase":null,"amylase":null,"magnesium":null,"il6":null,"tgf_beta":null,"a20":null,"fvc":null,"mrss":null,"notes":"brief description of panel/tests"}`,
      messages: [{ role: 'user', content: `Extract all lab values from this report:\n\n${text.substring(0, 8000)}` }]
    });
    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

async function generateWeeklyReport(data) {
  const client      = getClient();
  const patientName = process.env.PATIENT_NAME     || 'Patient';
  const coordinator = process.env.COORDINATOR_NAME || 'Care Coordinator';
  const condition   = process.env.PATIENT_CONDITION|| 'autoimmune condition';
  if (!client) {
    return `Weekly Health Summary for ${patientName}\n\nLabs this week: ${data.labs.length} entries\nTop recommendations: ${data.drugs.slice(0,3).map(d=>d.drug_name).join(', ')}\nPersonal notes: ${data.notes.length} entries\n\n[Configure CLAUDE_API_KEY for AI-generated summaries]`;
  }
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2500,
      system: `Generate a professional weekly health summary for ${coordinator}, care coordinator for ${patientName} (${condition} patient). Be clinical yet compassionate.`,
      messages: [{ role: 'user', content: `Weekly summary:\nLabs: ${JSON.stringify(data.labs)}\nDrugs: ${JSON.stringify(data.drugs)}\nNotes: ${JSON.stringify(data.notes)}\nRed flags: ${JSON.stringify(data.redFlags)}` }]
    });
    return response.content[0].text;
  } catch (err) { return `Report generation error: ${err.message}`; }
}

async function analyzeInteractions(currentMeds, newDrug) {
  const client = getClient();
  if (!client) {
    return [{ drug_a: currentMeds, drug_b: newDrug, severity: 'unknown', description: 'Configure CLAUDE_API_KEY for interaction analysis', recommendation: 'Consult pharmacist' }];
  }
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1000,
      system: `Analyze drug interactions. Return JSON array: [{drug_a, drug_b, severity (none/mild/moderate/severe/contraindicated), description, recommendation}]`,
      messages: [{ role: 'user', content: `Current meds: [${currentMeds}]. New drug: ${newDrug}. Check all interactions.` }]
    });
    const text = response.content[0].text;
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch { return []; }
}

// Keep old name as alias so nothing breaks if any old code still calls it
const analyzeDrugForMirla = analyzeDrugForPatient;

module.exports = { analyzeDrugForPatient, analyzeDrugForMirla, extractLabsFromText, generateWeeklyReport, analyzeInteractions };
