import { connectLambda } from "@netlify/blobs";
import { listPosts } from "./_blog-data.mjs";

const esc = (v = "") =>
  String(v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York"
  }).format(new Date(value));

export async function handler(e) {
  connectLambda(e);
  if (e.httpMethod !== "GET") return { statusCode: 405, body: "Method not allowed" };

  const now = new Date();
  const posts = (await listPosts())
    .filter((p) => (p.status === "published" || p.status === "scheduled") && new Date(p.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const cards = posts.length
    ? posts.map((p) => `
      <article class="post-card">
        ${p.featuredImage ? `<a href="/blog/${encodeURIComponent(p.slug)}/"><img class="post-card__image" src="${esc(p.featuredImage)}" alt="${esc(p.imageAlt)}" loading="lazy"></a>` : ""}
        <div class="post-card__body">
          <p class="post-meta"><time datetime="${esc(p.date)}">${formatDate(p.date)}</time> · ${esc(p.author)}</p>
          <h2><a href="/blog/${encodeURIComponent(p.slug)}/">${esc(p.title)}</a></h2>
          <p class="post-card__summary">${esc(p.description)}</p>
        </div>
      </article>`).join("")
    : '<div class="blog-empty"><h2>New articles are coming soon.</h2><p>Check back for practical guidance from Dr. Mark Hagen and Firebird Direct Primary Care.</p></div>';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="theme-color" content="#123044">
  <title>Blog | Firebird Direct Primary Care</title>
  <meta name="description" content="Articles from Dr. Mark Hagen and Firebird Direct Primary Care in Worthington, Ohio.">
  <link rel="canonical" href="https://firebirddpc.com/blog/">
  <link rel="stylesheet" href="/blog.css">
</head>
<body>
  <header class="blog-header">
    <div class="blog-shell blog-header__inner">
      <a class="blog-logo" href="/" aria-label="Firebird Direct Primary Care home"><img src="/images/firebird-logo-rectangle-rising.png" alt="Firebird Direct Primary Care - Rising Above Traditional Medicine"></a>
      <nav class="blog-nav" aria-label="Main navigation">
        <a href="/">Home</a><a href="/what-is-dpc">What Is DPC?</a><a href="/membership">Membership</a><a href="/services">Services</a><a href="/about">Meet the Team</a><a href="/faq">FAQ</a><a href="/blog/" aria-current="page">Blog</a><a href="/contact">Contact</a>
      </nav>
      <div class="blog-header-actions">
        <a class="blog-header-button blog-header-button--secondary" href="/meet-and-greet.html">Meet &amp; Greet</a>
        <a class="blog-header-button blog-header-button--primary" href="https://firebirddirectprimarycare.atlas.md/enrollment/index.html?account=aU1HpP3oGYg54RXCEjlJ" target="_blank" rel="noreferrer">Enroll Now</a>
      </div>
    </div>
  </header>
  <main>
    <section class="blog-hero"><div class="blog-shell"><p class="blog-eyebrow">Insights from Dr. Hagen</p><h1>The Firebird DPC Blog</h1><p>Clear, useful perspectives on primary care, prevention, and building a healthier life.</p></div></section>
    <section class="blog-main"><div class="blog-shell"><div id="blog-posts" class="blog-grid">${cards}</div></div></section>
  </main>
  <footer class="blog-footer"><div class="blog-shell blog-footer__inner"><span>© 2026 Firebird Direct Primary Care</span><span>Worthington, Ohio</span></div></footer>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300"
    },
    body: html
  };
}
