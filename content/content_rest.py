# Rest of the course: voiced kana, combinations, extended katakana, lessons, words, sounds lesson.

def h2k(s):  # hiragana -> katakana
    return ''.join(chr(ord(c) + 0x60) if 0x3041 <= ord(c) <= 0x3096 else c for c in s)

DAKUTEN = [  # (hiragana, romaji, base)
 ("が","ga","か"),("ぎ","gi","き"),("ぐ","gu","く"),("げ","ge","け"),("ご","go","こ"),
 ("ざ","za","さ"),("じ","ji","し"),("ず","zu","す"),("ぜ","ze","せ"),("ぞ","zo","そ"),
 ("だ","da","た"),("ぢ","ji","ち"),("づ","zu","つ"),("で","de","て"),("ど","do","と"),
 ("ば","ba","は"),("び","bi","ひ"),("ぶ","bu","ふ"),("べ","be","へ"),("ぼ","bo","ほ"),
 ("ぱ","pa","は"),("ぴ","pi","ひ"),("ぷ","pu","ふ"),("ぺ","pe","へ"),("ぽ","po","ほ"),
]
DAK_ALT = {"じ":["ji","zi"],"ぢ":["ji","di","dzi"],"づ":["zu","du","dzu"]}
DAK_RULE = {"g":"k → g","z":"s → z","j":"s → z (shi becomes ji)","d":"t → d","b":"h → b","p":"h → p"}
DAK_EX = {
 "が":["がっこう","学校","gakkō","school"], "ぎ":["ぎんこう","銀行","ginkō","bank"], "ぐ":["ぐあい","具合","guai","condition"],
 "げ":["げんき","元気","genki","well, healthy"], "ご":["ごはん","ご飯","gohan","rice, meal"],
 "ざ":["ざっし","雑誌","zasshi","magazine"], "じ":["じかん","時間","jikan","time"], "ず":["みず","水","mizu","water"],
 "ぜ":["ぜんぶ","全部","zenbu","everything"], "ぞ":["かぞく","家族","kazoku","family"],
 "だ":["ともだち","友達","tomodachi","friend"], "ぢ":["はなぢ","鼻血","hanaji","nosebleed"], "づ":["つづく","続く","tsuzuku","to continue"],
 "で":["でんわ","電話","denwa","telephone"], "ど":["どこ","","doko","where?"],
 "ば":["ばんごう","番号","bangō","number"], "び":["びょういん","病院","byōin","hospital"], "ぶ":["ぶた","豚","buta","pig"],
 "べ":["べんとう","弁当","bentō","lunch box"], "ぼ":["ぼうし","帽子","bōshi","hat"],
 "ぱ":["かんぱい","乾杯","kanpai","cheers!"], "ぴ":["えんぴつ","鉛筆","enpitsu","pencil"], "ぷ":["てんぷら","天ぷら","tenpura","tempura"],
 "ぺ":["ぺこぺこ","","pekopeko","starving"], "ぽ":["さんぽ","散歩","sanpo","a walk"],
}
DAK_EX_K = {
 "ガ":["ガム","","gamu","chewing gum"], "ギ":["ギター","","gitā","guitar"], "グ":["グラス","","gurasu","glass (for drinks)"],
 "ゲ":["ゲーム","","gēmu","game"], "ゴ":["ゴルフ","","gorufu","golf"], "ザ":["ピザ","","piza","pizza"],
 "ジ":["ジュース","","jūsu","juice"], "ズ":["チーズ","","chīzu","cheese"], "ゼ":["ゼロ","","zero","zero"],
 "ゾ":["ゾンビ","","zonbi","zombie"], "ダ":["サラダ","","sarada","salad"], "デ":["デパート","","depāto","department store"],
 "ド":["ドア","","doa","door"], "バ":["バス","","basu","bus"], "ビ":["ビール","","bīru","beer"], "ブ":["ブラジル","","Burajiru","Brazil"],
 "ベ":["ベランダ","","beranda","balcony"], "ボ":["ボタン","","botan","button"], "パ":["パン","","pan","bread"],
 "ピ":["ピアノ","","piano","piano"], "プ":["プール","","pūru","swimming pool"], "ペ":["ペン","","pen","pen"], "ポ":["ポルトガル","","Porutogaru","Portugal"],
}

