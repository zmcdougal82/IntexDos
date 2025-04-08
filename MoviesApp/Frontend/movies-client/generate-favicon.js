const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a 32x32 favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Set background color (blue like our primary color)
ctx.fillStyle = '#1e3a8a';
ctx.fillRect(0, 0, 32, 32);

// Add a letter 'C' in the center
ctx.fillStyle = '#f97316'; // Orange
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('C', 16, 16);

// Add a small film strip design
ctx.fillStyle = 'white';
ctx.fillRect(3, 3, 2, 2);
ctx.fillRect(7, 3, 2, 2);
ctx.fillRect(11, 3, 2, 2);
ctx.fillRect(3, 27, 2, 2);
ctx.fillRect(7, 27, 2, 2);
ctx.fillRect(11, 27, 2, 2);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./public/favicon.png', buffer);

console.log('Favicon created successfully!');
