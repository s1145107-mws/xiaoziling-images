import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StrokeInspector from './components/StrokeInspector';
import './index.css';

// 在網址加上 ?inspect 可開啟「筆畫編號檢視器」，方便老師調校筆畫誤寫變體
const inspect = new URLSearchParams(window.location.search).has('inspect');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{inspect ? <StrokeInspector /> : <App />}</React.StrictMode>,
);
