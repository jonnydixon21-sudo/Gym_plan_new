"""Builds the main app (www/ -> web/): adds the home-screen manifest, icons and the pass-through service worker."""
import os,shutil,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=f'{ROOT}/www';OUT=f'{ROOT}/web'
shutil.rmtree(OUT,ignore_errors=True);os.makedirs(OUT)
s=open(f'{SRC}/index.html',encoding='utf8').read()
def rep(old,new):
    global s
    assert s.count(old)==1,(old[:70],s.count(old));s=s.replace(old,new)
vp='<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
rep(vp,vp+'''<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="Gym Plan"><meta name="theme-color" content="#1e1f21">''')
rep('</script>\n\n</body></html>','</script>\n<script>if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));</script>\n\n</body></html>') if s.rstrip().endswith('</body></html>') else None
assert 'sw.js' in s
open(f'{OUT}/index.html','w',encoding='utf8').write(s)
shutil.copy(f'{SRC}/local-backend.js',OUT)
open(f'{OUT}/manifest.webmanifest','w').write('''{
  "name": "My Gym Plan",
  "short_name": "Gym Plan",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#1e1f21",
  "theme_color": "#1e1f21",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}
  ]
}
''')
open(f'{OUT}/sw.js','w').write('''/* Pass-through helper. It used to keep an offline copy, but on iPhone home-screen apps its network requests could fail
   and leave the app on an old copy or a blank page. It now leaves every request to the browser, so pages always load
   straight from GitHub. Old offline copies are left in place (unused) rather than deleted. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
''')
# app icons (pre-rendered; tools/webicons.js re-renders them from assets/icon-only.png if the icon changes)
for n in ('icon-180.png','icon-192.png','icon-512.png'):shutil.copy(f'{ROOT}/assets/icons/{n}',OUT)
print('built web/')
