import { get, set, del } from 'idb-keyval';

const DOCS_KEY = 'anx-notes.docs';
const TEMPLATES_KEY = 'anx-notes.templates';
const CURRENT_KEY = 'anx-notes.currentDocId';
const TRASH_RETENTION_DAYS = 30;
let documentsWriteQueue = Promise.resolve();
let templatesWriteQueue = Promise.resolve();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeDocuments(value) {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set();
  return value
    .filter((doc) => doc && typeof doc === 'object')
    .map((doc) => {
      let id = typeof doc.id === 'string' && doc.id ? doc.id : uid();
      if (seenIds.has(id)) id = uid();
      seenIds.add(id);
      const now = Date.now();
      return {
        ...doc,
        id,
        title: typeof doc.title === 'string' ? doc.title : 'Untitled note',
        content: typeof doc.content === 'string' ? doc.content : '',
        createdAt: Number.isFinite(doc.createdAt) ? doc.createdAt : now,
        updatedAt: Number.isFinite(doc.updatedAt) ? doc.updatedAt : now,
        deletedAt: Number.isFinite(doc.deletedAt) ? doc.deletedAt : null,
        pinned: Boolean(doc.pinned),
        tags: Array.isArray(doc.tags)
          ? [...new Set(doc.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))]
          : [],
        folder: typeof doc.folder === 'string' ? doc.folder : '',
      };
    });
}

function normalizeTemplates(value) {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set();
  return value
    .filter((template) => template && typeof template === 'object')
    .map((template) => {
      let id = typeof template.id === 'string' && template.id ? template.id : uid();
      if (seenIds.has(id)) id = uid();
      seenIds.add(id);
      return {
        ...template,
        id,
        title: typeof template.title === 'string' && template.title ? template.title : 'Untitled template',
        content: typeof template.content === 'string' ? template.content : '',
        createdAt: Number.isFinite(template.createdAt) ? template.createdAt : Date.now(),
      };
    });
}

/* ---------------- IndexedDB docs ---------------- */

export async function loadDocuments() {
  try {
    const docs = normalizeDocuments(await get(DOCS_KEY));
    // Purge anything older than retention
    const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86400000;
    return docs.filter((d) => !d.deletedAt || d.deletedAt > cutoff);
  } catch {
    throw new Error('Could not read documents from browser storage.');
  }
}

export async function saveDocuments(docs) {
  // IndexedDB writes are asynchronous. Queue them so an older save cannot
  // finish after a newer save and restore stale document contents.
  const snapshot = normalizeDocuments(docs).map((doc) => ({ ...doc, tags: [...doc.tags] }));
  documentsWriteQueue = documentsWriteQueue
    .catch(() => undefined)
    .then(() => set(DOCS_KEY, snapshot));
  try {
    await documentsWriteQueue;
    return true;
  } catch (e) {
    console.error('saveDocuments failed', e);
    return false;
  }
}

export async function loadTemplates() {
  try {
    return normalizeTemplates(await get(TEMPLATES_KEY));
  } catch {
    throw new Error('Could not read templates from browser storage.');
  }
}

export async function saveTemplates(templates) {
  const snapshot = normalizeTemplates(templates);
  templatesWriteQueue = templatesWriteQueue
    .catch(() => undefined)
    .then(() => set(TEMPLATES_KEY, snapshot));
  try {
    await templatesWriteQueue;
    return true;
  } catch (e) {
    console.error('saveTemplates failed', e);
    return false;
  }
}

export async function clearAllStorage() {
  await Promise.all([
    documentsWriteQueue.catch(() => undefined),
    templatesWriteQueue.catch(() => undefined),
  ]);
  await del(DOCS_KEY);
  await del(TEMPLATES_KEY);
  try {
    [
      CURRENT_KEY,
      'anx-notes.recents',
      'anx-notes.readMode',
      'anx-notes.accent',
      'theme',
    ].forEach((key) => localStorage.removeItem(key));
  } catch {
    /* ignore unavailable localStorage */
  }
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
    pinned: false,
    tags: [],
    folder: '',
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

export function exportBackup(documents, templates = []) {
  downloadBlob(
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), documents, templates }, null, 2),
    `anx-notes-backup-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json'
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

function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
  const escape = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const inline = (value) => escape(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const output = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${inline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (!list) return;
    output.push(`<${list.type}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
      continue;
    }
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      output.push(`<blockquote><p>${inline(trimmed.slice(2))}</p></blockquote>`);
      continue;
    }
    if (/^```/.test(trimmed)) {
      flushParagraph();
      flushList();
      const code = [];
      for (index += 1; index < lines.length; index += 1) {
        const next = lines[index];
        if (next.trim().startsWith('```')) break;
        code.push(next);
      }
      output.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`);
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return output.join('');
}

export async function importBackupFile(file) {
  const text = await file.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('The backup file is invalid JSON.'); }
  if (!parsed || !Array.isArray(parsed.documents)) {
    throw new Error('This file is not an ANX Notes backup.');
  }
  return {
    documents: parsed.documents.map((source) => ({
      ...createDocument(source.title || 'Imported note'),
      content: typeof source.content === 'string' ? source.content : '',
      pinned: Boolean(source.pinned),
      tags: Array.isArray(source.tags) ? source.tags.filter((tag) => typeof tag === 'string') : [],
      folder: typeof source.folder === 'string' ? source.folder : '',
    })),
    templates: normalizeTemplates(parsed.templates).map((template) => createTemplate(template.title, template.content)),
  };
}

export async function importFromFile(file) {
  if (!file || typeof file.text !== 'function') {
    throw new Error('No readable file was selected.');
  }

  const text = await file.text();
  const fileName = file.name || 'Imported note';
  const lowerName = fileName.toLowerCase();
  const isJson = lowerName.endsWith('.json') || file.type === 'application/json';
  const isMarkdown = /\.markdown?$/.test(lowerName) || file.type === 'text/markdown';

  if (isJson) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The selected JSON file is invalid.');
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('The selected JSON file does not contain a note.');
    }
    return {
      ...createDocument(
        typeof parsed.title === 'string' && parsed.title.trim()
          ? parsed.title.trim()
          : 'Imported note'
      ),
      content: typeof parsed.content === 'string' ? parsed.content : '',
    };
  }

  if (isMarkdown) {
    const firstHeading = text.match(/^\s*#\s+(.+)$/m);
    const title = firstHeading?.[1]?.trim() || fileName.replace(/\.markdown?$/i, '') || 'Imported note';
    return { ...createDocument(title), content: markdownToHtml(text) };
  }

  // DOMParser decodes entities in the title and handles attributes/newlines
  // that the old regular expressions missed.
  const parsedHtml = new DOMParser().parseFromString(text, 'text/html');
  let content = parsedHtml.body?.innerHTML || text;
  const firstHeading = parsedHtml.body?.querySelector('h1');
  if (firstHeading && firstHeading === parsedHtml.body.firstElementChild) {
    firstHeading.remove();
    content = parsedHtml.body.innerHTML;
  }
  const title = parsedHtml.title?.trim() ||
    fileName.replace(/\.html?$/i, '') || 'Imported note';
  return {
    ...createDocument(title),
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
