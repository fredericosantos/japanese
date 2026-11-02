# Synthesises every clip in data/audio_manifest.json with VOICEVOX (run from tools/voicevox/, see CLAUDE.md).
from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile
import json, os, subprocess, base64, sys
man=json.load(open('../../data/audio_manifest.json',encoding='utf8'))
ort=Onnxruntime.load_once(filename="voicevox_onnxruntime-linux-x64-1.17.3/lib/libvoicevox_onnxruntime.so.1.17.3")
syn=Synthesizer(ort, OpenJtalk("open_jtalk_dic_utf_8-1.11"))
for f in ["vvms/6.vvm","vvms/4.vvm"]:
    with VoiceModelFile.open(f) as m: syn.load_voice_model(m)
VOICES={"f":30,"m":11}
os.makedirs('out',exist_ok=True)
def safe(k): return k.replace(':','_').replace('/','_')
for v,sid in VOICES.items():
    os.makedirs(f'out/{v}',exist_ok=True)
    for key,text in man.items():
        wav=f'out/{v}/{safe(key)}.wav'
        if os.path.exists(wav): continue
        q=syn.create_audio_query(text,sid)
        kana = key.startswith('k:')
        q.pre_phoneme_length=0.15; q.post_phoneme_length=0.2
        if kana:
            q.speed_scale=0.9
            for ap in q.accent_phrases:
                for m in ap.moras: m.vowel_length*=1.3
        else:
            q.speed_scale=0.95
        open(wav,'wb').write(syn.synthesis(q,sid))
    print(v,'done')
