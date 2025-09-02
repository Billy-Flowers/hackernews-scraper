const {chromium} = require("playwright");

function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(' '); // Extracts the Unix timestamp (second part after space)
  return parseInt(parts[1]) || 0;
}

// We validate articles based off both the timestamp and the unique article ID for stricter validation,
// since Hacker News uses IDs that generally increase with newer posts. Higher the ID, newer the post.

function validateOrder(prevArticle, currentArticle) {
  const prevTimestamp = parseTimestamp(prevArticle.timestamp);
  const currentTimestamp = parseTimestamp(currentArticle.timestamp);
  const prevId = parseInt(prevArticle.id, 10);
  const currentId = parseInt(currentArticle.id, 10);

  if (prevTimestamp < currentTimestamp) return false; // timestamps out of order
  if (prevTimestamp === currentTimestamp && prevId <= currentId) return false; // tie-breaker by ID
  return true;
}

// takes command line argument for the number of articles to validate
const articleCount = parseInt(process.argv.find(arg => arg.startsWith('--'))?.slice(2)) || 100;

async function sortHackerNewsArticles() {
  // launch chromium browser
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");
  await page.waitForSelector('.athing', {timeout: 10000});

  let results = [];
  let isDescending = true;

  // Collect until we have 100 items
  while (results.length < articleCount && isDescending) {

    // Grab all rows with class "athing" - athing is a CSS classname for every unique article on Hacker News frontend
    const rows = await page.locator("tr.athing").all();

    for (const row of rows) {
        const id = await row.getAttribute("id");
        const rank = await row.locator(".rank").textContent();
        const title = await row.locator(".titleline a").first().textContent();
        const link = await row.locator(".titleline a").first().getAttribute("href");

        const timestamp = await page.locator(`tr.athing[id="${id}"] + tr .age`).getAttribute("title");

        const article = {
          id,
          rank: rank ?.trim(),
          title: title ?.trim(),
          link,
          timestamp: timestamp
        };
        
        

        if (results.length > 0 && !validateOrder(results[results.length - 1], article)) {
          console.error(
            `Ordering Error: Article ${results.length} (ID: ${results[results.length - 1].id}) should come after Article ${results.length + 1} (ID: ${article.id})`
          );
          results.push(article);
          isDescending = false;
          break;
        }
        
        results.push(article);
        if (results.length >= articleCount) break;
    }

    // Click "More" to load next page (if needed)
    if (results.length < articleCount && isDescending) {
      await page.click("a.morelink");
      await page.waitForLoadState('networkidle');
    }
  }

  const passed = isDescending && results.length === articleCount;
  let status;
  if (passed) {
      status = `PASSED - All ${results.length} articles are sorted newest to oldest.`;
  } else if (!isDescending) {
      status = `FAILED - Articles are not properly sorted. \nOnly collected ${results.length} articles before stopping.`;
  } else {
      status = `INCOMPLETE - Only ${results.length} articles`;
  }

  console.log(`Validation ${status}`);

  // we can use the report to debug in case we get an error
  const report = { passed: isDescending && results.length === articleCount, totalArticles: results.length, articles: results };
  require('fs').writeFileSync('report.json', JSON.stringify(report, null, 2));
  console.log("Report saved to report.json");

  // Optional: Call browser.close() here to automatically shut down the browser after scraping. 
  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();