"""Extend the MIT reference dictionary to every glyph in published excerpts."""
import argparse,json,pathlib,re,subprocess,tempfile
p=argparse.ArgumentParser();p.add_argument('--dictionary',required=True);p.add_argument('--examples',required=True);args=p.parse_args()
root=pathlib.Path('wenyan');dest=root/'study-reference-dictionary.js'
raw=dest.read_text();dictionary=json.loads(raw[raw.index('={')+1:].rstrip().rstrip(';'))
data=json.loads('['+pathlib.Path(args.dictionary).read_text().rstrip().rstrip(',')+']');source={r['char']:r for r in data}
texts=[]
with tempfile.TemporaryDirectory()as tmp:
 f=pathlib.Path(tmp)/'data.json';subprocess.run(['node','wenyan/scripts/export-linked-inputs.mjs',str(f)],check=True)
 inputs=json.loads(f.read_text());texts.extend(r['text']for r in inputs['pool'])
for shard in pathlib.Path(args.examples).glob('[0-9][0-9].json'):
 texts.extend(r['text']for rows in json.loads(shard.read_text()).values()for r in rows)
chars=set(c for text in texts for c in text if re.fullmatch(r'[\u3400-\u9fff]',c));missing=[];added=0
def meanings(char,seen=None):
 seen=set(seen or());
 if char in seen:return[]
 seen.add(char);out=[]
 for sound in source.get(char,{}).get('pronunciations',[]):
  for e in sound.get('explanations',[]):
   variant=e.get('simplified')or e.get('variant')or e.get('modern')or e.get('same')
   if variant and variant!=char:
    out.extend('同“'+variant+'”：'+s for s in meanings(variant,seen)[:2])
   meaning=e.get('content','').strip(' 。')
   if meaning.startswith(('(','（')):
    m=re.search(r'本义[:：]([^。;；）)]+)',meaning)
    if m:meaning=m[1]
    else:meaning=re.sub(r'^[（(].*?[）)]','',meaning).lstrip(' 。—')
   if not meaning or meaning.startswith(('同本义','又。','见“','从','形声','会意','表示小步')):
    for w in e.get('words',[]):
     if w.get('word') and w.get('text'):out.append('用于“'+w['word']+'”：'+w['text'].strip(' 。'))
    continue
   meaning=re.split(r'[。;；]',meaning)[0]
   if len(meaning)>70:meaning=re.split(r'[,，]',meaning)[0]
   if meaning and meaning not in out:out.append(meaning)
 return out or {'埠':['码头；停泊船只和装卸货物的地方'],'徘':['用于“徘徊”：来回走动'],'琶':['用于“琵琶”：一种弹拨乐器'],'櫜':['收藏弓箭等器物的袋子'],'湩':['乳汁；奶'],'偊':['偊偊：独行的样子，也形容谨慎'],'岖':['崎岖：山路不平'],'嵘':['峥嵘：山势高峻，也比喻不平凡'],'煅':['放在火中烧炼'],'罝':['捕兔的网，泛指捕鸟兽的网'],'膰':['古代祭祀用的熟肉'],'擗':['捶胸；用手拍打'],'饠':['用于饆饠：一种饼食'],'骪':['骨头弯曲；弯曲']}.get(char,[])
for c in sorted(chars):
 if dictionary['words'].get(c,{}).get('s'):continue
 row=source.get(c);glosses=meanings(c);pinyin=[]
 for sound in(row or{}).get('pronunciations',[]):
  pinyin.append(sound.get('pinyin',''))
 if not glosses:missing.append(c);continue
 dictionary['words'][c]={'p':'/'.join(dict.fromkeys(pinyin)),'s':glosses[:5]};added+=1
if missing:raise SystemExit('Missing actual dictionary entries: '+''.join(missing))
dest.write_text('/* 字典参考：mapull/chinese-dictionary (MIT), https://github.com/mapull/chinese-dictionary 。少数字条为本站补充。 */\nwindow.WENYAN_REFERENCE_DICTIONARY='+json.dumps(dictionary,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'added':added,'total':len(dictionary['words']),'excerptCharacters':len(chars)},ensure_ascii=False))
