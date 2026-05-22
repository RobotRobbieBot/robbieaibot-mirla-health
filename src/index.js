import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import MirlaHealthHub from './App';
import LoginPage from './LoginPage';

const AppEntry = () => {
  // Stay logged in for the browser session; cleared when tab closes
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem('mirla_auth') === '1'
  );

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />;
  }

  return <MirlaHealthHub />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>
);
