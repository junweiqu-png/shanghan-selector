import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dir=process.env.WENYAN_ROOT||'wenyan/',dbWindow={};
const js=fs.readFileSync(dir+'study-annotations.js','utf8');
new vm.Script(js,{filename:'study-annotations.js'}).runInNewContext({window:dbWindow});
const D=dbWindow.WENYAN_ANNOTATIONS;
assert(D && D.words && D.grammar,'annotation data missing');
let lex=0,gram=0;const seen=new Set();
for(const [term,v] of Object.entries(D.words)){
 assert(Array.isArray(v.examples),'missing examples for '+term);
 for(const s of v.sources||[]){
   assert(s.length===6&&s.every(Boolean),'invalid source sense '+term+' '+JSON.stringify(s));
   assert(s[1].includes(term),'source anchor does not include the headword '+term+' '+s[1]);
 }
 for(const x of v.examples){
  assert(x.length>=8,'incomplete lexical entry '+term);
  assert(x.slice(0,8).every(Boolean),'blank lexical fields '+term+' '+JSON.stringify(x));
  assert(x[2].includes(term),'quote does not contain headword '+term+' '+x[0]);
  assert(!/\(本句没有/.test(x[4]),'negative-control example should not be shown');
  if(x[8])assert(/^https:\/\//.test(x[8]),'source link must be an absolute https URL');
  assert(!seen.has(term+'|'+x[0]+'|'+x[2]),'duplicate lexical example');
  seen.add(term+'|'+x[0]+'|'+x[2]);lex++;
 }
}
for(const [pattern,v] of Object.entries(D.grammar)){
 assert(v.definition&&Array.isArray(v.examples)&&v.examples.length,'missing grammar details '+pattern);
 for(const x of v.examples){
   assert(x.length>=6&&x.slice(0,6).every(Boolean),'incomplete grammar passage '+pattern);
   assert(x[2].length>3&&x[3].length>5,'grammar excerpt needs original and translation');
   gram++;
 }
}
const yin=D.words['因'];assert(yin&&yin.examples.length>=7,'multi-sense 因 missing');
const yinSource=yin.sources.find(x=>x[0]==='咏雪');
assert(yinSource?.[4]==='advantage','咏雪 因 must mean taking advantage of wind');
for(const [title,code] of [['过秦论','advantage'],['烛之武退秦师','depend'],['唐雎不辱使命','then']]){
 assert(yin.examples.some(e=>e[0]===title&&e[6]===code),'missing important 因 contrast '+title);
}
const suo=D.words["所"];
assert(suo,"“所” must have a study entry");
assert(suo.sources.some(x=>x[0]==="世说新语·赏誉"&&x[1]==="墓所"&&x[2].includes("地方")&&x[3]==="名词"&&x[4]==="place"),"“墓所” must show place noun, not unknown sense");
assert(suo.examples.some(x=>x[0]==="论语·为政"&&x[6]==="place"&&x[3]),"need translated same-sense example for place noun");
assert(suo.examples.some(x=>x[0]==="刻舟求剑"&&x[6]==="nominal"&&x[3]),"must distinguish nominalizing particle from place noun");
assert(suo.examples.some(x=>x[0]==="书戴嵩画牛"&&x[6]==="nominal"&&x[3]),"“所宝” nominalizing example needed");
const yu=D.words["与"];
assert(yu&&yu.sources.length>=7&&yu.examples.length>=7,"与 must have cross-text verified meanings");
for(const [work,phrase,sense] of [
 ["咏雪","与儿女讲论文义","with"],["陈太丘与友期行","与友期行","with"],
 ["学弈","虽与之俱学","with"],["学弈","智弗若与","question"],
 ["答谢中书书","能与其奇者","appreciate"]]){
 assert(yu.sources.some(x=>x[0]===work&&x[1]===phrase&&x[4]===sense),"与 missing source sense "+work+" "+phrase);
}
for(const code of ["with","agree","give","appreciate","question"])
 assert(yu.examples.some(x=>x[6]===code&&x[3]),"与 missing translated sense "+code);
assert(!"荀巨伯远看友人疾，值胡贼攻郡。".includes("与"),"regression setup requires an unrelated active sentence");
const qi=D.words["期"];
assert(qi&&qi.examples.length>=10,"期 needs broad translated cross-text examples");
assert(qi.sources.some(x=>x[0]==="陈太丘与友期行"&&x[4]==="appoint"),"陈太丘 期 must mean agreed appointment");
for(const code of ["appoint","appointment","deadline","year","aspire"])
 assert(qi.examples.some(x=>x[6]===code),"missing 期 semantic class "+code);
assert(qi.examples.filter(x=>x[0].startsWith("世说新语·")).length>=3,"期 needs 3 independent Shishuo examples");
assert(qi.examples.filter(x=>x[0].startsWith("史记·")).length>=2,"期 needs examples from Shiji");
assert(qi.examples.some(x=>x[0]==="邹忌讽齐王纳谏"&&x[4].includes("jī")),"期年 requires jī pronunciation");
assert(qi.examples.every(x=>x[0]!=="陈太丘与友期行"),"do not repeat clicked origin as related example");
const ni=D.words["拟"];
assert(ni && ni.examples.length>=5,"拟 needs several translated cross-text examples");
assert(ni.sources.some(x=>x[0]==="咏雪"&&x[4]==="compare"),"拟 missing source-lesson meaning");
assert(ni.examples.some(x=>x[6]==="compare"),"拟 needs equivalent sense");
assert(ni.examples.some(x=>x[6]==="imitate"),"拟 needs related sense");
assert(ni.examples.some(x=>x[6]==="nominate"),"拟 needs different official-nomination sense");
assert(ni.examples.every(x=>x[0]!=="咏雪"),"original work cannot repeat as associated example");
const app=fs.readFileSync(dir+'index.html','utf8');
for(const name of ['study-annotations.js','study-verified-corpus.js','study-explorer.js','study-explorer.css'])assert(app.includes(name),'asset missing in HTML '+name);
const editor=fs.readFileSync(dir+'study-editor.js','utf8');
assert(editor.includes('large-term-index'),'teacher search must query complete words/phrases, not only first-character samples');
assert(editor.includes('r.matched||term'),'teacher search must preserve the actual matched form');
const builder=fs.readFileSync(dir+'scripts/build-large-corpus.mjs','utf8');
assert(builder.includes('termAliases')&&builder.includes('large-term-index'),'full-text builder must index semantic aliases and complete terms');
const expl=fs.readFileSync(dir+'study-explorer.js','utf8');
new vm.Script(expl,{filename:'study-explorer.js'});
assert(!/上句|下句|命中句/.test(expl),'old up/down/target labels present in visible UI code');
assert(!/rawCount|原典命中|字形匹配/.test(expl),'uncurated raw hits or background counts leaked to learning page');
assert(expl.includes('if(r.title===origin.title)continue'),'source work must be excluded from associated list');
assert(expl.includes('function indexOrigin(term)'),'glossary must locate an actual sentence, not the current reading');
assert(expl.includes('which.closest("#wordList")'),'glossary click needs its own origin context');
assert(expl.includes('if(!text.includes(term))'),'never display an ancient quote that lacks its purported headword');
assert(expl.includes('const key=r.title+"|"+normalizeSense(r.code)'),'identical source senses must be deduplicated');
const extendedWindow={};
for(const file of ['data-basic.js','data-classic.js','data-extra.js']){
 const source=fs.readFileSync(dir+file,'utf8');
 new vm.Script(source,{filename:file}).runInNewContext({window:extendedWindow});
}
let extraLex=0,extraGram=0;
for(const [file,key] of [['study-crosslesson.js','WENYAN_CROSSLESSON'],['study-verified-extra.js','WENYAN_VERIFIED_EXTRA'],['study-verified-more2.js','WENYAN_VERIFIED_MORE2'],['study-verified-common3.js','WENYAN_VERIFIED_COMMON3'],['study-verified-corpus.js','WENYAN_VERIFIED_CORPUS'],['study-verified-batch4.js','WENYAN_VERIFIED_BATCH4'],['study-verified-batch5.js','WENYAN_VERIFIED_BATCH5'],['study-verified-batch6.js','WENYAN_VERIFIED_BATCH6'],['study-grammar-more.js','WENYAN_GRAMMAR_MORE']]){
 const source=fs.readFileSync(dir+file,'utf8');
 new vm.Script(source,{filename:file}).runInNewContext({window:extendedWindow});
 assert(app.includes(file),'supplemental corpus not included in HTML '+file);
 const added=extendedWindow[key];assert(added,'missing data '+key);
 for(const [word,spec] of Object.entries(added.words||{})){
  for(const x of spec.examples||[]){
   assert(x[2]?.includes(x[9]||word),'quote missing searched/matched word '+word+' '+x[0]);
   assert(x[3]&&x[4]&&x[5]&&x[6]&&x[7],'unreviewed example in '+word+' '+x[0]);
   extraLex++;
  }
 }
 for(const [label,spec] of Object.entries(added.grammar||{})){
  for(const x of spec.examples||[]){
   assert(x[2]&&x[3]&&x[4]&&x[5],'incomplete grammar '+label+' '+x[0]);extraGram++;
  }
 }
}
for(const term of ['俄而','未若','诣','疾','顾','引','骤','舍','值']){
 const rows=extendedWindow.WENYAN_VERIFIED_EXTRA?.words?.[term]?.examples||[];
 assert(rows.length>=5,'less than five translated verified sources for '+term);
}
for(const term of ['诸','竞','莫','弗','汝','岂','委']){
 const rows=extendedWindow.WENYAN_VERIFIED_MORE2?.words?.[term]?.examples||[];
 assert(rows.length>=5,'less than five translated secondary sources for '+term);
}
for(const term of ['闻','或','甚','唯']){
 const x=extendedWindow.WENYAN_VERIFIED_COMMON3?.words?.[term];
 assert(x?.examples?.length>=5,'need five cross-work examples for '+term);
 for(const row of x.examples)assert(row[2].includes(term)&&row[3]&&row[6],'missing quote, translation or sense for '+term);
}
assert(extendedWindow.WENYAN_VERIFIED_MORE2.words['莫'].examples.some(x=>x[2].includes('莫当就卿谈')&&x[6]==='none'),'莫当 should mean no one, not prohibition');
const inner=extendedWindow.WENYAN_VERIFIED_CORPUS?.words?.['内集'];
assert(inner?.sources?.some(x=>x[0]==='咏雪'&&x[4]==='gather'),'内集 source sense missing');
assert(inner?.examples?.length>=5,'内集 needs five translated examples');
assert(inner.examples[0][6]==='gather'&&inner.examples[1][6]==='gather','内集 first two examples must share gather sense');
assert(inner.examples[2][6]==='collection','内集 must distinguish book-title/collection sense');
assert(inner.examples.some(x=>x[2].includes('集')&&x[9]==='集'),'内集 should support a related 集 match');
const ji=extendedWindow.WENYAN_VERIFIED_CORPUS?.words?.['集'];
assert(ji?.sources?.some(x=>x[0]==='咏雪'&&x[4]==='gather'),'集 source sense missing');
assert(ji?.examples?.length>=5,'集 needs five translated examples');
for(const term of ['内集','集'])for(const x of extendedWindow.WENYAN_VERIFIED_CORPUS.words[term].examples)
 assert(x[2].includes(x[9]||term)&&x[3]&&x[4]&&x[5]&&x[6]&&x[7]&&x[8],'incomplete related-word example '+term);
for(const term of ['儿女','鬻','誉','陷']){
 const spec=extendedWindow.WENYAN_VERIFIED_BATCH4.words[term];
 assert(spec?.sources?.length>0&&spec.examples?.length>=5,'curated batch4 must provide 5 examples '+term);
 assert(spec.examples.every(x=>x[2].includes(x[9]||term)&&x[3]&&x[8]),'unverified original or translation '+term);
}
for(const term of ['儿女','鬻','誉']){
 const item=extendedWindow.WENYAN_VERIFIED_BATCH4.words[term];
 assert(item.examples[0][6]===item.sources[0][4]&&item.examples[1][6]===item.sources[0][4],
  'first two examples must match source sense '+term);
}
for(const term of ['株','触','释','耒','冀']){
 const spec=extendedWindow.WENYAN_VERIFIED_BATCH5.words[term];
 assert(spec?.sources?.length>0&&spec.examples?.length>=5,'reviewed batch5 requires five examples '+term);
 assert(spec.examples.every(x=>x[2].includes(x[9]||term)&&x[3]&&x[8]),'missing verified text or translation '+term);
 assert(spec.examples[0][6]===spec.sources[0][4]&&spec.examples[1][6]===spec.sources[0][4],
  'first two batch5 examples must share origin sense '+term);
}
assert(extendedWindow.WENYAN_VERIFIED_BATCH5.words['释'].sources.some(x=>x[0]==='卖油翁'),
 '释 must be annotated in both 守株待兔 and 卖油翁');
for(const term of ['惠','履','度','操']){
 const s=extendedWindow.WENYAN_VERIFIED_BATCH6.words[term];
 assert(s?.sources?.length>0&&s.examples.length>=5,'reviewed batch6 requires five translated original excerpts for '+term);
 assert(s.examples.every(x=>x[2].includes(x[9]||term)&&x[3]&&x[8]),'unverified quote or translation '+term);
 assert(s.examples[0][6]===s.sources[0][4]&&s.examples[1][6]===s.sources[0][4],
  'first two batch6 examples must match context '+term);
}
assert(extraLex>=495&&extraGram>=85,'expanded evidence was not compiled');
assert(lex>=90&&gram>=70,'unexpected evidence coverage drop');
console.log(JSON.stringify({ok:true,words:Object.keys(D.words).length,translatedWordExamples:lex,extraWordExamples:extraLex,grammarTopics:Object.keys(D.grammar).length,translatedGrammarExamples:gram,extraGrammarExamples:extraGram},null,2));