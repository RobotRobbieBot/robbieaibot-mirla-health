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
  'https://mirla-health.vercel.app',
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

app.use('/api/labs',          require('./routes/labs'));
app.use('/api/drugs',         require('./routes/drugs'));
app.use('/api/research',      require('./routes/research'));
app.use('/api/trials',        require('./routes/trials'));
app.use('/api/analysis',      require('./routes/analysis'));
app.use('/api/notes',         require('./routes/notes'));
app.use('/api/upload',        require('./routes/upload'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/history',       require('./routes/history'));
// Personal data — persistent SQLite (previously localStorage-only)
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/exercises',     require('./routes/exercises'));
app.use('/api/supplements',   require('./routes/supplements'));

app.get('/api/health', (req, res) => res.json({
  status: 'ok', system: `${process.env.PATIENT_NAME || 'Patient'} Health Intelligence`, timestamp: new Date().toISOString()
}));

// Global error handler — prevents one bad route from crashing the server
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

require('./services/scheduler').startScheduler();

// Catch unhandled promise rejections so the process doesn't die
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});

app.listen(PORT, () => {
  const pName = process.env.PATIENT_NAME || 'Patient';
  console.log(`\n🏥 ${pName} Health Intelligence API  →  http://localhost:${PORT}`);
  console.log(`📊 React Dashboard                   →  http://localhost:3002`);
  console.log(`🔌 Health check                      →  http://localhost:${PORT}/api/health\n`);
});
