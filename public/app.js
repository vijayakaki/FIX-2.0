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

// ZIP code coordinates with base retention data (Memphis area focus)
const ZIP_COORDS = {
    '38126': { lat: 35.1175, lng: -90.0568, name: 'Memphis, TN', retention: 33 },
    '38108': { lat: 35.1595, lng: -89.9711, name: 'Memphis, TN', retention: 28 },
    '38127': { lat: 35.2270, lng: -89.9711, name: 'Memphis, TN', retention: 31 },
    '38107': { lat: 35.1684, lng: -90.0350, name: 'Memphis, TN', retention: 29 },
    '38112': { lat: 35.1495, lng: -89.9423, name: 'Memphis, TN', retention: 27 },
    '38114': { lat: 35.1084, lng: -89.9923, name: 'Memphis, TN', retention: 26 },
    '38106': { lat: 35.0984, lng: -90.0368, name: 'Memphis, TN', retention: 30 },
    '10001': { lat: 40.7506, lng: -73.9971, name: 'New York, NY', retention: 35 },
    '10002': { lat: 40.7157, lng: -73.9863, name: 'New York, NY', retention: 32 },
    '10003': { lat: 40.7317, lng: -73.9892, name: 'New York, NY', retention: 38 },
    '90210': { lat: 34.0901, lng: -118.4065, name: 'Beverly Hills, CA', retention: 42 },
    '60601': { lat: 41.8819, lng: -87.6278, name: 'Chicago, IL', retention: 30 },
    '30301': { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA', retention: 28 },
    '77001': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX', retention: 25 },
    '85001': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ', retention: 29 },
    'default': { lat: 39.8283, lng: -98.5795, name: 'United States', retention: 30 }
};

// Store database with locations (simulated data for each ZIP)
const STORE_DATABASE = {
    // Supermarkets
    'costco': [
        { zip: '38126', name: 'Costco Memphis', retention: 38, lat: 35.1175, lng: -90.0568 },
        { zip: '38127', name: 'Costco North Memphis', retention: 36, lat: 35.2270, lng: -89.9711 }
    ],
    'whole_foods': [
        { zip: '38117', name: 'Whole Foods East Memphis', retention: 45, lat: 35.1195, lng: -89.9023 },
        { zip: '38112', name: 'Whole Foods Midtown', retention: 48, lat: 35.1495, lng: -89.9423 }
    ],
    'trader_joes': [
        { zip: '38117', name: "Trader Joe's Poplar", retention: 42, lat: 35.1185, lng: -89.9103 }
    ],
    'walmart': [
        { zip: '38126', name: 'Walmart Supercenter', retention: 22, lat: 35.1155, lng: -90.0508 },
        { zip: '38108', name: 'Walmart Neighborhood', retention: 24, lat: 35.1595, lng: -89.9711 },
        { zip: '38127', name: 'Walmart Frayser', retention: 21, lat: 35.2270, lng: -89.9611 }
    ],
    'kroger': [
        { zip: '38126', name: 'Kroger Downtown', retention: 28, lat: 35.1145, lng: -90.0528 },
        { zip: '38112', name: 'Kroger Union Ave', retention: 32, lat: 35.1495, lng: -89.9523 },
        { zip: '38107', name: 'Kroger Chelsea', retention: 30, lat: 35.1684, lng: -90.0350 }
    ],
    'target': [
        { zip: '38117', name: 'Target Poplar', retention: 26, lat: 35.1190, lng: -89.8923 },
        { zip: '38138', name: 'Target Germantown', retention: 29, lat: 35.0867, lng: -89.7970 }
    ],
    'cvs': [
        { zip: '38126', name: 'CVS Pharmacy', retention: 35, lat: 35.1165, lng: -90.0548 },
        { zip: '38108', name: 'CVS Frayser', retention: 33, lat: 35.1605, lng: -89.9731 }
    ],
    'walgreens': [
        { zip: '38126', name: 'Walgreens', retention: 32, lat: 35.1185, lng: -90.0588 },
        { zip: '38112', name: 'Walgreens Midtown', retention: 34, lat: 35.1505, lng: -89.9443 }
    ],
    'home_depot': [
        { zip: '38118', name: 'Home Depot S Memphis', retention: 24, lat: 35.0284, lng: -89.9423 },
        { zip: '38134', name: 'Home Depot Bartlett', retention: 26, lat: 35.2045, lng: -89.8623 }
    ],
    'lowes': [
        { zip: '38115', name: "Lowe's Hickory Hill", retention: 25, lat: 35.0595, lng: -89.8911 }
    ],
    'starbucks': [
        { zip: '38126', name: 'Starbucks Downtown', retention: 28, lat: 35.1195, lng: -90.0518 },
        { zip: '38103', name: 'Starbucks Beale St', retention: 30, lat: 35.1398, lng: -90.0534 },
        { zip: '38112', name: 'Starbucks Overton', retention: 32, lat: 35.1485, lng: -89.9403 }
    ],
    'mcdonalds': [
        { zip: '38126', name: "McDonald's Downtown", retention: 18, lat: 35.1155, lng: -90.0538 },
        { zip: '38108', name: "McDonald's Frayser", retention: 16, lat: 35.1585, lng: -89.9701 }
    ],
    'chipotle': [
        { zip: '38117', name: 'Chipotle East Memphis', retention: 26, lat: 35.1195, lng: -89.9053 }
    ],
    'local_grocery': [
        { zip: '38126', name: 'Soulsville Grocery Co-op', retention: 72, lat: 35.1135, lng: -90.0548, isLocal: true },
        { zip: '38108', name: 'Memphis Urban Farms Market', retention: 78, lat: 35.1615, lng: -89.9721, isLocal: true },
        { zip: '38107', name: 'North Memphis Food Hub', retention: 68, lat: 35.1704, lng: -90.0330, isLocal: true }
    ],
    'worker_cooperative': [
        { zip: '38126', name: 'Community Ownership Co-op', retention: 85, lat: 35.1125, lng: -90.0558, isLocal: true }
    ]
};

// Category to stores mapping
const CATEGORY_STORES = {
    'supermarket': ['walmart', 'kroger', 'whole_foods', 'trader_joes'],
    'warehouse_club': ['costco'],
    'department_store': ['target'],
    'pharmacy': ['cvs', 'walgreens'],
    'home_improvement': ['home_depot', 'lowes'],
    'coffee_shop': ['starbucks'],
    'fast_food': ['mcdonalds'],
    'fast_casual': ['chipotle'],
    'local_grocery': ['local_grocery'],
    'worker_cooperative': ['worker_cooperative']
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
 * Initialize Leaflet Map - Memphis area focus like dashboard image
 */
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || map) return;
    
    // Center on Memphis, TN as shown in dashboard image
    map = L.map('map').setView([35.1495, -89.9711], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    // Show Memphis ZIP codes with Local Retention % by default
    addZipMarkers(['38126', '38108', '38127', '38107', '38112', '38114', '38106']);
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
 * Add ZIP code markers to map with Local Retention %
 */
function addZipMarkers(zipCodes) {
    // Clear existing markers
    clearMapMarkers();
    
    zipCodes.forEach(zip => {
        const coords = ZIP_COORDS[zip] || ZIP_COORDS.default;
        const retention = coords.retention || 30;
        const color = getRetentionColor(retention);
        
        const marker = L.circleMarker([coords.lat, coords.lng], {
            radius: 28,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="text-align:center;min-width:120px;">
                <strong style="font-size:14px;">ZIP: ${zip}</strong><br>
                <span style="font-size:18px;font-weight:bold;color:${color}">${retention}%</span><br>
                <span style="font-size:12px;color:#666;">Local Retention</span><br>
                <a href="#" onclick="searchZip('${zip}');return false;" style="color:#2d5a27;">View Details →</a>
            </div>
        `);
        
        // Permanent label showing ZIP and retention %
        marker.bindTooltip(`<b>${zip}</b><br>${retention}%`, {
            permanent: true,
            direction: 'center',
            className: 'zip-tooltip'
        });
        
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
        const color = getRetentionColor(store.retention);
        const isHighlighted = highlightZip && store.zip === highlightZip;
        
        const marker = L.circleMarker([store.lat, store.lng], {
            radius: isHighlighted ? 32 : 26,
            fillColor: color,
            color: isHighlighted ? '#1a3d16' : '#fff',
            weight: isHighlighted ? 3 : 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);
        
        const localBadge = store.isLocal ? '<span style="background:#4caf50;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">LOCAL</span><br>' : '';
        
        marker.bindPopup(`
            <div style="text-align:center;min-width:150px;">
                ${localBadge}
                <strong style="font-size:13px;">${store.name}</strong><br>
                <span style="font-size:11px;color:#666;">ZIP: ${store.zip}</span><br>
                <span style="font-size:20px;font-weight:bold;color:${color}">${store.retention}%</span><br>
                <span style="font-size:11px;color:#666;">Local Retention</span>
            </div>
        `);
        
        // Permanent label
        marker.bindTooltip(`<b>${store.name.split(' ')[0]}</b><br>${store.retention}%`, {
            permanent: true,
            direction: 'center',
            className: 'zip-tooltip'
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
        filteredStores = stores.filter(s => s.zip === filterZip);
        // If no stores in that exact ZIP, show all within range
        if (filteredStores.length === 0) {
            filteredStores = stores;
        }
    }
    
    if (filteredStores.length > 0) {
        addStoreMarkers(filteredStores, filterZip);
        addInsight('info', `Showing ${filteredStores.length} ${companyKey.replace('_', ' ')} location(s) on map`);
    } else {
        addInsight('warning', `No ${companyKey.replace('_', ' ')} stores found in database`);
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
 */
function generateEstimatedEJV(params) {
    const isLocal = params.is_local_business;
    const company = params.company_name;
    
    // Base scores vary by company/category
    let baseLC = 30 + Math.random() * 20;
    let baseW = 60 + Math.random() * 30;
    let baseDN = 30 + Math.random() * 40;
    let baseEQ = isLocal ? 65 : 50 + Math.random() * 25;
    let baseENV = 30 + Math.random() * 35;
    let basePROC = isLocal ? 55 : 25 + Math.random() * 30;
    
    // Adjust for known companies
    const companyBoosts = {
        'costco': { W: 20, EQ: 15, ENV: 10 },
        'whole_foods': { ENV: 20, PROC: 15 },
        'walmart': { W: -10 },
        'trader_joes': { EQ: 10, W: 15 },
        'worker_cooperative': { LC: 30, EQ: 40, PROC: 30 }
    };
    
    if (company && companyBoosts[company]) {
        const boost = companyBoosts[company];
        baseW += boost.W || 0;
        baseEQ += boost.EQ || 0;
        baseENV += boost.ENV || 0;
        basePROC += boost.PROC || 0;
        baseLC += boost.LC || 0;
    }
    
    // Clamp values
    const LC = Math.min(100, Math.max(0, baseLC));
    const W = Math.min(100, Math.max(0, baseW));
    const DN = Math.min(100, Math.max(0, baseDN));
    const EQ = Math.min(100, Math.max(0, baseEQ));
    const ENV = Math.min(100, Math.max(0, baseENV));
    const PROC = Math.min(100, Math.max(0, basePROC));
    
    const ejvScore = (LC + W + DN + EQ + ENV + PROC) / 6;
    
    return {
        store_name: params.store_name || 'Store',
        zip_code: params.zip_code,
        ejv_percentage: ejvScore,
        ejv_score: ejvScore / 100,
        components: {
            LC_local_circulation: LC,
            W_fair_wages: W,
            DN_community_need: DN,
            EQ_equity_inclusion: EQ,
            ENV_environmental: ENV,
            PROC_procurement: PROC
        },
        ejv_display: {
            primary: getImpactBand(ejvScore),
            tertiary: { display: `≈ $${(ejvScore / 10).toFixed(2)} of every $10 stays local` }
        },
        economic_impact: {
            elvr: ejvScore,
            evl: 100 - ejvScore
        },
        component_details: {
            local_circulation: { local_hiring_percent: 60, local_procurement_percent: LC * 0.7 },
            fair_wages: { store_wage: 16.50, living_wage: 14.00 },
            community_need: { unemployment_rate: 5.5, median_income: 55000 }
        }
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
    
    // Update charts
    updateCharts(score);
    
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
 * Update KPI cards
 */
function updateKPIs(result) {
    const score = result.ejv_percentage;
    const band = getImpactBand(score);
    
    // Simulate spending data based on score
    const totalSpend = (score * 1.5 + 50).toFixed(1);
    const retention = score * 0.5;
    const jobs = Math.floor(score * 30 + 500);
    const businesses = Math.floor(score * 12 + 200);
    
    document.getElementById('kpiTotalSpend').textContent = `$${totalSpend}M`;
    document.getElementById('kpiSpendChange').textContent = `+${(Math.random() * 15 + 5).toFixed(1)}% vs last month`;
    
    document.getElementById('kpiLocalRetention').textContent = `${retention.toFixed(1)}%`;
    document.getElementById('kpiRetentionChange').textContent = `+${(Math.random() * 5).toFixed(1)} pts`;
    document.getElementById('kpiRetentionChange').className = 'kpi-change positive';
    
    document.getElementById('kpiEJV').textContent = score.toFixed(0);
    document.getElementById('kpiEJVBadge').textContent = band.label;
    document.getElementById('kpiEJVBadge').style.background = band.color + '20';
    document.getElementById('kpiEJVBadge').style.color = band.color;
    
    document.getElementById('kpiJobs').textContent = jobs.toLocaleString();
    document.getElementById('kpiJobsChange').textContent = `+${Math.floor(Math.random() * 200 + 50)} vs last month`;
    document.getElementById('kpiJobsChange').className = 'kpi-change positive';
    
    document.getElementById('kpiBusinesses').textContent = businesses.toLocaleString();
    document.getElementById('kpiBizChange').textContent = `+${Math.floor(Math.random() * 80 + 20)} vs last month`;
    document.getElementById('kpiBizChange').className = 'kpi-change positive';
    
    // Update location
    const coords = ZIP_COORDS[result.zip_code] || ZIP_COORDS.default;
    document.getElementById('currentLocation').textContent = `${coords.name} ${result.zip_code}`;
}

/**
 * Update charts with new data
 */
function updateCharts(ejvScore) {
    // Update economic flow chart
    const localPct = ejvScore * 0.5;
    const leakagePct = 100 - localPct;
    const regional = leakagePct * 0.35;
    const outside = leakagePct * 0.3;
    const state = leakagePct * 0.35;
    
    if (economicFlowChart) {
        economicFlowChart.data.datasets[0].data = [localPct, leakagePct - regional - outside, regional, outside];
        economicFlowChart.update();
    }
    
    // Update legend
    const total = 100 + ejvScore;
    document.getElementById('legendLocal').textContent = `${localPct.toFixed(1)}%`;
    document.getElementById('legendLocalAmt').textContent = `$${(total * localPct / 100).toFixed(1)}M`;
    document.getElementById('donutValue').textContent = `$${total.toFixed(0)}M`;
    
    // Update trend chart with randomized recent data
    if (trendChart) {
        const baseValue = ejvScore * 0.45;
        trendChart.data.datasets[0].data = [
            baseValue - 5 + Math.random() * 3,
            baseValue - 3 + Math.random() * 3,
            baseValue - 2 + Math.random() * 3,
            baseValue + Math.random() * 3,
            localPct
        ];
        trendChart.update();
    }
    
    // Update categories
    const catValues = [14.2, 9.6, 8.3, 6.7, 4.9].map(v => v * ejvScore / 70);
    document.getElementById('catFoodVal').textContent = `$${catValues[0].toFixed(1)}M`;
    document.getElementById('catHealthVal').textContent = `$${catValues[1].toFixed(1)}M`;
    document.getElementById('catProfVal').textContent = `$${catValues[2].toFixed(1)}M`;
    document.getElementById('catRetailVal').textContent = `$${catValues[3].toFixed(1)}M`;
    document.getElementById('catHomeVal').textContent = `$${catValues[4].toFixed(1)}M`;
    
    // Update category bars
    document.getElementById('catFood').style.width = '100%';
    document.getElementById('catHealth').style.width = `${catValues[1]/catValues[0]*100}%`;
    document.getElementById('catProf').style.width = `${catValues[2]/catValues[0]*100}%`;
    document.getElementById('catRetail').style.width = `${catValues[3]/catValues[0]*100}%`;
    document.getElementById('catHome').style.width = `${catValues[4]/catValues[0]*100}%`;
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
    
    // ZIP code prefix ranges to approximate lat/lng
    // Northeast (0xx-2xx)
    if (prefix >= 0 && prefix < 100) return { lat: 42.3 + Math.random() * 2, lng: -71.0 + Math.random() * 2, name: 'Northeast' };
    if (prefix >= 100 && prefix < 200) return { lat: 40.7 + Math.random() * 2, lng: -74.0 + Math.random() * 2, name: 'NY/NJ Area' };
    if (prefix >= 200 && prefix < 270) return { lat: 38.9 + Math.random() * 2, lng: -77.0 + Math.random() * 2, name: 'Mid-Atlantic' };
    
    // Southeast (270-399)
    if (prefix >= 270 && prefix < 300) return { lat: 35.5 + Math.random() * 2, lng: -79.0 + Math.random() * 2, name: 'NC Area' };
    if (prefix >= 300 && prefix < 320) return { lat: 33.7 + Math.random() * 2, lng: -84.4 + Math.random() * 2, name: 'GA Area' };
    if (prefix >= 320 && prefix < 340) return { lat: 28.5 + Math.random() * 3, lng: -81.4 + Math.random() * 3, name: 'FL Area' };
    if (prefix >= 350 && prefix < 370) return { lat: 33.5 + Math.random() * 2, lng: -86.8 + Math.random() * 2, name: 'AL Area' };
    if (prefix >= 370 && prefix < 386) return { lat: 36.1 + Math.random() * 2, lng: -86.8 + Math.random() * 2, name: 'TN Area' };
    if (prefix >= 380 && prefix < 386) return { lat: 35.15 + Math.random() * 0.2, lng: -90.05 + Math.random() * 0.2, name: 'Memphis, TN' };
    if (prefix >= 386 && prefix < 398) return { lat: 32.3 + Math.random() * 2, lng: -90.2 + Math.random() * 2, name: 'MS Area' };
    
    // Midwest (400-599)
    if (prefix >= 400 && prefix < 430) return { lat: 38.2 + Math.random() * 2, lng: -85.7 + Math.random() * 2, name: 'KY Area' };
    if (prefix >= 430 && prefix < 460) return { lat: 40.0 + Math.random() * 2, lng: -83.0 + Math.random() * 2, name: 'OH Area' };
    if (prefix >= 460 && prefix < 480) return { lat: 39.8 + Math.random() * 2, lng: -86.1 + Math.random() * 2, name: 'IN Area' };
    if (prefix >= 480 && prefix < 500) return { lat: 42.3 + Math.random() * 2, lng: -83.0 + Math.random() * 2, name: 'MI Area' };
    if (prefix >= 500 && prefix < 530) return { lat: 41.6 + Math.random() * 2, lng: -93.6 + Math.random() * 2, name: 'IA Area' };
    if (prefix >= 530 && prefix < 550) return { lat: 43.0 + Math.random() * 2, lng: -89.4 + Math.random() * 2, name: 'WI Area' };
    if (prefix >= 550 && prefix < 570) return { lat: 44.9 + Math.random() * 2, lng: -93.2 + Math.random() * 2, name: 'MN Area' };
    if (prefix >= 600 && prefix < 630) return { lat: 41.9 + Math.random() * 1, lng: -87.6 + Math.random() * 1, name: 'Chicago, IL' };
    if (prefix >= 630 && prefix < 660) return { lat: 38.6 + Math.random() * 2, lng: -90.2 + Math.random() * 2, name: 'MO Area' };
    if (prefix >= 660 && prefix < 680) return { lat: 39.0 + Math.random() * 2, lng: -94.6 + Math.random() * 2, name: 'Kansas City' };
    
    // South Central (700-799)
    if (prefix >= 700 && prefix < 715) return { lat: 30.0 + Math.random() * 1, lng: -90.0 + Math.random() * 1, name: 'LA Area' };
    if (prefix >= 750 && prefix < 770) return { lat: 32.8 + Math.random() * 1, lng: -96.8 + Math.random() * 1, name: 'Dallas, TX' };
    if (prefix >= 770 && prefix < 780) return { lat: 29.8 + Math.random() * 1, lng: -95.4 + Math.random() * 1, name: 'Houston, TX' };
    if (prefix >= 780 && prefix < 800) return { lat: 29.4 + Math.random() * 1, lng: -98.5 + Math.random() * 1, name: 'San Antonio, TX' };
    
    // Mountain/West (800-899)
    if (prefix >= 800 && prefix < 820) return { lat: 39.7 + Math.random() * 2, lng: -104.9 + Math.random() * 2, name: 'CO Area' };
    if (prefix >= 850 && prefix < 860) return { lat: 33.4 + Math.random() * 1, lng: -112.0 + Math.random() * 1, name: 'Phoenix, AZ' };
    if (prefix >= 870 && prefix < 885) return { lat: 35.1 + Math.random() * 2, lng: -106.6 + Math.random() * 2, name: 'NM Area' };
    if (prefix >= 890 && prefix < 900) return { lat: 36.1 + Math.random() * 1, lng: -115.2 + Math.random() * 1, name: 'Las Vegas, NV' };
    
    // Pacific (900-999)
    if (prefix >= 900 && prefix < 910) return { lat: 34.0 + Math.random() * 1, lng: -118.2 + Math.random() * 1, name: 'Los Angeles, CA' };
    if (prefix >= 920 && prefix < 930) return { lat: 32.7 + Math.random() * 1, lng: -117.1 + Math.random() * 1, name: 'San Diego, CA' };
    if (prefix >= 940 && prefix < 960) return { lat: 37.8 + Math.random() * 1, lng: -122.4 + Math.random() * 1, name: 'SF Bay Area, CA' };
    if (prefix >= 970 && prefix < 980) return { lat: 45.5 + Math.random() * 1, lng: -122.7 + Math.random() * 1, name: 'Portland, OR' };
    if (prefix >= 980 && prefix < 995) return { lat: 47.6 + Math.random() * 1, lng: -122.3 + Math.random() * 1, name: 'Seattle, WA' };
    
    // Default to center US
    return { lat: 39.8 + Math.random() * 5, lng: -98.5 + Math.random() * 5, name: 'United States' };
}

/**
 * Add a single searched ZIP to map with its retention %
 */
function addSearchedZipMarker(zip, retention, storeName = null) {
    // Get coordinates - use predefined if available, otherwise estimate
    let coords = ZIP_COORDS[zip];
    let isEstimated = false;
    
    if (!coords || coords === ZIP_COORDS.default) {
        coords = estimateZipCoords(zip);
        isEstimated = true;
        // Store for future use
        ZIP_COORDS[zip] = { ...coords, retention: retention };
    }
    
    clearMapMarkers();
    
    const color = getRetentionColor(retention);
    
    const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: 35,
        fillColor: color,
        color: '#1a3d16',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
    }).addTo(map);
    
    const displayName = storeName || `ZIP ${zip}`;
    const locationNote = isEstimated ? `<br><span style="font-size:10px;color:#999;">(Approx. location)</span>` : '';
    
    marker.bindPopup(`
        <div style="text-align:center;min-width:140px;">
            <strong style="font-size:14px;">${displayName}</strong><br>
            <span style="font-size:12px;color:#666;">ZIP: ${zip}</span>${locationNote}<br>
            <span style="font-size:24px;font-weight:bold;color:${color}">${retention.toFixed(1)}%</span><br>
            <span style="font-size:12px;color:#666;">Local Retention</span>
        </div>
    `).openPopup();
    
    // Permanent label
    marker.bindTooltip(`<b>${zip}</b><br>${retention.toFixed(0)}%`, {
        permanent: true,
        direction: 'center',
        className: 'zip-tooltip'
    });
    
    markers.push(marker);
    
    // Center map on this location
    map.setView([coords.lat, coords.lng], 12);
    
    return coords;
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
    
    // Show this ZIP on the map with its calculated retention
    if (map) {
        const retention = result.ejv_percentage * 0.5; // Local retention as ~50% of EJV
        addSearchedZipMarker(zip, retention, `ZIP ${zip} Analysis`);
        addInsight('info', `Showing ZIP ${zip} on map with ${retention.toFixed(1)}% local retention`);
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
    
    const result = await calculateEJV(params);
    displayResults(result);
    
    // Update map based on search type
    if (map) {
        const retention = result.ejv_percentage * 0.5; // Local retention ~50% of EJV score
        
        if (company) {
            // Show all locations of this company
            const stores = showStoresByCompany(company, zip);
            if (stores.length === 0) {
                // No predefined stores, show the searched ZIP with calculated retention
                addSearchedZipMarker(zip, retention, `${company.replace('_', ' ')} (${zip})`);
            }
        } else if (category) {
            // Show all stores in this category
            const stores = showStoresByCategory(category, zip);
            if (stores.length === 0) {
                // No predefined stores, show ZIP
                addSearchedZipMarker(zip, retention, `${category.replace('_', ' ')} (${zip})`);
            }
        } else {
            // Show the searched ZIP with its calculated retention
            addSearchedZipMarker(zip, retention, storeName);
        }
        
        addInsight('info', `Map updated for ZIP ${zip}`);
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
    
    // Auto-select category when company is selected
    document.getElementById('storeCompany').addEventListener('change', (e) => {
        const cats = {
            'costco': 'warehouse_club', 'sams_club': 'warehouse_club',
            'whole_foods': 'supermarket', 'trader_joes': 'supermarket',
            'walmart': 'supermarket', 'kroger': 'supermarket',
            'target': 'department_store', 'cvs': 'pharmacy', 'walgreens': 'pharmacy',
            '7_eleven': 'convenience', 'wawa': 'convenience',
            'home_depot': 'home_improvement', 'lowes': 'home_improvement',
            'starbucks': 'coffee_shop', 'mcdonalds': 'fast_food', 'chipotle': 'fast_casual'
        };
        if (cats[e.target.value]) {
            document.getElementById('storeCategory').value = cats[e.target.value];
        }
    });
    
    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
        alert('Export feature coming soon! This will generate PDF/CSV reports.');
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    console.log('FIX$ Dashboard ready!');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
