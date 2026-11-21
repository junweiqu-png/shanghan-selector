"""Build short, sourced parallel reading examples, with explicit lexical alignment.

Corpus: NiuTrans/Classical-Modern (MIT). Sentence translations remain traceable
to the exact paired line; a glyph hit alone never assigns a contextual meaning.
"""
import argparse, collections, difflib, hashlib, json, pathlib, re, subprocess, tempfile

ap=argparse.ArgumentParser()
ap.add_argument('--corpus-root',required=True)
ap.add_argument('--output',default='wenyan/evidence/linked-examples')
ap.add_argument('--dictionary',required=True,help='MIT mapull/chinese-dictionary character/char_detail.json')
args=ap.parse_args()
with tempfile.TemporaryDirectory() as tmp:
    target=pathlib.Path(tmp)/'inputs.json'
    subprocess.run(['node','wenyan/scripts/export-linked-inputs.mjs',str(target)],check=True)
    inputs=json.loads(target.read_text())

# School glosses are the first source of meanings. These aliases express the
# same meaning in a modern sentence; different senses retain separate codes.
aliases={
 '紧跟':['紧跟','紧随','跟随','尾随','跟在','跟着','追随'],
 '连结':['连结','连接','相连','连在'], '装饰':['装饰','装点','点缀'],
 '缝合':['缝合','缝补','缝制','缝缀'], '跟随':['跟随','跟着','随从','随行'],
 '确实':['确实','的确','实在'], '只是':['只是','只不过','仅仅'],
 '全':['全都','全部','全体','所有','都'], '都':['全都','全部','全体','所有','都'],
 '多':['很多','许多','众多','繁多'], '少':['很少','稀少','少量'],
 '高':['高大','高高','高耸','高处'], '深':['深深','很深','深处','深厚'],
 '远':['远处','遥远','很远','长远'], '大':['广大','庞大','很大','巨大'],
 '小':['很小','细小','微小','小的'], '白':['白色','洁白','雪白','白茫茫'],
 '黑':['黑色','漆黑','乌黑'], '红':['红色','鲜红','通红'], '青':['青色','青绿','碧绿'],
 '长':['长长','很长','长的'], '快':['很快','迅速','快速','飞快'],
 '明亮':['明亮','光明','明净'], '不':['不','没有','不能','并未'],
 '没有':['没有','并无','无从','未有'], '在':['在'], '的':['的'],
 '一':['一','一个','一次'], '二':['二','两'], '三':['三'], '四':['四'],
 '五':['五'], '六':['六'], '七':['七'], '八':['八'], '九':['九'], '十':['十'],
 '我':['我','自己'], '你':['你','您'], '我们':['我们'], '它':['它'],
 '跑':['跑','逃跑','奔跑'], '看':['看见','看着','观看','察看'],
 '说':['说','说话','说道'], '问':['询问','问道','问他','问我'],
 '听':['听到','听见','听取'], '吃':['吃','食用'], '喝':['喝','饮用'],
 '死':['死','死亡','死去'], '走':['行走','步行','走去'],
 '马':['马'], '牛':['牛'], '狗':['狗'], '狼':['狼'], '鸟':['鸟'],
 '野兽':['野兽','禽兽','兽类'], '鱼':['鱼'], '树':['树木','树'],
 '竹子':['竹子','竹'], '草':['草木','草丛','青草','草'],
 '江水':['江水','江'], '河流':['河流','河水'], '山':['山'],
 '太阳':['太阳','日头'], '日子':['日子','一天','每天','天数'],
 '天':['天空','上天'], '年':['一年','每年','年岁'], '月':['月份','月亮'],
 '大腿':['大腿','腿部'], '旁边':['旁边','身旁','边上','一旁'],
 '早晨':['早晨','清晨','早上'], '傍晚':['傍晚','黄昏','晚上'],
 '停止':['停止','停下','停了','止息','停息'], '疲倦':['疲倦','疲劳','劳累'],
 '寒冷':['寒冷','寒凉','凉冷','凉爽','冰凉'], '凉爽':['凉爽','清凉','凉快','凉凉'],
 '抽动':['抽动','抽搐','搐动','牵动'], '收缩':['收缩','抽搐','抽缩'],
 '踩':['踩','踏','踩在','踏在'], '踏':['踏','踩','踩在','踏在'],
 '毛':['细毛','毛','绒毛','兽毛'], '用毛皮制成的衣服':['毛皮衣','毛衣','皮衣','毛织衣'],
 '多、茂盛':['众多','繁多','繁盛','茂盛'], '伸颈斜视':['斜视','斜着眼','侧目'],
 '缠绕':['缠绕','缠住','缠在'], '倒下':['倒下','倒地','翻倒'],
 '搁置':['搁置','搁在','放在'], '凶狠注视':['虎视眈眈','凶狠','眼睁睁'],
 '连接':['连接','连结','相连','连在'], '感到奇怪':['惊奇','奇怪','诧异'],
 '其':['他的','它的','他们的','自己的'], '他':['他','那个人'], '而':['而','却','并且'],
 '风':['风'], '竹':['竹子','竹'], '木':['木头','树木','木'], '门':['门'],
 '青翠':['青翠','翠绿','青绿','碧绿'], '苍翠':['苍翠','青绿','青色'],
 '浅':['浅','浅浅'], '香':['香气','芳香','清香'], '细':['细小','细细'],
 '圆':['圆形','圆圆','圆的'], '白色':['白色','雪白','洁白'], '水':['水'],
 '土':['土','土地','泥土'], '火':['火'], '酒':['酒'], '花':['花'],
 '鸟兽的细毛':['绒毛','细毛','细羊毛'], '螯夹':['螯','大钳','蟹钳','钳子'],
}
stop={'……','句末语气词','所字结构助词','连词','的','在','都','不','是','也','其','这','那','连接动作','连接前后两部分'}
bad=re.compile(r'[\uE000-\uF8FF\uFFFD]|\.{3}|…|奸淫|交媾|阴茎|阴户|强奸|剖腹|剜|肢解|割舌|以其髀加|妾之身|宠幸|性交|淫乱|裸体|裸露|媾合')
han=re.compile(r'[\u3400-\u9fff]')
def norm(s): return re.sub(r'\s+','',s).replace('∶','：').replace(',', '，')
def gloss_parts(s):
    s=re.sub(r'[（(][^）)]*[）)]','',s)
    s=re.sub(r'，?(名词|形容词|动词)(作|活用为).*$','',s)
    return [x.strip(' ；，。') for x in re.split('[、，；/]',s) if 1<=len(x.strip())<=12]
