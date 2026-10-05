// Theme derives from --accent; recolors the whole illustration, including bronze accents.
(()=>{const raw=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
if(!/^#[0-9a-f]{6}$/i.test(raw))return;
const [r,g,b]=[1,3,5].map(i=>parseInt(raw.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h=(h*60+360)%360;}
const saturation=d===0?0:Math.min(1.5,Math.max(.35,d/(1-Math.abs(max+min-1))));
document.documentElement.style.setProperty('--illustration-filter',`grayscale(1) sepia(1) saturate(${saturation*2.2}) hue-rotate(${h-40}deg)`);
// Preserve the chosen hue while meeting contrast on every question-paper color.
const rgb=[r,g,b].map(x=>x*255);
const mix=(a,b,t)=>a.map((v,i)=>v*t+b[i]*(1-t));
const backgrounds=[[244,238,227],mix(rgb,[244,238,227],.22),mix(rgb,[231,223,206],.12),mix(rgb,[231,223,206],.10)];
const luminance=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
let question=rgb.map(Math.round);
for(let step=0;step<=100;step++){question=rgb.map(v=>Math.round(v*(1-step/100)));if(backgrounds.every(bg=>contrast(question,bg)>=4.5))break;}
document.documentElement.style.setProperty('--family-shadow',contrast(rgb,[244,238,227])<3?'0 1px 2px rgba(45,35,28,.65), 0 0 5px rgba(45,35,28,.28)':'none');
document.documentElement.style.setProperty('--question-accent',`rgb(${question.join(',')})`);
})();
// Keep a failed external photo in the same compact frame as an absent portrait.
(()=>{const img=document.querySelector('.portrait img');if(!img)return;
function unavailable(){img.hidden=true;const frame=img.closest('.portrait');if(!frame.querySelector('.portrait-empty')){const placeholder=document.createElement('div');placeholder.className='portrait-empty';placeholder.textContent='портрет не загрузился';frame.append(placeholder);}}
img.addEventListener('error',unavailable);if(img.complete&&img.naturalWidth===0)unavailable();
})();
