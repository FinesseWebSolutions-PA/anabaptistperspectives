// The editor sends a document tree, never trusted HTML. Keep this allowlist in
// step with the editor extensions; discard attributes we do not render.
const MAX_NODES = 5000;
const MAX_DEPTH = 32;
const MAX_TEXT = 100000;
const blockNodes = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'codeBlock', 'horizontalRule', 'image']);
const markNames = new Set(['bold', 'italic', 'underline', 'strike', 'code', 'link']);
const alignments = new Set(['left', 'center', 'right', 'justify']);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const invalid = message => { throw new Error('The document ' + message); };

function shortString(value, max, name) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) invalid('has an invalid ' + name + '.');
  return value;
}

function linkURL(value) {
  const href = shortString(value, 2048, 'link').trim();
  // Backslashes and control characters can change how browsers interpret a URL.
  if (!href || /[\u0000-\u0020\u007f-\u009f\\]/.test(href) || href.startsWith('//')) invalid('has an unsafe link. Use a website address, email address, or page link.');
  const scheme = href.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && !['http', 'https', 'mailto'].includes(scheme)) invalid('has an unsafe link. Use a website address, email address, or page link.');
  if (scheme) {
    let url;
    try { url = new URL(href); } catch { invalid('has an invalid link.'); }
    if (url.username || url.password || ((scheme === 'http' || scheme === 'https') && !url.hostname)) invalid('has an invalid link.');
  }
  return href;
}

