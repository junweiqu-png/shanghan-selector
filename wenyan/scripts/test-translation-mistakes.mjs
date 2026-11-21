import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const win={},html=fs.readFileSync("wenyan/index.html","utf8");
for(const file of [...html.matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]).filter(x=>!["app.js","study-editor.js","study-explorer.js"].includes(x)))
 vm.runInNewContext(fs.readFileSync("wenyan/"+file,"utf8"),{window:win},{filename:file});
const works=[1,2,3,4].flatMap(n=>win["WENYAN_DATA_"+n]||[]),m=win.WENYAN_TRANSLATION_MISTAKES;
function at(title,fragment,char){const text=works.find(w=>w.title===title).lines.find(l=>l[0].includes(fragment))[0],offset=text.indexOf(fragment)+fragment.indexOf(char);return m.word(title,text,offset);}
const wrongs=items=>items.flatMap(i=>i.wrong).join("|");
assert(wrongs(at("狼","缀行","缀")).includes("点缀"));
assert(!wrongs(at("狼","缀行","缀")).includes("紧跟"));
assert(wrongs(at("买椟还珠","缀以珠玉","缀")).includes("紧跟"));
assert(!wrongs(at("买椟还珠","缀以珠玉","缀")).includes("装饰"));
assert(wrongs(at("狼","径去","径")).includes("直径"));
assert(wrongs(at("核舟记","径寸","径")).includes("径直"));
assert(wrongs(at("狼","断其股","股")).includes("屁股"));
assert(wrongs(at("陈太丘与友期行","尊君在不","不")).includes("否定"));
assert.equal(at("狼","不敢前","不").length,0,"an ordinary negation cannot be treated as 否");
assert.equal(at("伯牙鼓琴","锺子期","期").length,0,"a name must not get an unrelated word-sense warning");
const peach=works.find(w=>w.title==="桃花源记"),wifeText=peach.lines.find(l=>l[0].includes("妻子"))[0];
const wife=m.word(peach.title,wifeText,wifeText.indexOf("妻"));
assert.equal(wife[0].label,"妻子","the warning concerns the compound, not the correct individual translation of 妻");
assert(wife[0].correct.includes("儿女"));
assert(m.sentence(peach.title,wifeText).some(i=>i.label==="绝境"&&i.wrong.some(x=>x.includes("绝望"))));
assert(m.sentence("课外原句","屠自后断其股").some(i=>i.wrong.includes("屠户砍断自己的大腿")));
const zheng=works.find(w=>w.title==="郑人买履"),zhiText=zheng.lines.find(l=>l[0].includes("试之"))?.[0]||zheng.lines.find(l=>l[0].includes("之"))[0];
assert(m.word(zheng.title,zhiText,zhiText.indexOf("之")).length,"a referent containing 的 must not suppress the warning against mistranslating the pronoun as 的");
const chushi=works.find(w=>w.title==="出师表"),yiText=chushi.lines.find(l=>l[0].includes("先帝不以臣卑鄙"))[0];
const yiNotes=m.sentence(chushi.title,yiText).filter(n=>n.label==="以");
assert(yiNotes.length>=2&&yiNotes.every(n=>n.occurrence&&n.anchor),"different senses of 以 in one sentence need explicit occurrence anchors");
let warned=0,riskPositions=0;
for(const work of works)for(const [text]of work.lines){
 const notes=m.sentence(work.title,text);if(notes.length)warned++;
 for(const note of notes){assert(note.correct&&note.wrong.length>=1&&note.wrong.length<=3);assert(!note.wrong.includes(note.correct));}
 for(let offset=0;offset<text.length;offset++)if(win.WENYAN_TRANSLATION_RISKS.classify(work.title,text,offset)){
  riskPositions++;assert(m.word(work.title,text,offset).length,"colored risk has no concrete wrong meaning: "+work.title+" "+text[offset]);
 }
}
const rendered=m.render([{label:"<字>",correct:"正确",wrong:['<img src=x onerror="bad()">']}]);
assert(rendered.includes("&lt;img")&&!rendered.includes("<img"));
assert(!/错误率|全国最高|\d+%/.test(rendered),"do not invent measured error-rate rankings");
const practice=fs.readFileSync("wenyan/practice.html","utf8");
assert(practice.indexOf("translation-mistakes.js")<practice.indexOf("practice.js?"));
assert(html.indexOf("translation-mistakes.js")<html.indexOf("app.js?"));
vm.runInNewContext(fs.readFileSync("wenyan/practice-data.js","utf8"),{window:win});
const bank=Object.values(win).find(value=>Array.isArray(value?.exam));
const gaokao=bank.exam.filter(q=>(q.level==="gaokao"||String(q.level).includes("高考"))&&!q.options);
assert(gaokao.length>=8);
for(const q of gaokao){const offset=q.q.indexOf(q.focus);assert(m.word(q.work||"",q.q,offset,{term:q.focus,meaning:q.answer,pos:"参考字义",code:"practice-answer"}).length,"missing warning for the existing gaokao question "+q.focus);}
console.log(JSON.stringify({ok:true,wordCharacters:m.ruleCharacters.length,phrasePatterns:m.phraseCount,sentencePatterns:m.sentenceCount,bodySentencesWithWarnings:warned,coloredPositionsWithConcreteWarnings:riskPositions,contextualOppositeMeanings:true,namesExcluded:true}));
