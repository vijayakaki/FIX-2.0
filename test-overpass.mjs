// Test Overpass API
const query = `[out:json][timeout:25];(node["brand"~"Walmart",i](around:25000,34.6992,-86.7483);way["brand"~"Walmart",i](around:25000,34.6992,-86.7483););out center body;`;

console.log('Testing Overpass API...');
console.log('Query:', query);

fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': '*/*',
    'User-Agent': 'FIX-GeoEquity-Dashboard/1.0'
  },
  body: 'data=' + encodeURIComponent(query)
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  return r.text();
})
.then(text => {
  console.log('Response (first 500 chars):', text.substring(0, 500));
  try {
    const d = JSON.parse(text);
    console.log('Elements found:', d.elements?.length || 0);
    if (d.elements && d.elements.length > 0) {
      d.elements.forEach((el, i) => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        console.log(`Store ${i+1}: ${el.tags?.name || 'Unknown'} at (${lat}, ${lon})`);
      });
    }
  } catch(e) {
    console.error('JSON parse error');
  }
})
.catch(e => console.error('Fetch Error:', e.message));
