import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Use the verified apartment profile, not the separate Caffe Bar Zona listing.
const lodgingId = 'https://apartmanizonaorebic.com/#lodging';
const mapUrl = 'https://www.google.com/maps/place/Apartmani+Zona/@42.9769432,17.1867932,17z/data=!3m1!4b1!4m6!3m5!1s0x134a5182f81c14d1:0xd58682d2fefb060c!8m2!3d42.9769432!4d17.1867932!16s%2Fg%2F11g8wz4ggb?hl=hr&entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D';
const mapHref = mapUrl.replaceAll('&', '&amp;');
const addressHref = 'https://www.google.com/maps/search/?api=1&amp;query=Josipa+bana+Jelacica+24+Orebic';
const instagramLabels = {
  hr: 'Instagram Caffe Bara Zona',
  en: 'Caffe Bar Zona on Instagram',
  de: 'Caffe Bar Zona auf Instagram',
  cs: 'Caffe Bar Zona na Instagramu',
  pl: 'Caffe Bar Zona na Instagramie',
};
const counts = { lodgingProfiles: 0, footerLabels: 0, navigationLinks: 0, changedFiles: 0 };
const updates = [];

function updateHtml(original, path) {
  const language = original.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1]?.split('-')[0];
  let updated = original.replace(/(<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, start, raw, end) => {
    const data = JSON.parse(raw);
    for (const entity of data['@graph'] || [data]) {
      if (entity['@type'] !== 'LodgingBusiness' || entity['@id'] !== lodgingId) continue;
      counts.lodgingProfiles++;
      if (Object.hasOwn(entity, 'hasMap')) {
        if (entity.hasMap !== mapUrl) throw new Error(`Unexpected existing hasMap in ${path}`);
        continue;
      }
      // Match the existing compact object so no other JSON-LD is reformatted.
      const before = JSON.stringify(entity);
      if (raw.split(before).length !== 2) throw new Error(`Cannot uniquely locate lodging JSON-LD in ${path}`);
      const after = `${before.slice(0, -1)},"hasMap":${JSON.stringify(mapUrl)}}`;
      raw = raw.replace(before, after);
    }
    return start + raw + end;
  });

  updated = updated.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, footer => footer.replace(/(<a\b[^>]*\bhref=["']https:\/\/www\.instagram\.com\/caffebarzona_\/["'][^>]*>)([^<]*)(<\/a>)/gi, (whole, start, label, end) => {
    const expected = instagramLabels[language];
    if (!expected) throw new Error(`Unsupported footer language in ${path}`);
    if (label !== 'Instagram' && label !== expected) throw new Error(`Unexpected Instagram label in ${path}`);
    counts.footerLabels++;
    return start + expected + end;
  }));

  updated = updated.replace(/(<a\b[^>]*\bhref=)(["'])([^"']+)\2/gi, (whole, start, quote, href) => {
    if (href !== addressHref && href !== mapHref) return whole;
    counts.navigationLinks++;
    return start + quote + mapHref + quote;
  });
  return updated;
}

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await visit(path); continue; }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const original = await readFile(path, 'utf8');
    const updated = updateHtml(original, path);
    if (updated !== original) updates.push({ path, updated });
  }
}

// Validate all pages before writing, so a source mismatch stops the build.
await visit(fileURLToPath(new URL('.', import.meta.url)));
if (!counts.lodgingProfiles || !counts.footerLabels || !counts.navigationLinks) {
  throw new Error(`Missing expected identity markup: ${JSON.stringify(counts)}`);
}
for (const { path, updated } of updates) await writeFile(path, updated);
counts.changedFiles = updates.length;
console.log(`SEO identity: ${JSON.stringify(counts)}`);
