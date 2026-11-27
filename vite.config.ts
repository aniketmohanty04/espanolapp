import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import handler from './api/assess-pronunciation.ts';
import ttsHandler from './api/spanish-tts.ts';
import caminoChatHandler from './api/camino-chat.ts';
import adminLoginHandler from './api/admin/login.ts';
import adminSessionHandler from './api/admin/session.ts';
import adminLogoutHandler from './api/admin/logout.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.AZURE_SPEECH_KEY) process.env.AZURE_SPEECH_KEY = env.AZURE_SPEECH_KEY;
  if (env.AZURE_SPEECH_REGION) process.env.AZURE_SPEECH_REGION = env.AZURE_SPEECH_REGION;
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.ADMIN_SECRET_KEY) process.env.ADMIN_SECRET_KEY = env.ADMIN_SECRET_KEY;
  if (env.ADMIN_JWT_SECRET) process.env.ADMIN_JWT_SECRET = env.ADMIN_JWT_SECRET;
  if (env.SUPABASE_SERVICE_ROLE_KEY) process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    build: {
      sourcemap: false
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'backend-api-dev-server',
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

          server.middlewares.use('/api/spanish-tts', async (req, res) => {
            try {
              await ttsHandler(req, res);
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const message = err instanceof Error ? err.message : String(err);
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });

          server.middlewares.use('/api/camino-chat', async (req, res) => {
            try {
              await caminoChatHandler(req, res);
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const message = err instanceof Error ? err.message : String(err);
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });

          server.middlewares.use('/api/admin/login', async (req, res) => {
            try {
              await adminLoginHandler(req, res);
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const message = err instanceof Error ? err.message : String(err);
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });

          server.middlewares.use('/api/admin/session', async (req, res) => {
            try {
              await adminSessionHandler(req, res);
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              const message = err instanceof Error ? err.message : String(err);
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });

          server.middlewares.use('/api/admin/logout', async (req, res) => {
            try {
              await adminLogoutHandler(req, res);
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