YOON_BASE = [("き","k"),("し","sh"),("ち","ch"),("に","n"),("ひ","h"),("み","m"),("り","r"),
             ("ぎ","g"),("じ","j"),("び","b"),("ぴ","p")]
SMALL = [("ゃ","a"),("ゅ","u"),("ょ","o")]
def yoon_romaji(cons, v):
    if cons in ("sh","ch","j"): return cons + v
    return cons + "y" + v
YOON_ALT = {"sh":"sy","ch":["cy","ty"],"j":["jy","zy"]}
YOON_EX = {
 "きゃ":["きゃく","客","kyaku","guest, customer"], "きゅ":["きゅう","九","kyū","nine"], "きょ":["きょう","今日","kyō","today"],
 "しゃ":["しゃしん","写真","shashin","photo"], "しゅ":["しゅくだい","宿題","shukudai","homework"], "しょ":["しょくじ","食事","shokuji","meal"],
 "ちゃ":["おちゃ","お茶","ocha","tea"], "ちゅ":["ちゅうごく","中国","Chūgoku","China"], "ちょ":["ちょっと","","chotto","a little"],
 "にゃ":["にゃあ","","nyā","meow"], "にゅ":["ぎゅうにゅう","牛乳","gyūnyū","milk"], "にょ":["にょろにょろ","","nyoronyoro","wriggling"],
 "ひゃ":["ひゃく","百","hyaku","hundred"], "みゃ":["みゃく","脈","myaku","pulse"], "りょ":["りょこう","旅行","ryokō","travel"],
 "りゅ":["りゅう","竜","ryū","dragon"], "ぎゅ":["ぎゅうにゅう","牛乳","gyūnyū","milk"], "じゃ":["じゃあね","","jā ne","see you!"],
 "じゅ":["じゅぎょう","授業","jugyō","class, lesson"], "じょ":["じょうず","上手","jōzu","skilful"], "びょ":["びょういん","病院","byōin","hospital"],
 "ぴょ":["ぴょんぴょん","","pyonpyon","hopping"],
}
YOON_PT = {"にゃ":"Like **nha** in *vinha*.","にゅ":"Like **nhu**.","にょ":"Like **nho** in *vinho*.",
           "ちゃ":"Like **tcha**, as in *tchau*. お茶 *ocha* is tea, like *chá*!","しゃ":"Like **xá** in Portuguese.",
           "じゃ":"Softer than the Portuguese j: closer to **dja**."}

EXT_K = [  # extended katakana for foreign sounds
 ("ファ","fa",["ファン","","fan","fan (supporter)"]),("フィ","fi",["フィルム","","firumu","film"]),
 ("フェ","fe",["カフェ","","kafe","café"]),("フォ","fo",["フォーク","","fōku","fork"]),
 ("ティ","ti",["パーティー","","pātī","party"]),("ディ","di",["ディズニー","","Dizunī","Disney"]),
 ("ウィ","wi",["ウィキ","","wiki","wiki"]),("ウェ","we",["ウェブ","","webu","the web"]),("ウォ","wo",["ウォッカ","","wokka","vodka"]),
 ("シェ","she",["シェフ","","shefu","chef"]),("ジェ","je",["ジェット","","jetto","jet"]),("チェ","che",["チェック","","chekku","check"]),
 ("ヴァ","va",["ヴァイオリン","","vaiorin","violin"]),
]

CONFUSABLE = ["あお","いり","うら","きさ","さち","ちら","はほ","ほま","ぬめ","ねれわ","るろ","くへ","けは","こに","たな",
              "シツ","ソン","シン","ツソ","クケタ","ウワフ","コユ","ユヨ","ヌス","ナメ","チテ","ラフ","アマ","ロコ","ハル","ノソ","ヲフ"]

