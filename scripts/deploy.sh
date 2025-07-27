#!/bin/bash

# EC2 배포 스크립트 for TodoWeb
# 사용법: ssh로 EC2에 접속한 후 이 스크립트 실행

echo "🚀 Deploying TodoWeb to EC2..."

# 현재 사용자 확인
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# 시스템 업데이트
echo "📦 Updating system packages..."
sudo yum update -y

# 필요한 패키지 설치 (Amazon Linux 2)
echo "📦 Installing required packages..."
sudo yum install -y python3 python3-pip git nginx

# Node.js 설치 (Amazon Linux 2)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 애플리케이션 디렉토리 생성
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/todoweb
sudo chown ec2-user:ec2-user /var/www/todoweb
cd /var/www/todoweb

# Git에서 코드 클론 (또는 파일 복사)
# git clone your-repo-url .

# Python 가상환경 설정
echo "🐍 Setting up Python virtual environment..."
cd /var/www/todoweb/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 환경변수 파일 생성
echo "📝 Creating production environment file..."
cat > .env << EOF
SECRET_KEY=your-super-secret-production-key-$(date +%s)
DATABASE_URL=sqlite:////var/www/todoweb/backend/data/todo.db
FLASK_ENV=production
FLASK_DEBUG=False
EOF

# 데이터베이스 디렉토리 생성 및 권한 설정
echo "🗄️ Setting up database..."
mkdir -p /var/www/todoweb/backend/data
chmod 755 /var/www/todoweb/backend/data

# 데이터베이스 초기화
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('✅ Database initialized successfully!')
"

# 프론트엔드 빌드
echo "🏗️ Building frontend..."
cd /var/www/todoweb
npm install
npm run build

# Gunicorn 서비스 설정
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

# 서비스 시작 및 활성화
sudo systemctl daemon-reload
sudo systemctl start todoweb
sudo systemctl enable todoweb
sudo systemctl status todoweb

# Nginx 설정
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/conf.d/todoweb.conf > /dev/null <<EOF
server {
    listen 80;
    server_name 3.35.8.55 todoweb.duckdns.org;

    # 프론트엔드 정적 파일
    location / {
        root /var/www/todoweb/out;
        try_files \$uri \$uri/ /index.html;
        
        # CORS 헤더 추가
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }

    # API 프록시
    location /api/ {
        include /etc/nginx/proxy_params;
        proxy_pass http://unix:/var/www/todoweb/backend/todoweb.sock;
        
        # CORS 헤더
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # OPTIONS 요청 처리
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

# proxy_params 파일이 없으면 생성
if [ ! -f /etc/nginx/proxy_params ]; then
    sudo tee /etc/nginx/proxy_params > /dev/null <<EOF
proxy_set_header Host \$http_host;
proxy_set_header X-Real-IP \$remote_addr;
proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto \$scheme;
EOF
fi

# Nginx 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 방화벽 설정 (필요한 경우)
echo "🔥 Configuring firewall..."
sudo systemctl start firewalld 2>/dev/null || echo "Firewalld not available"
sudo firewall-cmd --permanent --add-service=http 2>/dev/null || echo "Firewall rule not added"
sudo firewall-cmd --permanent --add-service=https 2>/dev/null || echo "Firewall rule not added"
sudo firewall-cmd --reload 2>/dev/null || echo "Firewall not reloaded"

# 파일 권한 설정
echo "🔐 Setting file permissions..."
sudo chown -R ec2-user:nginx /var/www/todoweb
sudo chmod -R 755 /var/www/todoweb
sudo chmod 664 /var/www/todoweb/backend/data/todo.db 2>/dev/null || echo "Database file will be created on first run"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   http://3.35.8.55"
echo "   http://todoweb.duckdns.org (if DNS is configured)"
echo ""
echo "📊 Service status:"
sudo systemctl status todoweb --no-pager -l
echo ""
echo "📝 To check logs:"
echo "   sudo journalctl -u todoweb -f"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔧 To restart services:"
echo "   sudo systemctl restart todoweb"
echo "   sudo systemctl restart nginx"
