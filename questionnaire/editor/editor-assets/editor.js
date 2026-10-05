(()=>{
 const T=window.ANKETA_TEMPLATE,$=id=>document.getElementById(id);
 const normalize=s=>String(s??'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim();
 const text=v=>String(v??'');
 let records=[],current=0,timer;
 const sourceFields={4:'#riddle-title',5:'#hope-title',7:'#faculty-title',8:'#meme-title',9:'#talents-title',10:'#learn-title',11:'#about-title'};
 const answerFields=[4,5,6,7,8,9,10,11,...Array.from({length:32},(_,i)=>i+14)];
 const mime=path=>path.endsWith('.png')?'image/png':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.ttf')?'font/ttf':'application/octet-stream';
 const urls=Object.fromEntries(Object.entries(T.assets).map(([p,b])=>[p,`data:${mime(p)};base64,${b}`]));
 const color=(v,fallback)=>/^#[0-9a-f]{6}$/i.test(text(v).trim())?text(v).trim():fallback;
 const safeImage=v=>{v=text(v).trim();return /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(v)?v:'';};
 function makeRecord(row,index){const parts=text(row[1]).trim().split(/\s+/);return {id:index,row:row.map(text),given:parts.shift()||'',family:parts.join(' '),accent:color(row[12],'#a2a2d0'),robe:color(row[2],'#f0f8ff'),gender:'girl',portrait:safeImage(row[13]),images:{}};}
 function filename(r,i){return `${String(i+1).padStart(3,'0')}-${(r.given+'-'+r.family).replace(/[^\p{L}\p{N}-]+/gu,'-').slice(0,90)||'anketa'}.html`;}
 function status(s){$('status').textContent=s;}
 function renderHTML(r,standalone=true){
   const doc=new DOMParser().parseFromString(T.html,'text/html'),row=r.row;
   doc.title=`${r.given} ${r.family} · анкета ученика`;
   doc.querySelector('.given-name').textContent=r.given;doc.querySelector('.family-name').textContent=r.family;doc.querySelector('.motto').textContent=text(row[3]);
   for(const [index,selector] of Object.entries(sourceFields)){if(+index===8)continue;doc.querySelector(selector).closest('section').querySelector('.answer').textContent=text(row[index]);}
   const qs=text(row[6]).match(/[^?]+\??/g)||[];
   const bubbles=doc.querySelectorAll('.question-scene .answer');bubbles.forEach((p,i)=>p.textContent=qs[i]?.trim()||'');
   if(qs.length>3)bubbles[2].textContent=qs.slice(2).join('').trim();
   for(let i=14;i<46;i++){if(i===41)continue;doc.querySelector(`#question-${i}`).closest('section').querySelector('.answer').textContent=text(row[i]);}
   const portrait=doc.querySelector('.portrait img'),portraitSrc=safeImage(r.images.portrait||r.portrait);
   if(portraitSrc){portrait.src=portraitSrc;portrait.alt=`портрет ${r.given} ${r.family}`;}else{portrait.remove();const placeholder=doc.createElement('div');placeholder.className='portrait-empty';placeholder.textContent='портрет ученика';doc.querySelector('.portrait').append(placeholder);}
   const pupil=doc.querySelector('.pupil img');pupil.src=`assets/images/student-${r.gender==='boy'?'boy':'girl'}.png`;pupil.alt=r.gender==='boy'?'ученик':'ученица';
   const meme=doc.querySelector('.meme-slot');meme.replaceChildren();const memeImage=safeImage(r.images.meme||row[8]);
   if(memeImage){const img=doc.createElement('img');img.src=memeImage;img.alt='типичный Когтевран';meme.append(img);}else{const p=doc.createElement('p');p.className='answer';p.textContent=text(row[8]);meme.append(p);}
   const dream=safeImage(r.images.dream||row[41]);if(dream){const img=doc.querySelector('.dreamcatcher-image');img.src=dream;img.hidden=false;doc.querySelector('.dreamcatcher-placeholder').remove();}
   doc.documentElement.style.setProperty('--accent',r.accent);doc.documentElement.style.setProperty('--robe',r.robe);
   doc.querySelector('template')?.remove();
   if(standalone){
     let css=T.css.replace(/url\(['"]?\.\.\/([^)'"\s]+)['"]?\)/g,(m,path)=>urls['assets/'+path]?`url('${urls['assets/'+path]}')`:m);
     const style=doc.createElement('style');style.textContent=css+'\n.portrait-empty{aspect-ratio:4/5;display:grid;place-items:center;background:#e9e4db;color:#777;font:24px Caveat}';doc.querySelector('link[rel=stylesheet]').replaceWith(style);
     doc.querySelectorAll('img[src]').forEach(img=>{const src=img.getAttribute('src');if(urls[src])img.src=urls[src];});
     for(const script of [...doc.querySelectorAll('script')]){const src=script.getAttribute('src');script.removeAttribute('src');script.textContent=src==='assets/layout.js'?T.layout:T.theme;}
   }
   return '<!doctype html>\n'+doc.documentElement.outerHTML;
 }
 function readControls(){const r=records[current];if(!r)return;r.given=$('given').value;r.family=$('family').value;r.row[3]=$('motto').value;r.accent=$('accent').value;r.robe=$('robe').value;r.gender=$('gender').value;r.portrait=safeImage($('portrait-url').value);document.querySelectorAll('[data-answer]').forEach(el=>r.row[+el.dataset.answer]=el.value);}
 function preview(){readControls();$('preview').srcdoc=renderHTML(records[current]);}
 function schedule(){clearTimeout(timer);timer=setTimeout(preview,300);}
 function showRecord(){const r=records[current];$('given').value=r.given;$('family').value=r.family;$('motto').value=text(r.row[3]);$('accent').value=r.accent;$('robe').value=r.robe;$('gender').value=r.gender;$('portrait-url').value=r.portrait;$('meme-url').value=safeImage(r.row[8]);$('dream-url').value=safeImage(r.row[41]);$('answers').replaceChildren();for(const i of answerFields){const label=document.createElement('label');label.textContent=T.headers[i];const input=document.createElement('textarea');input.rows=3;input.dataset.answer=i;input.value=text(r.row[i]);input.addEventListener('input',()=>{if(i===8)$('meme-url').value=safeImage(input.value);if(i===41)$('dream-url').value=safeImage(input.value);schedule();});label.append(input);$('answers').append(label);}document.querySelectorAll('[data-image]').forEach(i=>i.value='');$('preview').srcdoc=renderHTML(r);}
 function list(){const select=$('student');select.replaceChildren();records.forEach((r,i)=>{const o=document.createElement('option');o.value=i;o.textContent=[r.given,r.family].join(' ')||`ученик ${i+1}`;select.append(o);});select.value=current;showRecord();}
 async function importExcel(file){const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});const sheet=wb.SheetNames.find(n=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''});return rows[0]?.some(v=>normalize(v)===normalize(T.headers[1]));});if(!sheet)throw Error('не найден лист со столбцом «Меня зовут».');const rows=XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:'',raw:false}),headers=rows.shift(),map=T.headers.map(h=>headers.findIndex(x=>normalize(x)===normalize(h)));const missing=map.filter(i=>i<0).length;const loaded=rows.filter(row=>text(row[map[1]]).trim()).map((row,i)=>makeRecord(map.map(j=>j<0?'':row[j]??''),i));if(!loaded.length)throw Error('в таблице нет заполненных имен.');records=loaded;current=0;list();status(`загружено анкет: ${records.length}.`+(missing?` отсутствует столбцов: ${missing}; соответствующие ответы оставлены пустыми.`:''));}
 function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 $('excel').addEventListener('change',async e=>{if(!e.target.files[0])return;try{await importExcel(e.target.files[0]);}catch(e){status('не удалось загрузить: '+e.message);}e.target.value='';});
 $('student').addEventListener('change',()=>{clearTimeout(timer);readControls();current=+$('student').value;showRecord();});
 for(const id of ['given','family','motto','accent','robe','gender','portrait-url'])$(id).addEventListener('input',schedule);
 for(const [id,index] of [['meme-url',8],['dream-url',41]])$(id).addEventListener('input',()=>{const value=$(id).value.trim();document.querySelector(`[data-answer="${index}"]`).value=value;records[current].row[index]=value;delete records[current].images[index===8?'meme':'dream'];schedule();});
 document.querySelectorAll('[data-image]').forEach(input=>input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){status('выберите PNG, JPEG, WebP или GIF.');return;}const targetRecord=records[current];const reader=new FileReader();reader.onload=()=>{targetRecord.images[input.dataset.image]=reader.result;preview();status('изображение добавлено. сохраните проект, чтобы продолжить позже.');};reader.readAsDataURL(file);}));
 $('clear-images').onclick=()=>{records[current].images={};preview();status('добавленные картинки сброшены.');};
 function sharedAssets(zip){for(const [path,b64] of Object.entries(T.assets))zip.file(path,b64,{base64:true});zip.file('assets/css/style.css',T.css);zip.file('assets/layout.js',T.layout);zip.file('assets/theme.js',T.theme);}
 function siteHTML(zip,r,i){const doc=new DOMParser().parseFromString(renderHTML(r,false),'text/html'),folder='assets/students/'+filename(r,i).replace(/\.html$/,'');let count=0;
 doc.querySelectorAll('img[src]').forEach(img=>{const src=img.getAttribute('src'),match=src.match(/^data:image\/(png|jpeg|webp|gif);base64,([\s\S]+)$/i);if(!match)return;const ext=match[1].toLowerCase()==='jpeg'?'jpg':match[1].toLowerCase(),path=folder+'/image-'+(++count)+'.'+ext;zip.file(path,match[2],{base64:true});img.setAttribute('src',path);});return '<!doctype html>\n'+doc.documentElement.outerHTML;}
 async function exportSite(all){readControls();const button=$(all?'all':'download');button.disabled=true;try{const zip=new JSZip();sharedAssets(zip);const selected=all?records.map((r,i)=>({r,i})):[{r:records[current],i:current}];selected.forEach(({r,i})=>zip.file(filename(r,i),siteHTML(zip,r,i)));if(all){const links=selected.map(({r,i})=>{const a=document.createElement('a');a.href=filename(r,i);a.textContent=`${r.given} ${r.family}`;return '<li>'+a.outerHTML+'</li>';});zip.file('index.html','<!doctype html><html lang="ru"><meta charset="utf-8"><title>анкеты учеников</title><link rel="icon" href="./favicon.svg" type="image/svg+xml"><h1>анкеты учеников</h1><ul>'+links.join('')+'</ul></html>');}zip.file('README.txt','распакуйте архив и загрузите HTML и папку assets в одну папку сайта, сохраняя структуру. загруженные файлом изображения лежат отдельно в assets/students. изображения по внешним ссылкам остаются внешними. при добавлении анкет объединяйте папку assets, не удаляя старые папки учеников. редактор и проект JSON публиковать не нужно.');const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});download(blob,all?'ankety-site.zip':filename(records[current],current).replace(/\.html$/, '-site.zip'),'application/zip');status('архив для сайта сохранен. распакуйте и загрузите HTML вместе с папкой assets.');}catch(e){status('не удалось сохранить: '+e.message);}finally{button.disabled=false;}}
 $('download').onclick=()=>exportSite(false);
 $('all').onclick=()=>exportSite(true);
 $('save-draft').onclick=()=>{readControls();download(JSON.stringify({format:'raven-anketa-editor',version:1,records},null,2),'anketa-editor-project.json','application/json');status('проект сохранен: ответы и добавленные изображения включены.');};
 $('draft').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const d=JSON.parse(await file.text());if(d.format!=='raven-anketa-editor'||!Array.isArray(d.records)||!d.records.length||d.records.some(r=>!Array.isArray(r.row)||r.row.length!==T.headers.length))throw Error('это не проект нашего редактора.');records=d.records.map((r,i)=>({...makeRecord(r.row,i),given:text(r.given),family:text(r.family),accent:color(r.accent,'#a2a2d0'),robe:color(r.robe,'#f0f8ff'),gender:r.gender==='boy'?'boy':'girl',portrait:safeImage(r.portrait),publicationId:/^[a-z0-9-]{1,100}$/.test(r.publicationId||'')?r.publicationId:undefined,images:Object.fromEntries(Object.entries(r.images||{}).map(([k,v])=>[k,safeImage(v)]))}));current=0;list();status(`проект открыт. анкет: ${records.length}.`);}catch(e){status('не удалось открыть: '+e.message);}e.target.value='';};
 $('mobile').onclick=()=>$('preview').classList.add('mobile');$('desktop').onclick=()=>$('preview').classList.remove('mobile');
 records=[makeRecord(T.demo,0)];records[0].images.portrait=urls['assets/images/portrait.png'];list();
 window.AnketaEditor={flush:readControls,renderHTML,siteHTML,sharedAssets,makeRecord,normalize,importExcel,getRecords:()=>records};
})();
