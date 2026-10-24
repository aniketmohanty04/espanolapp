import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import handler from './api/assess-pronunciation.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.AZURE_SPEECH_KEY) process.env.AZURE_SPEECH_KEY = env.AZURE_SPEECH_KEY;
  if (env.AZURE_SPEECH_REGION) process.env.AZURE_SPEECH_REGION = env.AZURE_SPEECH_REGION;

  return {
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'azure-speech-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/assess-pronunciation', async (req, res) => {
            try {
              await handler(req, res);
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const message = err instanceof Error ? err.message : String(err);
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });
        }
      }
    ]
  };
});
