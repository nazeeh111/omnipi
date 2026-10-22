import {HORIZON, PI_DIGITS, searchPi, classifyChainQuery, shortHash, piWindow} from './lib.js';

const $ = id => document.getElementById(id);
const state = {mode:'sequence', digits:'', network:'mainnet', chainLoaded:false, chainRequest:0, lookupRequest:0, activityType:'payments', activityCursor:null, activityRequest:0, activityLoaded:false};
const number = value => Number(value).toLocaleString();
const date = value => value ? new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : '—';
const relative = value => {
  const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));
  if (!Number.isFinite(seconds)) return 'Unknown time';
  if (seconds<60) return `${seconds}s ago`;
  if (seconds<3600) return `${Math.floor(seconds/60)}m ago`;
  return date(value);
};
function element(tag, className, text) { const node=document.createElement(tag); if(className) node.className=className; if(text!==undefined) node.textContent=String(text); return node; }
function clear(node) { node.replaceChildren(); }
function link(label,href,className='') { const a=element('a',className,label); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; return a; }

function showView(view, scroll=false) {
  const active=view==='chain'?'chain':'math';
  $('math-panel').hidden=active!=='math'; $('chain-panel').hidden=active!=='chain';
  for(const button of document.querySelectorAll('[role="tab"]')) button.setAttribute('aria-selected',String(button.dataset.view===active));
  for(const button of document.querySelectorAll('.nav button[data-view]')) { button.classList.toggle('active',button.dataset.view===active); if(button.dataset.view===active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); }
  if (scroll) document.querySelector('.lens-tabs').scrollIntoView({behavior:'smooth',block:'start'});
  if(active==='chain'&&!state.chainLoaded) loadChain();
}
document.querySelectorAll('button[data-view]').forEach(button=>button.addEventListener('click',()=>{showView(button.dataset.view,true);history.replaceState(null,'',`#${button.dataset.view}`);}));
if(location.hash==='#chain') showView('chain');

const storage={get:()=>{try{return localStorage.getItem('omnipi-theme');}catch{return null;}},set:value=>{try{localStorage.setItem('omnipi-theme',value);}catch{}}};
const savedTheme=storage.get();
if(savedTheme==='dark') document.body.classList.add('dark');
$('theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('dark');storage.set(document.body.classList.contains('dark')?'dark':'light');});

function setMathMode(mode) {
  state.mode=mode;
  for(const button of document.querySelectorAll('.mode')) {const active=button.dataset.mode===mode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
  const input=$('math-input'); input.value=''; input.inputMode=mode==='word'?'text':'numeric'; input.maxLength=mode==='word'?20:mode==='position'?7:20;
  const spec={sequence:['Digit sequence','Try 14159 or your birthday','1–20 digits. Positions start immediately after the decimal point.'],word:['English word','Try your name or a word','Letters A–Z become phone keypad digits (for example, PI → 74).'],position:['Digit position','Try 314 or 1000000',`Choose a position from 1 to ${number(PI_DIGITS)}.`]}[mode];
  $('math-label').textContent=spec[0];input.placeholder=spec[1];$('math-hint').textContent=spec[2];
  clear($('math-result'));$('math-result').append(element('span','result-empty','Enter a value to explore.'));input.focus();
}
document.querySelectorAll('.mode').forEach(button=>button.addEventListener('click',()=>setMathMode(button.dataset.mode)));
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{$('math-input').value=button.dataset.example;$('math-form').requestSubmit();}));

