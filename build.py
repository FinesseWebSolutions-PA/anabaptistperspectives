import json,re,html,math,shutil
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from bs4 import BeautifulSoup
import bleach
ROOT=Path(__file__).parent; OUT=ROOT/'dist'; DATA=ROOT/'content'; BASE='https://anabaptistperspectives.org'
shutil.copytree(ROOT/'public/assets',OUT/'assets',dirs_exist_ok=True)
esc=lambda s:html.escape(str(s),quote=True)
def text(s):return BeautifulSoup(s or '', 'html.parser').get_text(' ',strip=True)
def load(n):return json.loads((DATA/n).read_text())
raw=[]
for f in sorted(DATA.glob('episodes*.json'))+sorted(DATA.glob('posts*.json')):
 x=json.loads(f.read_text())
 if isinstance(x,list):raw+=x
raw=list({p['id']:p for p in raw}.values());raw.sort(key=lambda p:p['date'],reverse=True)
pages=load('pages.json'); authors={}
phone=next(p for p in pages if p['slug']=='episodelist')
for a in BeautifulSoup(phone['content']['rendered'],'html.parser').select('a[href]'):
 line=a.get_text(' ',strip=True)
 m=re.search(r'#\s*(\d+)\s*-.*?—\s*(.+)',line)
 if m:authors[m[1]]=m[2]
# Source bylines from public page metadata, when available.
bylines=load('bylines.json') if (DATA/'bylines.json').exists() else {}
records=[]; terms={}
for p in raw:
 acf=p.get('acf') or {}; emb=p.get('_embedded') or {}; media=(emb.get('wp:featuredmedia') or [{}])[0]
 image=media.get('media_details',{}).get('sizes',{}).get('medium_large',{}).get('source_url') or media.get('source_url','')
 ts=[]
 for group in emb.get('wp:term',[]):
  for t in group:
   if 'name' not in t:continue
   path=urlparse(t['link']).path;terms[path]={'title':html.unescape(t['name']),'path':path};ts.append(path)
 kind='Episode' if p['type']=='episode' else 'Essay'; path=urlparse(p['link']).path
 premium=bool(acf.get('premium') or p['content'].get('protected') or str(acf.get('id','')).upper().startswith('P') or '/tag/partner/' in ts)
 body=p['content']['rendered'] or acf.get('description_source',{}).get('formatted_value') or ''
 if not body and acf.get('description'):body=''.join('<p>'+esc(x)+'</p>' for x in acf['description'].split('\r\n\r\n'))
 # Embedded Captivate records supply the original audio player.
 player=''
 for cap in emb.get('acf:post',[]):
  if cap.get('type')=='captivate_podcast':
   m=re.search(r'https://player\.captivate\.fm/[^"\s<>]+',cap.get('excerpt',{}).get('rendered',''))
   if m:player=m[0]
 y=acf.get('youtube') or {}; y=y.get('url','') if isinstance(y,dict) else y
 uid=''
 if y:
  u=urlparse(y);uid=u.path.strip('/') if u.netloc=='youtu.be' else parse_qs(u.query).get('v',[''])[0]
 r={'id':p['id'],'title':html.unescape(p['title']['rendered']),'path':path,'kind':kind,'date':p['date'][:10],'modified':p['modified'],'image':image,'excerpt':text(p['excerpt']['rendered']) or text(body)[:250],'body':body,'terms':ts,'number':str(acf.get('id','')),'premium':premium,'player':player,'youtube':uid,'byline':bylines.get(str(p['id'])) or authors.get(str(acf.get('id','')),'')}
 records.append(r)
known={r['path'] for r in records}|set(terms)|{'/','/episodes/','/essays/','/topics/','/about/','/team/','/follow/','/donate/','/contact/','/privacy/','/terms/','/episodelist/','/partners/','/origins/'}
for p in pages:
 if p['slug'] in ['about','privacy','terms']:known.add(urlparse(p['link']).path)
