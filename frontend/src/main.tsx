import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style/index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { ChatProvider } from '@/contexts/ChatContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <ChatProvider>
        <App />
      </ChatProvider>
    </ThemeProvider>
  </StrictMode>,
);
