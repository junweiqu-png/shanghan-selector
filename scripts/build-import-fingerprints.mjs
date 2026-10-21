import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import OpenCC from 'opencc-js';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
require(path.resolve('import-review-core.js'));
const review=globalThis.TCMImportReviewCore;
const convert=OpenCC.Converter({from:'t',to:'cn'});
const dist=path.join(process.cwd(),'dist');
const manifestRaw=await fs.readFile(path.join(dist,'books','manifest.js'),'utf8');
const manifest=JSON.parse(manifestRaw.match(/const\s+BOOK_MANIFEST\s*=\s*([\s\S]*);\s*$/)[1]);
const docs=[];
for(let i=0;i<manifest.length;i++){
 const book=manifest[i],txt=await fs.readFile(path.join(dist,book.path),'utf8');
 const canonical=convert(txt.normalize('NFKC')).toLowerCase().replace(/\s+/g,'');
 docs.push({id:book.id,title:book.title,path:book.path,chars:canonical.length,
   digest:crypto.createHash('sha256').update(canonical).digest('hex'),
   signature:review.signature(canonical)});
}
await fs.writeFile(path.join(dist,'books','import-fingerprints.json'),JSON.stringify({version:1,docs}),'utf8');
console.log('Import fingerprints ready: '+docs.length+' public classics');
