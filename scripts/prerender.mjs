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
      // Viewport de desktop: no padrão (800x600) o Puppeteer captura o
      // layout mobile e congela medidas erradas no HTML publicado.
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

      const url = `http://localhost:${PORT}${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Rola a página inteira antes de capturar. Sem isso, tudo que depende
      // de IntersectionObserver pra aparecer (reveal on scroll) é gravado
      // ainda invisível — era assim que 42 elementos, incluindo o <h1>,
      // iam pro HTML indexado com opacity:0.
      const stillHidden = await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => r()));
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 600));

        // Rede de segurança: o que ainda tiver opacity:0 inline E contiver
        // texto é conteúdo que o Google leria como invisível. Componentes
        // que não usam viewport={{once:true}} voltam a se esconder quando a
        // página rola de volta ao topo, então revelamos na marra antes de
        // capturar. Elementos sem texto (sombras do Swiper, por exemplo)
        // são decorativos e ficam como estão.
        const revealed = [];
        document.querySelectorAll('[style*="opacity"]').forEach((el) => {
          const inline = el.getAttribute('style') || '';
          if (!/opacity:\s*0\s*[;"]?/.test(inline)) return;
          if (!el.textContent.trim()) return;
          el.style.opacity = '1';
          el.style.transform = 'none';
          revealed.push(el.tagName.toLowerCase());
        });

        // Mesma ideia para quem esconde por classe utilitária em vez de
        // style inline (o <h1> do hero usa `opacity-0 animate-fade-in`).
        document.querySelectorAll('.opacity-0').forEach((el) => {
          if (!el.textContent.trim()) return;
          el.classList.remove('opacity-0');
          revealed.push(el.tagName.toLowerCase() + ' (classe)');
        });

        return revealed;
      });

      if (stillHidden.length) {
        console.log(`[prerender] ${route.path}: ${stillHidden.length} elemento(s) de texto revelados na captura`);
      }

      const html = await page.content();
      await page.close();

      // Trava de segurança: nunca publicar um estado de erro. Se o fetch dos
      // planos falhar durante o build, a página renderiza "Erro ao carregar
      // planos" e esse HTML é o que o Google indexaria.
      if (html.includes('Erro ao carregar planos')) {
        throw new Error(
          `${route.path} renderizou o estado de erro dos planos — build abortado ` +
          `pra não publicar isso. Verifique a conexão com o Supabase.`
        );
      }

      // Conta só o que tem texto dentro — sombras decorativas do Swiper e
      // afins nascem com opacity:0 de propósito e não são conteúdo.
      const hiddenWithText = (html.match(/style="[^"]*opacity:\s*0[^"]*"[^>]*>[^<]*[A-Za-zÀ-ÿ]/g) || []).length;
      if (hiddenWithText > 0) {
        console.warn(`[prerender] ${route.path}: ${hiddenWithText} bloco(s) de texto ainda invisíveis no HTML`);
      }

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
