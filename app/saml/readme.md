# ⚡ SAML SSO Quick Start

> 📚 **[Bắt đầu ở đây: DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Hướng dẫn đọc tài liệu theo mục đích của bạn

---

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
```

## 📚 Tài Liệu Chi Tiết

### 🚀 Hướng Dẫn Từng Bước (KHUYẾN NGHỊ ĐỌC ĐẦU TIÊN)
👉 **[DEMO_STEP_BY_STEP.md](./DEMO_STEP_BY_STEP.md)** - Hướng dẫn chạy demo chi tiết:
- Chuẩn bị và kiểm tra hệ thống
- Cài đặt dependencies từng bước
- Khởi động backend và frontend
- Test SAML Validator
- Chạy demo flow hoàn chỉnh
- Troubleshooting & Debug tips
- Production checklist

### 📖 Giải Thích SAML Flow
👉 **[SAML_FLOW_EXPLAINED.md](./SAML_FLOW_EXPLAINED.md)** - Tài liệu chi tiết giải thích:
- Cách SAML hoạt động từng bước (9 bước với biểu đồ)
- Code tương ứng cho mỗi bước
- SAML Response structure
- Bảo mật SAML
- Debug tips & common errors
- So sánh với OAuth 2.0 và OIDC

### 🔐 SAML Validator
👉 **[VALIDATOR_EXPLANATION.md](./VALIDATOR_EXPLANATION.md)** - Chi tiết về validator:
- 3 validation modes (DISABLED, RELAXED, STRICT)
- Code implementation và use cases
- Cách chuyển đổi giữa các modes
- Security considerations
- Troubleshooting validator issues
- Advanced validation topics

### 🚀 Quick Start Options
- **Manual**: Làm theo hướng dẫn ở trên
- **Auto (Batch)**: Chạy `start-demo.bat`
- **Auto (PowerShell)**: Chạy `start-demo.ps1`

### 🔧 Scripts Tự Động
Để khởi động cả IdP và SP cùng lúc:
```powershell
# Windows Command Prompt
start-demo.bat

# PowerShell
.\start-demo.ps1
```

### 🐛 Troubleshooting
Nếu gặp lỗi:
1. Check port 7000 và 7001 có đang được sử dụng không
2. Xem console logs của IdP và SP
3. Kiểm tra file `SAML_FLOW_EXPLAINED.md` phần Debug Tips
4. Verify `node_modules` đã được cài đặt đầy đủ

### 📝 Notes
- Demo credentials: `minhnh3` / `dhbkhcm2022`
- Certificates trong `backend/certs/` chỉ dùng cho demo
- Session timeout: Mặc định khi đóng browser