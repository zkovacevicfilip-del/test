// Část Pozice a mobilita (dříve vložená přímo v index.html; přesunuto kvůli bezpečnostním pravidlům CSP)
const VER="0.10.14";
const BASE="vendor/mediapipe/tasks-vision-"+VER; // knihovna je součástí aplikace (žádné stahování z cizích serverů)
const MODEL="vendor/models/pose_landmarker_full.task";
const REF=["Osa zadního kola","Osa předního kola","Přední kolo – levý okraj","Přední kolo – pravý okraj","Přední kolo – horní okraj","Přední kolo – dolní okraj"];
const BODY=["Kotník","Koleno","Kyčel","Rameno","Loket","Zápěstí"];
const FB=["Levé rameno","Pravé rameno","Levý loket","Pravý loket","Levé zápěstí","Pravé zápěstí","Levá kyčel","Pravá kyčel","Levé koleno","Pravé koleno","Levý kotník","Pravý kotník"];
const VIEWS=["left","right","front","back"];
const VN={left:"Levá strana",right:"Pravá strana",front:"Zepředu",back:"Zezadu"};
const TABN={left:"Levá",right:"Pravá",front:"Zepředu",back:"Zezadu",res:"Výsledky"};
const TIPS={
  left:"Foť nebo natáčej jezdce z jeho levé strany (levá strana jezdce je u fotoaparátu), kolmo na rám, celý jezdec i kolo v záběru. U fotky levý pedál dole (6 hodin).",
  right:"Foť nebo natáčej jezdce z jeho pravé strany (pravá strana jezdce je u fotoaparátu), kolmo na rám, celý jezdec i kolo v záběru. U fotky pravý pedál dole (6 hodin).",
  front:"Foť nebo natáčej přesně zepředu ve výšce hrudníku, telefon vodorovně. Levá a pravá strana se v textu myslí levá a pravá strana jezdce.",
  back:"Foť nebo natáčej přesně zezadu ve výšce hrudníku, telefon vodorovně. Levá a pravá strana se v textu myslí levá a pravá strana jezdce."
};
const MOB=["m1","m2","m3","m4"],ALL=VIEWS.concat(MOB);
const isMob=k=>MOB.indexOf(k)>=0;
const MOBN={m1:["Rameno","Kyčel","Koleno"],m2:["Kyčel","Rameno","Loket"],m3:["Koleno","Kotník"],m4:["Rameno","Kyčel","Koleno"]};
const MOBIDX={m1:{l:[11,23,25],r:[12,24,26]},m2:{l:[23,11,13],r:[24,12,14]},m3:{l:[25,27],r:[26,28]},m4:{l:[11,23,25],r:[12,24,26]}};
Object.assign(VN,{m1:"Kyčel – koleno k hrudi",m2:"Rameno – paže nad hlavu",m3:"Kotník – koleno k zdi",m4:"Zadní řetězec – předklon vsedě"});
Object.assign(TABN,{m1:"Kyčel",m2:"Rameno",m3:"Kotník",m4:"Hamstringy"});
Object.assign(TIPS,{
  m1:"Koleno k hrudi ve stoje. Stůj bokem k fotoaparátu, trup svisle (nepředklánět se ani neopírat dozadu). Aktivně zvedni co nejvýš koleno nohy bližší k fotoaparátu a drž. Foť celé tělo z boku, čím víc zvednuté koleno, tím lepší test.",
  m2:"Paže nad hlavu. Stůj bokem k fotoaparátu, žebra stažená (nevyboulet bedra), paže bližší k fotoaparátu natažená. Aktivně ji zvedni dopředu nahoru co nejvýš vedle ucha a drž. Foť celé tělo z boku.",
  m3:"Koleno k zdi. Stůj bokem k fotoaparátu, chodidlo celé na zemi (pata se nesmí zvednout). Pokrč koleno dopředu přes špičku co nejdál, pata zůstává dole. Foť od kolen dolů, nebo celé tělo, z boku, telefon vodorovně.",
  m4:"Předklon vsedě. Sedni na zem bokem k fotoaparátu, nohy natažené před sebou. Předkloň se co nejvíc, záda nedělej záměrně kulatá, ruce natahuj k špičkám. Foť celé tělo z boku."
});
const NAMES={left:BODY,right:BODY,front:FB,back:FB,m1:MOBN.m1,m2:MOBN.m2,m3:MOBN.m3,m4:MOBN.m4};
const SIDEIDX={left:[27,25,23,11,13,15],right:[28,26,24,12,14,16]};
const FBIDX=[11,12,13,14,15,16,23,24,25,26,27,28];
const isSide=k=>k==="left"||k==="right";
const $=id=>document.getElementById(id);
const cv=$("cv"),ctx=cv.getContext("2d"),dc=document.createElement("canvas"),dctx=dc.getContext("2d");
let mode=null,cur="left",drag=null;
const V={};ALL.forEach(k=>{V[k]={img:null,w:0,h:0,ref:[],body:[],frames:null,file:null,isVideo:false,manual:false,edited:false,busy:false,det:null,st:{t:"",bad:false}};});

let landmarker=null,loading=null;
function getLM(){
  if(landmarker)return Promise.resolve(landmarker);
  if(!loading)loading=(async()=>{
    const m=await import(new URL(BASE+"/vision_bundle.js",document.baseURI).href);
    const fs=await m.FilesetResolver.forVisionTasks(BASE+"/wasm");
    const opt=d=>({baseOptions:{modelAssetPath:MODEL,delegate:d},runningMode:"IMAGE",numPoses:1});
    try{landmarker=await m.PoseLandmarker.createFromOptions(fs,opt("GPU"));}
    catch(e){landmarker=await m.PoseLandmarker.createFromOptions(fs,opt("CPU"));}
    return landmarker;
  })().catch(e=>{loading=null;throw e;});
  return loading;
}
function angle(a,b,c){const v1={x:a.x-b.x,y:a.y-b.y},v2={x:c.x-b.x,y:c.y-b.y};
  const d=(v1.x*v2.x+v1.y*v2.y)/(Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y));return Math.acos(Math.max(-1,Math.min(1,d)))*180/Math.PI;}

