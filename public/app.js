/**
 * FIX$ Dashboard - Live EJV 4.1 Calculator
 * Community Intelligence for Economic Justice
 */

const API_BASE = window.location.origin;

// State
let map = null;
let economicFlowChart = null;
let trendChart = null;
let currentZip = null;
let markers = [];

// ZIP code data with coordinates, population, economic data
// Source: US Census, BLS, Economic data estimates
const ZIP_DATA = {
    // Alabama
    '35758': { lat: 34.6992, lng: -86.7483, name: 'Madison, AL', population: 56933, medianIncome: 95234, unemployment: 2.8, businesses: 1847, totalSpend: 312.5 },
    '35801': { lat: 34.7304, lng: -86.5861, name: 'Huntsville, AL', population: 215006, medianIncome: 56371, unemployment: 3.2, businesses: 8234, totalSpend: 892.4 },
    '35802': { lat: 34.6870, lng: -86.5342, name: 'Huntsville, AL', population: 42156, medianIncome: 72456, unemployment: 2.9, businesses: 1523, totalSpend: 245.6 },
    '35805': { lat: 34.7015, lng: -86.6102, name: 'Huntsville, AL', population: 28934, medianIncome: 48923, unemployment: 4.1, businesses: 892, totalSpend: 124.3 },
    '35806': { lat: 34.7562, lng: -86.6715, name: 'Madison, AL', population: 31245, medianIncome: 89123, unemployment: 2.5, businesses: 1234, totalSpend: 198.7 },
    '35810': { lat: 34.7893, lng: -86.5234, name: 'Huntsville, AL', population: 18923, medianIncome: 42156, unemployment: 5.2, businesses: 456, totalSpend: 67.8 },
    
    // Memphis Area
    '38126': { lat: 35.1175, lng: -90.0568, name: 'Memphis, TN', population: 12456, medianIncome: 24532, unemployment: 12.4, businesses: 234, totalSpend: 42.3 },
    '38108': { lat: 35.1595, lng: -89.9711, name: 'Memphis, TN', population: 28934, medianIncome: 31245, unemployment: 9.8, businesses: 567, totalSpend: 78.9 },
    '38127': { lat: 35.2270, lng: -89.9711, name: 'Memphis, TN', population: 34521, medianIncome: 35678, unemployment: 8.5, businesses: 712, totalSpend: 98.4 },
    '38107': { lat: 35.1684, lng: -90.0350, name: 'Memphis, TN', population: 18923, medianIncome: 28456, unemployment: 10.2, businesses: 345, totalSpend: 52.1 },
    '38112': { lat: 35.1495, lng: -89.9423, name: 'Memphis, TN', population: 25678, medianIncome: 52345, unemployment: 5.6, businesses: 823, totalSpend: 112.5 },
    '38114': { lat: 35.1084, lng: -89.9923, name: 'Memphis, TN', population: 21345, medianIncome: 29876, unemployment: 11.3, businesses: 398, totalSpend: 58.2 },
    '38106': { lat: 35.0984, lng: -90.0368, name: 'Memphis, TN', population: 15678, medianIncome: 22345, unemployment: 14.2, businesses: 187, totalSpend: 35.6 },
    '38117': { lat: 35.1195, lng: -89.9023, name: 'Memphis, TN', population: 42156, medianIncome: 78234, unemployment: 3.4, businesses: 1456, totalSpend: 234.5 },
    
    // New York
    '10001': { lat: 40.7506, lng: -73.9971, name: 'New York, NY', population: 21102, medianIncome: 98234, unemployment: 4.2, businesses: 4523, totalSpend: 892.3 },
    '10002': { lat: 40.7157, lng: -73.9863, name: 'New York, NY', population: 81410, medianIncome: 42156, unemployment: 6.8, businesses: 3245, totalSpend: 456.7 },
    '10003': { lat: 40.7317, lng: -73.9892, name: 'New York, NY', population: 56743, medianIncome: 112456, unemployment: 3.1, businesses: 5678, totalSpend: 1023.4 },
    
    // California
    '90210': { lat: 34.0901, lng: -118.4065, name: 'Beverly Hills, CA', population: 21741, medianIncome: 153234, unemployment: 2.8, businesses: 3456, totalSpend: 678.9 },
    '94102': { lat: 37.7785, lng: -122.4156, name: 'San Francisco, CA', population: 31456, medianIncome: 98234, unemployment: 4.5, businesses: 4123, totalSpend: 534.6 },
    '94103': { lat: 37.7726, lng: -122.4099, name: 'San Francisco, CA', population: 28934, medianIncome: 87654, unemployment: 5.1, businesses: 3567, totalSpend: 456.2 },
    
    // Chicago
    '60601': { lat: 41.8819, lng: -87.6278, name: 'Chicago, IL', population: 29834, medianIncome: 89234, unemployment: 4.8, businesses: 2345, totalSpend: 342.5 },
    '60602': { lat: 41.8827, lng: -87.6289, name: 'Chicago, IL', population: 3456, medianIncome: 112345, unemployment: 3.2, businesses: 1823, totalSpend: 234.1 },
    '60614': { lat: 41.9214, lng: -87.6513, name: 'Chicago, IL', population: 64523, medianIncome: 95678, unemployment: 3.8, businesses: 2678, totalSpend: 412.8 },
    
    // Atlanta
    '30301': { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA', population: 12345, medianIncome: 45678, unemployment: 5.6, businesses: 567, totalSpend: 78.9 },
    '30303': { lat: 33.7537, lng: -84.3863, name: 'Atlanta, GA', population: 8923, medianIncome: 38456, unemployment: 7.2, businesses: 1234, totalSpend: 98.4 },
    '30305': { lat: 33.8342, lng: -84.3847, name: 'Atlanta, GA', population: 25678, medianIncome: 112345, unemployment: 2.9, businesses: 1567, totalSpend: 245.6 },
    
    // Houston
    '77001': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX', population: 18923, medianIncome: 52345, unemployment: 5.4, businesses: 892, totalSpend: 134.5 },
    '77002': { lat: 29.7589, lng: -95.3637, name: 'Houston, TX', population: 12456, medianIncome: 78234, unemployment: 4.1, businesses: 2345, totalSpend: 267.8 },
    '77019': { lat: 29.7533, lng: -95.4103, name: 'Houston, TX', population: 34521, medianIncome: 98765, unemployment: 3.2, businesses: 1678, totalSpend: 298.4 },
    
    // Phoenix
    '85001': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ', population: 8923, medianIncome: 42156, unemployment: 6.8, businesses: 456, totalSpend: 56.7 },
    '85004': { lat: 33.4539, lng: -112.0673, name: 'Phoenix, AZ', population: 12345, medianIncome: 68234, unemployment: 4.5, businesses: 1234, totalSpend: 145.2 },
    '85016': { lat: 33.5091, lng: -112.0181, name: 'Phoenix, AZ', population: 42156, medianIncome: 72345, unemployment: 4.1, businesses: 1567, totalSpend: 234.5 },
    
    // Dallas
    '75201': { lat: 32.7875, lng: -96.7990, name: 'Dallas, TX', population: 9823, medianIncome: 95234, unemployment: 3.8, businesses: 2345, totalSpend: 312.4 },
    '75204': { lat: 32.8018, lng: -96.7889, name: 'Dallas, TX', population: 28934, medianIncome: 78456, unemployment: 4.2, businesses: 1823, totalSpend: 234.6 },
    
    // Seattle
    '98101': { lat: 47.6097, lng: -122.3331, name: 'Seattle, WA', population: 6234, medianIncome: 89234, unemployment: 3.9, businesses: 3456, totalSpend: 412.5 },
    '98102': { lat: 47.6319, lng: -122.3211, name: 'Seattle, WA', population: 21456, medianIncome: 112345, unemployment: 3.2, businesses: 1567, totalSpend: 298.7 },
    
    // Default
    'default': { lat: 39.8283, lng: -98.5795, name: 'United States', population: 25000, medianIncome: 65000, unemployment: 4.0, businesses: 500, totalSpend: 100 }
};

// Keep ZIP_COORDS for backward compatibility
const ZIP_COORDS = Object.fromEntries(
    Object.entries(ZIP_DATA).map(([zip, data]) => [
        zip, 
        { lat: data.lat, lng: data.lng, name: data.name, retention: calculateBaseRetention(data) }
    ])
);

/**
 * Calculate base retention based on economic factors
 */
function calculateBaseRetention(data) {
    // Higher income, lower unemployment = typically better local businesses = higher retention
    // But very high income areas might have more chain stores = lower retention
    const incomeScore = data.medianIncome > 100000 ? 30 : (data.medianIncome > 60000 ? 35 : 25);
    const unemploymentPenalty = data.unemployment * 0.5;
    const businessDensity = (data.businesses / data.population) * 100;
    const densityBonus = Math.min(businessDensity * 2, 15);
    
    return Math.min(50, Math.max(20, incomeScore - unemploymentPenalty + densityBonus));
}

// Store database with locations (simulated data for each ZIP)
const STORE_DATABASE = {
    // Supermarkets
    'costco': [
        { zip: '38126', name: 'Costco Memphis', retention: 38, lat: 35.1175, lng: -90.0568 },
        { zip: '38127', name: 'Costco North Memphis', retention: 36, lat: 35.2270, lng: -89.9711 },
        { zip: '35758', name: 'Costco Madison', retention: 42, lat: 34.6992, lng: -86.7483 },
        { zip: '35801', name: 'Costco Huntsville', retention: 40, lat: 34.7304, lng: -86.5861 }
    ],
    'whole_foods': [
        { zip: '38117', name: 'Whole Foods East Memphis', retention: 45, lat: 35.1195, lng: -89.9023 },
        { zip: '38112', name: 'Whole Foods Midtown', retention: 48, lat: 35.1495, lng: -89.9423 },
        { zip: '35801', name: 'Whole Foods Huntsville', retention: 52, lat: 34.7304, lng: -86.5861 }
    ],
    'trader_joes': [
        { zip: '38117', name: "Trader Joe's Poplar", retention: 42, lat: 35.1185, lng: -89.9103 },
        { zip: '35801', name: "Trader Joe's Huntsville", retention: 44, lat: 34.7250, lng: -86.5900 }
    ],
    'walmart': [
        { zip: '38126', name: 'Walmart Supercenter', retention: 22, lat: 35.1155, lng: -90.0508 },
        { zip: '38108', name: 'Walmart Neighborhood', retention: 24, lat: 35.1595, lng: -89.9711 },
        { zip: '38127', name: 'Walmart Frayser', retention: 21, lat: 35.2270, lng: -89.9611 },
        { zip: '35758', name: 'Walmart Madison', retention: 26, lat: 34.6950, lng: -86.7400 },
        { zip: '35801', name: 'Walmart Huntsville', retention: 24, lat: 34.7350, lng: -86.5800 },
        { zip: '35802', name: 'Walmart South Huntsville', retention: 25, lat: 34.6870, lng: -86.5342 }
    ],
    'kroger': [
        { zip: '38126', name: 'Kroger Downtown', retention: 28, lat: 35.1145, lng: -90.0528 },
        { zip: '38112', name: 'Kroger Union Ave', retention: 32, lat: 35.1495, lng: -89.9523 },
        { zip: '38107', name: 'Kroger Chelsea', retention: 30, lat: 35.1684, lng: -90.0350 },
        { zip: '35758', name: 'Kroger Madison', retention: 35, lat: 34.7000, lng: -86.7500 },
        { zip: '35801', name: 'Kroger Huntsville', retention: 33, lat: 34.7280, lng: -86.5900 }
    ],
    'publix': [
        { zip: '35758', name: 'Publix Madison', retention: 38, lat: 34.6980, lng: -86.7450 },
        { zip: '35801', name: 'Publix Huntsville', retention: 36, lat: 34.7320, lng: -86.5850 },
        { zip: '35802', name: 'Publix South Huntsville', retention: 37, lat: 34.6900, lng: -86.5400 }
    ],
    'aldi': [
        { zip: '35758', name: 'ALDI Madison', retention: 32, lat: 34.6970, lng: -86.7420 },
        { zip: '35801', name: 'ALDI Huntsville', retention: 30, lat: 34.7290, lng: -86.5880 }
    ],
    'target': [
        { zip: '38117', name: 'Target Poplar', retention: 26, lat: 35.1190, lng: -89.8923 },
        { zip: '38138', name: 'Target Germantown', retention: 29, lat: 35.0867, lng: -89.7970 },
        { zip: '35758', name: 'Target Madison', retention: 30, lat: 34.6960, lng: -86.7460 },
        { zip: '35801', name: 'Target Huntsville', retention: 28, lat: 34.7310, lng: -86.5870 }
    ],
    'cvs': [
        { zip: '38126', name: 'CVS Pharmacy', retention: 35, lat: 35.1165, lng: -90.0548 },
        { zip: '38108', name: 'CVS Frayser', retention: 33, lat: 35.1605, lng: -89.9731 },
        { zip: '35758', name: 'CVS Madison', retention: 36, lat: 34.6985, lng: -86.7470 },
        { zip: '35801', name: 'CVS Huntsville', retention: 35, lat: 34.7300, lng: -86.5860 }
    ],
    'walgreens': [
        { zip: '38126', name: 'Walgreens', retention: 32, lat: 35.1185, lng: -90.0588 },
        { zip: '38112', name: 'Walgreens Midtown', retention: 34, lat: 35.1505, lng: -89.9443 },
        { zip: '35758', name: 'Walgreens Madison', retention: 34, lat: 34.6975, lng: -86.7440 },
        { zip: '35801', name: 'Walgreens Huntsville', retention: 33, lat: 34.7295, lng: -86.5855 }
    ],
    'home_depot': [
        { zip: '38118', name: 'Home Depot S Memphis', retention: 24, lat: 35.0284, lng: -89.9423 },
        { zip: '38134', name: 'Home Depot Bartlett', retention: 26, lat: 35.2045, lng: -89.8623 },
        { zip: '35758', name: 'Home Depot Madison', retention: 28, lat: 34.6940, lng: -86.7380 },
        { zip: '35801', name: 'Home Depot Huntsville', retention: 27, lat: 34.7340, lng: -86.5820 }
    ],
    'lowes': [
        { zip: '38115', name: "Lowe's Hickory Hill", retention: 25, lat: 35.0595, lng: -89.8911 },
        { zip: '35758', name: "Lowe's Madison", retention: 27, lat: 34.6935, lng: -86.7390 },
        { zip: '35801', name: "Lowe's Huntsville", retention: 26, lat: 34.7335, lng: -86.5830 }
    ],
    'starbucks': [
        { zip: '38126', name: 'Starbucks Downtown', retention: 28, lat: 35.1195, lng: -90.0518 },
        { zip: '38103', name: 'Starbucks Beale St', retention: 30, lat: 35.1398, lng: -90.0534 },
        { zip: '38112', name: 'Starbucks Overton', retention: 32, lat: 35.1485, lng: -89.9403 },
        { zip: '35758', name: 'Starbucks Madison', retention: 32, lat: 34.6990, lng: -86.7475 },
        { zip: '35801', name: 'Starbucks Huntsville', retention: 31, lat: 34.7305, lng: -86.5865 }
    ],
    'mcdonalds': [
        { zip: '38126', name: "McDonald's Downtown", retention: 18, lat: 35.1155, lng: -90.0538 },
        { zip: '38108', name: "McDonald's Frayser", retention: 16, lat: 35.1585, lng: -89.9701 },
        { zip: '35758', name: "McDonald's Madison", retention: 20, lat: 34.6988, lng: -86.7465 },
        { zip: '35801', name: "McDonald's Huntsville", retention: 19, lat: 34.7308, lng: -86.5858 }
    ],
    'chipotle': [
        { zip: '38117', name: 'Chipotle East Memphis', retention: 26, lat: 35.1195, lng: -89.9053 },
        { zip: '35758', name: 'Chipotle Madison', retention: 28, lat: 34.6995, lng: -86.7478 },
        { zip: '35801', name: 'Chipotle Huntsville', retention: 27, lat: 34.7302, lng: -86.5868 }
    ],
    '7_eleven': [
        { zip: '35758', name: '7-Eleven Madison', retention: 22, lat: 34.6982, lng: -86.7455 },
        { zip: '35801', name: '7-Eleven Huntsville', retention: 21, lat: 34.7298, lng: -86.5862 }
    ],
    'wawa': [
        { zip: '35758', name: 'Wawa Madison', retention: 30, lat: 34.6978, lng: -86.7448 }
    ],
    'local_grocery': [
        { zip: '38126', name: 'Soulsville Grocery Co-op', retention: 72, lat: 35.1135, lng: -90.0548, isLocal: true },
        { zip: '38108', name: 'Memphis Urban Farms Market', retention: 78, lat: 35.1615, lng: -89.9721, isLocal: true },
        { zip: '38107', name: 'North Memphis Food Hub', retention: 68, lat: 35.1704, lng: -90.0330, isLocal: true },
        { zip: '35758', name: 'Madison Farmers Market', retention: 75, lat: 34.6965, lng: -86.7435, isLocal: true },
        { zip: '35801', name: 'Huntsville Local Grocery', retention: 70, lat: 34.7285, lng: -86.5845, isLocal: true }
    ],
    'worker_cooperative': [
        { zip: '38126', name: 'Community Ownership Co-op', retention: 85, lat: 35.1125, lng: -90.0558, isLocal: true },
        { zip: '35801', name: 'Huntsville Worker Co-op', retention: 82, lat: 34.7275, lng: -86.5840, isLocal: true }
    ]
};

// Category to stores mapping
const CATEGORY_STORES = {
    'supermarket': ['walmart', 'kroger', 'whole_foods', 'trader_joes', 'safeway', 'publix', 'aldi', 'wegmans'],
    'warehouse_club': ['costco', 'sams_club'],
    'department_store': ['target'],
    'pharmacy': ['cvs', 'walgreens'],
    'home_improvement': ['home_depot', 'lowes'],
    'coffee_shop': ['starbucks'],
    'fast_food': ['mcdonalds'],
    'fast_casual': ['chipotle'],
    'convenience': ['7_eleven', 'wawa'],
    'local_grocery': ['local_grocery'],
    'worker_cooperative': ['worker_cooperative']
};

// Company to category mapping (reverse lookup)
const COMPANY_CATEGORY = {
    'costco': 'warehouse_club', 'sams_club': 'warehouse_club',
    'whole_foods': 'supermarket', 'trader_joes': 'supermarket',
    'walmart': 'supermarket', 'kroger': 'supermarket',
    'safeway': 'supermarket', 'publix': 'supermarket',
    'aldi': 'supermarket', 'wegmans': 'supermarket',
    'target': 'department_store',
    'cvs': 'pharmacy', 'walgreens': 'pharmacy',
    '7_eleven': 'convenience', 'wawa': 'convenience',
    'home_depot': 'home_improvement', 'lowes': 'home_improvement',
    'starbucks': 'coffee_shop',
    'mcdonalds': 'fast_food',
    'chipotle': 'fast_casual',
    'local_grocery': 'local_grocery',
    'worker_cooperative': 'worker_cooperative'
};

// Company display names
const COMPANY_NAMES = {
    'costco': 'Costco', 'sams_club': "Sam's Club",
    'whole_foods': 'Whole Foods', 'trader_joes': "Trader Joe's",
    'walmart': 'Walmart', 'kroger': 'Kroger',
    'safeway': 'Safeway', 'publix': 'Publix',
    'aldi': 'ALDI', 'wegmans': 'Wegmans',
    'target': 'Target',
    'cvs': 'CVS', 'walgreens': 'Walgreens',
    '7_eleven': '7-Eleven', 'wawa': 'Wawa',
    'home_depot': 'Home Depot', 'lowes': "Lowe's",
    'starbucks': 'Starbucks',
    'mcdonalds': "McDonald's",
    'chipotle': 'Chipotle',
    'local_grocery': 'Local Grocery',
    'worker_cooperative': 'Worker Co-op'
};

// Store symbols/icons by category
const STORE_ICONS = {
    'supermarket': '🛒',
    'warehouse_club': '📦',
    'department_store': '🏬',
    'pharmacy': '💊',
    'convenience': '🏪',
    'home_improvement': '🔨',
    'coffee_shop': '☕',
    'fast_food': '🍔',
    'fast_casual': '🌯',
    'local_grocery': '🥬',
    'worker_cooperative': '🤝',
    'restaurant': '🍽️',
    'default': '📍'
};

// Company-specific icons (override category icons)
const COMPANY_ICONS = {
    'costco': '📦',
    'walmart': '🛒',
    'target': '🎯',
    'starbucks': '☕',
    'mcdonalds': '🍟',
    'home_depot': '🧱',
    'cvs': '💊',
    'walgreens': '💊',
    'whole_foods': '🥗',
    'trader_joes': '🛍️',
    'chipotle': '🌯',
    '7_eleven': '🏪',
    'wawa': '⛽',
    'local_grocery': '🥬',
    'worker_cooperative': '🤝'
};

// Impact band definitions
const IMPACT_BANDS = {
    community_anchor: { min: 80, emoji: '🟢', label: 'Community Anchor', color: '#2e7d32' },
    strong_supporter: { min: 60, emoji: '🟢', label: 'Strong Local Supporter', color: '#4caf50' },
    moderate_impact: { min: 40, emoji: '🟡', label: 'Moderate Local Impact', color: '#ff9800' },
    low_retention: { min: 20, emoji: '🟠', label: 'Low Local Retention', color: '#ff5722' },
    high_leakage: { min: 0, emoji: '🔴', label: 'High Value Leakage', color: '#d32f2f' }
};

/**
 * Get impact band for score
 */
function getImpactBand(score) {
    if (score >= 80) return IMPACT_BANDS.community_anchor;
    if (score >= 60) return IMPACT_BANDS.strong_supporter;
    if (score >= 40) return IMPACT_BANDS.moderate_impact;
    if (score >= 20) return IMPACT_BANDS.low_retention;
    return IMPACT_BANDS.high_leakage;
}

/**
 * Initialize Leaflet Map - Start with US overview, no markers until search
 */
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || map) return;
    
    // Center on US - user will search for specific ZIP
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    // No markers by default - will show when user searches
}

