const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const { exec } = require("child_process");

puppeteer.use(StealthPlugin());

const eventPages = [
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
    "https://shoob.gg/card-events/chinese-new-year"
];

let eventCards = [];
const jsonFile = "event_cards.json";
if (fs.existsSync(jsonFile)) {
    eventCards = JSON.parse(fs.readFileSync(jsonFile));
}

async function scrapeEventCards() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36");

        for (let eventUrl of eventPages) {
            let currentPage = 1;
            while (true) {
                try {
                    let eventPageUrl = `${eventUrl}?page=${currentPage}`;
                    await page.goto(eventPageUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
                    console.log(`Scraping: ${eventPageUrl}`);

                    const cardLinks = await page.$$eval("a[href^='/cards/info/']", links => links.map(link => link.href));
                    if (cardLinks.length === 0) break;

                    for (let link of cardLinks) {
                        try {
                            await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });

                            const name = await page.$eval("h1", el => el.innerText.trim());
                            const image = await page.$eval("img[src*='/cards/']", img => img.src);
                            const description = await page.$eval("p", el => el.innerText.trim());
                            const tier = await page.$eval(".tier-label", el => el.innerText.trim());

                            eventCards.push({ name, image, description, tier });

                            fs.writeFileSync(jsonFile, JSON.stringify(eventCards, null, 2));
                            console.log(`Saved: ${name}`);
                        } catch (err) {
                            console.error(`Failed to scrape card: ${link}`);
                        }
                    }

                    currentPage++;
                } catch (err) {
                    console.error(`Failed to load event page: ${eventUrl}`);
                    break;
                }
            }
        }
    } catch (error) {
        console.error("Scraping failed:", error);
        console.log("Restarting script...");
        exec("pm2 restart scraper", (err, stdout, stderr) => {
            if (err) console.error("PM2 restart failed:", stderr);
        });
    } finally {
        if (browser) await browser.close();
    }
}

scrapeEventCards();
