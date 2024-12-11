// Import the polyfill for ReadableStream
require('web-streams-polyfill');

// Now import and cheerio
const cheerio = require('cheerio');

/**
 * Compact HTML function to minimize whitespace.
 *
 * @param {string} html - The HTML string to be compacted.
 * @returns {string} - The compacted HTML string.
 */
function compactHTML(html) {
  return html.replace(/\s+/g, ' ').trim();
}

/**
 * Cleans up repeated brand names by removing redundant occurrences
 * @param {string} brand - The raw brand name text to be cleaned
 * @returns {string} - The cleaned brand name
 */
function cleanBrand(brand) {
  return brand
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .trim()                // Trim leading and trailing spaces
    .replace(/(.+)\s+\1/, '$1'); // Remove duplicated brand names
}

/**
 * Extract the first value from a list of selectors.
 *
 * @param {Object} $ - The Cheerio instance.
 * @param {Array<string>} selectors - The list of CSS selectors to search for.
 * @param {string} [attribute='content'] - The attribute to retrieve (default is 'content').
 * @returns {string|null} - The first matched value, or null if no match.
 */
function extractFirst($, selectors, attribute = 'content') {
  // Ensure selectors is always an array
  selectors = Array.isArray(selectors) ? selectors : [selectors];

  for (const selector of selectors) {
    const element = $(selector);
    if (element && element.length > 0) {
      // Check if the attribute exists
      const value = element.attr(attribute);

      // If the attribute is undefined or null, fall back to text()
      if (value !== undefined && value !== null) {
        return value.trim();
      } else {
        // If the attribute doesn't exist, use text()
        const textValue = element.text().trim();
        // if (textValue) return textValue;
        if (textValue) {
          // Clean up unwanted parts of the text (e.g., "Sale price")
          return textValue.replace(/(Sale price|Price:|Price\s*\w+|Limited Time Offer)/gi, '').trim();
        }
      }
    }
  }
  return null;
}

/**
 * Extract the first numeric value and its currency symbol from the entire HTML.
 *
 * @param {Object} $ - The Cheerio instance.
 * @param {string} html - The HTML string to parse.
 * @returns {Object|null} - An object with `currency` and `amount` if found, or null if no match.
 */
