#!/bin/bash
set -e

echo "🚀 CoT Dashboard - Production Data Fetch"
echo "========================================"
echo ""

# Check if railway is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI ready"
echo ""

# Link project
echo "📎 Linking to Railway project..."
echo "   (Select 'cot-dash' when prompted)"
echo ""
railway link

echo ""
echo "🔄 Running data fetch on production..."
echo "   This will take ~5-10 minutes"
echo ""

railway run npm run fetch-all

echo ""
echo "✅ Data fetch complete!"
echo ""
echo "Verify at your production URL:"
echo "  curl https://[your-url]/api/v1/cot/ZB"
echo "  curl https://[your-url]/api/v1/markets"
