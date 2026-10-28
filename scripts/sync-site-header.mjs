// Run after editing scripts/site-header.html to update all public page headers.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const template = readFileSync(join(root, 'scripts/site-header.html'), 'utf8').trim();
const routes = { 'index.html': '/', 'dpc-crawlable.html': '/what-is-dpc', 'what-is-dpc.html': '/what-is-dpc', 'membership-crawlable.html': '/membership', 'services-crawlable.html': '/services', 'about-crawlable.html': '/about', 'faq-crawlable.html': '/faq', 'contact-crawlable.html': '/contact' };
const paths = [
  ...readdirSync(root).filter(p => p.endsWith('.html')),
  'blog/index.html', 'blog/article.html',
  'netlify/functions/blog-index.mjs', 'netlify/functions/blog-article.mjs'
];
for (const path of paths) {
  const file = join(root, path);
  let source = readFileSync(file, 'utf8');
  const route = path.includes('blog') ? '/blog/' : routes[path];
  const header = route ? template.replaceAll(`href="${route}"`, `href="${route}" aria-current="page"`) : template;
  if (/<header\b[^>]*>[\s\S]*?<\/header>/.test(source)) {
    source = source.replace(/<header\b[^>]*>[\s\S]*?<\/header>/, header);
  } else if (path === 'index.html') {
    source = source.replace('<body>', `<body>\n${header}`);
  } else continue;
  if (!source.includes('href="/site-header.css"')) {
    const closingHead = path === 'netlify/functions/blog-article.mjs' ? '</head><body><header class="site-header">' : '</head>';
    source = source.replace(closingHead, '<link rel="stylesheet" href="/site-header.css">\n' + closingHead);
  }
  writeFileSync(file, source);
  console.log(path);
}
