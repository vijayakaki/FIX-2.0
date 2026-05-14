/**
 * FIX$ Dashboard - Community Intelligence for Economic Justice
 * Main Application JavaScript
 */

// API base URL
const API_BASE = window.location.origin;

// Chart instances
let economicFlowChart = null;
let trendChart = null;

/**
 * Initialize Economic Flow Donut Chart
 */
function initEconomicFlowChart() {
    const ctx = document.getElementById('economicFlowChart');
    if (!ctx) return;

    economicFlowChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Local Businesses', 'Local Leakage', 'Outside Regional', 'Outside State'],
            datasets: [{
                data: [32.7, 41.3, 16.2, 9.8],
                backgroundColor: [
                    '#2d5a27',
                    '#7cb342',
                    '#c5e1a5',
                    '#f5f5dc'
                ],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = 128.4;
                            const amount = (value / 100 * total).toFixed(1);
                            return `${context.label}: ${value}% ($${amount}M)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize Trend Line Chart
 */
function initTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Jan '25", "Feb '25", "Mar '25", "Apr '25", "May '25"],
            datasets: [{
                label: 'Local Retention %',
                data: [28.1, 30.2, 29.7, 31.5, 32.7],
                borderColor: '#7cb342',
                backgroundColor: 'rgba(124, 179, 66, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#7cb342',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 60,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

/**
 * Animate EJV score circle
 */
function animateEJVScore() {
    const scoreFill = document.querySelector('.score-fill');
    if (!scoreFill) return;

    // Score of 71 out of 100
    // Circle circumference = 2 * PI * 45 = ~283
    // For 71%, offset = 283 * (1 - 0.71) = ~82
    const score = 71;
    const circumference = 283;
    const offset = circumference * (1 - score / 100);
    
    setTimeout(() => {
        scoreFill.style.strokeDashoffset = offset;
    }, 500);
}

/**
 * Animate component bars
 */
function animateComponentBars() {
    const bars = document.querySelectorAll('.comp-fill');
    bars.forEach((bar, index) => {
        setTimeout(() => {
            bar.style.transition = 'width 0.8s ease-out';
        }, index * 100);
    });
}

/**
 * Handle location change
 */
function handleLocationChange(e) {
    const zipCode = e.target.value;
    console.log('Location changed to:', zipCode);
    
    // In production, this would fetch new data
    // For now, just show a loading state briefly
    document.body.style.cursor = 'wait';
    setTimeout(() => {
        document.body.style.cursor = 'default';
    }, 500);
}

/**
 * Handle export button click
 */
function handleExport() {
    alert('Export functionality coming soon! This will generate PDF/CSV reports.');
}

/**
 * Fetch dashboard data from API
 */
async function fetchDashboardData(zipCode) {
    try {
        const response = await fetch(`${API_BASE}/api/v1/ejv/quick?zip=${zipCode}`);
        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard data:', data);
            return data;
        }
    } catch (error) {
        console.warn('Could not fetch dashboard data:', error);
    }
    return null;
}

/**
 * Initialize navigation
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active to clicked
            item.classList.add('active');
            
            // In production, this would load different views
            console.log('Navigation:', item.textContent.trim());
        });
    });
}

/**
 * Initialize map interactions
 */
function initMapInteractions() {
    const zipRegions = document.querySelectorAll('.zip-region');
    
    zipRegions.forEach(region => {
        region.addEventListener('click', () => {
            // Remove highlight from all
            zipRegions.forEach(r => r.classList.remove('highlight'));
            // Add highlight to clicked
            region.classList.add('highlight');
            
            const zipCode = region.querySelector('.zip-code').textContent;
            const pct = region.querySelector('.zip-pct').textContent;
            console.log(`Selected ZIP: ${zipCode} (${pct} retention)`);
        });
    });
}

/**
 * Initialize all dashboard functionality
 */
function init() {
    console.log('FIX$ Dashboard initializing...');
    
    // Initialize charts
    initEconomicFlowChart();
    initTrendChart();
    
    // Animate elements
    animateEJVScore();
    animateComponentBars();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize map
    initMapInteractions();
    
    // Event listeners
    const locationSelect = document.getElementById('locationSelect');
    if (locationSelect) {
        locationSelect.addEventListener('change', handleLocationChange);
    }
    
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExport);
    }
    
    // Fetch initial data
    fetchDashboardData('38126');
    
    console.log('FIX$ Dashboard initialized successfully');
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
