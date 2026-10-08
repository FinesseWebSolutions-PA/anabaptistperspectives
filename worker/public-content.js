import sanitizeHtml from 'sanitize-html';
import { renderRichText } from './rich-text.js';

function plainHtml(text) {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return String(text || '').split(/\n\s*\n/).map(p => {
    let value = escape(p).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    if (value.startsWith('## ')) return '<h2>' + value.slice(3) + '</h2>';
    return '<p>' + value.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}

export function publicSummary(post) {
  const result = {};
  for (const key of ['id','type','slug','path','title','excerpt','author','date','number','image','alt']) result[key] = String(post[key] || '');
  result.premium = !!post.premium;
  result.topics = Array.isArray(post.topics) ? post.topics : [];
  result.terms = Array.isArray(post.terms) ? post.terms : [];
  for (const key of ['youtube','audio','video','file']) result[key] = post.premium ? '' : String(post[key] || '');
  if (post.premium && result.image.startsWith('/media/')) result.image = '';
  return result;
}

export function publicPage(posts, pathname) {
  const path = pathname === '/' ? '/' : '/' + pathname.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '') + '/';
  const post = posts.find(item => item.path === path);
  let articleHtml = '';
  if (post && !post.premium) {
    const raw = post.bodyDoc ? renderRichText(post.bodyDoc) : post.legacyHtml || plainHtml(post.body);
    articleHtml = sanitizeHtml(raw, {
      allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'iframe', 'h1'],
      allowedAttributes: { a: ['href','title','target','rel'], img: ['src','alt','width','height','loading'], iframe: ['src','title','allow','allowfullscreen','loading','width','height'], '*': ['class','id'], h2: ['style'], h3: ['style'], p: ['style'], ol: ['start'] },
      allowedStyles: { '*': { 'text-align': [/^(left|center|right|justify)$/] } },
      allowedSchemes: ['https','mailto','tel'],
      allowProtocolRelative: false,
      allowedIframeHostnames: ['www.youtube-nocookie.com','www.youtube.com','player.captivate.fm'],
      transformTags: { a: sanitizeHtml.simpleTransform('a', {rel:'noopener noreferrer'}) },
    });
  }
  return { records: posts.map(publicSummary), articleHtml };
}
