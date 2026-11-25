(() => {
  const frame=document.getElementById('preview');
  const viewport=document.getElementById('preview-viewport');
  const section=document.querySelector('.preview');
  const expand=document.getElementById('preview-expand');
  const desktop=document.getElementById('desktop');
  const mobile=document.getElementById('mobile');
  function resize(){
    const width=viewport.clientWidth,height=viewport.clientHeight;
    if(!width||!height)return;
    const nativeWidth=frame.classList.contains('mobile')?390:1200;
    const scale=Math.min(1,width/nativeWidth);
    frame.style.width=nativeWidth+'px';
    frame.style.height=Math.ceil(height/scale)+'px';
    frame.style.transform='scale('+scale+')';
    frame.style.left=Math.max(0,(width-nativeWidth*scale)/2)+'px';
    desktop.setAttribute('aria-pressed',String(!frame.classList.contains('mobile')));
    mobile.setAttribute('aria-pressed',String(frame.classList.contains('mobile')));
  }
  function setExpanded(value){
    section.classList.toggle('expanded',value);
    document.body.classList.toggle('preview-expanded',value);
    expand.setAttribute('aria-expanded',String(value));
    expand.textContent=value?'свернуть':'развернуть';
    resize();
  }
  expand.addEventListener('click',()=>setExpanded(!section.classList.contains('expanded')));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&section.classList.contains('expanded')){setExpanded(false);expand.focus();}});
  desktop.addEventListener('click',resize);mobile.addEventListener('click',resize);
  window.addEventListener('resize',resize);frame.addEventListener('load',resize);
  if(window.ResizeObserver)new ResizeObserver(resize).observe(viewport);
  resize();
})();
