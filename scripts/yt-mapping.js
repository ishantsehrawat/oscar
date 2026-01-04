import puppeteer from "puppeteer";
import fs from "fs";

const URL =
  "https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded" });

  console.log("⏳ Waiting for tables to mount...");
  await page.waitForSelector("table", { timeout: 60000 });

  console.log("🧹 Scrolling to load all sections...");
  await page.evaluate(() => {
    let total = 0;
    const step = 500;

    const scroll = () => {
      window.scrollBy(0, step);
      total += step;
      if (total < document.body.scrollHeight) {
        setTimeout(scroll, 300);
      }
    };
    scroll();
  });

  await new Promise((r) => setTimeout(r, 4000));

  console.log("🔍 Extracting rows...");
  const data = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tr");
    const results = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 6) return;

      const titleEl = cells[1]?.querySelector("a");
      const ytEl = cells[4]?.querySelector("a[href*='youtu']");
      const lcEl = cells[5]?.querySelector("a[href*='leetcode']");

      if (!titleEl) return;

      results.push({
        title: titleEl.innerText.trim(),
        youtubeLink: ytEl ? ytEl.href : null,
        leetcodeLink: lcEl ? lcEl.href : null,
      });
    });

    return results;
  });

  console.log(`📊 Total questions: ${data.length}`);

  fs.writeFileSync("sde-sheet-yt-mapping.json", JSON.stringify(data, null, 2));

  await browser.close();
})();
