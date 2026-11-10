/* 同篇同字异读必须按具体位置定位，避免把“尊君在不”的“不”解释成普通否定词。 */
(()=>{
const d=window.WENYAN_ANNOTATIONS?.words?.["不"];if(!d)return;
const src=["陈太丘与友期行","尊君在不","通“否”，相当于“吗”","句末语气词","question","询问对方父亲是否在家，读 fǒu"];
if(!d.sources.some(s=>s[0]===src[0]&&s[1]===src[1]))d.sources.push(src);
const ex=["陈太丘与友期行","《世说新语·方正》","客问元方：“尊君在不？”","客人问元方：“你父亲在家吗？”","通“否”，表示是否","句末语气词","question","本字读 fǒu，放在句末提出是否疑问"];
if(!d.examples.some(x=>x[0]===ex[0]&&x[2]===ex[2]))d.examples.push(ex);
})();