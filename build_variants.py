# Step 2. Builds: dist/lingoa.html (Claude artifact), dist-pwa/ (installable web app), dist-offline/ (single double-click file)
import json, base64, hashlib, os, shutil
B=os.path.dirname(os.path.abspath(__file__))+'/'
SH=B+'assets/'
css=open(B+'app/style.css',encoding='utf8').read()
js=''.join(open(B+'app/'+f,encoding='utf8').read()+'\n' for f in ('core.js','views.js','session.js'))
fsrs=open(B+'data/fsrs/fsrs.iife.js',encoding='utf8').read()
content=json.load(open(B+'data/content.json',encoding='utf8'))
for it in content['items']: it.pop('pic',None)
strokes=json.load(open(B+'data/strokes.json',encoding='utf8'))
pics=json.load(open(B+'data/illus/decor_all.json',encoding='utf8'))
def J(o): return json.dumps(o,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
DATA=f"window.__C={J(content)};window.__S={J(strokes)};window.__P={J(pics)};"
DESC="Learn hiragana, katakana and your first Japanese words with picture mnemonics, two voices and spaced repetition."
FONTS=[('Klee One','KleeOne-Regular','400 700'),('Zen Kaku Gothic New','ZenKakuGothicNew-Regular','300 500'),('Zen Kaku Gothic New','ZenKakuGothicNew-Bold','600 900'),('Shippori Mincho B1','ShipporiMinchoB1-Bold','500 900')]
def fontcss(inline):
    out=''
    for fam,f,w in FONTS:
        src=('data:font/woff2;base64,'+base64.b64encode(open(SH+'fonts/'+f+'.woff2','rb').read()).decode()) if inline else 'fonts/'+f+'.woff2'
        out+=f'@font-face{{font-family:"{fam}";src:url({src}) format("woff2");font-weight:{w};font-style:normal;font-display:swap}}\n'
    return out
BASE='<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#f3f4f0}img{max-width:100%}[hidden]{display:none!important}</style>'

# 1) Claude artifact (unchanged structure)
claude=f'''<title>Lingoa de Iapam</title>
<meta name="description" content="{DESC}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Shippori+Mincho+B1:wght@600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>{css}</style>
<div id="app"></div>
<script>{fsrs}</script>
<script>{DATA}</script>
<script>{js}</script>
'''
os.makedirs(B+'dist',exist_ok=True)
open(B+'dist/lingoa.html','w',encoding='utf8').write(claude)
open(B+'dist/test.html','w',encoding='utf8').write('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+BASE+'</head><body>'+claude+'</body></html>')

def head(extra, fonts):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Lingoa de Iapam</title>
<meta name="description" content="{DESC}">
{extra}{BASE}
<style>{fonts}</style>
<style>{css}</style>
</head><body><div id="app"></div>
'''
# 2) PWA
P=B+'dist-pwa/'
shutil.rmtree(P,ignore_errors=True); os.makedirs(P)
for d in ('fonts','icons','audio'): shutil.copytree(SH+d, P+d)
pwa_head='''<meta name="theme-color" content="#f3f4f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#111318" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Lingoa">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
'''
swreg='''<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'activated' && had && typeof toast === 'function') toast('A new version is ready. It opens next time you start the app.'); }); });
      setInterval(() => reg.update().catch(() => { }), 3600000);
    }).catch(e => console.warn('service worker', e));
  });
}
</script>'''
index=head(pwa_head,fontcss(False))+f'<script>window.__ENV="pwa";</script>\n<script>{fsrs}</script>\n<script>{DATA}</script>\n<script>{js}</script>\n{swreg}\n</body></html>\n'
open(P+'index.html','w',encoding='utf8').write(index)
manifest={"name":"Lingoa de Iapam","short_name":"Lingoa","description":DESC,"id":"./","start_url":"./","scope":"./","display":"standalone","orientation":"any","lang":"en",
 "background_color":"#f3f4f0","theme_color":"#f3f4f0",
 "icons":[{"src":"icons/icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icons/icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icons/icon-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
open(P+'manifest.webmanifest','w',encoding='utf8').write(json.dumps(manifest,ensure_ascii=False,indent=1))
assets=['./','index.html','manifest.webmanifest']+sorted(os.path.relpath(os.path.join(r,f),P) for d in ('audio','fonts','icons') for r,_,fs in os.walk(P+d) for f in fs)
hsh=hashlib.sha256()
for a in assets[1:]: hsh.update(open(P+a,'rb').read())
ver='lingoa-'+hsh.hexdigest()[:10]
sw=f'''// Lingoa de Iapam service worker: stores the whole app on the device so it works offline.
const VERSION = '{ver}';
const ASSETS = {json.dumps(assets)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {{ e.respondWith(caches.match('index.html').then(r => r || fetch(req))); return; }}
  e.respondWith(caches.match(req, {{ ignoreSearch: true }}).then(r => r || fetch(req).then(res => {{ if (res.ok) {{ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }} return res; }})));
}});
'''
open(P+'sw.js','w',encoding='utf8').write(sw)
open(P+'CNAME','w').write('japanese.fsx.app\n')
open(P+'404.html','w',encoding='utf8').write('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./"><title>Lingoa de Iapam</title><a href="./">Open Lingoa de Iapam</a>\n')

# 3) single offline file
O=B+'dist-offline/'
shutil.rmtree(O,ignore_errors=True); os.makedirs(O)
fav='data:image/png;base64,'+base64.b64encode(open(SH+'icons/favicon-32.png','rb').read()).decode()
audio={v:json.load(open(B+f'assets/audio/{v}.json')) for v in 'fm'}
single=head(f'<link rel="icon" type="image/png" href="{fav}">\n',fontcss(True))+f'<script>window.__ENV="file";window.__A={J(audio)};</script>\n<script>{fsrs}</script>\n<script>{DATA}</script>\n<script>{js}</script>\n</body></html>\n'
open(O+'Lingoa de Iapam.html','w',encoding='utf8').write(single)
tot=sum(os.path.getsize(os.path.join(r,f)) for r,_,fs in os.walk(P) for f in fs)
print('claude',len(claude.encode()),'| pwa files',len(assets)-1+3,'total',tot,'| offline file',os.path.getsize(O+'Lingoa de Iapam.html'),'| sw',ver)
