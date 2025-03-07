const puppeteer = require('puppeteer');
const fs = require('fs');
const pm2 = require('pm2');

const eventUrls = [
  'https://shoob.gg/card-events/summer',
  'https://shoob.gg/card-events/maid-day',
  'https://shoob.gg/card-events/my-hero-academia-ccg',
  'https://shoob.gg/card-events/easter',
  'https://shoob.gg/card-events/christmas',
  'https://shoob.gg/card-events/halloween',
  'https://shoob.gg/card-events/valentines-day',
  'https://shoob.gg/card-events/chinese-new-year',
  'https://shoob.gg/card-events/olympics',
  'https://shoob.gg/card-events/sworn',
  'https://shoob.gg/card-events/gala'
];

const scrapeEvent = async (url) => {
  console.log(`Scraping event: ${url}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/snap/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  let allCards = [];

  const getCardsFromPage = async () => {
    const cards = await page.evaluate(() => {
      const cardElements = document.querySelectorAll('.card-item'); // Adjust selector as needed
      const cardData = [];

      cardElements.forEach(card => {
        const name = card.querySelector('.card-name')?.textContent.trim();
        const tier = card.querySelector('.card-tier')?.textContent.trim();
        const imageUrl = card.querySelector('.card-image img')?.src;
        const description = card.querySelector('.card-description')?.textContent.trim();

        if (name && tier && imageUrl && description) {
          cardData.push({ name, tier, imageUrl, description });
        }
      });

      return cardData;
    });

    return cards;
  };

  // Scrape all pages
  while (true) {
    const cards = await getCardsFromPage();
    allCards = allCards.concat(cards);

    // Check if there is a next page
    const nextButton = await page.$('.pagination-next'); // Adjust selector as needed
    if (!nextButton) {
      break; // No more pages
    }

    // Click next page
    await nextButton.click();
    await page.waitForTimeout(2000); // Wait for the next page to load
  }

  // Save the data to a file
  const fileName = `eventData_${url.split('/').pop()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(allCards, null, 2));

  console.log(`Finished scraping event: ${url}`);
  await browser.close();
};

const scrapeAllEvents = async () => {
  for (let i = 0; i < eventUrls.length; i++) {
    try {
      await scrapeEvent(eventUrls[i]);
    } catch (error) {
      console.error(`Error scraping events: ${error.message}`);
      // Restart scraper.js using PM2 if an error occurs
      pm2.restart('scraper.js', (err) => {
        if (err) {
          console.error('PM2 restart failed:', err);
        }
      });
    }
  }
};

scrapeAllEvents();
