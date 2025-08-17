// Load quotes from localStorage or use defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  "The best way to predict the future is to invent it.",
  "Do what you can, with what you have, where you are.",
  "Success is not the key to happiness. Happiness is the key to success."
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show a random quote
document.getElementById("newQuote").addEventListener("click", () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  document.getElementById("quoteDisplay").textContent = quotes[randomIndex];
  sessionStorage.setItem("lastQuote", quotes[randomIndex]); // session storage demo
});

// Restore last viewed quote from sessionStorage
window.onload = () => {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    document.getElementById("quoteDisplay").textContent = lastQuote;
  }
};

// ✅ Export quotes as JSON file
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

// ✅ Import quotes from JSON file
function importFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes = importedQuotes;
        saveQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch (err) {
      alert("Error reading file.");
    }
  };
  reader.readAsText(file);
}

// Attach event listeners for import/export
document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);
document.getElementById("importQuotes").addEventListener("change", importFromJson);
