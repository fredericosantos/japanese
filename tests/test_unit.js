const fs=require('fs'), vm=require('vm');
const ctx={window:{}, console, localStorage:{getItem(){return null},setItem(){}}, document:{addEventListener(){},querySelector(){return null}}, Date, Math, JSON, setTimeout, clearTimeout, Promise};
ctx.window.__C=JSON.parse(fs.readFileSync(__dirname+'/../data/content.json','utf8')); ctx.window.__S={}; ctx.window.__P={};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../data/fsrs/fsrs.iife.js','utf8')+';window.FSRSLib=FSRSLib;',ctx);
vm.runInContext(fs.readFileSync(__dirname+'/../app/core.js','utf8')+';this.checkRomaji=checkRomaji;this.romajiSet=romajiSet;this.mergeState=mergeState;this.freshState=freshState;this.tokens=tokens;',ctx);
const T=[['ありがとうございます','arigatou gozaimasu','ok'],['ありがとうございます','arigatō gozaimasu','ok'],['ありがとうございます','arigato gozaimasu','long'],
['こんにちわ','konnichiwa','ok'],['コーヒー','kohi','long'],['コーヒー','koohii','ok'],['コーヒー','kōhī','ok'],['きって','kitte','ok'],['きって','kite','long'],
['ちょっと','chotto','ok'],['ちょっと','tyotto','ok'],['せんせい','sensei','ok'],['せんせい','sensee','ok'],['てんぷら','tempura','ok'],['てんぷら','tenpura','ok'],
['しごと','sigoto','ok'],['つくえ','tukue','ok'],['ふゆ','huyu','ok'],['じかん','zikan','ok'],['でんしゃ','densya','ok'],['でんしゃ','densha','ok'],['ねこ','neka','no'],
['みずを','mizu o','ok'],['みずを','mizuwo','ok'],['シャボンだま','shabondama','ok'],['ポルトガルご','porutogarugo','ok'],['メニュー','menyuu','ok'],['ぎゅうにゅう','gyuunyuu','ok'],
['よろしくおねがいします','yoroshiku onegaishimasu','ok'],['おつかれさまです','otsukaresama desu','ok'],['いいえ','iie','ok'],['カッパ','kappa','ok'],['ラーメン','ramen','long']];
let bad=0; for (const [k,i,e] of T){const r=ctx.checkRomaji(i,k); if(r!==e){bad++;console.log('FAIL',k,i,'expected',e,'got',r, ctx.romajiSet(k).slice(0,5));}}
console.log('romaji tests',T.length,'fail',bad);
// tokens sanity for all words
for (const w of ctx.window.__C.words){ const t=ctx.tokens(w.say||w.k); const s=ctx.romajiSet(w.say||w.k); if(!s.length) console.log('no romaji',w.k); if (ctx.checkRomaji(w.r, w.say||w.k)==='no') console.log('display romaji rejected:',w.k,w.r, s.slice(0,3)); }
// merge tests
const a=ctx.freshState(), b=ctx.freshState();
a.cards['x|r']={lr:100,r:1,d:1}; b.cards['x|r']={lr:200,r:2,d:2}; b.cards['y|r']={lr:50,r:1,d:3}; a.intro.x=10; b.intro.x=5; b.intro.y=7;
let m=ctx.mergeState(a,b); console.log('merge', m.cards['x|r'].lr===200, !!m.cards['y|r'], m.intro.x===5);
const c=ctx.freshState(); c.resetAt=150; c.cards['z|r']={lr:160,r:1,d:1}; m=ctx.mergeState(a,c); console.log('reset', !m.cards['x|r'], !!m.cards['z|r'], m.resetAt===150);
m=ctx.mergeState(c,b); console.log('reset2', m.cards['x|r'] && m.cards['x|r'].lr===200, !m.cards['y|r']);
