import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

const icons = {
  undo: '<path d="M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12"/>',
  redo: '<path d="m15 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>',
  bold: '<path d="M6 12h8a4 4 0 0 1 0 8H6V4h7a4 4 0 0 1 0 8"/>',
  italic: '<path d="M19 4h-9m4 0L10 20m-5 0h9"/>',
  underline: '<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>',
  strike: '<path d="M17 5a6 6 0 0 0-10 1c-1 4 9 4 10 8a5 5 0 0 1-9 4M3 12h18"/>',
  bullet: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/>',
  ordered: '<path d="M10 6h11M10 12h11M10 18h11M3 3h1v6m-1 0h2m-3 5c0-3 4-3 4-1 0 2-4 3-4 6h4"/>',
  quote: '<path d="M10 5H4v7h6V5Zm10 0h-6v7h6V5ZM10 12c0 4-2 6-5 7m15-7c0 4-2 6-5 7"/>',
  left: '<path d="M3 5h18M3 10h12M3 15h18M3 20h12"/>',
  center: '<path d="M3 5h18M6 10h12M3 15h18M6 20h12"/>',
  right: '<path d="M3 5h18M9 10h12M3 15h18M9 20h12"/>',
  link: '<path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2" transform="translate(1 0) scale(.9)"/>',
  unlink: '<path d="m9 15-2 2a4 4 0 0 1-6-6l3-3m7-1 2-2a4 4 0 0 1 6 6l-3 3M3 3l18 18M9 2v2M2 9h2m11 13v-2m7-5h-2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  divider: '<path d="M3 12h18m-14-7h10M7 19h10"/>',
  clear: '<path d="m15 3 6 6-10 10H5L1 15 13 3h2ZM5 11l8 8m2 2h7"/>',
  focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
};
const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function safeLink(value) {
  const url = String(value || '').trim();
  if (!url || /[\u0000-\u0020\u007f\\]/.test(url)) return false;
  if (/^(?:\/(?!\/)|#)/.test(url)) return true;
  try { return ['https:', 'http:', 'mailto:'].includes(new URL(url).protocol); } catch { return false; }
}
function safeImage(value) {
  const url = String(value || '').trim();
  if (/^\/media\/[a-f\d-]{36}$/i.test(url)) return true;
  if (/[\u0000-\u0020\u007f\\]/.test(url)) return false;
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
}

// Treat imported and pasted HTML as content only; retain supported document formatting.
function cleanHTML(value) {
  const doc = new DOMParser().parseFromString(String(value || ''), 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,svg,math,form,input,button,textarea,select,link,meta').forEach(el => el.remove());
  for (const el of [...doc.body.querySelectorAll('*')]) {
    const tag = el.tagName.toLowerCase();
    const attrs = {};
    if (tag === 'a' && safeLink(el.getAttribute('href'))) attrs.href = el.getAttribute('href').trim();
    if (tag === 'img') {
      if (!safeImage(el.getAttribute('src'))) { el.remove(); continue; }
      attrs.src = el.getAttribute('src').trim();
      attrs.alt = el.getAttribute('alt') || '';
      if (el.getAttribute('title')) attrs.title = el.getAttribute('title');
    }
    if (tag === 'ol' && /^\d+$/.test(el.getAttribute('start') || '')) attrs.start = el.getAttribute('start');
    const styles = [];
    const alignment = el.style.textAlign;
    if (['left', 'center', 'right', 'justify'].includes(alignment)) styles.push(`text-align:${alignment}`);
    if (['bold', 'bolder', '600', '700', '800', '900'].includes(el.style.fontWeight)) styles.push('font-weight:bold');
    else if (el.style.fontWeight === 'normal') styles.push('font-weight:normal');
    if (el.style.fontStyle === 'italic') styles.push('font-style:italic');
    const decoration = el.style.textDecorationLine || el.style.textDecoration;
    const decorationStyles = ['underline', 'line-through'].filter(style => decoration.includes(style));
    if (decorationStyles.length) styles.push(`text-decoration:${decorationStyles.join(' ')}`);
    if (styles.length) attrs.style = styles.join(';');
    [...el.attributes].forEach(attr => el.removeAttribute(attr.name));
    Object.entries(attrs).forEach(([name, content]) => el.setAttribute(name, content));
    if (['figcaption', 'h1', 'h4', 'h5', 'h6'].includes(tag)) {
      const replacement = doc.createElement(tag === 'figcaption' ? 'p' : 'h2');
      replacement.append(...el.childNodes);
      el.replaceWith(replacement);
    }
  }
  return doc.body.innerHTML;
}

function existingMarkdown(value) {
  return String(value || '').split(/\n\s*\n/).map(block => {
    let html = escapeHTML(block).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    if (html.startsWith('### ')) return `<h3>${html.slice(4)}</h3>`;
    if (html.startsWith('## ')) return `<h2>${html.slice(3)}</h2>`;
    if (html.startsWith('&gt; ')) return `<blockquote><p>${html.slice(5).replace(/\n/g, '<br>')}</p></blockquote>`;
    if (html.split('\n').every(line => line.startsWith('- '))) return '<ul>' + html.split('\n').map(line => `<li><p>${line.slice(2)}</p></li>`).join('') + '</ul>';
    return `<p>${html.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

let nextEditorId = 0;

export function createRichEditor({ element, post = {}, onChange = () => {}, onUploadImage, onSave }) {
  const id = `rich-editor-${++nextEditorId}`;
  const abort = new AbortController();
  const listen = (node, event, handler) => node.addEventListener(event, handler, { signal: abort.signal });
  let changed = false;
  let editable = true;
  let uploading = false;
  let destroyed = false;
  let selectedRange = null;
  let imageFile = null;
  let editor;
  const button = (action, label, icon = action, shortcut = '') => `<button type="button" class="re-tool" data-action="${action}" aria-label="${label}" title="${label}${shortcut ? ` (${shortcut})` : ''}">${svg(icon)}</button>`;
  element.classList.add('rich-editor');
  element.innerHTML = `
    <div class="re-heading"><span class="re-mode"><i aria-hidden="true"></i>Visual editor</span><div class="re-heading-actions"><button type="button" class="re-save" hidden>Save draft</button><button type="button" class="re-focus" data-action="focus" aria-pressed="false" title="Expand the writing space">${svg('focus')}<span>Focus mode</span></button></div></div>
    <div class="re-toolbar" role="toolbar" aria-label="Document formatting">
      <div class="re-tools">${button('undo', 'Undo', 'undo', 'Ctrl/⌘ Z')}${button('redo', 'Redo', 'redo', 'Ctrl/⌘ Shift Z')}</div>
      <label class="re-style"><span class="re-sr-only">Paragraph style</span><select aria-label="Paragraph style"><option value="paragraph">Normal text</option><option value="2">Heading 2</option><option value="3">Heading 3</option></select></label>
      <div class="re-tools">${button('bold', 'Bold', 'bold', 'Ctrl/⌘ B')}${button('italic', 'Italic', 'italic', 'Ctrl/⌘ I')}${button('underline', 'Underline', 'underline', 'Ctrl/⌘ U')}${button('strike', 'Strikethrough')}</div>
      <div class="re-tools">${button('bulletList', 'Bulleted list', 'bullet')}${button('orderedList', 'Numbered list', 'ordered')}${button('blockquote', 'Block quote', 'quote')}</div>
      <div class="re-tools">${button('left', 'Align left')}${button('center', 'Align center')}${button('right', 'Align right')}</div>
      <div class="re-tools">${button('link', 'Add or edit link', 'link', 'Ctrl/⌘ K')}${button('unlink', 'Remove link')}${button('image', 'Insert image')}${button('divider', 'Insert divider')}${button('clear', 'Clear formatting')}</div>
    </div>
    <div class="re-scroll"><div class="re-paper"><div class="re-writing"></div></div></div>
    <div class="re-status"><span class="re-word-count">0 words</span><span class="re-editing-hint">Select text to format · <kbd>Ctrl/⌘</kbd> + <kbd>K</kbd> to link</span><span class="re-focus-hint" hidden>Saves privately. Publish when you are ready.</span></div>
    <p class="re-notice" role="status" hidden></p>
    <dialog class="re-dialog" aria-labelledby="${id}-link-title" data-dialog="link">
      <div class="re-dialog-head"><h2 id="${id}-link-title">Add a link</h2><button type="button" class="re-dialog-close" aria-label="Close link dialog">${svg('close')}</button></div>
      <p class="re-dialog-description">Help readers keep exploring.</p>
      <label class="re-field re-link-text"><span>Text to display</span><input type="text" maxlength="500" autocomplete="off" placeholder="Describe the link"></label>
      <label class="re-field"><span>Link address</span><input class="re-link-url" type="text" inputmode="url" autocomplete="off" placeholder="https://example.com" aria-describedby="${id}-link-hint"></label>
      <p class="re-dialog-hint" id="${id}-link-hint">Use a website address, email link, or a page on this site.</p>
      <p class="re-dialog-error" role="alert" hidden></p>
      <div class="re-dialog-actions"><button type="button" class="re-cancel">Cancel</button><button type="button" class="re-primary re-apply-link">Apply link</button></div>
    </dialog>
    <dialog class="re-dialog" aria-labelledby="${id}-image-title" data-dialog="image">
      <div class="re-dialog-head"><h2 id="${id}-image-title">Add an image</h2><button type="button" class="re-dialog-close" aria-label="Close image dialog">${svg('close')}</button></div>
      <p class="re-dialog-description">Place a photo right in your story.</p>
      <label class="re-field"><span>Choose an image</span><input class="re-image-file" type="file" accept="image/jpeg,image/png,image/webp"></label>
      <p class="re-dialog-hint re-file-name">JPG, PNG, or WebP · up to 25 MB</p>
      <label class="re-field"><span>Describe the image</span><input class="re-image-alt" type="text" maxlength="500" placeholder="What should someone using a screen reader know?"></label>
      <p class="re-dialog-error" role="alert" hidden></p>
      <div class="re-dialog-actions"><button type="button" class="re-cancel">Cancel</button><button type="button" class="re-primary re-apply-image" disabled>Insert image</button></div>
    </dialog>`;
  const $ = selector => element.querySelector(selector);
  const $$ = selector => [...element.querySelectorAll(selector)];
  const linkDialog = $('[data-dialog="link"]');
  const imageDialog = $('[data-dialog="image"]');
  const styleSelect = $('.re-style select');
  const notice = $('.re-notice');
  const marks = ['bold', 'italic', 'underline', 'strike', 'bulletList', 'orderedList', 'blockquote', 'link'];

  function notify(message) { notice.textContent = message; notice.hidden = !message; }
  function refresh() {
    if (!editor || destroyed) return;
    const text = editor.getText().trim();
    const words = text ? text.split(/\s+/u).length : 0;
    $('.re-word-count').textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}`;
    styleSelect.value = editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : 'paragraph';
    styleSelect.disabled = !editable || uploading;
    $('.re-save').disabled = !editable || uploading;
    $('.re-save').textContent = editable ? 'Save draft' : 'Saving…';
    for (const tool of $$('.re-tool')) {
      const action = tool.dataset.action;
      tool.disabled = !editable || uploading || (action === 'undo' && !editor.can().undo()) || (action === 'redo' && !editor.can().redo()) || (action === 'unlink' && !editor.isActive('link')) || (action === 'image' && !onUploadImage);
      if (marks.includes(action)) tool.setAttribute('aria-pressed', String(editor.isActive(action)));
      else if (['left', 'center', 'right'].includes(action)) tool.setAttribute('aria-pressed', String(editor.isActive({ textAlign: action }) || (action === 'left' && !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' }))));
    }
    element.classList.toggle('re-readonly', !editable);
  }
  function selection() { return { from: editor.state.selection.from, to: editor.state.selection.to }; }
  function restore() {
    let chain = editor.chain().focus();
    if (selectedRange) {
      const end = editor.state.doc.content.size;
      chain = chain.setTextSelection({ from: Math.min(selectedRange.from, end), to: Math.min(selectedRange.to, end) });
    }
    return chain;
  }
  function dialogError(dialog, message) {
    const error = dialog.querySelector('.re-dialog-error');
    error.textContent = message;
    error.hidden = !message;
  }
  function openLink() {
    if (!editable || uploading) return;
    selectedRange = selection();
    const selectedText = editor.state.doc.textBetween(selectedRange.from, selectedRange.to, ' ');
    $('.re-link-text').hidden = !!selectedText || editor.isActive('link');
    $('.re-link-text input').value = '';
    $('.re-link-url').value = editor.getAttributes('link').href || '';
    dialogError(linkDialog, '');
    linkDialog.showModal();
    $('.re-link-url').focus();
  }
  function openImage(file = null) {
    if (!editable || uploading || !onUploadImage) return;
    selectedRange = selection();
    imageFile = file;
    $('.re-image-file').value = '';
    $('.re-image-alt').value = '';
    $('.re-file-name').textContent = file ? file.name : 'JPG, PNG, or WebP · up to 25 MB';
    $('.re-apply-image').disabled = !file;
    dialogError(imageDialog, '');
    imageDialog.showModal();
    (file ? $('.re-image-alt') : $('.re-image-file')).focus();
  }

  editor = new Editor({
    element: $('.re-writing'),
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'], isAllowedUri: safeLink, HTMLAttributes: { target: null, rel: 'noopener noreferrer' } },
        trailingNode: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ allowBase64: false, HTMLAttributes: { loading: 'lazy' } }),
      Placeholder.configure({ placeholder: 'Start writing your story…' }),
    ],
    content: post.bodyDoc || cleanHTML(post.legacyHtml || existingMarkdown(post.body)),
    editorProps: {
      attributes: { 'aria-label': 'Story', role: 'textbox', 'aria-multiline': 'true', spellcheck: 'true', class: 're-document' },
      transformPastedHTML: cleanHTML,
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openLink(); return true; }
        return false;
      },
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files || [])].find(item => /^image\//.test(item.type));
        if (!file || !onUploadImage) return false;
        event.preventDefault(); openImage(file); return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        const file = [...(event.dataTransfer?.files || [])].find(item => /^image\//.test(item.type));
        if (moved || !file || !onUploadImage) return false;
        event.preventDefault(); openImage(file); return true;
      },
    },
    onUpdate: ({ transaction }) => { if (!destroyed && transaction.docChanged) { changed = true; refresh(); onChange(); } },
    onSelectionUpdate: refresh,
    onTransaction: refresh,
  });
  refresh();

  for (const tool of $$('[data-action]')) {
    listen(tool, 'mousedown', event => event.preventDefault());
    listen(tool, 'click', () => {
      const action = tool.dataset.action;
      if (action === 'focus') {
        const focused = element.classList.toggle('re-focused');
        tool.setAttribute('aria-pressed', String(focused));
        tool.querySelector('span').textContent = focused ? 'Exit focus mode' : 'Focus mode';
        tool.title = focused ? 'Return to the full editor' : 'Expand the writing space';
        $('.re-editing-hint').hidden = focused;
        $('.re-focus-hint').hidden = !focused;
        $('.re-save').hidden = !focused || !onSave;
        editor.commands.focus();
        return;
      }
      if (!editable || uploading) return;
      if (action === 'link') return openLink();
      if (action === 'image') return openImage();
      const chain = editor.chain().focus();
      const commands = {
        undo: () => chain.undo().run(), redo: () => chain.redo().run(),
        bold: () => chain.toggleBold().run(), italic: () => chain.toggleItalic().run(),
        underline: () => chain.toggleUnderline().run(), strike: () => chain.toggleStrike().run(),
        bulletList: () => chain.toggleBulletList().run(), orderedList: () => chain.toggleOrderedList().run(),
        blockquote: () => chain.toggleBlockquote().run(),
        left: () => chain.setTextAlign('left').run(), center: () => chain.setTextAlign('center').run(), right: () => chain.setTextAlign('right').run(),
        unlink: () => chain.extendMarkRange('link').unsetLink().run(),
        divider: () => chain.setHorizontalRule().run(),
        clear: () => chain.unsetAllMarks().clearNodes().unsetTextAlign().run(),
      };
      commands[action]?.(); refresh();
    });
  }
  listen(styleSelect, 'change', () => {
    if (styleSelect.value === 'paragraph') editor.chain().focus().setParagraph().run();
    else editor.chain().focus().setHeading({ level: Number(styleSelect.value) }).run();
  });
  listen($('.re-save'), 'click', async () => {
    if (!editable || uploading || !onSave) return;
    try { await onSave(); } catch (error) { if (!destroyed) notify(error.message || 'Your draft could not be saved. Please try again.'); }
  });
  function applyLink() {
    if (!editable || uploading) return;
    const href = $('.re-link-url').value.trim();
    const label = $('.re-link-text input').value.trim();
    if (!safeLink(href)) return dialogError(linkDialog, 'Enter a full http:// or https:// address, mailto: email link, or a site path starting with /.');
    if (!$('.re-link-text').hidden) {
      restore().insertContent({ type: 'text', text: label || href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else restore().extendMarkRange('link').setLink({ href }).run();
    linkDialog.close(); refresh();
  }
  listen($('.re-apply-link'), 'click', applyLink);
  for (const input of linkDialog.querySelectorAll('input')) listen(input, 'keydown', event => { if (event.key === 'Enter') { event.preventDefault(); applyLink(); } });
  listen($('.re-image-file'), 'change', event => {
    imageFile = event.target.files[0] || null;
    $('.re-apply-image').disabled = !imageFile;
    $('.re-file-name').textContent = imageFile ? imageFile.name : 'JPG, PNG, or WebP · up to 25 MB';
  });
  listen($('.re-apply-image'), 'click', async () => {
    if (!imageFile || !editable || uploading) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 25 * 1024 * 1024) return dialogError(imageDialog, 'Choose a JPG, PNG, or WebP image smaller than 25 MB.');
    uploading = true;
    const alt = $('.re-image-alt').value.trim();
    const submit = $('.re-apply-image');
    submit.textContent = 'Uploading…';
    imageDialog.querySelectorAll('button,input').forEach(control => { control.disabled = true; });
    editor.setEditable(false, false); refresh(); dialogError(imageDialog, '');
    try {
      const image = await onUploadImage(imageFile);
      if (destroyed) return;
      if (!safeImage(image?.src)) throw new Error('The upload did not return a valid image address. Please try again.');
      editor.setEditable(editable, false);
      restore().setImage({ src: image.src, alt: alt || image.alt || '' }).run();
      imageDialog.close(); notify('Image added. Save your draft to keep this change.');
    } catch (error) {
      if (!destroyed) dialogError(imageDialog, error.message || 'The image could not be uploaded. Please try again.');
    } finally {
      uploading = false;
      if (!destroyed) {
        imageDialog.querySelectorAll('button,input').forEach(control => { control.disabled = false; });
        submit.textContent = 'Insert image'; editor.setEditable(editable, false); refresh();
      }
    }
  });
  for (const dialog of [linkDialog, imageDialog]) {
    for (const button of dialog.querySelectorAll('.re-cancel,.re-dialog-close')) listen(button, 'click', () => dialog.close());
    listen(dialog, 'cancel', event => { if (uploading) event.preventDefault(); });
    listen(dialog, 'close', () => { if (!destroyed) editor.commands.focus(); });
  }
  listen(element, 'keydown', event => {
    if (event.key === 'Escape' && !linkDialog.open && !imageDialog.open && element.classList.contains('re-focused')) {
      event.preventDefault(); $('[data-action="focus"]').click();
    }
    if (event.key === 'Tab' && element.classList.contains('re-focused') && !linkDialog.open && !imageDialog.open) {
      const controls = $$('button:not(:disabled),select:not(:disabled),[contenteditable="true"]').filter(control => !control.closest('dialog') && control.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  // Editor changes use onChange; typing into a dialog must not dirty the outer post form.
  listen(element, 'input', event => event.stopPropagation());

  return {
    getJSON: () => editor.getJSON(),
    getText: () => editor.getText(),
    isChanged: () => changed,
    setEditable(value) {
      editable = !!value;
      editor.setEditable(editable && !uploading, false);
      if (!editable) { if (linkDialog.open) linkDialog.close(); if (imageDialog.open && !uploading) imageDialog.close(); }
      refresh();
    },
    focus: () => editor.commands.focus(),
    destroy() {
      destroyed = true;
      abort.abort();
      linkDialog.close(); imageDialog.close();
      editor.destroy();
      element.classList.remove('rich-editor', 're-focused', 're-readonly');
      element.replaceChildren();
    },
  };
}
