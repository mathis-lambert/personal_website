import { createRoot } from 'react-dom/client';
import './style/index.css';
import App from './App.tsx';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { ChatProvider } from '@/providers/ChatProvider.tsx';
import { AuthProvider } from '@/providers/AuthProvider.tsx';
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <ThemeProvider storageKey="vite-ui-theme">
    <AuthProvider>
      <ChatProvider>
        <App />
        <Toaster />
      </ChatProvider>
    </AuthProvider>
  </ThemeProvider>
);
