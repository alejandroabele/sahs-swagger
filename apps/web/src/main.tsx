import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { CicloProvider } from './estado/ciclo';
import { SesionProvider } from './estado/sesion';
import './estilos.css';

const cliente = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: 1 },
  },
});

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <BrowserRouter>
        <SesionProvider>
          <CicloProvider>
            <App />
          </CicloProvider>
        </SesionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