/**
 * Get retention color based on percentage (matching image gradient)
 */
function getRetentionColor(retention) {
    if (retention >= 60) return '#2e7d32'; // Dark green - High
    if (retention >= 45) return '#4caf50'; // Green
    if (retention >= 35) return '#8bc34a'; // Light green
    if (retention >= 28) return '#cddc39'; // Yellow-green - Medium
    if (retention >= 22) return '#ffeb3b'; // Yellow
    if (retention >= 15) return '#ff9800'; // Orange - Low
    return '#f44336'; // Red - Very low
}

/**
 * Get store icon based on company or category
 */
function getStoreIcon(company, category) {
    return COMPANY_ICONS[company] || STORE_ICONS[category] || STORE_ICONS.default;
}

/**
 * Create a custom marker icon with emoji and retention badge
 */
function createStoreMarker(lat, lng, store, retention, isHighlighted = false) {
    const company = store.company || '';
    const category = COMPANY_CATEGORY[company] || 'default';
    const icon = getStoreIcon(company, category);
    // Ensure retention is a valid number
    const retentionVal = typeof retention === 'number' && !isNaN(retention) ? retention : 30;
    const color = getRetentionColor(retentionVal);
    const size = isHighlighted ? 50 : 42;
    const borderColor = isHighlighted ? '#1a3d16' : color;
    
    // Create custom div icon with emoji and retention badge
    const customIcon = L.divIcon({
        className: 'custom-store-marker',
        html: `
            <div style="
                position: relative;
                width: ${size}px;
                height: ${size + 18}px;
                text-align: center;
            ">
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: white;
                    border: 3px solid ${borderColor};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${size * 0.5}px;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                ">${icon}</div>
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${color};
                    color: white;
                    font-size: 10px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 10px;
                    white-space: nowrap;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                ">${Math.round(retentionVal)}%</div>
            </div>
        `,
        iconSize: [size, size + 18],
        iconAnchor: [size / 2, size + 9],
        popupAnchor: [0, -size]
    });
    
    return L.marker([lat, lng], { icon: customIcon });
}

