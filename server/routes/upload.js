const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { extractLabsFromText } = require('../services/claudeService');
const uploadDir = path.join(__dirname,'../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir,{recursive:true});
const upload = multer({ storage: multer.diskStorage({ destination:uploadDir, filename:(req,file,cb)=>cb(null,`${Date.now()}-${file.originalname}`) }), limits:{fileSize:20*1024*1024} });
router.post('/', upload.single('file'), async (req,res) => {
  if (!req.file) return res.status(400).json({error:'No file'});
  let text = '';
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (['.txt','.csv'].includes(ext)) { text = fs.readFileSync(req.file.path,'utf-8'); }
  else if (ext==='.pdf') { try { const pp=require('pdf-parse'); text=(await pp(fs.readFileSync(req.file.path))).text; } catch { text=`PDF: ${req.file.originalname}`; } }
  else { text = `File: ${req.file.originalname}`; }
  let extractedLabs = null;
  if (text.length > 50) { extractedLabs = await extractLabsFromText(text); }
  let dbSaved = false;
  let dbError = null;
  if (extractedLabs?.date) {
    try {
      db.prepare(
        'INSERT INTO lab_results (date,il6,tgf_beta,a20,potassium,creatinine,wbc,mrss,fvc,hemoglobin,platelets,alt,ast,notes,source_file) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
      ).run(
        extractedLabs.date, extractedLabs.il6, extractedLabs.tgf_beta, extractedLabs.a20,
        extractedLabs.potassium, extractedLabs.creatinine, extractedLabs.wbc, extractedLabs.mrss,
        extractedLabs.fvc, extractedLabs.hemoglobin, extractedLabs.platelets, extractedLabs.alt,
        extractedLabs.ast, extractedLabs.notes, req.file.originalname
      );
      dbSaved = true;
    } catch (e) {
      dbError = e.message;
      console.error('Lab DB insert error:', e.message);
    }
  }
  res.json({ success: true, filename: req.file.filename, extractedLabs, textLength: text.length, dbSaved, dbError });
});
module.exports = router;
