import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Import component App bạn đã tạo

// Lấy element có id="root" từ file index.html
const rootElement = document.getElementById('root');

// Tạo React root và render component App vào đó
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)