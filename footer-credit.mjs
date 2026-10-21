import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Keep the author credit in every generated page, including all five languages.
const destination = 'https://dalmatiawebstudio.hr/';
const prefixes = { hr: 'Izradio', en: 'Website by', de: 'Webdesign von', cs: 'Vytvořilo', pl: 'Stronę wykonało' };
let changed = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await visit(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const original = await readFile(path, 'utf8');
    const language = original.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.split('-')[0] || 'hr';
    const prefix = prefixes[language] || prefixes.hr;
    const credit = `<a class="dws-credit" href="${destination}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:inherit;text-decoration:underline;text-underline-offset:3px">${prefix} Dalmatia Web Studio</a>`;
    const updated = original.replace(/(<div class="copy">)([\s\S]*?)(<\/div>)/, (whole, start, content, end) => content.includes(destination) ? whole : start + content + credit + end);
    if (updated !== original) { await writeFile(path, updated); changed++; }
  }
}
await visit('.');
console.log(`Added Dalmatia Web Studio footer link to ${changed} pages.`);
