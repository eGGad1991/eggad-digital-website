(() => {
  const player = document.querySelector(".story-reader");
  if (!player || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    if (player) player.querySelector("[data-reader-status]").textContent = "Vorlesen wird von diesem Browser leider nicht unterstützt.";
    return;
  }
  const playButton = player.querySelector("[data-reader-play]");
  const pauseButton = player.querySelector("[data-reader-pause]");
  const stopButton = player.querySelector("[data-reader-stop]");
  const speedInput = player.querySelector("[data-reader-speed]");
  const speedValue = player.querySelector("[data-reader-speed-value]");
  const status = player.querySelector("[data-reader-status]");
  let paragraphs = [], index = 0, active = false, runId = 0;
  const synth = window.speechSynthesis;
  function getParagraphs() {
    const root = document.querySelector(".story-article .story-copy") || document.getElementById("story-content");
    if (!root) return [];
    return Array.from(root.querySelectorAll("p, h2, h3, blockquote"))
      .map(el => (el.innerText || el.textContent || "").trim())
      .filter(Boolean);
  }
  function updateButtons() {
    pauseButton.disabled = !active;
    stopButton.disabled = !active && index === 0;
    playButton.textContent = active && synth.paused ? "▶ Weiter" : "▶ Vorlesen";
  }
  function speakNext(id) {
    if (id !== runId || !active) return;
    if (index >= paragraphs.length) {
      active = false; index = 0; status.textContent = "Die Geschichte ist zu Ende."; updateButtons(); return;
    }
    const utterance = new SpeechSynthesisUtterance(paragraphs[index]);
    const voices = synth.getVoices();
    const germanVoice = voices.find(v => /^de(-|_)?DE$/i.test(v.lang)) || voices.find(v => /^de/i.test(v.lang));
    if (germanVoice) utterance.voice = germanVoice;
    utterance.lang = germanVoice?.lang || "de-DE";
    utterance.rate = Number(speedInput.value);
    utterance.pitch = 1;
    status.textContent = "Lese Abschnitt " + (index + 1) + " von " + paragraphs.length + " vor …";
    utterance.onend = () => { if (id === runId && active) { index++; speakNext(id); } };
    utterance.onerror = event => {
      if (id !== runId) return;
      if (event.error === "canceled" || event.error === "interrupted") return;
      active = false; status.textContent = "Das Vorlesen wurde unterbrochen."; updateButtons();
    };
    synth.speak(utterance);
    updateButtons();
  }
  playButton.addEventListener("click", () => {
    if (active && synth.paused) { synth.resume(); status.textContent = "Vorlesen läuft weiter …"; updateButtons(); return; }
    if (active) return;
    paragraphs = getParagraphs();
    if (!paragraphs.length) { status.textContent = "Der Text ist noch nicht geladen. Bitte kurz warten und erneut starten."; return; }
    index = 0; active = true; runId++; synth.cancel(); speakNext(runId);
  });
  pauseButton.addEventListener("click", () => {
    if (!active) return;
    if (synth.paused) { synth.resume(); status.textContent = "Vorlesen läuft weiter …"; }
    else { synth.pause(); status.textContent = "Pausiert."; }
    updateButtons();
  });
  stopButton.addEventListener("click", () => {
    runId++; synth.cancel(); active = false; index = 0; status.textContent = "Vorlesen gestoppt."; updateButtons();
  });
  speedInput.addEventListener("input", () => { speedValue.textContent = Number(speedInput.value).toFixed(1).replace(".", ",") + "×"; });
  window.addEventListener("beforeunload", () => synth.cancel());
  updateButtons();
})();