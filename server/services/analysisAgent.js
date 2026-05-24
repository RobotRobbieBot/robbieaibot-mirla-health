const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
require('dotenv').config();

// ─── Patient Context (built from .env) ────────────────────────────────────
function buildPatientProfile() {
  const name       = process.env.PATIENT_FULL_NAME  || process.env.PATIENT_NAME || 'Patient';
  const dob        = process.env.PATIENT_DOB         || 'on file';
  const mrn        = process.env.PATIENT_MRN         || 'on file';
  const pcp        = process.env.PATIENT_PCP         || 'on file';
  const conditions = process.env.PATIENT_CONDITIONS  || process.env.PATIENT_CONDITION || 'autoimmune condition';
  const meds       = process.env.PATIENT_MEDICATIONS || '';
  const faith      = process.env.PATIENT_FAITH        || '';

  const condList  = conditions.split(',').map(c => `- ${c.trim()}`).join('\n');
  const medList   = meds ? meds.split(',').map(m => `- ${m.trim()}`).join('\n') : '- see medication list';
  const faithLine = faith
    ? `\nPERSONAL CONTEXT: ${name} is ${faith} — their faith is a clinically recognised protective factor.`
    : '';

  return `
PATIENT: ${name} | DOB: ${dob} | MRN: ${mrn}
PCP: ${pcp}

PRIMARY CONDITIONS:
${condList}

CURRENT MEDICATIONS:
${medList}${faithLine}
`;
}

const PATIENT_PROFILE = buildPatientProfile();

// ─── Fetch helper ──────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MirlaHealthApp/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MirlaHealthApp/1.0' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ─── PubMed search ─────────────────────────────────────────────────────────
async function searchPubMed(query, maxResults = 4) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchData = await fetchJSON(searchUrl);
    const ids = searchData?.esearchresult?.idlist;
    if (!ids || ids.length === 0) return [];

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=text`;
    const abstracts = await fetchText(fetchUrl);
    return abstracts ? [abstracts.substring(0, 3000)] : [];
  } catch (e) {
    console.error('PubMed error:', e.message);
    return [];
  }
}

// ─── ClinicalTrials.gov search ─────────────────────────────────────────────
async function searchTrials(condition, maxResults = 5) {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&filter.overallStatus=RECRUITING&pageSize=${maxResults}&format=json`;
    const data = await fetchJSON(url);
    if (!data?.studies) return [];
    return data.studies.map(s => ({
      nctId: s.protocolSection?.identificationModule?.nctId,
      title: s.protocolSection?.identificationModule?.briefTitle,
      phase: s.protocolSection?.designModule?.phases?.join(', '),
      sponsor: s.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name,
      location: s.protocolSection?.contactsLocationsModule?.locations?.[0]?.city + ', ' +
                s.protocolSection?.contactsLocationsModule?.locations?.[0]?.state,
      contact: s.protocolSection?.contactsLocationsModule?.centralContacts?.[0]?.name,
      url: `https://clinicaltrials.gov/study/${s.protocolSection?.identificationModule?.nctId}`
    }));
  } catch (e) {
    console.error('Trials error:', e.message);
    return [];
  }
}

