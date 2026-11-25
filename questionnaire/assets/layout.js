/* Fit cards into real free rectangles, including gaps above later cards. */
(()=>{
 const plans={'final-grid':[7,5,5,7],'admin-grid':[5,7,6,6],'collage-grid':[7,5,6,6,6,6,6,10],'favorites-grid':[7,5,4,8,10],'west-grid':[5,7,5,7,10],'south-grid':[7,5,5,7,8,4,5,7,6,6,4,8,8,4]};
 const grids=[...document.querySelectorAll(Object.keys(plans).map(x=>'.'+x).join(','))];
 let pending=false;
 function layout(){pending=false;for(const grid of grids){
  const cards=[...grid.children],mobile=innerWidth<=650;
  grid.classList.toggle('packed-grid',!mobile);
  if(mobile){grid.style.height='';for(const card of cards)for(const key of ['width','left','top','position'])card.style[key]='';continue;}
  const kind=Object.keys(plans).find(x=>grid.classList.contains(x)),plan=plans[kind],gap=32,unit=(grid.clientWidth+24)/12,placed=[];
  let bottom=0;
  const meme=grid.querySelector('.meme');if(meme)meme.style.minHeight='';
  const overlaps=(c,span,y,h)=>placed.some(p=>c<p.c+p.span&&c+span>p.c&&y<p.y+p.h+gap&&y+h+gap>p.y);
  function find(span,h,preferred,locked=false){
   const ys=[0,...placed.map(p=>p.y+p.h+gap)];const candidates=[];
   for(let c=0;c<=12-span;c++){if(locked&&c!==preferred)continue;for(const y of ys)if(!overlaps(c,span,y,h))candidates.push({c,y});}
   candidates.sort((a,b)=>a.y-b.y||Math.abs(a.c-preferred)-Math.abs(b.c-preferred)||a.c-b.c);
   return candidates[0];
  }
  function size(card,span){card.style.width=(span*unit-24)+'px';card.style.position='absolute';return card.offsetHeight;}
  function put(card,c,span,y,h){card.style.left=(c*unit)+'px';card.style.top=y+'px';placed.push({c,span,y,h});bottom=Math.max(bottom,y+h);}
  for(let i=0;i<cards.length;i++){
   const card=cards[i],span=plan[i%plan.length],centered=(kind==='favorites-grid'||kind==='west-grid')&&i===4||kind==='collage-grid'&&i===7;
   // Keep the book and creative group side by side, allowing later cards to fill below either.
   if(kind==='south-grid'&&i===8&&cards[9]){const h=size(card,6),other=cards[9],h2=size(other,6);const pos=find(12,Math.max(h,h2),0,true);put(card,0,6,pos.y,h);put(other,6,6,pos.y,h2);i++;continue;}
   const h=size(card,span),preferred=centered?1:i%2?12-span:0;
   const locked=centered||i<2||kind==='west-grid'||kind==='collage-grid'&&i<5;
   const column=kind==='collage-grid'&&i<5?[0,7,0,6,6][i]:preferred;
   const pos=find(span,h,column,locked);put(card,pos.c,span,pos.y,h);
  }
  grid.style.height=(bottom+20)+'px';
 }}
 function schedule(){if(!pending){pending=true;requestAnimationFrame(layout);}}
 addEventListener('resize',schedule);addEventListener('load',schedule);
 document.fonts.ready.then(schedule);document.querySelectorAll('img').forEach(i=>i.addEventListener('load',schedule));
 const observer=new ResizeObserver(schedule);grids.forEach(g=>{observer.observe(g);[...g.children].forEach(card=>observer.observe(card));});schedule();
})();
