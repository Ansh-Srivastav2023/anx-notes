import { get, set, del } from 'idb-keyval';

const DOCS_KEY = 'anx-notes.docs';
const TEMPLATES_KEY = 'anx-notes.templates';
const CURRENT_KEY = 'anx-notes.currentDocId';
const TRASH_RETENTION_DAYS = 30;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------------- IndexedDB docs ---------------- */

export async function loadDocuments() {
  try {
    const docs = await get(DOCS_KEY);
    if (!Array.isArray(docs)) return [];
    // Purge anything older than retention
    const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86400000;
    return docs.filter((d) => !d.deletedAt || d.deletedAt > cutoff);
  } catch {
    return [];
  }
}

export async function saveDocuments(docs) {
  try {
    await set(DOCS_KEY, docs);
  } catch (e) {
    console.error('saveDocuments failed', e);
  }
}

export async function loadTemplates() {
  try {
    const t = await get(TEMPLATES_KEY);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}

export async function saveTemplates(templates) {
  try {
    await set(TEMPLATES_KEY, templates);
  } catch (e) {
    console.error('saveTemplates failed', e);
  }
}

export async function clearAllStorage() {
  await del(DOCS_KEY);
  await del(TEMPLATES_KEY);
}

/* ---------------- localStorage small stuff ---------------- */

export function loadCurrentId() {
  try { return localStorage.getItem(CURRENT_KEY); } catch { return null; }
}

export function saveCurrentId(id) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch { /* ignore */ }
}

/* ---------------- factories ---------------- */

export function createDocument(title = 'Untitled note') {
  return {
    id: uid(),
    title,
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deletedAt: null,
  };
}

export function createTemplate(title, content) {
  return {
    id: uid(),
    title: title || 'Untitled template',
    content: content || '',
    createdAt: Date.now(),
  };
}

/* ---------------- export / import ---------------- */

function slugify(str) {
  return (str || 'note')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'note';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadBlob(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function exportDocumentAsHtml(doc) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(doc.title)}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 760px;
    margin: 40px auto;
    padding: 0 24px;
    line-height: 1.7;
    color: #1a1a1c;
  }
  h1, h2, h3 { line-height: 1.25; margin: 1.4em 0 0.5em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #c9c9ce; padding: 8px 12px; }
  th { background: #dbeafe; text-align: left; }
  pre {
    background: #1a1a1c; color: #e6e6e8;
    padding: 14px 16px; border-radius: 8px; overflow-x: auto;
    font-family: ui-monospace, Menlo, Consolas, monospace;
  }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; }
  blockquote { border-left: 3px solid #4f46e5; padding-left: 1rem; color: #555; }
</style>
</head>
<body>
<h1>${escapeHtml(doc.title)}</h1>
${doc.content || '<p><em>Empty note</em></p>'}
</body>
</html>`;
  downloadBlob(html, `${slugify(doc.title)}.html`, 'text/html');
}

export function exportDocumentAsJson(doc) {
  downloadBlob(
    JSON.stringify(doc, null, 2),
    `${slugify(doc.title)}.json`,
    'application/json'
  );
}

export function exportDocumentAsMarkdown(doc) {
  downloadBlob(
    htmlToMarkdown(doc.content || ''),
    `${slugify(doc.title)}.md`,
    'text/markdown'
  );
}

/* Minimal HTML → Markdown converter */
function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node) => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return '';
    const inner = Array.from(node.childNodes).map(walk).join('');
    const tag = node.tagName.toLowerCase();
    switch (tag) {
      case 'h1': return `# ${inner}\n\n`;
      case 'h2': return `## ${inner}\n\n`;
      case 'h3': return `### ${inner}\n\n`;
      case 'p': return `${inner}\n\n`;
      case 'br': return '\n';
      case 'strong': case 'b': return `**${inner}**`;
      case 'em': case 'i': return `*${inner}*`;
      case 'u': return `<u>${inner}</u>`;
      case 's': case 'del': return `~~${inner}~~`;
      case 'code': return node.closest('pre') ? inner : `\`${inner}\``;
      case 'pre': return `\`\`\`\n${inner}\n\`\`\`\n\n`;
      case 'blockquote': return `> ${inner.trim().split('\n').join('\n> ')}\n\n`;
      case 'hr': return `---\n\n`;
      case 'ul': return Array.from(node.children).map((li) => `- ${walk(li).trim()}\n`).join('') + '\n';
      case 'ol': return Array.from(node.children).map((li, i) => `${i + 1}. ${walk(li).trim()}\n`).join('') + '\n';
      case 'li': return inner;
      case 'a': return `[${inner}](${node.getAttribute('href') || ''})`;
      case 'table': {
        const rows = Array.from(node.querySelectorAll('tr'));
        if (!rows.length) return '';
        const cells = (row) =>
          Array.from(row.children).map((c) => walk(c).trim().replace(/\n+/g, ' '));
        const head = cells(rows[0]);
        const body = rows.slice(1).map(cells);
        const sep = head.map(() => '---');
        return [
          `| ${head.join(' | ')} |`,
          `| ${sep.join(' | ')} |`,
          ...body.map((r) => `| ${r.join(' | ')} |`),
          '',
        ].join('\n') + '\n';
      }
      default: return inner;
    }
  };
  return walk(doc.body).trim();
}

export async function importFromFile(file) {
  const text = await file.text();

  if (file.name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    return {
      ...createDocument(parsed.title || 'Imported note'),
      content: parsed.content || '',
    };
  }

  let content = text;
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) content = bodyMatch[1];
  content = content.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/, '');

  const titleMatch = text.match(/<title>([^<]*)<\/title>/i);
  return {
    ...createDocument(
      titleMatch ? titleMatch[1] : file.name.replace(/\.html?$/i, '')
    ),
    content: content.trim(),
  };
}

/* Utility used by DocumentsModal for content search */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
}