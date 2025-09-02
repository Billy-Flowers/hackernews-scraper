# Hacker News Scraper & Validator

A Node.js project that uses [Playwright](https://playwright.dev/) to scrape **Hacker News articles** and validate if they are sorted **newest to oldest**.

## Features

* Scrapes Hacker News `/newest` page.
* Collects a configurable number of articles (default: **100**).
* Extracts metadata:

  * ID
  * Rank
  * Title
  * Link
  * Timestamp
* Validates chronological order (ensures newest → oldest).
* Outputs results with clear **validation status**.

## Tech Stack

* **Node.js**
* **Playwright** (Chromium browser automation)

## Installation

```bash
# Clone repo
git clone https://github.com/Billy-Flowers/hackernews-scraper
cd hackernews-scraper

# Install dependencies
npm install
```

## Usage

Run the scraper:

```bash
node index.js
```

Optional arguments:

```bash
node index.js --50   # scrape first 50 articles
node index.js --200  # scrape first 200 articles
```

## Example Output

```
Validation Passed: All 100 articles are sorted newest to oldest.
```

Or if out of order:

```
Validation Failed: Articles are not properly sorted.
Only collected 87 articles before stopping.
```