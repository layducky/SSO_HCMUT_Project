# ⚡ SAML SSO Quick Start

### Bước 1: Cài đặt Dependencies
```powershell
# Terminal 1 - Cài đặt IdP
cd "...\SSO_HCMUT_Project\app\saml\backend"
npm install

# Terminal 2 - Cài đặt SP  
cd "...\SSO_HCMUT_Project\app\saml\frontend"
npm install
```

### Bước 2: Khởi động Servers
```powershell
# Terminal 1 - Start IdP
cd backend
node index.js

# Terminal 2 - Start SP
cd frontend  
node index.js
```

### Bước 3: Test SSO
1. Truy cập: http://localhost:7001
2. Click "🔒 Access Protected Resource"
3. Đăng nhập: `minhnh3` / `dhbkhcm2022`
4. ✅ Thành công!

## 🔗 URLs Quan trọng
- **SP Home**: http://localhost:7001
- **IdP Home**: http://localhost:7000
- **Login**: Tự động redirect khi cần

## 🎯 Demo Flow
```
SP (7001) → IdP Login (7000) → Back to SP → Protected Resource ✅