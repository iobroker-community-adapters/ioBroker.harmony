import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import pkg from '../package.json';

console.log('Harmony admin: version ' + pkg.version);
const root = document.getElementById('harmony-root');
if (root) {
    ReactDOM.createRoot(root).render(<App />);
}
