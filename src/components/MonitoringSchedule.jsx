import React, { useState } from 'react';
import { Printer, FlaskConical, Radio, Stethoscope } from 'lucide-react';

const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };

const SCHEDULE = [
  { week:'2',  labs:['CBC','CMP','Creatinine','Urinalysis'],                   imaging:[],                      clinical:['Blood pressure check','Symptom review'],             notes:'Safety baseline' },
  { week:'4',  labs:['CBC','CMP','IL-6','TGF-β','LFTs'],                       imaging:[],                      clinical:['mRSS assessment','Raynaud diary review'],            notes:'First cytokine check' },
  { week:'6',  labs:['CBC','CMP','Creatinine','Potassium'],                    imaging:[],                      clinical:['Tolerability review','Side effect screen'],          notes:'Tolerability check' },
  { week:'8',  labs:['CBC','CMP','IL-6','TGF-β','A20 (if available)','LFTs'],  imaging:['PFTs (spirometry)'],    clinical:['mRSS assessment','6MWT','Dyspnea scoring'],         notes:'First efficacy assessment' },
  { week:'12', labs:['Full panel','IL-6','TGF-β','ANA','anti-Scl-70'],         imaging:['Echo (if indicated)'], clinical:['mRSS','HAQ-DI','Physician global assessment'],       notes:'Comprehensive 3-month review' },
  { week:'16', labs:['CBC','CMP','IL-6','LFTs'],                               imaging:[],                      clinical:['Blood pressure','Raynaud frequency'],                notes:'Ongoing monitoring' },
  { week:'20', labs:['CBC','CMP','IL-6','TGF-β','Creatinine'],                 imaging:['PFTs'],                 clinical:['mRSS','Tolerability'],                              notes:'5-month assessment' },
  { week:'24', labs:['Full panel','IL-6','TGF-β','A20','anti-Scl-70','ANA'],   imaging:['HRCT Chest','Echo'],   clinical:['Full SSc assessment','mRSS','HAQ-DI','6MWT'],       notes:'6-month comprehensive review — discuss with rheumatologist' },
  { week:'36', labs:['Full panel','IL-6','TGF-β'],                             imaging:['PFTs'],                 clinical:['mRSS','Clinical response assessment'],              notes:'9-month check' },
  { week:'48', labs:['Full panel','IL-6','TGF-β','A20','Immunoglobulins'],     imaging:['HRCT','Echo','PFTs'],  clinical:['Full SSc panel','mRSS','HAQ-DI','SF-36'],           notes:'12-month full review' },
];

const MonitoringSchedule = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="space-y-6">
      <div style={card}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-light text-amber-900">Monitoring Schedule</h2>
          <button onClick={()=>window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all text-sm font-medium">
            <Printer size={15}/>Print
          </button>
        </div>
        <p className="text-amber-700 font-light mb-6 text-sm">Suggested monitoring plan based on Mirla's SSc profile and current recommendations. Always confirm with your rheumatologist.</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all','labs','imaging','clinical'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm transition-all capitalize ${filter===f?'bg-yellow-200 text-amber-900 font-medium shadow-sm':'bg-white bg-opacity-60 text-amber-700 hover:bg-opacity-80 border border-amber-200'}`}>{f}</button>
          ))}
        </div>

        <div className="space-y-3">
          {SCHEDULE.map((s,i) => (
            <div key={i} className="rounded-2xl border border-amber-200 bg-white bg-opacity-40 p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 flex-shrink-0 text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-200 text-amber-900 flex items-center justify-center mx-auto text-xs font-bold leading-tight">
                    Wk<br/>{s.week}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {(filter==='all'||filter==='labs') && s.labs.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FlaskConical size={13} className="text-blue-500"/>
                        <span className="text-xs font-medium text-blue-700">Lab Tests</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.labs.map(l=><span key={l} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{l}</span>)}
                      </div>
                    </div>
                  )}
                  {(filter==='all'||filter==='imaging') && s.imaging.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Radio size={13} className="text-purple-500"/>
                        <span className="text-xs font-medium text-purple-700">Imaging</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.imaging.map(l=><span key={l} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">{l}</span>)}
                      </div>
                    </div>
                  )}
                  {(filter==='all'||filter==='clinical') && s.clinical.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Stethoscope size={13} className="text-green-600"/>
                        <span className="text-xs font-medium text-green-700">Clinical Assessments</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.clinical.map(l=><span key={l} className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{l}</span>)}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-amber-500 italic mt-1">{s.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MonitoringSchedule;
