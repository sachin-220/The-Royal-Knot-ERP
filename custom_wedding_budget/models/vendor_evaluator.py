# -*- coding: utf-8 -*-
"""
Multi-Factor Vendor Intelligence & Statistical Price Anomaly Engine
===================================================================
Calculates the Weighted Composite Index (WCI) across:
- Budget fit (30%)
- Quality rating (25%)
- Punctuality rating (20%)
- Availability (15%)
- Complaint penalty (-10%)

Detects price anomalies using +2σ deviation from regional historical benchmarks.
"""
import math
from typing import Dict, Any, Tuple, List

class WeddingVendorEvaluator:
    """
    Evaluator computing WCI scores and detecting statistical quotation anomalies.
    """

    # Benchmark average market rates per plate in Rajasthan luxury palaces
    REGIONAL_BENCHMARKS = {
        'catering': {'mean': 4200.0, 'std_dev': 650.0},
        'decor': {'mean': 1800000.0, 'std_dev': 350000.0},
        'sound': {'mean': 450000.0, 'std_dev': 80000.0},
        'photo': {'mean': 650000.0, 'std_dev': 120000.0},
    }

    @classmethod
    def calculate_wci(
        cls,
        quoted_amount: float,
        allocated_budget: float,
        quality_rating: float, # 1.0 to 5.0
        punctuality_pct: float, # 0.0 to 100.0
        past_complaints: int,
        availability_verified: bool
    ) -> float:
        """
        Computes the Weighted Composite Index (0.0 to 100.0).
        Higher is better.
        """
        # 1. Budget Fit Score (0 to 30 pts)
        if allocated_budget > 0:
            ratio = quoted_amount / allocated_budget
            if ratio <= 0.90:
                budget_pts = 30.0
            elif ratio <= 1.00:
                budget_pts = 25.0
            elif ratio <= 1.10:
                budget_pts = 15.0
            elif ratio <= 1.25:
                budget_pts = 5.0
            else:
                budget_pts = 0.0
        else:
            budget_pts = 15.0

        # 2. Quality Score (0 to 25 pts)
        # Rating 1.0 - 5.0 mapped to 0 - 25
        clamped_quality = max(1.0, min(5.0, quality_rating or 3.0))
        quality_pts = (clamped_quality / 5.0) * 25.0

        # 3. Punctuality Score (0 to 20 pts)
        clamped_punct = max(0.0, min(100.0, punctuality_pct if punctuality_pct is not None else 85.0))
        punct_pts = (clamped_punct / 100.0) * 20.0

        # 4. Availability Score (0 or 15 pts)
        avail_pts = 15.0 if availability_verified else 0.0

        # 5. Complaints Penalty (-5 pts per complaint, max -10 pts)
        complaint_penalty = min(10.0, (past_complaints or 0) * 5.0)

        wci = budget_pts + quality_pts + punct_pts + avail_pts - complaint_penalty
        return round(max(0.0, min(100.0, wci)), 2)

    @classmethod
    def detect_price_anomaly(
        cls,
        category_code: str,
        price_per_plate: float = 0.0,
        total_quoted: float = 0.0
    ) -> Tuple[bool, float, str]:
        """
        Detects if quote is +2σ above regional destination historical benchmarks.
        Returns: (is_anomaly, sigma_deviation, reason)
        """
        key = 'catering' if 'cater' in category_code.lower() or 'food' in category_code.lower() else None
        if not key:
            if 'decor' in category_code.lower() or 'floral' in category_code.lower():
                key = 'decor'
            elif 'sound' in category_code.lower() or 'dj' in category_code.lower():
                key = 'sound'
            elif 'photo' in category_code.lower() or 'video' in category_code.lower():
                key = 'photo'

        if not key:
            return False, 0.0, "Standard Market Rate"

        bench = cls.REGIONAL_BENCHMARKS[key]
        mean = bench['mean']
        std_dev = bench['std_dev']

        val = price_per_plate if key == 'catering' and price_per_plate > 0 else total_quoted
        if val <= 0:
            return False, 0.0, "Price Not Specified"

        sigma = (val - mean) / std_dev

        if sigma >= 2.0:
            return True, round(sigma, 2), f"Price Anomaly Detected: +{sigma:.1f}σ above regional palace market average (Benchmark ₹{mean:,.0f} ± ₹{std_dev:,.0f})."
        elif sigma <= -2.0:
            return False, round(sigma, 2), f"Unusually Low Quote: {sigma:.1f}σ below market average. Verify supplier quality and deliverables."
        
        return False, round(sigma, 2), "Within standard market standard deviation."
