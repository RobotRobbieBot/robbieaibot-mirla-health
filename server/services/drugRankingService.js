const db = require('../database');

const DRUG_DATABASE = [
  { name:'Tocilizumab',     mechanism:'IL-6 receptor antagonist (anti-IL-6R monoclonal antibody)',              target:'IL-6/JAK-STAT3',        drug_class:'Biologic',        m:88, e:82, s:78 },
  { name:'Nintedanib',      mechanism:'Triple kinase inhibitor (FGFR/PDGFR/VEGFR) — approved for SSc-ILD',     target:'FGFR/PDGFR/VEGFR',     drug_class:'Antifibrotic',    m:85, e:90, s:70 },
  { name:'Dasatinib',       mechanism:'BCR-ABL/c-Kit/PDGFR TKI — anti-fibrotic via TGF-β pathway suppression', target:'PDGFR/TGF-β/c-Abl',    drug_class:'TKI',             m:82, e:70, s:72 },
  { name:'Baricitinib',     mechanism:'JAK1/JAK2 inhibitor — blocks IL-6 downstream signaling',                 target:'JAK1/JAK2/STAT3',       drug_class:'JAK inhibitor',   m:84, e:65, s:74 },
  { name:'Tofacitinib',     mechanism:'JAK1/JAK3 inhibitor — blocks multiple cytokine pathways incl IL-6',      target:'JAK1/JAK3/STAT',        drug_class:'JAK inhibitor',   m:80, e:60, s:72 },
  { name:'Abatacept',       mechanism:'CTLA4-Ig T-cell costimulation blocker — reduces autoimmune activation',  target:'CD28/B7/T-cell',        drug_class:'Biologic',        m:72, e:68, s:80 },
  { name:'Rituximab',       mechanism:'Anti-CD20 monoclonal antibody — B-cell depletion',                       target:'B-cell/autoantibody',   drug_class:'Biologic',        m:70, e:72, s:68 },
  { name:'Imatinib',        mechanism:'c-Abl/PDGFR/c-Kit inhibitor — anti-fibrotic, reduces TGF-β signaling',  target:'c-Abl/PDGFR/TGF-β',    drug_class:'TKI',             m:78, e:65, s:70 },
  { name:'Pirfenidone',     mechanism:'Anti-fibrotic — inhibits TGF-β production and collagen synthesis',       target:'TGF-β/SMAD/collagen',   drug_class:'Antifibrotic',    m:76, e:70, s:75 },
  { name:'A20-mRNA Therapy',mechanism:'mRNA delivery of TNFAIP3/A20 — NF-κB negative regulator (experimental)',target:'NF-κB/A20/TNFAIP3',    drug_class:'Experimental',    m:92, e:40, s:60 },
  { name:'Belimumab',       mechanism:'Anti-BLyS/BAFF monoclonal antibody — reduces B-cell survival',           target:'BLyS/BAFF/B-cell',      drug_class:'Biologic',        m:65, e:55, s:78 },
  { name:'Lenabasum',       mechanism:'Cannabinoid receptor 2 agonist — reduces inflammation and fibrosis',     target:'CB2/endocannabinoid',   drug_class:'CB2 agonist',     m:68, e:55, s:82 },
];

function calcFinal(m, e, s, t) { return (m*0.30) + (e*0.40) + (s*0.20) + (t*0.10); }

async function rankAllDrugs() {
  const { searchForMirla } = require('./trialsService');
  const rankings = [];
  for (const drug of DRUG_DATABASE) {
    let trialScore = 30;
    try {
      const trials = await searchForMirla(drug.name);
      trialScore = Math.min(100, trials.length * 15);
    } catch {}
    const final = Math.round(calcFinal(drug.m, drug.e, drug.s, trialScore));
    try {
      db.prepare(`INSERT OR REPLACE INTO drug_recommendations (date,drug_name,match_percentage,mechanism_score,evidence_score,safety_score,trial_score,reasoning) VALUES (?,?,?,?,?,?,?,?)`)
        .run(new Date().toISOString().split('T')[0], drug.name, final, drug.m, drug.e, drug.s, trialScore, `${drug.mechanism}. Targets: ${drug.target}.`);
      db.prepare(`INSERT OR REPLACE INTO medications (name,mechanism,target_pathways,efficacy_score,safety_score,evidence_score,trial_score,final_score,drug_class) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(drug.name, drug.mechanism, drug.target, drug.m, drug.s, drug.e, trialScore, final, drug.drug_class);
    } catch {}
    rankings.push({ drug_name:drug.name, match_percentage:final, mechanism_score:drug.m, evidence_score:drug.e, safety_score:drug.s, trial_score:trialScore, reasoning:`${drug.mechanism}. Targets: ${drug.target}.`, drug_class:drug.drug_class });
  }
  return rankings.sort((a,b) => b.match_percentage - a.match_percentage);
}

module.exports = { rankAllDrugs, DRUG_DATABASE };