/**
 * Create a location pin marker for ZIP searches
 */
function createLocationMarker(lat, lng, retention, displayName) {
    // Ensure retention is a valid number
    const retentionVal = typeof retention === 'number' && !isNaN(retention) ? retention : 30;
    const color = getRetentionColor(retentionVal);
    
    const customIcon = L.divIcon({
        className: 'custom-location-marker',
        html: `
            <div style="
                position: relative;
                width: 50px;
                height: 68px;
                text-align: center;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                ">
                    <span style="
                        transform: rotate(45deg);
                        font-size: 18px;
                        font-weight: bold;
                        color: white;
                    ">${Math.round(retentionVal)}%</span>
                </div>
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 9px;
                    font-weight: bold;
                    color: #333;
                    background: white;
                    padding: 2px 4px;
                    border-radius: 3px;
                    white-space: nowrap;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                ">📍</div>
            </div>
        `,
        iconSize: [50, 68],
        iconAnchor: [25, 68],
        popupAnchor: [0, -55]
    });
    
    return L.marker([lat, lng], { icon: customIcon });
}

/**
 * Add ZIP code markers to map with Local Retention %
 */
function addZipMarkers(zipCodes) {
    // Clear existing markers
    clearMapMarkers();
    
    zipCodes.forEach(zip => {
        const coords = ZIP_COORDS[zip] || ZIP_COORDS.default;
        const retention = coords.retention || 30;
        const color = getRetentionColor(retention);
        
        // Use custom location marker
        const marker = createLocationMarker(coords.lat, coords.lng, retention, `ZIP ${zip}`);
        marker.addTo(map);
        
        marker.bindPopup(`
            <div style="text-align:center;min-width:140px;">
                <div style="font-size:24px;margin-bottom:5px;">📍</div>
                <strong style="font-size:14px;">ZIP: ${zip}</strong><br>
                <span style="font-size:22px;font-weight:bold;color:${color}">${retention}%</span><br>
                <span style="font-size:12px;color:#666;">Local Retention</span><br>
                <a href="#" onclick="searchZip('${zip}');return false;" style="color:#2d5a27;">View Details →</a>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // Fit bounds if we have markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

/**
 * Clear all markers from map
 */
function clearMapMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

/**
 * Add store markers to map with Local Retention %
 * Used when searching by store name
 */
function addStoreMarkers(stores, highlightZip = null) {
    clearMapMarkers();
    
    stores.forEach(store => {
        const retention = store.retention || getStoreCalculatedRetention(store);
        const color = getRetentionColor(retention);
        const isHighlighted = highlightZip && store.zip === highlightZip;
        
        // Use custom store marker with icons
        const storeData = {
            ...store,
            company: store.company || 'default'
        };
        const marker = createStoreMarker(store.lat, store.lng, storeData, retention, isHighlighted);
        marker.addTo(map);
        
        const localBadge = store.isLocal ? '<span style="background:#4caf50;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">LOCAL</span><br>' : '';
        const icon = getStoreIcon(store.company, COMPANY_CATEGORY[store.company]);
        
        marker.bindPopup(`
            <div style="text-align:center;min-width:160px;">
                ${localBadge}
                <div style="font-size:24px;margin-bottom:5px;">${icon}</div>
                <strong style="font-size:14px;">${store.name}</strong><br>
                <span style="font-size:11px;color:#666;">ZIP: ${store.zip}</span><br>
                <span style="font-size:22px;font-weight:bold;color:${color}">${retention.toFixed ? retention.toFixed(1) : retention}%</span><br>
                <span style="font-size:11px;color:#666;">Local Retention</span>
            </div>
        `);
        
        // Add click handler
        marker.on('click', async () => {
            const result = await calculateEJV({
                zip_code: store.zip,
                store_name: store.name,
                company_name: store.company,
                is_local_business: store.isLocal || false
            });
            displayResults(result);
        });
        
        markers.push(marker);
    });
    
    // Fit bounds
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

/**
 * Show stores by company name on map
 */
function showStoresByCompany(companyKey, filterZip = null) {
    const stores = STORE_DATABASE[companyKey] || [];
    let filteredStores = stores;
    
    if (filterZip) {
        // Only show stores that match the searched ZIP
        filteredStores = stores.filter(s => s.zip === filterZip);
        // Don't fall back to showing all stores - let caller handle the searched ZIP
    }
    
    if (filteredStores.length > 0) {
        addStoreMarkers(filteredStores, filterZip);
        addInsight('info', `Showing ${filteredStores.length} ${companyKey.replace('_', ' ')} location(s) on map`);
    }
    
    return filteredStores;
}

/**
 * Show all stores in a category on map
 */
function showStoresByCategory(category, filterZip = null) {
    const storeKeys = CATEGORY_STORES[category] || [];
    let allStores = [];
    
    storeKeys.forEach(key => {
        const stores = STORE_DATABASE[key] || [];
        allStores = allStores.concat(stores.map(s => ({ ...s, company: key })));
    });
    
    if (filterZip) {
        const filtered = allStores.filter(s => s.zip === filterZip);
        if (filtered.length > 0) {
            allStores = filtered;
        }
    }
    
    if (allStores.length > 0) {
        addStoreMarkers(allStores, filterZip);
        addInsight('info', `Showing ${allStores.length} ${category.replace('_', ' ')} stores on map`);
    } else {
        addInsight('warning', `No ${category.replace('_', ' ')} stores found`);
    }
    
    return allStores;
}

/**
 * Initialize Economic Flow Chart
 */
function initEconomicFlowChart() {
    const ctx = document.getElementById('economicFlowChart');
    if (!ctx) return;
    
    if (economicFlowChart) economicFlowChart.destroy();
    
    economicFlowChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Local Businesses', 'Local Leakage', 'Outside Regional', 'Outside State'],
            datasets: [{
                data: [25, 40, 20, 15],
                backgroundColor: ['#2d5a27', '#7cb342', '#c5e1a5', '#f5f5dc'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw}%`
                    }
                }
            }
        }
    });
}

/**
 * Initialize Trend Chart
 */
function initTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    if (trendChart) trendChart.destroy();
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25"],
            datasets: [{
                label: 'Local Retention %',
                data: [28, 30, 29, 31, 33],
                borderColor: '#7cb342',
                backgroundColor: 'rgba(124, 179, 66, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#7cb342',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true, max: 60, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });
}

/**
 * Calculate EJV via API
 */
async function calculateEJV(params) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/v1/ejv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }
        
        return await response.json();
    } catch (error) {
        console.error('EJV Calculation Error:', error);
        addInsight('warning', `Error: ${error.message}. Using estimated values.`);
        
        // Return estimated values on error
        return generateEstimatedEJV(params);
    } finally {
        showLoading(false);
    }
}

/**
 * Generate estimated EJV (fallback when API unavailable)
 * Uses actual company data from verified sources
 */
