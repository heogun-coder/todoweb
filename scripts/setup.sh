#!/bin/bash

# Setup script for TodoWeb application

echo "🚀 Setting up TodoWeb application..."

# Create backend virtual environment
echo "📦 Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment variables
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

# Initialize database
echo "🗄️  Initializing database..."
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database initialized!')"

cd ..

# Install frontend dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && source venv/bin/activate && python app.py"
echo "2. Frontend: npm run dev"
echo ""
echo "Or use Docker: docker-compose up"
