import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

const API = 'http://localhost:3001';
const card = { background:'linear-gradient(135deg,rgba(255,255,255,.5) 0%,rgba(254,252,232,.3) 100%)', borderRadius:'1.5rem', padding:'2rem', border:'1px solid #fde68a', marginBottom:'1.5rem' };

const MirlaDataUpload = () => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await axios.post(`${API}/api/upload`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      setResults(prev => [{ file:file.name, ...r.data, ts:Date.now() }, ...prev]);
    } catch (e) {
      setResults(prev => [{ file:file.name, error:e.response?.data?.error||e.message, ts:Date.now() }, ...prev]);
    } finally { setUploading(false); }
  };

  const onDrop = e => { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) handleFile(f); };
  const onDragOver = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  return (
    <div className="space-y-6">
      <div style={card}>
        <h2 className="text-3xl font-light text-amber-900 mb-2">Upload Medical Records</h2>
        <p className="text-amber-700 font-light mb-6 text-sm">Upload lab reports, imaging results, or any medical document. Claude AI will automatically extract and save lab values.</p>

        {/* Drop zone */}
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-amber-400 bg-yellow-50' : 'border-amber-300 hover:border-amber-400 hover:bg-yellow-50'}`}
        >
          <input ref={fileRef} type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg" className="hidden" onChange={e=>handleFile(e.target.files[0])} />
          {uploading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin mx-auto"/>
              <p className="text-amber-700 font-light">Processing file with Claude AI...</p>
              <p className="text-amber-500 text-sm">Extracting lab values and dates</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="mx-auto text-amber-400" size={40}/>
              <p className="text-amber-800 font-light text-lg">Drop a file here or click to browse</p>
              <div className="flex justify-center gap-3">
                {['PDF','CSV','TXT'].map(t=><span key={t} className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">{t}</span>)}
              </div>
              <p className="text-amber-500 text-xs">Max 20MB · Lab results, imaging reports, clinical notes</p>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-light text-amber-900">Upload History</h3>
            {results.map((r, i) => (
              <div key={r.ts} className={`rounded-2xl p-5 border ${r.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {r.error ? <AlertCircle className="text-red-500 flex-shrink-0" size={20}/> : <CheckCircle className="text-green-500 flex-shrink-0" size={20}/>}
                    <div>
                      <p className="font-medium text-sm text-gray-800 flex items-center gap-2"><FileText size={14}/>{r.file}</p>
                      {r.error ? <p className="text-red-600 text-sm mt-1">{r.error}</p> : (
                        <p className="text-green-700 text-sm mt-1">
                          {r.extractedLabs ? '✅ Lab values extracted and saved' : `✅ Uploaded (${r.textLength} chars read)`}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setResults(results.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                </div>
                {r.extractedLabs && (
                  <div className="mt-3 pl-9 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(r.extractedLabs).filter(([k,v])=>v!=null&&k!=='notes'&&k!=='date').map(([k,v])=>(
                      <div key={k} className="text-xs bg-white rounded-lg px-2 py-1 border border-green-200">
                        <span className="text-gray-500 uppercase">{k.replace('_',' ')}: </span>
                        <span className="font-medium text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <h3 className="text-lg font-light text-amber-900 mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            ['1', 'Upload your lab report, imaging result, or clinical note (PDF, CSV, or TXT)'],
            ['2', 'Claude AI reads the document and extracts all lab values with dates'],
            ['3', 'Values are automatically saved to your Lab Dashboard'],
            ['4', 'Trends are updated and included in weekly summaries to Robbie'],
          ].map(([n, t]) => (
            <div key={n} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-yellow-200 text-amber-900 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
              <p className="text-amber-800 text-sm font-light">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MirlaDataUpload;
