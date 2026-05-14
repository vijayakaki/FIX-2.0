"""
Configuration and constants for EJV 4.1 calculations.
FIX$ GeoEquity Impact Engine

Contains:
- EJV calculation constants
- API endpoints and keys
- Impact band definitions
- Display configuration
"""

import os
from typing import Dict, Any, Tuple

# =============================================================================
# EJV 4.1 CALCULATION CONSTANTS
# =============================================================================

# Formula: Living_Wage_Hourly = (Median_Income / ANNUAL_WORK_HOURS) × HOUSING_RATIO
ANNUAL_WORK_HOURS = 2080  # 40 hrs/week × 52 weeks
HOUSING_RATIO = 0.35  # Housing should be ≤35% of income

# National baseline for community need calculation
NATIONAL_MEDIAN_INCOME = 75000  # US Census baseline (updated annually)

# Unemployment threshold for high-need marker
UNEMPLOYMENT_THRESHOLD = 10.0  # 10% = maximum need score

# EJV Component weights (equal weighting in 4.1)
EJV_WEIGHTS = {
    "LC_local_circulation": 1/6,  # 16.67%
    "W_fair_wages": 1/6,
    "DN_community_need": 1/6,
    "EQ_equity_inclusion": 1/6,
    "ENV_environmental": 1/6,
    "PROC_procurement": 1/6
}

# EJV Version info
EJV_VERSION = "4.1"
EJV_VERSION_NAME = "6-Component Equal Weight"
EJV_FORMULA = "EJV 4.1 = (LC + W + DN + EQ + ENV + PROC) / 6"


# =============================================================================
# IMPACT BANDS - Human-friendly score classification
# =============================================================================

IMPACT_BANDS: Dict[str, Dict[str, Any]] = {
    "community_anchor": {
        "min_score": 80,
        "max_score": 100,
        "emoji": "🟢",
        "label": "Community Anchor",
        "color": "#2e7d32",
        "description": "Exceptional local economic impact"
    },
    "strong_supporter": {
        "min_score": 60,
        "max_score": 79.99,
        "emoji": "🟢",
        "label": "Strong Local Supporter",
        "color": "#4caf50",
        "description": "Above average local retention"
    },
    "moderate_impact": {
        "min_score": 40,
        "max_score": 59.99,
        "emoji": "🟡",
        "label": "Moderate Local Impact",
        "color": "#ff9800",
        "description": "Average local economic contribution"
    },
    "low_retention": {
        "min_score": 20,
        "max_score": 39.99,
        "emoji": "🟠",
        "label": "Low Local Retention",
        "color": "#ff5722",
        "description": "Below average local retention"
    },
    "high_leakage": {
        "min_score": 0,
        "max_score": 19.99,
        "emoji": "🔴",
        "label": "High Value Leakage",
        "color": "#d32f2f",
        "description": "Most value leaves the local economy"
    }
}


def get_impact_band(score: float) -> Dict[str, Any]:
    """
    Get the impact band classification for a given EJV score.
    
    Args:
        score: EJV score (0-100)
        
    Returns:
        Dictionary with band details (emoji, label, color, description)
    """
    score = max(0, min(100, score))  # Clamp to valid range
    
    if score >= 80:
        return IMPACT_BANDS["community_anchor"]
    elif score >= 60:
        return IMPACT_BANDS["strong_supporter"]
    elif score >= 40:
        return IMPACT_BANDS["moderate_impact"]
    elif score >= 20:
        return IMPACT_BANDS["low_retention"]
    else:
        return IMPACT_BANDS["high_leakage"]


# =============================================================================
# API CONFIGURATION
# =============================================================================

# Census API
CENSUS_API_KEY = os.environ.get("CENSUS_API_KEY", "")
CENSUS_ACS_BASE_URL = "https://api.census.gov/data/2022/acs/acs5/profile"
CENSUS_LODES_BASE_URL = "https://lehd.ces.census.gov/data/lodes/"

# Census ACS Field codes used in EJV calculation
CENSUS_FIELDS = {
    "unemployment_rate": "DP03_0005PE",  # % unemployed in civilian labor force
    "median_income": "DP03_0062E",       # Median household income
    "total_population": "DP05_0001E",    # Total population
    "working_age_pop": "DP05_0021E",     # Working age population (18-64)
    "name": "NAME"                        # Geographic area name
}

# BLS API
BLS_API_KEY = os.environ.get("BLS_API_KEY", "")
BLS_BASE_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

# BLS Series ID pattern for OEWS data
# Format: OEUM{area_code}{industry_code}{occupation_code}{data_type}
BLS_OEWS_PATTERN = "OEUM{area}000000{soc_code}03"  # 03 = hourly mean wage

# EPA EJSCREEN
EPA_EJSCREEN_BASE_URL = "https://ejscreen.epa.gov/mapper/"

