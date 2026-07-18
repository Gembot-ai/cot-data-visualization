import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { initClarity } from './lib/clarity';

// Microsoft Clarity analytics. Defaults to the CoT project id in production
// builds (the id is not secret — it ships in client JS); override with
// VITE_CLARITY_PROJECT_ID. Disabled in local dev so localhost isn't recorded.
const clarityProjectId =
  import.meta.env.VITE_CLARITY_PROJECT_ID ||
  (import.meta.env.PROD ? 'xo4i3d8oir' : undefined);
if (clarityProjectId) initClarity(clarityProjectId);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
