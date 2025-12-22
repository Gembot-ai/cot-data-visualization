#!/bin/bash

# CoT Platform Setup Script
echo "🚀 Setting up CoT Data Aggregation Platform..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Create environment files
echo "📝 Creating environment files..."

if [ ! -f cot-backend/.env ]; then
    cp cot-backend/.env.example cot-backend/.env
    echo "✅ Backend .env created"
else
    echo "⏭️  Backend .env already exists"
fi

if [ ! -f cot-frontend/.env ]; then
    cp cot-frontend/.env.example cot-frontend/.env
    echo "✅ Frontend .env created"
else
    echo "⏭️  Frontend .env already exists"
fi

# Start Docker Compose
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Initialize database
echo "🗄️  Initializing database schema..."
docker exec -i $(docker ps -qf "name=postgres") psql -U cot_user -d cot_db < cot-backend/src/database/schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully"
else
    echo "⚠️  Database initialization may have failed. Check logs with: docker-compose logs postgres"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📊 Access your application:"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://localhost:3001"
echo "  - API Docs:  http://localhost:3001/"
echo ""
echo "📚 Next steps:"
echo "  1. The database has been initialized with market data"
echo "  2. Open http://localhost:3000 to view the dashboard"
echo "  3. Check backend logs: docker-compose logs -f api"
echo "  4. Check frontend logs: docker-compose logs -f frontend"
echo ""
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""
