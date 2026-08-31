const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'public/data/adhkar.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

function cleanText(str) {
  if (!str) return '';
  // 1. Replace literal escaped newlines '\\n' with actual newlines '\n'
  let temp = str.replace(/\\n/g, '\n');
  
  // 2. Split by python list string separators: quote-comma-quote
  let parts = temp.split(/['"]\s*,\s*['"]/);
  
  // 3. Clean each part and filter out empty ones
  let cleanedParts = parts.map(part => {
    let p = part.trim();
    // Remove leading/trailing quotes, commas, and spaces
    p = p.replace(/^['"\s,]+|['"\s,]+$/g, '');
    return p.trim();
  }).filter(part => {
    // Only keep parts that contain actual Arabic letters or word characters
    return part && /[\u0600-\u06FF\w]/.test(part);
  });
  
  // 4. Join the cleaned parts with newlines
  return cleanedParts.join('\n');
}

const cleanedData = {};

for (const [category, items] of Object.entries(rawData)) {
  cleanedData[category] = items.map(item => {
    const cleanedContent = cleanText(item.content);
    // Also clean the reference field if it has python list junk
    let cleanedReference = cleanText(item.reference);
    if (!cleanedReference && item.reference) {
      // If it got filtered out but had a value, just clean basic quotes
      cleanedReference = item.reference.replace(/^['"\s,.\\]+|['"\s,.\\]+$/g, '').trim();
    }
    
    return {
      ...item,
      content: cleanedContent,
      reference: cleanedReference
    };
  });
}

fs.writeFileSync(jsonPath, JSON.stringify(cleanedData, null, 3), 'utf8');
console.log('Successfully cleaned adhkar.json!');
