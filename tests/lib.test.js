import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {toT9, searchPi, classifyChainQuery, piWindow} from '../lib.js';

const digits=readFileSync(new URL('../data/pi-1000000.txt',import.meta.url),'utf8').trim().slice(1);
const independentPrefix=readFileSync(new URL('../data/pi-100000.txt',import.meta.url),'utf8').trim().slice(1);
test('million-digit dataset has expected length and independent prefix',()=>{assert.equal(digits.length,1000000);assert.equal(digits.slice(0,100000),independentPrefix);});
test('sequence search uses one-based positions and overlap',()=>{assert.deepEqual(searchPi('1111','sequence','11').positions,[1,2,3]);assert.equal(searchPi(digits,'sequence','14159').position,1);});
test('word search converts T9 letters',()=>{assert.equal(toT9('Nazeeh'),'629334');assert.equal(searchPi(digits,'word','Pi').query,'74');});
test('position and window respect range',()=>{assert.equal(searchPi(digits,'position','1000000').position,1000000);assert.throws(()=>searchPi(digits,'position','1000001'));assert.equal(piWindow(digits,1,5).match,'14159');assert.equal(searchPi(digits,'word','Nazeeh').position,747170);});
test('blockchain query rejects secret keys',()=>{assert.equal(classifyChainQuery('42').type,'ledger');assert.equal(classifyChainQuery('a'.repeat(64)).type,'transaction');assert.equal(classifyChainQuery('G'+'A'.repeat(55)).type,'account');assert.throws(()=>classifyChainQuery('S'+'A'.repeat(55)),/secret key/);});

test('search counts every overlapping match while limiting position details',()=>{
  const result=searchPi('1'.repeat(1002),'sequence','11');
  assert.equal(result.total,1001);
  assert.deepEqual(result.positions,Array.from({length:100},(_,i)=>i+1));
  assert.equal(result.position,1);
});