async function autoDetect(k){
  const v=V[k];if(!v.img)return;
  v.busy=true;v.body=[];v.frames=null;v.edited=false;v.det=null;
  v.st={t:"Načítám model a hledám body těla… (poprvé se stahuje asi 9 MB)",bad:false};update();
  try{
    const lm=await getLM();
    const sc=Math.min(1,1280/Math.max(v.img.naturalWidth,v.img.naturalHeight));
    dc.width=Math.round(v.img.naturalWidth*sc);dc.height=Math.round(v.img.naturalHeight*sc);
    dctx.drawImage(v.img,0,0,dc.width,dc.height);
    const r=lm.detect(dc);
    if(!r.landmarks||!r.landmarks.length)throw new Error("Na fotce nebyl nalezen jezdec. Zkus fotku, na které je vidět celé tělo.");
    const L=r.landmarks[0],vis=i=>L[i].visibility||0;
    let idx;
    if(isMob(k)){const sp=MOBIDX[k],sl=sp.l.reduce((q,i)=>q+vis(i),0),sr=sp.r.reduce((q,i)=>q+vis(i),0);v.side=sl>=sr?"levá":"pravá";idx=sl>=sr?sp.l:sp.r;}
    else idx=isSide(k)?SIDEIDX[k]:FBIDX;
    v.body=idx.map(i=>({x:L[i].x*v.w,y:L[i].y*v.h,v:vis(i)}));
    const minVis=Math.min.apply(null,v.body.map(b=>b.v));
    v.det={minVis:minVis};
    let m="Body těla nalezeny automaticky (nejnižší jistota "+Math.round(minVis*100)+" %).",bad=false;
    if(isMob(k))m+=" Strana u fotoaparátu: "+v.side+".";
    if(isSide(k)){
      const o=k==="left"?SIDEIDX.right:SIDEIDX.left;
      const a=idx.reduce((s,i)=>s+vis(i),0)/6,b=o.reduce((s,i)=>s+vis(i),0)/6;
      if(b>a+0.15){m+=" Pozor: lépe viditelná je opačná strana těla. Fotka je možná z druhé strany, nebo model strany zaměnil.";bad=true;}
    }
    if(minVis<0.5){m+=" Jistota je nízká, zkontroluj, jestli body sedí na kloubech.";bad=true;}
    v.st={t:m,bad:bad};
  }catch(e){
    v.manual=true;
    v.st={t:"Automatická detekce selhala: "+(e&&e.message?e.message:e)+" Zapnul jsem ruční označení, klepni body postupně na fotku.",bad:true};
  }
  v.busy=false;update();
}

function seek(vid,t){return new Promise((res,rej)=>{
  if(Math.abs(vid.currentTime-t)<0.002){res();return;}
  const to=setTimeout(()=>rej(new Error("Video se nepodařilo přetočit.")),10000);
  vid.onseeked=()=>{clearTimeout(to);res();};vid.currentTime=t;});}

async function handleVideo(k,f){
  const v=V[k];
  v.busy=true;v.body=[];v.frames=null;v.ref=[];v.manual=false;v.edited=false;v.img=null;v.det=null;
  v.st={t:"Načítám video…",bad:false};update();
  let vid=null;
  try{
    vid=document.createElement("video");vid.muted=true;vid.playsInline=true;vid.preload="auto";
    await new Promise((res,rej)=>{vid.onloadeddata=res;vid.onerror=()=>rej(new Error("Video se nepodařilo načíst."));vid.src=URL.createObjectURL(f);});
    const W=vid.videoWidth,H=vid.videoHeight,dur=vid.duration;
    if(!W||!H||!isFinite(dur)||dur<=0)throw new Error("Nepodařilo se zjistit rozměry nebo délku videa.");
    const sc=Math.min(1,1600/Math.max(W,H));v.w=Math.round(W*sc);v.h=Math.round(H*sc);
    v.st={t:"Načítám model… (poprvé se stahuje asi 9 MB)",bad:false};if(cur===k)$("status").textContent=v.st.t;
    const lm=await getLM();
    const sd=Math.min(1,1280/Math.max(W,H));dc.width=Math.round(W*sd);dc.height=Math.round(H*sd);
    const N=Math.max(8,Math.min(90,Math.floor(dur*8))),idx=isSide(k)?SIDEIDX[k]:FBIDX,frames=[];
    for(let i=0;i<N;i++){
      const t=Math.min(Math.max(dur-0.05,0),(i+0.5)*dur/N);
      await seek(vid,t);dctx.drawImage(vid,0,0,dc.width,dc.height);
      const r=lm.detect(dc);
      if(r.landmarks&&r.landmarks.length){
        const L=r.landmarks[0];
        const body=idx.map(j=>({x:L[j].x*v.w,y:L[j].y*v.h,v:L[j].visibility||0}));
        const mv=body.reduce((s,b)=>s+b.v,0)/body.length;
        if(mv>=0.35)frames.push({t:t,body:body,mv:mv});
      }
      v.st={t:"Zpracovávám video: "+(i+1)+"/"+N+" (použitelných snímků: "+frames.length+")",bad:false};
      if(cur===k)$("status").textContent=v.st.t;
      await new Promise(r=>setTimeout(r,0));
    }
    if(frames.length<5)throw new Error("Jezdec byl nalezen jen v "+frames.length+" snímcích videa.");
    let key=0;
    if(isSide(k)){let best=-1;frames.forEach((fr,i)=>{const b=fr.body,a=angle(b[2],b[1],b[0]);if(a>best){best=a;key=i;}});}
    else key=frames.length>>1;
    await seek(vid,frames[key].t);
    const kc=document.createElement("canvas");kc.width=v.w;kc.height=v.h;kc.getContext("2d").drawImage(vid,0,0,v.w,v.h);
    v.img=kc;v.frames=frames;v.body=frames[key].body.map(p=>({x:p.x,y:p.y,v:p.v}));
    const avg=frames.reduce((s,fr)=>s+fr.mv,0)/frames.length;
    v.det={minVis:avg};
    let m="Video zpracováno: "+frames.length+" z "+N+" snímků. Zobrazený snímek: "+(isSide(k)?"pedál dole (nejvíc natažené koleno)":"prostřední snímek")+". Statistiky se počítají přes celý cyklus. Průměrná jistota "+Math.round(avg*100)+" %.";
    let bad=false;
    if(frames.length<N*0.6){m+=" Jezdec byl nalezen jen v části snímků, výsledky jsou méně spolehlivé.";bad=true;}
    v.st={t:m,bad:bad};
  }catch(e){
    v.frames=null;
    if(vid&&vid.videoWidth&&v.w){
      try{await seek(vid,Math.max(0,(vid.duration||0)/2));
        const kc=document.createElement("canvas");kc.width=v.w;kc.height=v.h;kc.getContext("2d").drawImage(vid,0,0,v.w,v.h);v.img=kc;}catch(_){}
    }
    v.manual=!!v.img;
    v.st={t:"Zpracování videa selhalo: "+(e&&e.message?e.message:e)+(v.img?" Označ body ručně na zobrazeném snímku, vyhodnotí se jako jedna fotka.":""),bad:true};
  }
  v.busy=false;update();
}

