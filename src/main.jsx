// Entry. Order matters: side-effect imports attach globals that the
// components pick up via `window.*`.
import React from 'react';
import ReactDOM from 'react-dom/client';

import './nato.js';
import './data.js';
import './world-data.js';
import './sim-live.js';
import './globe.jsx';
import './panels.jsx';

import App from './app.jsx';
import './styles.css';

// StrictMode intentionally omitted: the design's effects predate the
// double-invocation contract and the stage-resize useEffect misfires on
// the second mount, leaving the globe sized from the initial state.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