def school_gloss(s):
    if '这里指' in s:return s.rsplit('这里指',1)[1].strip(' ；，。')
    if '此处指' in s:return s.rsplit('此处指',1)[1].strip(' ；，。')
    # The referent belongs to a particular lesson, not to a word in another book.
    s=re.split(r'[，；]指|[，；]这里|[，；]此处|[，；]本文|[，；]文中|[，；]好事指',s)[0]
    return s
def variants(s):
    out=set()
    for p in gloss_parts(s):
        if p in stop: continue
        if p in aliases: out.update(aliases[p])
        elif not any(t in p for t in ['用字','姓名','地名','官职','表示','……','称谓','词尾','语气','助词']):out.add(p)
    return out

def lexical_window(src,tar,index,blocks):
    """Use identical surrounding text to isolate the replaced ancient word.

    A gloss elsewhere in a sentence is not lexical evidence. Reject long,
    unanchored replacements rather than attaching their gloss to every glyph.
    """
    previous_a=previous_b=0
    for a,b,n in blocks:
        if a<=index<a+n:
            j=b+index-a
            return max(0,j-2),min(len(tar),j+3),src[index],tar[max(0,j-2):j+3],True
        if previous_a<=index<a:
            if a-previous_a>4 or b-previous_b>20 or b==previous_b:return None
            return previous_b,b,src[previous_a:a],tar[previous_b:b],False
        previous_a,previous_b=a+n,b+n
    return None

