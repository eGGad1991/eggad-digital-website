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
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();
scene.background=null;
const camera=new THREE.PerspectiveCamera(34,1,.1,100);
camera.position.set(6.5,5.2,10.5);
const controlsTarget=new THREE.Vector3(-.25,2.45,0);
const hemi=new THREE.HemisphereLight(0x9cfaff,0x071114,1.45);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(0xe4ffff,2.6);keyLight.position.set(-4,9,7);keyLight.castShadow=true;keyLight.shadow.mapSize.set(2048,2048);keyLight.shadow.camera.left=-8;keyLight.shadow.camera.right=8;keyLight.shadow.camera.top=8;keyLight.shadow.camera.bottom=-8;scene.add(keyLight);
const cyanLight=new THREE.PointLight(0x00eaff,28,16);cyanLight.position.set(-3,3,4);cyanLight.castShadow=true;scene.add(cyanLight);
const rimLight=new THREE.PointLight(0x007f91,26,10);rimLight.position.set(3,5,-3);scene.add(rimLight);
const floorMat=new THREE.MeshStandardMaterial({color:0x061619,metalness:.75,roughness:.32});
const metal=new THREE.MeshStandardMaterial({color:0x203b3e,metalness:.88,roughness:.28});
const darkMetal=new THREE.MeshStandardMaterial({color:0x0a1b1e,metalness:.82,roughness:.32});
const edgeMetal=new THREE.MeshStandardMaterial({color:0x52777a,metalness:.92,roughness:.2});
const cyanMat=new THREE.MeshStandardMaterial({color:0x00cbd2,emissive:0x007d84,emissiveIntensity:1.45,metalness:.55,roughness:.25});
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
 box(group,W-.48,.45,.065,darkMetal,0,.035,.112);
 box(group,W-.40,.018,.025,cyanMat,0,.265,.155);
 box(group,W-.40,.018,.025,cyanMat,0,-.195,.155);
 // cyan accent bar at bottom of face
 box(group,.88,.035,.035,cyanMat,0,-.26,.11);
 // Front label as a high-contrast 3D sprite, attached to the moving drawer.
 // Sprites always face the camera, so the title stays readable while the cabinet is rotated.
 const labelCanvas=document.createElement("canvas");labelCanvas.width=1024;labelCanvas.height=256;
 const ctx=labelCanvas.getContext("2d");
 ctx.clearRect(0,0,1024,256);
 ctx.fillStyle="rgba(3,17,20,.97)";ctx.fillRect(8,8,1008,240);
 ctx.strokeStyle="#00e4e8";ctx.lineWidth=7;ctx.strokeRect(10,10,1004,236);
 ctx.fillStyle="#00e4e8";ctx.font="bold 58px Arial";ctx.textAlign="left";ctx.textBaseline="middle";
 ctx.fillText(String(i+1).padStart(2,"0"),42,83);
 ctx.fillStyle="#f2ffff";ctx.font="bold 64px Arial";
 const labels=["ÜBER MICH","FÄHIGKEITEN","WEITERBILDUNG","MEIN USP","PROJEKTE","KONTAKT"];
 const descriptions=["Weg · Erfahrungen · Ziele","Tools · Kenntnisse · Methoden","DCI · Qualifikationen · Zertifikate","Stärken · Arbeitsweise · Mehrwert","Eigene Arbeiten · Ergebnisse","Nachricht · Austausch · Links"];
 ctx.fillText(labels[i],150,83);
 ctx.fillStyle="#a8d0d2";ctx.font="36px Arial";
 ctx.fillText(descriptions[i],152,177);
 const tex=new THREE.CanvasTexture(labelCanvas);tex.colorSpace=THREE.SRGBColorSpace;tex.needsUpdate=true;
 const spriteMat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const label=new THREE.Sprite(spriteMat);
 label.position.set(0,.015,.255);label.scale.set(1.78,.445,1);label.renderOrder=20;group.add(label);
 // number marker and pull handle
 const handle=box(group,.72,.055,.12,edgeMetal,0,-.255,.17);
 box(group,.56,.022,.018,cyanMat,0,-.255,.24);
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
const groundMat=new THREE.MeshStandardMaterial({color:0x071416,metalness:.72,roughness:.22});
const ground=box(scene,20,.16,16,groundMat,0,-.1,0);ground.receiveShadow=true;
// Polished floor with subtle tile seams and reflected cyan light pools.
const seamMat=new THREE.MeshStandardMaterial({color:0x16464a,emissive:0x002d32,emissiveIntensity:.35,metalness:.6,roughness:.38});
for(let x=-9;x<=9;x+=2.25) box(scene,.012,.008,16,seamMat,x,-.014,0);
for(let z=-7;z<=7;z+=2) box(scene,20,.008,.012,seamMat,0,-.014,z);
// Architectural back wall and illuminated wall ribs.
const backWallMat=new THREE.MeshStandardMaterial({color:0x071719,metalness:.58,roughness:.48});
box(scene,20,8,.22,backWallMat,0,3.7,-2.8);
for(let i=0;i<9;i++){
 const x=-8+i*2;
 box(scene,.022,6.5,.035,cyanMat,x,3.7,-2.66);
 box(scene,.11,7,.07,darkMetal,x+.10,3.7,-2.68);
}
// Horizontal illuminated ceiling/wall rails.
box(scene,18,.045,.10,cyanMat,0,7.25,-2.55);
box(scene,18,.12,.16,darkMetal,0,7.12,-2.62);
box(scene,18,.045,.1,cyanMat,0,.25,-2.62);
// Left-side workstation silhouette: counter, monitor and plant add a real office context.
const deskGroup=new THREE.Group();scene.add(deskGroup);
box(deskGroup,3.6,.16,1.35,metal,-4.2,1.05,.35);
box(deskGroup,3.45,.08,1.22,darkMetal,-4.2,1.16,.35);
box(deskGroup,.12,1.05,.12,metal,-5.75,.52,.35);
box(deskGroup,.12,1.05,.12,metal,-2.65,.52,.35);
const monitor=box(deskGroup,1.55,1.05,.12,blackMat,-4.25,2.15,-.12);
box(deskGroup,1.42,.91,.018,cyanMat,-4.25,2.15,-.055);
box(deskGroup,1.34,.82,.02,blackMat,-4.25,2.15,-.035);
box(deskGroup,.09,.55,.09,metal,-4.25,1.55,-.12);
box(deskGroup,.65,.07,.42,metal,-4.25,1.28,-.12);
// Monitor data bars
for(let i=0;i<8;i++) box(deskGroup,.075,.18+(i%4)*.12,.025,cyanMat,-4.72+i*.13,1.88+(i%4)*.06,-.005);
// Plant pot and stylized leaves on the desk
const potMat=new THREE.MeshStandardMaterial({color:0x16393b,metalness:.45,roughness:.35});
const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.34,24),potMat);pot.position.set(-5.55,1.42,.25);pot.castShadow=true;deskGroup.add(pot);
const stemMat=new THREE.MeshStandardMaterial({color:0x1b6b4b,roughness:.8});
for(let i=0;i<9;i++){
 const angle=i*Math.PI*2/9;
 const leaf=new THREE.Mesh(new THREE.SphereGeometry(.10,12,8),stemMat);
 leaf.scale.set(.55,1.8,.45);leaf.position.set(-5.55+Math.cos(angle)*.22,1.78+(i%3)*.12,.25+Math.sin(angle)*.2);leaf.rotation.z=Math.cos(angle)*.65;leaf.castShadow=true;deskGroup.add(leaf);
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
 const narrow=w<500;camera.position.set(narrow?-8.8:-8.4,5.15,narrow?16.2:14.2);camera.lookAt(controlsTarget);
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