// ─── Critical flag detector ────────────────────────────────────────────────
function detectCriticalFlags(labs) {
  const flags = [];
  if (labs.lipase > 300) flags.push({ level: 'CRITICAL', test: 'Lipase', value: labs.lipase, message: `Lipase ${labs.lipase} U/L — severely elevated (normal <82). May indicate acute pancreatitis. Nintedanib and MMF can both cause this. Requires urgent medical review.` });
  else if (labs.lipase > 82) flags.push({ level: 'HIGH', test: 'Lipase', value: labs.lipase, message: `Lipase ${labs.lipase} U/L — elevated above normal. Monitor closely.` });
  if (labs.wbc > 11) flags.push({ level: 'HIGH', test: 'WBC', value: labs.wbc, message: `WBC ${labs.wbc} K/µL — elevated. Could indicate infection, inflammation, or steroid effect. Important in an immunosuppressed patient.` });
  if (labs.wbc < 3) flags.push({ level: 'CRITICAL', test: 'WBC', value: labs.wbc, message: `WBC ${labs.wbc} K/µL — critically low. MMF toxicity or bone marrow suppression possible. Urgent review needed.` });
  if (labs.creatinine > 1.2) flags.push({ level: 'HIGH', test: 'Creatinine', value: labs.creatinine, message: `Creatinine ${labs.creatinine} mg/dL — elevated. SSc renal crisis risk — monitor blood pressure closely.` });
  if (labs.potassium > 5.5) flags.push({ level: 'HIGH', test: 'Potassium', value: labs.potassium, message: `Potassium ${labs.potassium} mmol/L — high. Note: if sample was haemolysed, this may be falsely elevated. Confirm with repeat.` });
  if (labs.potassium < 3.2) flags.push({ level: 'HIGH', test: 'Potassium', value: labs.potassium, message: `Potassium ${labs.potassium} mmol/L — low. Cardiac arrhythmia risk.` });
  if (labs.glucose > 126) flags.push({ level: 'MODERATE', test: 'Glucose', value: labs.glucose, message: `Fasting glucose ${labs.glucose} mg/dL — borderline diabetic range. Corticosteroid use and Phentermine can affect glucose.` });
  if (labs.alt > 56 || labs.ast > 56) flags.push({ level: 'HIGH', test: 'Liver enzymes', value: `ALT ${labs.alt} / AST ${labs.ast}`, message: `Elevated liver enzymes. Nintedanib is known to cause hepatotoxicity. Review liver function trend.` });
  if (labs.magnesium > 2.2) flags.push({ level: 'MODERATE', test: 'Magnesium', value: labs.magnesium, message: `Magnesium ${labs.magnesium} mg/dL — mildly elevated.` });
  if (labs.fvc && labs.fvc < 70) flags.push({ level: 'HIGH', test: 'FVC', value: labs.fvc, message: `FVC ${labs.fvc}% — significantly reduced. SSc-ILD progression. Nintedanib is appropriate. Consider pulmonology review.` });
  if (labs.hemoglobin && labs.hemoglobin < 10) flags.push({ level: 'HIGH', test: 'Haemoglobin', value: labs.hemoglobin, message: `Haemoglobin ${labs.hemoglobin} g/dL — low. Anaemia of chronic disease common in SSc. Check iron studies.` });
  return flags;
}

