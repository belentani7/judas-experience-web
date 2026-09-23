const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://judas.belentani.com';

function main() {
  const publicDir = path.join(__dirname, '..');
  
  // robots.txt
  const robots = `# Robots.txt for The Judas Experience
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
  console.log('✅ robots.txt generado');

  // sitemap.xml
  const pages = [
    { url: '/', changefreq: 'monthly', priority: '1.0' },
    { url: '/health', changefreq: 'yearly', priority: '0.1' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml generado');
}

main();