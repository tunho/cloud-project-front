# 빌드 및 배포 가이드

## AWS 프로덕션 빌드

현재 AWS 백엔드 주소: `http://35.170.208.244:5000`

### 빌드 방법

```bash
cd /home/lee/cloud_project/davinci-code-front-ts

# 프로덕션 빌드 (자동으로 .env.production 사용)
npm run build

# 또는 환경 변수를 직접 지정
VITE_BACKEND_URL=http://35.170.208.244:5000 npm run build
```

### 빌드 확인

```bash
# localhost가 없어야 함
grep -r "localhost:5000" dist/

# AWS IP가 있어야 함
grep -r "35.170.208.244" dist/
```

### 배포

#### 옵션 1: S3에 업로드
```bash
aws s3 sync dist/ s3://your-bucket-name/ --acl public-read
```

#### 옵션 2: EC2 서버에 복사
```bash
scp -r dist/* ubuntu@35.170.208.244:/var/www/html/
```

## 로컬 개발

로컬에서는 자동으로 `localhost:5000`을 사용합니다.

```bash
npm run dev
```

## 문제 해결

빌드 후에도 연결이 안되면:

1. **빌드 파일 재확인**
   ```bash
   rm -rf dist/
   npm run build
   grep -r "35.170.208.244" dist/
   ```

2. **브라우저 캐시 삭제**
   - Ctrl+Shift+R (강력 새로고침)

3. **백엔드 서버 상태 확인**
   ```bash
   ssh ubuntu@35.170.208.244
   sudo systemctl status davinci-backend
   ```

4. **방화벽 확인**
   - AWS 보안 그룹에서 포트 5000 개방 확인
