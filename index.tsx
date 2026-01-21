import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple Path-based Routing Check
const isPathAdmin = window.location.pathname.startsWith('/admin');

root.render(
  <React.StrictMode>
    {isPathAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>
);