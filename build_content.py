# Step 1: turns content/*.py into data/content.json and data/audio_manifest.json
import json, re, os
ROOT=os.path.dirname(os.path.abspath(__file__))
P=lambda *a: os.path.join(ROOT,*a)
exec(open(P('content','content_kana.py'),encoding='utf8').read())
exec(open(P('content','content_rest.py'),encoding='utf8').read())
def k2h(s): return ''.join(chr(ord(c)-0x60) if 0x30A1<=ord(c)<=0x30F6 else c for c in s)
items=[]; byc={}
def add(it):
    it['id']=('h:' if it['s']=='h' else 'k:')+it['c']; items.append(it); byc[it['c']]=it
VAR={"shi":["shi","si"],"chi":["chi","ti"],"tsu":["tsu","tu"],"fu":["fu","hu"],"ji":["ji","zi"],"n":["n","nn"]}
for s,lst in (("h",HIRAGANA),("k",KATAKANA)):
    for d in lst:
        it=dict(d); it['s']=s; it['g']='base'
        alt=set(VAR.get(d['r'],[d['r']]))|set(d.get('alt',[]))
        it['alt']=sorted(alt); add(it)
# dakuten
for s in ("h","k"):
    for c,r,base in DAKUTEN:
        cc=c if s=='h' else h2k(c); bb=base if s=='h' else h2k(base)
        mark='゜' if r[0]=='p' else '゛'
        rule=DAK_RULE[r[0]]
        story=f"{bb} ({byc[bb]['r']}) + {mark} = **{r}**. The {'little circle' if mark=='゜' else 'two marks'} turn {rule}."
        it=dict(c=cc,r=r,s=s,g='dakuten',base=bb,hook=f"{bb} with {'a circle' if mark=='゜' else 'two marks'}: **{r}**",story=story,
                alt=sorted(set(DAK_ALT.get(c,[r]))))
        if c in ("ぢ","づ"): it['sound']="Sounds the same as "+("じ" if c=="ぢ" else "ず")+" and is rare. It appears in a few words like はなぢ (nosebleed)."
        ex=(DAK_EX if s=='h' else DAK_EX_K).get(cc)
        if ex: it['ex']=ex
        add(it)
# yoon
for s in ("h","k"):
    for base,cons in YOON_BASE:
        for sm,v in SMALL:
            c=base+sm; cc=c if s=='h' else h2k(c); r=yoon_romaji(cons,v)
            alts={r}
            if cons=="sh": alts.add("sy"+v)
            if cons=="ch": alts|={"cy"+v,"ty"+v}
            if cons=="j": alts|={"jy"+v,"zy"+v}
            bb=base if s=='h' else h2k(base); smc=sm if s=='h' else h2k(sm)
            it=dict(c=cc,r=r,s=s,g='yoon',base=bb,hook=f"{bb} + small {smc} = **{r}**",
                    story=f"{bb} ({byc[bb]['r']}) blends with a small {smc} ({v}) into one beat: **{r}**.",alt=sorted(alts))
            if c in YOON_PT: it['pt']=YOON_PT[c]
            if s=='h' and c in YOON_EX: it['ex']=YOON_EX[c]
            add(it)
for c,r,ex in EXT_K:
    add(dict(c=c,r=r,s='k',g='ext',hook=f"A katakana with a small vowel: **{r}**",story=f"{c[0]} + small {c[1]} = **{r}**: a sound used for foreign words.",alt=[r],ex=ex))
# audio key for each item
def akey(it):
    c=it['c']
    if it['g']=='ext': return c
    h=k2h(c)
    return {'を':'お','ぢ':'じ','づ':'ず'}.get(h,h)
for it in items: it['a']=akey(it)
lessons=[]
for s,L in (("h",LESSONS_H),("k",LESSONS_K)):
    for (lid,title,desc,chars) in L:
        ids=[('h:' if s=='h' else 'k:')+c for c in chars]
        for i in ids: assert i in {x['id'] for x in items}, i
        for c in chars: byc[c]['L']=lid
        lessons.append(dict(id=lid,s=s,t=title,d=desc,ids=ids,intro=INTROS.get(lid,"")))
# words
units=sorted({it['c'] for it in items}, key=len, reverse=True)
def tokenize(w):
    out=[];i=0
    while i<len(w):
        if w[i] in 'っッー ': i+=1; continue
        for u in units:
            if w.startswith(u,i): out.append(u); i+=len(u); break
        else: raise Exception('cannot tokenize '+w+' at '+w[i:])
    return out
words=[]
for n,w in enumerate(WORDS):
    w=dict(w); w['id']='w:'+w['k']; w['need']=sorted(set(('h:' if 0x3041<=ord(u[0])<=0x3096 else 'k:')+u for u in tokenize(w['k'])))
    w['a']='w:'+(w.get('j') or w['k']); w['tts']=w.get('say') or w.get('j') or w['k']
    words.append(w)
# example words audio list
ex_audio={}
for it in items:
    if it.get('ex'):
        k,j,r,m=it['ex']; ex_audio['w:'+(j or k)]=j or k
for w in words: ex_audio[w['a']]=w['tts']
sounds_audio={}
for sec in SOUNDS:
    for x in sec['items']: sounds_audio['w:'+x[0]]=x[0]
KANA_TTS={'は':'ハ','へ':'ヘ'}
kana_audio={it['a']:KANA_TTS.get(it['a'],it['a']) for it in items}
audio={**{('k:'+k):v for k,v in kana_audio.items()}, **ex_audio, **sounds_audio}
TTS_OVERRIDE={'日本':'にほん'}
audio={k:TTS_OVERRIDE.get(v,v) for k,v in audio.items()}
for w in words: w['tts']=TTS_OVERRIDE.get(w['tts'],w['tts'])
content=dict(items=items,lessons=lessons,words=words,sounds=SOUNDS,confusable=CONFUSABLE)
json.dump(content,open(P('data','content.json'),'w',encoding='utf8'),ensure_ascii=False)
json.dump(audio,open(P('data','audio_manifest.json'),'w',encoding='utf8'),ensure_ascii=False,indent=0)
print(len(items),'items',len(lessons),'lessons',len(words),'words',len(audio),'audio clips')
print('no lesson:',[it['c'] for it in items if 'L' not in it])
print('words needing ext/rare:',[(w['k'],w['need']) for w in words if any(n in ('k:ヲ',) for n in w['need'])])