function done(k){const v=V[k];return !!v.img&&!v.busy&&v.body.length===NAMES[k].length&&(!isSide(k)||mode!=="hand"||v.ref.length===6);}

function renderTabs(){
  const box=$("tabs");
  if(!box.querySelector("[data-v]")){
    const tb=k=>"<button class='tab' data-v='"+k+"'></button>";
    box.innerHTML="<div class='tgl'>Pozice na kole</div><div class='seg'>"+VIEWS.map(tb).join("")+"</div><div class='tgl'>Mobilita (maximální rozsah)</div><div class='seg'>"+MOB.map(tb).join("")+"</div><div class='seg' style='margin-top:10px'>"+tb("res")+"</div>";
  }
  box.querySelectorAll("[data-v]").forEach(b=>{const k=b.dataset.v,t=TABN[k]+(k!=="res"&&done(k)?" ✓":"");if(b.textContent!==t)b.textContent=t;b.classList.toggle("on",cur===k);});
}
function go(k){cur=k;$("file").value="";$("cam").value="";$("vcam").value="";drag=null;update();}
$("tabs").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.v);};
$("next").onclick=()=>{const i=ALL.indexOf(cur);go(i>=0&&i<ALL.length-1?ALL[i+1]:"res");window.scrollTo(0,0);};

document.querySelectorAll(".mode").forEach(b=>{b.onclick=()=>{
  mode=b.dataset.mode;
  $("s-mode").classList.add("hidden");$("s-work").classList.remove("hidden");
  $("modeTitle").textContent=mode==="fixed"?"Režim: pevné stanoviště":"Režim: z ruky s korekcí";
  $("handTips").classList.toggle("hidden",mode!=="hand");
  VIEWS.forEach(k=>{V[k].ref=[];});
  go("left");
};});
$("back").onclick=()=>{$("s-work").classList.add("hidden");$("s-mode").classList.remove("hidden");};

const onPick=e=>{
  const f=e.target.files[0];if(!f||cur==="res")return;
  const k=cur,v=V[k];
  v.file=f;v.isVideo=(f.type||"").indexOf("video")===0;
  if(v.isVideo&&isMob(k)){v.isVideo=false;v.st={t:"Pro mobilitu nahraj fotku, ne video.",bad:true};update();return;}
  if(v.isVideo){handleVideo(k,f);return;}
  const im=new Image();
  im.onload=()=>{
    v.img=im;
    const sc=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight));
    v.w=Math.round(im.naturalWidth*sc);v.h=Math.round(im.naturalHeight*sc);
    v.ref=[];v.manual=false;v.frames=null;autoDetect(k);
  };
  im.src=URL.createObjectURL(f);
};
$("file").onchange=onPick;$("cam").onchange=onPick;$("vcam").onchange=onPick;
$("redo").onclick=()=>{if(cur==="res")return;const v=V[cur];if(!v.img&&!v.file)return;v.manual=false;if(v.isVideo&&v.file)handleVideo(cur,v.file);else autoDetect(cur);};
$("resetRef").onclick=()=>{if(cur==="res")return;V[cur].ref=[];update();};
$("undo").onclick=()=>{if(cur==="res")return;const v=V[cur];if(v.manual&&v.body.length)v.body.pop();else if(v.ref.length)v.ref.pop();update();};
$("manual").onchange=e=>{if(cur==="res")return;V[cur].manual=e.target.checked;update();};

function pos(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height,s:cv.width/r.width};}
cv.addEventListener("pointerdown",e=>{
  if(cur==="res")return;const k=cur,v=V[k];if(!v.img||v.busy)return;
  const p=pos(e);
  const needRef=mode==="hand"&&isSide(k)&&v.ref.length<6;
  const needBody=v.manual&&v.body.length<NAMES[k].length;
  const rad=((needRef||needBody)?12:36)*p.s;
  let best=null,bd=rad;const cand=[];
  v.ref.forEach((q,i)=>cand.push([v.ref,i,q]));
  if(v.manual)v.body.forEach((q,i)=>cand.push([v.body,i,q]));
  cand.forEach(c=>{const d=Math.hypot(c[2].x-p.x,c[2].y-p.y);if(d<bd){bd=d;best=c;}});
  if(best){drag={a:best[0],i:best[1],k:k};cv.setPointerCapture(e.pointerId);}
  else if(needRef){v.ref.push({x:p.x,y:p.y});drag={a:v.ref,i:v.ref.length-1,k:k};cv.setPointerCapture(e.pointerId);update();}
  else if(needBody){v.body.push({x:p.x,y:p.y,v:1});v.edited=true;drag={a:v.body,i:v.body.length-1,k:k};cv.setPointerCapture(e.pointerId);update();}
});
cv.addEventListener("pointermove",e=>{
  if(!drag)return;const p=pos(e),v=V[drag.k];
  drag.a[drag.i]={x:p.x,y:p.y,v:drag.a[drag.i].v};
  if(drag.a===v.body)v.edited=true;update();
});
const endDrag=()=>{drag=null;};
cv.addEventListener("pointerup",endDrag);cv.addEventListener("pointercancel",endDrag);

