import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && (window as any).Pi) {
  try {
    (window as any).Pi.init({ version: "2.0", sandbox: true });
    console.log("Pi SDK initialized with version 2.0 and sandbox: true");
  } catch (err) {
    console.error("Pi SDK initialization error:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
