/**
 * Extended background-only primary source texts for Wenyan.
 * Study popups NEVER display unreviewed corpus hits. Candidate texts are available
 * only in the teacher/editor, which requires a translation and an explicit sense label.
 * Sources: Wikisource public-domain ancient texts; Wiki transcriptions retain attribution.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
import {Converter} from 'opencc-js';
const cn=Converter({from:'tw',to:'cn'}),dir='dist/wenyan/evidence';
const cache='.evidence-cache';
const sleep=n=>new Promise(r=>setTimeout(r,n));
const clean=x=>String(x||'').replace(/[\u200b-\u200f\u00a0]/g,' ').replace(/[ \n\t\r]+/g,' ').trim();
const pageURL=t=>'https://zh.wikisource.org/wiki/'+t.split('/').map(encodeURIComponent).join('/');
const data=[
// Elementary-grade commonly studied premodern verse and short prose; curriculum labels are discovery aids, not official edition verification.
['小学','咏鹅','詠鵝'],['小学','春晓','春曉'],['小学','静夜思','靜夜思'],['小学','登鹳雀楼','登鸛雀樓'],
['小学','悯农','憫農'],['小学','江雪','江雪'],['小学','望庐山瀑布','望廬山瀑布'],['小学','早发白帝城','早發白帝城'],
['小学','赠汪伦','贈汪倫'],['小学','独坐敬亭山','獨坐敬亭山'],['小学','黄鹤楼送孟浩然之广陵','黃鶴樓送孟浩然之廣陵'],
['小学','送元二使安西','送元二使安西'],['小学','九月九日忆山东兄弟','九月九日憶山東兄弟'],
['小学','鹿柴','鹿柴'],['小学','竹里馆','竹里館'],['小学','山行','山行'],['小学','清明','清明'],
['小学','绝句','絕句'],['小学','春夜喜雨','春夜喜雨'],['小学','赋得古原草送别','賦得古原草送別'],
['小学','村居','村居'],['小学','所见','所見'],['小学','小池','小池'],['小学','晓出净慈寺送林子方','曉出淨慈寺送林子方'],
['小学','题西林壁','題西林壁'],['小学','饮湖上初晴后雨','飲湖上初晴後雨'],
['小学','游子吟','遊子吟'],['小学','游园不值','遊園不值'],['小学','示儿','示兒'],['小学','墨梅','墨梅'],
['小学','石灰吟','石灰吟'],['小学','竹石','竹石'],['小学','泊船瓜洲','泊船瓜洲'],
// Junior high commonly studied classical prose, poems (source texts can differ from specific textbook extracts)
['初中','周亚夫军细柳','史記/卷057'],['初中','穿井得一人','呂氏春秋/慎行論/察傳'],['初中','诫子书','誡子書'],
['初中','诵读论语','論語/先進第十一'],['初中','论语颜渊','論語/顏淵第十二'],['初中','论语季氏','論語/季氏第十六'],
['初中','梦溪笔谈活板','夢溪筆談/卷十八'],['初中','愚公移山','列子/湯問篇'],
['初中','庄子两则','莊子/秋水'],['初中','河中石兽','河中石獸'],
['初中','岳阳楼记','岳陽樓記'],['初中','醉翁亭记','醉翁亭記'],
['初中','茅屋为秋风所破歌','茅屋為秋風所破歌'],['初中','石壕吏','石壕吏'],
['初中','木兰诗','木蘭詩'],['初中','卖炭翁','賣炭翁'],['初中','观沧海','觀滄海'],
['初中','望岳','望嶽'],['初中','春望','春望'],['初中','饮酒','飲酒'],
['初中','赤壁','赤壁'],['初中','关雎','詩經/關雎'],['初中','蒹葭','詩經/蒹葭'],
['初中','己亥杂诗','己亥雜詩'],['初中','桃花源记','桃花源記'],
['初中','鱼我所欲也','孟子/告子上'],['初中','出师表','前出師表'],['初中','三峡','三峽'],
['初中','马说','雜說四·馬說'],['初中','送东阳马生序','送東陽馬生序'],['初中','小石潭记','至小丘西小石潭記'],
['初中','生于忧患死于安乐','孟子/告子下'],
// Senior high: prose, pre-Qin classics, prose/poems from commonly studied traditional authors.
['高中','过秦论','過秦論'],['高中','师说','師說'],['高中','劝学','荀子/勸學篇'],['高中','六国论','六國論'],
['高中','阿房宫赋','阿房宮賦'],['高中','赤壁赋','前赤壁賦'],['高中','后赤壁赋','後赤壁賦'],
['高中','陈情表','陳情表'],['高中','鸿门宴','史記/卷007'],['高中','廉颇蔺相如列传','史記/卷081'],
['高中','苏武传','漢書/卷054'],['高中','屈原列传','史記/卷084'],
['高中','兰亭集序','蘭亭集序'],['高中','归去来兮辞','歸去來兮辭'],
['高中','种树郭橐驼传','種樹郭橐駝傳'],['高中','项脊轩志','項脊軒志'],
['高中','石钟山记','石鐘山記'],['高中','谏太宗十思疏','諫太宗十思疏'],
['高中','答司马谏议书','答司馬諫議書'],['高中','五代史伶官传序','五代史伶官傳序'],
['高中','登泰山记','登泰山記'],['高中','报任安书','報任安書'],['高中','与妻书','與妻書'],
['高中','谏逐客书','諫逐客書'],['高中','祭十二郎文','祭十二郎文'],['高中','滕王阁序','滕王閣序'],
['高中','庖丁解牛','莊子/養生主'],['高中','子路曾皙冉有公西华侍坐','論語/先進第十一'],
['高中','齐桓晋文之事','孟子/梁惠王上'],['高中','人皆有不忍人之心','孟子/公孫丑上'],
['高中','老子四章','道德經/第1章'],['高中','大学之道','禮記/大學'],
['高中','礼记学记','禮記/學記'],['高中','礼记礼运','禮記/禮運'],
['高中','归园田居','歸園田居'],['高中','短歌行','短歌行'],['高中','离骚','離騷'],
['高中','将进酒','將進酒'],['高中','蜀道难','蜀道難'],['高中','梦游天姥吟留别','夢遊天姥吟留別'],
['高中','琵琶行','琵琶行'],['高中','登高','登高'],['高中','锦瑟','錦瑟'],
['高中','念奴娇赤壁怀古','念奴嬌·赤壁懷古'],['高中','永遇乐京口北固亭怀古','永遇樂·京口北固亭懷古'],
// Aphorism source chapters; each chapter consists of many sayings; these are background references, not fabricated quotes.
...[
'學而第一','為政第二','八佾第三','里仁第四','公冶長第五','雍也第六','述而第七','泰伯第八','子罕第九','鄉黨第十',
'先進第十一','顏淵第十二','子路第十三','憲問第十四','衛靈公第十五','季氏第十六','陽貨第十七','微子第十八','子張第十九','堯曰第二十'
].map(t=>['名言原典','论语·'+cn(t),'論語/'+t]),
...['梁惠王上','梁惠王下','公孫丑上','公孫丑下','滕文公上','滕文公下','離婁上','離婁下','萬章上','萬章下','告子上','告子下','盡心上','盡心下'].map(t=>['名言原典','孟子·'+cn(t),'孟子/'+t]),
...['勸學篇','修身篇','不苟篇','榮辱篇','非十二子篇','王制篇','富國篇'].map(t=>['名言原典','荀子·'+cn(t),'荀子/'+t]),
...['說難','孤憤','五蠹','顯學','難一','外儲說左上'].map(t=>['名言原典','韩非子·'+cn(t),'韓非子/'+t]),
...['天瑞篇','黃帝篇','周穆王篇','仲尼篇','湯問篇','力命篇','楊朱篇','說符篇'].map(t=>['名言原典','列子·'+cn(t),'列子/'+t]),
...['學記','禮運','大學','中庸','曲禮上','曲禮下','檀弓上','檀弓下'].map(t=>['名言原典','礼记·'+cn(t),'禮記/'+t]),
// Selected classical historical books; keep max text slices per volume and a source link.
...['004','006','007','008','016','048','057','062','067','075','077','079','081','083','084','086','087','092','095','097','107','108','109','110','112','117','120','124','129','130'].map(i=>['史籍','史记·卷'+i,'史記/卷'+i]),
...['001','020','038','048','054','058','061','062','063','067','068','082','088','094'].map(i=>['史籍','汉书·卷'+i,'漢書/卷'+i]),
...['001','036','049','054','058','059','061','062','063','064','065','066','067','068','070','071','072','073','074','075','076','077','078','079','080','081','082','083','084','085','086','087','088','089','090','091'].map(i=>['史籍','资治通鉴·卷'+i,'資治通鑑/卷'+i])
];
const groupFile={"小学":"primary","初中":"junior","高中":"senior","名言原典":"sayings","史籍":"histories"};
const digest=s=>crypto.createHash('sha1').update(s).digest('hex');
const cachePath=title=>path.join(cache,digest(title)+'.json');
async function wikimedia(title){
 try{const json=JSON.parse(await fs.readFile(cachePath(title),'utf8'));if(json?.html)return json.html;}catch{}
 const url='https://zh.wikisource.org/w/api.php?'+new URLSearchParams({action:'parse',page:title,prop:'text',format:'json',formatversion:'2',redirects:'1',maxlag:'5'});
 let error=null;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch(url,{headers:{'user-agent':'WenyanWikisourceCorpora/1.0 (junweiqu-png/shanghan-selector; educational)'},signal:AbortSignal.timeout(18000)});
   if(!res.ok)throw Error(res.status===404?'MISSING':'HTTP '+res.status);
   const v=await res.json();
   if(v.error)throw Error(v.error.code==='missingtitle'?'MISSING':v.error.code);
   const html=v.parse?.text;if(typeof html!=='string'||!html)throw Error('EMPTY');
   await fs.mkdir(cache,{recursive:true});await fs.writeFile(cachePath(title),JSON.stringify({page:title,html}),'utf8');
   return html;
  }catch(e){error=e.message;if(error==='MISSING'||error==='missingtitle')break;await sleep(400*(attempt+1));}
 }
 throw Error(error||'UNKNOWN');
}
function extract(html){
 const $=load(html);const body=$('.mw-parser-output').first();if(!body.length)return '';
 body.find('style,script,small,sup.reference,span.reference,.mw-editsection,.noprint,.mw-references-wrap,.reference-text,.mw-cite-backlink,table').remove();
 const blocks=body.children('p,blockquote,div.poem,div.mw-poem-indented,ol').toArray();
 let lines=blocks.map(el=>{
  const item=$(el);if(item.is('ol'))return item.children('li').toArray().map(li=>clean(cn($(li).text()))).join('\n');
  return clean(cn(item.text()));
 }).filter(t=>t.length>5&&!/^(目录|上一页|下一页|译文|作者|返回|本书|本页)/.test(t));
 let text=lines.join('\n');
 if(text.length<15){
  text=clean(cn(body.text()));
 }
 return text.replace(/\n{3,}/g,'\n\n').slice(0,42000);
}
function chunk(text,limit=950){
 const paragraphs=text.split(/\n/).flatMap(s=>(s.match(/[^。！？；]{1,380}[。！？；]?/gu)||[s])).map(clean).filter(Boolean);
 const out=[];let acc='';
 for(const s of paragraphs){if((acc+s).length>limit&&acc){out.push(acc);acc='';}acc+=(acc?' ':'')+s;}if(acc)out.push(acc);
 return out;
}
const prior=JSON.parse(await fs.readFile(path.join(dir,'catalog.json'),'utf8'));
const existing=new Set(prior.entries.map(x=>x.url));
const unique=data.filter((v,i,a)=>a.findIndex(x=>x[2]===v[2])===i).filter(x=>!existing.has(pageURL(x[2])));
console.log('EXTENSION TARGETS',unique.length,'duplicates filtered',data.length-unique.length);
const groups={},missing=[];let processed=0;const concurrency=4;
for(const section of Object.keys(groupFile))groups[section]=[];
let position=0;
async function worker(){
 while(position<unique.length){
  const [grade,label,page]=unique[position++];
  try{
   const text=extract(await wikimedia(page));
   if(text.length<18||text.length>42000)throw Error('unusable article length '+text.length);
   const passages=chunk(text);
   if(!passages.length)throw Error('empty paragraph chunks');
   for(let i=0;i<passages.length;i++){
    const snippet=passages[i],title=label+(passages.length>1?' · '+(i+1):'');
    groups[grade].push({id:'ex-'+digest(page+'-'+i).slice(0,16),group:grade,title,work:label,
      text:snippet,sentences:snippet.match(/[^。！？；]+[。！？；]?/gu)?.map(clean).filter(Boolean)||[snippet],
      url:pageURL(page),edition:'维基文库公版古籍转写；仅供原典候选检索'});
   }
   processed++;if(processed%15===0)console.log('EXTENSION PROGRESS',processed+'/'+unique.length);
  }catch(e){missing.push({grade,label,page,error:e.message});}
  await sleep(70);
 }
}
await Promise.all(Array.from({length:concurrency},worker));
await fs.mkdir(dir,{recursive:true});
const manifest={generatedAt:new Date().toISOString(),source:'维基文库古籍校录本；只作为后台未审释义的原典候选资源',
 editionNote:'小学/初中/高中是常见篇目检索提示，不代表已逐一核对某年某版教科书收录情况',
 policy:'没有人工译文、具体义项、出处的检索结果不能作为关联学习卡片对学生直接呈现',
 files:[],missing,sourcePages:processed,targets:unique.length};
for(const grade of Object.keys(groupFile)){
 const entries=groups[grade],file='expanded-'+groupFile[grade]+'.json';
 await fs.writeFile(path.join(dir,file),JSON.stringify({grade,entries}), 'utf8');
 manifest.files.push({grade,file,passages:entries.length,sourcePages:new Set(entries.map(x=>x.url)).size});
}
await fs.writeFile(path.join(dir,'expanded-manifest.json'),JSON.stringify(manifest,null,2),'utf8');
console.log('EXTENDED CORPUS BUILT',JSON.stringify({targets:manifest.targets,sourcePages:manifest.sourcePages,passages:manifest.files.reduce((n,x)=>n+x.passages,0),groups:manifest.files,missing:missing.length}));