LESSONS_H = [
 ("h1","あいうえお","The five vowels",["あ","い","う","え","お"]),
 ("h2","かきくけこ","The k-row",["か","き","く","け","こ"]),
 ("h3","さしすせそ","The s-row",["さ","し","す","せ","そ"]),
 ("h4","たちつてと","The t-row",["た","ち","つ","て","と"]),
 ("h5","なにぬねの","The n-row",["な","に","ぬ","ね","の"]),
 ("h6","はひふへほ","The h-row",["は","ひ","ふ","へ","ほ"]),
 ("h7","まみむめも","The m-row",["ま","み","む","め","も"]),
 ("h8","やゆよ","The y-row",["や","ゆ","よ"]),
 ("h9","らりるれろ","The r-row",["ら","り","る","れ","ろ"]),
 ("h10","わをん","The last three",["わ","を","ん"]),
 ("h11","がざ","Two little marks: g and z",["が","ぎ","ぐ","げ","ご","ざ","じ","ず","ぜ","ぞ"]),
 ("h12","だばぱ","d, b and the little circle",["だ","ぢ","づ","で","ど","ば","び","ぶ","べ","ぼ","ぱ","ぴ","ぷ","ぺ","ぽ"]),
 ("h13","きゃしゃ","Combinations I",["きゃ","きゅ","きょ","しゃ","しゅ","しょ","ちゃ","ちゅ","ちょ","にゃ","にゅ","にょ"]),
 ("h14","ひゃみゃりゃ","Combinations II",["ひゃ","ひゅ","ひょ","みゃ","みゅ","みょ","りゃ","りゅ","りょ"]),
 ("h15","ぎゃじゃ","Combinations III",["ぎゃ","ぎゅ","ぎょ","じゃ","じゅ","じょ","びゃ","びゅ","びょ","ぴゃ","ぴゅ","ぴょ"]),
]
K_TITLES = {"h11":"Voiced: g and z","h12":"d, b and p"}
LESSONS_K = [(i.replace("h","k"), h2k(t), K_TITLES.get(i,d), [h2k(c) for c in cs]) for (i,t,d,cs) in LESSONS_H]
LESSONS_K.append(("k16","ファティ","Sounds for foreign words",[c for c,_,_ in EXT_K]))

INTROS = {
 "h1":"Japanese has just five vowels, and they are pure, like Portuguese stressed vowels. Every other kana is built on them.",
 "h11":"Add two little marks (゛, called dakuten) and the sound becomes voiced: k → g, s → z. No new shapes to learn!",
 "h12":"The same marks turn t → d and h → b. A little circle (゜) turns h → p. ぢ and づ sound like じ and ず and are rare.",
 "h13":"A big kana ending in -i plus a small ゃ ゅ ょ blends into one beat: き + ゃ = きゃ (kya). It is one beat, not two.",
 "h14":"More of the same blending pattern. Remember: the small kana is written half size.",
 "h15":"Voiced versions of the same combinations. You already know every piece.",
 "k1":"Katakana spells foreign words and names. Same sounds as hiragana, sharper shapes. Many look like their hiragana twin.",
 "k16":"Small vowels let katakana write sounds Japanese didn't have, like fa, ti and we. Also: ー makes the vowel before it long (コーヒー).",
}

