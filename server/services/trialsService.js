const axios = require('axios');
require('dotenv').config();
const BASE = 'https://clinicaltrials.gov/api/v2/studies';

async function searchForMirla(drugName) {
  const condition = process.env.PATIENT_CONDITION || 'Systemic Sclerosis';
  try {
    const params = {
      'query.cond': condition,
      'query.intr': drugName,
      'pageSize': 15,
      'format': 'json'
    };
    const res = await axios.get(BASE, { params, timeout: 15000 });
    const studies = res.data?.studies || [];
    return studies.map(study => {
      const proto = study.protocolSection;
      const id = proto?.identificationModule;
      const st = proto?.statusModule;
      const elig = proto?.eligibilityModule;
      const contacts = proto?.contactsLocationsModule;
      const sponsor = proto?.sponsorCollaboratorsModule;
      const locs = contacts?.locations || [];
      const cc = contacts?.centralContacts?.[0] || {};
      return {
        nct_id: id?.nctId||'',
        title: id?.officialTitle||id?.briefTitle||'',
        phase: st?.phase||'',
        status: st?.overallStatus||'',
        location: locs.map(l=>`${l.city||''}, ${l.country||''}`).slice(0,3).join('; ')||'Multiple',
        institution: sponsor?.leadSponsor?.name||'',
        inclusion_criteria: elig?.eligibilityCriteria||'',
        contact_name: cc.name||'', contact_email: cc.email||'', contact_phone: cc.phone||'',
        enrollment_count: st?.enrollmentInfo?.count||0,
        start_date: st?.startDateStruct?.date||'',
        completion_date: st?.completionDateStruct?.date||'',
        url: `https://clinicaltrials.gov/study/${id?.nctId||''}`
      };
    }).filter(t => ['RECRUITING','ENROLLING_BY_INVITATION','NOT_YET_RECRUITING','ACTIVE_NOT_RECRUITING'].includes(t.status));
  } catch (e) { console.error('Trials API error:', e.message); return []; }
}

module.exports = { searchForMirla };
