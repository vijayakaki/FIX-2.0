// Vercel serverless function to proxy Overpass API requests (avoids CORS)
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const { query } = req.method === 'POST' ? req.body : req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'data=' + encodeURIComponent(query)
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Overpass API error: ${response.status}`,
                message: await response.text()
            });
        }
        
        const data = await response.json();
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Overpass proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
}