function renderWindow(position,length=1) {
  const w=piWindow(state.digits,position,length,55);
  const view=$('digit-view'); clear(view);
  if(w.start===1) view.append(element('span','digit-prefix','3.'));
  view.append(document.createTextNode(w.before));
  view.append(element('mark','',w.match));
  view.append(document.createTextNode(w.after));
  $('viewer-range').textContent=`Digits ${number(w.start)}–${number(w.start+w.before.length+w.match.length+w.after.length-1)}`;
}
function showMathResult(result, original) {
  const container=$('math-result');clear(container);
  if(!result.position) {container.append(element('p','result-error',`No match in the first ${number(state.digits.length)} decimal places. Try a shorter sequence.`));return;}
  const summary=element('div','result-success'); summary.append(element('span','result-kicker',state.mode==='position'?'AT THIS POSITION':'FIRST OCCURRENCE'));
  summary.append(element('strong','',`Digit ${number(result.position)}`));
  if(state.mode==='word') summary.append(element('p','',`${original.trim()} → ${result.query} (phone keypad)`));
  if(state.mode!=='position') summary.append(element('p','',`${number(result.total)} ${result.total===1?'occurrence':'occurrences'} in the available dataset. ${result.total>100?'First 100 shown below.':''}`));
  container.append(summary);
  if(result.positions.length>1){const list=element('div','occurrences');list.append(element('span','', 'Jump to:'));for(const p of result.positions.slice(0,8)){const b=element('button','',number(p));b.type='button';b.addEventListener('click',()=>renderWindow(p,result.query.length));list.append(b);}container.append(list);}
  renderWindow(result.position,state.mode==='position'?1:result.query.length);
}
$('math-form').addEventListener('submit',event=>{event.preventDefault();const output=$('math-result');clear(output);try{if(!state.digits)throw new Error('The digit file is still loading. Try again shortly.');const raw=$('math-input').value;const result=searchPi(state.digits,state.mode,raw);showMathResult(result,raw);}catch(error){output.append(element('p','result-error',error.message));}});
async function loadDigits(){try{const response=await fetch('./data/pi-1000000.txt');if(!response.ok)throw new Error(`HTTP ${response.status}`);const text=await response.text();if(!/^3141592653589793238462643383279502884197/.test(text)||text.trim().length!==PI_DIGITS+1)throw new Error('Dataset failed integrity checks');state.digits=text.trim().slice(1);const view=$('digit-view');clear(view);view.textContent=`3.${state.digits.slice(0,120)}`;}catch(error){$('digit-view').textContent='The digit file could not load. Refresh the page or run the local server.';$('math-result').textContent='Digit search is unavailable until the data file loads.';console.error('Pi data load failed',error);}}
loadDigits();

async function getChain(path){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(`${HORIZON[state.network]}${path}`,{headers:{Accept:'application/json'},signal:controller.signal});if(!response.ok)throw new Error(response.status===404?'Record not found on this network.':`The public API returned HTTP ${response.status}.`);return await response.json();}finally{clearTimeout(timer);}}
function showChainError(node,error){clear(node);node.append(element('p','record-error',error.name==='AbortError'?'The request timed out. Try Refresh.':`${error.message} Try Refresh or switch networks.`));}
function recordRow(type,record){const row=element('div','record');const main=element('div','record-main');const side=element('div','record-side');const isLedger=type==='ledger';const id=isLedger?String(record.sequence):record.hash;const button=element('button','record-label',isLedger?`Ledger #${number(record.sequence)}`:shortHash(record.hash,15,10));button.type='button';button.style.cssText='border:0;background:none;padding:0;text-align:left;cursor:pointer';button.addEventListener('click',()=>{$('chain-input').value=id;lookupChain(id);$('chain-result').scrollIntoView({behavior:'smooth',block:'center'});});main.append(button);main.append(element('span','record-meta',isLedger?shortHash(record.hash,13,9):`${record.operation_count??0} operation${record.operation_count===1?'':'s'}`));side.append(element('strong','',isLedger?`${record.successful_transaction_count??0} tx`:(record.successful?'Success':'Failed')));side.append(element('span','',relative(isLedger?record.closed_at:record.created_at)));row.append(main,side);return row;}
async function loadChain(){state.chainLoaded=true;const request=++state.chainRequest;const ledgers=$('ledger-list'),txs=$('tx-list');ledgers.textContent='Loading live ledgers…';txs.textContent='Loading live transactions…';$('network-status').textContent='Connecting to public ledger…';const requests=[getChain('/ledgers?order=desc&limit=5'),getChain('/transactions?order=desc&limit=5')];const results=await Promise.allSettled(requests);if(request!==state.chainRequest)return;let failures=0;for(let i=0;i<2;i++){const target=i?txs:ledgers;clear(target);const result=results[i];if(result.status==='fulfilled'){const records=result.value?._embedded?.records??[];if(records.length){records.forEach(record=>target.append(recordRow(i?'transaction':'ledger',record)));}else target.append(element('p','loading','No records returned.'));}else{failures++;showChainError(target,result.reason);}}$('network-status').textContent=failures===2?'Connection unavailable':failures?'Some live data unavailable':`Live data · updated ${new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}`;if(!state.activityLoaded)loadActivity(true);}
$('refresh').addEventListener('click',loadChain);
$('network-select').addEventListener('change',event=>{state.network=event.target.value;state.lookupRequest++;$('network-name').textContent=state.network==='mainnet'?'Mainnet':'Testnet';$('chain-result').hidden=true;state.activityLoaded=false;state.activityRequest++;loadChain();});

