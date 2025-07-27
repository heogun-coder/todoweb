#!/bin/bash

# 로컬 개발 환경 설정 스크립트

echo "🚀 Setting up local development environment..."

# 백엔드 설정
echo "🐍 Setting up backend..."
cd backend

# 가상환경 생성 및 활성화
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# OS별 가상환경 활성화
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# 의존성 설치
pip install -r requirements.txt

# 환경변수 파일 생성
if [ ! -f .env ]; then
    cat > .env << EOF
SECRET_KEY=dev-secret-key-$(date +%s)
DATABASE_URL=sqlite:///todo.db
FLASK_ENV=development
FLASK_DEBUG=True
EOF
    echo "✅ Created .env file for development"
fi

# 데이터베이스 초기화
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database initialized!')
"

cd ..

# 프론트엔드 설정
echo "📦 Setting up frontend..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start development servers:"
echo "1. Backend:  cd backend && source venv/bin/activate && python app.py"
echo "2. Frontend: npm run dev"
echo ""
echo "URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000/api/"
