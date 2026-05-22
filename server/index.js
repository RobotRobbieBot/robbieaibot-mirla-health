require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://robbieaibot-mirla-health.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (curl, Postman) and any listed origin
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/labs',        require('./routes/labs'));
app.use('/api/drugs',       require('./routes/drugs'));
app.use('/api/research',    require('./routes/research'));
app.use('/api/trials',      require('./routes/trials'));
app.use('/api/analysis',    require('./routes/analysis'));
app.use('/api/notes',       require('./routes/notes'));
app.use('/api/upload',      require('./routes/upload'));
app.use('/api/reports',     require('./routes/reports'));

app.get('/api/health', (req,res) => res.json({ status:'ok', system:'Mirla Medical Intelligence', timestamp: new Date().toISOString() }));

require('./services/scheduler').startScheduler();

app.listen(PORT, () => {
  console.log(`\n🏥 Mirla Medical Intelligence API  →  http://localhost:${PORT}`);
  console.log(`📊 React Dashboard               →  http://localhost:3000`);
  console.log(`🔌 Health check                  →  http://localhost:${PORT}/api/health\n`);
});
