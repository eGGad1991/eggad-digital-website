import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const fileData = {
 about:{code:"MG-FILE-001",num:"01",tag:"PERSONAL PROFILE",eyebrow:"DAS BIN ICH",title:'Hi, ich bin <em>Marc.</em>',lead:"Ich interessiere mich dafür, wie digitale Werkzeuge den Alltag einfacher machen können.",body:"Mein Schwerpunkt liegt auf KI-Tools, digitalem Marketing und Automatisierung. Mir ist wichtig, Dinge nicht nur theoretisch zu verstehen, sondern sie praktisch auszuprobieren und verständlich zu erklären.",status:"IN ENTWICKLUNG"},
 skills:{code:"MG-FILE-002",num:"02",tag:"SKILLS & TOOLS",eyebrow:"WOMIT ICH ARBEITE",title:'Tools, Ideen und <em>Umsetzung.</em>',lead:"Ich baue meine Fähigkeiten rund um Digital Business und KI Schritt für Schritt aus.",body:"Dazu gehören unter anderem Google Sheets, Excel, Looker Studio, Canva, Trello, Make und Slack. Außerdem beschäftige ich mich mit KI-Anwendungen und den Grundlagen von HTML, CSS, JavaScript und Supabase.",status:"WIRD ERWEITERT"},
 education:{code:"MG-FILE-003",num:"03",tag:"EDUCATION",eyebrow:"MEIN LERNWEG",title:'Weiterbildung mit <em>Praxisbezug.</em>',lead:"Digital Business mit den Vertiefungen IT-Anwendungsberatung und KI Digital Marketing Manager.",body:"Meine Weiterbildung bei DCI läuft vom 17.08.2026 bis zum 12.10.2027. Ich verbinde die Inhalte mit eigenen Projekten, um das Gelernte direkt praktisch anzuwenden.",status:"AKTIV"},
 usp:{code:"MG-FILE-004",num:"04",tag:"UNIQUE VALUE",eyebrow:"WAS MICH AUSZEICHNET",title:'Komplexes einfach <em>machen.</em>',lead:"Ich erkläre KI-Tools und Marketing-Automatisierung verständlich und praxisnah.",body:"Mein Ziel ist, dass Menschen digitale Werkzeuge nicht nur kennenlernen, sondern sie für ihre eigenen Aufgaben einsetzen können. Ich probiere aus, dokumentiere und mache die Schritte nachvollziehbar.",status:"MEIN ANSATZ"},
 projects:{code:"MG-FILE-005",num:"05",tag:"PROJECT ARCHIVE",eyebrow:"AUS IDEEN WERDEN PROJEKTE",title:'Selbst ausprobieren. <em>Weiterdenken.</em>',lead:"Hier entstehen Projekte rund um KI, Automatisierung, Daten und digitale Inhalte.",body:"Im Archiv findest du unter anderem eGGad_Digital, den Growth-Bot, Dashboards & Data Storytelling, einen KI-Lernassistenten und das Fantasy-Projekt Valdara. Die einzelnen Projektseiten werden nach und nach ergänzt.",status:"5 PROJEKTE ANGELEGT"},
 contact:{code:"MG-FILE-006",num:"06",tag:"CONTACT",eyebrow:"AUSTAUSCH ERWÜNSCHT",title:'Lass uns <em>sprechen.</em>',lead:"Du hast eine Frage, eine Idee oder möchtest dich austaus?",body:'Schreib mir gerne eine Nachricht. Die endgültigen Kontaktangaben und Social-Links werden im Admin-Bereich ergänzt.',status:"KONTAKTBEREICH"}
};
const keys=["about","skills","education","usp","projects","contact"];
const canvas=document.querySelector("#cabinet-canvas");
const stage=document.querySelector("#cabinet-stage");
const loading=document.querySelector("#loading-note");
const content=document.querySelector("#panel-content");
const panelCode=document.querySelector("#panel-code");