# Words: kana, kanji, romaji (display), English, extra
WORDS = [
 # Portuguese origin
 dict(k="パン", r="pan", en="bread", pt="from *pão*", tag="pt"),
 dict(k="ボタン", r="botan", en="button", pt="from *botão*", tag="pt"),
 dict(k="コップ", r="koppu", en="glass, cup", pt="from *copo*", tag="pt"),
 dict(k="タバコ", r="tabako", en="cigarette", pt="from *tabaco*", tag="pt"),
 dict(k="カステラ", r="kasutera", en="sponge cake", pt="from *pão de Castela*", tag="pt"),
 dict(k="マント", r="manto", en="cloak, cape", pt="from *manto*", tag="pt"),
 dict(k="カボチャ", r="kabocha", en="pumpkin", pt="from *Camboja* (abóbora de Camboja)", tag="pt"),
 dict(k="カルタ", r="karuta", en="card game", pt="from *carta*", tag="pt"),
 dict(k="シャボンだま", j="シャボン玉", r="shabondama", en="soap bubble", pt="from *sabão* + 玉 (ball)", tag="pt"),
 dict(k="てんぷら", j="天ぷら", r="tenpura", en="tempura", pt="from *tempero* or *têmporas*", tag="pt"),
 dict(k="オランダ", r="Oranda", en="the Netherlands", pt="from *Holanda*", tag="pt"),
 dict(k="イギリス", r="Igirisu", en="the UK", pt="from *inglês*", tag="pt"),
 dict(k="カッパ", r="kappa", en="raincoat", pt="from *capa*", tag="pt"),
 dict(k="ベランダ", r="beranda", en="balcony", pt="via English, originally *varanda*", tag="pt"),
 dict(k="こんぺいとう", j="金平糖", r="konpeitō", en="star-shaped sugar candy", pt="from *confeito*", tag="pt"),
 dict(k="ポルトガル", r="Porutogaru", en="Portugal", tag="place"),
 dict(k="リスボン", r="Risubon", en="Lisbon", tag="place"),
 dict(k="ポルトガルご", j="ポルトガル語", r="porutogarugo", en="Portuguese (language)", tag="place"),
 # everyday loanwords
 dict(k="コーヒー", r="kōhī", en="coffee", tag="loan"),
 dict(k="テレビ", r="terebi", en="TV", tag="loan"),
 dict(k="カメラ", r="kamera", en="camera", tag="loan"),
 dict(k="ホテル", r="hoteru", en="hotel", tag="loan"),
 dict(k="タクシー", r="takushī", en="taxi", tag="loan"),
 dict(k="トイレ", r="toire", en="toilet", tag="loan"),
 dict(k="メニュー", r="menyū", en="menu", tag="loan"),
 dict(k="アニメ", r="anime", en="anime", tag="loan"),
 dict(k="ゲーム", r="gēmu", en="game", tag="loan"),
 dict(k="ビール", r="bīru", en="beer", tag="loan"),
 dict(k="パソコン", r="pasokon", en="computer (PC)", tag="loan"),
 dict(k="スマホ", r="sumaho", en="smartphone", tag="loan"),
 dict(k="コンビニ", r="konbini", en="convenience store", tag="loan"),
 dict(k="ラーメン", r="rāmen", en="ramen", tag="loan"),
 dict(k="レストラン", r="resutoran", en="restaurant", tag="loan"),
 dict(k="アパート", r="apāto", en="apartment", tag="loan"),
 # phrases (polite first)
 dict(k="ありがとうございます", r="arigatō gozaimasu", en="thank you (polite)", note="Not from *obrigado*. It comes from 有り難い *arigatai*, 'rare, precious'.", tag="phrase", jlpt=5),
 dict(k="すみません", r="sumimasen", en="excuse me; sorry", tag="phrase", jlpt=5),
 dict(k="おはようございます", r="ohayō gozaimasu", en="good morning (polite)", tag="phrase", jlpt=5),
 dict(k="こんにちは", say="こんにちわ", r="konnichiwa", en="hello, good afternoon", note="The last は is read **wa**.", tag="phrase", jlpt=5),
 dict(k="こんばんは", say="こんばんわ", r="konbanwa", en="good evening", note="The last は is read **wa**.", tag="phrase", jlpt=5),
 dict(k="はじめまして", r="hajimemashite", en="nice to meet you", tag="phrase", jlpt=5),
 dict(k="よろしくおねがいします", j="よろしくお願いします", r="yoroshiku onegaishimasu", en="pleased to meet you; I'm counting on you", note="Essential at work: said after introductions and when asking a favour.", tag="phrase", jlpt=5),
 dict(k="おつかれさまです", j="お疲れ様です", r="otsukaresama desu", en="thanks for your hard work", note="The everyday greeting between colleagues at work.", tag="phrase"),
 dict(k="おねがいします", j="お願いします", r="onegaishimasu", en="please (when asking for something)", tag="phrase", jlpt=5),
 dict(k="いただきます", r="itadakimasu", en="said before eating", tag="phrase", jlpt=5),
 dict(k="はい", r="hai", en="yes", tag="phrase", jlpt=5),
 dict(k="いいえ", r="iie", en="no", tag="phrase", jlpt=5),
 # core words
 dict(k="わたし", j="私", r="watashi", en="I, me", jlpt=5),
 dict(k="にほん", j="日本", r="Nihon", en="Japan", jlpt=5),
 dict(k="にほんご", j="日本語", r="nihongo", en="Japanese (language)", jlpt=5),
 dict(k="ねこ", j="猫", r="neko", en="cat", jlpt=5),
 dict(k="いぬ", j="犬", r="inu", en="dog", jlpt=5),
 dict(k="みず", j="水", r="mizu", en="water", jlpt=5),
 dict(k="おちゃ", j="お茶", r="ocha", en="tea", note="Like *chá*: both come from Chinese.", jlpt=5),
 dict(k="ごはん", j="ご飯", r="gohan", en="rice; a meal", jlpt=5),
 dict(k="すし", j="寿司", r="sushi", en="sushi"),
 dict(k="えき", j="駅", r="eki", en="station", jlpt=5),
 dict(k="でんしゃ", j="電車", r="densha", en="train", jlpt=5),
 dict(k="しごと", j="仕事", r="shigoto", en="work, job", jlpt=5),
 dict(k="かいしゃ", j="会社", r="kaisha", en="company", jlpt=5),
 dict(k="せんせい", j="先生", r="sensei", en="teacher", jlpt=5),
 dict(k="がくせい", j="学生", r="gakusei", en="student", jlpt=5),
 dict(k="ともだち", j="友達", r="tomodachi", en="friend", jlpt=5),
 dict(k="おいしい", j="美味しい", r="oishii", en="delicious", jlpt=5),
 dict(k="いくら", r="ikura", en="how much?", jlpt=5),
 dict(k="これ", r="kore", en="this (near me)", jlpt=5),
 dict(k="どこ", r="doko", en="where?", jlpt=5),
 dict(k="いち", j="一", r="ichi", en="one", jlpt=5),
 dict(k="に", j="二", r="ni", en="two", jlpt=5),
 dict(k="さん", j="三", r="san", en="three", jlpt=5),
]