def clean(s):
 soup=BeautifulSoup(s or '', 'html.parser')
 for x in soup(['script','style','form','input','button','textarea','select']):x.decompose()
 for x in soup.find_all('iframe'):
  src=x.get('src','')
  if not any(h in src for h in ['player.captivate.fm','youtube.com/embed','youtube-nocookie.com/embed']):x.decompose()
  else:x.attrs={'src':src,'title':'Audio or video player','loading':'lazy','class':'player' if 'captivate' in src else 'video','allowfullscreen':''}
 for x in soup.find_all('a',href=True):
  try:u=urlparse(x['href'])
  except ValueError:
   del x['href'];continue
  if u.netloc=='anabaptistperspectives.org' and u.path in known and not u.query:x['href']=u.path+(('#'+u.fragment) if u.fragment else '')
 for x in soup.find_all('img'):
  if x.get('src','').startswith('/sites/'):
   x.decompose();continue
  x['loading']='lazy'
  if not x.get('alt'):x['alt']='Anabaptist Perspectives'
 return bleach.clean(str(soup),tags=['p','br','strong','b','em','i','a','ul','ol','li','h2','h3','h4','blockquote','sup','sub','hr','img','figure','figcaption','iframe','audio','source','table','thead','tbody','tr','td','th'],attributes={'a':['href','title'],'img':['src','alt','loading','width','height'],'iframe':['src','title','loading','class','allowfullscreen'],'audio':['src','controls'],'source':['src','type'],'*':['id']},strip=True)