function showFile(key){
 const f=fileData[key]; if(!f)return;
 panelCode.textContent=f.code;
 content.innerHTML=`<div class="file-symbol">${f.num} <span>${f.tag}</span></div><div class="eyebrow">${f.eyebrow}</div><h3>${f.title}</h3><p class="lead">${f.lead}</p><p>${f.body}</p><div class="panel-meta"><span>STATUS</span><strong>${f.status}</strong></div>`;
}
showFile("about");

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();
scene.background=null;
const camera=new THREE.PerspectiveCamera(34,1,.1,100);
camera.position.set(6.5,5.2,10.5);
const controlsTarget=new THREE.Vector3(0,2.55,0);
const hemi=new THREE.HemisphereLight(0x9cfaff,0x071114,2.0);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(0xe4ffff,3.2);keyLight.position.set(-4,8,7);scene.add(keyLight);
const cyanLight=new THREE.PointLight(0x00eaff,32,12);cyanLight.position.set(-3,3,4);scene.add(cyanLight);
const rimLight=new THREE.PointLight(0x007f91,26,10);rimLight.position.set(3,5,-3);scene.add(rimLight);
const floorMat=new THREE.MeshStandardMaterial({color:0x061619,metalness:.75,roughness:.32});
const metal=new THREE.MeshStandardMaterial({color:0x203b3e,metalness:.88,roughness:.28});
const darkMetal=new THREE.MeshStandardMaterial({color:0x0a1b1e,metalness:.82,roughness:.32});
const edgeMetal=new THREE.MeshStandardMaterial({color:0x52777a,metalness:.92,roughness:.2});
const cyanMat=new THREE.MeshStandardMaterial({color:0x00e4e8,emissive:0x00aeb8,emissiveIntensity:2.6,metalness:.4,roughness:.22});
const blackMat=new THREE.MeshStandardMaterial({color:0x071012,metalness:.55,roughness:.35});
const cabinet=new THREE.Group();scene.add(cabinet);
const W=3.5,H=5.25,D=2.05,wall=.16;
function box(parent,w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function edge(parent,w,h,d,x,y,z){return box(parent,w,h,d,edgeMetal,x,y,z);}
box(cabinet,W,H,.18,darkMetal,0,H/2,-D/2);
box(cabinet,wall,H,D,metal,-W/2+wall/2,H/2,0);
box(cabinet,wall,H,D,metal,W/2-wall/2,H/2,0);
box(cabinet,W,.18,D,metal,0,.09,0);
box(cabinet,W,.18,D,metal,0,H-.09,0);
box(cabinet,W+.12,.16,D+.12,edgeMetal,0,H+.08,0);
box(cabinet,W-.12,.08,.08,cyanMat,0,H-.25,D/2-.02);
// rear interior back glow strips
for(let x of [-1.48,1.48]) box(cabinet,.025,H-.4,.025,cyanMat,x,H/2,D/2-.04);
const drawers=[];
const drawerH=.72,gap=.105,firstY=H-.58;
const folderColors=[0x00bfc8,0x147c89,0x1b5965,0x00dce4];
keys.forEach((key,i)=>{
 const y=firstY-i*(drawerH+gap);
 const group=new THREE.Group();group.position.set(0,y,D/2-.05);cabinet.add(group);
 // Tray is a real open-top box with base, side walls and back. Local z extends forward.
 const innerW=W-.48,innerD=1.52;
 box(group,innerW,.075,innerD,darkMetal,0,-drawerH/2+.06,innerD/2-.02);
 box(group,.075,drawerH-.08,innerD,metal,-innerW/2+.04,0,innerD/2-.02);
 box(group,.075,drawerH-.08,innerD,metal,innerW/2-.04,0,innerD/2-.02);
 box(group,innerW,drawerH-.08,.08,metal,0,0,innerD-.06);
 // inner luminous rail strips
 box(group,.025,.035,innerD,cyanMat,-innerW/2+.09,-drawerH/2+.12,innerD/2-.02);
 box(group,.025,.035,innerD,cyanMat,innerW/2-.09,-drawerH/2+.12,innerD/2-.02);
 // folders stand inside and become visible when pulled out
 for(let j=0;j<4;j++){
   const folder=new THREE.Group();folder.position.set(-.95+j*.53,-.01,.45+(j%2)*.05);group.add(folder);
   const fm=new THREE.MeshStandardMaterial({color:folderColors[j],metalness:.3,roughness:.45,emissive:folderColors[j],emissiveIntensity:.18});
   box(folder,.42,.43,.055,fm,0,.12,0);
   box(folder,.19,.09,.06,fm,-.11,.36,0);
   box(folder,.29,.012,.012,edgeMetal,0,.17,.036);
 }
 // front fascia and separate front plate
 const front=box(group,W-.2,drawerH-.08,.16,metal,0,0,0);
 box(group,W-.52,.39,.055,darkMetal,0,.03,.105);
 // cyan accent bar at bottom of face
 box(group,.88,.035,.035,cyanMat,0,-.26,.11);
 // High-contrast front label: drawer title plus a short description of its contents.
 const labelCanvas=document.createElement("canvas");labelCanvas.width=1024;labelCanvas.height=256;
 const ctx=labelCanvas.getContext("2d");
 ctx.clearRect(0,0,1024,256);
 ctx.fillStyle="rgba(3,17,20,.94)";ctx.fillRect(0,0,1024,256);
 ctx.strokeStyle="#00dce4";ctx.lineWidth=5;ctx.strokeRect(3,3,1018,250);
 ctx.fillStyle="#00e4e8";ctx.font="bold 54px Arial";ctx.textAlign="left";ctx.textBaseline="middle";
 ctx.fillText(String(i+1).padStart(2,"0"),42,84);
 ctx.fillStyle="#f1ffff";ctx.font="bold 58px Arial";
 const labels=["ÜBER MICH","FÄHIGKEITEN","WEITERBILDUNG","MEIN USP","PROJEKTE","KONTAKT"];
 const descriptions=["Weg · Erfahrungen · Ziele","Tools · Kenntnisse · Methoden","DCI · Qualifikationen · Zertifikate","Stärken · Arbeitsweise · Mehrwert","Eigene Arbeiten · Ergebnisse","Nachricht · Austausch · Links"];
 ctx.fillText(labels[i],142,84);
 ctx.fillStyle="#9fc6c9";ctx.font="34px Arial";
 ctx.fillText(descriptions[i],144,177);
 const tex=new THREE.CanvasTexture(labelCanvas);tex.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Mesh(
   new THREE.PlaneGeometry(1.58,.395),
   new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide,toneMapped:false})
 );
 label.position.set(0,.015,.132);group.add(label);
 // number marker and pull handle
 const handle=box(group,.75,.055,.12,edgeMetal,0,-.17,.14);
 box(group,.58,.022,.018,cyanMat,0,-.17,.205);
 // front corner rivets
 for(const sx of [-1,1])for(const sy of [-1,1]){
  const rivet=new THREE.Mesh(new THREE.SphereGeometry(.027,12,8),edgeMetal);rivet.position.set(sx*(W-.34)/2,sy*(drawerH-.22)/2,.095);group.add(rivet);
 }
 // 3D sliding rail bars fixed to cabinet sides
 for(const sx of [-1,1]){
  const rail=box(cabinet,.075,.09,1.9,edgeMetal,sx*(W/2-.22),y, .52);
  const railGlow=box(cabinet,.025,.025,1.8,cyanMat,sx*(W/2-.22)+(sx<0?.05:-.05),y-.1,.52);
 }
 group.userData={key,index:i,open:0,target:0,baseZ:D/2-.05};
 drawers.push(group);
});
const ground=box(scene,18,.12,14,floorMat,0,-.08,0);ground.receiveShadow=true;
// Subtle reflective floor tiles: restrained seams instead of a bright wireframe grid.
const seamMat=new THREE.MeshStandardMaterial({color:0x0b5960,emissive:0x00363b,emissiveIntensity:.45,metalness:.55,roughness:.42});
for(let x=-8;x<=8;x+=2){
  const seam=box(scene,.012,.006,14,seamMat,x,-.012,0);
  seam.material=seamMat;
}
for(let z=-6;z<=6;z+=2){
  const seam=box(scene,18,.006,.012,seamMat,0,-.012,z);
  seam.material=seamMat;
}
// decorative back wall panel behind cabinet
const backPanel=box(scene,7,6,.12,darkMetal,0,2.7,-2.3);
for(let i=0;i<8;i++){
 const bar=box(scene,.012,5,.015,cyanMat,-3.1+i*.88,2.7,-2.22);bar.material=cyanMat;
}
// subtle floating cyan particles
const particleGeo=new THREE.BufferGeometry();const pts=[];
for(let i=0;i<90;i++)pts.push((Math.random()-.5)*7,Math.random()*5.5,(Math.random()-.5)*3-1.4);
particleGeo.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));
const particleMat=new THREE.PointsMaterial({color:0x00dfe8,size:.025,transparent:true,opacity:.65});
const particles=new THREE.Points(particleGeo,particleMat);scene.add(particles);

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let hovered=-1,selected=0,dragging=false,down=false,lastX=0,rotY=-.08,rotTarget=-.08;
const clickable=[];
drawers.forEach((g,i)=>{g.traverse(o=>{if(o.isMesh && o.geometry.type==="BoxGeometry" && o.position.z<.2) clickable.push({mesh:o,index:i});});});
function choose(i,lock=true){
 if(i<0||i>=drawers.length)return;
 selected=i;
 drawers.forEach((g,j)=>g.userData.target=(j===i?1:0));
 showFile(keys[i]);
}
function pointerMove(e){
 const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;
 if(down){const dx=e.clientX-lastX;rotTarget+=dx*.006;lastX=e.clientX;return;}
 raycaster.setFromCamera(pointer,camera);
 const hits=raycaster.intersectObjects(drawers.map(g=>g.children).flatMap(a=>a),true);
 if(hits.length){
  let obj=hits[0].object;let g=obj;while(g && g.parent!==cabinet)g=g.parent;
  if(g&&g.userData&&Number.isInteger(g.userData.index)){
   hovered=g.userData.index;
   drawers.forEach((d,i)=>{if(i!==selected)d.userData.target=(i===hovered?.45:0);});
   canvas.style.cursor="pointer";
  }
 }else{
  hovered=-1;drawers.forEach((d,i)=>{if(i!==selected)d.userData.target=0;});canvas.style.cursor="grab";
 }
}
canvas.addEventListener("pointermove",pointerMove);
canvas.addEventListener("pointerdown",e=>{down=true;dragging=false;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener("pointermove",e=>{if(down)dragging=true;});
canvas.addEventListener("pointerup",e=>{
 down=false;
 if(!dragging){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(drawers,true);if(hits.length){let g=hits[0].object;while(g&&g.parent!==cabinet)g=g.parent;if(g&&Number.isInteger(g.userData.index))choose(g.userData.index);}}
});
canvas.addEventListener("pointerleave",()=>{if(!down){hovered=-1;drawers.forEach((d,i)=>{if(i!==selected)d.userData.target=0;});}});
function resize(){
 const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 const narrow=w<500;camera.position.set(narrow?-7.5:-6.5,5.0,narrow?13.2:10.8);camera.lookAt(controlsTarget);
}
window.addEventListener("resize",resize);resize();
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);const t=clock.getElapsedTime();
 drawers.forEach((g,i)=>{
  const u=g.userData;u.open+=(u.target-u.open)*.11;
  // Real translation along cabinet depth, on visible metal rails.
  g.position.z=u.baseZ+u.open*1.55;
  g.position.x=Math.sin(t*1.4+i)*.002;
 });
 rotY+=(rotTarget-rotY)*.05;cabinet.rotation.y=rotY;
 particles.rotation.y=t*.025;
 renderer.render(scene,camera);
}
animate();
loading.style.display="none";
choose(0);
