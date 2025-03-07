const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const eventLinks = [
    "https://shoob.gg/card-events/olympics",
    "https://shoob.gg/card-events/sworn",
    "https://shoob.gg/card-events/gala",
    "https://shoob.gg/card-events/summer",
    "https://shoob.gg/card-events/maid-day",
    "https://shoob.gg/card-events/my-hero-academia-ccg",
    "https://shoob.gg/card-events/easter",
    "https://shoob.gg/card-events/christmas",
    "https://shoob.gg/card-events/halloween",
    "https://shoob.gg/card-events/valentines-day",
    "https://shoob.gg/card-events/chinese-new-year",
];

const outputFile = path.join(__dirname, "event_cards.json");

let scrapedData = [];
if (fs.existsSync(outputFile)) {
    scrapedData = JSON.parse(fs.readFileSync(outputFile));
}

async function scrapeEventCards(url, browser) {
    let page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let hasNextPage = true;
    let pageNum = 1;

    while (hasNextPage) {
        console.log(`Scraping page ${pageNum} of ${url}`);

        let cards = await page.evaluate(() => {
            return [...document.querySelectorAll(".card")].map((card) => ({
                name: card.querySelector(".card-name")?.innerText.trim() || "N/A",
                image: card.querySelector(".card-image img")?.src || "N/A",
                description: card.querySelector(".card-description")?.innerText.trim() || "N/A",
                tier: card.querySelector(".card-tier")?.innerText.trim() || "N/A",
            }));
        });

        scrapedData.push(...cards);
        fs.writeFileSync(outputFile, JSON.stringify(scrapedData, null, 2));

        const nextButton = await page.$(".pagination-next");
        if (nextButton) {
            await nextButton.click();
            await page.waitForNavigation({ waitUntil: "domcontentloaded" });
            pageNum++;
        } else {
            hasNextPage = false;
        }
    }

    await page.close();
}

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: "/usr/bin/chromium-browser",
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        for (const eventLink of eventLinks) {
            await scrapeEventCards(eventLink, browser);
        }

        await browser.close();
        console.log("Scraping completed.");
    } catch (error) {
        console.error("Scraping failed:", error);
        console.log("Restarting scraper...");
        exec("pm2 restart scraper");
    }
})();
