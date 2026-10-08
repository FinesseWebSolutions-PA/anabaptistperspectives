import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateRichText, renderRichText, richTextPlain, hasRichTextContent} from '../worker/rich-text.js';

const text = (value, marks) => ({type:'text', text:value, ...(marks ? {marks} : {})});
const paragraph = (...content) => ({type:'paragraph', content});
const doc = (...content) => ({type:'doc', content});
const linkDoc = href => doc(paragraph(text('Read further', [{type:'link', attrs:{href}}])));

test('rich documents retain useful formatting and a separate plain-text representation', () => {
  const input = doc(
    {type:'heading', attrs:{level:2, textAlign:'center'}, content:[text('A lasting conviction')]},
    paragraph(text('Faith', [{type:'bold'}, {type:'italic'}, {type:'underline'}]), text(' in practice.'), {type:'hardBreak'}, text('A second line.')),
    {type:'orderedList', attrs:{start:3}, content:[{type:'listItem', content:[paragraph(text('Third thought'))]}]},
    {type:'bulletList', content:[{type:'listItem', content:[paragraph(text('A detail'))]}]},
    {type:'blockquote', content:[paragraph(text('Remember this.'))]},
    {type:'codeBlock', content:[text('<script>not executable</script>')]},
    {type:'image', attrs:{src:'https://example.com/photo.jpg', alt:'A historic church', title:'Exterior'}},
    {type:'horizontalRule'},
    paragraph(text('Former wording', [{type:'strike'}]), text(' code', [{type:'code'}]))
  );
  const normalized = validateRichText(input);
  assert.deepEqual(validateRichText(JSON.parse(JSON.stringify(normalized))), normalized, 'Saved JSON must reopen without changing the document.');
  const html = renderRichText(normalized);
  assert.match(html, /<h2 style="text-align:center">A lasting conviction<\/h2>/);
  assert.match(html, /<u><em><strong>Faith<\/strong><\/em><\/u>/);
  assert.match(html, /<ol start="3"><li><p>Third thought<\/p><\/li><\/ol>/);
  assert.match(html, /<ul><li><p>A detail<\/p><\/li><\/ul>/);
  assert.match(html, /<blockquote><p>Remember this\.<\/p><\/blockquote>/);
  assert.match(html, /<pre><code>&lt;script&gt;not executable&lt;\/script&gt;<\/code><\/pre>/);
  assert.match(html, /<s>Former wording<\/s>/);
  assert.match(html, /<code> code<\/code>/);
  assert.match(html, /alt="A historic church"/);
  const plain = richTextPlain(normalized);
  assert.ok(plain.includes('Faith in practice.\nA second line.'));
  assert.ok(plain.includes('Third thought'));
  assert.ok(!plain.includes('<strong>'));
  assert.ok(hasRichTextContent(normalized));
});

test('rendering escapes text and attributes and discards unrecognized HTML properties', () => {
  const normalized = validateRichText(doc(
    {type:'paragraph', attrs:{onclick:'alert(1)', style:'background:url(javascript:alert(1))'}, content:[text('<img src=x onerror=alert(1)> & "quoted"')]},
    {type:'image', attrs:{src:'https://example.com/picture.jpg', alt:'" onerror="alert(1)', title:'<script>alert(1)</script>', onerror:'alert(1)'}},
    paragraph(text('A source', [{type:'link', attrs:{href:'https://example.com/?one=1&two=2', onclick:'alert(1)', target:'_blank'}}]))
  ));
  const html = renderRichText(normalized);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot;'));
  assert.ok(html.includes('alt="&quot; onerror=&quot;alert(1)"'));
  assert.ok(html.includes('title="&lt;script&gt;alert(1)&lt;/script&gt;"'));
  assert.ok(html.includes('href="https://example.com/?one=1&amp;two=2"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes(' onclick='));
  assert.ok(!html.includes(' onerror="'));
  assert.ok(!JSON.stringify(normalized).includes('background:url'));
});

test('unsafe link and image addresses cannot enter saved documents', () => {
  for (const href of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,bad', 'vbscript:bad', '//evil.example/', '/\\evil.example/', 'https://user:password@example.com/', 'java\nscript:alert(1)']) {
    assert.throws(() => validateRichText(linkDoc(href)), undefined, href);
  }
  for (const href of ['https://example.com/story', 'http://example.com/story', 'mailto:reader@example.com', '/origins/resources/', '#timeline']) {
    assert.equal(validateRichText(linkDoc(href)).content[0].content[0].marks[0].attrs.href, href);
  }
  for (const src of ['javascript:alert(1)', 'data:image/svg+xml,bad', '//example.com/image.png', 'http://example.com/image.png', '/media/not-a-file-id', 'https://user:password@example.com/image.png']) {
    assert.throws(() => validateRichText(doc({type:'image', attrs:{src}})), undefined, src);
  }
  assert.ok(hasRichTextContent(validateRichText(doc({type:'image', attrs:{src:'/media/8c5d9ad5-7d00-4046-b8db-427fedc998a0'}}))), 'An image-only story is substantive content.');
});

test('malformed structure, unsupported formatting, and excessive documents are rejected', () => {
  for (const input of [
    {type:'paragraph', content:[]},
    doc({type:'script', content:[]}),
    doc({type:'heading', attrs:{level:1}, content:[text('Page heading')]}),
    doc({type:'paragraph', attrs:{textAlign:'center;color:red'}, content:[text('Invalid CSS')]}),
    doc(paragraph({type:'image', attrs:{src:'https://example.com/image.png'}})),
    doc({type:'bulletList', content:[paragraph(text('Missing list item'))]}),
    doc({type:'orderedList', attrs:{start:-1}, content:[{type:'listItem', content:[paragraph(text('Invalid start'))]}]}),
    doc(paragraph(text('Unsupported', [{type:'style', attrs:{color:'red'}}]))),
    doc(paragraph(text('Duplicated', [{type:'bold'}, {type:'bold'}]))),
    doc(paragraph(text('x'.repeat(100001)))),
    doc(...Array.from({length:5001}, () => paragraph())),
  ]) assert.throws(() => validateRichText(input));
  let nested = paragraph(text('Too deep'));
  for (let depth=0; depth<34; depth++) nested={type:'blockquote', content:[nested]};
  assert.throws(() => validateRichText(doc(nested)));
  const empty = validateRichText(doc());
  assert.equal(richTextPlain(empty), '');
  assert.equal(hasRichTextContent(empty), false);
});