// ─── Main analysis function ────────────────────────────────────────────────
async function runFullAnalysis(labsArray) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  // Most recent labs
  const latest = labsArray[0] || {};
  const criticalFlags = detectCriticalFlags(latest);

  // Build lab history summary
  const labHistory = labsArray.slice(0, 10).map(l =>
    `${l.date}: WBC=${l.wbc} Hgb=${l.hemoglobin} Plt=${l.platelets} Creat=${l.creatinine} K=${l.potassium} Na=${l.sodium} Glucose=${l.glucose} ALT=${l.alt} AST=${l.ast} Lipase=${l.lipase} Amylase=${l.amylase} Mg=${l.magnesium} eGFR=${l.egfr} Albumin=${l.albumin} FVC=${l.fvc} [${l.notes || ''}]`
  ).join('\n');

  const primaryCondition = process.env.PATIENT_CONDITION || 'systemic sclerosis';
  const conditionSlug    = primaryCondition.toLowerCase().replace(/[()]/g, '').trim();

  console.log('🔬 Searching PubMed...');
  const [condResearch, drugResearch, comorbidResearch, integrativeResearch, ldnResearch] = await Promise.all([
    searchPubMed(`${conditionSlug} treatment 2024 2025`, 3),
    searchPubMed(`${conditionSlug} autoimmune pancreatitis liver enzymes`, 2),
    searchPubMed(`${conditionSlug} fibromyalgia autoimmune comorbidity treatment`, 2),
    searchPubMed(`psilocybin chronic pain neuroinflammation acupuncture ${conditionSlug}`, 3),
    searchPubMed('low dose naltrexone fibromyalgia rheumatic disease', 2),
  ]);

  console.log('🏥 Searching clinical trials...');
  const [condTrials, ildTrials] = await Promise.all([
    searchTrials(primaryCondition, 4),
    searchTrials(`${conditionSlug} interstitial lung disease`, 3),
  ]);

  const researchContext = [
    condResearch.join('\n---\n'),
    drugResearch.join('\n---\n'),
    comorbidResearch.join('\n---\n'),
    integrativeResearch.join('\n---\n'),
    ldnResearch.join('\n---\n'),
  ].filter(Boolean).join('\n\n=====\n\n').substring(0, 7000);

  // Known integrative/holistic research (PubMed verified)
  const patientName = process.env.PATIENT_NAME || 'the patient';
  const faith       = process.env.PATIENT_FAITH || '';
  const faithEvidence = faith
    ? `- FAITH/RELIGIOUS COPING: Positive religious coping significantly associated with better outcomes, treatment adherence, quality of life, and positive affect in chronic pain/illness (PMID 10789001; PMID 23484213, DOI 10.1007/s10943-012-9578-9)\n- SPIRITUALITY NOTE: ${patientName} is ${faith} — their faith is a clinically recognised protective factor. Spiritual care, chaplaincy, and faith community support are evidence-based complementary supports.`
    : '';

  const integrativeEvidence = `
VERIFIED INTEGRATIVE MEDICINE RESEARCH (PubMed):
- PSYCHEDELICS: Psilocybin/ketamine show anti-neuroinflammatory + immunomodulatory effects for chronic neuropathic pain; address central sensitisation in fibromyalgia (PMID 34922987, DOI 10.1016/j.neubiorev.2021.12.005)
- ACUPUNCTURE/RAYNAUD'S: Meta-analysis of 6 RCTs (n=272) — acupuncture increased remission rate (RR 1.21), reduced daily Raynaud's attacks, improved cold provocation tests (PMID 35608095, DOI 10.1177/09645284221076504)
- CURCUMIN/SSc: Curcumin selectively induces apoptosis in scleroderma lung fibroblasts (not normal cells) via PKCε pathway — may have therapeutic value for SSc lung fibrosis (PMID 14742295, DOI 10.1165/rcmb.2003-0354OC). Also activates Nrf2 antioxidant pathway, protecting kidneys (PMID 22919438)
- LOW DOSE NALTREXONE (LDN): Shown to reduce fibromyalgia pain/well-being, relieved pruritus specifically in scleroderma patients, modulates neuroinflammation — safe, cheap, no serious side effects (PMID 37223594, DOI 10.31138/mjr.34.1.1; PMID 32845365, DOI 10.1007/s11916-020-00898-0)
${faithEvidence}
`;

  const trialsText = [...condTrials, ...ildTrials]
    .filter(t => t.nctId)
    .map(t => `• ${t.title} (${t.nctId}) — Phase: ${t.phase || 'N/A'} | ${t.url}`)
    .join('\n');

  const coordinator = process.env.COORDINATOR_NAME || 'Care Coordinator';
  const conditions  = process.env.PATIENT_CONDITIONS || process.env.PATIENT_CONDITION || 'autoimmune condition';
  const faithSection = faith
    ? `7. 🙏 Faith & spirituality — ${patientName} is ${faith}. Their faith is clinically recognised as a protective factor. Speak to this with warmth and respect. Mention how prayer, community, meaning-making, and spiritual support are genuine parts of healing — not separate from medicine`
    : `7. 🌱 Mind-body & wellbeing — mental health, community, meaning-making, and wellbeing practices that support healing`;

  console.log('🤖 Running Claude analysis...');
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    system: `You are a warm, loving medical intelligence assistant — like a trusted Irish family friend who happens to know medicine inside out. You speak with warmth, heart, and the gentle directness of someone who truly cares. You're writing for ${coordinator} (${patientName}'s devoted care coordinator) and for ${patientName} themselves.

Use occasional Irish warmth in your language — things like "God bless them", "the poor dote", "they're doing mighty", "sure look", "grand altogether", "fair play to them" — but keep it natural and never overdone. Always feel like a warm hug alongside honest medical facts.

IMPORTANT RULES:
- Address ${coordinator} by name — they work tirelessly and deserve to feel seen
- Always end with: "⚕️ ${coordinator}, please go over all of this with ${patientName}'s full medical team before making any changes — you're doing a wonderful job looking after them. 💛"
- Flag anything urgent at the top with 🚨
- Never suggest specific drug doses
- When noting treatment options, say "options worth discussing with their doctors include..."
- Be warm, honest, and supportive — ${patientName} reads this too and needs hope alongside truth
- Use sections with clear headings
- Cross-reference all their conditions when relevant
- Be genuinely open to ALL treatment ideas — conventional, integrative, plant medicine, Eastern medicine, spiritual, psychedelic-assisted, energy work, nutrition, mind-body. Do not dismiss anything. Present all options with equal respect. The only filter is safety — flag anything genuinely risky, but never dismiss something just because it is outside mainstream medicine.`,

    messages: [{
      role: 'user',
      content: `Please analyse ${patientName}'s latest lab results and provide a full report.

${PATIENT_PROFILE}

CRITICAL FLAGS DETECTED:
${criticalFlags.length > 0 ? criticalFlags.map(f => `[${f.level}] ${f.message}`).join('\n') : 'None'}

LATEST LAB RESULTS:
${labHistory}

RECENT PUBMED RESEARCH:
${researchContext || 'Search unavailable'}

${integrativeEvidence}

OPEN CLINICAL TRIALS:
${trialsText || 'None found'}

Please provide:
1. 🚨 Urgent flags (if any)
2. 📊 What these lab results mean for ${patientName}
3. 📈 Trends (better/worse/stable compared to before)
4. 💊 Conventional treatment options worth discussing with their doctors (full options, experimental included)
5. 🌿 Integrative & holistic options — include: acupuncture, curcumin/turmeric, Low Dose Naltrexone (real evidence for autoimmune/fibromyalgia), omega-3s, N-acetylcysteine, magnesium, plant/herbal approaches with evidence
6. 🍄 Psychedelics & emerging therapies — psilocybin/ketamine for central sensitisation and chronic pain (real neuroscience — explain it warmly and honestly)
${faithSection}
8. 🔬 What the latest research says
9. 🧪 Clinical trials they may qualify for
10. 🔗 How their conditions interact (${conditions})
11. 🔭 RECOMMENDED TESTS — this section is critical. Based on AI research and their current results, list every test they should be asking for. For EACH test write:
   - The test name and what it measures (plain English, no jargon)
   - WHY the research says this test matters specifically for their conditions
   - What a good result looks like vs a concerning result
   - The exact words they can say to their doctor to request it
   Format each test as: **Test Name** | *What it is* | *Why it matters for ${patientName}* | *What to ask*
   Include: missing labs (CBC, FVC), disease activity markers (IL-6, TGF-β, mRSS), thyroid panel, HbA1c, vitamin D, B12, ferritin, magnesium, NT-proBNP (pulmonary hypertension screen), echocardiogram, HRCT chest, and any others the research suggests
12. ❓ Questions for their next appointment`
    }]
  });

  return {
    report: response.content[0].text,
    criticalFlags,
    pubmedRefs: [...condResearch, ...drugResearch, ...comorbidResearch].join('\n\n---\n\n'),
    trialsRefs: trialsText,
    context: { labHistory, patientProfile: PATIENT_PROFILE }
  };
}

// ─── Chat follow-up ────────────────────────────────────────────────────────
async function chatWithAgent(reportText, history, userMessage) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const chatCoordinator = process.env.COORDINATOR_NAME || 'Care Coordinator';
  const chatPatient     = process.env.PATIENT_NAME     || 'the patient';

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    system: `You are a warm, loving medical intelligence assistant — like a trusted Irish family friend who knows medicine. You speak with heart and gentle directness. You're chatting with ${chatCoordinator}, ${chatPatient}'s devoted care coordinator. Use occasional Irish warmth naturally — "sure look", "God bless them", "the poor dote", "fair play", "they're doing mighty" — but keep it grounded and honest. Never suggest specific drug doses. Always recommend discussing changes with their doctors. Be genuinely open to ALL ideas — conventional, plant medicine, Eastern, spiritual, psychedelic-assisted, energy work, nutrition, faith-based. Never dismiss anything. Present everything with respect. Always complete your full response — never cut off mid-sentence or mid-thought.

THE REPORT YOU PRODUCED:
${reportText.substring(0, 8000)}

PATIENT CONTEXT:
${PATIENT_PROFILE}`,
    messages
  });

  return response.content[0].text;
}

module.exports = { runFullAnalysis, chatWithAgent, detectCriticalFlags };
