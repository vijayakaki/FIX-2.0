"""
FIX$ GeoEquity Impact Engine - EJV 4.1 Implementation

Economic Justice Value (EJV) 4.1 calculation engine with:
- 6-component equal weight formula
- Real-time Census and BLS API integration
- Company-specific data fallbacks
- Human-friendly display formatting
- RESTful API endpoints

Version: 4.1
Components: LC, W, DN, EQ, ENV, PROC (16.67% each)
Formula: EJV 4.1 = (LC + W + DN + EQ + ENV + PROC) / 6
"""

import logging
import requests
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass, field, asdict
from datetime import datetime
import json

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import (
    ANNUAL_WORK_HOURS,
    HOUSING_RATIO,
    NATIONAL_MEDIAN_INCOME,
    UNEMPLOYMENT_THRESHOLD,
    EJV_WEIGHTS,
    EJV_VERSION,
    EJV_VERSION_NAME,
    EJV_FORMULA,
    CENSUS_API_KEY,
    CENSUS_ACS_BASE_URL,
    CENSUS_FIELDS,
    BLS_API_KEY,
    BLS_BASE_URL,
    API_TIMEOUT,
    NATIONAL_DEFAULTS,
    get_impact_band,
    format_currency,
    format_percentage,
    format_score,
    get_percentile_display,
    get_dollar_impact_display,
    validate_score,
    validate_percentage
)

