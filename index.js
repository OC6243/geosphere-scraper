const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");

const app = express();
app.use(express.json());

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwpbXz4x4wKwMaNOPQXI7J49Pw9Sff6QakMqOQEkDhWKJFQEuu79JQLPef8ZsFeKGOSJw/exec";

async function scrapeInnsbruck() {
  try {
    const url = "https://www.geosphere.at/de/karten/aktuelles-wetter#tab=tablemode";
    const response = await axios.get(url, { responseType: "text" });
    const html = response.data;
    const $ = cheerio.load(html);

    const row = $('tr:contains("INNSBRUCK-FLUGHAFEN(AUTOMAT)")');
    const temp = parseFloat(row.find("td").eq(2).text().replace(",", "."));
    const hum = parseFloat(row.find("td").eq(3).text().replace(",", "."));
    const pressAbs = parseFloat(row.find("td").eq(4).text().replace(",", "."));

    const now = new Date();
    const date = now.toLocaleDateString("de-DE");
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    await axios.post(WEBHOOK_URL, { date, time, temp, hum, pressAbs });

    console.log("Live-Daten gesendet:", date, time, temp, hum, pressAbs);
  } catch (err) {
    console.error("Scraping Fehler:", err.message);
  }
}

setInterval(scrapeInnsbruck, 60 * 1000);

app.get("/", (req, res) => res.send("Scraper läuft"));
app.listen(3000, () => console.log("Server läuft auf Port 3000"));
