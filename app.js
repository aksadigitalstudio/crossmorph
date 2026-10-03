(() => {
 'use strict';
 const G=window.CrossMorphGenerator,$=id=>document.getElementById(id),storageKey='crossmorph-v1';
 const hintLimits={easy:9,medium:5,hard:3},key=(x,y)=>`${x},${y}`;
 const state={puzzle:null,values:{},marks:{},revealed:[],active:null,entryId:0,hints:0,incorrectChecks:0,elapsed:0,runningSince:null,started:false,complete:false,score:0,timerVisible:true,recent:[],generating:false};
 let cells=new Map(),inputs=new Map(),clueButtons=new Map();
 const elapsed=()=>state.elapsed+(state.runningSince===null?0:performance.now()-state.runningSince);
 const formatTime=ms=>{const seconds=Math.floor(ms/1000);return`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`};
 function stopTimer(){if(state.runningSince!==null){state.elapsed=elapsed();state.runningSince=null}}
 function beginTimer(){if(!state.complete&&!state.generating){state.started=true;if(!document.hidden&&state.runningSince===null)state.runningSince=performance.now()}}
 function save(){if(!state.puzzle)return;try{localStorage.setItem(storageKey,JSON.stringify({...state,elapsed:elapsed(),runningSince:null,generating:false}))}catch{/* Storage is optional. */}}
 function feedback(text,type=''){const node=$('feedback');node.textContent=text;node.className='feedback '+type}
 function entryCells(e){return Array.from({length:e.answer.length},(_,i)=>key(e.x+(e.dir==='across'?i:0),e.y+(e.dir==='down'?i:0)))}
 function entry(){return state.puzzle?.entries[state.entryId]}
 function updateTimer(){$('timer').textContent=state.timerVisible?formatTime(elapsed()):'Hidden';$('timer-toggle').setAttribute('aria-label',(state.timerVisible?'Hide':'Show')+' solve timer');$('timer-toggle').title=(state.timerVisible?'Hide':'Show')+' solve timer'}
 function updateProgress(){
  if(!state.puzzle)return;const filled=state.puzzle.cells.filter(c=>state.values[key(c.x,c.y)]).length,total=state.puzzle.cells.length,percent=Math.round(filled/total*100);
  $('progress-label').textContent=`${filled} of ${total} letters filled`;$('progress-percent').textContent=percent+'%';$('progress-bar').style.width=percent+'%';
  const remaining=Math.max(0,hintLimits[state.puzzle.difficulty]-state.hints);$('hint-budget').textContent=remaining;$('hint').disabled=state.complete||state.generating||remaining===0;$('hint').title=`${remaining} hints remaining`;
  for(const e of state.puzzle.entries){const button=clueButtons.get(e.id),positions=entryCells(e);button.classList.toggle('word-filled',positions.every(k=>state.values[k]));button.classList.toggle('word-solved',state.complete||positions.every(k=>state.marks[k]==='correct'))}
 }
 function paint(){
  const selected=entry();if(!selected)return;const activeWord=new Set(entryCells(selected));
  for(const [k,input]of inputs){const cell=input.parentElement;cell.classList.toggle('active-word',activeWord.has(k));cell.classList.toggle('selected',k===state.active);cell.classList.toggle('checked-correct',state.marks[k]==='correct');cell.classList.toggle('checked-wrong',state.marks[k]==='wrong');cell.classList.toggle('revealed',state.revealed.includes(k));cell.classList.toggle('solved',state.complete);input.value=state.values[k]||'';input.tabIndex=k===state.active?0:-1;input.readOnly=state.complete;input.setAttribute('aria-invalid',state.marks[k]==='wrong'?'true':'false');cell.setAttribute('aria-selected',k===state.active?'true':'false')}
  for(const [id,button]of clueButtons){button.classList.toggle('active',id===state.entryId);button.setAttribute('aria-current',id===state.entryId?'true':'false')}
  $('selected-number').textContent=selected.number;$('selected-direction').textContent=selected.dir.toUpperCase();$('selected-text').textContent=selected.clue;$('selected-length').textContent=selected.length+' LETTERS';
  const selectedInput=inputs.get(state.active);if(selectedInput)selectedInput.setAttribute('aria-describedby','selected-text');
  updateProgress();updateTimer();
 }
 function choose(id,{position=null,focus=true,start=true}={}){
  const e=state.puzzle?.entries[id];if(!e||(state.generating&&start))return;
  state.entryId=id;const positions=entryCells(e);state.active=position||positions.find(k=>!state.values[k])||positions[0];if(start)beginTimer();paint();
  if(focus){const input=inputs.get(state.active);input?.focus({preventScroll:true});input?.select();ensureVisible()}
  save();
 }
 function ensureVisible(){
  // Only scroll inside the crossword frame, leaving the surrounding page still.
  const input=inputs.get(state.active),shell=$('board-shell');if(!input)return;
  const a=input.getBoundingClientRect(),b=shell.getBoundingClientRect();if(a.left<b.left)shell.scrollLeft-=b.left-a.left+8;else if(a.right>b.right)shell.scrollLeft+=a.right-b.right+8;
 }
 function selectCell(k){const c=cells.get(k);if(!c)return;const preferred=entry()?.dir||'across';let id=c[preferred]??c.across??c.down;if(k===state.active&&c.across!==undefined&&c.down!==undefined)id=preferred==='across'?c.down:c.across;choose(id,{position:k})}
 function switchDirection(){const c=cells.get(state.active);if(c?.across!==undefined&&c?.down!==undefined)choose(entry().dir==='across'?c.down:c.across,{position:state.active});else feedback('This square belongs to one direction. Try a crossing square.')}
 function moveInWord(delta,erase=false){const positions=entryCells(entry()),i=positions.indexOf(state.active),k=positions[i+delta];if(k){if(erase){delete state.values[k];delete state.marks[k]}choose(state.entryId,{position:k});if(erase)updateProgress();save()}}
 function typeLetter(letter){if(state.complete||state.generating||!state.active)return;beginTimer();state.values[state.active]=letter;delete state.marks[state.active];paint();feedback('Keep going. Each crossing brings another connection.');if(!checkCompletion())moveInWord(1);save()}
 function nextClue(delta){const ordered=[...state.puzzle.entries].sort((a,b)=>a.dir===b.dir?a.number-b.number:a.dir==='across'?-1:1),i=ordered.findIndex(e=>e.id===state.entryId);choose(ordered[(i+delta+ordered.length)%ordered.length].id)}
 function keyboard(event){
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
  if(state.generating)return;
  const pressed=event.key;
  if(pressed==='Escape'){event.preventDefault();$('check').focus();return}
  if(pressed==='Tab'){event.preventDefault();nextClue(event.shiftKey?-1:1);return}
  if(pressed===' '||pressed==='Enter'){event.preventDefault();switchDirection();return}
  if(state.complete)return;
  if(/^[a-zA-Z]$/.test(pressed)){event.preventDefault();typeLetter(pressed.toUpperCase());return}
  if(pressed==='Backspace'){event.preventDefault();beginTimer();if(state.values[state.active]){delete state.values[state.active];delete state.marks[state.active];paint();save()}else moveInWord(-1,true);return}
  if(pressed==='Delete'){event.preventDefault();beginTimer();delete state.values[state.active];delete state.marks[state.active];paint();save();return}
  const directions={ArrowLeft:[-1,0,'across'],ArrowRight:[1,0,'across'],ArrowUp:[0,-1,'down'],ArrowDown:[0,1,'down']};
  if(directions[pressed]){event.preventDefault();const [dx,dy,dir]=directions[pressed];const c=cells.get(state.active);let x=c.x+dx,y=c.y+dy;while(x>=0&&y>=0&&x<state.puzzle.width&&y<state.puzzle.height){const target=cells.get(key(x,y));if(target){choose(target[dir]??target.across??target.down,{position:key(x,y)});break}x+=dx;y+=dy}}
  if(pressed==='Home'){event.preventDefault();choose(state.entryId,{position:entryCells(entry())[0]})}
  if(pressed==='End'){event.preventDefault();choose(state.entryId,{position:entryCells(entry()).at(-1)})}
 }
 function render(){
  const p=state.puzzle;cells=new Map(p.cells.map(c=>[key(c.x,c.y),c]));inputs=new Map();clueButtons=new Map();$('grid').replaceChildren();
  $('grid').style.setProperty('--cols',p.width);$('grid').style.setProperty('--rows',p.height);$('grid').setAttribute('aria-rowcount',p.height);$('grid').setAttribute('aria-colcount',p.width);
  const fragment=document.createDocumentFragment();
  for(const c of p.cells){
   const k=key(c.x,c.y),cell=document.createElement('div');cell.className='cell';cell.dataset.key=k;cell.style.gridColumn=c.x+1;cell.style.gridRow=c.y+1;cell.setAttribute('role','gridcell');cell.setAttribute('aria-rowindex',c.y+1);cell.setAttribute('aria-colindex',c.x+1);
   if(c.number){const n=document.createElement('span');n.className='cell-number';n.textContent=c.number;cell.append(n)}
   const input=document.createElement('input');input.type='text';input.maxLength=1;input.inputMode='text';input.autocomplete='off';input.autocapitalize='characters';input.spellcheck=false;input.setAttribute('aria-label',`Row ${c.y+1}, column ${c.x+1}${c.number?', clue '+c.number:''}`);input.dataset.key=k;input.value=state.values[k]||'';cell.append(input);inputs.set(k,input);fragment.append(cell);
  }
  $('grid').append(fragment);
  for(const dir of ['across','down']){
   const list=$(dir+'-clues');list.replaceChildren();const entries=p.entries.filter(e=>e.dir===dir).sort((a,b)=>a.number-b.number);$(dir+'-count').textContent=entries.length;
   for(const e of entries){const li=document.createElement('li'),button=document.createElement('button'),n=document.createElement('span'),text=document.createElement('span'),length=document.createElement('span');button.type='button';button.dataset.entry=e.id;button.id='clue-'+e.id;n.className='clue-number';n.textContent=e.number;text.className='clue-content';text.textContent=e.clue+' ';length.className='clue-enumeration';length.textContent=`(${e.length})`;text.append(length);button.append(n,text);button.setAttribute('aria-label',`${e.number} ${dir}: ${e.clue} ${e.length} letters`);button.addEventListener('click',()=>choose(e.id));li.append(button);list.append(li);clueButtons.set(e.id,button)}
  }
  $('dimensions').textContent=`${p.width} × ${p.height}`;$('answer-count').textContent=`${p.entries.length} ANSWERS`;$('puzzle-label').textContent=p.difficulty.toUpperCase()+' EDITION';$('difficulty').value=p.difficulty;
  resizeGrid();choose(state.entryId,{position:state.active,focus:false,start:false});
 }
 function resizeGrid(){if(!state.puzzle)return;const shell=$('board-shell'),available=Math.max(200,shell.clientWidth-2),height=innerWidth>900?500:innerWidth>560?560:480;const size=Math.max(25,Math.min(43,Math.floor(available/state.puzzle.width),Math.floor(height/state.puzzle.height)));$('grid').style.setProperty('--cell-size',size+'px');$('grid-scroll-hint').hidden=size*state.puzzle.width<=available;ensureVisible()}
 function controls(disabled){for(const id of ['new-puzzle','difficulty','check','hint','reset','complete-new'])$(id).disabled=disabled;if(!disabled)updateProgress()}
 async function newPuzzle(){
  if(state.generating)return;const difficulty=$('difficulty').value;state.generating=true;stopTimer();controls(true);$('loading').hidden=false;document.body.classList.remove('completed','reviewing');$('completion').hidden=true;
  await new Promise(resolve=>setTimeout(resolve,30));
  try{
   const p=await G.generate({difficulty,recent:state.recent});Object.assign(state,{puzzle:p,values:{},marks:{},revealed:[],active:null,entryId:p.entries.find(e=>e.dir==='across')?.id||0,hints:0,incorrectChecks:0,elapsed:0,runningSince:null,started:false,complete:false,score:0});state.recent=[...state.recent,p.signatures].slice(-20);render();feedback('A fresh shape, a fresh start. Select a clue to begin.');save();
  }catch(error){feedback(error.message,'error');if(state.puzzle){render();if(state.complete)showCompletion(false)}}
  finally{state.generating=false;$('loading').hidden=true;controls(false);save()}
 }
 function check(){
  if(state.complete||!state.puzzle||state.generating)return;beginTimer();let wrong=0,correct=0,blank=0;
  for(const c of state.puzzle.cells){const k=key(c.x,c.y);if(!state.values[k]){blank++;delete state.marks[k]}else if(state.values[k]===c.letter){correct++;state.marks[k]='correct'}else{wrong++;state.marks[k]='wrong'}}
  if(wrong)state.incorrectChecks++;paint();feedback(wrong?`${wrong} ${wrong===1?'letter needs':'letters need'} another look. ${correct} correct; ${blank} still blank.`:correct?`All ${correct} entered letters are correct. ${blank} ${blank===1?'square':'squares'} still to discover.`:'Nothing to check yet. Add a letter or try a hint.',wrong?'error':correct?'success':'');checkCompletion();save();
 }
 function hint(){
  if(state.complete||state.generating||!state.puzzle)return;
  if(state.hints>=hintLimits[state.puzzle.difficulty]){feedback('You’ve used all your hints for this puzzle. The crossings can still help.');return}
  const e=entry(),positions=entryCells(e),eligible=positions.filter(k=>state.values[k]!==cells.get(k).letter);
  if(!eligible.length){feedback('Your selected word is already correct. Choose another clue for a hint.','success');return}
  const k=eligible.includes(state.active)?state.active:eligible[0];beginTimer();state.hints++;state.values[k]=cells.get(k).letter;state.marks[k]='correct';if(!state.revealed.includes(k))state.revealed.push(k);choose(e.id,{position:k});paint();feedback(`One letter revealed in ${e.number} ${e.dir==='across'?'Across':'Down'}. ${hintLimits[state.puzzle.difficulty]-state.hints} hints remaining.`,'success');if(!checkCompletion())moveInWord(1);save();
 }
 function reset(){
  if(!state.puzzle||state.generating)return;stopTimer();Object.assign(state,{values:{},marks:{},revealed:[],hints:0,incorrectChecks:0,elapsed:0,runningSince:null,started:false,complete:false,score:0});document.body.classList.remove('completed','reviewing');$('completion').hidden=true;choose(state.entryId,{position:entryCells(entry())[0],focus:false,start:false});controls(false);feedback('Entries cleared. The same crossword is ready for a fresh attempt.');save();
 }
 function checkCompletion(){
  if(state.complete||!state.puzzle||!state.puzzle.cells.every(c=>state.values[key(c.x,c.y)]===c.letter))return false;
  stopTimer();state.complete=true;const difficultyMultiplier={easy:.85,medium:1,hard:1.2}[state.puzzle.difficulty];state.score=Math.max(250,Math.round((state.puzzle.cells.length*20+state.puzzle.entries.length*100)*difficultyMultiplier-state.hints*100-state.incorrectChecks*60-Math.floor(state.elapsed/60000)*10));
  paint();showCompletion();save();return true;
 }
 function showCompletion(focus=true){document.body.classList.add('completed');document.body.classList.remove('reviewing');$('completion').hidden=false;$('final-score').textContent=state.score.toLocaleString('en-US');$('final-time').textContent=formatTime(state.elapsed);$('final-hints').textContent=state.hints;$('final-checks').textContent=state.incorrectChecks;$('final-difficulty').textContent=state.puzzle.difficulty[0].toUpperCase()+state.puzzle.difficulty.slice(1);if(focus){$('complete-new').focus({preventScroll:true});$('completion').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'})}}
 $('grid').addEventListener('click',event=>{const input=event.target.closest('.cell')?.querySelector('input');if(input)selectCell(input.dataset.key)});
 $('grid').addEventListener('keydown',keyboard);
 $('grid').addEventListener('input',event=>{const input=event.target;if(input.tagName!=='INPUT')return;const letters=input.value.replace(/[^a-z]/gi,'').toUpperCase();if(letters)typeLetter(letters.at(-1));else if(!state.complete){delete state.values[state.active];delete state.marks[state.active];paint();save()}});
 $('new-puzzle').addEventListener('click',newPuzzle);$('complete-new').textContent='New puzzle →';$('complete-new').addEventListener('click',newPuzzle);$('difficulty').addEventListener('change',newPuzzle);$('check').addEventListener('click',check);$('hint').addEventListener('click',hint);$('reset').addEventListener('click',reset);
 $('timer-toggle').addEventListener('click',()=>{state.timerVisible=!state.timerVisible;updateTimer();save()});$('review').addEventListener('click',()=>{document.body.classList.add('reviewing');choose(state.entryId,{focus:true,start:false});$('grid').scrollIntoView({block:'center',behavior:'smooth'})});
 $('how-to').addEventListener('click',()=>$('instructions').showModal());for(const id of ['close-instructions','begin'])$(id).addEventListener('click',()=>$('instructions').close());$('instructions').addEventListener('click',event=>{if(event.target===$('instructions')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()}});
 window.addEventListener('resize',resizeGrid);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTimer();save()}else if(state.started&&!state.complete)beginTimer()});window.addEventListener('pagehide',()=>{stopTimer();save()});setInterval(()=>{updateTimer();if(state.started)save()},1000);
 function restore(){try{const saved=JSON.parse(localStorage.getItem(storageKey));if(!saved?.puzzle||!G.validate(saved.puzzle).valid)return false;Object.assign(state,saved,{runningSince:null,generating:false,recent:Array.isArray(saved.recent)?saved.recent:[]});for(const k of Object.keys(state.values))if(!/^[A-Z]$/.test(state.values[k]))delete state.values[k];if(!saved.puzzle.entries[state.entryId])state.entryId=0;render();$('loading').hidden=true;if(state.complete&&state.puzzle.cells.every(c=>state.values[key(c.x,c.y)]===c.letter))showCompletion(false);else{state.complete=false;if(state.started)beginTimer();feedback('Welcome back. Your crossword is right where you left it.')}return true}catch{return false}}
 if(new URLSearchParams(location.search).has('qa'))window.__crossMorphQA={snapshot:()=>JSON.parse(JSON.stringify({...state,elapsed:elapsed(),runningSince:null})),validate:()=>G.validate(state.puzzle),ready:()=>!state.generating&&!!state.puzzle};
 if(!restore())newPuzzle();
})();
