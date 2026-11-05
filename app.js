const files = {
  about: {code:"MG-FILE-001",num:"01",tag:"PERSONAL PROFILE",eyebrow:"DAS BIN ICH",title:'Hi, ich bin <em>Marc.</em>',lead:"Ich interessiere mich dafür, wie digitale Werkzeuge den Alltag einfacher machen können.",body:"Mein Schwerpunkt liegt auf KI-Tools, digitalem Marketing und Automatisierung. Mir ist wichtig, Dinge nicht nur theoretisch zu verstehen, sondern sie praktisch auszuprobieren und verständlich zu erklären.",status:"IN ENTWICKLUNG"},
  skills: {code:"MG-FILE-002",num:"02",tag:"SKILLS & TOOLS",eyebrow:"WOMIT ICH ARBEITE",title:'Tools, Ideen und <em>Umsetzung.</em>',lead:"Ich baue meine Fähigkeiten rund um Digital Business und KI Schritt für Schritt aus.",body:"Dazu gehören unter anderem Google Sheets, Excel, Looker Studio, Canva, Trello, Make und Slack. Außerdem beschäftige ich mich mit KI-Anwendungen und den Grundlagen von HTML, CSS, JavaScript und Supabase.",status:"WIRD ERWEITERT"},
  education: {code:"MG-FILE-003",num:"03",tag:"EDUCATION",eyebrow:"MEIN LERNWEG",title:'Weiterbildung mit <em>Praxisbezug.</em>',lead:"Digital Business mit den Vertiefungen IT-Anwendungsberatung und KI Digital Marketing Manager.",body:"Meine Weiterbildung bei DCI läuft vom 17.08.2026 bis zum 12.10.2027. Ich verbinde die Inhalte mit eigenen Projekten, um das Gelernte direkt praktisch anzuwenden.",status:"AKTIV"},
  usp: {code:"MG-FILE-004",num:"04",tag:"UNIQUE VALUE",eyebrow:"WAS MICH AUSZEICHNET",title:'Komplexes einfach <em>machen.</em>',lead:"Ich erkläre KI-Tools und Marketing-Automatisierung verständlich und praxisnah.",body:"Mein Ziel ist, dass Menschen digitale Werkzeuge nicht nur kennenlernen, sondern sie für ihre eigenen Aufgaben einsetzen können. Ich probiere aus, dokumentiere und mache die Schritte nachvollziehbar.",status:"MEIN ANSATZ"},
  projects: {code:"MG-FILE-005",num:"05",tag:"PROJECT ARCHIVE",eyebrow:"AUS IDEEN WERDEN PROJEKTE",title:'Selbst ausprobieren. <em>Weiterdenken.</em>',lead:"Hier entstehen Projekte rund um KI, Automatisierung, Daten und digitale Inhalte.",body:"Im Archiv findest du unter anderem eGGad_Digital, den Growth-Bot, Dashboards & Data Storytelling, einen KI-Lernassistenten und das Fantasy-Projekt Valdara. Die einzelnen Projektseiten werden nach und nach ergänzt.",status:"5 PROJEKTE ANGELEGT"},
  contact: {code:"MG-FILE-006",num:"06",tag:"CONTACT",eyebrow:"AUSTAUSCH ERWÜNSCHT",title:'Lass uns <em>sprechen.</em>',lead:"Du hast eine Frage, eine Idee oder möchtest dich austauschen?",body:'Schreib mir gerne eine Nachricht. Die endgültigen Kontaktangaben und Social-Links werden im Admin-Bereich ergänzt.',status:"KONTAKTBEREICH"}
};
const buttons = [...document.querySelectorAll(".drawer")];
const content = document.getElementById("panel-content");
const code = document.getElementById("panel-code");
function openFile(key){
  const f=files[key]; if(!f)return;
  buttons.forEach(b=>{const active=b.dataset.panel===key;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));});
  code.textContent=f.code;
  content.innerHTML=`<div class="file-symbol">${f.num} <span>${f.tag}</span></div><div class="eyebrow">${f.eyebrow}</div><h3>${f.title}</h3><p class="lead">${f.lead}</p><p>${f.body}</p><div class="panel-meta"><span>STATUS</span><strong>${f.status}</strong></div>`;
}
buttons.forEach(btn=>{
  btn.addEventListener("mouseenter",()=>{if(matchMedia("(hover:hover)").matches)openFile(btn.dataset.panel)});
  btn.addEventListener("focus",()=>openFile(btn.dataset.panel));
  btn.addEventListener("click",()=>openFile(btn.dataset.panel));
});
