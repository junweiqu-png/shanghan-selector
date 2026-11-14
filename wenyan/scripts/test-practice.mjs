/* 练习的题目必须来自已发布正文译文或可核查的2024中高考试卷；回归原站黄金基线。 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const root="wenyan/",win={};
for(const file of ["data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js","practice-data.js"])
 vm.runInNewContext(fs.readFileSync(root+file,"utf8"),{window:win},{filename:file});
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[]),...(win.WENYAN_DATA_4||[])],bank=win.WENYAN_PRACTICE_BANK;
assert.equal(works.length,51,"must preserve published 51 lessons");
assert.equal(bank.reverse.length,24,"require 24 vetted school-text reverse-translation prompts");
assert.equal(bank.exam.length,10,"source-verified exam baseline requires 10 items");
assert.equal(new Set(bank.reverse.concat(bank.exam).map(q=>q.id)).size,34,"question IDs unique");
const seen=new Set(),topics=new Set();
for(const q of bank.reverse){
 const work=works.find(w=>w.title===q.work),line=work?.lines?.[q.lineIndex];
 assert(work&&line,"source lesson missing "+q.id);
 assert.equal(q.modern,line[1],"modern prompt must be the original reviewed translation "+q.id);
 assert.equal(q.answer,line[0],"reference answer must equal the published original "+q.id);
 assert(line[0].length>=6&&line[1].length>=6,"avoid a too-short or empty exercise "+q.id);
 assert(!seen.has(q.work+"#"+q.lineIndex),"same original line not repeated");
 seen.add(q.work+"#"+q.lineIndex);topics.add(q.topic);
 assert(line[2]===q.topic||line[2]?.includes(q.topic),"grammar label must correspond to source original "+q.id+" "+line[2]);
}
assert(topics.size>=8,"must cover at least 8 different reviewed grammar categories");
const realSources=new Set(bank.exam.map(q=>q.source));
assert.equal(realSources.size,5,"must actually cover 2 province midterms and 3 national high school exams");
for(const q of bank.exam){
 assert(q.sourceMeta?.year===2024&&/^https:\/\//.test(q.sourceMeta.url),"real exam must carry checkable original source "+q.id);
 assert(/^2024/.test(q.sourceMeta.label)&&q.part&&q.focus,"missing year or exam subquestion "+q.id);
 if(q.options)assert(q.options.length===4&&Number.isInteger(q.answerIndex)&&q.answerIndex>=0&&q.answerIndex<4,"four original choices and verified answer required");
 else assert(q.answer?.length&&q.accept?.length>=1,"real single-character exam item must have its validated answer");
}
assert(bank.exam.find(q=>q.id==="gk-a-11").answerIndex===0);
assert(bank.exam.find(q=>q.id==="gk-i-11").answerIndex===2);
assert(bank.exam.find(q=>q.id==="gk-ii-11").answerIndex===0);
const page=fs.readFileSync(root+"practice.html","utf8"),
 controller=fs.readFileSync(root+"practice.js","utf8"),
 styles=fs.readFileSync(root+"practice.css","utf8"),
 homepage=fs.readFileSync(root+"index.html","utf8"),app=fs.readFileSync(root+"app.js","utf8");
for(const name of ["practice-data.js","practice.js","practice.css","data-basic.js","data-junior-batch2c.js"])assert(page.includes(name),"exercise missing imported file "+name);
assert(homepage.includes('id="practiceTab"')&&app.includes('location.href="practice.html"'),"main site must have a working practice entry");
assert(controller.includes('function withHighlights(')&&controller.includes('window.WENYAN_PRACTICE_DEBUG'),"reverse grading must show source-by-character comparison");
assert(controller.includes('data.states')&&controller.includes('localStorage.setItem')&&controller.includes('弱')===false,"retries should persist without unsupported claims");
assert(controller.includes('q.sourceMeta.url')&&controller.includes('q.sourceMeta.label'),"exam source links must be visible");
assert(page.includes('id="weakOnly"')&&styles.includes(".answer-field"),"review and accessible controls missing");
for(const f of ["practice.js","practice-data.js","app.js"])new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f});
console.log(JSON.stringify({ok:true,lessons:works.length,reverse:bank.reverse.length,exam:bank.exam.length,topics:[...topics],examSourceCount:realSources.size,authenticExamOnly:true}));
