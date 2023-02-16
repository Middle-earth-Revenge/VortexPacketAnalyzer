import { createRoot } from 'react-dom/client';
import React from 'react';
import NiceModal from '@ebay/nice-modal-react';

import App from './App';

import './pico-bootstrap-grid.scss';
import './main.scss';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
