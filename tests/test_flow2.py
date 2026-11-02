import asyncio, json, sys, os
from playwright.async_api import async_playwright
C=json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'data','content.json'),encoding='utf8'))
BYC={i['c']:i for i in C['items']}; BYA={}
for i in C['items']: BYA.setdefault(i['a'],[]).append(i)
W={w['k']:w for w in C['words']}; WA={w['a']:w for w in C['words']}
MOCK = """
window.__dbstore = {};
window.claude = { use: async (n) => {
  await new Promise(r=>setTimeout(r,300));
  if (n==='user') return { id: async()=> 'u123', isOwner: async()=>true };
  if (n==='db') return { doc: (p) => ({ path:p,
     get: async()=>({exists: p in window.__dbstore, data: ()=>window.__dbstore[p], metadata:{}}),
     set: async(d)=>{ window.__dbstore[p]=JSON.parse(JSON.stringify(d)); window.__dbwrites=(window.__dbwrites||0)+1; },
     onSnapshot: (fn)=>{ window.__snap=fn; return ()=>{}; } }) };
  return null; } };
"""
async def answer_quiz(pg, maxn=200, shot=None, wrong_first=False):
    n=0; did_wrong=False
    while n<maxn:
        n+=1
        if await pg.locator('.hanko').count(): return n
        lab=(await pg.locator('.q-label').first.inner_text()).lower()
        if 'how do you read' in lab:
            g=(await pg.locator('.genko .glyph').first.inner_text()).strip(); it=BYC[g]
            if await pg.locator('#ans').count():
                await pg.fill('#ans','zz' if (wrong_first and not did_wrong) else it['r']); await pg.keyboard.press('Enter')
            else:
                btns=pg.locator('.choices .choice'); cnt=await btns.count()
                for j in range(cnt):
                    if (await btns.nth(j).inner_text()).strip()==it['r']: await btns.nth(j).click(); break
        elif 'read this word' in lab:
            g=(await pg.locator('.genko .glyph').first.inner_text()).strip(); w=W[g]
            if await pg.locator('#ans').count():
                await pg.fill('#ans',w['r']); await pg.keyboard.press('Enter')
            else:
                btns=pg.locator('.choices .choice'); cnt=await btns.count()
                for j in range(cnt):
                    if (await btns.nth(j).inner_text()).strip()==w['r']: await btns.nth(j).click(); break
        elif 'mean' in lab:
            await pg.locator('.playbig').click(); await pg.wait_for_timeout(400); key=await pg.evaluate('window.__lastKey'); w=WA[key]
            btns=pg.locator('.choices .choice'); cnt=await btns.count()
            for j in range(cnt):
                if (await btns.nth(j).inner_text()).strip()==w['en']: await btns.nth(j).click(); break
        elif 'find' in lab:
            r=(await pg.locator('.meet-name .rom').first.inner_text()).strip()
            btns=pg.locator('.choices .choice'); cnt=await btns.count(); clicked=False
            for j in range(cnt):
                t=(await btns.nth(j).inner_text()).strip()
                if BYC[t]['r']==r: await btns.nth(j).click(); clicked=True; break
            if not clicked: print('drill: no match',r)
        else:
            await pg.locator('.playbig').click(); await pg.wait_for_timeout(400); key=await pg.evaluate('window.__lastKey'); a=key.split(':',1)[1]
            chars={i['c'] for i in BYA[a]}
            btns=pg.locator('.choices .choice'); cnt=await btns.count()
            for j in range(cnt):
                if (await btns.nth(j).inner_text()).strip() in chars: await btns.nth(j).click(); break
        await pg.wait_for_timeout(200)
        if shot and n==shot[0]: await pg.screenshot(path=shot[1])
        if wrong_first and not did_wrong and await pg.locator('.feedback.bad').count():
            did_wrong=True; await pg.click('.ov-foot >> text=Continue')
        else:
            b=pg.locator('.ov-foot .btn.primary'); 
            if await b.count(): await b.first.click()
        await pg.wait_for_timeout(150)
    return n
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2)
        await ctx.add_init_script(MOCK)
        pg=await ctx.new_page(); errs=[]
        pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
        pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
        await pg.goto('http://localhost:8765/test.html'); await pg.wait_for_timeout(1200)
        print('sync label', await pg.locator('#sync').get_attribute('class'))
        # sounds page
        await pg.click('text=Listen first'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/20_sounds.png', full_page=True)
        await pg.click('text=I\'ve listened. Start learning'); await pg.wait_for_timeout(300)
        # lesson 1
        await pg.click('text=Start lesson'); await pg.click('.ov-foot >> text=Start')
        for k in range(4): await pg.click('.ov-foot >> text=Next'); await pg.wait_for_timeout(100)
        await pg.click('text=Test yourself'); await pg.wait_for_timeout(400)
        print('lesson1 steps', await answer_quiz(pg, wrong_first=True))
        await pg.click('text=Back to Today'); await pg.wait_for_timeout(300)
        # fast forward: make all cards due
        await pg.evaluate("for (const k in S.cards) S.cards[k].d = Date.now()-1000; save(); render();")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/21_today_due.png')
        await pg.click('text=Start reviews'); await pg.wait_for_timeout(400)
        print('review steps', await answer_quiz(pg, shot=(1,'shots/22_review.png')))
        await pg.screenshot(path='shots/23_review_done.png')
        st=await pg.evaluate("JSON.stringify(Object.entries(S.cards).slice(0,3))"); print('cards after review', st)
        await pg.click('text=Back to Today'); await pg.wait_for_timeout(300)
        # word lesson
        await pg.click('text=Learn 1 word'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/24_wordmeet.png')
        await pg.click('text=Test yourself'); await pg.wait_for_timeout(400)
        print('words steps', await answer_quiz(pg, shot=(1,'shots/25_wordq.png')))
        await pg.click('text=Back to Today'); await pg.wait_for_timeout(300)
        # placement
        await pg.click('.tabbar [data-tab=learn]'); await pg.click('text=Katakana check'); await pg.click('text=Start the check')
        for k in range(45):
            g=(await pg.locator('.genko .glyph').first.inner_text()).strip(); it=BYC[g]
            if k%2==0: await pg.fill('#ans',it['r']); await pg.keyboard.press('Enter')
            else: await pg.click('.ov-foot >> text=Don\'t know')
            await pg.wait_for_timeout(60)
        await pg.screenshot(path='shots/26_placement_done.png')
        await pg.click('text=Back to Today'); await pg.wait_for_timeout(300)
        print('due after placement', await pg.evaluate('dueList().length'))
        # drill
        await pg.click('.tabbar [data-tab=more]'); await pg.click('text=Look-alikes'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/27_lookalikes.png')
        await pg.click('text=Drill every look-alike I know'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/28_drill.png')
        print('drill steps', await answer_quiz(pg))
        await pg.click('.ov-foot >> text=Back'); await pg.wait_for_timeout(300)
        # settings choose mode
        await pg.click('.tabbar [data-tab=more]'); await pg.click('text=Settings'); await pg.select_option('#s-ans','choose'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/29_settings.png', full_page=True)
        await pg.click('.tabbar [data-tab=today]'); await pg.wait_for_timeout(200)
        await pg.click('text=Start reviews'); await pg.wait_for_timeout(400)
        print('review2 steps', await answer_quiz(pg, maxn=120, shot=(2,'shots/30_choose.png')))
        await pg.wait_for_timeout(3500)
        info=await pg.evaluate("JSON.stringify({writes:window.__dbwrites, keys:Object.keys(window.__dbstore), size:(window.__dbstore['data/users/u123/progress']||{state:''}).state.length, sync:Sync.status})")
        print('db', info)
        # simulate remote update from another device
        await pg.evaluate("""(()=>{const st=JSON.parse(window.__dbstore['data/users/u123/progress'].state); st.intro['h:か']=Date.now(); st.cards['h:か|r']={d:Date.now()+1e9,s:3,df:5,st:2,r:1,l:0,ls:0,sd:3,ed:0,lr:Date.now()}; st.updatedAt=Date.now()+5; window.__snap({exists:true,metadata:{hasPendingWrites:false},data:()=>({state:JSON.stringify(st),updatedAt:st.updatedAt,writer:'other'})});})()""")
        await pg.wait_for_timeout(300)
        print('after remote merge has か:', await pg.evaluate("!!S.intro['h:か']"))
        await pg.click('.ov-foot >> text=Back to Today'); await pg.wait_for_timeout(300)
        await pg.click('.tabbar [data-tab=chart]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/31_chart.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