function extractPriceFromHTML($, html) {
  const tags = ['h2', 'p', 'span']; // Tags to check for currency symbols and price information
  const regex = /([A-Za-z₱$£¥₣₤₹]{1,3})\s?(\d{1,3}(?:,\d{3})*(?:[\.,]\d{2})?)/; // Regex for price information
  const matches = [];

  // Iterate through specified tags
  $(tags.join(',')).each((index, element) => {
    const text = $(element).text().trim().replace(/\u00A0/g, ' '); // Handle non-breaking spaces

    // Validate the text as a potential price
    if (text && isValidPriceText(text)) {
      const match = regex.exec(text);

      if (match) {
        let currency = match[1] || ''; // Extract currency
        currency = mapDollarCurrency(currency); // Map currency if needed

        // Add valid matches to the results
        matches.push({
          currency: currency,
          amount: parseFloat(match[2].replace(/,/g, '').replace('.', '.')), // Remove thousands separator
          tag: element.tagName.toLowerCase(),
          html: $(element).html().trim(),
        });
      }
    }
  });

  // Sort matches based on tag order
  matches.sort((a, b) => tags.indexOf(a.tag) - tags.indexOf(b.tag));

  // Return the first valid match or null
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Helper function to map dollar signs to their corresponding currency.
 *
 * @param {string} symbol - The currency symbol to map.
 * @returns {string} - The mapped currency or the original symbol if unrecognized.
 */
function mapDollarCurrency(symbol) {
  switch (symbol) {
    case 'A$': return 'AUD'; // Australian Dollar
    case 'C$': return 'CAD'; // Canadian Dollar
    case 'S$': return 'SGD'; // Singapore Dollar
    case '$': return 'USD';  // US Dollar (default for $)
    default: return symbol;  // Return as-is if unrecognized
  }
}

/**
 * Function to check if the text is highly likely to represent a price.
 *
 * @param {string} text - The text to validate.
 * @returns {boolean} - True if the text is valid, otherwise false.
 */
function isValidPriceText(text) {
  // Ensure text contains only currency symbols and properly formatted numbers
  const refinedRegex = /^\s*([A-Za-z₱$£¥₣₤₹]{1,3})?\s?\d{1,}(?:,\d{3})*(?:\.\d{1,2})?\s*$/;
  return refinedRegex.test(text);
}

/**
 * Extract the brand information from the HTML.
 * The function looks for the brand in the following order of priority:
 *
 * @param {CheerioAPI} $ - The Cheerio instance to parse the HTML.
 * @returns {string|null} - The extracted brand name, or null if no brand is found.
 */
function extractBrand($) {
  const jsonLd = $('script[type="application/ld+json"]').html();

  if (jsonLd) {
    try {
      // Clean the JSON-LD string by trimming leading/trailing whitespace
      let cleanedJsonLd = jsonLd.trim();

      // TODO: escaping should be to all fields
      // smallable site
      // Properly escape the quotes in the description field
      // cleanedJsonLd = cleanedJsonLd.replace(
      //   /"description":\s*"([^"]*?)\"([^"]*?)\"([^"]*?)"/g,
      //   (match, p1, p2, p3) => `"description": "${p1}\\"${p2}\\"${p3}"`
      // );

      // Parse the cleaned and corrected JSON-LD
      const jsonData = JSON.parse(cleanedJsonLd);

      if (jsonData['@type'] === 'Product' && jsonData.brand && jsonData.brand.name) {
        return jsonData.brand.name.trim();
      }
    } catch (error) {
      console.error('Error parsing JSON-LD:', error);
    }
  }

  // If nothing is found
  return null;
}

// Function to map currency symbols to their corresponding currency codes
function currencyMap(symbol) {
  const map = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR',
    '₣': 'FRF', // French Franc (historical)
    '₤': 'ITL', // Italian Lira (historical)
    '₽': 'RUB', // Russian Ruble
    'kr': 'SEK', // Swedish Krona
    'Fr': 'CHF', // Swiss Franc
    'A$': 'AUD', // Australian Dollar
    'B$': 'BND', // Brunei Dollar
    'R$': 'BRL', // Brazilian Real
    '₣': 'XOF', // CFA Franc (West Africa)
    'د.إ': 'AED', // United Arab Emirates Dirham
    'KSh': 'KES', // Kenyan Shilling
    '₱': 'PHP', // Philippine Peso
    'RM': 'MYR', // Malaysian Ringgit
    '₣': 'XAF', // Central African CFA Franc
    '฿': 'THB', // Thai Baht
    '₴': 'UAH', // Ukrainian Hryvnia
    'R': 'ZAR', // South African Rand
    // '$': 'SGD', // Singapore Dollar // TODO: Isse with USD dollar sign
    'Rp': 'IDR', // Indonesian Rupiah
    'د.ك': 'KWD', // Kuwaiti Dinar
    '﷼': 'SAR', // Saudi Riyal
    '﷼': 'OMR', // Omani Rial
    'QAR': 'QAR', // Qatari Riyal
    'Bdt': 'BDT', // Bangladeshi Taka
    'Ft': 'HUF', // Hungarian Forint
    '₪': 'ILS', // Israeli New Shekel
    '₡': 'CRC', // Costa Rican Colón
    'Gs': 'PYG', // Paraguayan Guarani
    'TSh': 'TZS', // Tanzanian Shilling
    '₴': 'UAH', // Ukrainian Hryvnia
    'Kc': 'CZK', // Czech Koruna
    'د.ب': 'BHD' // Bahraini Dinar
  };

  return map[symbol] || symbol; // Return the symbol itself if it's not found in the map
}

/**
 * Parse the HTML and extract product details such as title, brand, price, currency, and images.
 *
 * @param {string} html - The HTML string to parse.
 * @param {string} urlString - The URL of the webpage (used to identify the website).
 * @returns {Object} - An object containing parsed product details.
 */