from company_data import (
    get_company_data,
    get_category_baseline,
    get_soc_code,
    CATEGORY_BASELINES
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class LocalEconomicIndicators:
    """Local economic data from Census ACS."""
    median_income: float = NATIONAL_DEFAULTS["avg_hourly_wage"] * ANNUAL_WORK_HOURS
    unemployment_rate: float = NATIONAL_DEFAULTS["unemployment_rate"]
    total_population: int = 0
    working_age_population: int = 0
    area_name: str = "Unknown Area"
    data_source: str = "national_default"
    state_fips: str = ""
    county_fips: str = ""
    

@dataclass
class PayrollData:
    """Wage and employee data from BLS or company database."""
    average_hourly_wage: float = NATIONAL_DEFAULTS["avg_hourly_wage"]
    employee_count: int = 0
    occupation_code: str = ""
    data_source: str = "national_default"


@dataclass
class EquityData:
    """Workplace equity and inclusion metrics."""
    equitable_practices_pct: float = 50.0
    gender_pay_ratio: float = 1.0
    diversity_score: float = 50.0
    data_source: str = "baseline"


@dataclass
class EnvironmentalData:
    """Environmental sustainability metrics."""
    renewable_energy_pct: float = NATIONAL_DEFAULTS["renewable_energy_pct"]
    recycling_pct: float = NATIONAL_DEFAULTS["recycling_rate_pct"]
    data_source: str = "baseline"


@dataclass  
class ProcurementData:
    """Local and ethical sourcing metrics."""
    local_procurement_pct: float = NATIONAL_DEFAULTS["local_procurement_pct"] * 100
    local_hiring_pct: float = NATIONAL_DEFAULTS["local_hiring_pct"] * 100
    data_source: str = "baseline"


@dataclass
class EJVComponents:
    """Individual EJV component scores."""
    LC_local_circulation: float = 0.0
    W_fair_wages: float = 0.0
    DN_community_need: float = 0.0
    EQ_equity_inclusion: float = 0.0
    ENV_environmental: float = 0.0
    PROC_procurement: float = 0.0


@dataclass
class EJVResult:
    """Complete EJV calculation result."""
    store_id: str = ""
    store_name: str = ""
    location: str = ""
    zip_code: str = ""
    
    ejv_version: str = EJV_VERSION_NAME
    ejv_score: float = 0.0
    ejv_percentage: float = 0.0
    formula: str = EJV_FORMULA
    
    components: EJVComponents = field(default_factory=EJVComponents)
    weights: Dict[str, float] = field(default_factory=lambda: dict(EJV_WEIGHTS))
    component_details: Dict[str, Any] = field(default_factory=dict)
    
    ejv_display: Dict[str, Any] = field(default_factory=dict)
    economic_impact: Dict[str, Any] = field(default_factory=dict)
    local_context: Dict[str, Any] = field(default_factory=dict)
    data_sources: List[str] = field(default_factory=list)
    
    calculated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# =============================================================================
# DATA RETRIEVAL FUNCTIONS
# =============================================================================

def get_local_economic_indicators(zip_code: str = None, 
                                   state_fips: str = None,
                                   county_fips: str = None) -> LocalEconomicIndicators:
    """
    Retrieve local economic indicators from Census ACS 5-Year estimates.
    
    Args:
        zip_code: ZIP code for geographic lookup
        state_fips: State FIPS code
        county_fips: County FIPS code
        
    Returns:
        LocalEconomicIndicators with unemployment rate, median income, etc.
    """
    indicators = LocalEconomicIndicators()
    
    if not CENSUS_API_KEY:
        logger.warning("Census API key not configured, using national defaults")
        return indicators
    
    try:
        # Build Census API request
        fields = ",".join([
            CENSUS_FIELDS["unemployment_rate"],
            CENSUS_FIELDS["median_income"],
            CENSUS_FIELDS["name"]
        ])
        
        # Determine geographic level
        if zip_code:
            geo = f"zip code tabulation area:{zip_code}"
            geo_for = f"zip code tabulation area:{zip_code}"
            url = f"{CENSUS_ACS_BASE_URL}?get={fields}&for={geo_for}&key={CENSUS_API_KEY}"
        elif state_fips and county_fips:
            geo_for = f"county:{county_fips}"
            geo_in = f"state:{state_fips}"
            url = f"{CENSUS_ACS_BASE_URL}?get={fields}&for={geo_for}&in={geo_in}&key={CENSUS_API_KEY}"
        else:
            logger.warning("No geographic identifier provided")
            return indicators
        
        response = requests.get(url, timeout=API_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        
        if len(data) >= 2:
            headers = data[0]
            values = data[1]
            
            # Map values to indicators
            unemp_idx = headers.index(CENSUS_FIELDS["unemployment_rate"])
            income_idx = headers.index(CENSUS_FIELDS["median_income"])
            name_idx = headers.index(CENSUS_FIELDS["name"])
            
            if values[unemp_idx] and values[unemp_idx] != '-':
                indicators.unemployment_rate = float(values[unemp_idx])
            
            if values[income_idx] and values[income_idx] != '-':
                indicators.median_income = float(values[income_idx])
            
            indicators.area_name = values[name_idx] if values[name_idx] else "Unknown"
            indicators.data_source = "Census ACS 5-Year"
            
            logger.info(f"Census data retrieved for {indicators.area_name}")
            
    except requests.RequestException as e:
        logger.error(f"Census API request failed: {e}")
    except (ValueError, IndexError, KeyError) as e:
        logger.error(f"Census data parsing error: {e}")
    
    return indicators


def get_payroll_data(zip_code: str = None,
                     company_name: str = None,
                     category: str = None) -> PayrollData:
    """
    Get wage and employee data from BLS OEWS or company database.
    
    Fallback hierarchy:
    1. BLS OEWS real-time data
    2. Company-specific database
    3. Category baseline
    4. National default
    
    Args:
        zip_code: ZIP code for BLS area lookup
        company_name: Company name for database lookup
        category: Business category for baseline
        
    Returns:
        PayrollData with average wage and employee count
    """
    payroll = PayrollData()
    
    # Try company-specific data first
    if company_name:
        company_data = get_company_data(company_name)
        if company_data:
            payroll.average_hourly_wage = company_data.get("avg_hourly_wage", 
                                                           NATIONAL_DEFAULTS["avg_hourly_wage"])
            payroll.data_source = f"Company Database ({company_name})"
            logger.info(f"Using company wage data for {company_name}")
            return payroll
    
    # Try BLS API
    if BLS_API_KEY and zip_code:
        try:
            # Get SOC code for category
            soc_code = get_soc_code(category or "default")
            
            # BLS OEWS series ID (simplified - would need area code mapping)
            # For production, implement ZIP to MSA/area code mapping
            series_id = f"OEUM0000000000{soc_code.replace('-', '')}03"
            
            payload = {
                "seriesid": [series_id],
                "registrationkey": BLS_API_KEY
            }
            
            response = requests.post(BLS_BASE_URL, json=payload, timeout=API_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") == "REQUEST_SUCCEEDED":
                series_data = data.get("Results", {}).get("series", [])
                if series_data and series_data[0].get("data"):
                    latest = series_data[0]["data"][0]
                    payroll.average_hourly_wage = float(latest.get("value", 
                                                        NATIONAL_DEFAULTS["avg_hourly_wage"]))
                    payroll.occupation_code = soc_code
                    payroll.data_source = "BLS OEWS"
                    logger.info(f"BLS wage data retrieved: ${payroll.average_hourly_wage}/hr")
                    return payroll
                    
        except requests.RequestException as e:
            logger.error(f"BLS API request failed: {e}")
        except (ValueError, KeyError) as e:
            logger.error(f"BLS data parsing error: {e}")
    
    # Fall back to category baseline
    if category:
        baseline = get_category_baseline(category)
        payroll.average_hourly_wage = baseline.get("avg_hourly_wage", 
                                                   NATIONAL_DEFAULTS["avg_hourly_wage"])
        payroll.data_source = f"Category Baseline ({category})"
        logger.info(f"Using category baseline wage for {category}")
        return payroll
    
    # Final fallback
    payroll.data_source = "National Default"
    return payroll


def get_equity_data(company_name: str = None, 
                    category: str = None,
                    is_local_business: bool = False) -> EquityData:
    """
    Get workplace equity and inclusion metrics.
    
    Sources: EEOC data, ESG reports, company database
    
    Args:
        company_name: Company name for specific data
        category: Business category for baseline
        is_local_business: Whether this is a local/small business
        
    Returns:
        EquityData with equitable practices percentage
    """
    equity = EquityData()
    
    # Try company-specific data
    if company_name:
        company_data = get_company_data(company_name)
        if company_data:
            equity.equitable_practices_pct = company_data.get("equity_score", 50.0)
            equity.data_source = f"Company Database ({company_name})"
            logger.info(f"Using company equity data for {company_name}")
            return equity
    
    # Get baseline for category
    if category:
        baseline = get_category_baseline(category)
        equity.equitable_practices_pct = baseline.get("equity_score", 50.0)
        equity.data_source = f"Category Baseline ({category})"
    
    # Apply local business modifier (+15%)
    if is_local_business and not company_name:
        equity.equitable_practices_pct = min(100, equity.equitable_practices_pct + 15)
        equity.data_source = f"{equity.data_source} + Local Business Modifier"
        logger.info(f"Applied local business modifier: {equity.equitable_practices_pct}%")
    
    return equity


def get_environmental_data(company_name: str = None,
                           category: str = None) -> EnvironmentalData:
    """
    Get environmental sustainability metrics.
    
    Sources: EPA, CDP, company sustainability reports
    
    Args:
        company_name: Company name for specific data
        category: Business category for baseline
        
    Returns:
        EnvironmentalData with renewable energy and recycling percentages
    """
    env = EnvironmentalData()
    
    # Try company-specific data
    if company_name:
        company_data = get_company_data(company_name)
        if company_data:
            env.renewable_energy_pct = company_data.get("renewable_energy_pct", 
                                                        NATIONAL_DEFAULTS["renewable_energy_pct"])
            env.recycling_pct = company_data.get("recycling_pct",
                                                 NATIONAL_DEFAULTS["recycling_rate_pct"])
            env.data_source = f"Company Database ({company_name})"
            logger.info(f"Using company environmental data for {company_name}")
            return env
    
    # Get baseline for category
    if category:
        baseline = get_category_baseline(category)
        env.renewable_energy_pct = baseline.get("renewable_energy_pct", 
                                                NATIONAL_DEFAULTS["renewable_energy_pct"])
        env.recycling_pct = baseline.get("recycling_pct",
                                         NATIONAL_DEFAULTS["recycling_rate_pct"])
        env.data_source = f"Category Baseline ({category})"
    
    return env


def get_procurement_data(company_name: str = None,
                         category: str = None) -> ProcurementData:
    """
    Get local and ethical procurement metrics.
    
    Sources: Company reports, supply chain analysis, USDA local food data
    
    Args:
        company_name: Company name for specific data
        category: Business category for baseline
        
    Returns:
        ProcurementData with local procurement and hiring percentages
    """
    proc = ProcurementData()
    
    # Try company-specific data
    if company_name:
        company_data = get_company_data(company_name)
        if company_data:
            proc.local_procurement_pct = company_data.get("local_procurement_pct", 25.0)
            proc.local_hiring_pct = NATIONAL_DEFAULTS["local_hiring_pct"] * 100
            proc.data_source = f"Company Database ({company_name})"
            logger.info(f"Using company procurement data for {company_name}")
            return proc
    
    # Get baseline for category
    if category:
        baseline = get_category_baseline(category)
        proc.local_procurement_pct = baseline.get("local_procurement_pct", 25.0)
        proc.local_hiring_pct = NATIONAL_DEFAULTS["local_hiring_pct"] * 100
        proc.data_source = f"Category Baseline ({category})"
    
    return proc


# =============================================================================
# CALCULATION FUNCTIONS
# =============================================================================

def living_wage(median_income: float) -> float:
    """
    Calculate living wage based on local median income.
    
    Formula: Living_Wage_Hourly = (Median_Income / 2080) × 0.35
    
    Where:
    - 2080 = Standard annual work hours (40 hrs/week × 52 weeks)
    - 0.35 = Housing affordability ratio (housing should be ≤35% of income)
    
    Args:
        median_income: Local median household income
        
    Returns:
        Hourly living wage
    """
    if median_income <= 0:
        median_income = NATIONAL_MEDIAN_INCOME
    
    living_wage_hourly = (median_income / ANNUAL_WORK_HOURS) * HOUSING_RATIO
    
    logger.debug(f"Living wage: ${living_wage_hourly:.2f}/hr (median income: ${median_income})")
    
    return living_wage_hourly


def calculate_local_circulation(local_hiring_pct: float,
                                 local_procurement_pct: float) -> float:
    """
    Calculate LC (Local Circulation) component.
    
    Formula: LC = Local_Hiring_Percentage × Local_Procurement_Percentage × 100
    
    Args:
        local_hiring_pct: % of employees living locally (0-100)
        local_procurement_pct: % of goods/services sourced locally (0-100)
        
    Returns:
        LC score (0-100)
    """
    # Convert to 0-1 scale for multiplication
    hiring = local_hiring_pct / 100.0
    procurement = local_procurement_pct / 100.0
    
    lc = hiring * procurement * 100
    
    return validate_score(lc, "LC")


def calculate_fair_wages(store_wage: float, living_wage_value: float) -> float:
    """
    Calculate W (Fair Wages) component.
    
    Formula: W = min(1.0, Store_Avg_Wage / Living_Wage) × 100
    
    Args:
        store_wage: Average hourly wage at store
        living_wage_value: Required living wage for the area
        
    Returns:
        W score (0-100)
    """
    if living_wage_value <= 0:
        living_wage_value = NATIONAL_DEFAULTS["living_wage_hourly"]
    
    ratio = store_wage / living_wage_value
    w = min(1.0, ratio) * 100
    
    return validate_score(w, "W")


def calculate_community_need(unemployment_rate: float,
                              local_median_income: float) -> float:
    """
    Calculate DN (Community Need/Distress Need) component.
    
    Formula:
    Unemployment_Factor = min(1.0, Unemployment_Rate / 10.0)
    Income_Factor = max(0.0, min(1.0, 1.0 - (Local_Median_Income / National_Median_Income)))
    DN = ((Unemployment_Factor + Income_Factor) / 2) × 100
    
    Higher unemployment and lower income = higher need = higher score
    
    Args:
        unemployment_rate: Local unemployment rate (%)
        local_median_income: Local median household income ($)
        
    Returns:
        DN score (0-100)
    """
    # Unemployment factor: 10% = 1.0 (maximum need)
    unemployment_factor = min(1.0, unemployment_rate / UNEMPLOYMENT_THRESHOLD)
    
    # Income factor: Income below national median = higher need
    income_ratio = local_median_income / NATIONAL_MEDIAN_INCOME
    income_factor = max(0.0, min(1.0, 1.0 - income_ratio))
    
    # Average factors
    dn = ((unemployment_factor + income_factor) / 2) * 100
    
    logger.debug(f"Community Need: unemp_factor={unemployment_factor:.3f}, "
                 f"income_factor={income_factor:.3f}, DN={dn:.1f}")
    
    return validate_score(dn, "DN")


def calculate_equity_inclusion(equitable_practices_pct: float) -> float:
    """
    Calculate EQ (Equity & Inclusion) component.
    
    Formula: EQ = Equitable_Practices_Percentage
    
    Args:
        equitable_practices_pct: Combined equity metrics (0-100)
        
    Returns:
        EQ score (0-100)
    """
    return validate_score(equitable_practices_pct, "EQ")


def calculate_environmental(renewable_energy_pct: float,
                            recycling_pct: float) -> float:
    """
    Calculate ENV (Environmental) component.
    
    Formula: ENV = (Renewable_Energy_Percentage + Recycling_Percentage) / 2
    
    Args:
        renewable_energy_pct: % electricity from renewable sources
        recycling_pct: % waste diverted from landfill
        
    Returns:
        ENV score (0-100)
    """
    env = (renewable_energy_pct + recycling_pct) / 2
    
    return validate_score(env, "ENV")


def calculate_procurement(local_procurement_pct: float) -> float:
    """
    Calculate PROC (Procurement) component.
    
    Formula: PROC = Local_Procurement_Percentage
    
    Args:
        local_procurement_pct: % of goods/services sourced locally
        
    Returns:
        PROC score (0-100)
    """
    return validate_score(local_procurement_pct, "PROC")


def get_ejv_display(ejv_score: float, percentile: int = None) -> Dict[str, Any]:
    """
    Generate human-friendly display data for EJV score.
    
    Args:
        ejv_score: Final EJV score (0-100)
        percentile: Store's percentile ranking (optional)
        
    Returns:
        Dictionary with primary, secondary, and tertiary display elements
    """
    band = get_impact_band(ejv_score)
    
    display = {
        "fix_impact_score": round(ejv_score, 1),
        "fix_impact_label": "FIX$ Impact Score",
        "primary": {
            "emoji": band["emoji"],
            "label": band["label"],
            "color": band["color"],
            "description": band["description"],
            "display": f"{band['emoji']} {band['label']}"
        },
        "tertiary": {
            "per_10": format_currency((ejv_score / 100) * 10),
            "display": get_dollar_impact_display(ejv_score, 10)
        }
    }
    
    # Add secondary percentile display if available
    if percentile is not None:
        display["secondary"] = {
            "percentile": percentile,
            "display": get_percentile_display(percentile)
        }
    
    return display


def calculate_economic_impact(ejv_score: float,
                               purchase_amount: float = 100.0) -> Dict[str, Any]:
    """
    Calculate economic impact metrics (ELVR and EVL).
    
    ELVR = Estimated Local Value Retained
    EVL = Estimated Value Leakage
    
    Args:
        ejv_score: Final EJV score (0-100)
        purchase_amount: Reference purchase amount
        
    Returns:
        Dictionary with economic impact metrics
    """
    elvr = purchase_amount * (ejv_score / 100)
    evl = purchase_amount - elvr
    
    return {
        "elvr": round(elvr, 2),
        "evl": round(evl, 2),
        "retention_percent": round(ejv_score, 1),
        "formula": f"ELVR = ${purchase_amount:.0f} × {ejv_score/100:.3f} = ${elvr:.2f}",
        "interpretation": f"For every ${purchase_amount:.0f} spent, "
                          f"${elvr:.2f} stays in the local economy"
    }


# =============================================================================
# MAIN EJV CALCULATION
# =============================================================================

def calculate_ejv(store_id: str = "",
                  store_name: str = "",
                  location: str = "",
                  zip_code: str = "",
                  company_name: str = None,
                  category: str = None,
                  is_local_business: bool = False,
                  state_fips: str = None,
                  county_fips: str = None,
                  percentile: int = None,
                  purchase_amount: float = 100.0,
                  # Override values (for testing or manual input)
                  override_local_hiring_pct: float = None,
                  override_local_procurement_pct: float = None,
                  override_store_wage: float = None,
                  override_equity_score: float = None,
                  override_renewable_pct: float = None,
                  override_recycling_pct: float = None) -> EJVResult:
    """
    Calculate complete EJV 4.1 score for a store.
    
    EJV 4.1 = (LC + W + DN + EQ + ENV + PROC) / 6
    
    Args:
        store_id: Unique store identifier
        store_name: Display name of store
        location: Store address
        zip_code: ZIP code for geographic data
        company_name: Company name (for database lookup)
        category: Business category
        is_local_business: Whether this is a local/small business
        state_fips: State FIPS code (alternative to ZIP)
        county_fips: County FIPS code (alternative to ZIP)
        percentile: Pre-calculated percentile ranking
        purchase_amount: Reference purchase amount for impact display
        override_*: Manual override values for testing
        
    Returns:
        EJVResult with complete calculation details
    """
    logger.info(f"Calculating EJV for {store_name or store_id}")
    
    result = EJVResult(
        store_id=store_id,
        store_name=store_name,
        location=location,
        zip_code=zip_code
    )
    
    data_sources = []
    
    # =========================================================================
    # STEP 1: Gather Local Economic Indicators
    # =========================================================================
    
    indicators = get_local_economic_indicators(
        zip_code=zip_code,
        state_fips=state_fips,
        county_fips=county_fips
    )
    data_sources.append(f"Census ACS ({indicators.data_source})")
    
    result.local_context = {
        "median_income": indicators.median_income,
        "unemployment_rate": indicators.unemployment_rate,
        "area_name": indicators.area_name
    }
    
    # =========================================================================
    # STEP 2: Gather Payroll Data
    # =========================================================================
    
    payroll = get_payroll_data(
        zip_code=zip_code,
        company_name=company_name,
        category=category
    )
    data_sources.append(f"Wages ({payroll.data_source})")
    
    store_wage = override_store_wage or payroll.average_hourly_wage
    living_wage_value = living_wage(indicators.median_income)
    
    # =========================================================================
    # STEP 3: Gather Equity Data
    # =========================================================================
    
    equity = get_equity_data(
        company_name=company_name,
        category=category,
        is_local_business=is_local_business
    )
    data_sources.append(f"Equity ({equity.data_source})")
    
    equitable_practices = override_equity_score or equity.equitable_practices_pct
    
    # =========================================================================
    # STEP 4: Gather Environmental Data
    # =========================================================================
    
    env = get_environmental_data(
        company_name=company_name,
        category=category
    )
    data_sources.append(f"Environmental ({env.data_source})")
    
    renewable_pct = override_renewable_pct or env.renewable_energy_pct
    recycling_pct = override_recycling_pct or env.recycling_pct
    
    # =========================================================================
    # STEP 5: Gather Procurement Data
    # =========================================================================
    
    proc = get_procurement_data(
        company_name=company_name,
        category=category
    )
    data_sources.append(f"Procurement ({proc.data_source})")
    
    local_procurement_pct = override_local_procurement_pct or proc.local_procurement_pct
    local_hiring_pct = override_local_hiring_pct or proc.local_hiring_pct
    
    # =========================================================================
    # STEP 6: Calculate Component Scores
    # =========================================================================
    
    # LC — Local Circulation
    lc_score = calculate_local_circulation(local_hiring_pct, local_procurement_pct)
    
    # W — Fair Wages
    w_score = calculate_fair_wages(store_wage, living_wage_value)
    
    # DN — Community Need
    dn_score = calculate_community_need(
        indicators.unemployment_rate,
        indicators.median_income
    )
    
    # EQ — Equity & Inclusion
    eq_score = calculate_equity_inclusion(equitable_practices)
    
    # ENV — Environmental
    env_score = calculate_environmental(renewable_pct, recycling_pct)
    
    # PROC — Procurement
    proc_score = calculate_procurement(local_procurement_pct)
    
    # =========================================================================
    # STEP 7: Calculate Final EJV Score
    # =========================================================================
    
    ejv_score = (lc_score + w_score + dn_score + eq_score + env_score + proc_score) / 6
    
    # =========================================================================
    # STEP 8: Populate Result
    # =========================================================================
    
    result.ejv_score = round(ejv_score / 100, 3)  # 0-1 scale
    result.ejv_percentage = round(ejv_score, 1)    # 0-100 scale
    
    result.components = EJVComponents(
        LC_local_circulation=round(lc_score, 1),
        W_fair_wages=round(w_score, 1),
        DN_community_need=round(dn_score, 1),
        EQ_equity_inclusion=round(eq_score, 1),
        ENV_environmental=round(env_score, 1),
        PROC_procurement=round(proc_score, 1)
    )
    
    result.component_details = {
        "local_circulation": {
            "local_hiring_percent": round(local_hiring_pct, 1),
            "local_procurement_percent": round(local_procurement_pct, 1),
            "score": round(lc_score, 1),
            "source": "Census LODES + Supply Chain Research"
        },
        "fair_wages": {
            "store_wage": round(store_wage, 2),
            "living_wage": round(living_wage_value, 2),
            "ratio": round(store_wage / living_wage_value, 2) if living_wage_value > 0 else 0,
            "score": round(w_score, 1),
            "source": "BLS OEWS + MIT Living Wage"
        },
        "community_need": {
            "unemployment_rate": round(indicators.unemployment_rate, 1),
            "median_income": int(indicators.median_income),
            "national_median_income": NATIONAL_MEDIAN_INCOME,
            "score": round(dn_score, 1),
            "source": "Census ACS (Unemployment, Income)"
        },
        "equity_inclusion": {
            "equitable_practices_percent": round(equitable_practices, 1),
            "score": round(eq_score, 1),
            "source": "Company ESG Reports + EEOC Data"
        },
        "environmental": {
            "renewable_energy_percent": round(renewable_pct, 1),
            "recycling_percent": round(recycling_pct, 1),
            "score": round(env_score, 1),
            "source": "EPA + Company Sustainability Reports"
        },
        "procurement": {
            "local_procurement_percent": round(local_procurement_pct, 1),
            "score": round(proc_score, 1),
            "source": "Industry Research + Supply Chain Analysis"
        }
    }
    
    result.ejv_display = get_ejv_display(ejv_score, percentile)
    result.economic_impact = calculate_economic_impact(ejv_score, purchase_amount)
    result.data_sources = data_sources
    result.local_context["active_employees"] = payroll.employee_count or None
    
    logger.info(f"EJV calculated: {ejv_score:.1f}% for {store_name or store_id}")
    
    return result


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route("/")
def index():
    """API health check and info."""
    return jsonify({
        "name": "FIX$ GeoEquity Impact Engine",
        "version": EJV_VERSION,
        "formula": EJV_FORMULA,
        "status": "healthy"
    })


@app.route("/api/v1/ejv", methods=["POST"])
def api_calculate_ejv():
    """
    Calculate EJV score for a store.
    
    POST /api/v1/ejv
    
    Request body:
    {
        "store_id": "store_123",
        "store_name": "Example Grocery",
        "location": "123 Main St",
        "zip_code": "10001",
        "company_name": "Whole Foods",
        "category": "supermarket",
        "is_local_business": false
    }
    
    Response: Full EJVResult object
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
    
    try:
        result = calculate_ejv(
            store_id=data.get("store_id", ""),
            store_name=data.get("store_name", ""),
            location=data.get("location", ""),
            zip_code=data.get("zip_code", ""),
            company_name=data.get("company_name"),
            category=data.get("category"),
            is_local_business=data.get("is_local_business", False),
            state_fips=data.get("state_fips"),
            county_fips=data.get("county_fips"),
            percentile=data.get("percentile"),
            purchase_amount=data.get("purchase_amount", 100.0),
            override_local_hiring_pct=data.get("local_hiring_pct"),
            override_local_procurement_pct=data.get("local_procurement_pct"),
            override_store_wage=data.get("store_wage"),
            override_equity_score=data.get("equity_score"),
            override_renewable_pct=data.get("renewable_pct"),
            override_recycling_pct=data.get("recycling_pct")
        )
        
        # Convert dataclass to dict for JSON response
        response = asdict(result)
        response["components"] = asdict(result.components)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"EJV calculation error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/ejv/quick", methods=["GET"])
def api_quick_ejv():
    """
    Quick EJV score lookup by ZIP and company.
    
    GET /api/v1/ejv/quick?zip=10001&company=costco
    
    Returns: Simplified EJV score and display
    """
    zip_code = request.args.get("zip", "")
    company = request.args.get("company", "")
    category = request.args.get("category", "")
    
    if not zip_code:
        return jsonify({"error": "zip parameter required"}), 400
    
    try:
        result = calculate_ejv(
            zip_code=zip_code,
            company_name=company or None,
            category=category or None
        )
        
        return jsonify({
            "ejv_score": result.ejv_percentage,
            "display": result.ejv_display,
            "impact": result.economic_impact
        })
        
    except Exception as e:
        logger.error(f"Quick EJV error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/v1/companies", methods=["GET"])
def api_list_companies():
    """List all companies in database."""
    from company_data import list_companies, COMPANY_DATA
    
    companies = []
    for key in list_companies():
        data = COMPANY_DATA[key]
        companies.append({
            "id": key,
            "name": data.get("name", key),
            "category": data.get("category", "unknown")
        })
    
    return jsonify({"companies": companies})


@app.route("/api/v1/categories", methods=["GET"])
def api_list_categories():
    """List all business categories with baselines."""
    from company_data import list_categories
    
    return jsonify({"categories": list_categories()})


@app.route("/api/v1/formula", methods=["GET"])
def api_formula():
    """Return EJV formula documentation."""
    return jsonify({
        "version": EJV_VERSION,
        "name": EJV_VERSION_NAME,
        "formula": EJV_FORMULA,
        "components": {
            "LC": {
                "name": "Local Circulation",
                "weight": "16.67%",
                "formula": "Local_Hiring_% × Local_Procurement_% × 100"
            },
            "W": {
                "name": "Fair Wages",
                "weight": "16.67%",
                "formula": "min(1.0, Store_Wage / Living_Wage) × 100"
            },
            "DN": {
                "name": "Community Need",
                "weight": "16.67%",
                "formula": "((Unemployment_Factor + Income_Factor) / 2) × 100"
            },
            "EQ": {
                "name": "Equity & Inclusion",
                "weight": "16.67%",
                "formula": "Equitable_Practices_%"
            },
            "ENV": {
                "name": "Environmental",
                "weight": "16.67%",
                "formula": "(Renewable_Energy_% + Recycling_%) / 2"
            },
            "PROC": {
                "name": "Procurement",
                "weight": "16.67%",
                "formula": "Local_Procurement_%"
            }
        },
        "constants": {
            "ANNUAL_WORK_HOURS": ANNUAL_WORK_HOURS,
            "HOUSING_RATIO": HOUSING_RATIO,
            "NATIONAL_MEDIAN_INCOME": NATIONAL_MEDIAN_INCOME,
            "UNEMPLOYMENT_THRESHOLD": UNEMPLOYMENT_THRESHOLD
        }
    })


@app.route("/api/v1/impact-bands", methods=["GET"])
def api_impact_bands():
    """Return impact band definitions."""
    from config import IMPACT_BANDS
    return jsonify({"impact_bands": IMPACT_BANDS})


@app.route("/api/overpass", methods=["POST", "OPTIONS"])
def api_overpass_proxy():
    """Proxy requests to Overpass API to avoid CORS issues."""
    import requests as http_requests
    
    # Handle CORS preflight
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    try:
        # Force JSON parsing even if content-type header is not set correctly
        data = request.get_json(force=True, silent=True) or {}
        query = data.get("query")
        
        # Also try form data or raw body
        if not query:
            query = request.form.get("query")
        if not query:
            query = request.data.decode("utf-8") if request.data else None
        
        if not query:
            return jsonify({"error": "Missing query parameter", "received": str(data)}), 400
        
        # Forward request to Overpass API
        overpass_response = http_requests.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30
        )
        
        if not overpass_response.ok:
            return jsonify({
                "error": f"Overpass API error: {overpass_response.status_code}",
                "message": overpass_response.text[:500]
            }), overpass_response.status_code
        
        result = overpass_response.json()
        response = jsonify(result)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
        
    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Overpass API timeout"}), 504
    except http_requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 502
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="FIX$ GeoEquity Impact Engine")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=5000, help="Port to bind to")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    
    # Demo mode
    parser.add_argument("--demo", action="store_true", help="Run demo calculation")
    parser.add_argument("--zip", default="10001", help="ZIP code for demo")
    parser.add_argument("--company", default="costco", help="Company for demo")
    
    args = parser.parse_args()
    
    if args.demo:
        # Run demo calculation
        print("\n" + "="*60)
        print("FIX$ GeoEquity Impact Engine - EJV 4.1 Demo")
        print("="*60)
        
        result = calculate_ejv(
            store_id="demo_store",
            store_name=f"{args.company.title()} Demo",
            location="123 Main Street",
            zip_code=args.zip,
            company_name=args.company,
            percentile=72
        )
        
        print(f"\nStore: {result.store_name}")
        print(f"Location: {result.location} ({result.zip_code})")
        print(f"\n{result.ejv_display['primary']['display']}")
        print(f"EJV Score: {result.ejv_percentage}%")
        print(f"\nComponents:")
        print(f"  LC (Local Circulation):  {result.components.LC_local_circulation}")
        print(f"  W  (Fair Wages):         {result.components.W_fair_wages}")
        print(f"  DN (Community Need):     {result.components.DN_community_need}")
        print(f"  EQ (Equity & Inclusion): {result.components.EQ_equity_inclusion}")
        print(f"  ENV (Environmental):     {result.components.ENV_environmental}")
        print(f"  PROC (Procurement):      {result.components.PROC_procurement}")
        print(f"\n{result.ejv_display['tertiary']['display']}")
        print(f"\n{result.economic_impact['interpretation']}")
        print("\n" + "="*60)
    else:
        # Run Flask API server
        print(f"\nStarting FIX$ GeoEquity Impact Engine API")
        print(f"EJV Version: {EJV_VERSION}")
        print(f"Formula: {EJV_FORMULA}")
        print(f"\nEndpoints:")
        print(f"  POST /api/v1/ejv          - Calculate full EJV score")
        print(f"  GET  /api/v1/ejv/quick    - Quick score lookup")
        print(f"  GET  /api/v1/companies    - List companies")
        print(f"  GET  /api/v1/categories   - List categories")
        print(f"  GET  /api/v1/formula      - Formula documentation")
        print(f"  GET  /api/v1/impact-bands - Impact band definitions")
        print()
        
        app.run(host=args.host, port=args.port, debug=args.debug)