function draw(){
  const k=cur;if(k==="res")return;const v=V[k];if(!v.img)return;
  if(cv.width!==v.w||cv.height!==v.h){cv.width=v.w;cv.height=v.h;}
  ctx.drawImage(v.img,0,0,v.w,v.h);
  const r=Math.max(6,v.w/110),css=getComputedStyle(document.documentElement);
  const pt=css.getPropertyValue("--pt").trim(),ac=css.getPropertyValue("--accent").trim(),ink=css.getPropertyValue("--ink").trim(),dk=css.getPropertyValue("--bg").trim(),B=v.body;
  ctx.lineWidth=r/2.2;ctx.font="bold "+(r*2.1)+"px sans-serif";
  const line=(ids,col)=>{const p=ids.filter(i=>B[i]);if(p.length<2)return;ctx.strokeStyle=col;ctx.beginPath();p.forEach((i,j)=>j?ctx.lineTo(B[i].x,B[i].y):ctx.moveTo(B[i].x,B[i].y));ctx.stroke();};
  if(isSide(k)&&v.ref.length>=2){ctx.strokeStyle=ac;ctx.beginPath();ctx.moveTo(v.ref[0].x,v.ref[0].y);ctx.lineTo(v.ref[1].x,v.ref[1].y);ctx.stroke();}
  if(isSide(k))line([0,1,2,3,4,5],pt);
  else if(isMob(k)){
    line(B.map((_,i)=>i),pt);
    if(k==="m3"&&B.length>1){ctx.save();ctx.setLineDash([r*1.5,r]);ctx.strokeStyle=ac;ctx.beginPath();ctx.moveTo(B[1].x,B[1].y);ctx.lineTo(B[1].x,B[1].y-Math.hypot(B[0].x-B[1].x,B[0].y-B[1].y));ctx.stroke();ctx.restore();}
  }
  else{line([0,1],pt);line([6,7],pt);line([0,2,4],pt);line([1,3,5],ac);line([6,8,10],pt);line([7,9,11],ac);}
  const lab=(t,q)=>{ctx.lineWidth=r/3;ctx.strokeStyle=dk;ctx.fillStyle=ink;ctx.strokeText(t,q.x+r*1.2,q.y-r*1.2);ctx.fillText(t,q.x+r*1.2,q.y-r*1.2);};
  v.ref.forEach((q,i)=>{ctx.fillStyle=ac;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.fill();lab(String(i+1),q);});
  B.forEach((q,i)=>{
    if(isSide(k)||isMob(k)){ctx.fillStyle=pt;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.fill();lab(NAMES[k][i],q);}
    else{ctx.fillStyle=i%2?ac:pt;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.fill();lab(i%2?"P":"L",q);}
  });
}

function stepText(k){
  const v=V[k],n=NAMES[k].length;
  if(!v.img&&!v.busy)return "Nahraj fotku nebo video: "+VN[k];
  if(v.busy)return v.isVideo?"Zpracovávám video…":"Hledám body těla…";
  if(mode==="hand"&&isSide(k)&&v.ref.length<6)return "Klepni na: "+(v.ref.length+1)+". "+REF[v.ref.length]+" ("+(v.ref.length+1)+"/6)";
  if(v.body.length<n)return v.manual?"Klepni na: "+NAMES[k][v.body.length]+" ("+(v.body.length+1)+"/"+n+")":"Body těla chybí, klepni na Znovu detekovat.";
  return "Hotovo"+(v.frames?" (video, "+v.frames.length+" snímků)":"")+". Pokračuj dalším pohledem."+(v.manual?" Body lze přetáhnout.":"");
}

function update(){
  renderTabs();
  const res=cur==="res";
  $("photoCard").classList.toggle("hidden",res);$("resCard").classList.toggle("hidden",!res);
  if(res){renderResults();return;}
  $("outBox").classList.add("hidden");
  const k=cur,v=V[k];
  $("viewTitle").textContent=(isMob(k)?"Mobilita: ":"Pohled: ")+VN[k];$("tip").textContent=TIPS[k];
  $("file").accept=isMob(k)?"image/*":"image/*,video/*";
  ["vidHint","vcamLab","vcam"].forEach(id=>$(id).classList.toggle("hidden",isMob(k)));
  const mvEl=$("mobVal");if(isMob(k)&&done(k)){mvEl.textContent=mobText(k);mvEl.classList.remove("hidden");}else mvEl.classList.add("hidden");
  $("stepBox").textContent=stepText(k);
  cv.classList.toggle("hidden",!v.img);
  $("ctrl").classList.toggle("hidden",!(v.img||v.file));
  $("manualBox").classList.toggle("hidden",!v.img||!!v.frames);
  $("manual").checked=v.manual;
  $("resetRef").classList.toggle("hidden",!(mode==="hand"&&isSide(k)));
  const st=$("status");st.textContent=v.st.t;st.classList.toggle("bad",!!v.st.bad);
  $("next").textContent=k==="m4"?"Zobrazit výsledky":"Další";
  draw();
}

