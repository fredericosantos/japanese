# Encode wav clips to small mono MP3 and pack per voice into JSON (base64).
import json, os, subprocess, base64, sys, concurrent.futures
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
man=json.load(open(os.path.join(ROOT,'data','audio_manifest.json'),encoding='utf8'))
src=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'tools','voicevox','out')
def enc(args):
    v,key=args
    wav=f"{src}/{v}/{key.replace(':','_')}.wav"
    out=subprocess.run(['ffmpeg','-v','error','-i',wav,'-af','silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse,apad=pad_dur=0.05','-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','40k','-f','mp3','-'],capture_output=True,check=True).stdout
    return v,key,base64.b64encode(out).decode()
res={'f':{},'m':{}}
with concurrent.futures.ThreadPoolExecutor(8) as ex:
    for v,key,b in ex.map(enc,[(v,k) for v in 'fm' for k in man]): res[v][key]=b
for v in 'fm':
    json.dump(res[v],open(os.path.join(ROOT,'assets','audio',f'{v}.json'),'w'),separators=(',',':'))
    print(v,len(res[v]),os.path.getsize(os.path.join(ROOT,'assets','audio',f'{v}.json')))
