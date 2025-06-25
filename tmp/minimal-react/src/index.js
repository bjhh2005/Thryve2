import React from 'react';
import { createRoot } from 'react-dom/client';
import SimpleTaskDemo from './App'; // 假设你的组件文件名是这个

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<SimpleTaskDemo />);