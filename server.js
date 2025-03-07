const puppeteer = require('puppeteer');
const fs = require('fs');

async function fetchCardDetailsFromPage(page) {
    return await page.evaluate(() => {
        const cards = [];
        const cardElements = document.querySelectorAll('.card-item'); // Adjust the selector based on the website's structure

        cardElements.forEach((card) => {
            const name = card.querySelector('.card-name') ? card.querySelector('.card-name').innerText : null;
            const tier = card.querySelector('.card-tier') ? card.querySelector('.card-tier').innerText : null;
            const imageUrl = card.querySelector('.card-image img') ? card.querySelector('.card-image img').src : null;
            const description = card.querySelector('.card-description') ? card.querySelector('.card-description').innerText : null;
            
            cards.push({ name, tier, imageUrl, description });
        });

        return cards;
    });
}

async function scrapeEventCards(eventUrl) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let allCardDetails = [];

    // Loop through all pages for a specific event
    let pageNum = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        await page.goto(`${eventUrl}?page=${pageNum}`);
        
        // Wait for the page to load completely
        await page.waitForSelector('.card-item');

        const cardDetails = await fetchCardDetailsFromPage(page);
        allCardDetails = [...allCardDetails, ...cardDetails];

        // Check if there is a next page button
        const nextPageButton = await page.$('.pagination .next');
        if (nextPageButton) {
            pageNum++;
        } else {
            hasMorePages = false;
        }
    }

    await browser.close();
    
    return allCardDetails;
}

async function scrapeAllEvents(eventUrls) {
    for (let eventUrl of eventUrls) {
        console.log(`Scraping event: ${eventUrl}`);
        const cardDetails = await scrapeEventCards(eventUrl);
        const eventName = eventUrl.split('/').pop();
        
        // Save the card details in a JSON file
        fs.writeFileSync(`./${eventName}_cards.json`, JSON.stringify(cardDetails, null, 2));
        console.log(`Finished scraping event: ${eventUrl}`);
    }
}

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
    'https://shoob.gg/card-events/gala',
    'https://shoob.gg/card-events/maid-day',
    'https://shoob.gg/card-events/my-hero-academia-ccg',
    'https://shoob.gg/card-events/easter',
    'https://shoob.gg/card-events/christmas',
    'https://shoob.gg/card-events/halloween',
    'https://shoob.gg/card-events/valentines-day',
    'https://shoob.gg/card-events/chinese-new-year'
];

scrapeAllEvents(eventUrls)
    .then(() => console.log('All events scraped successfully'))
    .catch(err => console.error('Error scraping events:', err));
