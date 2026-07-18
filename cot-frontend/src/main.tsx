import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initClarity } from './lib/clarity';

// Microsoft Clarity analytics — active only when VITE_CLARITY_PROJECT_ID is set.
const clarityProjectId = import.meta.env.VITE_CLARITY_PROJECT_ID;
if (clarityProjectId) initClarity(clarityProjectId);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
