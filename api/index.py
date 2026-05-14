"""
Vercel Serverless Function Entry Point
FIX$ GeoEquity Impact Engine - EJV 4.1

This module exposes the Flask app for Vercel's Python runtime.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel expects the app to be named 'app' or 'handler'
# Flask app is WSGI compatible which Vercel supports
