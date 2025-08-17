/********************
 * Storage & State
 ********************/
const LS_QUOTES_KEY = "quotes";
const LS_LAST_CATEGORY = "lastCategory";
const LS_MANUAL_RESOLVE = "manualResolve";
const SS_LAST_QUOTE = "lastQuote";

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API

let quotes = [];
let currentFiltered = [];

/********************
 * Utilities
 ********************/
function uid() {
  return "q_" + Math.random().toString(36).slice(2, 10);
}

function nowIso() { return new Date().toISOString(); }

function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const raw = localStorage.getItem(LS_QUOTES_KEY);
  if (raw) {
    try { quotes = JSON.parse(raw); }
    catch { quotes = []; }
  }
  if (!Array.isArray(quotes) || quotes.length === 0) {
    quotes = [
      { id: uid(), text: "The best way to predict the future is to invent it.", category: "Inspiration", synced: true, updatedAt: nowIso() },
      { id: uid(), text: "Do what you can, with what you have, where you are.", category: "Motivation", synced: true, updatedAt: nowIso() },
      { id: uid(), text: "Success is not the key to happiness. Happiness is the key to success.", category: "Happiness", synced: true, updatedAt: nowIso() },
      { id: uid(), text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming", synced: true, updatedAt: nowIso() }
    ];
    saveQuotes();
  }
}

/********************
 * DOM refs
 ********************/
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportQuotes");
const importInput = document.getElementById("importQuotes");
const syncBtn = document.getElementById("syncNow");
const syncStatus = document.getElementById("syncStatus");
const manualResolveToggle = document.getElementById("manualResolveToggle");
const addQuoteContainer = document.getElementById("addQuoteContainer");

/********************
 * Categories & Filtering
 ********************/
function populateCategories() {
  // reset (keep the "all" option)
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))].sort();
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  }

  const last = localStorage.getItem(LS_LAST_CATEGORY) || "all";
  categoryFilter.value = last;
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LS_LAST_CATEGORY, selected);

  if (selected === "all") {
    currentFiltered = quotes.slice();
  } else {
    currentFiltered = quotes.filter(q => q.category === selected);
  }

  showRandomQuote();
}

function showRandomQuote() {
  if (!currentFiltered.length) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }
  const idx = Math.floor(Math.random() * currentFiltered.length);
  const q = currentFiltered[idx];
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
  sessionStorage.setItem(SS_LAST_QUOTE, JSON.stringify(q));
}

/********************
 * Add Quote UI & Logic
 ********************/
function createAddQuoteForm() {
  addQuoteContainer.innerHTML = "";

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const catInput = document.createElement("input");
  catInput.id = "newQuoteCategory";
  catInput.type = "text";
  catInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  addQuoteContainer.append(textInput, catInput, addBtn);
}

function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  const text = (textEl?.value || "").trim();
  const category = (catEl?.value || "").trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ id: uid(), text, category, synced: false, updatedAt: nowIso() });
  saveQuotes();
  populateCategories();
  filterQuotes();

  textEl.value = "";
  catEl.value = "";
  showStatus("Quote added locally. Will be synced to server.", "info");
}

/********************
 * Import / Export (JSON)
 ********************/
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) { alert("Invalid JSON (must be an array)."); return; }

      // Normalize imported objects
      const normalized = imported.map(q => ({
        id: q.id || uid(),
        text: q.text || String(q),
        category: q.category || "Imported",
        synced: false,
        updatedAt: nowIso(),
        serverId: q.serverId ?? undefined
      }));

      quotes.push(...normalized);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported successfully!");
      showStatus(`Imported ${normalized.length} quotes.`, "success");
    } catch {
      alert("Error reading file.");
    }
  };
  reader.readAsText(file);
}

/********************
 * Server Sync (JSONPlaceholder)
 * - push local unsynced quotes (simulate POST)
 * - pull server quotes (simulate GET)
 * - merge with conflict policy (server-wins by default)
 ********************/
