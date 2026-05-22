// Central API base URL — uses Railway in production, localhost in dev
const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
export default API;
