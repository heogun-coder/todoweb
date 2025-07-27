# EC2 TodoWeb 배포 가이드

## 1. EC2 인스턴스 준비

### 보안 그룹 설정
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0  
- SSH (22): Your IP

### EC2 접속
\`\`\`bash
ssh -i your-key.pem ec2-user@3.35.8.55
\`\`\`

## 2. 코드 배포

### 방법 1: Git 사용
\`\`\`bash
cd /home/ec2-user
git clone https://github.com/your-username/todoweb.git
cd todoweb
chmod +x scripts/deploy.sh
./scripts/deploy.sh
\`\`\`

### 방법 2: 파일 직접 업로드
\`\`\`bash
# 로컬에서 실행
scp -i your-key.pem -r . ec2-user@3.35.8.55:/home/ec2-user/todoweb/

# EC2에서 실행
cd /home/ec2-user/todoweb
chmod +x scripts/deploy.sh
./scripts/deploy.sh
\`\`\`

## 3. 데이터베이스 위치 및 관리

### SQLite 파일 위치
\`\`\`
/var/www/todoweb/backend/data/todo.db
\`\`\`

### 데이터베이스 백업
\`\`\`bash
# 백업 생성
sudo cp /var/www/todoweb/backend/data/todo.db /home/ec2-user/todo_backup_$(date +%Y%m%d).db

# 백업 복원
sudo cp /home/ec2-user/todo_backup_20240128.db /var/www/todoweb/backend/data/todo.db
sudo chown ec2-user:nginx /var/www/todoweb/backend/data/todo.db
sudo chmod 664 /var/www/todoweb/backend/data/todo.db
\`\`\`

## 4. 환경변수 설정

### .env 파일 수정
\`\`\`bash
sudo nano /var/www/todoweb/backend/.env
\`\`\`

### 필수 설정값
\`\`\`env
SECRET_KEY=your-unique-secret-key-here-$(openssl rand -hex 32)
DATABASE_URL=sqlite:////var/www/todoweb/backend/data/todo.db
FLASK_ENV=production
FLASK_DEBUG=False
\`\`\`

## 5. 서비스 관리 명령어

### 서비스 상태 확인
\`\`\`bash
sudo systemctl status todoweb
sudo systemctl status nginx
\`\`\`

### 서비스 재시작
\`\`\`bash
sudo systemctl restart todoweb
sudo systemctl restart nginx
\`\`\`

### 로그 확인
\`\`\`bash
# Flask 앱 로그
sudo journalctl -u todoweb -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
\`\`\`

## 6. DuckDNS 설정 (선택사항)

### DuckDNS 토큰 설정
\`\`\`bash
# DuckDNS 업데이트 스크립트 생성
echo 'curl "https://www.duckdns.org/update?domains=todoweb&token=YOUR_DUCKDNS_TOKEN&ip=" >/dev/null 2>&1' > /home/ec2-user/duckdns.sh
chmod +x /home/ec2-user/duckdns.sh

# 크론탭에 추가 (5분마다 업데이트)
crontab -e
# 다음 라인 추가:
# */5 * * * * /home/ec2-user/duckdns.sh
\`\`\`

### Let's Encrypt SSL 설정
\`\`\`bash
# Certbot 설치
sudo yum install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d todoweb.duckdns.org
\`\`\`

## 7. 트러블슈팅

### 일반적인 문제들

1. **502 Bad Gateway**
   \`\`\`bash
   sudo systemctl status todoweb
   sudo journalctl -u todoweb -n 50
   \`\`\`

2. **데이터베이스 권한 오류**
   \`\`\`bash
   sudo chown -R ec2-user:nginx /var/www/todoweb/backend/data/
   sudo chmod 664 /var/www/todoweb/backend/data/todo.db
   \`\`\`

3. **정적 파일 404 오류**
   \`\`\`bash
   cd /var/www/todoweb
   npm run build
   sudo systemctl restart nginx
   \`\`\`

## 8. 모니터링

### 시스템 리소스 확인
\`\`\`bash
htop
df -h
free -h
\`\`\`

### 애플리케이션 상태 확인
\`\`\`bash
curl http://localhost/api/
curl http://3.35.8.55/
