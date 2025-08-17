// ====== QUOTES ARRAY ======
let quotes = [];

// ====== LOAD FROM LOCAL STORAGE ======
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    // default starter quotes
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Don’t let yesterday take up too much of today.", category: "Motivation" },
      { text: "Life is what happens when you're busy making other plans.", category: "Life" },
      { text: "Happiness depends upon ourselves.", category: "Philosophy" }
    ];
    saveQuotes();
  }
}

// ====== SAVE TO LOCAL STORAGE ======
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ====== UPDATE CATEGORY OPTIONS ======
function updateCategoryOptions() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ====== SHOW RANDOM QUOTE ======
function showRandomQuote() {
  const selectedCategory = categorySelect.value;
  const filteredQuotes = quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const chosenQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${chosenQuote.text}" — ${chosenQuote.category}`;

  // Save last viewed quote in session storage
  sessionStorage.setItem("lastQuote", JSON.stringify(chosenQuote));
}

// ====== CREATE ADD QUOTE FORM ======
function createAddQuoteForm() {
  const formDiv = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  formDiv.appendChild(quoteInput);
  formDiv.appendChild(categoryInput);
  formDiv.appendChild(addBtn);

  document.body.appendChild(formDiv);
}

// ====== ADD QUOTE ======
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  updateCategoryOptions();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  alert("Quote added successfully!");
}

// ====== EXPORT TO JSON FILE ======
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

// ====== IMPORT FROM JSON FILE ======
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        updateCategoryOptions();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid JSON format. Expected an array.');
      }
    } catch (err) {
      alert('Error reading JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ====== DOM REFERENCES ======
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.createElement("select");
document.body.insertBefore(categorySelect, quoteDisplay);

// ====== EVENT LISTENERS ======
newQuoteBtn.addEventListener("click", showRandomQuote);

// ====== EXTRA BUTTONS FOR IMPORT/EXPORT ======
const exportBtn = document.createElement("button");
exportBtn.textContent = "Export Quotes (JSON)";
exportBtn.addEventListener("click", exportToJsonFile);

const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".json";
importInput.addEventListener("change", importFromJsonFile);

document.body.appendChild(exportBtn);
document.body.appendChild(importInput);

// ====== INITIALIZE APP ======
loadQuotes();
updateCategoryOptions();
createAddQuoteForm();

// Restore last viewed quote from sessionStorage (optional)
const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const q = JSON.parse(lastQuote);
  quoteDisplay.textContent = `"${q.text}" — ${q.category}`;
}