function sideNums(b,ref){
  let all=(mode==="hand"?ref:[]).concat(b).map(p=>({x:p.x,y:p.y})),info="Bez korekce (pevné stanoviště).";
  if(mode==="hand"){
    const a=Math.atan2(all[1].y-all[0].y,all[1].x-all[0].x),c=Math.cos(a),s=Math.sin(a);
    all=all.map(p=>({x:p.x*c+p.y*s,y:-p.x*s+p.y*c}));
    const w=Math.abs(all[3].x-all[2].x),h=Math.abs(all[5].y-all[4].y);
    let kk=w>0?h/w:1;kk=Math.min(1.5,Math.max(0.5,kk));
    all=all.map(p=>({x:p.x*kk,y:p.y}));
    let deg=((a*180/Math.PI)%180+180)%180;if(deg>90)deg-=180;
    info="Korekce: srovnáno o "+Math.abs(deg).toFixed(1)+"° podle os kol, vodorovné natažení ×"+kk.toFixed(2)+" podle předního kola.";
    if(Math.abs(kk-1)>0.25)info+=" Pozor: velké zkreslení, fotka byla pořízena hodně šikmo, výsledky jsou méně přesné.";
  }
  const P=all.slice(mode==="hand"?6:0),A=P[0],K=P[1],Ky=P[2],R=P[3],L=P[4],Z=P[5];
  return{knee:angle(Ky,K,A),hip:angle(R,Ky,K),elbow:angle(R,L,Z),arm:angle(Ky,R,L),
    trunk:Math.atan2(Math.abs(R.y-Ky.y),Math.abs(R.x-Ky.x))*180/Math.PI,info:info};
}
function fbNums(k,b){
  const d=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
  const tl=(a,c)=>Math.atan2(c.y-a.y,Math.abs(c.x-a.x)||1e-6)*180/Math.PI;
  const ms={x:(b[0].x+b[1].x)/2,y:(b[0].y+b[1].y)/2},mh={x:(b[6].x+b[7].x)/2,y:(b[6].y+b[7].y)/2};
  const leanDeg=Math.atan(Math.abs(ms.x-mh.x)/(Math.abs(ms.y-mh.y)||1e-6))*180/Math.PI;
  const toLeft=k==="back"?ms.x<mh.x:ms.x>mh.x;
  const kn=(h,kk,an)=>{
    const H=b[h],K=b[kk],A=b[an],t=(K.y-H.y)/((A.y-H.y)||1e-6),xl=H.x+t*(A.x-H.x),off=K.x-xl;
    const dev=Math.atan(Math.abs(off)/(Math.abs(K.y-H.y)||1e-6))*180/Math.PI;
    return((mh.x-H.x)*off>0?1:-1)*dev;
  };
  const sw=d(b[0],b[1])||1e-6,hw=d(b[6],b[7])||1e-6;
  return{shT:tl(b[0],b[1]),hipT:tl(b[6],b[7]),lean:toLeft?leanDeg:-leanDeg,elbW:d(b[2],b[3])/sw,kneeW:d(b[8],b[9])/hw,ankW:d(b[10],b[11])/hw,kL:kn(6,8,10),kR:kn(7,9,11)};
}
const stat=a=>({mean:a.reduce((s,x)=>s+x,0)/a.length,min:Math.min.apply(null,a),max:Math.max.apply(null,a)});
const framesOf=k=>V[k].frames?V[k].frames.map(f=>f.body):[V[k].body];

function sideStats(k){
  if(!done(k))return null;const v=V[k],arr=framesOf(k).map(b=>sideNums(b,v.ref));
  const S={n:arr.length,info:arr[0].info};
  ["knee","hip","elbow","arm","trunk"].forEach(key=>{S[key]=stat(arr.map(x=>x[key]));});
  return S;
}
function fbStats(k){
  if(!done(k))return null;const arr=framesOf(k).map(b=>fbNums(k,b));
  const S={n:arr.length};
  ["shT","hipT","lean","elbW","kneeW","ankW","kL","kR"].forEach(key=>{S[key]=stat(arr.map(x=>x[key]));});
  return S;
}
function fbRows(k,S){
  const sgn=(st,pos,neg)=>{const m=st.mean,a=Math.abs(m);return a<0.5?a.toFixed(1)+"° (vyrovnané)":a.toFixed(1)+"° ("+(m>0?pos:neg)+")";};
  const rng=st=>S.n>1?"; rozkmit "+(st.max-st.min).toFixed(1)+"°":"";
  const ratio=st=>S.n>1?st.mean.toFixed(2)+" (rozsah "+st.min.toFixed(2)+"–"+st.max.toFixed(2)+")":st.mean.toFixed(2);
  const rows=[
    ["Sklon ramen",sgn(S.shT,"pravé rameno níž","levé rameno níž")+rng(S.shT),"závisí na vodorovném držení telefonu"],
    ["Sklon pánve",sgn(S.hipT,"pravá kyčel níž","levá kyčel níž")+rng(S.hipT),S.n>1?"velký rozkmit pánve při šlapání naznačuje příliš vysoké sedlo":"rozdíl může značit výšku sedla nebo asymetrii"],
    ["Boční náklon trupu",sgn(S.lean,"k levé straně jezdce","k pravé straně jezdce")+rng(S.lean),"ramena vůči středu pánve"]
  ];
  if(k==="front"){
    rows.push(["Šířka loktů / šířka ramen",ratio(S.elbW),"nižší = užší postoj paží, menší čelní plocha"]);
    rows.push(["Šířka kolen / šířka kyčlí",ratio(S.kneeW),""]);
    rows.push(["Šířka kotníků / šířka kyčlí",ratio(S.ankW),""]);
  }
  rows.push(["Koleno levé: vybočení",sgn(S.kL,"dovnitř","ven")+rng(S.kL),"odchylka od osy kyčel–kotník, závisí na poloze kliky"]);
  rows.push(["Koleno pravé: vybočení",sgn(S.kR,"dovnitř","ven")+rng(S.kR),""]);
  return rows;
}