head=BeautifulSoup((ROOT/'home-template.html').read_text(),'html.parser')
hero=str(head.select_one('main'))[6:-7]
nav='''<a class="skip" href="#main">Skip to content</a><header><div class="wrap nav"><a href="/" aria-label="Anabaptist Perspectives home"><img class="logo" src="/assets/logo.svg" width="260" height="67" alt="Anabaptist Perspectives"></a><button class="menu" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="navigation"><span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span></button><nav class="navlinks" id="navigation" aria-label="Main navigation"><a href="/episodes/">Watch & Listen</a><a href="/essays/">Read</a><a href="/topics/">Explore</a><a class="nav-origins" href="/origins/"><span class="nav-series-label">Video Series</span> <span>Origins</span></a><a href="/about/">About</a><a class="btn" href="/donate/">Support the mission</a></nav></div></header>'''
footer='''<footer><div class="wrap"><div class="footergrid"><div><a class="brand" href="/"><img class="logo" src="/assets/logo.svg" alt="Anabaptist Perspectives" width="240" height="62"></a><p>Using digital media to encourage allegiance to Jesus’ sacrificial kingdom.</p></div><div><h4>Explore</h4><a href="/episodes/">Watch & listen</a><a href="/essays/">Essays for King Jesus</a><a href="/topics/">Browse topics</a><a href="/origins/">Anabaptist Origins</a></div><div><h4>Our community</h4><a href="/about/">About us</a><a href="/follow/">Follow & subscribe</a><a href="/partners/">Partner program</a><a href="/episodelist/">Listen by phone</a></div><div><h4>Get involved</h4><a href="/donate/">Donate</a><a href="/contact/">Contact us</a><a href="https://media.anabaptistperspectives.org/Anabaptist-Perspectives-Essay-Submissions.pdf">Submit an essay</a><a href="https://anabaptistperspectives.org/wp-login.php">Member sign in</a></div></div><div class="bottom"><span>© 2026 Anabaptist Perspectives</span><span><a href="/privacy/">Privacy policy</a> · <a href="/terms/">Terms of use</a></span></div></div></footer>'''
newsletter='''<section class="wrap section"><div class="newsletter"><div><h2>A little perspective in your inbox.</h2><p>New conversations, thoughtful essays, and news from our work.</p></div><a class="btn" href="https://secure.lglforms.com/form_engine/s/IVQ4KbDjzbVOyKXzgibb7A">Join the mailing list</a></div></section>'''
paths=[]
def write(path,title,desc,body,schema=None):
 canonical=BASE+path
 structured=schema or {'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'description':desc}
 h=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | Anabaptist Perspectives</title><meta name="description" content="{esc(desc[:165])}"><link rel="canonical" href="{esc(canonical)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc[:165])}"><meta property="og:url" content="{esc(canonical)}"><meta name="twitter:card" content="summary"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%239b1b25'/%3E%3Ctext x='6' y='24' fill='white' font-family='Georgia' font-size='25'%3Ea%3C/text%3E%3C/svg%3E"><link rel="stylesheet" href="/assets/style.css?v=waveform-20261008"><script type="application/ld+json">{json.dumps(structured).replace('<','\\u003c')}</script><script defer src="/assets/app.js?v=collections-20260930"></script></head><body>{nav}<main id="main">{body}</main>{footer}</body></html>'''
 f=OUT/path.strip('/')/'index.html';f.parent.mkdir(parents=True,exist_ok=True);tmp=f.with_name('index.building.html');tmp.write_text(h);tmp.replace(f);paths.append(path)
def meta(r):return f'<div class="meta"><span class="red">{r["kind"]}{(" "+esc(r["number"])) if r["number"] else ""}{" · Partner" if r["premium"] else ""}</span><time datetime="{r["date"]}">{r["date"]}</time></div>'
def card(r):return f'''<article class="card"><a href="{r['path']}">{('<img src="'+esc(r['image'])+'" alt="'+esc(r['title'])+'" loading="lazy" width="768" height="432">') if r['image'] else ''}{meta(r)}<h3>{esc(r['title'])}</h3></a><p>{esc(r['byline'] or (r['excerpt'][:145]+'…' if len(r['excerpt'])>145 else r['excerpt']))}</p></article>'''
def grid(rs):return '<div class="grid">'+''.join(card(r) for r in rs)+'</div>'
def pagehead(k,t,d):return f'<div class="pagehead"><p class="eyebrow">{esc(k)}</p><h1>{esc(t)}</h1><p>{esc(d)}</p></div>'
episodes=[r for r in records if r['kind']=='Episode']; essays=[r for r in records if r['kind']=='Essay']
featured=[r for r in episodes if not r['premium']]
topic_specs=[
 ('/category/christian-living/','Christian Living','Following Jesus in the everyday.',13043),
 ('/category/theology/','Theology','Think deeply about what we believe.',15720),
 ('/category/history/','History','Meet the people who shaped our faith.',16087),
 ('/category/missions-evangelism/','Missions & Evangelism','Sharing the gospel. Serving our neighbors.',15913),
 ('/category/testimony-and-life-experience/','Testimony & Life','Real stories of faith and transformation.',14267),
 ('/tag/war/','War & Peace','Explore nonresistance and the way of Jesus.',16169),
]
topiclinks=''
for path,title,description,record_id in topic_specs:
 artwork=next(r for r in records if r['id']==record_id)
 assert path in artwork['terms']
 count=sum(path in r['terms'] for r in records)
 topiclinks+=f'''<a class="collection-card" href="{path}" aria-label="Explore {esc(title)}: {count} resources"><div class="collection-art"><img src="{esc(artwork['image'])}" alt="" width="768" height="432" loading="lazy"></div><div class="collection-copy"><h3>{esc(title)}</h3><p>{esc(description)}</p><div class="collection-footer"><span>{count} resources</span><span class="collection-action">Explore topic</span></div></div></a>'''
home=hero+f'''<section class="wrap section"><div class="sectionhead"><div><p class="eyebrow">Ideas worth sitting with</p><h2>More conversations.</h2></div><a class="textlink" href="/episodes/">Browse all episodes</a></div>{grid(featured[1:4])}</section><section class="mission"><div class="wrap"><div><p class="eyebrow">Our shared calling</p><h2>A faith to be lived.<br>A kingdom to serve.</h2></div><div><h2>What does following Jesus look like in everyday life?</h2><p>We explore that question through honest conversations, biblical teaching, and stories from the Anabaptist community. Our purpose is to encourage allegiance to Jesus’ sacrificial kingdom.</p><a class="textlink" href="/about/">The story behind our work</a></div></div></section><section class="wrap section"><div class="sectionhead"><div><p class="eyebrow">Explore the questions that matter</p><h2>Find your next perspective.</h2></div><a class="textlink" href="/topics/">All topics</a></div><div class="topic-collections">{topiclinks}</div></section><section class="wrap section"><div class="sectionhead"><div><p class="eyebrow">Essays for King Jesus</p><h2>Read. Reflect. Put it into practice.</h2></div><a class="textlink" href="/essays/">All essays</a></div>{grid(essays[:3])}</section>'''+newsletter
write('/','Following Jesus. Exploring faith. Living it out.','Explore Anabaptist interviews, podcasts, and essays on following Jesus, Scripture, Christian community, history, and everyday discipleship.',home,{'@context':'https://schema.org','@type':'Organization','name':'Anabaptist Perspectives','url':BASE,'logo':'https://media.anabaptistperspectives.org/2022/07/Horizontal-Color-2.svg','description':'Using digital media to encourage allegiance to Jesus’ sacrificial kingdom.','sameAs':['https://www.youtube.com/c/AnabaptistPerspectives','https://www.facebook.com/anabaptistperspectives/']})
def archive(path,title,desc,rs,kind='all'):
 count=max(1,math.ceil(len(rs)/24))
 for n in range(1,count+1):
  actual=path if n==1 else path+'page/'+str(n)+'/'
  options=''.join(f'<option value="{esc(t["path"])}">{esc(t["title"])}</option>' for t in terms.values() if t['path'].startswith('/category/'))
  filters=f'<form class="filters" role="search"><input id="search" name="q" type="search" aria-label="Search the archive" placeholder="Search titles, topics, or keywords…"><select id="topic" aria-label="Filter by topic"><option value="">All topics</option>{options}</select><button class="btn" type="submit">Search</button></form>'
  pagination='<nav class="pagination" aria-label="Archive pages">'+''.join(f'<a class="{"active" if n==i else ""}" href="{path if i==1 else path+"page/"+str(i)+"/"}" {"aria-current=page" if n==i else ""}>{i}</a>' for i in range(1,count+1))+'</nav>'
  body=f'<section class="wrap section" data-archive="{kind}" data-scope="{esc(path if path in terms else "")}">{pagehead("The library",title,desc)}{filters}<p class="results" aria-live="polite">{len(rs)} {"essays" if kind=="Essay" else "conversations" if kind=="Episode" else "resources"} · Page {n} of {count}</p><div class="archive grid" id="archive-results">'+''.join(card(r) for r in rs[(n-1)*24:n*24])+f'</div>{pagination}</section>'
  write(actual,title+(f' — Page {n}' if n>1 else ''),desc,body)
archive('/episodes/','Conversations that go deeper.','Watch and listen to interviews on Christian faith, Anabaptist history, and following Jesus in everyday life.',episodes,'Episode')
archive('/essays/','Space for deeper reflection.','Read Essays for King Jesus: biblical reflection, Christian living, theology, and the life of the church.',essays,'Essay')
for path,t in terms.items():
 rs=[r for r in records if path in r['terms']]
 if rs:archive(path,t['title'],'Explore conversations and essays about '+t['title'].lower()+'.',rs)
for r in records:
 media=''
 if not r['premium']:
  if r['youtube']:media+=f'<iframe class="video" src="https://www.youtube-nocookie.com/embed/{esc(r["youtube"])}" title="{esc(r["title"])}" loading="lazy" allowfullscreen></iframe>'
  elif r['image']:media+=f'<img class="cover" src="{esc(r["image"])}" alt="{esc(r["title"])}" width="1280" height="720">'
  if r['player']:media+=f'<iframe class="player" src="{esc(r["player"])}" title="Listen to {esc(r["title"])}" loading="lazy"></iframe>'
  body=clean(r['body'])
 else:body=f'<p>{esc(r["excerpt"])}</p><p>This conversation is part of the partner library.</p><a class="btn" href="{BASE+r["path"]}">Sign in to watch on Anabaptist Perspectives</a>'
 tags='<div class="tags">'+''.join(f'<a href="{t}">{esc(terms[t]["title"])}</a>' for t in r['terms'])+'</div>'
 related=[x for x in records if x['id']!=r['id'] and set(x['terms'])&set(r['terms'])][:3]
 htmlbody=f'<div class="wrap"><article class="article"><a class="textlink" href="/{"episodes" if r["kind"]=="Episode" else "essays"}/">All {r["kind"].lower()}s</a><div style="margin-top:30px">{meta(r)}</div><h1>{esc(r["title"])}</h1>{("<p>"+esc(r["byline"])+"</p>") if r["byline"] else ""}{media}<div class="prose">{body}</div>{tags}<a class="textlink" href="{BASE+r["path"]}">View original publication</a></article><section class="section"><div class="sectionhead"><h2>Keep exploring.</h2></div>{grid(related)}</section></div>'
 schema={'@context':'https://schema.org','@type':'Article','headline':r['title'],'datePublished':r['date'],'dateModified':r['modified'],'description':r['excerpt'][:200],'mainEntityOfPage':BASE+r['path'],'publisher':{'@type':'Organization','name':'Anabaptist Perspectives'},'isAccessibleForFree':not r['premium']}
 if r['image']:schema['image']=r['image']
 if r['byline']:schema['author']={'@type':'Person','name':r['byline']}
 write(r['path'],r['title'],r['excerpt'],htmlbody,schema)
write('/topics/','Explore by topic','Discover Anabaptist conversations and essays by subject, from theology and history to Christian living.',f'<section class="wrap section">{pagehead("Follow your curiosity","There’s more to explore.","Start with a question, a subject, or a part of life you want to think about more deeply.")}<h2>Core subjects</h2><div class="topics">'+''.join(f'<a class="topic" href="{p}">{esc(t["title"])}<small>{sum(p in r["terms"] for r in records)}</small></a>' for p,t in terms.items() if p.startswith('/category/'))+'</div><h2 style="margin-top:60px">All topics</h2><div class="tags">'+''.join(f'<a href="{p}">{esc(t["title"])}</a>' for p,t in sorted(terms.items(),key=lambda x:x[1]['title']) if not p.startswith('/category/'))+'</div></section>')
for slug in ['privacy','terms']:
 p=next(p for p in pages if p['slug']==slug)
 write('/'+slug+'/',html.unescape(p['title']['rendered']),text(p['content']['rendered'])[:160],f'<div class="wrap"><article class="article"><p class="eyebrow">Anabaptist Perspectives</p><h1>{esc(html.unescape(p["title"]["rendered"]))}</h1><div class="prose">{clean(p["content"]["rendered"])}</div></article></div>')
follow='''<div class="split"><div><h2>Watch & listen</h2><a class="biglink" href="https://www.youtube.com/c/AnabaptistPerspectives">YouTube</a><a class="biglink" href="https://anabaptist-perspectives.captivate.fm/listen">Anabaptist Perspectives podcast</a><a class="biglink" href="https://essays-for-king-jesus.captivate.fm/listen">Essays for King Jesus podcast</a><a class="biglink" href="/episodelist/">Listen by phone</a></div><div><h2>Stay in touch</h2><a class="biglink" href="https://www.facebook.com/anabaptistperspectives/">Facebook</a><a class="biglink" href="https://www.instagram.com/anabaptist_perspectives/">Instagram</a><a class="biglink" href="https://t.me/AnabaptistPerspectives">Telegram / CloudVeil</a><a class="biglink" href="https://t.me/essaysforkingjesus">Essays on Telegram</a></div></div>'''
write('/follow/','Follow Anabaptist Perspectives','Find Anabaptist Perspectives on YouTube, podcasts, social platforms, and email.',f'<section class="wrap section">{pagehead("Stay connected","Good company for your journey.","Watch, listen, or read wherever you are. Find us on your favorite platform.")}{follow}</section>'+newsletter)
write('/donate/','Support the mission','Support the conversations, stories, and teaching of Anabaptist Perspectives.',f'<section class="wrap section">{pagehead("Make the work possible","Help these conversations reach further.","Your gifts help encourage allegiance to Jesus’ sacrificial kingdom through a growing library of stories, conversations, and teaching.")}<div class="split"><div><h2>Give online</h2><p>Make a gift through Anabaptist Perspectives’ secure donation service.</p><a class="btn" href="https://anabaptistperspectives.org/donate/">Continue to secure giving</a><p><a class="textlink" href="https://anabaptistperspectives.org/donor-dashboard/">Manage existing donations</a></p></div><div><h2>Give by mail</h2><p>Checks payable to Anabaptist Perspectives may be mailed to:</p><address>Anabaptist Perspectives<br>127 County Road 616<br>Athens, TN 37303</address><p><a class="textlink" href="/contact/">Questions about giving? Contact us</a></p></div></div></section>')
write('/contact/','Contact Anabaptist Perspectives','Get in touch with the Anabaptist Perspectives team.',f'<section class="wrap section">{pagehead("Get in touch","We’d like to hear from you.","Share a question, suggest a conversation, or get in touch about our work.")}<a class="btn" href="https://secure.lglforms.com/form_engine/s/AsIOk0gP2BRJE4qU9N-frw">Open our contact form</a></section>'+newsletter)
write('/partners/','Partner with Anabaptist Perspectives','Support Anabaptist Perspectives and explore the partner library.',f'<section class="wrap section">{pagehead("Share in the mission","Become part of the work.","Support the conversations and teaching you value, and stay connected through the partner program.")}<div class="actions"><a class="btn" href="https://anabaptistperspectives.org/?page_id=837">Explore the partner program</a><a class="btn outline" href="https://anabaptistperspectives.org/wp-login.php">Partner sign in</a></div></section><section class="wrap section">{grid([r for r in records if r["premium"]][:6])}</section>')
from origins import build_origins
build_origins(write)
write('/episodelist/','Listen by phone','Listen to Anabaptist Perspectives by calling (737) 773-2848 and entering an episode number.',f'<section class="wrap section">{pagehead("Anabaptist Perspectives, offline","A conversation is just a call away.","Call (737) 773-2848 and enter the three-digit episode number to listen. Essays and Developing as a Servant are not available by phone.")}<a class="btn" href="tel:+17377732848">Call (737) 773-2848</a><div style="margin-top:40px">'+''.join(f'<a class="biglink" href="{r["path"]}"><span class="number">{esc(r["number"])}</span>{esc(r["title"])}</a>' for r in episodes if r['number'].isdigit() and not r['premium'])+'</div></section>')

# Recompose the full About page from its original public text and portraits.
about=next(p for p in pages if p['slug']=='about'); about_soup=BeautifulSoup(about['content']['rendered'],'html.parser')
lines=list(about_soup.stripped_strings)
vision=lines[lines.index('Our Vision')+1]; mission=lines[lines.index('Our Mission')+1:lines.index('Our')]
values=lines[lines.index('Our Values and Approach')+1:lines.index('Our Reach')]
team_start=lines.index('Our Team')+1;board_start=lines.index('Our Board of Directors');process_start=lines.index('Our Process')
portraits=[x['src'] for x in about_soup.find_all('img')][9:]
teamhtml=''
teamlines=lines[team_start:board_start]
for i in range(0,len(teamlines),3):
 name,role,bio=teamlines[i:i+3];idx=i//3
 teamhtml+=f'<article class="card"><img class="portrait" src="{esc(portraits[idx])}" alt="{esc(name)}" loading="lazy" width="300" height="300"><h3>{esc(name)}</h3><div class="meta">{esc(role)}</div><p>{esc(bio)}</p></article>'
boardnames=['Vinson Miller','Jason Eby','Geryll Zehr','Duane Wadel','Chester Weaver','Byron Miller','Arlyn Kauffman'];boardhtml=''
for i,name in enumerate(boardnames):
 start=lines.index(name,board_start)+1;end=lines.index(boardnames[i+1],start) if i+1<len(boardnames) else process_start
 boardhtml+=f'<article class="card"><img class="portrait" src="{esc(portraits[i+6])}" alt="{esc(name)}" loading="lazy" width="300" height="300"><h3>{esc(name)}</h3><p>{esc(" ".join(lines[start:end]))}</p></article>'
report=next((a.get('href') for a in about_soup.find_all('a',href=True) if '2025' in a.get_text()),BASE+'/about/')
def source_heading(name):
 return next(h for h in about_soup.find_all(['h1','h2']) if h.get_text(' ',strip=True)==name)
mission_markup=clean(str(source_heading('Our Mission').find_next('ol')))
values_markup=clean(str(source_heading('Our Values and Approach').find_next('ul')))
topic_markup=''
for node in source_heading('The Topics We Cover').find_next_siblings():
 if node.name=='h2':break
 if node.name=='p':topic_markup+=clean(str(node))
story_node=source_heading('Our Story').parent
story_copy=story_node.find('p').get_text(' ',strip=True)
story_url=story_node.find('a',href=True)['href']
conversation_copy=source_heading('Our Conversations').parent.find('p').get_text(' ',strip=True)
process_markup=''
for h in source_heading('Our Process').parent.find_all('h3'):
 process_markup+=f'<article class="card"><h3>{esc(h.get_text(" ",strip=True))}</h3><p>{esc(h.find_next("p").get_text(" ",strip=True))}</p></article>'
reach_markup=''
for counter in source_heading('Our Reach').parent.select('.ib-counter-container'):
 value=counter.select_one('.ib-counter').get_text(' ',strip=True)
 label=counter.select_one('.ib-counter-title').get_text(' ',strip=True)
 reach_markup+=f'<div class="card"><h3>{esc(value)}</h3><p>{esc(label)}</p></div>'
platforms=[('Apple Podcasts','https://podcasts.apple.com/us/podcast/anabaptist-perspectives/id1328156915'),('Spotify','https://open.spotify.com/show/5ioq20ieTtePlADvRVNEiO'),('YouTube','https://www.youtube.com/anabaptistperspectives'),('Facebook','https://www.facebook.com/anabaptistperspectives'),('Instagram','https://www.instagram.com/anabaptist_perspectives/'),('Telegram','https://t.me/AnabaptistPerspectives'),('Patreon','https://www.patreon.com/anabaptistperspectives?fan_landing=true'),('RSS feed','https://anabaptist-perspectives.captivate.fm/rssfeed')]
platform_markup='<div class="tags">'+''.join(f'<a href="{esc(url)}">{esc(name)}</a>' for name,url in platforms)+'</div>'
aboutbody=f'''<section class="wrap section"><div class="pagehead"><p class="eyebrow">Our Vision</p><h1>{esc(vision)}</h1></div><div class="split"><div><h2>Our Mission</h2><div class="prose">{mission_markup}</div></div><div><h2>Our Story</h2><p>{esc(story_copy)}</p><div class="actions"><a class="btn" href="{esc(story_url)}">Watch our story</a><a class="btn outline" href="{esc(report)}">Read the 2025 Ministry Report</a></div></div></div></section><section class="mission"><div class="wrap"><div><p class="eyebrow">Our Conversations</p><h2>God, the church, and radical discipleship.</h2></div><div><p>{esc(conversation_copy)}</p><a class="textlink" href="/episodes/">Explore our conversations</a></div></div></section><section class="wrap"><article class="article"><h2>The Topics We Cover</h2><div class="prose">{topic_markup}</div><h2 id="values">Our Values and Approach</h2><div class="prose">{values_markup}</div></article></section><section class="wrap section"><h2>Our Reach</h2><p>Figures published on Anabaptist Perspectives’ About page, checked September 30, 2026.</p><div class="grid">{reach_markup}</div><h2 style="margin-top:40px">Find us on your favorite app!</h2>{platform_markup}</section><section class="wrap section"><div class="sectionhead"><h2>Our Team</h2></div><div class="grid team">{teamhtml}</div></section><section class="wrap section"><h2>Our Board of Directors</h2><div class="grid team" style="margin-top:30px">{boardhtml}</div></section><section class="wrap section"><div class="sectionhead"><h2>Our Process</h2></div><div class="grid">{process_markup}</div></section>'''+newsletter
write('/about/','About Anabaptist Perspectives',vision,aboutbody)
for slug in ['events','covid19-d94','giving-tuesday','slider-pagescall-to-discipleship']:
 p=next(p for p in pages if p['slug']==slug)
 body=clean(p['content']['rendered'])
 if text(body):write('/'+slug+'/',text(p['title']['rendered']),text(body)[:165],f'<div class="wrap"><article class="article"><h1>{esc(text(p["title"]["rendered"]))}</h1><div class="prose">{body}</div></article></div>')

# Preserve public aliases without duplicating content in search results.
for old,new in [('/team/','/about/'),('/follw2/','/follow/'),('/about-2/','/about/')]:
 write(old,'Continue to Anabaptist Perspectives','Continue to the requested page.',f'<section class="wrap section"><h1>Continue exploring.</h1><p><a class="btn" href="{new}">Open page</a></p></section>')
# Public search index excludes full article bodies and all restricted media.
(OUT/'assets/search.json').write_text(json.dumps([{k:r[k] for k in ['id','title','path','kind','date','image','excerpt','terms','number','premium','byline']} for r in records]))
(OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+esc(BASE+p)+'</loc></url>' for p in paths)+'</urlset>')
(OUT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+BASE+'/sitemap.xml\n')
(OUT/'404.html').write_text((OUT/'contact/index.html').read_text().replace('We’d like to hear from you.','This page could not be found.').replace('Share a question, suggest a conversation, or get in touch about our work.','Visit the home page or browse our episodes and essays using the navigation.'))
manifest=json.loads((ROOT/'.openai/hosting.json').read_text());manifest.pop('static',None);(ROOT/'.openai/hosting.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'pages':len(paths),'episodes':len(episodes),'essays':len(essays),'topics':len(terms),'premium':sum(r['premium'] for r in records)}))

# Private build-time catalog for the dynamic editorial workspace.
(ROOT/'worker').mkdir(exist_ok=True)
(ROOT/'worker/generated-catalog.json').write_text(json.dumps([dict(id='legacy-'+str(r['id']), type=r['kind'].lower(), title=r['title'], slug=r['path'].strip('/').split('/')[-1], path=r['path'], excerpt=r['excerpt'], body=BeautifulSoup(r['body'],'html.parser').get_text('\n',strip=True), legacyHtml=clean(r['body']), image=r['image'], alt=r['title'], author=r['byline'], date=r['date'], youtube=r['youtube'], audio=r['player'], number=r['number'], topics=[terms[t]['title'] for t in r['terms'] if t in terms], terms=r['terms'], premium=r['premium']) for r in records]))
