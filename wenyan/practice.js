/* 独立文言练习：无AI自动判语义，写完先核对，再由学生确认是否掌握。 */
(()=>{
"use strict";
const $=id=>document.getElementById(id), bank=window.WENYAN_PRACTICE_BANK;
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
if(!bank)throw Error("文言练习题库未加载");
const KEY="wenyan-practice-v1";
const read=()=>{try{const d=JSON.parse(localStorage.getItem(KEY)||"null");return d&&d.version===1&&d.states&&d.drafts?d:{version:1,states:{},drafts:{}};}catch{return {version:1,states:{},drafts:{}};}};
const data=read(),save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{}};
let mode="reverse",index=0,shown=false,examChoice=null;
const normalize=s=>String(s||"").replace(/[\p{P}\p{S}\s]/gu,"").replace(/[臺檯]/g,"台").replace(/[裏裡]/g,"里");
const items=()=>mode==="reverse"?bank.reverse.filter(q=>($("topicFilter").value==="all"||q.topic===$("topicFilter").value)&&(!$("weakOnly").checked||data.states[q.id]==="again")):
 bank.exam.filter(q=>($("examLevel").value==="all"||q.level===$("examLevel").value)&&(!$("weakOnly").checked||data.states[q.id]==="again"));
function optionsInit(){
 const options=[...new Set(bank.reverse.map(x=>x.topic))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
 $("topicFilter").innerHTML='<option value="all">全部句式 · '+bank.reverse.length+'题</option>'+options.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("");
}
function withHighlights(ancient,written){
 const truth=[...ancient],a=[...normalize(ancient)],b=[...normalize(written)];
 if(!b.length)return esc(ancient);
 const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const keep=new Set();let i=0,j=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){keep.add(i);i++;j++;}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;}
 let offset=0,inside=false,html="";
 for(const ch of truth){
  if(!normalize(ch)){if(inside){html+="</mark>";inside=false;}html+=esc(ch);continue;}
  const absent=!keep.has(offset++);if(absent&&!inside){html+="<mark>";inside=true;}if(!absent&&inside){html+="</mark>";inside=false;}html+=esc(ch);
 }
 if(inside)html+="</mark>";return html;
}
function mark(value){
 const q=items()[index];if(!q)return;
 data.states[q.id]=value;save();render();
}
function setMode(next){
 if(next!=="reverse"&&next!=="exam")return;
 mode=next;index=0;shown=false;examChoice=null;
 $("modes").querySelectorAll("button").forEach(b=>{b.classList.toggle("current",b.dataset.mode===mode);b.setAttribute("aria-pressed",String(b.dataset.mode===mode));});
 $("topicFilter").closest("label").hidden=mode!=="reverse";
 $("levelWrap").hidden=mode!=="exam";
 $("modeExplainer").textContent=mode==="reverse"?
  "题目是本站现有51篇课文中已校译的现代汉语，答案取自相同原句。练习从原文反推句式，不要求每个字都与你写的一模一样才算理解正确。":
  "仅收录有原卷或可核对试卷来源的真题。中考题为原题小题，高考题保留四个原选项。按易混词义、通假和活用选题；尚无全国统一的考频统计，不标称官方高频排名。";
 render();
}
function render(){
 const rows=items(),host=$("questionRegion"),n=rows.length;
 if(index>=n)index=Math.max(0,n-1);
 const done=rows.filter(x=>data.states[x.id]==="ok").length,again=rows.filter(x=>data.states[x.id]==="again").length;
 $("position").textContent=n?"第 "+(index+1)+" / "+n+" 题":"当前没有题目";
 $("score").textContent="已掌握 "+done+" · 待巩固 "+again;
 $("progressBar").style.width=n?(done/n*100)+"%":"0%";
 $("progressBar").parentElement.setAttribute("aria-valuenow",String(done));
 $("progressBar").parentElement.setAttribute("aria-valuemax",String(n));
 if(!n){host.innerHTML='<p class="empty">没有符合当前条件的题目。若选了“只练待巩固”，可以取消筛选或先完成题目并标记需要再练。</p>';return;}
 const q=rows[index],status=data.states[q.id]||"",isReverse=q.kind==="reverse";
 const meta=isReverse?'<span class="tag">'+esc(q.topic)+'</span><span>《'+esc(q.work)+'》 · 第'+(q.lineIndex+1)+'句</span>':
  '<span class="tag">'+esc(q.level)+'真题</span><span>'+esc(q.sourceMeta.label)+' '+esc(q.part)+'</span>';
 const desc=isReverse?"请把下面这句现代汉语写回原文（尽量还原古文的句式）：":"请做原试卷的这道文言字义题：";
 const prompt=isReverse?'<div class="prompt">'+esc(q.modern)+'</div>':
  '<div class="prompt">'+esc(q.q)+'</div><p class="ask">重点辨认：<b>'+esc(q.focus)+'</b></p>';
 const input=isReverse?'<label for="answerText" class="ask">写出古文原句：</label><textarea id="answerText" class="answer-field" rows="4" autocomplete="off" spellcheck="false" placeholder="先自己写，再点击核对答案">'+esc(data.drafts[q.id]||"")+'</textarea>':
  q.options?'<div class="options" role="radiogroup" aria-label="原题选项">'+q.options.map((v,i)=>'<label class="choice"><input name="answerChoice" type="radio" value="'+i+'"><span><b>'+String.fromCharCode(65+i)+'.</b> '+esc(v)+'</span></label>').join("")+'</div>':
  '<label for="answerText" class="ask">这个字在原句中怎么解释？</label><textarea id="answerText" class="answer-field" rows="2" spellcheck="false" placeholder="只解释加点单字，不必翻译整句">'+esc(data.drafts[q.id]||"")+'</textarea>';
 const content='<div class="question-tag">'+meta+'</div><p class="ask">'+desc+'</p>'+prompt+input+
  '<div class="controls"><button id="prevQ" type="button">← 上一题</button><button id="checkAnswer" type="button" class="primary">核对答案</button><button id="nextQ" type="button">下一题 →</button></div>'+
  '<div id="answerResult" class="results" hidden aria-live="polite"></div>'+
  (status?'<p class="explain">本题记录：'+(status==="ok"?"✓ 已掌握":"↻ 待巩固")+'</p>':'');
 host.innerHTML=content;shown=false;examChoice=null;
 $("prevQ").disabled=index===0;
 $("prevQ").onclick=()=>{index--;render();};
 $("nextQ").onclick=()=>{index=index===n-1?0:index+1;render();};
 const inputNode=$("answerText");
 if(inputNode)inputNode.addEventListener("input",()=>{data.drafts[q.id]=inputNode.value;save();});
 host.querySelectorAll(".choice input").forEach(c=>c.onchange=()=>{examChoice=Number(c.value);host.querySelectorAll(".choice").forEach(l=>l.classList.toggle("selected",l.querySelector("input").checked));});
 $("checkAnswer").onclick=()=>showAnswer(q);
}
function showAnswer(q){
 const region=$("answerResult"),typed=$("answerText")?.value||"",examMC=q.kind==="exam"&&!!q.options;
 const exact=q.kind==="reverse"&&normalize(typed)===normalize(q.answer);
 const choiceOk=examMC&&examChoice===q.answerIndex;
 let html='<h3>参考答案与核对</h3>';
 if(q.kind==="reverse"){
  html+='<div class="reference">'+withHighlights(q.answer,typed)+'</div>';
  html+='<p>'+ (typed?(exact?'<span class="correct">文字与原文一致。</span>':'黄色标记为你写的文字中未能对应的原文字，供自己订正；异体字、合理替代表述可以自行判断。'):'还没写答案也可以先看原文，之后再练。')+'</p>';
  html+='<p>对应句式：<b>'+esc(q.topic)+'</b>。题干直接取自《'+esc(q.work)+'》这句已有的现代译文，未另编故事。</p>';
 }else if(examMC){
  html+='<div class="reference">正确选项：<b>'+String.fromCharCode(65+q.answerIndex)+'</b></div>';
  html+='<p class="'+(choiceOk?"correct":"wrong")+'">'+(examChoice===null?"本次未选择选项。":choiceOk?"你选择的选项与原题答案一致。":"你选择了 "+String.fromCharCode(65+examChoice)+"，与原题答案不同。")+'</p>';
 }else{
  html+='<div class="reference">“'+esc(q.focus)+'”：'+esc(q.answer)+'</div>';
  const matched=q.accept?.some(s=>normalize(s)===normalize(typed));
  html+='<p>'+(typed?(matched?'<span class="correct">与你填写的义项一致。</span>':'请对照原题答案：近义解释可根据语境自行判断。'):'未填写，可先看释义再重练。')+'</p>';
 }
 if(q.kind==="exam"){
  html+='<p><b>易错点：</b>'+esc(q.tip)+'</p>'+
   '<p><a class="source-link" href="'+esc(q.sourceMeta.url)+'" target="_blank" rel="noopener noreferrer">查看 '+esc(q.sourceMeta.label)+' 试卷及答案出处 ↗</a></p>';
 }
 html+='<div class="self-rating"><button type="button" id="markCorrect">✓ 我理解了</button><button type="button" id="markRetry">↻ 还需再练</button><button type="button" id="againQ">不看答案再写一次</button></div>';
 region.innerHTML=html;region.hidden=false;shown=true;
 $("markCorrect").onclick=()=>mark("ok");$("markRetry").onclick=()=>mark("again");
 $("againQ").onclick=()=>{delete data.drafts[q.id];save();render();};
 region.scrollIntoView({behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});
}
optionsInit();
$("modes").querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$("topicFilter").onchange=()=>{index=0;render()};
$("examLevel").onchange=()=>{index=0;render()};
$("weakOnly").onchange=()=>{index=0;render()};
setMode("reverse");
window.WENYAN_PRACTICE_DEBUG={bank,normalize,withHighlights,items,progress:()=>data.states};
})();