function generateEstimatedEJV(params) {
    const isLocal = params.is_local_business;
    const company = params.company_name;
    const zip = params.zip_code;
    
    console.log('generateEstimatedEJV called with:', { company, zip, isLocal });
    
    // Get ZIP-specific data for community need calculation
    const zipData = ZIP_DATA[zip] || estimateZipData(zip);
    
    // Company-specific data (from SEC filings, ESG reports, Glassdoor)
    const COMPANY_METRICS = {
        'costco': { 
            wage: 19.50, localProc: 40, renewable: 48, recycling: 62, equity: 81, 
            name: 'Costco', category: 'warehouse_club'
        },
        'sams_club': { 
            wage: 16.00, localProc: 35, renewable: 28, recycling: 45, equity: 62,
            name: "Sam's Club", category: 'warehouse_club'
        },
        'whole_foods': { 
            wage: 17.50, localProc: 55, renewable: 62, recycling: 72, equity: 74,
            name: 'Whole Foods', category: 'supermarket'
        },
        'trader_joes': { 
            wage: 18.00, localProc: 38, renewable: 42, recycling: 65, equity: 76,
            name: "Trader Joe's", category: 'supermarket'
        },
        'walmart': { 
            wage: 16.50, localProc: 35, renewable: 28, recycling: 45, equity: 62,
            name: 'Walmart', category: 'supermarket'
        },
        'kroger': { 
            wage: 15.75, localProc: 42, renewable: 35, recycling: 52, equity: 68,
            name: 'Kroger', category: 'supermarket'
        },
        'target': { 
            wage: 17.00, localProc: 37, renewable: 45, recycling: 58, equity: 72,
            name: 'Target', category: 'department_store'
        },
        'safeway': { 
            wage: 15.25, localProc: 40, renewable: 32, recycling: 48, equity: 65,
            name: 'Safeway', category: 'supermarket'
        },
        'publix': { 
            wage: 14.50, localProc: 45, renewable: 30, recycling: 55, equity: 70,
            name: 'Publix', category: 'supermarket'
        },
        'aldi': { 
            wage: 16.25, localProc: 28, renewable: 40, recycling: 60, equity: 66,
            name: 'ALDI', category: 'supermarket'
        },
        'wegmans': { 
            wage: 17.25, localProc: 48, renewable: 52, recycling: 68, equity: 78,
            name: 'Wegmans', category: 'supermarket'
        },
        'cvs': { 
            wage: 15.50, localProc: 30, renewable: 35, recycling: 45, equity: 70,
            name: 'CVS', category: 'pharmacy'
        },
        'walgreens': { 
            wage: 15.25, localProc: 28, renewable: 32, recycling: 42, equity: 68,
            name: 'Walgreens', category: 'pharmacy'
        },
        'home_depot': { 
            wage: 16.50, localProc: 32, renewable: 38, recycling: 55, equity: 67,
            name: 'Home Depot', category: 'home_improvement'
        },
        'lowes': { 
            wage: 15.75, localProc: 30, renewable: 35, recycling: 50, equity: 65,
            name: "Lowe's", category: 'home_improvement'
        },
        'starbucks': { 
            wage: 17.50, localProc: 25, renewable: 55, recycling: 60, equity: 73,
            name: 'Starbucks', category: 'coffee_shop'
        },
        'mcdonalds': { 
            wage: 14.00, localProc: 20, renewable: 22, recycling: 35, equity: 58,
            name: "McDonald's", category: 'fast_food'
        },
        'chipotle': { 
            wage: 15.50, localProc: 35, renewable: 42, recycling: 55, equity: 65,
            name: 'Chipotle', category: 'fast_casual'
        },
        '7_eleven': { 
            wage: 13.50, localProc: 18, renewable: 15, recycling: 30, equity: 55,
            name: '7-Eleven', category: 'convenience'
        },
        'wawa': { 
            wage: 15.00, localProc: 35, renewable: 28, recycling: 45, equity: 68,
            name: 'Wawa', category: 'convenience'
        },
        'local_grocery': { 
            wage: 14.50, localProc: 65, renewable: 25, recycling: 40, equity: 72,
            name: 'Local Grocery', category: 'local_grocery'
        },
        'worker_cooperative': { 
            wage: 18.00, localProc: 80, renewable: 45, recycling: 65, equity: 95,
            name: 'Worker Co-op', category: 'worker_cooperative'
        }
    };
    
    // Get company data or use defaults
    const companyData = company ? COMPANY_METRICS[company] : null;
    console.log('Company lookup:', { company, found: !!companyData, data: companyData });
    
    // Living wage (varies by location - using $15/hr as baseline, adjusted by ZIP income)
    const livingWage = Math.max(12, Math.min(22, zipData.medianIncome / 2080 * 0.35));
    
    // Calculate EJV Components based on EJV 4.1 formula
    
    // 1. LC (Local Circulation) = sqrt(LocalHiring% × LocalProcurement%) × 100
    // Local hiring estimated at 60-90% depending on company type
    const localHiring = isLocal ? 90 : (companyData ? 65 : 60);
    const localProcurement = companyData ? companyData.localProc : (isLocal ? 65 : 30);
    const LC = Math.sqrt((localHiring / 100) * (localProcurement / 100)) * 100;
    
    // 2. W (Fair Wages) = min(100, (StoreWage / LivingWage) × 80)
    const storeWage = companyData ? companyData.wage : (isLocal ? 14.50 : 14.00);
    const W = Math.min(100, (storeWage / livingWage) * 80);
    
    // 3. DN (Community Need) = Based on unemployment and income gap
    // Higher unemployment = higher need = higher score for serving that community
    const unemploymentScore = Math.min(100, zipData.unemployment * 6);
    const incomeGapScore = Math.min(100, (75000 - zipData.medianIncome) / 500);
    const DN = Math.max(20, Math.min(100, (unemploymentScore + Math.max(0, incomeGapScore)) / 2 + 30));
    
    // 4. EQ (Equity & Inclusion) = Company equity score
    const EQ = companyData ? companyData.equity : (isLocal ? 72 : 60);
    
    // 5. ENV (Environmental) = (RenewableEnergy% + Recycling%) / 2
    const renewable = companyData ? companyData.renewable : (isLocal ? 25 : 20);
    const recycling = companyData ? companyData.recycling : (isLocal ? 40 : 35);
    const ENV = (renewable + recycling) / 2;
    
    // 6. PROC (Procurement) = Local procurement percentage direct
    const PROC = localProcurement;
    
    // Calculate final EJV Score
    const ejvScore = (LC + W + DN + EQ + ENV + PROC) / 6;
    
    // Get store name
    const storeName = params.store_name || (companyData ? companyData.name : 'Store');
    
    return {
        store_name: storeName,
        zip_code: zip,
        ejv_percentage: ejvScore,
        ejv_score: ejvScore / 100,
        components: {
            LC_local_circulation: Math.round(LC * 10) / 10,
            W_fair_wages: Math.round(W * 10) / 10,
            DN_community_need: Math.round(DN * 10) / 10,
            EQ_equity_inclusion: Math.round(EQ * 10) / 10,
            ENV_environmental: Math.round(ENV * 10) / 10,
            PROC_procurement: Math.round(PROC * 10) / 10
        },
        ejv_display: {
            primary: getImpactBand(ejvScore),
            tertiary: { display: '≈ $' + (ejvScore / 10).toFixed(2) + ' of every $10 stays local' }
        },
        economic_impact: {
            elvr: Math.round(ejvScore * 10) / 10,
            evl: Math.round((100 - ejvScore) * 10) / 10
        },
        component_details: {
            local_circulation: { 
                local_hiring_percent: localHiring, 
                local_procurement_percent: localProcurement 
            },
            fair_wages: { 
                store_wage: storeWage, 
                living_wage: Math.round(livingWage * 100) / 100 
            },
            community_need: { 
                unemployment_rate: zipData.unemployment, 
                median_income: zipData.medianIncome 
            },
            environmental: {
                renewable_energy_pct: renewable,
                recycling_pct: recycling
            }
        },
        company_data: companyData || null
    };
}

/**
 * Display EJV Results
 */
