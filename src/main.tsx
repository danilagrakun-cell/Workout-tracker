import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA functionality
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('Доступна новая версия приложения Workout Diary.');
    },
    onOfflineReady() {
      console.log('Workout Diary готов к автономной работе без интернета.');
    }
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
