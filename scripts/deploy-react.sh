#!/bin/bash

# React + Flask 배포 스크립트 for EC2
echo "🚀 Deploying React + Flask TodoWeb to EC2..."

# 시스템 업데이트
echo "📦 Updating system packages..."
sudo yum update -y

# 필요한 패키지 설치
echo "📦 Installing required packages..."
sudo yum install -y python3 python3-pip git nginx

# Node.js 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 애플리케이션 디렉토리 설정
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/todoweb
sudo chown ec2-user:ec2-user /var/www/todoweb
cd /var/www/todoweb

# Python 백엔드 설정
echo "🐍 Setting up Flask backend..."
cd /var/www/todoweb/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 환경변수 설정
cat > .env << EOF
SECRET_KEY=your-super-secret-production-key-$(date +%s)
DATABASE_URL=sqlite:////var/www/todoweb/backend/data/todo.db
FLASK_ENV=production
FLASK_DEBUG=False
EOF

# 데이터베이스 초기화
mkdir -p /var/www/todoweb/backend/data
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database initialized!')
"

# React 프론트엔드 빌드
echo "⚛️ Building React frontend..."
cd /var/www/todoweb
npm install
npm run build

# Gunicorn 서비스 설정 (백엔드용)
echo "⚙️ Setting up Gunicorn service..."
sudo tee /etc/systemd/system/todoweb.service > /dev/null <<EOF
[Unit]
Description=TodoWeb Flask Application
After=network.target

[Service]
User=ec2-user
Group=nginx
WorkingDirectory=/var/www/todoweb/backend
Environment="PATH=/var/www/todoweb/backend/venv/bin"
ExecStart=/var/www/todoweb/backend/venv/bin/gunicorn --workers 3 --bind unix:/var/www/todoweb/backend/todoweb.sock -m 007 wsgi:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 시작
sudo systemctl daemon-reload
sudo systemctl start todoweb
sudo systemctl enable todoweb

# Nginx 설정 (React용으로 수정)
echo "🌐 Setting up Nginx for React..."
sudo tee /etc/nginx/conf.d/todoweb.conf > /dev/null <<EOF
server {
    listen 80;
    server_name 3.35.8.55 todoweb.duckdns.org;

    # React 정적 파일 (dist 폴더)
    location / {
        root /var/www/todoweb/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 캐싱 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 프록시 (Flask 백엔드)
    location /api/ {
        include /etc/nginx/proxy_params;
        proxy_pass http://unix:/var/www/todoweb/backend/todoweb.sock;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 200;
        }
    }
}
EOF

# proxy_params 파일 생성
sudo tee /etc/nginx/proxy_params > /dev/null <<EOF
proxy_set_header Host \$http_host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
EOF

# Nginx 재시작
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 권한 설정
echo "🔐 Setting permissions..."
sudo chown -R ec2-user:nginx /var/www/todoweb
sudo chmod -R 755 /var/www/todoweb

echo ""
echo "✅ React + Flask deployment completed!"
echo ""
echo "🌐 Your app is accessible at:"
echo "   http://3.35.8.55"
echo ""
echo "📊 Check status:"
echo "   sudo systemctl status todoweb"
echo "   sudo systemctl status nginx"
EOF
