const { parseHTML } = require('./scraper.js');

// Example: Provide your HTML directly as a string
const html = ``;
var url = "";

const response = parseHTML(html, url);

console.log('Parsed Data:', response);