raw_dictionary=pathlib.Path(args.dictionary).read_text().rstrip().rstrip(',')
dictionary={w['char']:w for w in json.loads('['+raw_dictionary+']')}
lexicon=json.loads(pathlib.Path('wenyan/evidence/linked-lexicon.json').read_text())
senses={}
for c,w in inputs['words'].items():
    entries=[]
    for s in w['senses']:
        meaning=school_gloss(s['meaning']);keys=variants(meaning)
        if keys:entries.append({**s,'meaning':meaning,'keys':keys,'school':True})
    meanings=list(w['dictionary'])
    for pronunciation in dictionary.get(c,{}).get('pronunciations',[]):
        for entry in pronunciation.get('explanations',[]):
            meaning=entry.get('content','').strip(' 。')
            if meaning.startswith(('(','（')):
                m=re.search(r'本义[:：]([^）)]+)',meaning)
                if m:meaning=m[1]
            if any(t in meaning for t in ['同本义','又','同“','姓','地名','国名','人名','一说','即。']):continue
            meanings.append(meaning)
    for meaning in dict.fromkeys(meanings):
        if not (1<=len(meaning)<=20):continue
        keys=variants(meaning)
        if keys:entries.append({'meaning':meaning,'code':'reference-'+c+'-'+hashlib.sha1(meaning.encode()).hexdigest()[:8],'pos':'实词','keys':keys,'school':False})
    for meaning,keys in lexicon.get(c,[]):
        keys=set(keys)
        entries.append({'meaning':meaning,'code':'reference-'+c+'-'+hashlib.sha1(meaning.encode()).hexdigest()[:8],'pos':'实词','keys':keys,'school':False})
        for school in entries:
            if school['school'] and any(k in school['meaning'] for k in keys if len(k)>=2 or school['meaning']==k==c):school['keys'].update(keys)
    senses[c]=entries

book_rank={b:i for i,b in enumerate(['论语','孟子','庄子','列子','韩非子','世说新语','战国策','左传','礼记','国语','史记','荀子','吕氏春秋','晏子春秋','墨子','淮南子','颜氏家训','贞观政要','梦溪笔谈','容斋随笔'])}
corpus=pathlib.Path(args.corpus_root)
selected={c:{} for c in senses}
def offer(title,text,translation,url,rank,provenance):
    text=norm(text);translation=norm(translation)
    if not 5<=len(text)<=90 or not 5<=len(translation)<=180 or bad.search(text+translation):return
    if len(translation)>len(text)*2.6:return
    if text==translation or not re.search('[。！？；]',text) or translation.count('，')>8:return
    if any(han.fullmatch(c) and c not in dictionary for c in text):return
    if '蕃寄' in text or '蕃条' in text or '寡事之器' in text:return
    blocks=difflib.SequenceMatcher(None,text,translation,autojunk=False).get_matching_blocks()
    for c in set(text).intersection(senses):
        if c=='兰' and '木兰' in text and re.search('男儿|女|军|贞女',translation):continue
        if c=='石' and re.search('石头城|石头事',text):continue
        if text.count(c)>3:continue
        window=lexical_window(text,translation,text.index(c),blocks)
        if not window:continue
        start,end,ancient_piece,modern_piece,retained=window
        evidence=translation[start:end]
        matched=[s for s in senses[c] if any(k in evidence for k in s['keys'])]
        if retained:
            # A surviving character in a name cannot borrow a different word's
            # gloss from its neighbourhood (e.g. 孔子很聪明 does not make 孔=很).
            matched=[s for s in matched if any(c in k and k in evidence for k in s['keys'])]
        if text.count(c)>1:
            windows=[lexical_window(text,translation,i,blocks)for i,v in enumerate(text)if v==c]
            if any(w is None for w in windows):continue
            matched=[s for s in matched if all(any(k in translation[w[0]:w[1]] for k in s['keys'])for w in windows)]
        if c=='案' and not re.search('此案|文案|案牍|成案|疑案',text):matched=[s for s in matched if s['meaning']!='案件']
        if not matched:continue
        # Putative/causative readings require their grammatical force in the translation.
        matched=[s for s in matched if not ('意动' in s['meaning']+s['pos'] and not re.search('认为|以为|觉得|看作',evidence))]
        matched=[s for s in matched if not ('使动' in s['meaning']+s['pos'] and not re.search('使|让|令',evidence))]
        if not matched:continue
        school=[s for s in matched if s['school']]
        matched=school or matched
        chosen=max(matched,key=lambda s:max(len(k) for k in s['keys'] if k in evidence))
        common=chosen['keys']
        compatible=[s for s in matched if common.intersection(s['keys'])]
        codes=list(dict.fromkeys(s['code'] for s in compatible))
        # A short sentence with one glyph and an explicit modern gloss is
        # reference evidence; keep its inference and paired line provenance.
        item={'title':title,'text':text,'translation':translation,'meaning':chosen['meaning'],'pos':'参考字义','code':chosen['code'],'codes':codes,'url':url,'rank':rank+len(text)/100,'provenance':provenance,'alignment':{'ancient':ancient_piece,'modern':modern_piece,'retained':retained}}
        key=(title,chosen['code'])
        if key not in selected[c] or selected[c][key]['rank']>item['rank']:selected[c][key]=item

