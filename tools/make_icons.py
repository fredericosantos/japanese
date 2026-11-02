import asyncio, base64, os, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KLEE=sys.argv[1] if len(sys.argv)>1 else 'KleeOne-SemiBold.ttf'  # full TTF from github.com/google/fonts ofl/kleeone
from playwright.async_api import async_playwright
font=base64.b64encode(open(KLEE,'rb').read()).decode()
def html(size, pad, rounded=False, bg='#f3f4f0'):
    ring=size*(1-2*pad)
    return f'''<html><head><style>@font-face{{font-family:K;src:url(data:font/ttf;base64,{font})}}
html,body{{margin:0;width:{size}px;height:{size}px;background:{bg};}}
.c{{position:absolute;left:{size*pad}px;top:{size*pad}px;width:{ring}px;height:{ring}px;border-radius:50%;box-sizing:border-box;border:{max(2,ring*0.055)}px solid #cf4430;display:grid;place-items:center;transform:rotate(-8deg)}}
.k{{font-family:K;color:#cf4430;font-size:{ring*0.6}px;line-height:1;margin-top:{-ring*0.02}px}}
.g{{position:absolute;inset:{size*0.06}px;border:{max(1,size*0.006)}px dashed #e9b3a8;border-radius:{size*0.04}px}}
.g::before{{content:"";position:absolute;left:50%;top:0;bottom:0;border-left:{max(1,size*0.006)}px dashed #e9b3a8}}
.g::after{{content:"";position:absolute;top:50%;left:0;right:0;border-top:{max(1,size*0.006)}px dashed #e9b3a8}}
</style></head><body>{'<div class="g"></div>' if size>=64 else ''}<div class="c"><span class="k">語</span></div></body></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for name,size,pad in [('apple-touch-icon',180,0.12),('icon-192',192,0.12),('icon-512',512,0.12),('icon-maskable-512',512,0.2),('favicon-32',32,0.04)]:
            pg=await b.new_page(viewport={'width':size,'height':size})
            await pg.set_content(html(size,pad)); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(ROOT,'assets','icons',f'{name}.png'), omit_background=False)
            await pg.close()
        await b.close()
asyncio.run(main())