const USE=0.85;
const MN={m1:"Kyčel – flexe (koleno k hrudi)",m2:"Rameno – flexe (paže nad hlavu)",m3:"Kotník – dorzální flexe (koleno k zdi)",m4:"Zadní řetězec (předklon vsedě)"};
const MNORM={m1:"orientačně 55–70° = dobrá",m2:"orientačně 165–180° = dobrá",m3:"orientačně od 38° = dobrá",m4:"orientačně do 55° = dobrá"};
const MDESC={m1:"nejmenší úhel trup–stehno",m2:"úhel paže vůči trupu (max. zvednutí)",m3:"sklon bérce od svislice",m4:"nejmenší úhel trup–stehno vsedě"};
const BANDS={m1:[70,85,true],m2:[165,150,false],m3:[38,30,false],m4:[55,75,true]};
const BANDTXT=["dobrá","střední","omezená"];
const BASESC={m1:[50,80,105],m2:[50,80,105],m3:[30,55,80],m4:[40,70,95]};
const FIX={hip:"aktivní flexe kyčle v krajní poloze, mobilita kyčle (hluboký dřep, 90/90, kyčelní CARs) a práce s náklonem pánve",shoulder:"mobilita ramen a hrudní páteře (zvedání paží nad hlavu u zdi, hrudní extenze přes válec)",ankle:"mobilita kotníku a lýtka (koleno ke zdi, protahování lýtka)",ham:"mobilita zadní strany stehen a kyčelní předklon (hip hinge, řízené protahování hamstringů)"};
function bandOf(k,val){const t=BANDS[k];return t[2]?(val<=t[0]?0:(val<=t[1]?1:2)):(val>=t[0]?0:(val>=t[1]?1:2));}
function mobVal(k){
  if(!isMob(k)||!done(k))return null;const b=V[k].body;
  if(k==="m3")return Math.atan2(Math.abs(b[0].x-b[1].x),Math.abs(b[0].y-b[1].y)||1e-6)*180/Math.PI;
  return angle(b[0],b[1],b[2]);
}
function mobText(k){const val=mobVal(k);if(val===null)return "";return "Naměřeno: "+val.toFixed(1)+"° ("+MDESC[k]+"), hodnocení: "+BANDTXT[bandOf(k,val)]+" ("+MNORM[k]+", orientační). Strana u fotoaparátu: "+(V[k].side||"?")+".";}
function mobAnalysis(SL,SR){
  const M={};MOB.forEach(k=>{M[k]=mobVal(k);});
  if(MOB.every(k=>M[k]===null))return null;
  const sides=[SL,SR].filter(Boolean),vid=sides.some(s=>s.n>1);
  const hipD=sides.length?Math.min.apply(null,sides.map(s=>s.n>1?s.hip.min:s.hip.mean)):null;
  const armD=sides.length?Math.max.apply(null,sides.map(s=>s.n>1?s.arm.max:s.arm.mean)):null;
  const opt=vid?"":" (z fotky s pedálem dole, optimistický odhad)";
  const stx=u=>u<=USE*100?"v pohodě":(u<=100?"těsné":"překračuje mobilitu");
  const tb=rows=>"<table>"+rows.map(r=>"<tr><td>"+r[0]+"</td><td>"+r[1]+"</td></tr>").join("")+"</table>";
  const head=t=>"<p style='margin:10px 0 2px'><b>"+t+"</b></p>";
  const T=["MOBILITA (nejlepší dosažitelné hodnoty z testů; doporučený limit pro pozici = "+Math.round(USE*100)+" % rozsahu):"],items=[];
  let h="<h3>Mobilita a pozice</h3><p class='muted'>Limit pro pozici je "+Math.round(USE*100)+" % tvého maximálního rozsahu, aby šla pozice dlouho udržet. Pásma dobrá, střední a omezená jsou orientační pravidla, ne klinické normy.</p>";
  if(M.m1!==null){
    const fm=180-M.m1,lim=180-USE*fm,b=bandOf("m1",M.m1);
    const rows=[["Nejmenší úhel trup–stehno (max. zavření kyčle)<small>"+MNORM.m1+"</small>",f1(M.m1)],["Doporučený limit úhlu kyčle v pozici","≥ "+f1(lim)]];
    let score=BASESC.m1[b],line="- Kyčel: max zavření "+f1(M.m1)+" (hodnocení "+BANDTXT[b]+"), doporučený limit úhlu kyčle v pozici ≥ "+f1(lim);
    if(hipD!==null){
      const util=(180-hipD)/fm*100,mg=hipD-lim;score=util;
      const adv=mg>=0?"rezerva "+mg.toFixed(1)+"° (trup lze snížit až o ≈ "+Math.round(mg)+"°)":"chybí "+(-mg).toFixed(1)+"° (zvedni trup o ≈ "+Math.ceil(-mg)+"° nebo zlepši mobilitu kyčle)";
      rows.push(["Úhel kyčle v pozici (nahoře)"+opt,f1(hipD)]);
      rows.push(["Využití tvého rozsahu",Math.round(util)+" % ("+stx(util)+")"]);
      rows.push(["Rezerva nebo nedostatek",adv]);
      line+="; úhel kyčle v pozici "+f1(hipD)+opt+", využití "+Math.round(util)+" % ("+stx(util)+"), "+adv;
    }
    h+=head(MN.m1)+tb(rows);T.push(line);items.push({area:"kyčel (flexe)",score:score,fix:FIX.hip});
  }
  if(M.m2!==null){
    const lim=USE*M.m2,b=bandOf("m2",M.m2);
    const rows=[["Největší zvednutí paže (úhel paže vůči trupu)<small>"+MNORM.m2+"</small>",f1(M.m2)],["Doporučený limit úhlu ramene v pozici","≤ "+f1(lim)]];
    let score=BASESC.m2[b],line="- Rameno: max zvednutí "+f1(M.m2)+" (hodnocení "+BANDTXT[b]+"), doporučený limit úhlu ramene v pozici ≤ "+f1(lim);
    if(armD!==null){
      const util=armD/M.m2*100,mg=lim-armD;score=util;
      const adv=mg>=0?"rezerva "+mg.toFixed(1)+"° (lokty lze předsunout o ≈ "+Math.round(mg)+"°)":"chybí "+(-mg).toFixed(1)+"° (sniž předsunutí loktů nebo zlepši mobilitu ramen)";
      rows.push(["Úhel ramene v pozici (trup–paže)"+opt,f1(armD)]);
      rows.push(["Využití tvého rozsahu",Math.round(util)+" % ("+stx(util)+")"]);
      rows.push(["Rezerva nebo nedostatek",adv]);
      line+="; úhel ramene v pozici "+f1(armD)+opt+", využití "+Math.round(util)+" % ("+stx(util)+"), "+adv;
    }
    h+=head(MN.m2)+tb(rows);T.push(line);items.push({area:"rameno (flexe)",score:score,fix:FIX.shoulder});
  }
  if(M.m3!==null){
    const b=bandOf("m3",M.m3);
    h+=head(MN.m3)+tb([["Sklon bérce od svislice<small>"+MNORM.m3+"</small>",f1(M.m3)],["Hodnocení",BANDTXT[b]]])+(b>0?"<p class='muted'>Omezená dorzální flexe kotníku může ovlivnit polohu kufrů (cleat) a výšku sedla. Aplikace to zatím nepočítá s pozicí, jen s normou.</p>":"");
    T.push("- Kotník: sklon bérce "+f1(M.m3)+" (hodnocení "+BANDTXT[b]+", porovnáno jen s normou, ne s pozicí)");
    items.push({area:"kotník (dorzální flexe)",score:BASESC.m3[b],fix:FIX.ankle});
  }
  if(M.m4!==null){
    const b=bandOf("m4",M.m4);
    h+=head(MN.m4)+tb([["Nejmenší úhel trup–stehno vsedě<small>"+MNORM.m4+"</small>",f1(M.m4)],["Hodnocení",BANDTXT[b]]])+(b>0?"<p class='muted'>Omezená zadní strana stehen a bedra ztěžují předklon pánve a držení rovných zad v nízké poloze.</p>":"");
    T.push("- Zadní řetězec (předklon vsedě): "+f1(M.m4)+" (hodnocení "+BANDTXT[b]+", porovnáno jen s normou)");
    items.push({area:"zadní strana stehen a bedra (předklon)",score:BASESC.m4[b],fix:FIX.ham});
  }
  items.sort((a,b)=>b.score-a.score);const top=items[0];
  h+="<p style='margin-top:12px'><b>"+(top.score>=USE*100?"Nejlepší oblast ke zlepšení: ":"Aktuálně nic pozici neomezuje. Největší potenciál pro další snížení pozice má: ")+top.area+"</b><br>"+top.fix+"</p>";
  const miss=MOB.filter(k=>M[k]===null).map(k=>MN[k]);
  if(miss.length)h+="<p class='muted'>Chybí testy: "+miss.join(", ")+". Doporučení se opírá jen o hotové testy.</p>";
  h+="<p class='muted'>Při dlouhodobé bolesti nebo zjevném omezení pohybu to nech vyšetřit u fyzioterapeuta. Krk a hrudní páteř (držení hlavy při pohledu dopředu) aplikace neměří, pokud tě tam pozice tlačí, ber to jako další omezení.</p>";
  T.push("Nejlepší oblast ke zlepšení podle aplikace: "+top.area+" (skóre "+Math.round(top.score)+").");
  return{h:h,T:T};
}
const SR_PHOTO=[["Koleno (spodní poloha)","knee","mean","orientačně 145–155°"],["Kyčel (trup–stehno)","hip","mean","nižší = větší omezení výkonu a komfortu"],["Sklon trupu k vodorovné","trunk","mean","nižší = menší čelní plocha"],["Loket","elbow","mean","kloub opřený v podložkách"],["Rameno (trup–paže)","arm","mean",""]];
const SR_VID=[["Koleno – natažené (dole)","knee","max","orientačně 145–155°"],["Koleno – pokrčené (nahoře)","knee","min",""],["Kyčel – nejvíc zavřená (nahoře)","hip","min","nižší = větší omezení výkonu a komfortu"],["Kyčel – otevřená (dole)","hip","max",""],["Sklon trupu (průměr)","trunk","mean","nižší = menší čelní plocha"],["Sklon trupu – rozkmit","trunk","range","vyšší = méně stabilní trup"],["Loket (průměr)","elbow","mean","kloub opřený v podložkách"],["Rameno (průměr)","arm","mean",""]];
const f1=x=>x.toFixed(1)+"°";
const getv=(st,s)=>s==="range"?st.max-st.min:st[s];