# The original, positional classroom annotations are merged by the browser.
# Do not re-infer their meanings from a sentence's modern translation.
files=sorted(corpus.glob('双语数据/**/source.txt'),key=lambda p:(book_rank.get(p.parts[len(corpus.parts)+1],100),str(p)))
scanned=0;misaligned=0
for f in files:
    dst=f.with_name('target.txt')
    if not dst.exists():continue
    source=f.read_text(encoding='utf-8-sig').splitlines();modern=dst.read_text(encoding='utf-8-sig').splitlines()
    if len(source)!=len(modern):misaligned+=1;continue
    rel=f.relative_to(corpus);parts=rel.parts[1:-1];book=parts[0];title='·'.join(parts)
    url='https://github.com/NiuTrans/Classical-Modern/tree/main/'+str(rel.parent)
    for line,(src,tar) in enumerate(zip(source,modern),1):
        scanned+=1
        offer(title,src,tar,url,205+book_rank.get(book,50),{'provider':'NiuTrans/Classical-Modern','path':str(rel),'line':line,'kind':'paired-reference'})

# Keep independent works and two witnesses of each available classroom sense.
out={};counts={}
for c,rows in selected.items():
    items=sorted(rows.values(),key=lambda r:r['rank']);chosen=[];books=set();texts=set();code_books=collections.defaultdict(set)
    for r in items:
        if r['title'] in books:continue
        normalized=''.join(han.findall(r['text']))
        if any(normalized in t or t in normalized for t in texts):continue
        needed=len(books)<12 or any(len(code_books[k])<3 for k in r['codes'] if not k.startswith('reference-'))
        if not needed:continue
        chosen.append(r);books.add(r['title']);texts.add(normalized)
        for k in r['codes']:code_books[k].add(r['title'])
        if len(chosen)>=30:break
    out[c]=chosen;counts[c]={'books':len(books),'senses':{k:len(v) for k,v in code_books.items()}}
# Preserve the corrections and rare-character translations reviewed for this release.
for r in out.get('熟',[]):
    if '戒敕之不熟' in r['text']:
        r.update(translation='南唐主惋惜、悔恨了好多天，自认为事先告诫得不够周密。',meaning='周密、仔细',code='reference-熟-careful',codes=['reference-熟-careful'])
        r['alignment']={'ancient':'熟','modern':'周密','retained':False}
        r['provenance'].update(kind='context-reviewed',translation='本站据原文校译')
reviewed_path=pathlib.Path(__file__).resolve().parents[1]/'evidence/linked-reviewed.json'
reviewed=json.loads(reviewed_path.read_text(encoding='utf8'))
for c,rows in reviewed.items():
    existing={(r['title'],r['text']) for r in out.setdefault(c,[])}
    out[c].extend(r for r in rows if (r['title'],r['text']) not in existing)
dest=pathlib.Path(args.output);dest.mkdir(parents=True,exist_ok=True)
shards=[{} for _ in range(64)]
for c,rows in out.items():
    shards[ord(c)%64][c]=rows
for n,shard in enumerate(shards):(dest/f'{n:02d}.json').write_text(json.dumps(shard,ensure_ascii=False,separators=(',',':')))
report={'scannedPairs':scanned,'misalignedFilesSkipped':misaligned,'characters':len(out),'withSixBooks':sum(len({r['title']for r in v})>=6 for v in out.values()),'examples':sum(len(v)for v in out.values()),'counts':counts}
(dest/'manifest.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':')))
print(json.dumps({k:v for k,v in report.items()if k!='counts'},ensure_ascii=False))