function imageURL(value) {
  const src = shortString(value, 2048, 'image address').trim();
  if (/^\/media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(src)) return src;
  if (/[\u0000-\u0020\u007f-\u009f\\]/.test(src)) invalid('has an invalid image address.');
  try {
    const url = new URL(src);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {}
  invalid('has an unsafe image. Use an uploaded image or an HTTPS address.');
}

export function validateRichText(doc) {
  let count = 0;
  let textLength = 0;
  function visit(node, depth, parent) {
    if (++count > MAX_NODES) invalid('has too many elements. Please split it into shorter pieces.');
    if (depth > MAX_DEPTH) invalid('is nested too deeply.');
    if (!object(node) || typeof node.type !== 'string') invalid('contains an invalid element.');
    const type = node.type;
    const attrs = object(node.attrs) ? node.attrs : {};
    const out = { type };
    if (parent === null) {
      if (type !== 'doc') invalid('must have a document root.');
    } else if (parent === 'paragraph' || parent === 'heading') {
      if (!['text', 'hardBreak'].includes(type)) invalid('contains an invalid paragraph element.');
    } else if (parent === 'codeBlock') {
      if (type !== 'text') invalid('contains an invalid code block.');
    } else if (parent === 'bulletList' || parent === 'orderedList') {
      if (type !== 'listItem') invalid('contains an invalid list item.');
    } else if (!blockNodes.has(type)) invalid('contains an unsupported element.');

    if (type === 'text') {
      if (typeof node.text !== 'string' || !node.text.length) invalid('contains invalid text.');
      textLength += node.text.length;
      if (textLength > MAX_TEXT) invalid('is too long. Please keep it under 100,000 characters.');
      out.text = node.text;
    }
    if (type === 'heading') {
      if (![2, 3].includes(attrs.level)) invalid('contains an unsupported heading. Use Heading 2 or Heading 3.');
      out.attrs = { level: attrs.level };
    }
    if (type === 'paragraph' || type === 'heading') {
      if (attrs.textAlign != null) {
        if (!alignments.has(attrs.textAlign)) invalid('contains an invalid text alignment.');
        out.attrs = { ...out.attrs, textAlign: attrs.textAlign };
      }
    }
    if (type === 'orderedList') {
      const start = attrs.start ?? 1;
      if (!Number.isInteger(start) || start < 1 || start > 1000000) invalid('contains an invalid list number.');
      out.attrs = { start };
    }
    if (type === 'image') {
      out.attrs = { src: imageURL(attrs.src), alt: shortString(attrs.alt, 2000, 'image description'), title: shortString(attrs.title, 1000, 'image title') };
    }
    if (node.marks != null) {
      if (!Array.isArray(node.marks) || node.marks.length > markNames.size || !['text', 'hardBreak'].includes(type) || parent === 'codeBlock') invalid('contains invalid text formatting.');
      const seen = new Set();
      out.marks = node.marks.map(mark => {
        if (!object(mark) || !markNames.has(mark.type) || seen.has(mark.type)) invalid('contains unsupported text formatting.');
        seen.add(mark.type);
        return mark.type === 'link' ? { type: 'link', attrs: { href: linkURL(mark.attrs?.href) } } : { type: mark.type };
      });
      if (!out.marks.length) delete out.marks;
    }
    if (['text', 'hardBreak', 'image', 'horizontalRule'].includes(type)) {
      if (node.content != null && (!Array.isArray(node.content) || node.content.length)) invalid('contains an invalid element.');
    } else {
      if (node.content != null && !Array.isArray(node.content)) invalid('contains invalid content.');
      out.content = (node.content || []).map(child => visit(child, depth + 1, type));
      if (type === 'listItem' && out.content[0]?.type !== 'paragraph') invalid('contains an invalid list item.');
      if (['bulletList', 'orderedList', 'blockquote'].includes(type) && !out.content.length) invalid('contains an empty list or quote.');
    }
    return out;
  }
  const result = visit(doc, 0, null);
  if (!result.content.length) result.content.push({ type: 'paragraph', content: [] });
  if (richTextPlain(result).length > MAX_TEXT) invalid('is too long. Please keep it under 100,000 characters.');
  return result;
}

export function renderRichText(doc) {
  const normalized = validateRichText(doc);
  const render = node => {
    const children = () => (node.content || []).map(render).join('');
    const alignment = node.attrs?.textAlign ? ` style="text-align:${node.attrs.textAlign}"` : '';
    let result;
    switch (node.type) {
      case 'doc': return children();
      case 'text': result = escape(node.text); break;
      case 'hardBreak': result = '<br>'; break;
      case 'paragraph': return `<p${alignment}>${children() || '<br>'}</p>`;
      case 'heading': return `<h${node.attrs.level}${alignment}>${children()}</h${node.attrs.level}>`;
      case 'blockquote': return `<blockquote>${children()}</blockquote>`;
      case 'bulletList': return `<ul>${children()}</ul>`;
      case 'orderedList': return `<ol start="${node.attrs.start}">${children()}</ol>`;
      case 'listItem': return `<li>${children()}</li>`;
      case 'codeBlock': return `<pre><code>${children()}</code></pre>`;
      case 'horizontalRule': return '<hr>';
      case 'image': return `<img src="${escape(node.attrs.src)}" alt="${escape(node.attrs.alt)}"${node.attrs.title ? ` title="${escape(node.attrs.title)}"` : ''} loading="lazy">`;
    }
    for (const mark of node.marks || []) {
      if (mark.type === 'link') result = `<a href="${escape(mark.attrs.href)}" rel="noopener noreferrer">${result}</a>`;
      else {
        const tag = { bold: 'strong', italic: 'em', underline: 'u', strike: 's', code: 'code' }[mark.type];
        result = `<${tag}>${result}</${tag}>`;
      }
    }
    return result;
  };
  return render(normalized);
}

export function richTextPlain(doc) {
  const plain = node => {
    if (node.type === 'text') return node.text;
    if (node.type === 'hardBreak') return '\n';
    if (node.type === 'image') return '';
    const inline = ['paragraph', 'heading', 'codeBlock'].includes(node.type);
    return (node.content || []).map(plain).join(inline ? '' : '\n\n');
  };
  return plain(doc).trim();
}

export function hasRichTextContent(doc) {
  return !!doc && (doc.type === 'image' || (doc.type === 'text' && !!doc.text.trim()) || (doc.content || []).some(hasRichTextContent));
}
