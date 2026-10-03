(function(root){
 'use strict';
 const db=typeof module!=='undefined'&&module.exports?require('./database.js'):root.CrossMorphDB;
 const key=(x,y)=>`${x},${y}`;
 function random(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function shuffle(items,rng){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function freshSeed(){if(root.crypto?.getRandomValues)return root.crypto.getRandomValues(new Uint32Array(1))[0];return (Date.now()^Math.floor(Math.random()*4294967296))>>>0}
 function bounds(cells){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const c of cells.values()){minX=Math.min(minX,c.x);minY=Math.min(minY,c.y);maxX=Math.max(maxX,c.x);maxY=Math.max(maxY,c.y)}return{minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1}}
 function allowed(cells,answer,x,y,dir){
  const dx=dir==='across'?1:0,dy=1-dx;
  if(cells.has(key(x-dx,y-dy))||cells.has(key(x+dx*answer.length,y+dy*answer.length)))return 0;
  let crosses=0;
  for(let i=0;i<answer.length;i++){
   const cx=x+dx*i,cy=y+dy*i,c=cells.get(key(cx,cy));
   if(c){if(c.letter!==answer[i]||c[dir]!==undefined)return 0;crosses++}
   else if(cells.has(key(cx+dy,cy+dx))||cells.has(key(cx-dy,cy-dx)))return 0;
  }
  return crosses;
 }
 function place(cells,entries,item,x,y,dir){
  const id=entries.length,dx=dir==='across'?1:0,dy=1-dx;
  entries.push({...item,id,x,y,dir,length:item.answer.length});
  for(let i=0;i<item.answer.length;i++){
   const cx=x+dx*i,cy=y+dy*i,k=key(cx,cy),c=cells.get(k)||{x:cx,y:cy,letter:item.answer[i]};c[dir]=id;cells.set(k,c);
  }
 }
 function signatures(puzzle){
  const shape=puzzle.cells.map(c=>key(c.x,c.y)).sort().join('|');
  const structure=puzzle.entries.map(e=>`${e.x},${e.y},${e.dir},${e.length}`).sort().join('|');
  return{shape,structure,words:puzzle.entries.map(e=>e.answer).sort().join('|')};
 }
 function finish(cells,entries,seed,difficulty,profile){
  const b=bounds(cells),normalized=[...cells.values()].map(c=>({...c,x:c.x-b.minX,y:c.y-b.minY})).sort((a,b)=>a.y-b.y||a.x-b.x);
  const list=entries.map(e=>({...e,x:e.x-b.minX,y:e.y-b.minY}));let number=0;
  for(const c of normalized){const starts=list.filter(e=>e.x===c.x&&e.y===c.y);if(starts.length){c.number=++number;starts.forEach(e=>e.number=number)}}
  const puzzle={seed:seed>>>0,difficulty,profile,width:b.width,height:b.height,cells:normalized,entries:list};puzzle.signatures=signatures(puzzle);return puzzle;
 }
 function attempt(seed,difficulty='medium',target){
  const rng=random(seed),profile=['compact','wide','tall','branching'][Math.floor(rng()*4)];
  const ratio={compact:1,wide:1.55,tall:.65,branching:1}[profile];
  const pool=shuffle(db.filter(e=>difficulty==='easy'?e.difficulty!=='hard'&&e.answer.length<=8:difficulty==='hard'?e.difficulty!=='easy'||e.answer.length>=8:true),rng).slice(0,150);
  const entries=[],cells=new Map();
  const first=pool.find(e=>e.answer.length>=(difficulty==='easy'?5:7))||pool[0];
  place(cells,entries,first,0,0,profile==='tall'?'down':profile==='wide'?'across':rng()<.5?'across':'down');
  const used=new Set([first.answer]);target=target||14+Math.floor(rng()*5);
  while(entries.length<target){
   const b=bounds(cells),candidates=[];
   for(const item of pool){if(used.has(item.answer))continue;
    for(const c of cells.values())for(const dir of ['across','down']){
     if(c[dir]!==undefined)continue;
     const dx=dir==='across'?1:0,dy=1-dx;
     for(let i=0;i<item.answer.length;i++){
      if(item.answer[i]!==c.letter)continue;const x=c.x-dx*i,y=c.y-dy*i;
      const w=Math.max(b.maxX,x+dx*(item.answer.length-1))-Math.min(b.minX,x)+1;
      const h=Math.max(b.maxY,y+dy*(item.answer.length-1))-Math.min(b.minY,y)+1;
      if(w>27||h>27)continue;
      const crosses=allowed(cells,item.answer,x,y,dir);if(!crosses)continue;
      const growth=w*h-b.width*b.height;
      const score=crosses*(difficulty==='easy'?10:7)-growth*(profile==='branching'?.035:.065)-Math.abs(Math.log((w/h)/ratio))*3+rng()*4+(difficulty==='hard'&&item.difficulty==='hard'?1.5:0);
      candidates.push({item,x,y,dir,score});
     }
    }
   }
   if(!candidates.length)break;
   candidates.sort((a,b)=>b.score-a.score);const best=candidates[Math.floor(rng()*Math.min(5,candidates.length))];
   place(cells,entries,best.item,best.x,best.y,best.dir);used.add(best.item.answer);
  }
  return finish(cells,entries,seed,difficulty,profile);
 }
 function validate(p){
  const errors=[],known=new Map(db.map(e=>[e.answer,e])),cells=new Map(),numbers=new Map(),seenWords=new Set();
  if(!Number.isInteger(p.width)||!Number.isInteger(p.height)||p.width<3||p.height<3||p.width>27||p.height>27)errors.push('Invalid dimensions');
  if(p.entries.length<14||p.entries.length>18)errors.push('Answer count outside 14–18');
  for(const c of p.cells){const k=key(c.x,c.y);if(cells.has(k))errors.push('Duplicate cell');cells.set(k,c);if(c.x<0||c.y<0||c.x>=p.width||c.y>=p.height||!/^[A-Z]$/.test(c.letter))errors.push('Invalid cell');}
  const memberships=new Map();
  for(const e of p.entries){
   if(!known.has(e.answer)||known.get(e.answer).clue!==e.clue)errors.push('Missing or mismatched clue');
   if(seenWords.has(e.answer))errors.push('Repeated answer');seenWords.add(e.answer);
   if(!['across','down'].includes(e.dir)||e.id!==p.entries.indexOf(e))errors.push('Invalid entry identity');
   const dx=e.dir==='across'?1:0,dy=1-dx;
   if(cells.has(key(e.x-dx,e.y-dy))||cells.has(key(e.x+dx*e.answer.length,e.y+dy*e.answer.length)))errors.push('Unintended end adjacency');
   for(let i=0;i<e.answer.length;i++){
    const k=key(e.x+dx*i,e.y+dy*i),c=cells.get(k);if(!c||c.letter!==e.answer[i]||c[e.dir]!==e.id)errors.push('Conflicting intersection or missing cell');
    const a=memberships.get(k)||[];if(a.some(m=>m.dir===e.dir))errors.push('Parallel overlap');a.push(e);memberships.set(k,a);
   }
  }
  let number=0;for(const c of [...p.cells].sort((a,b)=>a.y-b.y||a.x-b.x)){
   const starters=p.entries.filter(e=>e.x===c.x&&e.y===c.y);const expect=starters.length?++number:undefined;
   if(c.number!==expect)errors.push('Cell numbering mismatch');for(const e of starters){if(e.number!==expect)errors.push('Clue numbering mismatch');const n=`${e.dir}:${e.number}`;if(numbers.has(n))errors.push('Duplicate numbered clue');numbers.set(n,e.id)}
   if(!memberships.has(key(c.x,c.y)))errors.push('Orphan cell');
   for(const dir of ['across','down']){
    const member=(memberships.get(key(c.x,c.y))||[]).find(e=>e.dir===dir);
    if(c[dir]!==member?.id)errors.push('Invalid cell membership');
   }
   for(const dir of ['across','down']){
    const dx=dir==='across'?1:0,dy=1-dx,next=cells.get(key(c.x+dx,c.y+dy));
    if(next&&!(memberships.get(key(c.x,c.y))||[]).some(e=>e.dir===dir&&(memberships.get(key(next.x,next.y))||[]).includes(e)))errors.push('Illegal side adjacency');
   }
  }
  const visited=new Set(),todo=p.cells.length?[p.cells[0]]:[];while(todo.length){const c=todo.pop(),k=key(c.x,c.y);if(visited.has(k))continue;visited.add(k);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const neighbor=cells.get(key(c.x+dx,c.y+dy));if(neighbor&&!visited.has(key(neighbor.x,neighbor.y)))todo.push(neighbor)}}
  if(visited.size!==p.cells.length)errors.push('Disconnected grid');
  const b=bounds(cells);if(b.minX!==0||b.minY!==0||b.width!==p.width||b.height!==p.height)errors.push('Grid not tightly cropped');
  return{valid:errors.length===0,errors:[...new Set(errors)]};
 }
 async function generate({seed=freshSeed(),difficulty='medium',recent=[],onAttempt}={}){
  for(let i=0;i<18;i++){
   // Yield between attempts so generation never blocks a loading transition.
   if(i)await new Promise(resolve=>setTimeout(resolve,0));
   const candidate=attempt((seed+Math.imul(i,2654435761))>>>0,difficulty,i>11?14:undefined);
   onAttempt?.(i+1);const result=validate(candidate);
   if(result.valid&&!recent.some(s=>s.shape===candidate.signatures.shape||s.structure===candidate.signatures.structure||s.words===candidate.signatures.words))return candidate;
  }
  throw Error('Could not compose a fresh valid crossword. Please try again.');
 }
 const api={generate,validate,attempt,signatures,freshSeed,database:db};root.CrossMorphGenerator=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
