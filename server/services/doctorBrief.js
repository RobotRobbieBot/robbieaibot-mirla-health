const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
require('dotenv').config();

function buildPatientProfile() {
  const fullName   = process.env.PATIENT_FULL_NAME   || process.env.PATIENT_NAME || 'Patient';
  const dob        = process.env.PATIENT_DOB          || 'on file';
  const conditions = process.env.PATIENT_CONDITIONS   || process.env.PATIENT_CONDITION || 'autoimmune condition';
  const meds       = process.env.PATIENT_MEDICATIONS  || 'see medication list';
  return `Patient: ${fullName} | DOB: ${dob}
Conditions: ${conditions}
Current medications: ${meds}`;
}

const PATIENT_PROFILE = buildPatientProfile();

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MirlaHealthApp/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', () => resolve(null));
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MirlaHealthApp/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

async function searchPubMedForDrug(drugName, condition, maxResults = 5) {
  try {
    const query = `${drugName} ${condition} treatment clinical trial`;
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchData = await fetchJSON(searchUrl);
    const ids = searchData?.esearchresult?.idlist;
    if (!ids || ids.length === 0) return { abstracts: '', papers: [] };

    // Fetch summaries (lighter than full abstracts)
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryData = await fetchJSON(summaryUrl);

    const papers = ids.map(id => {
      const article = summaryData?.result?.[id];
      if (!article) return null;
      return {
        pmid: id,
        title: article.title || '',
        authors: article.authors?.slice(0, 3).map(a => a.name).join(', ') || '',
        journal: article.source || '',
        year: article.pubdate?.split(' ')?.[0] || '',
        doi: article.elocationid?.replace('doi: ', '') || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    }).filter(Boolean);

    const abstracts = await fetchText(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=text`
    );

    return { abstracts: abstracts.substring(0, 4000), papers };
  } catch (e) {
    console.error('PubMed search error:', e.message);
    return { abstracts: '', papers: [] };
  }
}

async function searchClinicalTrials(drugName, condition) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(drugName)}&query.cond=${encodeURIComponent(condition)}&filter.overallStatus=RECRUITING&pageSize=3&format=json`;
    const data = await fetchJSON(url);
    if (!data?.studies) return [];
    return data.studies.map(s => ({
      nctId: s.protocolSection?.identificationModule?.nctId,
      title: s.protocolSection?.identificationModule?.briefTitle,
      phase: s.protocolSection?.designModule?.phases?.join(', '),
      status: s.protocolSection?.statusModule?.overallStatus,
      url: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`
    })).filter(t => t.nctId);
  } catch { return []; }
}

async function generateDoctorBrief(drugName, context = '') {
  const client       = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  const patientName  = process.env.PATIENT_NAME      || 'Patient';
  const fullName     = process.env.PATIENT_FULL_NAME || patientName;
  const coordinator  = process.env.COORDINATOR_NAME  || 'Care Team';
  const condition    = process.env.PATIENT_CONDITION || 'autoimmune condition';
  const conditions   = process.env.PATIENT_CONDITIONS|| condition;

  console.log(`📋 Generating doctor brief for: ${drugName}`);

  // Search for evidence in parallel
  const [condData, fibroData, trials] = await Promise.all([
    searchPubMedForDrug(drugName, condition),
    searchPubMedForDrug(drugName, 'fibromyalgia autoimmune chronic pain'),
    searchClinicalTrials(drugName, conditions.split(',').slice(0,2).join(' OR ')),
  ]);

  const allPapers = [...condData.papers, ...fibroData.papers]
    .filter((p, i, arr) => arr.findIndex(x => x.pmid === p.pmid) === i) // deduplicate
    .slice(0, 6);

  const researchText = [condData.abstracts, fibroData.abstracts]
    .filter(Boolean).join('\n\n---\n\n').substring(0, 5000);

  const trialsText = trials.map(t =>
    `• ${t.title} (${t.nctId}) — ${t.status} | ${t.url}`
  ).join('\n');

  const papersText = allPapers.map(p =>
    `• ${p.title} — ${p.authors} (${p.year}, ${p.journal}) | ${p.url}${p.doi ? ` | DOI: ${p.doi}` : ''}`
  ).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2500,
    system: `You are helping ${patientName} (and their care coordinator ${coordinator}) prepare a clear, professional one-page brief to bring to a doctor's appointment. The goal is to help them have an informed, confident conversation about a specific treatment option.

Write with warmth but professional clarity. Use plain English throughout — no jargon. Structure it so a busy doctor can scan it in 60 seconds and understand immediately why this is relevant to this patient.

The tone should feel like an informed patient advocate, not a demanding patient. We want the doctor to be a partner, not to feel challenged.`,

    messages: [{
      role: 'user',
      content: `Please create a Doctor Brief document for ${patientName} to bring to their appointment about: **${drugName}**

${context ? `Additional context: ${context}\n` : ''}

PATIENT PROFILE:
${PATIENT_PROFILE}

RESEARCH FOUND ON PUBMED:
${researchText || 'Limited specific research found — use your clinical knowledge'}

OPEN CLINICAL TRIALS:
${trialsText || 'None currently recruiting'}

CITED PAPERS:
${papersText || 'See PubMed search'}

Please write the Doctor Brief in this exact structure:

---
# Doctor Brief: ${drugName}
**Prepared for:** ${fullName} | **Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Prepared by:** ${patientName}'s Care Team (${coordinator})

## Why I'm Asking About This
[2-3 sentences — plain English explanation of what this treatment is and why it's relevant to ${patientName}'s specific conditions. Warm, not demanding.]

## How It May Help My Conditions
[Bullet points connecting this treatment to their specific diagnoses — ${conditions}. Be specific.]

## What the Research Shows
[2-4 bullet points summarising the key evidence — include any study findings, trial data. Be honest about the strength of evidence.]

## The Question I'd Like to Discuss
[The single most important question ${patientName} should ask — simple, open, inviting collaboration]

## What I'd Like You to Know
[1-2 sentences — any safety considerations, interactions with their current meds to check, or monitoring needed. Honest and practical.]

## References
[List the PubMed papers and trial links]

---
*This brief was prepared to support an informed conversation with my healthcare team. I understand all decisions about my care are made together with my doctors.*
---`
    }]
  });

  return {
    brief: response.content[0].text,
    papers: allPapers,
    trials,
    drug: drugName
  };
}

// ── Test Request Brief ────────────────────────────────────────────────────
async function generateTestBrief(testName, reason = '') {
  const client      = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  const patientName = process.env.PATIENT_NAME      || 'Patient';
  const fullName    = process.env.PATIENT_FULL_NAME || patientName;
  const condition   = process.env.PATIENT_CONDITION || 'autoimmune condition';
  const conditions  = process.env.PATIENT_CONDITIONS|| condition;
  console.log(`🔬 Generating test brief for: ${testName}`);

  const { abstracts, papers } = await searchPubMedForDrug(testName, `${condition} fibromyalgia autoimmune`);

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    system: `You are helping ${patientName} prepare a clear, educational brief to request a specific medical test. The goal is to:
1. Teach ${patientName} what this test actually is and why it matters for THEIR body and conditions
2. Give them the confidence and words to ask their doctor for it
3. Help them understand what the results will mean

Write warmly, like a knowledgeable friend explaining things clearly. No jargon. Use plain English throughout. Make them feel empowered, not anxious.`,

    messages: [{
      role: 'user',
      content: `Create a Test Request Brief for ${patientName} about: **${testName}**
${reason ? `Reason they want it: ${reason}` : ''}

PATIENT PROFILE:
${PATIENT_PROFILE}

SUPPORTING RESEARCH:
${abstracts || 'Use your clinical knowledge'}

Write this brief in this EXACT structure:

---
# Test Request Brief: ${testName}
**Patient:** ${fullName} | **Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

## 🔬 What Is This Test?
[Plain English — what does this test measure? What does the lab actually do? 2-3 sentences max. Explain it like you're talking to a smart friend who's never heard of it.]

## 🧬 Why This Matters for ${patientName} Specifically
[Connect this test directly to their conditions — ${conditions}. Be specific about which of their conditions this monitors or affects. 3-5 bullet points.]

## 📚 What the Research Says
[Why do doctors order this test for people with their conditions? What has research shown about its importance? 2-4 bullet points. Honest about evidence strength.]

## 📊 Understanding the Results
**If results are normal:** [what that means for ${patientName} in plain English]
**If results are abnormal:** [what that might mean, what could be done — keep it calm and informative, not scary]
**How often:** [how frequently this should typically be monitored for someone with their conditions]

## 💬 How to Ask Your Doctor
*Say exactly this:*
"[Give ${patientName} a warm, confident, specific sentence they can say word-for-word to request this test — something natural that opens a conversation rather than demanding]"

## 🔗 How This Connects to Other Tests
[Brief note on how this test fits with their other monitoring]

---
*Learning about your own health is an act of self-love. You deserve to understand every part of what's happening in your body. 💛*
---`
    }]
  });

  return {
    brief: response.content[0].text,
    papers,
    test: testName
  };
}

module.exports = { generateDoctorBrief, generateTestBrief };
