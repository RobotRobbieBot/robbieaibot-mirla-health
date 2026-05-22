const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const MIRLA_CONTEXT = `Patient: Mirla, Systemic Sclerosis (Diffuse SSc)
Baseline Labs: IL-6=45 pg/mL (HIGH, ref <7), TGF-β=22.5 ng/mL (ELEVATED), mRSS=28 (severe), FVC=68% (reduced)
Current Medications: MMF 3g/day, Nifedipine 30mg, Sildenafil 20mg TID, Omeprazole 40mg
Molecular Signature: IL-6 HIGH, TGF-β ELEVATED, A20 potentially low
Key Pathways: IL-6/JAK-STAT, TGF-β/SMAD, NF-κB/A20`;

function getClient() {
  if (!process.env.CLAUDE_API_KEY || process.env.CLAUDE_API_KEY === 'your_claude_api_key_here') {
    return null;
  }
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

async function analyzeDrugForMirla(drugName, drugMechanism, researchSummary) {
  const client = getClient();
  if (!client) {
    return {
      mechanism_match: 75, evidence_score: 70, safety_score: 75,
      trial_score: 50, final_score: 72,
      reasoning: `Claude API key not configured. ${drugName} baseline analysis: targets relevant SSc pathways.`,
      key_benefits: ['Pathway relevance to SSc'], risks: ['Consult physician'],
      recommendation: 'Configure CLAUDE_API_KEY for detailed AI analysis',
      monitoring_needed: ['CBC', 'CMP', 'IL-6 levels']
    };
  }
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2000,
      system: `You are a specialized rheumatology AI analyzing SSc treatment options. Return JSON with: mechanism_match (0-100), evidence_score (0-100), safety_score (0-100), trial_score (0-100), final_score (0-100), reasoning (string), key_benefits (array), risks (array), recommendation (string), monitoring_needed (array).`,
      messages: [{ role: 'user', content: `Analyze ${drugName} for:\n${MIRLA_CONTEXT}\n\nMechanism: ${drugMechanism}\nResearch: ${researchSummary}\n\nReturn JSON only.` }]
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
      system: `Extract lab values from medical text. Return JSON: {date, il6, tgf_beta, a20, potassium, creatinine, wbc, mrss, fvc, hemoglobin, platelets, alt, ast, notes}. Use null for missing. Date format YYYY-MM-DD.`,
      messages: [{ role: 'user', content: `Extract labs:\n${text.substring(0, 4000)}` }]
    });
    const match = response.content[0].text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

async function generateWeeklyReport(data) {
  const client = getClient();
  if (!client) {
    return `Weekly Health Summary for Mirla\n\nLabs this week: ${data.labs.length} entries\nTop recommendations: ${data.drugs.slice(0,3).map(d=>d.drug_name).join(', ')}\nPersonal notes: ${data.notes.length} entries\n\n[Configure CLAUDE_API_KEY for AI-generated summaries]`;
  }
  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2500,
      system: `Generate a professional weekly health summary for Robbie, care coordinator for Mirla (SSc patient). Be clinical yet compassionate.`,
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

module.exports = { analyzeDrugForMirla, extractLabsFromText, generateWeeklyReport, analyzeInteractions };
