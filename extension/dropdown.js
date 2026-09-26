(() => {
  const existing = document.getElementById("oshiete-dropdown-host");
  if (existing) { existing.remove(); return; }

  const host = document.createElement("div");
  host.id = "oshiete-dropdown-host";
  host.style.cssText = "all:initial; position:fixed; top:12px; right:16px; z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box} .panel{width:390px;max-height:calc(100vh - 24px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #d8d3c9;border-radius:12px;background:#fbfaf7;color:#24231f;box-shadow:0 12px 40px #0004;font:14px/1.5 system-ui,sans-serif}
      header{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;background:#f0ece3;border-bottom:1px solid #ded8cb} h1{margin:0;font-size:17px} .close{border:0;background:none;font-size:22px;cursor:pointer;color:inherit}
      main{padding:14px;overflow:auto} textarea{width:100%;resize:vertical;border:1px solid #c9c3b8;border-radius:7px;padding:9px;font:inherit} button.run{width:100%;margin-top:8px;padding:9px;border:0;border-radius:7px;background:#385b4a;color:white;font:600 14px system-ui;cursor:pointer}.run:disabled{opacity:.6}
      #status{margin:8px 0;color:#69645b}.result h2{margin:18px 0 5px;font-size:15px}.result .card{margin:8px 0;padding:10px;border:1px solid #e1ddd5;border-radius:8px;background:white}.jp{font-size:17px;font-weight:650} ul{padding-left:19px} li{margin:6px 0}.reading{color:#69645b}
      @media(prefers-color-scheme:dark){.panel{background:#1d211f;color:#eeeae2;border-color:#444c47}header{background:#292f2b;border-color:#444c47}textarea,.result .card{background:#292e2b;color:#eeeae2;border-color:#444c47}}
    </style>
    <section class="panel"><header><h1>教えて · Oshiete</h1><button class="close" aria-label="Close">×</button></header>
      <main><textarea rows="3" placeholder="Paste Japanese text here…"></textarea><button class="run">Analyze grammar</button><p id="status" role="status"></p><div class="result"></div></main>
    </section>`;
  document.documentElement.appendChild(host);
  const textarea = shadow.querySelector("textarea");
  const run = shadow.querySelector(".run");
  const status = shadow.querySelector("#status");
  const result = shadow.querySelector(".result");
  shadow.querySelector(".close").addEventListener("click", () => host.remove());

  const addText = (parent, tag, text, className) => {
    const node = document.createElement(tag);
    node.textContent = text || "";
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  };
  function render(data) {
    result.replaceChildren();
    const intro = result.appendChild(document.createElement("article"));
    intro.className = "card";
    addText(intro, "div", data.original, "jp");
    addText(intro, "div", data.reading, "reading");
    addText(intro, "p", data.translation);
    if (data.grammarPoints?.length) {
      addText(result, "h2", "Grammar points");
      const list = result.appendChild(document.createElement("ul"));
      data.grammarPoints.forEach((item) => addText(list, "li", `${item.pattern} — ${item.meaning}${item.example ? ` (${item.example})` : ""}`));
    }
    if (data.pieces?.length) {
      addText(result, "h2", "How the sentence fits together");
      data.pieces.forEach((piece) => {
        const card = result.appendChild(document.createElement("article"));
        card.className = "card";
        addText(card, "strong", `${piece.text}${piece.reading ? ` (${piece.reading})` : ""} · ${piece.role}`);
        addText(card, "div", piece.explanation);
      });
    }
    if (data.pitfalls?.length) {
      addText(result, "h2", "Watch out");
      const list = result.appendChild(document.createElement("ul"));
      data.pitfalls.forEach((item) => addText(list, "li", item));
    }
  }

  run.addEventListener("click", async () => {
    const text = textarea.value.trim();
    if (!text) { status.textContent = "Paste Japanese text to analyze."; return; }
    run.disabled = true;
    status.textContent = "Analyzing…";
    result.replaceChildren();
    try {
      const response = await chrome.runtime.sendMessage({ type: "OSHIETE_ANALYZE", text });
      if (response?.error) throw new Error(response.error);
      render(response.data);
      status.textContent = "";
    } catch (error) { status.textContent = error.message; }
    finally { run.disabled = false; }
  });
})();
