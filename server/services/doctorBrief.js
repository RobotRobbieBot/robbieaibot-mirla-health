const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
require('dotenv').config();

const MIRLA_PROFILE = `
Patient: Mirla C Campion | DOB: 8/15/1981
Conditions: Systemic Sclerosis (Diffuse SSc), Fibromyalgia, Hashimoto's Thyroiditis, Raynaud's Phenomenon, Chronic Migraines, SSc-ILD
Current medications: MMF 3g/day, Nifedipine 30mg, Omeprazole 40mg, Levothyroxine, Topiramate, Phentermine, Nintedanib
Recent labs: Creatinine 0.76, eGFR 99, ALT 19, AST 16, Glucose 125, Lipase 21 (resolved from 176)
Baseline: IL-6=45 (HIGH), TGF-β=22.5 (ELEVATED), mRSS=28 (severe), FVC=68% (reduced)
`;

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
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  console.log(`📋 Generating doctor brief for: ${drugName}`);

  // Search for evidence in parallel
  const [sscData, fibroData, trials] = await Promise.all([
    searchPubMedForDrug(drugName, 'systemic sclerosis scleroderma'),
    searchPubMedForDrug(drugName, 'fibromyalgia autoimmune chronic pain'),
    searchClinicalTrials(drugName, 'systemic sclerosis OR fibromyalgia'),
  ]);

  const allPapers = [...sscData.papers, ...fibroData.papers]
    .filter((p, i, arr) => arr.findIndex(x => x.pmid === p.pmid) === i) // deduplicate
    .slice(0, 6);

  const researchText = [sscData.abstracts, fibroData.abstracts]
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
    system: `You are helping Mirla (and her care coordinator Robbie) prepare a clear, professional one-page brief to bring to a doctor's appointment. The goal is to help her have an informed, confident conversation about a specific treatment option.

Write with warmth but professional clarity. Use plain English throughout — no jargon. Structure it so a busy doctor can scan it in 60 seconds and understand immediately why this is relevant to this patient.

The tone should feel like an informed patient advocate, not a demanding patient. We want the doctor to be a partner, not to feel challenged.`,

    messages: [{
      role: 'user',
      content: `Please create a Doctor Brief document for Mirla to bring to her appointment about: **${drugName}**

${context ? `Additional context: ${context}\n` : ''}

PATIENT PROFILE:
${MIRLA_PROFILE}

RESEARCH FOUND ON PUBMED:
${researchText || 'Limited specific research found — use your clinical knowledge'}

OPEN CLINICAL TRIALS:
${trialsText || 'None currently recruiting'}

CITED PAPERS:
${papersText || 'See PubMed search'}

Please write the Doctor Brief in this exact structure:

---
# Doctor Brief: ${drugName}
**Prepared for:** Mirla C Campion | **Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Prepared by:** Mirla's Care Team (Dr. Robbie)

## Why I'm Asking About This
[2-3 sentences — plain English explanation of what this treatment is and why it's relevant to Mirla's specific conditions. Warm, not demanding.]

## How It May Help My Conditions
[Bullet points connecting this treatment to her specific diagnoses — SSc, fibromyalgia, Hashimoto's, Raynaud's, migraines, as relevant. Be specific.]

## What the Research Shows
[2-4 bullet points summarising the key evidence — include any study findings, trial data. Be honest about the strength of evidence.]

## The Question I'd Like to Discuss
[The single most important question Mirla should ask — simple, open, inviting collaboration]

## What I'd Like You to Know
[1-2 sentences — any safety considerations, interactions with her current meds to check, or monitoring needed. Honest and practical.]

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
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  console.log(`🔬 Generating test brief for: ${testName}`);

  const { abstracts, papers } = await searchPubMedForDrug(testName, 'systemic sclerosis fibromyalgia autoimmune');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2000,
    system: `You are helping Mirla prepare a clear, educational brief to request a specific medical test. The goal is to:
1. Teach Mirla what this test actually is and why it matters for HER body and conditions
2. Give her the confidence and words to ask her doctor for it
3. Help her understand what the results will mean

Write warmly, like a knowledgeable friend explaining things clearly. No jargon. Use plain English throughout. Make her feel empowered, not anxious.`,

    messages: [{
      role: 'user',
      content: `Create a Test Request Brief for Mirla about: **${testName}**
${reason ? `Reason she wants it: ${reason}` : ''}

PATIENT PROFILE:
${MIRLA_PROFILE}

SUPPORTING RESEARCH:
${abstracts || 'Use your clinical knowledge'}

Write this brief in this EXACT structure:

---
# Test Request Brief: ${testName}
**Patient:** Mirla C Campion | **Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

## 🔬 What Is This Test?
[Plain English — what does this test measure? What does the lab actually do? 2-3 sentences max. Explain it like you're talking to a smart friend who's never heard of it.]

## 🧬 Why This Matters for Mirla Specifically
[Connect this test directly to her conditions — SSc, fibromyalgia, Hashimoto's, Raynaud's, migraines as relevant. Be specific about which of her conditions this monitors or affects. 3-5 bullet points.]

## 📚 What the Research Says
[Why do doctors order this test for people with her conditions? What has research shown about its importance? 2-4 bullet points. Honest about evidence strength.]

## 📊 Understanding the Results
**If results are normal:** [what that means for Mirla in plain English]
**If results are abnormal:** [what that might mean, what could be done — keep it calm and informative, not scary]
**How often:** [how frequently this should typically be monitored for someone with her conditions]

## 💬 How to Ask Your Doctor
*Say exactly this:*
"[Give Mirla a warm, confident, specific sentence she can say word-for-word to request this test — something natural that opens a conversation rather than demanding]"

## 🔗 How This Connects to Her Other Tests
[Brief note on how this test fits with her other monitoring — e.g. "This works alongside your FVC to give a complete picture of your lung health"]

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
