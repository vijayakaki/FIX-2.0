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
        // Parse body - Vercel may not auto-parse JSON
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                // Not JSON, use as-is
            }
        }
        
        const query = body?.query || req.query?.query;
        
        console.log('Received request, query:', query ? query.substring(0, 100) + '...' : 'MISSING');
        
        if (!query) {
            return res.status(400).json({ 
                error: 'Missing query parameter',
                receivedBody: typeof req.body,
                bodyKeys: body ? Object.keys(body) : []
            });
        }
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'FIX-GeoEquity-Dashboard/1.0',
                'Accept': '*/*'
            },
            body: 'data=' + encodeURIComponent(query)
        });
        
        console.log('Overpass response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Overpass error:', errorText.substring(0, 200));
            return res.status(response.status).json({ 
                error: `Overpass API error: ${response.status}`,
                message: errorText.substring(0, 500)
            });
        }
        
        const data = await response.json();
        console.log('Returning', data.elements?.length || 0, 'elements');
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Overpass proxy error:', error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