async function pushLocalUnsynced() {
  const unsynced = quotes.filter(q => !q.synced && !q.serverId);
  let pushed = 0;

  for (const q of unsynced) {
    try {
      const res = await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: q.text, body: q.category })
      });
      const data = await res.json(); // JSONPlaceholder echoes with id=101+
      q.serverId = data.id;
      q.synced = true;
      q.updatedAt = nowIso();
      pushed++;
    } catch {
      // leave as unsynced; will retry next sync
    }
  }

  if (pushed) saveQuotes();
  return pushed;
}

async function fetchFromServer() {
  const res = await fetch(SERVER_URL);
  const posts = await res.json();

  // Map posts to our quote structure (category derived from userId)
  const serverQuotes = posts.slice(0, 40).map(p => ({
    id: `server-${p.id}`,
    serverId: p.id,
    text: p.title,
    category: `User-${p.userId}`,
    synced: true,
    updatedAt: nowIso()
  }));

  return serverQuotes;
}

function mergeServerData(serverQuotes) {
  const manual = localStorage.getItem(LS_MANUAL_RESOLVE) === "true";
  let added = 0, updated = 0, conflicts = 0;

  const byServerId = new Map(quotes.filter(q => q.serverId).map(q => [q.serverId, q]));

  for (const s of serverQuotes) {
    const local = byServerId.get(s.serverId);
    if (!local) {
      quotes.push(s);
      added++;
      continue;
    }

    // Check differences
    if (local.text !== s.text || local.category !== s.category) {
      conflicts++;
      if (manual) {
        const keepLocal = confirm(
          `Conflict on #${s.serverId}:\n` +
          `Server: "${s.text}" [${s.category}]\n` +
          `Local:  "${local.text}" [${local.category}]\n\n` +
          `Click "OK" to KEEP LOCAL, "Cancel" for SERVER version.`
        );
        if (!keepLocal) {
          local.text = s.text;
          local.category = s.category;
        }
      } else {
        // Server-wins policy (default)
        local.text = s.text;
        local.category = s.category;
      }
      local.synced = true;
      local.updatedAt = nowIso();
      updated++;
    } else if (!local.synced) {
      local.synced = true;
      local.updatedAt = nowIso();
      updated++;
    }
  }

  if (added || updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
  }

  return { added, updated, conflicts };
}

async function syncWithServer() {
  showStatus("Syncing…", "info");
  try {
    const pushed = await pushLocalUnsynced();
    const serverQuotes = await fetchFromServer();
    const { added, updated, conflicts } = mergeServerData(serverQuotes);
    showStatus(`Sync complete. Pushed: ${pushed}, Pulled: ${added}, Updated: ${updated}, Conflicts: ${conflicts}.`, "success");
  } catch (e) {
    showStatus("Sync failed. Check your connection and try again.", "error");
  }
}

/********************
 * Status UI
 ********************/
function showStatus(message, type = "info") {
  const prefix = { info: "ℹ️", success: "✅", error: "❌" }[type] || "ℹ️";
  syncStatus.textContent = `${prefix} ${message}`;
}

/********************
 * Event wiring & Init
 ********************/
function init() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();
  filterQuotes();

  // Restore last viewed quote (session)
  const last = sessionStorage.getItem(SS_LAST_QUOTE);
  if (last) {
    try {
      const q = JSON.parse(last);
      quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
    } catch { /* ignore */ }
  }

  // Buttons / Inputs
  newQuoteBtn.addEventListener("click", showRandomQuote);
  exportBtn.addEventListener("click", exportToJsonFile);
  importInput.addEventListener("change", importFromJson);
  syncBtn.addEventListener("click", syncWithServer);

  // Manual resolve toggle
  const manual = localStorage.getItem(LS_MANUAL_RESOLVE) === "true";
  manualResolveToggle.checked = manual;
  manualResolveToggle.addEventListener("change", (e) => {
    localStorage.setItem(LS_MANUAL_RESOLVE, e.target.checked ? "true" : "false");
    showStatus(`Manual conflict resolution ${e.target.checked ? "enabled" : "disabled"}.`, "info");
  });

  // Periodic sync (every 60s)
  setInterval(syncWithServer, 60000);
  showStatus("Ready. Auto-sync every 60s. Click “Sync Now” to sync immediately.", "info");
}

init();
