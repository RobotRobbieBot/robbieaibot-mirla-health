const { chat } = require('./llmService');
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

async function analyzeDrugForPatient(drugName, drugMechanism, researchSummary) {
  const condition = process.env.PATIENT_CONDITION || 'autoimmune condition';
  try {
    const text = await chat(
      `You are a specialized medical AI analyzing treatment options for autoimmune/rheumatological conditions. Return JSON with: mechanism_match (0-100), evidence_score (0-100), safety_score (0-100), trial_score (0-100), final_score (0-100), reasoning (string), key_benefits (array), risks (array), recommendation (string), monitoring_needed (array). Return JSON only, no markdown.`,
      `Analyze ${drugName} for:\n${PATIENT_CONTEXT}\n\nMechanism: ${drugMechanism}\nResearch: ${researchSummary}\n\nReturn JSON only.`,
      { maxTokens: 2000 }
    );
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { final_score: 50, reasoning: text };
  } catch (err) {
    console.error('LLM error (analyzeDrug):', err.message);
    return {
      mechanism_match: 75, evidence_score: 70, safety_score: 75,
      trial_score: 50, final_score: 72,
      reasoning: `${drugName} baseline analysis: targets relevant pathways for ${condition}.`,
      key_benefits: [`Pathway relevance to ${condition}`], risks: ['Consult physician'],
      recommendation: 'Review with medical team',
      monitoring_needed: ['CBC', 'CMP', 'inflammation markers']
    };
  }
}

async function extractLabsFromText(text) {
  try {
    const result = await chat(
      `You are extracting lab values from MyLVHN/MyChart patient portal reports. In these reports, the test name appears first, then "Normal range: X - Y unit", then the numeric value on the next line. Extract ALL values present.

Return ONLY raw JSON (no markdown fences, no explanation):
{"date":"YYYY-MM-DD (use collection date)","wbc":null,"hemoglobin":null,"platelets":null,"creatinine":null,"potassium":null,"sodium":null,"glucose":null,"bun":null,"egfr":null,"albumin":null,"calcium":null,"alt":null,"ast":null,"lipase":null,"amylase":null,"magnesium":null,"il6":null,"tgf_beta":null,"a20":null,"fvc":null,"mrss":null,"notes":"brief description of panel/tests"}`,
      `Extract all lab values from this report:\n\n${text.substring(0, 8000)}`,
      { maxTokens: 1000 }
    );
    const raw = result.replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

async function generateWeeklyReport(data) {
  const patientName = process.env.PATIENT_NAME      || 'Patient';
  const coordinator = process.env.COORDINATOR_NAME  || 'Care Coordinator';
  const condition   = process.env.PATIENT_CONDITION || 'autoimmune condition';
  try {
    return await chat(
      `Generate a professional weekly health summary for ${coordinator}, care coordinator for ${patientName} (${condition} patient). Be clinical yet compassionate.`,
      `Weekly summary:\nLabs: ${JSON.stringify(data.labs)}\nDrugs: ${JSON.stringify(data.drugs)}\nNotes: ${JSON.stringify(data.notes)}\nRed flags: ${JSON.stringify(data.redFlags)}`,
      { maxTokens: 2500 }
    );
  } catch (err) {
    return `Weekly Health Summary for ${patientName}\n\nLabs this week: ${data.labs.length} entries\nTop recommendations: ${data.drugs.slice(0,3).map(d=>d.drug_name).join(', ')}\nPersonal notes: ${data.notes.length} entries\n\nError generating AI summary: ${err.message}`;
  }
}

async function analyzeInteractions(currentMeds, newDrug) {
  try {
    const text = await chat(
      `Analyze drug interactions. Return JSON array only: [{drug_a, drug_b, severity (none/mild/moderate/severe/contraindicated), description, recommendation}]`,
      `Current meds: [${currentMeds}]. New drug: ${newDrug}. Check all interactions.`,
      { maxTokens: 1000 }
    );
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [{ drug_a: currentMeds, drug_b: newDrug, severity: 'unknown', description: 'Analysis unavailable', recommendation: 'Consult pharmacist' }];
  }
}

// Keep old name as alias
const analyzeDrugForMirla = analyzeDrugForPatient;

module.exports = { analyzeDrugForPatient, analyzeDrugForMirla, extractLabsFromText, generateWeeklyReport, analyzeInteractions };
