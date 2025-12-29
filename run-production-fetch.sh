#!/bin/bash

echo "🚀 Running CoT Data Fetch on Production"
echo "========================================"
echo ""
echo "Project: cot-dash"
echo "Environment: production"
echo ""

# Use the project and environment IDs directly
RAILWAY_PROJECT_ID="72bc8a64-7a0d-466f-8326-a76c10b208f0"
RAILWAY_ENVIRONMENT_ID="e39be340-6b7f-454f-ba85-c2ff64249300"
SERVICE_ID="8eae9ab5-9e31-4c53-8300-8d3224b353c0"

# Try with link command providing project ID
echo "Attempting to link project..."
railway link $RAILWAY_PROJECT_ID --environment production 2>&1

echo ""
echo "Running fetch command..."
railway run npm run fetch-all

echo ""
echo "✅ Complete!"