SOUNDS = [
 dict(id="vowels", title="Five pure vowels",
      body="Japanese has only five vowels, each short and pure. You already know them from Portuguese stressed vowels. There are no English-style glides like 'ay' or 'oh-oo'.",
      items=[["あ","a","like *casa*"],["い","i","like *ilha*"],["う","u","like *uva*, lips relaxed"],["え","e","between *ê* and *é*"],["お","o","between *ô* and *ó*"]]),
 dict(id="beats", title="One kana, one beat",
      body="Japanese is timed in beats called morae. Every kana gets the same length, and so do ん and small っ. Tap and count the beats.",
      items=[["にほん","ni-ho-n","3 beats"],["とうきょう","to-u-kyo-u","4 beats: Tokyo is longer than it looks"],["せんせい","se-n-se-i","4 beats"]]),
 dict(id="long", title="Long vowels change the meaning",
      body="Holding a vowel for an extra beat makes a different word. Listen to each pair.",
      items=[["おばさん","obasan","aunt"],["おばあさん","obāsan","grandmother"],["びよういん","biyōin","hair salon"],["びょういん","byōin","hospital"]]),
 dict(id="sokuon", title="Small っ: a silent beat",
      body="A small っ means a short silent pause, as if you hold your breath for one beat before the next consonant.",
      items=[["きて","kite","come!"],["きって","kitte","postage stamp"],["さか","saka","slope"],["さっか","sakka","writer"]]),
 dict(id="devoice", title="Swallowed vowels",
      body="Between or after voiceless consonants, i and u are often whispered. です sounds like 'dess'. European Portuguese does this too: think how *telefone* is said in Lisbon.",
      items=[["です","desu","is / am (polite)"],["すき","suki","to like"],["します","shimasu","to do (polite)"]]),
 dict(id="pitch", title="Pitch, not stress",
      body="Japanese words rise and fall in pitch instead of having a stressed syllable. Same kana, different pitch, different word.",
      items=[["箸","hashi","chopsticks: HA-shi (high, then low)"],["橋","hashi","bridge: ha-SHI (low, then high)"],["雨","ame","rain: A-me"],["飴","ame","candy: a-ME"]]),
 dict(id="r", title="The Japanese r",
      body="ら り る れ ろ use a quick tap of the tongue: exactly the single r in Portuguese *caro* or *para*. English speakers find this hard. You don't.",
      items=[["さくら","sakura","cherry blossom"],["くるま","kuruma","car"],["りんご","ringo","apple"]]),
 dict(id="ftsu", title="Two new sounds: fu and tsu",
      body="ふ is a soft blow between f and h, as if cooling soup. つ starts like the ts in *tsé-tsé*.",
      items=[["ふゆ","fuyu","winter"],["つくえ","tsukue","desk"],["ふつう","futsū","normal"]]),
]
