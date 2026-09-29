from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
import os
root=Path(__file__).resolve().parent.parent/'dist'
_prefix=(os.environ.get('SITE_PREFIX','/daimeng-website')).strip('/')
_prefix='/'+_prefix if _prefix else ''
class Check(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[];self.h1=0;self.title=0;self.description=0;self.canonical=0;self.json=False;self.schemas=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='h1':self.h1+=1
  if tag=='title':self.title+=1
  if tag=='meta' and a.get('name')=='description':self.description+=1
  if tag=='link' and a.get('rel')=='canonical':self.canonical+=1
  if 'id' in a:self.ids.append(a['id'])
  if tag in ['a','link','script','img']:
   value=a.get('href') or a.get('src')
   if value:self.links.append(value)
  if tag=='script' and a.get('type')=='application/ld+json':self.json=True
 def handle_data(self,d):
  if self.json:self.schemas.append(json.loads(d))
 def handle_endtag(self,t):
  if t=='script':self.json=False
errors=[];count=0;links=0
for p in root.rglob('*.html'):
 c=Check();c.feed(p.read_text(encoding='utf-8'));count+=1
 for key in ['h1','title','description','canonical']:
  if getattr(c,key)!=1:errors.append(f'{p}: {key} count {getattr(c,key)}')
 if len(c.ids)!=len(set(c.ids)):errors.append(f'{p}: duplicate ids')
 for href in c.links:
  u=urlsplit(href)
  if u.scheme or u.netloc:continue
  path=unquote(u.path)
  if _prefix and (path==_prefix or path.startswith(_prefix+'/')):path=path[len(_prefix):] or '/'
  links+=1;dest=root/path.lstrip('/') if path.startswith('/') else p.parent/path
  if not u.path:dest=p
  if dest.is_dir():dest=dest/'index.html'
  if not dest.is_file():errors.append(f'{p.relative_to(root)} broken link: {href}')
  elif u.fragment and dest.suffix=='.html':
   target=Check();target.feed(dest.read_text(encoding='utf-8'))
   if u.fragment not in target.ids:errors.append(f'{p.relative_to(root)} missing anchor: {href}')
print(f'Checked {count} HTML pages, {links} local links/assets, metadata, headings and structured data.')
if errors:print('\n'.join(errors));raise SystemExit(1)
print('PASS: no broken local links or asset references.')
