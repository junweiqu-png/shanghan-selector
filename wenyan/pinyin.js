/* 按具体古文语境标注疑难字。只注难字和多音难点，不给常用字机械加音。 */
(()=>{
 const CHARS={
 "戎":"róng","诣":"yì","骤":"zhòu","拟":"nǐ","絮":"xù","歆":"xīn","掷":"zhì",
 "冕":"miǎn","荀":"xún","郡":"jùn","汝":"rǔ","弈":"yì","诲":"huì","鹄":"hú",
 "盂":"yú","孰":"shú","闵":"mǐn","揠":"yà","槁":"gǎo","锺":"zhōng",
 "巍":"wēi","弦":"xián","嵩":"sōng","曝":"pù","拊":"fǔ","搐":"chù","谬":"miù",
 "诫":"jiè","庐":"lú","卿":"qīng","涉":"shè","馨":"xīn","儒":"rú",
 "牍":"dú","禹":"yǔ","鬻":"yù","盾":"dùn","弗":"fú","蠹":"dù",
 "耒":"lěi","冀":"jì","颈":"jǐng","履":"lǚ","遂":"suì","遽":"jù",
 "契":"qì","坠":"zhuì","祠":"cí","卮":"zhī","溉":"gài","汲":"jí",
 "奚":"xī","瞑":"míng","尻":"kāo","黠":"xiá","缀":"zhuì",
 "窘":"jiǒng","苫":"shàn","眈":"dān","濯":"zhuó","涟":"lián",
 "亵":"xiè","蕃":"fán","谏":"jiàn","牒":"dié","蓑":"suō","黜":"chù",
 "暝":"míng","诛":"zhū","篱":"lí","觞":"shāng","骊":"lí",
 "戟":"jǐ","髀":"bì","谪":"zhé","徙":"xǐ","驽":"nú",
 "穷":"qióng","鞭":"biān","骥":"jì","橐":"tuó","檄":"xí",
 "彀":"gòu","缟":"gǎo","烬":"jìn","檐":"yán","罄":"qìng",
 "龟":"guī","贻":"yí","箸":"zhù","辄":"zhé","诟":"gòu",
 "圃":"pǔ","睨":"nì","颔":"hàn","忿":"fèn","杓":"sháo",
 "杞":"qǐ","躇":"chú","跐":"cǐ","镆":"mò","铘":"yé",
 "虬":"qiú","隙":"xì","绾":"wǎn","璇":"xuán","榱":"cuī",
 "啮":"niè","蹻":"jué","厷":"gōng","愔":"yīn","谒":"yè",
 "擢":"zhuó","甫":"fǔ","赓":"gēng","怿":"yì","飨":"xiǎng"
 };
 // Context-specific overrides are more reliable than mapping every multi-pronunciation character globally.
 const phrases=[
 ["尊君在不","不","fǒu"],["期年","期","jī"],["舍然","舍","shì"],
 ["汤汤","汤","shāng"],["孰为汝多知乎","知","zhì"],
 ["孰为汝多知乎","为","wèi"],["为是其智弗若与","为","wèi"],
 ["为是其智弗若与","与","yú"],["虽与之俱学","与","yǔ"],
 ["未复有能与其奇者","与","yù"],["吾与点也","与","yǔ"],
 ["与儿女讲论文义","与","yǔ"],["陈太丘与友期行","与","yǔ"],["好书画","好","hào"],
 ["虽千里","虽","suī"],["蕃","蕃","fán"],["多子折枝","折","zhé"],
 ["射于家圃","射","shè"],["惟弈秋之为听","为","wéi"],
 ["缴而射","缴","zhuó"],["弓缴","缴","zhuó"],
 ["差可拟","差","chā"],["浅草","浅","qiǎn"]
 ];
 const poly=new Set(["不","期","舍","汤","知","为","与","好","缴","差","折","数","度","省","乐","处","行"]);
 function pick(text,index,work){
  const ch=text[index];if(!ch||!/^[\u3400-\u9fff]$/.test(ch))return "";
  for(const [phrase,target,reading] of phrases){
   let start=text.indexOf(phrase);
   while(start>=0){
    const at=phrase.indexOf(target);if(at>=0&&index===start+at)return reading;
    start=text.indexOf(phrase,start+1);
   }
  }
  // user and starter article ruby can cover unambiguous rare characters
  const fromWork=work?.ruby?.[ch];
  if(fromWork&&!poly.has(ch)&&!CHARS[ch])return fromWork;
  if(poly.has(ch))return "";
  return CHARS[ch]||"";
 }
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function span(text,index,work){
  const ch=text[index],reading=pick(text,index,work);
  return reading?'<ruby>'+esc(ch)+'<rt>'+esc(reading)+'</rt></ruby>':esc(ch);
 }
 function annotate(text,work){return [...String(text)].map((ch,i)=>span(text,i,work)).join("");}
 window.WENYAN_PINYIN={pick,span,annotate};
})();