import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import OpenCC from 'opencc-js';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
require(path.resolve('import-review-core.js'));
const C=globalThis.TCMImportReviewCore;
assert(C,'import review helpers must load');
const toSimple=OpenCC.Converter({from:'t',to:'cn'});
const norm=s=>toSimple(String(s).normalize('NFKC')).toLowerCase();
assert.equal(norm('脈綿綿如瀉漆之絕者'),norm('脉绵绵如泻漆之绝者'),'Traditional and simplified text must fold identically');
assert.equal(norm('陽明病'),norm('阳明病'));
assert.equal(norm('桂枝湯'),norm('桂枝汤'));

const unchanged='太阳病，头痛发热，汗出恶风。桂枝汤主之。'.repeat(150);
const modified=unchanged.slice(0,800)+'新增辨证文字，便于观察。'+unchanged.slice(800);
assert(C.similarity(C.signature(norm(unchanged)),C.signature(norm(modified)))>.3,
  'Similarity detection must survive middle insertions');
const old='太阳病，发热汗出。脉浮缓者，桂枝汤主之。';
const incoming='太陽病，發熱汗出。脈浮緩者，桂枝湯主之。另有一段新文字。';
const diff=await C.addedSentences(incoming,old,async s=>norm(s),100);
assert.equal(diff.total,1,'Only the truly new sentence should be listed');
assert.match(diff.additions[0],/新文字/);
assert.equal(C.normalizedTitle('桂枝汤.txt'),C.normalizedTitle('桂枝汤'));

const raw=await fs.readFile('dist/books/import-fingerprints.json','utf8');
const catalog=JSON.parse(raw);
assert(catalog.docs.length>=600,'Fingerprint catalog must include public corpus');
const ws=catalog.docs.find(x=>/傷寒論|伤寒论/u.test(x.title));
assert(ws,'Shanghan book fingerprint missing');
const book=await fs.readFile(path.join('dist',ws.path),'utf8');
const folded=norm(book).replace(/\s+/g,'');
const digest=crypto.createHash('sha256').update(folded).digest('hex');
assert.equal(ws.digest,digest,'Public book digest must represent its full text');
assert.deepEqual(ws.signature,C.signature(folded),'Public book signature must reflect full text');
const index=JSON.parse(await fs.readFile('dist/search-index-v2/meta.json','utf8'));
assert.equal(index.version,2);
assert.equal(index.documentCount,catalog.docs.length);
const shanghan=norm(book);
assert(shanghan.includes(norm('太陽病'))||shanghan.includes(norm('太阳病')),'Canonical corpus text must preserve disease terms');

const indexPage=await fs.readFile('dist/index.html','utf8');
const reader=await fs.readFile('dist/reader.html','utf8');
assert(indexPage.includes('importReviewPanel')&&indexPage.includes('import-review.js'));
assert(indexPage.includes('txtFolderImport')&&reader.includes('reader.js'));
console.log('Import dedup, diff, title, canonical search and reader smoke tests PASSED');