function activityRow(record){const row=element('div','activity-row');const info=element('div');const kind=String(record.type||'operation').replaceAll('_',' ');info.append(element('strong','',kind[0].toUpperCase()+kind.slice(1)+(record.amount?` · ${record.amount} ${record.asset_type==='native'?'Pi':record.asset_code||''}`:'')));info.append(element('small','',`${shortHash(record.from||record.source_account||'',10,8)} → ${shortHash(record.to||record.destination||'',10,8)} · ${relative(record.created_at)}`));const id=record.id||record.paging_token;row.append(info,link('Source ↗',`${HORIZON[state.network]}/operations/${encodeURIComponent(id)}`));return row;}
async function loadActivity(reset){const request=++state.activityRequest;const target=$('activity-list');const more=$('load-more-activity');if(reset){state.activityCursor=null;clear(target);target.append(element('p','loading','Loading recent activity…'));}more.hidden=true;try{const params=new URLSearchParams({order:'desc',limit:'8'});if(state.activityCursor)params.set('cursor',state.activityCursor);const data=await getChain(`/${state.activityType}?${params}`);if(request!==state.activityRequest)return;const records=data?._embedded?.records??[];if(reset)clear(target);if(!records.length){if(reset)target.append(element('p','loading','No recent records returned.'));return;}records.forEach(record=>target.append(activityRow(record)));state.activityCursor=records.at(-1)?.paging_token||null;more.hidden=records.length<8||!state.activityCursor;state.activityLoaded=true;}catch(error){if(request!==state.activityRequest)return;if(reset)clear(target);showChainError(target,error);state.activityLoaded=false;}}
document.querySelectorAll('.activity-mode').forEach(button=>button.addEventListener('click',()=>{state.activityType=button.dataset.activity;for(const item of document.querySelectorAll('.activity-mode')){const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));}loadActivity(true);}));
$('load-more-activity').addEventListener('click',()=>loadActivity(false));
function addDetail(container,label,value){const cell=element('div');cell.append(element('small','',label));cell.append(element('strong','',value??'—'));container.append(cell);}
function renderDetail(type,value,data){const root=$('chain-result');clear(root);root.hidden=false;const header=element('div','detail-top');header.append(element('strong','',type==='ledger'?`Ledger #${number(data.sequence)}`:type==='account'?'Public account':'Transaction'));header.append(link('Open API record ↗',`${HORIZON[state.network]}/${type==='ledger'?'ledgers':type==='account'?'accounts':'transactions'}/${encodeURIComponent(value)}`));root.append(header);const grid=element('div','detail-grid');if(type==='ledger'){addDetail(grid,'Closed',date(data.closed_at));addDetail(grid,'Transactions',data.successful_transaction_count);addDetail(grid,'Operations',data.operation_count);addDetail(grid,'Hash',data.hash);addDetail(grid,'Protocol',data.protocol_version);addDetail(grid,'Base fee (stroops)',data.base_fee_in_stroops);}else if(type==='account'){addDetail(grid,'Public address',data.account_id);addDetail(grid,'Sequence',data.sequence);addDetail(grid,'Native Pi balance',data.balances?.find(b=>b.asset_type==='native')?.balance??'—');addDetail(grid,'Subentries',data.subentry_count);}else{addDetail(grid,'Hash',data.hash);addDetail(grid,'Created',date(data.created_at));addDetail(grid,'Ledger',data.ledger);addDetail(grid,'Operations',data.operation_count);addDetail(grid,'Status',data.successful?'Success':'Failed');addDetail(grid,'Fee charged (stroops)',data.fee_charged);}root.append(grid);}
async function showRelated(type,value,request){const root=$('chain-result');const box=element('div','related-records');const isTx=type==='transaction';box.append(element('h4','',isTx?'Operations in this transaction':'Recent transactions'));box.append(element('p','loading','Loading related records…'));root.append(box);try{const path=type==='account'?`/accounts/${encodeURIComponent(value)}/transactions`:type==='ledger'?`/ledgers/${encodeURIComponent(value)}/transactions`:`/transactions/${encodeURIComponent(value)}/operations`;const data=await getChain(`${path}?order=desc&limit=5`);if(request!==state.lookupRequest)return;box.querySelector('.loading')?.remove();const records=data?._embedded?.records??[];if(!records.length)box.append(element('p','loading','No related records returned.'));records.forEach(record=>box.append(isTx?activityRow(record):recordRow('transaction',record)));}catch(error){if(request!==state.lookupRequest)return;box.querySelector('.loading')?.remove();box.append(element('p','record-error','Related records are currently unavailable.'));}}
async function lookupChain(raw){const request=++state.lookupRequest;const root=$('chain-result');clear(root);root.hidden=false;try{const {type,value}=classifyChainQuery(raw);root.textContent='Looking up public record…';const path=`/${type==='ledger'?'ledgers':type==='account'?'accounts':'transactions'}/${encodeURIComponent(value)}`;const data=await getChain(path);if(request!==state.lookupRequest)return;renderDetail(type,value,data);showRelated(type,value,request);}catch(error){if(request!==state.lookupRequest)return;clear(root);root.append(element('p','chain-error',error.name==='AbortError'?'Request timed out. Please try again.':error.message));}}
$('chain-form').addEventListener('submit',event=>{event.preventDefault();lookupChain($('chain-input').value);});
