[![version](https://img.shields.io/npm/v/google-timezones-json.svg)]()
[![downloads](https://img.shields.io/npm/dm/google-timezones-json.svg)]()

# Node.js Web Scraper Parser

A Node.js-based web scraper parser that extracts product details from e-commerce websites using Cheerio for HTML parsing. The scraper handles various product information such as title, brand, price, currency, and images. It supports different websites and allows easy extension to handle more sites.

## Features

- Compact HTML function to minimize whitespace.
- Extract product details (title, description, brand, price, currency, images).
- Customizable selectors for different websites (e.g., Amazon, eBay, Smallable).
- Price extraction with currency symbol handling.
- Multiple image URL extraction methods.
- Supports various websites with predefined selectors.

## Installation

To install the required dependencies for this project, run the following command:

```bash
npm install
Required Dependencies:
cheerio: For parsing and manipulating HTML.
web-streams-polyfill: Polyfill for ReadableStream support.

Usage
To parse the HTML of a webpage and extract product details:

const html = '...'; // HTML content of the page
const url = 'https://www.example.com/product-page';

const data = parseHTML(html, url);

Functions
compactHTML(html)
Minimizes whitespace in the provided HTML string.

Parameters:

html (string): The HTML string to be compacted.
Returns:

(string): The compacted HTML string.
extractFirst($, selectors, attribute = 'content')
Extracts the first value from a list of CSS selectors.

Parameters:

$ (cheerio instance): The Cheerio instance to use for querying.
selectors (array|string): List of CSS selectors or a single selector.
attribute (string, optional): The attribute to retrieve (default is 'content').
Returns:

(string|null): The first matched value, or null if no match is found.
extractPriceFromHTML($, html)
Extracts the first numeric value and its currency symbol from the entire HTML content.

Parameters:

$ (cheerio instance): The Cheerio instance to use for querying.
html (string): The HTML string to parse.
Returns:

(Object|null): An object containing currency and amount, or null if no match is found.
parseHTML(html, urlString)
Parses the HTML content and extracts product details such as title, brand, price, currency, and images.

Parameters:

html (string): The HTML content to parse.
urlString (string): The URL of the webpage.
Returns:

(Object): An object containing parsed product details (title, description, brand, price, currency, images).
Author
This project is maintained by Richard Galolo.

License
This project is licensed under the MIT License..