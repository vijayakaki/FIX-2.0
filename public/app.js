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

// ZIP code coordinates (sample data - in production would use geocoding API)
const ZIP_COORDS = {
    '38126': { lat: 35.1175, lng: -90.0568, name: 'Memphis, TN' },
    '38108': { lat: 35.1595, lng: -89.9711, name: 'Memphis, TN' },
    '38127': { lat: 35.2270, lng: -89.9711, name: 'Memphis, TN' },
    '38107': { lat: 35.1684, lng: -90.0350, name: 'Memphis, TN' },
    '38112': { lat: 35.1495, lng: -89.9423, name: 'Memphis, TN' },
    '38114': { lat: 35.1084, lng: -89.9923, name: 'Memphis, TN' },
    '38106': { lat: 35.0984, lng: -90.0368, name: 'Memphis, TN' },
    '10001': { lat: 40.7506, lng: -73.9971, name: 'New York, NY' },
    '10002': { lat: 40.7157, lng: -73.9863, name: 'New York, NY' },
    '10003': { lat: 40.7317, lng: -73.9892, name: 'New York, NY' },
    '90210': { lat: 34.0901, lng: -118.4065, name: 'Beverly Hills, CA' },
    '60601': { lat: 41.8819, lng: -87.6278, name: 'Chicago, IL' },
    '30301': { lat: 33.7490, lng: -84.3880, name: 'Atlanta, GA' },
    '77001': { lat: 29.7604, lng: -95.3698, name: 'Houston, TX' },
    '85001': { lat: 33.4484, lng: -112.0740, name: 'Phoenix, AZ' },
    'default': { lat: 39.8283, lng: -98.5795, name: 'United States' }
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
 * Initialize Leaflet Map
 */
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl || map) return;
    
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add sample markers
    addZipMarkers(['38126', '38108', '38127', '38107', '38112', '38106']);
}

/**
 * Add ZIP code markers to map
 */
function addZipMarkers(zipCodes) {
    // Clear existing markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    zipCodes.forEach(zip => {
        const coords = ZIP_COORDS[zip] || ZIP_COORDS.default;
        
        // Simulate EJV score for each ZIP
        const ejvScore = 25 + Math.random() * 50;
        const band = getImpactBand(ejvScore);
        
        const marker = L.circleMarker([coords.lat, coords.lng], {
            radius: 20,
            fillColor: band.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`
            <strong>ZIP: ${zip}</strong><br>
            EJV Score: ${ejvScore.toFixed(1)}<br>
            ${band.emoji} ${band.label}<br>
            <a href="#" onclick="searchZip('${zip}')">Analyze →</a>
        `);
        
        marker.bindTooltip(`${zip}<br>${ejvScore.toFixed(0)}%`, {
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
 * Search by ZIP code
 */
window.searchZip = async function(zip) {
    if (!zip || zip.length !== 5) {
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
    
    // Update map to focus on this ZIP
    const coords = ZIP_COORDS[zip] || ZIP_COORDS.default;
    if (map) {
        map.setView([coords.lat, coords.lng], 12);
        addZipMarkers([zip]);
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
    
    if (!zip || zip.length !== 5) {
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
    
    // Update map
    const coords = ZIP_COORDS[zip] || { lat: 39.8283, lng: -98.5795 };
    if (map) {
        map.setView([coords.lat, coords.lng], 12);
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