function renderResults(){
  const SL=sideStats("left"),SR=sideStats("right"),F=fbStats("front"),Bk=fbStats("back");
  const MA=mobAnalysis(SL,SR);
  if(!SL&&!SR&&!F&&!Bk&&!MA){
    $("resOut").innerHTML="<p class='muted'>Zatím není zpracovaný žádný pohled. Přepni na záložku s pohledem a nahraj fotku nebo video.</p>";
    $("outBox").classList.add("hidden");if(window.aeroHist)window.aeroHist.clearSaveBox("savePos");return;
  }
  const miss=VIEWS.filter(k=>!done(k)).map(k=>VN[k]);
  const vids=VIEWS.filter(k=>done(k)&&V[k].frames).map(k=>VN[k]);
  let h="";const T=[];
  if(miss.length&&miss.length<4)h+="<p class='muted warn'>Chybí nebo nejsou hotové pohledy: "+miss.join(", ")+". Výsledky jsou jen z dokončených pohledů.</p>";
  if(SL||SR){
    const rows=(vids.length&&((SL&&SL.n>1)||(SR&&SR.n>1)))?SR_VID:SR_PHOTO;
    h+="<h3>Z boku</h3><table><tr><td></td><td>Levá</td><td>Pravá</td><td>Rozdíl</td></tr>";
    T.push("Z boku (levá / pravá / rozdíl):");
    rows.forEach(r=>{
      const l=SL?getv(SL[r[1]],r[2]):null,p=SR?getv(SR[r[1]],r[2]):null,df=(l!==null&&p!==null)?Math.abs(l-p):null;
      h+="<tr><td>"+r[0]+(r[3]?"<small>"+r[3]+"</small>":"")+"</td><td>"+(l!==null?f1(l):"–")+"</td><td>"+(p!==null?f1(p):"–")+"</td><td"+(df!==null&&df>5?" class='flag'":"")+">"+(df!==null?f1(df):"–")+"</td></tr>";
      T.push("- "+r[0]+": L "+(l!==null?f1(l):"–")+" / P "+(p!==null?f1(p):"–")+(df!==null?" / rozdíl "+f1(df):""));
    });
    h+="</table><p class='muted'>Rozdíl nad 5° je zvýrazněn. Může jít o asymetrii, ale také o jinou polohu kliky nebo chybu měření.</p>";
    if(SL)h+="<p class='muted'>Levá: "+SL.info+"</p>";
    if(SR)h+="<p class='muted'>Pravá: "+SR.info+"</p>";
    T.push((SL?"Levá: "+SL.info:"")+(SR?" Pravá: "+SR.info:""));
  }
  [["front","Zepředu",F],["back","Zezadu",Bk]].forEach(x=>{
    if(!x[2])return;const rows=fbRows(x[0],x[2]);
    h+="<h3>"+x[1]+"</h3><table>"+rows.map(r=>"<tr><td>"+r[0]+(r[2]?"<small>"+r[2]+"</small>":"")+"</td><td>"+r[1]+"</td></tr>").join("")+"</table>";
    T.push("");T.push(x[1]+":");rows.forEach(r=>T.push("- "+r[0]+": "+r[1]));
  });
  if(MA){h+=MA.h;T.push("");MA.T.forEach(x=>T.push(x));}
  $("resOut").innerHTML=h;
  const src=VIEWS.filter(k=>done(k)).map(k=>VN[k]+": "+(V[k].frames?"video, "+V[k].frames.length+" snímků, průměrná jistota "+Math.round((V[k].det?V[k].det.minVis:0)*100)+" %":(V[k].edited?"fotka, body označeny nebo upraveny ručně":"fotka, automaticky, jistota od "+Math.round((V[k].det?V[k].det.minVis:0)*100)+" %"))).join("; ");
  const txt="Jsem časovkář, zlepšuji aerodynamickou pozici na TT kole. Mám změřené úhly ("+(mode==="fixed"?"pevné stanoviště":"z ruky, boční pohledy s korekcí perspektivy")+"). Zdroj: "+src+"."+(vids.length?" U videí jsou hodnoty počítány přes celý cyklus šlapání (minimum, maximum nebo průměr podle popisku, rozkmit = rozdíl maxima a minima).":" U fotek je měřená noha dole.")+"\n\n"+
  "Jezdec: výška "+($("v").value||"?")+" cm, hmotnost "+($("h").value||"?")+" kg, pas "+($("p").value||"?")+" cm, délka nohy "+($("n").value||"?")+" cm.\n"+
  "Poznámky: "+($("o").value||"žádné")+"\n"+(miss.length?"Chybějící pohledy: "+miss.join(", ")+"\n":"")+"\n"+T.join("\n")+
  "\n\nPoraď malé úpravy pozice a vybavení pro nižší CdA. Hlídej komfort a to, aby pozice neomezovala výkon z nohou (úhel v kyčli). Všimni si případných asymetrií mezi levou a pravou stranou a řekni, které mohou být skutečné a které spíš chyba měření. U každé rady uveď, o kolik a proč, a co si mám při změně hlídat. Pokud je měření nejisté, řekni to."+(MA?" Navrhovanou pozici přizpůsob limitům mojí mobility uvedeným výše a řekni, kterou oblast mobility mám zlepšit, aby šla pozice dál zlepšit, a jak (konkrétní cviky a jak dlouho).":"");
  $("out").value=txt;$("outBox").classList.remove("hidden");
  // Anonymní čísla pro výzkum (bez fotek a bez poznámek)
  const r2=x=>x==null||!isFinite(x)?null:Math.round(x*100)/100;
  const st=s=>s?{mean:r2(s.mean),min:r2(s.min),max:r2(s.max)}:null;
  const pick=(S,keys)=>{if(!S)return null;const o={n:S.n};keys.forEach(k=>{o[k]=st(S[k]);});return o;};
  const numIn=id=>{const x=parseFloat(String($(id).value).replace(",","."));return isFinite(x)?x:null;};
  const SIDEK=["knee","hip","elbow","arm","trunk"],FBK=["shT","hipT","lean","elbW","kneeW","ankW","kL","kR"];
  const shareData={mode:mode,
    views:VIEWS.filter(k=>done(k)).map(k=>({view:k,video:!!V[k].frames,frames:V[k].frames?V[k].frames.length:1,edited:!!V[k].edited})),
    rider:{height_cm:numIn("v"),mass_kg:numIn("h"),waist_cm:numIn("p"),leg_cm:numIn("n")},
    side:{left:pick(SL,SIDEK),right:pick(SR,SIDEK)},front:pick(F,FBK),back:pick(Bk,FBK),
    mobility:MOB.reduce((o,k)=>{o[k]=r2(mobVal(k));return o;},{})};
  if(window.aeroShare)window.aeroShare.attach("shPos","position",()=>shareData);
  if(window.aeroHist)window.aeroHist.saveBox("savePos",()=>shareData);
}

$("copy").onclick=()=>{const ta=$("out");ta.focus();ta.select();let ok=false;
  try{ok=document.execCommand("copy");}catch(e){}
  if(!ok&&navigator.clipboard){navigator.clipboard.writeText(ta.value).then(()=>{$("copied").textContent="Zkopírováno";},()=>{$("copied").textContent="Označ text a zkopíruj ručně";});return;}
  $("copied").textContent=ok?"Zkopírováno":"Označ text a zkopíruj ručně";};
["v","h","p","n","o"].forEach(i=>{$(i).oninput=()=>{if(cur==="res")renderResults();};});
