(()=>{
  const shardCache=new Map();
  let metaPromise=null,openccPromise=null;
  const SEARCH_WINDOW=900;
  const RESULT_LIMIT=80;

  const normalize=s=>String(s||'').normalize('NFKC').toLowerCase();
  const compact=s=>normalize(s).replace(/[\s\p{P}\p{S}]+/gu,'');
  const escRe=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const uniq=a=>[...new Set(a)];
  function setIntersect(a,b){if(!a)return new Set(b);const out=new Set();for(const x of a)if(b.has(x))out.add(x);return out;}
  function setUnion(a,b){const out=new Set(a||[]);for(const x of b||[])out.add(x);return out;}

  async function converters(){
    if(!openccPromise)openccPromise=import('./vendor/opencc-js/full.js').then(m=>{const O=m.default||m;return {s2t:O.Converter({from:'cn',to:'t'}),t2s:O.Converter({from:'t',to:'cn'}),cn2tw:O.Converter({from:'cn',to:'tw'}),cn2hk:O.Converter({from:'cn',to:'hk'})};});
    return openccPromise;
  }
  async function canonical(s){const c=await converters();return normalize(c.t2s(normalize(s)));}
  async function variants(s){const raw=String(s||''),out=[raw];try{const c=await converters(),simp=c.t2s(raw);out.push(simp,c.s2t(simp),c.cn2tw(simp),c.cn2hk(simp));}catch(e){console.warn('OpenCC unavailable',e);}return uniq(out.map(normalize).filter(Boolean));}

  function tokenize(raw){
    const out=[];let i=0;const s=String(raw||'');
    while(i<s.length){while(/\s/.test(s[i]||''))i++;if(i>=s.length)break;if((i===0||/\s/.test(s[i-1]))&&/^OR(?=\s|$)/i.test(s.slice(i))){out.push({op:'OR'});i+=2;continue;}let exclude=false;if(s[i]==='-'){exclude=true;i++;if(i>=s.length)throw new Error('减号后缺少检索词');}let type='literal',value='',flags='';
      if(s[i]==='"'){type='phrase';i++;let closed=false;while(i<s.length){if(s[i]==='\\'&&i+1<s.length){value+=s[i+1];i+=2;continue;}if(s[i]==='"'){closed=true;i++;break;}value+=s[i++];}if(!closed)throw new Error('引号没有闭合');}
      else if(s[i]==='/'){type='regex';i++;let closed=false;while(i<s.length){if(s[i]==='\\'&&i+1<s.length){value+=s[i]+s[i+1];i+=2;continue;}if(s[i]==='/'){closed=true;i++;break;}value+=s[i++];}if(!closed)throw new Error('正则表达式没有闭合');while(i<s.length&&/[a-z]/i.test(s[i]))flags+=s[i++];}
      else{const start=i;while(i<s.length&&!/\s/.test(s[i]))i++;value=s.slice(start,i);if(/^OR$/i.test(value)){out.push({op:'OR'});continue;}if(/[?*]/.test(value))type='wildcard';}
      if(!value)throw new Error('存在空检索词');out.push({type,value,flags,exclude});
    }return out;
  }
  function parse(raw){const tokens=tokenize(raw),groups=[{include:[],exclude:[]}];for(const t of tokens){if(t.op==='OR'){const g=groups[groups.length-1];if(!g.include.length&&!g.exclude.length)throw new Error('OR 前缺少条件');groups.push({include:[],exclude:[]});continue;}(t.exclude?groups[groups.length-1].exclude:groups[groups.length-1].include).push(t);}const last=groups[groups.length-1];if(!last.include.length&&!last.exclude.length)throw new Error('OR 后缺少条件');if(!groups.some(g=>g.include.length))throw new Error('至少需要一个正向检索条件');return {raw:String(raw||''),groups};}

  function longestLiteral(atom){if(atom.type==='literal'||atom.type==='phrase')return atom.value;if(atom.type==='wildcard')return atom.value.split(/[?*]+/).sort((a,b)=>b.length-a.length)[0]||'';if(atom.type==='regex'){const cleaned=atom.value.replace(/\\./g,' ').replace(/\[[^\]]*\]/g,' ').replace(/\([^)]*\)/g,' ').replace(/[.*+?^${}|]/g,' ');return cleaned.split(/\s+/).sort((a,b)=>b.length-a.length)[0]||'';}return '';}
  function grams(s){const a=[...compact(s)],out=[];for(let i=0;i<a.length-1;i++)out.push(a[i]+a[i+1]);return uniq(out);}
  function bucketFor(gram,count){const a=gram.codePointAt(0)||0,arr=[...gram],b=arr.length>1?(arr[1].codePointAt(0)||0):0;return ((a*31+b)>>>0)%count;}
  async function meta(){if(!metaPromise)metaPromise=fetch('./search-index-v2/meta.json').then(r=>{if(!r.ok)throw new Error(`搜索索引元数据加载失败 ${r.status}`);return r.json();});return metaPromise;}
  async function shard(n){if(!shardCache.has(n))shardCache.set(n,fetch(`./search-index-v2/shards/${String(n).padStart(2,'0')}.json`).then(r=>{if(!r.ok)throw new Error(`搜索索引分片加载失败 ${r.status}`);return r.json();}));return shardCache.get(n);}
  async function postingsForGram(g,m){const sh=await shard(bucketFor(g,m.shardCount));return new Set(sh[g]||[]);}
  async function atomCandidates(atom,m){
    if(atom.type==='regex')return new Set(m.documents.map(d=>d.i));
    const seed=longestLiteral(atom);
    if(!seed||[...compact(seed)].length<2)return new Set(m.documents.map(d=>d.i));
    const folded=await canonical(seed),gs=grams(folded);
    if(!gs.length)return new Set(m.documents.map(d=>d.i));
    let cur=null;
    for(const g of gs){const posting=await postingsForGram(g,m);cur=setIntersect(cur,posting);if(!cur.size)break;}
    return cur||new Set();
  }
  async function candidates(ast){const m=await meta();let total=new Set();for(const group of ast.groups){let cur=null;for(const atom of group.include){const c=await atomCandidates(atom,m);cur=setIntersect(cur,c);if(!cur.size)break;}total=setUnion(total,cur||new Set());}return [...total].map(i=>m.documents[i]).filter(Boolean);}

  async function atomTesters(atom){
    if(atom.type==='regex'){
      let f=atom.flags.replace(/[gy]/g,'');if(!f.includes('i'))f+='i';if(!f.includes('u'))f+='u';
      try{
        const vs=uniq([atom.value,await canonical(atom.value)]);
        return vs.map(v=>({kind:'regex',rx:new RegExp(v,f)}));
      }catch(e){throw new Error('正则错误：'+e.message);}
    }
    const folded=await canonical(atom.value);
    if(atom.type==='wildcard')return [{kind:'regex',rx:new RegExp(escRe(folded).replace(/\\\*/g,'[\\s\\S]*?').replace(/\\\?/g,'[\\s\\S]'),'iu')}];
    return [{kind:'literal',value:folded}];
  }
  async function compile(ast){const groups=[];for(const g of ast.groups){const include=[],exclude=[];for(const a of g.include)include.push({atom:a,testers:await atomTesters(a)});for(const a of g.exclude)exclude.push({atom:a,testers:await atomTesters(a)});groups.push({include,exclude});}return groups;}
  function testerMatches(t,text){if(t.kind==='literal')return text.includes(t.value);t.rx.lastIndex=0;return t.rx.test(text);}
  function atomMatches(compiledAtom,text){return compiledAtom.testers.some(t=>testerMatches(t,text));}
  function groupMatches(g,text){return g.include.every(a=>atomMatches(a,text))&&!g.exclude.some(a=>atomMatches(a,text));}
  function anchorPositions(text,g){let best=null,bestSeed='';for(const a of g.include){const seed=longestLiteral(a.atom);if(seed.length>bestSeed.length){best=a;bestSeed=seed;}}const out=[];if(bestSeed){for(const t of best.testers){if(t.kind==='literal'){let from=0;while(out.length<100){const idx=text.indexOf(t.value,from);if(idx<0)break;out.push(idx);from=idx+Math.max(1,t.value.length);}}else{const flags=t.rx.flags.includes('g')?t.rx.flags:t.rx.flags+'g';const rx=new RegExp(t.rx.source,flags);let m;while(out.length<100&&(m=rx.exec(text))){out.push(m.index);if(m[0]==='')rx.lastIndex++;}}}}if(!out.length){const a=g.include[0];for(const t of a.testers){if(t.kind==='regex'){const flags=t.rx.flags.includes('g')?t.rx.flags:t.rx.flags+'g';const rx=new RegExp(t.rx.source,flags);let m;while(out.length<100&&(m=rx.exec(text))){out.push(m.index);if(m[0]==='')rx.lastIndex++;}}}}return uniq(out).sort((a,b)=>a-b);}
  function lineAt(text,pos){let n=1;for(let i=0;i<pos;i++)if(text.charCodeAt(i)===10)n++;return n;}
  function excerpt(text,start,end){return text.slice(start,end).replace(/\s+/g,' ').trim().slice(0,420);}
  async function searchText(text,raw,{maxHits=8,windowSize=SEARCH_WINDOW}={}){
    const ast=typeof raw==='string'?parse(raw):raw,compiled=await compile(ast);
    // All positive/negative tests run against the same canonical Chinese text.
    // Preserve the original text separately for displayed excerpts and reader locations.
    const canonicalText=await canonical(text),original=String(text||''),lines=original.split('\n'),hits=[];
    const lineEnds=[];
    for(let i=0;i<original.length;i++)if(original.charCodeAt(i)===10)lineEnds.push(i);
    function originalContext(line,position){
      const from=canonicalText.lastIndexOf('\n',Math.max(0,position-1))+1;
      const col=Math.max(0,position-from);
      const index=Math.max(0,line-1),before=lines.slice(Math.max(0,index-2),index).join(' '),after=lines.slice(index+1,index+3).join(' ');
      const current=lines[index]||'';
      const start=Math.max(0,col-120),end=Math.min(current.length,col+320);
      return [before,current.slice(start,end),after].filter(Boolean).join(' ').slice(0,420);
    }
    for(const g of compiled){
      const anchors=anchorPositions(canonicalText,g);
      for(const pos of anchors){
        const start=Math.max(0,pos-Math.floor(windowSize*.38)),end=Math.min(canonicalText.length,start+windowSize);
        if(!groupMatches(g,canonicalText.slice(start,end)))continue;
        if(hits.some(h=>Math.abs(h.pos-pos)<Math.floor(windowSize/2)))continue;
        const line=lineAt(canonicalText,pos);
        hits.push({pos,line,excerpt:originalContext(line,pos)});
        if(hits.length>=maxHits)return hits;
      }
    }
    return hits;
  }
  async function textMatches(text,raw){return (await searchText(text,raw,{maxHits:1,windowSize:Math.max(SEARCH_WINDOW,String(text||'').length)})).length>0;}

  async function searchCorpus(raw,loader,{maxResults=RESULT_LIMIT,concurrency=12,exhaustive=false}={}){
    const ast=parse(raw),docs=await candidates(ast),results=[];let cursor=0,verified=0,stoppedEarly=false;const limit=exhaustive?Math.max(maxResults,docs.length):Math.min(maxResults,RESULT_LIMIT);
    async function worker(){while(true){if(!exhaustive&&results.length>=limit){stoppedEarly=true;return;}const idx=cursor++;if(idx>=docs.length)return;const doc=docs[idx];try{const book=await loader(doc),hits=await searchText(book.text,ast,{maxHits:4});verified++;if(hits.length)results.push({doc,book,hits});}catch(e){verified++;console.warn('strict corpus verify failed',doc.id,e);}}}
    await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,docs.length))},worker));
    results.sort((a,b)=>a.doc.i-b.doc.i);const shown=exhaustive?results:results.slice(0,limit);shown.totalMatches=stoppedEarly?null:results.length;shown.candidateCount=docs.length;shown.verifiedCount=verified;shown.exhaustive=!stoppedEarly;shown.ast=ast;return shown;
  }
  function describe(ast){return ast.groups.map(g=>{const inc=g.include.map(a=>(a.type==='phrase'?`"${a.value}"`:a.type==='regex'?`/${a.value}/${a.flags||''}`:a.value)).join(' AND ');const exc=g.exclude.map(a=>`NOT ${a.type==='phrase'?`"${a.value}"`:a.value}`).join(' AND ');return [inc,exc].filter(Boolean).join(' AND ');}).join(' OR ');}
  globalThis.TCMSearch={parse,variants,canonical,candidates,searchText,textMatches,searchCorpus,describe,meta};
})();