function parseHTML(html, urlString = '') {
  // TODO: sanitize the HTML before using DOM purify
  const compactedHTML = compactHTML(html);
  const $ = cheerio.load(compactedHTML);

  // Define website-specific selectors
  const selectors = {
    amazon: {
      title: ['#productTitle'],
      description: ['#productDescription', '.a-section .a-size-base'],
      brand: ['.po-brand span.a-size-base.po-break-word'],
      price: ['#tp_price_block_total_price_ww span.a-offscreen'],
      currency: ['#price_block_currency_symbol_ww'],
      images: ['#imgTagWrapperId img'],
    },
    smallable: {
      title: ['#productTitle'],
      description: ['#description-attr-0 li'],
      brand: ['.po-brand span.a-size-base.po-break-word'],
      price: ['.PriceLine_price__g_kMA'],
      currency: ['.PriceLine_price__g_kMA'],
      images: [],
    },
    common: {
      title: [
        'meta[property="og:title"]',
        'h1',
        'title',
      ],
      description: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        'p.product-description',
        // TODO: adjust the description
      ],
      brand: [
        'meta[property="og:brand"]',
        'meta[name="brand"]',
        'meta[itemprop="brand"]',
        '[itemprop="brand"]',
        '.manufacturer',
        '.brand',
        '.brand-name',
        '.brand-class',
        '.product-brand-name',
        '.product-brand',
      ],
      price: [
        'meta[property="og:price:amount"]',
        '[itemprop="price"]',
        '.price'
      ],
      currency: [
        'meta[property="og:price:currency"]',
        '[itemprop="priceCurrency"]'
      ],
      images: [
        'meta[property="og:image"]',
        '[itemprop="image"]',
        'img.main-image',
        // 'img[src]',
        // 'img[data-src]',
        // 'img[data-lazy]',
      ],
    },
  };

  // Extract domain from URL if provided, otherwise default to 'common' selectors
  let websiteSelectors = selectors.common;

  if (urlString) {
    const domain = new URL(urlString).hostname.replace(/^www\./, '');
    const domainToWebsite = {
      'amazon.com': 'amazon',
      'smallable.com': 'smallable',
      // Add other domain mappings as needed
    };

    const website = domainToWebsite[domain] || 'common';
    websiteSelectors = selectors[website] || selectors.common;
  }

  // Extract title, brand, and images using selectors
  const title = extractFirst($, websiteSelectors.title) || extractFirst($, selectors.common.title);
  const description = extractFirst($, websiteSelectors.description) || extractFirst($, selectors.common.description);

  let brand = extractFirst($, websiteSelectors.brand) || extractFirst($, selectors.common.brand) || extractBrand($);

  if (brand) {
    brand = cleanBrand(brand);
  }

  // Extract price and split currency
  const priceText = extractFirst($, websiteSelectors.price) || extractFirst($, selectors.common.price);
  let price = null;
  let currency = null;

  if (priceText) {
    // Try matching currency and price (e.g., "€15500" or "15500€")
    const match = priceText.match(/([^\d]+)?([\d.,]+)([^\d]+)?/);  // Match both parts

    if (match) {
      currency = match[1]?.trim() || match[3]?.trim(); // Extract currency symbol (e.g., "€", "$")
      price = parseFloat(match[2].replace(/,/g, '')); // Extract numeric price
    }
  }

  // If no price or currency found from selectors, check entire HTML
  if (!price && !currency) {
    const priceDetails = extractPriceFromHTML($, compactedHTML);
    if (priceDetails) {
      price = priceDetails.amount;
      currency = priceDetails.currency;
    }
  }

  // If no currency is found, check the currency-specific selectors
  if (!currency) {
    currency = extractFirst($, websiteSelectors.currency) || extractFirst($, selectors.common.currency);
  }

  // Remove 'undefined' from currency or price if it exists
  if (currency && currency.includes('undefined')) {
    currency = currency.replace(/undefined/g, '').trim();
  }

  if (price && price.toString().includes('undefined')) {
    price = price.toString().replace(/undefined/g, '').trim();
  }

  // Ensure price is decimal with two digits
  if (price !== null) {
    price = price.toFixed(2);  // Ensure price has two decimal places
  }

  currency = currencyMap(currency);

  const images = $(websiteSelectors.images.concat(selectors.common.images).join(','))
    .map((_, el) => $(el).attr('content') || $(el).attr('src'))
    .get()
    .filter(Boolean);

  return {
    title,
    description,
    brand,
    price,
    currency,
    images,
  };
}

module.exports = { parseHTML };