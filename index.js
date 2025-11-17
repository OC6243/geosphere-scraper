const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwpbXz4x4wKwMaNOPQXI7J49Pw9Sff6QakMqOQEkDhWKJFQEuu79JQLPef8ZsFeKGOSJw/exec";

// Funktion zum Abrufen und Parsen der Seite
async function scrapeInnsbruck() {
  try {
    const url = "https://www.geosphere.at/de/karten/aktuelles-wetter#tab=tablemode";
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Zeile mit Innsbruck Flughafen finden
    const row = $('tr:contains("INNSBRUCK-FLUGHAFEN(AUTOMAT)")');

    const temp = parseFloat(row.find("td").eq(2).text().replace(",", "."));
    const hum = parseFloat(row.find("td").eq(3).text().replace(",", "."));
    const pressAbs = parseFloat(row.find("td").eq(4).text().replace(",", "."));

    const now = new Date();
    const date = now.toLocaleDateString("de-DE");
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    // an Google Sheets senden
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time, temp, hum, pressAbs })
    });

    console.log("Live-Daten erfolgreich gesendet:", date, time, temp, hum, pressAbs);
    return true;

  } catch (err) {
    console.error("Scraping-Fehler:", err);
    return false;
  }
}

// Abruf alle 60 Sekunden
setInterval(scrapeInnsbruck, 60 * 1000);

// Webstatus
app.get("/", (req, res) => res.send("Scraper läuft"));
app.listen(3000, () => console.log("Server gestartet"));