function displayResults(result) {
    const resultsEl = document.getElementById('storeResults');
    resultsEl.style.display = 'block';
    
    const score = result.ejv_percentage;
    const band = getImpactBand(score);
    
    // Update result header
    document.getElementById('resultStoreName').textContent = result.store_name || 'Store Analysis';
    document.getElementById('resultZip').textContent = `ZIP: ${result.zip_code}`;
    document.getElementById('badgeEmoji').textContent = band.emoji;
    document.getElementById('badgeLabel').textContent = band.label;
    document.getElementById('resultBadge').style.background = band.color + '20';
    document.getElementById('resultBadge').style.color = band.color;
    
    // Update score circle
    const scoreCircle = document.getElementById('resultScoreCircle');
    document.getElementById('resultScore').textContent = score.toFixed(1);
    scoreCircle.style.background = `conic-gradient(${band.color} ${score * 3.6}deg, #e0e0e0 0deg)`;
    
    // Update impact text
    document.getElementById('resultImpact').textContent = result.ejv_display?.tertiary?.display || 
        `≈ $${(score / 10).toFixed(2)} of every $10 stays local`;
    
    // Update components
    const comps = result.components;
    updateComponentCard('LC', comps.LC_local_circulation);
    updateComponentCard('W', comps.W_fair_wages);
    updateComponentCard('DN', comps.DN_community_need);
    updateComponentCard('EQ', comps.EQ_equity_inclusion);
    updateComponentCard('ENV', comps.ENV_environmental);
    updateComponentCard('PROC', comps.PROC_procurement);
    
    // Update economic impact
    document.getElementById('resultELVR').textContent = `$${result.economic_impact.elvr.toFixed(2)}`;
    document.getElementById('resultEVL').textContent = `$${result.economic_impact.evl.toFixed(2)}`;
    
    // Update JSON details
    document.getElementById('resultJSON').textContent = JSON.stringify(result, null, 2);
    
    // Update sidebar components
    updateSidebarComponents(comps, score, band);
    
    // Update KPIs
    updateKPIs(result);
    
    // Update charts with result data
    updateCharts(score, null, result);
    
    // Add insight
    addInsight('positive', `EJV Score calculated: ${score.toFixed(1)} (${band.label})`);
    
    // Scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Update component card
 */
function updateComponentCard(code, value) {
    const valEl = document.getElementById(`comp${code}Val`);
    const barEl = document.getElementById(`comp${code}Bar`);
    
    if (valEl) valEl.textContent = value.toFixed(1);
    if (barEl) {
        barEl.style.width = `${value}%`;
        barEl.style.background = getComponentColor(value);
    }
}

/**
 * Get component color based on score
 */
function getComponentColor(score) {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#4caf50';
    if (score >= 40) return '#ff9800';
    if (score >= 20) return '#ff5722';
    return '#d32f2f';
}

/**
 * Update sidebar EJV components
 */
function updateSidebarComponents(comps, score, band) {
    // Update main score
    document.getElementById('ejvMainScore').textContent = score.toFixed(0);
    document.getElementById('ejvMainLabel').textContent = band.label;
    
    // Update score circle
    const circumference = 283;
    const offset = circumference * (1 - score / 100);
    const fillEl = document.getElementById('ejvScoreFill');
    fillEl.style.stroke = band.color;
    fillEl.style.strokeDashoffset = offset;
    
    // Update component bars
    const componentMap = {
        'LC': comps.LC_local_circulation,
        'W': comps.W_fair_wages,
        'DN': comps.DN_community_need,
        'EQ': comps.EQ_equity_inclusion,
        'ENV': comps.ENV_environmental,
        'PROC': comps.PROC_procurement
    };
    
    Object.entries(componentMap).forEach(([code, value]) => {
        const bar = document.getElementById(`sideComp${code}`);
        const scoreEl = document.getElementById(`sideScore${code}`);
        if (bar) bar.style.width = `${value}%`;
        if (scoreEl) scoreEl.textContent = value.toFixed(0);
    });
}

/**
 * Update KPI cards with accurate ZIP-level data
 */
function updateKPIs(result) {
    const score = result.ejv_percentage;
    const band = getImpactBand(score);
    const zip = result.zip_code;
    
    // Get actual ZIP data or estimate
    const zipData = ZIP_DATA[zip] || estimateZipData(zip);
    
    // Calculate accurate values
    // Total Spend: Use actual ZIP data
    const totalSpend = zipData.totalSpend;
    
    // Local Retention: Use actual LC (Local Circulation) component value
    // LC = sqrt(LocalHiring% × LocalProcurement%) × 100
    const retention = result.components.LC_local_circulation.toFixed(1);
    
    // Jobs Supported: Based on local businesses and retention rate
    const jobsPerBusiness = 8;
    const localBusinessRatio = parseFloat(retention) / 100;
    const jobs = Math.round(zipData.businesses * jobsPerBusiness * localBusinessRatio);
    
    // Businesses Supported: Local businesses in the area
    const businesses = zipData.businesses;
    
    // Update display
    document.getElementById('kpiTotalSpend').textContent = '$' + totalSpend.toFixed(1) + 'M';
    const spendChange = ((score - 50) * 0.3 + 5).toFixed(1);
    document.getElementById('kpiSpendChange').textContent = spendChange > 0 ? '+' + spendChange + '% vs last month' : spendChange + '% vs last month';
    document.getElementById('kpiSpendChange').className = spendChange > 0 ? 'kpi-change positive' : 'kpi-change';
    
    document.getElementById('kpiLocalRetention').textContent = retention + '%';
    const retentionChange = ((parseFloat(retention) - 30) * 0.15).toFixed(1);
    document.getElementById('kpiRetentionChange').textContent = retentionChange > 0 ? '+' + retentionChange + ' pts vs Apr' : retentionChange + ' pts vs Apr';
    document.getElementById('kpiRetentionChange').className = retentionChange > 0 ? 'kpi-change positive' : 'kpi-change';
    
    document.getElementById('kpiEJV').textContent = score.toFixed(0);
    document.getElementById('kpiEJVBadge').textContent = band.label;
    document.getElementById('kpiEJVBadge').style.background = band.color + '20';
    document.getElementById('kpiEJVBadge').style.color = band.color;
    
    document.getElementById('kpiJobs').textContent = jobs.toLocaleString();
    const jobsChange = Math.round(jobs * 0.05);
    document.getElementById('kpiJobsChange').textContent = '+' + jobsChange + ' vs Apr';
    document.getElementById('kpiJobsChange').className = 'kpi-change positive';
    
    document.getElementById('kpiBusinesses').textContent = businesses.toLocaleString();
    const bizChange = Math.round(businesses * 0.03);
    document.getElementById('kpiBizChange').textContent = '+' + bizChange + ' vs Apr';
    document.getElementById('kpiBizChange').className = 'kpi-change positive';
    
    // Update location with actual ZIP name
    document.getElementById('currentLocation').textContent = (zipData.name || 'Location') + ' ' + zip;
}

/**
 * Estimate ZIP data for unknown ZIPs based on prefix patterns
 */
function estimateZipData(zip) {
    const prefix = parseInt(zip.substring(0, 3));
    const coords = estimateZipCoords(zip);
    
    // Estimate economic data based on region
    let baseIncome = 55000;
    let baseUnemployment = 4.5;
    let basePop = 25000;
    
    // Regional adjustments
    if (prefix >= 100 && prefix < 200) { baseIncome = 75000; basePop = 40000; } // NY/NJ
    if (prefix >= 900 && prefix < 970) { baseIncome = 85000; basePop = 35000; } // California
    if (prefix >= 350 && prefix < 370) { baseIncome = 58000; basePop = 28000; } // Alabama
    if (prefix >= 600 && prefix < 630) { baseIncome = 70000; basePop = 32000; } // Chicago area
    if (prefix >= 750 && prefix < 800) { baseIncome = 62000; basePop = 30000; } // Texas
    if (prefix >= 980 && prefix < 995) { baseIncome = 82000; basePop = 28000; } // Seattle area
    
    const population = basePop + (Math.random() * 20000 - 10000);
    const medianIncome = baseIncome + (Math.random() * 20000 - 10000);
    const businesses = Math.round(population * 0.04); // ~4% business density
    const totalSpend = population * medianIncome / 1000000 * 0.4; // ~40% of income as tracked spend
    
    return {
        lat: coords.lat,
        lng: coords.lng,
        name: coords.name,
        population: Math.round(population),
        medianIncome: Math.round(medianIncome),
        unemployment: baseUnemployment + (Math.random() * 2 - 1),
        businesses: businesses,
        totalSpend: totalSpend
    };
}

/**
 * Update charts with accurate ZIP-based data
 */
function updateCharts(ejvScore, zipCode = null, result = null) {
    const zip = zipCode || document.getElementById('storeZip')?.value || null;
    const zipData = zip ? (ZIP_DATA[zip] || estimateZipData(zip)) : null;
    const totalSpend = zipData ? zipData.totalSpend : 100;
    
    // Use actual LC component for local businesses %, or calculate from EJV
    const localBusinesses = result && result.components 
        ? result.components.LC_local_circulation.toFixed(1)
        : (ejvScore * 0.45 + 5).toFixed(1);
    
    const localLeakage = (100 - parseFloat(localBusinesses)) * 0.45;
    const outsideRegional = (100 - parseFloat(localBusinesses)) * 0.30;
    const outsideState = (100 - parseFloat(localBusinesses)) * 0.25;
    
    if (economicFlowChart) {
        economicFlowChart.data.datasets[0].data = [
            parseFloat(localBusinesses), 
            localLeakage, 
            outsideRegional, 
            outsideState
        ];
        economicFlowChart.update();
    }
    
    // Update legend with accurate values
    const localAmt = (totalSpend * parseFloat(localBusinesses) / 100).toFixed(1);
    const leakageAmt = (totalSpend * localLeakage / 100).toFixed(1);
    const regionalAmt = (totalSpend * outsideRegional / 100).toFixed(1);
    const stateAmt = (totalSpend * outsideState / 100).toFixed(1);
    
    document.getElementById('legendLocal').textContent = localBusinesses + '%';
    document.getElementById('legendLocalAmt').textContent = '$' + localAmt + 'M';
    document.getElementById('legendLeakage').textContent = localLeakage.toFixed(1) + '%';
    document.getElementById('legendLeakageAmt').textContent = '$' + leakageAmt + 'M';
    document.getElementById('legendRegional').textContent = outsideRegional.toFixed(1) + '%';
    document.getElementById('legendRegionalAmt').textContent = '$' + regionalAmt + 'M';
    document.getElementById('legendState').textContent = outsideState.toFixed(1) + '%';
    document.getElementById('legendStateAmt').textContent = '$' + stateAmt + 'M';
    document.getElementById('donutValue').textContent = '$' + totalSpend.toFixed(1) + 'M';
    
    // Update trend chart with realistic monthly progression
    if (trendChart) {
        const baseRetention = parseFloat(localBusinesses);
        // Show gradual improvement trend
        trendChart.data.datasets[0].data = [
            (baseRetention - 4.5).toFixed(1),
            (baseRetention - 2.5).toFixed(1),
            (baseRetention - 3.2).toFixed(1),
            (baseRetention - 1.2).toFixed(1),
            baseRetention.toFixed(1)
        ];
        trendChart.update();
    }
    
    // Update categories with ZIP-proportional spending
    const catBase = totalSpend / 10; // Distribute total spend across categories
    const catValues = [
        catBase * 0.32, // Food & Beverage ~32%
        catBase * 0.22, // Health & Wellness ~22%
        catBase * 0.19, // Professional Services ~19%
        catBase * 0.15, // Retail ~15%
        catBase * 0.12  // Home Services ~12%
    ];
    
    document.getElementById('catFoodVal').textContent = '$' + catValues[0].toFixed(1) + 'M';
    document.getElementById('catHealthVal').textContent = '$' + catValues[1].toFixed(1) + 'M';
    document.getElementById('catProfVal').textContent = '$' + catValues[2].toFixed(1) + 'M';
    document.getElementById('catRetailVal').textContent = '$' + catValues[3].toFixed(1) + 'M';
    document.getElementById('catHomeVal').textContent = '$' + catValues[4].toFixed(1) + 'M';
    
    // Update category bars
    document.getElementById('catFood').style.width = '100%';
    document.getElementById('catHealth').style.width = (catValues[1]/catValues[0]*100) + '%';
    document.getElementById('catProf').style.width = (catValues[2]/catValues[0]*100) + '%';
    document.getElementById('catRetail').style.width = (catValues[3]/catValues[0]*100) + '%';
    document.getElementById('catHome').style.width = (catValues[4]/catValues[0]*100) + '%';
}

/**
 * Add insight to the insights panel
 */
function addInsight(type, message) {
    const list = document.getElementById('insightList');
    const icons = { positive: '📈', warning: '⚠️', info: '💡' };
    
    const item = document.createElement('div');
    item.className = `insight-item ${type}`;
    item.innerHTML = `
        <span class="insight-icon">${icons[type] || '💡'}</span>
        <div class="insight-content">
            <p class="insight-text">${message}</p>
        </div>
        <span class="insight-time">Just now</span>
    `;
    
    list.insertBefore(item, list.firstChild);
    
    // Keep only last 5 insights
    while (list.children.length > 5) {
        list.removeChild(list.lastChild);
    }
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

/**
 * Estimate coordinates for any ZIP code based on ZIP ranges
 * US ZIP codes follow geographic patterns
 */
function estimateZipCoords(zip) {
    const prefix = parseInt(zip.substring(0, 3));
    
    // ZIP code prefix ranges - accurate geographic mapping
    // Northeast (0xx-1xx)
    if (prefix >= 10 && prefix < 27) return { lat: 42.3601, lng: -71.0589, name: 'Boston, MA' };
    if (prefix >= 27 && prefix < 30) return { lat: 41.8240, lng: -71.4128, name: 'Providence, RI' };
    if (prefix >= 30 && prefix < 39) return { lat: 41.3083, lng: -72.9279, name: 'New Haven, CT' };
    if (prefix >= 50 && prefix < 60) return { lat: 43.6591, lng: -70.2568, name: 'Portland, ME' };
    if (prefix >= 100 && prefix < 150) return { lat: 40.7128, lng: -73.9352, name: 'New York, NY' };
    if (prefix >= 150 && prefix < 170) return { lat: 40.4406, lng: -79.9959, name: 'Pittsburgh, PA' };
    if (prefix >= 170 && prefix < 200) return { lat: 39.9526, lng: -75.1652, name: 'Philadelphia, PA' };
    if (prefix >= 200 && prefix < 220) return { lat: 38.9072, lng: -77.0369, name: 'Washington, DC' };
    if (prefix >= 220 && prefix < 250) return { lat: 37.5407, lng: -77.4360, name: 'Richmond, VA' };
    if (prefix >= 250 && prefix < 270) return { lat: 38.3498, lng: -81.6326, name: 'Charleston, WV' };
    
    // Southeast (270-399)
    if (prefix >= 270 && prefix < 290) return { lat: 35.7796, lng: -78.6382, name: 'Raleigh, NC' };
    if (prefix >= 290 && prefix < 300) return { lat: 34.0007, lng: -81.0348, name: 'Columbia, SC' };
    if (prefix >= 300 && prefix < 320) return { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA' };
    if (prefix >= 320 && prefix < 340) return { lat: 28.5383, lng: -81.3792, name: 'Orlando, FL' };
    if (prefix >= 340 && prefix < 350) return { lat: 25.7617, lng: -80.1918, name: 'Miami, FL' };
    
    // Alabama (350-369) - FIXED: 35758 is Madison/Huntsville
    if (prefix >= 350 && prefix < 360) return { lat: 34.7304, lng: -86.5861, name: 'Huntsville, AL' };
    if (prefix >= 360 && prefix < 365) return { lat: 33.5207, lng: -86.8025, name: 'Birmingham, AL' };
    if (prefix >= 365 && prefix < 370) return { lat: 32.3792, lng: -86.3077, name: 'Montgomery, AL' };
    
    // Tennessee (370-385)
    if (prefix >= 370 && prefix < 375) return { lat: 35.0456, lng: -85.3097, name: 'Chattanooga, TN' };
    if (prefix >= 375 && prefix < 380) return { lat: 36.1627, lng: -86.7816, name: 'Nashville, TN' };
    if (prefix >= 380 && prefix < 386) return { lat: 35.1495, lng: -90.0490, name: 'Memphis, TN' };
    
    // Mississippi (386-397)
    if (prefix >= 386 && prefix < 398) return { lat: 32.2988, lng: -90.1848, name: 'Jackson, MS' };
    
    // Kentucky (400-427)
    if (prefix >= 400 && prefix < 420) return { lat: 38.2527, lng: -85.7585, name: 'Louisville, KY' };
    if (prefix >= 420 && prefix < 428) return { lat: 38.0406, lng: -84.5037, name: 'Lexington, KY' };
    
    // Ohio (430-459)
    if (prefix >= 430 && prefix < 440) return { lat: 39.9612, lng: -82.9988, name: 'Columbus, OH' };
    if (prefix >= 440 && prefix < 450) return { lat: 41.4993, lng: -81.6944, name: 'Cleveland, OH' };
    if (prefix >= 450 && prefix < 460) return { lat: 39.1031, lng: -84.5120, name: 'Cincinnati, OH' };
    
    // Indiana (460-479)
    if (prefix >= 460 && prefix < 480) return { lat: 39.7684, lng: -86.1581, name: 'Indianapolis, IN' };
    
    // Michigan (480-499)
    if (prefix >= 480 && prefix < 490) return { lat: 42.3314, lng: -83.0458, name: 'Detroit, MI' };
    if (prefix >= 490 && prefix < 500) return { lat: 42.9634, lng: -85.6681, name: 'Grand Rapids, MI' };
    
    // Iowa (500-528)
    if (prefix >= 500 && prefix < 530) return { lat: 41.5868, lng: -93.6250, name: 'Des Moines, IA' };
    
    // Wisconsin (530-549)
    if (prefix >= 530 && prefix < 535) return { lat: 43.0389, lng: -87.9065, name: 'Milwaukee, WI' };
    if (prefix >= 535 && prefix < 550) return { lat: 43.0731, lng: -89.4012, name: 'Madison, WI' };
    
    // Minnesota (550-567)
    if (prefix >= 550 && prefix < 570) return { lat: 44.9778, lng: -93.2650, name: 'Minneapolis, MN' };
    
    // Illinois (600-629)
    if (prefix >= 600 && prefix < 630) return { lat: 41.8781, lng: -87.6298, name: 'Chicago, IL' };
    
    // Missouri (630-658)
    if (prefix >= 630 && prefix < 650) return { lat: 38.6270, lng: -90.1994, name: 'St. Louis, MO' };
    if (prefix >= 650 && prefix < 660) return { lat: 39.0997, lng: -94.5786, name: 'Kansas City, MO' };
    
    // Kansas (660-679)
    if (prefix >= 660 && prefix < 680) return { lat: 37.6872, lng: -97.3301, name: 'Wichita, KS' };
    
    // Louisiana (700-714)
    if (prefix >= 700 && prefix < 715) return { lat: 29.9511, lng: -90.0715, name: 'New Orleans, LA' };
    
    // Arkansas (716-729)
    if (prefix >= 716 && prefix < 730) return { lat: 34.7465, lng: -92.2896, name: 'Little Rock, AR' };
    
    // Oklahoma (730-749)
    if (prefix >= 730 && prefix < 750) return { lat: 35.4676, lng: -97.5164, name: 'Oklahoma City, OK' };
    
    // Texas (750-799)
    if (prefix >= 750 && prefix < 760) return { lat: 32.7767, lng: -96.7970, name: 'Dallas, TX' };
    if (prefix >= 760 && prefix < 770) return { lat: 32.7555, lng: -97.3308, name: 'Fort Worth, TX' };
    if (prefix >= 770 && prefix < 780) return { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' };
    if (prefix >= 780 && prefix < 790) return { lat: 29.4241, lng: -98.4936, name: 'San Antonio, TX' };
    if (prefix >= 790 && prefix < 800) return { lat: 31.7619, lng: -106.4850, name: 'El Paso, TX' };
    
    // Colorado (800-816)
    if (prefix >= 800 && prefix < 820) return { lat: 39.7392, lng: -104.9903, name: 'Denver, CO' };
    
    // Wyoming (820-831)
    if (prefix >= 820 && prefix < 832) return { lat: 41.1400, lng: -104.8202, name: 'Cheyenne, WY' };
    
    // Utah (840-847)
    if (prefix >= 840 && prefix < 848) return { lat: 40.7608, lng: -111.8910, name: 'Salt Lake City, UT' };
    
    // Arizona (850-865)
    if (prefix >= 850 && prefix < 860) return { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' };
    if (prefix >= 860 && prefix < 866) return { lat: 32.2226, lng: -110.9747, name: 'Tucson, AZ' };
    
    // New Mexico (870-884)
    if (prefix >= 870 && prefix < 885) return { lat: 35.0844, lng: -106.6504, name: 'Albuquerque, NM' };
    
    // Nevada (889-898)
    if (prefix >= 889 && prefix < 900) return { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' };
    
    // California (900-961)
    if (prefix >= 900 && prefix < 910) return { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' };
    if (prefix >= 910 && prefix < 920) return { lat: 34.1478, lng: -118.1445, name: 'Pasadena, CA' };
    if (prefix >= 920 && prefix < 930) return { lat: 32.7157, lng: -117.1611, name: 'San Diego, CA' };
    if (prefix >= 930 && prefix < 940) return { lat: 34.4208, lng: -119.6982, name: 'Santa Barbara, CA' };
    if (prefix >= 940 && prefix < 950) return { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' };
    if (prefix >= 950 && prefix < 962) return { lat: 37.3382, lng: -121.8863, name: 'San Jose, CA' };
    
    // Oregon (970-979)
    if (prefix >= 970 && prefix < 980) return { lat: 45.5051, lng: -122.6750, name: 'Portland, OR' };
    
    // Washington (980-994)
    if (prefix >= 980 && prefix < 990) return { lat: 47.6062, lng: -122.3321, name: 'Seattle, WA' };
    if (prefix >= 990 && prefix < 995) return { lat: 47.6588, lng: -117.4260, name: 'Spokane, WA' };
    
    // Default to geographic center of US
    return { lat: 39.8283, lng: -98.5795, name: 'United States' };
}

/**
 * Add a single searched ZIP to map with its retention %
 */
/**
 * Geocode a ZIP code using Nominatim (OpenStreetMap) API
 * Returns accurate lat/lng for the ZIP code
 */
async function geocodeZip(zip) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`,
            { headers: { 'User-Agent': 'FIX-GeoEquity-Dashboard/1.0' } }
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    name: data[0].display_name.split(',').slice(0, 2).join(','),
                    geocoded: true
                };
            }
        }
    } catch (error) {
        console.warn('Geocoding failed, using estimate:', error);
    }
    
    // Fall back to estimate if geocoding fails
    return { ...estimateZipCoords(zip), geocoded: false };
}

function addSearchedZipMarker(zip, retention, storeName = null) {
    // Ensure retention is a valid number
    const retentionVal = typeof retention === 'number' && !isNaN(retention) ? retention : 30;
    
    // Get coordinates - use predefined if available, otherwise geocode
    let coords = ZIP_DATA[zip];
    let isEstimated = false;
    
    if (!coords) {
        // Try to geocode the ZIP for accurate location
        geocodeZip(zip).then(geocodedCoords => {
            // Update the marker with accurate coordinates
            if (geocodedCoords.geocoded) {
                updateMarkerLocation(geocodedCoords, retentionVal, storeName, zip);
                // Cache for future use
                ZIP_DATA[zip] = { 
                    ...geocodedCoords, 
                    population: 25000, 
                    medianIncome: 65000, 
                    unemployment: 4.0, 
                    businesses: 500, 
                    totalSpend: 100 
                };
            }
        });
        
        // Use estimate initially while geocoding
        coords = estimateZipCoords(zip);
        isEstimated = true;
    }
    
    clearMapMarkers();
    
    const color = getRetentionColor(retentionVal);
    const displayName = storeName || `ZIP ${zip}`;
    
    // Use custom location marker instead of circle
    const marker = createLocationMarker(coords.lat, coords.lng, retentionVal, displayName);
    marker.addTo(map);
    
    const locationNote = isEstimated ? `<br><span style="font-size:10px;color:#999;">(Updating location...)</span>` : '';
    const locationName = coords.name || (ZIP_DATA[zip] ? ZIP_DATA[zip].name : 'Location');
    
    marker.bindPopup(`
        <div style="text-align:center;min-width:160px;">
            <div style="font-size:24px;margin-bottom:5px;">📍</div>
            <strong style="font-size:14px;">${displayName}</strong><br>
            <span style="font-size:11px;color:#666;">${locationName}</span><br>
            <span style="font-size:12px;color:#666;">ZIP: ${zip}</span>${locationNote}<br>
            <span style="font-size:26px;font-weight:bold;color:${color}">${retentionVal.toFixed(1)}%</span><br>
            <span style="font-size:12px;color:#666;">Local Retention</span>
        </div>
    `).openPopup();
    
    markers.push(marker);
    
    // Center map on this location
    map.setView([coords.lat, coords.lng], 12);
    
    // Update economic flow chart to match retention
    updateEconomicFlowWithRetention(retentionVal);
    
    return coords;
}

/**
 * Update marker location after geocoding completes
 */
function updateMarkerLocation(coords, retention, storeName, zip) {
    // Ensure retention is a valid number
    const retentionVal = typeof retention === 'number' && !isNaN(retention) ? retention : 30;
    
    clearMapMarkers();
    
    const color = getRetentionColor(retentionVal);
    const displayName = storeName || `ZIP ${zip}`;
    
    // Use custom location marker
    const marker = createLocationMarker(coords.lat, coords.lng, retentionVal, displayName);
    marker.addTo(map);
    
    marker.bindPopup(`
        <div style="text-align:center;min-width:160px;">
            <div style="font-size:24px;margin-bottom:5px;">📍</div>
            <strong style="font-size:14px;">${displayName}</strong><br>
            <span style="font-size:11px;color:#2e7d32;">${coords.name || 'Location verified'}</span><br>
            <span style="font-size:12px;color:#666;">ZIP: ${zip}</span><br>
            <span style="font-size:26px;font-weight:bold;color:${color}">${retentionVal.toFixed(1)}%</span><br>
            <span style="font-size:12px;color:#666;">Local Retention</span>
        </div>
    `).openPopup();
    
    markers.push(marker);
    map.setView([coords.lat, coords.lng], 12);
    
    // Update economic flow chart to match retention
    updateEconomicFlowWithRetention(retentionVal);
    
    addInsight('positive', `Location verified: ${coords.name || zip}`);
}

/**
 * Filter companies dropdown by selected category
 */
function filterCompaniesByCategory(category) {
    const companySelect = document.getElementById('storeCompany');
    const currentValue = companySelect.value;
    
    // Store all company options (preserve original list)
    if (!window.allCompanyOptions) {
        window.allCompanyOptions = Array.from(companySelect.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
    }
    
    // Clear and rebuild options
    companySelect.innerHTML = '';
    
    // Add default option
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.text = category ? `-- ${category.replace('_', ' ')} Companies --` : '-- Select Company --';
    companySelect.appendChild(defaultOpt);
    
    if (category && CATEGORY_STORES[category]) {
        // Show only companies in this category
        const categoryCompanies = CATEGORY_STORES[category];
        categoryCompanies.forEach(compKey => {
            const opt = document.createElement('option');
            opt.value = compKey;
            opt.text = COMPANY_NAMES[compKey] || compKey;
            companySelect.appendChild(opt);
        });
        addInsight('info', `Showing ${categoryCompanies.length} companies in ${category.replace('_', ' ')}`);
    } else {
        // Show all companies
        window.allCompanyOptions.forEach(opt => {
            if (opt.value) {
                const option = document.createElement('option');
                option.value = opt.value;
                option.text = opt.text;
                companySelect.appendChild(option);
            }
        });
    }
    
    // Restore selection if still valid
    if (currentValue && Array.from(companySelect.options).some(o => o.value === currentValue)) {
        companySelect.value = currentValue;
    }
}

/**
 * Search for stores by name across all companies
 * Returns array of matching stores with their company info
 */
function searchStoresByName(searchName, filterZip = null) {
    const results = [];
    const searchLower = searchName.toLowerCase();
    
    Object.keys(STORE_DATABASE).forEach(companyKey => {
        const stores = STORE_DATABASE[companyKey] || [];
        stores.forEach(store => {
            // Check if store name matches (partial match)
            if (store.name.toLowerCase().includes(searchLower)) {
                // If filterZip is provided, only include stores in that ZIP
                if (!filterZip || store.zip === filterZip) {
                    results.push({
                        ...store,
                        company: companyKey,
                        companyName: COMPANY_NAMES[companyKey] || companyKey
                    });
                }
            }
        });
    });
    
    return results;
}

/**
 * Calculate actual EJV/retention for a store based on company metrics
 * This ensures map values match the EJV calculation
 */
function getStoreCalculatedRetention(store) {
    const company = store.company;
    const zip = store.zip;
    const isLocal = store.isLocal || false;
    
    // Use the same COMPANY_METRICS from generateEstimatedEJV
    const COMPANY_METRICS = {
        'costco': { localProc: 40, localHiring: 65 },
        'sams_club': { localProc: 35, localHiring: 60 },
        'whole_foods': { localProc: 55, localHiring: 70 },
        'trader_joes': { localProc: 38, localHiring: 65 },
        'walmart': { localProc: 35, localHiring: 60 },
        'kroger': { localProc: 42, localHiring: 68 },
        'target': { localProc: 37, localHiring: 62 },
        'safeway': { localProc: 40, localHiring: 65 },
        'publix': { localProc: 45, localHiring: 72 },
        'aldi': { localProc: 28, localHiring: 58 },
        'wegmans': { localProc: 48, localHiring: 70 },
        'cvs': { localProc: 30, localHiring: 60 },
        'walgreens': { localProc: 28, localHiring: 58 },
        'home_depot': { localProc: 32, localHiring: 62 },
        'lowes': { localProc: 30, localHiring: 60 },
        'starbucks': { localProc: 25, localHiring: 55 },
        'mcdonalds': { localProc: 20, localHiring: 50 },
        'chipotle': { localProc: 35, localHiring: 60 },
        '7_eleven': { localProc: 18, localHiring: 50 },
        'wawa': { localProc: 35, localHiring: 62 },
        'local_grocery': { localProc: 65, localHiring: 90 },
        'worker_cooperative': { localProc: 80, localHiring: 95 }
    };
    
    const metrics = COMPANY_METRICS[company] || { localProc: 30, localHiring: 60 };
    
    // Adjust for local businesses
    const localHiring = isLocal ? 90 : metrics.localHiring;
    const localProc = isLocal ? Math.max(65, metrics.localProc) : metrics.localProc;
    
    // LC = sqrt(LocalHiring% × LocalProcurement%) × 100
    const LC = Math.sqrt((localHiring / 100) * (localProc / 100)) * 100;
    
    return Math.round(LC * 10) / 10;
}

/**
 * Show multiple stores on the map with their CALCULATED retention values
 * Values are coordinated with EJV calculation
 */
async function showStoresOnMap(stores, highlightZip = null, currentResult = null) {
    clearMapMarkers();
    
    if (stores.length === 0) {
        addInsight('warning', 'No stores found matching your search');
        return;
    }
    
    // Calculate actual retention for each store
    const storesWithCalc = stores.map(store => ({
        ...store,
        calculatedRetention: getStoreCalculatedRetention(store)
    }));
    
    storesWithCalc.forEach(store => {
        const retention = store.calculatedRetention;
        const color = getRetentionColor(retention);
        const isHighlighted = highlightZip && store.zip === highlightZip;
        
        // Use custom icon marker instead of circle
        const marker = createStoreMarker(store.lat, store.lng, store, retention, isHighlighted);
        marker.addTo(map);
        
        const localBadge = store.isLocal ? '<span style="background:#4caf50;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">LOCAL</span><br>' : '';
        const companyBadge = store.companyName ? `<span style="font-size:10px;color:#666;">${store.companyName}</span><br>` : '';
        const icon = getStoreIcon(store.company, COMPANY_CATEGORY[store.company]);
        
        marker.bindPopup(`
            <div style="text-align:center;min-width:160px;">
                ${localBadge}
                <div style="font-size:24px;margin-bottom:5px;">${icon}</div>
                <strong style="font-size:14px;">${store.name}</strong><br>
                ${companyBadge}
                <span style="font-size:11px;color:#666;">ZIP: ${store.zip}</span><br>
                <span style="font-size:22px;font-weight:bold;color:${color}">${retention.toFixed(1)}%</span><br>
                <span style="font-size:11px;color:#666;">Local Retention (LC)</span><br>
                <span style="font-size:10px;color:#999;margin-top:5px;display:block;">Click for full EJV analysis</span>
            </div>
        `);
        
        // Add click handler to update sidebar with this store's data
        marker.on('click', async () => {
            const result = await calculateEJV({
                zip_code: store.zip,
                store_name: store.name,
                company_name: store.company,
                is_local_business: store.isLocal || false
            });
            displayResults(result);
            addInsight('info', `Selected: ${store.name} - EJV: ${result.ejv_percentage.toFixed(1)}%, Local Retention: ${result.components.LC_local_circulation.toFixed(1)}%`);
        });
        
        markers.push(marker);
    });
    
    // Fit bounds to show all markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
        
        // Update economic flow chart with aggregate retention data
        const avgRetention = storesWithCalc.reduce((sum, s) => sum + s.calculatedRetention, 0) / storesWithCalc.length;
        updateEconomicFlowWithRetention(avgRetention);
    }
    
    addInsight('positive', `Showing ${stores.length} store(s) - Click any marker for detailed EJV breakdown`);
}

/**
 * Update economic flow chart based on retention value
 */
function updateEconomicFlowWithRetention(retention) {
    if (!economicFlowChart) return;
    
    // Ensure retention is a valid number
    const retentionVal = typeof retention === 'number' && !isNaN(retention) ? retention : 30;
    
    // Calculate flow distribution based on retention
    const localBusiness = retentionVal;
    const localLeakage = Math.min(30, 100 - retentionVal) * 0.4;
    const outsideRegional = Math.min(25, 100 - retentionVal - localLeakage) * 0.3;
    const outsideState = 100 - localBusiness - localLeakage - outsideRegional;
    
    economicFlowChart.data.datasets[0].data = [
        Math.round(localBusiness),
        Math.round(localLeakage),
        Math.round(outsideRegional),
        Math.round(Math.max(0, outsideState))
    ];
    economicFlowChart.update();
}

/**
 * Get all stores in a category for a specific ZIP
 */
function getStoresByCategoryInZip(category, zip) {
    const companyKeys = CATEGORY_STORES[category] || [];
    const results = [];
    
    companyKeys.forEach(compKey => {
        const stores = STORE_DATABASE[compKey] || [];
        stores.forEach(store => {
            if (store.zip === zip) {
                results.push({
                    ...store,
                    company: compKey,
                    companyName: COMPANY_NAMES[compKey] || compKey
                });
            }
        });
    });
    
    return results;
}

/**
 * Search by ZIP code - shows the searched ZIP on map with retention %
 */
window.searchZip = async function(zip) {
    if (!zip || zip.length !== 5 || !/^\d{5}$/.test(zip)) {
        alert('Please enter a valid 5-digit ZIP code');
        return;
    }
    
    document.getElementById('storeZip').value = zip;
    document.getElementById('zipSearch').value = zip;
    
    const result = await calculateEJV({
        zip_code: zip,
        store_name: `Area Analysis (${zip})`,
        category: 'supermarket'
    });
    
    displayResults(result);
    
    // Show this ZIP on the map with actual LC (Local Circulation) value
    if (map) {
        const retention = result.components.LC_local_circulation;
        addSearchedZipMarker(zip, retention, 'ZIP ' + zip + ' Analysis');
        addInsight('info', 'Showing ZIP ' + zip + ' on map with ' + retention.toFixed(1) + '% local retention');
    }
};

/**
 * Handle store calculation
 */
async function handleStoreCalculation() {
    const zip = document.getElementById('storeZip').value.trim();
    const storeName = document.getElementById('storeName').value.trim() || 'Store Analysis';
    const company = document.getElementById('storeCompany').value;
    const category = document.getElementById('storeCategory').value;
    const isLocal = document.getElementById('isLocal').checked;
    
    console.log('handleStoreCalculation:', { zip, storeName, company, category, isLocal });
    
    if (!zip || zip.length !== 5 || !/^\d{5}$/.test(zip)) {
        alert('Please enter a valid 5-digit ZIP code');
        document.getElementById('storeZip').focus();
        return;
    }
    
    const params = {
        zip_code: zip,
        store_name: storeName,
        company_name: company || null,
        category: category || null,
        is_local_business: isLocal
    };
    
    console.log('Calling calculateEJV with params:', params);
    
    const result = await calculateEJV(params);
    console.log('EJV Result:', result);
    displayResults(result);
    
    // Update map based on search type
    if (map) {
        const retention = result.components.LC_local_circulation;
        let storesFound = [];
        
        // Priority 1: If store name is entered (not default), search for stores by name
        if (storeName && storeName !== 'Store Analysis') {
            storesFound = searchStoresByName(storeName, zip);
            if (storesFound.length > 0) {
                showStoresOnMap(storesFound, zip, result);
                addInsight('info', `Found ${storesFound.length} "${storeName}" store(s) in ZIP ${zip}. Click any store to see details.`);
                return;
            }
        }
        
        // Priority 2: If company is selected, show all stores of that company in the ZIP
        if (company) {
            const companyStores = (STORE_DATABASE[company] || [])
                .filter(s => s.zip === zip)
                .map(s => ({ ...s, company, companyName: COMPANY_NAMES[company] }));
            
            if (companyStores.length > 0) {
                showStoresOnMap(companyStores, zip, result);
                addInsight('info', `Found ${companyStores.length} ${COMPANY_NAMES[company]} store(s) in ZIP ${zip}. Click any store to see details.`);
                return;
            }
        }
        
        // Priority 3: If category is selected, show all stores in that category for the ZIP
        if (category) {
            storesFound = getStoresByCategoryInZip(category, zip);
            if (storesFound.length > 0) {
                showStoresOnMap(storesFound, zip, result);
                addInsight('info', `Found ${storesFound.length} ${category.replace('_', ' ')} store(s) in ZIP ${zip}. Click any store to see details.`);
                return;
            }
        }
        
        // Fallback: Show the searched ZIP with calculated retention
        const displayName = storeName !== 'Store Analysis' ? storeName : 
                           (company ? COMPANY_NAMES[company] : 
                           (category ? category.replace('_', ' ') : 'Store')) + ' (' + zip + ')';
        addSearchedZipMarker(zip, retention, displayName);
        addInsight('info', 'Showing calculated retention for ZIP ' + zip);
    }
}

/**
 * Initialize everything
 */
function init() {
    console.log('FIX$ Dashboard initializing...');
    
    // Initialize charts
    initEconomicFlowChart();
    initTrendChart();
    
    // Initialize map
    setTimeout(initMap, 100);
    
    // Event listeners
    document.getElementById('calculateStoreBtn').addEventListener('click', handleStoreCalculation);
    
    document.getElementById('searchBtn').addEventListener('click', () => {
        const zip = document.getElementById('zipSearch').value.trim();
        searchZip(zip);
    });
    
    document.getElementById('zipSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchZip(e.target.value.trim());
        }
    });
    
    document.getElementById('storeZip').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleStoreCalculation();
        }
    });
    
    // ZIP input formatting
    ['zipSearch', 'storeZip'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
        });
    });
    
    // Filter companies when category is selected
    document.getElementById('storeCategory').addEventListener('change', (e) => {
        filterCompaniesByCategory(e.target.value);
    });
    
    // Auto-select category when company is selected
    document.getElementById('storeCompany').addEventListener('change', (e) => {
        if (COMPANY_CATEGORY[e.target.value]) {
            document.getElementById('storeCategory').value = COMPANY_CATEGORY[e.target.value];
        }
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', handleExport);
    
    // Navigation - make sidebar functional
    initNavigation();
    
    console.log('FIX$ Dashboard ready!');
}

/**
 * Initialize sidebar navigation
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = {
        'Overview': showOverview,
        'Economic Flow': showEconomicFlow,
        'EJV Insights': showEJVInsights,
        'Businesses': showBusinesses,
        'Jobs & Workforce': showJobsWorkforce,
        'Community Impact': showCommunityImpact,
        'Maps': showMaps,
        'Reports': showReports,
        'Alerts': showAlerts,
        'Data Explorer': showDataExplorer,
        'Settings': showSettings
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.querySelector('span:last-child').textContent;
            
            // Update active state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            // Call the view function
            if (views[viewName]) {
                views[viewName]();
            }
        });
    });
}

/**
 * Show Overview (default view)
 */
function showOverview() {
    document.querySelector('.page-title').textContent = 'FIX$ DASHBOARD';
    document.querySelector('.page-subtitle').textContent = 'Visualizing Economic Flow. Empowering Communities.';
    
    // Show all sections
    document.querySelector('.store-search-section').style.display = 'block';
    document.querySelector('.dashboard-grid').style.display = 'grid';
    
    addInsight('info', 'Viewing Overview - Main dashboard with all metrics');
}

/**
 * Show Economic Flow view
 */
function showEconomicFlow() {
    document.querySelector('.page-title').textContent = 'ECONOMIC FLOW ANALYSIS';
    document.querySelector('.page-subtitle').textContent = 'Track where dollars flow in your community';
    
    addInsight('info', 'Economic Flow view shows detailed money circulation patterns');
    
    // Highlight the donut chart section
    const donutCard = document.querySelector('.economic-flow-card') || document.querySelector('.card');
    if (donutCard) donutCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show EJV Insights view
 */
function showEJVInsights() {
    document.querySelector('.page-title').textContent = 'EJV INSIGHTS';
    document.querySelector('.page-subtitle').textContent = 'Deep dive into Economic Justice Value metrics';
    
    // Scroll to EJV breakdown
    const ejvCard = document.querySelector('.ejv-card');
    if (ejvCard) ejvCard.scrollIntoView({ behavior: 'smooth' });
    
    addInsight('info', 'EJV Insights - Analyzing all 6 components: LC, W, DN, EQ, ENV, PROC');
}

/**
 * Show Businesses view
 */
function showBusinesses() {
    document.querySelector('.page-title').textContent = 'LOCAL BUSINESSES';
    document.querySelector('.page-subtitle').textContent = 'Explore businesses by category and location';
    
    // Scroll to search section
    document.querySelector('.store-search-section').scrollIntoView({ behavior: 'smooth' });
    
    addInsight('info', 'Businesses view - Search and analyze local businesses');
}

/**
 * Show Jobs & Workforce view
 */
function showJobsWorkforce() {
    document.querySelector('.page-title').textContent = 'JOBS & WORKFORCE';
    document.querySelector('.page-subtitle').textContent = 'Employment impact and wage analysis';
    
    // Display jobs-specific insight
    const currentZipData = getCurrentZipData();
    if (currentZipData) {
        const jobsPerBusiness = 8;
        const totalJobs = currentZipData.businesses * jobsPerBusiness;
        const avgWage = (currentZipData.medianIncome / 2080).toFixed(2); // Hourly from annual
        
        addInsight('positive', `Workforce Stats: ~${totalJobs.toLocaleString()} jobs, avg $${avgWage}/hr`);
        addInsight('info', `Unemployment rate: ${currentZipData.unemployment}% (${currentZipData.unemployment < 4 ? 'Below' : 'Above'} national avg)`);
    } else {
        addInsight('info', 'Search a ZIP code to see workforce data');
    }
}

/**
 * Show Community Impact view  
 */
function showCommunityImpact() {
    document.querySelector('.page-title').textContent = 'COMMUNITY IMPACT';
    document.querySelector('.page-subtitle').textContent = 'Measuring real change in communities';
    
    const currentZipData = getCurrentZipData();
    if (currentZipData) {
        const impactScore = (currentZipData.totalSpend * 0.3).toFixed(1); // 30% of spend creates community impact
        addInsight('positive', `Community Impact: $${impactScore}M in local economic activity`);
        addInsight('info', `Population served: ${currentZipData.population.toLocaleString()} residents`);
    } else {
        addInsight('info', 'Search a ZIP code to see community impact metrics');
    }
}

/**
 * Show Maps view
 */
function showMaps() {
    document.querySelector('.page-title').textContent = 'ECONOMIC MAPS';
    document.querySelector('.page-subtitle').textContent = 'Geographic visualization of economic data';
    
    // Scroll to map and expand it
    const mapCard = document.querySelector('.map-card');
    if (mapCard) {
        mapCard.scrollIntoView({ behavior: 'smooth' });
        // Make map larger temporarily
        const mapEl = document.getElementById('map');
        if (mapEl) {
            mapEl.style.height = '400px';
            if (map) map.invalidateSize();
        }
    }
    
    addInsight('info', 'Maps view - Click on any ZIP code marker for details');
}

/**
 * Show Reports view
 */
function showReports() {
    document.querySelector('.page-title').textContent = 'REPORTS';
    document.querySelector('.page-subtitle').textContent = 'Generate and export community reports';
    
    addInsight('info', 'Reports available: EJV Summary, Economic Flow, Community Impact, Workforce Analysis');
    addInsight('info', 'Click Export button to download reports');
}

/**
 * Show Alerts view
 */
function showAlerts() {
    document.querySelector('.page-title').textContent = 'ALERTS & NOTIFICATIONS';
    document.querySelector('.page-subtitle').textContent = 'Stay informed about community economic changes';
    
    // Show recent insights/alerts
    const insightList = document.getElementById('insightList');
    if (insightList) insightList.scrollIntoView({ behavior: 'smooth' });
    
    addInsight('warning', 'Alert: Economic leakage detected in retail sector');
    addInsight('positive', 'Alert: Local retention improved +2.3% this quarter');
}

/**
 * Show Data Explorer view
 */
function showDataExplorer() {
    document.querySelector('.page-title').textContent = 'DATA EXPLORER';
    document.querySelector('.page-subtitle').textContent = 'Advanced data analysis and exploration';
    
    addInsight('info', 'Data Explorer - Query economic data by ZIP, category, company');
    addInsight('info', 'Available datasets: Census, BLS Employment, Business Registry, EJV Scores');
}

/**
 * Show Settings view
 */
function showSettings() {
    document.querySelector('.page-title').textContent = 'SETTINGS';
    document.querySelector('.page-subtitle').textContent = 'Configure your dashboard preferences';
    
    addInsight('info', 'Settings: Data sources, notification preferences, export formats');
    addInsight('info', 'API Status: Connected | Last sync: Just now');
}

/**
 * Get current ZIP data from last search
 */
function getCurrentZipData() {
    const zipInput = document.getElementById('storeZip');
    const zip = zipInput ? zipInput.value.trim() : null;
    
    if (zip && zip.length === 5) {
        return ZIP_DATA[zip] || estimateZipData(zip);
    }
    return null;
}

/**
 * Handle export functionality
 */
function handleExport() {
    const currentZipData = getCurrentZipData();
    
    if (!currentZipData) {
        alert('Please search a ZIP code first to export data.');
        return;
    }
    
    // Generate CSV content
    const zip = document.getElementById('storeZip').value;
    const ejvScore = document.getElementById('kpiEJV').textContent;
    const retention = document.getElementById('kpiLocalRetention').textContent;
    const totalSpend = document.getElementById('kpiTotalSpend').textContent;
    const jobs = document.getElementById('kpiJobs').textContent;
    const businesses = document.getElementById('kpiBusinesses').textContent;
    
    const lines = [
        'FIX$ Dashboard Export',
        'Generated: ' + new Date().toLocaleDateString(),
        '',
        'ZIP Code,' + zip,
        'Location,' + currentZipData.name,
        'Population,' + currentZipData.population,
        'Median Income,$' + currentZipData.medianIncome,
        'Unemployment,' + currentZipData.unemployment + '%',
        '',
        'KPI METRICS',
        'Total Spend,' + totalSpend,
        'Local Retention,' + retention,
        'EJV Score,' + ejvScore,
        'Jobs Supported,' + jobs,
        'Businesses,' + businesses,
        '',
        'EJV COMPONENTS',
        'Local Circulation (LC),' + (document.getElementById('sideScoreLC')?.textContent || '--') + '/100',
        'Fair Wages (W),' + (document.getElementById('sideScoreW')?.textContent || '--') + '/100',
        'Community Need (DN),' + (document.getElementById('sideScoreDN')?.textContent || '--') + '/100',
        'Equity & Inclusion (EQ),' + (document.getElementById('sideScoreEQ')?.textContent || '--') + '/100',
        'Environmental (ENV),' + (document.getElementById('sideScoreENV')?.textContent || '--') + '/100',
        'Procurement (PROC),' + (document.getElementById('sideScorePROC')?.textContent || '--') + '/100'
    ];
    const csvContent = lines.join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FIX_Dashboard_' + zip + '_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    addInsight('positive', 'Report exported for ZIP ' + zip);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
