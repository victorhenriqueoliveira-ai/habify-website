// Pós-build: renderiza as rotas públicas com Puppeteer e grava o HTML
// resultante direto no dist/, sobrescrevendo o shell vazio da SPA.
//
// Por quê: o site é uma SPA client-side pura (sem SSR). O Googlebot indexa
// em duas fases — primeiro busca o HTML cru (que aqui seria só
// <div id="root">), depois enfileira uma renderização JS separada pra ver o
// conteúdo de verdade, o que pode levar horas/dias. Servindo HTML já
// renderizado pras rotas públicas, o conteúdo fica visível na primeira
// passada. O bundle JS continua incluído no HTML gerado, então o React
// re-hidrata normalmente por cima assim que carrega no navegador.

import { mkdir, writeFile } from 'fs/promises';
import { createReadStream, existsSync, statSync } from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const PORT = 4174;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Servidor estático minimalista só pra servir o dist/ localmente durante o
// prerender — dispensa depender de um pacote externo pra isso.
function createStaticServer(root) {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(root, urlPath);

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html'); // fallback tipo SPA
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  });
}

// path relativo dentro de dist/ onde salvar o index.html gerado
const ROUTES = [
  { path: '/', outFile: 'index.html' },
  { path: '/termos-de-uso', outFile: 'termos-de-uso/index.html' },
  { path: '/politica-privacidade', outFile: 'politica-privacidade/index.html' },
];

// A imagem de build do Vercel não tem as bibliotecas de sistema que o
// Chromium do pacote `puppeteer` normal precisa (ex: libnspr4.so) — só
// funciona localmente. No Vercel usamos puppeteer-core + @sparticuz/chromium,
// um Chromium compilado estaticamente pra esse tipo de ambiente restrito.
async function launchBrowser() {
  if (process.env.VERCEL) {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ]);
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({ headless: 'new' });
}

async function main() {
  const server = createStaticServer(distDir);
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await launchBrowser();

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `http://localhost:${PORT}${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      const html = await page.content();
      await page.close();

      const outPath = path.join(distDir, route.outFile);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html, 'utf-8');
      console.log(`[prerender] ${route.path} -> dist/${route.outFile}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error('[prerender] falhou:', err);
  process.exit(1);
});