# Request timeouts
API_TIMEOUT = 30  # seconds
API_MAX_RETRIES = 3
API_RETRY_DELAY = 1  # seconds


# =============================================================================
# GEOGRAPHIC CONFIGURATION
# =============================================================================

# Default radius for "local" definition (miles)
DEFAULT_LOCAL_RADIUS_MILES = 25

# Geographic levels for Census data
GEO_LEVELS = {
    "state": "state",
    "county": "county", 
    "tract": "tract",
    "zip": "zip code tabulation area",
    "place": "place"
}


# =============================================================================
# DATA FALLBACK CONFIGURATION
# =============================================================================

# Fallback hierarchy for data retrieval
FALLBACK_HIERARCHY = [
    "api_realtime",      # 1. Real-time API data (Census, BLS)
    "company_database",  # 2. Company-specific database
    "industry_baseline", # 3. Industry baseline estimates
    "national_default"   # 4. National defaults
]

# National default values (fallback of last resort)
NATIONAL_DEFAULTS = {
    "avg_hourly_wage": 18.00,           # BLS national median
    "living_wage_hourly": 17.50,        # MIT Living Wage average
    "unemployment_rate": 3.7,           # BLS national rate
    "local_hiring_pct": 0.60,           # 60% default
    "local_procurement_pct": 0.25,      # 25% default
    "equity_score": 50.0,               # Neutral baseline
    "renewable_energy_pct": 25.0,       # US average
    "recycling_rate_pct": 35.0          # EPA national average
}


# =============================================================================
# LOGGING AND DEBUG
# =============================================================================

# Log level
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# Enable detailed calculation logging
DEBUG_CALCULATIONS = os.environ.get("DEBUG_CALCULATIONS", "false").lower() == "true"


# =============================================================================
# DISPLAY CONFIGURATION
# =============================================================================

# Currency formatting
CURRENCY_SYMBOL = "$"
CURRENCY_DECIMALS = 2

# Score display format
SCORE_DECIMALS = 1

# Default purchase amount for examples
DEFAULT_PURCHASE_AMOUNT = 100.0


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def format_currency(amount: float) -> str:
    """Format a number as currency."""
    return f"{CURRENCY_SYMBOL}{amount:,.{CURRENCY_DECIMALS}f}"


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format a number as percentage."""
    return f"{value:.{decimals}f}%"


def format_score(score: float) -> str:
    """Format an EJV score for display."""
    return f"{score:.{SCORE_DECIMALS}f}"


def get_percentile_display(percentile: int) -> str:
    """
    Convert percentile to 'Top X%' display string.
    
    Args:
        percentile: Store's percentile ranking (0-100)
        
    Returns:
        Human-friendly percentile string
    """
    top_pct = 100 - percentile
    return f"Top {top_pct}% Local Impact"


def get_dollar_impact_display(ejv_score: float, per_amount: float = 10.0) -> str:
    """
    Generate dollar impact display string.
    
    Args:
        ejv_score: EJV score (0-100)
        per_amount: Reference purchase amount
        
    Returns:
        Human-friendly dollar impact string
    """
    retained = (ejv_score / 100) * per_amount
    return f"≈ ${retained:.2f} of every ${per_amount:.0f} stays local"


# =============================================================================
# VALIDATION
# =============================================================================

def validate_score(score: float, component_name: str = "score") -> float:
    """
    Validate and clamp a score to valid range (0-100).
    
    Args:
        score: Raw score value
        component_name: Name for error messaging
        
    Returns:
        Clamped score value
    """
    if score < 0:
        score = 0.0
    elif score > 100:
        score = 100.0
    return float(score)


def validate_percentage(pct: float, name: str = "percentage") -> float:
    """
    Validate and clamp a percentage to valid range (0-100).
    
    Args:
        pct: Raw percentage value
        name: Name for error messaging
        
    Returns:
        Clamped percentage value
    """
    if pct < 0:
        pct = 0.0
    elif pct > 100:
        pct = 100.0
    return float(pct)


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = [
    # Constants
    "ANNUAL_WORK_HOURS",
    "HOUSING_RATIO", 
    "NATIONAL_MEDIAN_INCOME",
    "UNEMPLOYMENT_THRESHOLD",
    "EJV_WEIGHTS",
    "EJV_VERSION",
    "EJV_VERSION_NAME",
    "EJV_FORMULA",
    "IMPACT_BANDS",
    "CENSUS_FIELDS",
    "NATIONAL_DEFAULTS",
    
    # API Config
    "CENSUS_API_KEY",
    "CENSUS_ACS_BASE_URL",
    "BLS_API_KEY",
    "BLS_BASE_URL",
    "API_TIMEOUT",
    
    # Functions
    "get_impact_band",
    "format_currency",
    "format_percentage",
    "format_score",
    "get_percentile_display",
    "get_dollar_impact_display",
    "validate_score",
    "validate_percentage"
]
