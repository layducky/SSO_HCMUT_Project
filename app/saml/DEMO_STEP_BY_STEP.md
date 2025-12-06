# 🚀 SAML SSO Demo - Hướng Dẫn Chạy Từng Bước

> **Mục tiêu**: Chạy thành công demo SAML SSO với Identity Provider (IdP) và Service Provider (SP) trong môi trường local.

---

## 📋 Mục Lục

1. [Chuẩn Bị](#1-chuẩn-bị)
2. [Cài Đặt Dependencies](#2-cài-đặt-dependencies)
3. [Khởi Động Backend (IdP)](#3-khởi-động-backend-idp)
4. [Khởi Động Frontend (SP)](#4-khởi-động-frontend-sp)
5. [Test SAML Validator](#5-test-saml-validator)
6. [Chạy Demo Flow](#6-chạy-demo-flow)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Chuẩn Bị

### 1.1 Kiểm Tra Yêu Cầu Hệ Thống

```powershell
# Kiểm tra Node.js (yêu cầu >= 14.x)
node --version

# Kiểm tra npm
npm --version
```

**Yêu cầu tối thiểu:**
- ✅ Node.js >= 14.x
- ✅ npm >= 6.x
- ✅ PowerShell (Windows) hoặc Bash (Linux/Mac)

### 1.2 Cấu Trúc Thư Mục

```
app/saml/
├── backend/          # SAML Identity Provider (IdP)
│   ├── index.js
│   ├── validator.js
│   ├── package.json
│   ├── certs/
│   │   ├── cert.pem
│   │   └── key.pem
│   └── views/
│       └── login.ejs
├── frontend/         # SAML Service Provider (SP)
│   ├── index.js
│   ├── validator.js
│   ├── package.json
│   └── views/
│       └── protected.ejs
├── DEMO_STEP_BY_STEP.md
├── SAML_FLOW_EXPLAINED.md
├── VALIDATOR_EXPLANATION.md
└── test-validator-complete.js
```

---

## 2. Cài Đặt Dependencies

### 2.1 Cài Đặt Backend Dependencies

```powershell
# Di chuyển vào thư mục backend
cd app\saml\backend

# Cài đặt packages
npm install

# Kiểm tra cài đặt thành công
npm list --depth=0
```

**Kết quả mong đợi:**
```
saml-idp-demo@1.0.0
├── body-parser@1.20.2
├── ejs@3.1.9
├── express@4.18.2
├── express-session@1.17.3
├── libxmljs2@0.37.0
└── samlify@2.8.11
```

### 2.2 Cài Đặt Frontend Dependencies

```powershell
# Di chuyển vào thư mục frontend
cd ..\frontend

# Cài đặt packages
npm install

# Kiểm tra cài đặt thành công
npm list --depth=0
```

**Kết quả mong đợi:**
```
saml-sp-demo@1.0.0
├── body-parser@1.20.2
├── ejs@3.1.9
├── express@4.18.2
├── express-session@1.17.3
├── libxmljs2@0.37.0
└── samlify@2.8.11
```

---

## 3. Khởi Động Backend (IdP)

### 3.1 Mở Terminal Mới Cho Backend

```powershell
# Di chuyển vào thư mục backend
cd app\saml\backend

# Khởi động IdP server
node index.js
```

### 3.2 Xác Nhận Backend Đã Chạy

**Kết quả mong đợi trong console:**

```
📋 SAML Validator initialized in RELAXED mode

🔐 SAML Identity Provider (IdP) - Crypto Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 URLs:
   Login:    http://localhost:7000/login
   SSO:      http://localhost:7000/sso
   Metadata: http://localhost:7000/metadata

🎫 Demo Credentials:
   Username: minhnh3
   Password: password

🔧 Configuration:
   Entity ID: http://localhost:7000/idp
   Signature Algorithm: http://www.w3.org/2001/04/xmldsig-more#rsa-sha256
   Digest Algorithm: http://www.w3.org/2001/04/xmlenc#sha256
   Validator Mode: RELAXED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on port 7000
```

### 3.3 Test Backend Endpoints

Mở browser và truy cập:
- ✅ http://localhost:7000/login → Phải thấy login form
- ✅ http://localhost:7000/metadata → Phải thấy XML metadata

---

## 4. Khởi Động Frontend (SP)

### 4.1 Mở Terminal Mới Cho Frontend

**⚠️ QUAN TRỌNG**: Giữ terminal backend đang chạy, mở terminal mới!

```powershell
# Di chuyển vào thư mục frontend
cd app\saml\frontend

# Khởi động SP server
node index.js
```

### 4.2 Xác Nhận Frontend Đã Chạy

**Kết quả mong đợi trong console:**

```
📋 SAML Validator initialized in RELAXED mode

🛡️  SAML Service Provider (SP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 URLs:
   Protected: http://localhost:7001/protected
   Metadata:  http://localhost:7001/metadata
   ACS:       http://localhost:7001/assert

🔧 Configuration:
   Entity ID: http://localhost:7001/sp
   IdP URL: http://localhost:7000/sso
   Validator Mode: RELAXED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on port 7001
```

### 4.3 Test Frontend Endpoints

Mở browser và truy cập:
- ✅ http://localhost:7001/protected → Phải redirect đến IdP login
- ✅ http://localhost:7001/metadata → Phải thấy XML metadata

---

## 5. Test SAML Validator

### 5.1 Chạy Test Suite

```powershell
# Di chuyển về thư mục saml
cd app\saml

# Chạy test validator
node test-validator-complete.js
```

### 5.2 Kết Quả Mong Đợi

```
══════════════════════════════════════════════════════════════════════
🧪 SAML Validator - Complete Test Suite
══════════════════════════════════════════════════════════════════════

📊 VALIDATION MODE COMPARISON
┌─────────────────┬─────────┬─────────┬─────────────┐
│ Mode            │ Passed  │ Failed  │ Success Rate│
├─────────────────┼─────────┼─────────┼─────────────┤
│ DISABLED        │      6 │      0 │       100% │
│ RELAXED         │      5 │      1 │        83% │
│ STRICT          │      5 │      1 │        83% │
└─────────────────┴─────────┴─────────┴─────────────┘
```

### 5.3 Thay Đổi Validation Mode

#### 📝 Backend (IdP)

Mở `backend/index.js` và tìm dòng:

```javascript
const VALIDATION_MODE = ValidationMode.RELAXED; // <-- Thay đổi ở đây
```

**Các mode có sẵn:**
- `ValidationMode.DISABLED` - Không validate (demo nhanh)
- `ValidationMode.RELAXED` - Validate cơ bản (khuyến nghị)
- `ValidationMode.STRICT` - Validate đầy đủ (production)

#### 📝 Frontend (SP)

Mở `frontend/index.js` và thay đổi tương tự.

---

## 6. Chạy Demo Flow

### 6.1 Bước 1: Truy Cập Protected Resource

```
1. Mở browser: http://localhost:7001/protected
2. Browser tự động redirect đến IdP
```

**Console log (Frontend):**
```
🔐 Protected resource accessed - initiating SAML login
📤 Redirecting to IdP: http://localhost:7000/sso
```

### 6.2 Bước 2: IdP Nhận AuthnRequest

**Console log (Backend):**
```
📥 Received AuthnRequest from SP
✅ XML is well-formed and has basic SAML structure
🔑 Showing login form
```

**Browser:**
- Thấy login form tại `http://localhost:7000/login`
- Form có 2 fields: username và password

### 6.3 Bước 3: Đăng Nhập

```
Username: minhnh3
Password: password
```

**Console log (Backend):**
```
🔐 Login attempt - Username: minhnh3
✅ Login successful
📝 Creating SAML Response...
📤 Sending SAML Response to SP
```

### 6.4 Bước 4: SP Xử Lý SAML Response

**Console log (Frontend):**
```
📨 Received SAML Response
📋 SAML Validator initialized in RELAXED mode
✅ XML is well-formed and has basic SAML structure
✅ SAML Response validated successfully
👤 User logged in: minhnh3
```

### 6.5 Bước 5: Truy Cập Thành Công

**Browser:**
- Hiển thị protected page với thông tin user
- URL: `http://localhost:7001/protected`

**Nội dung trang:**
```
🔐 Protected Resource

✅ Authentication Successful!

User Information:
- Username: minhnh3
- Email: minhnh3@example.com
- Role: user

🎉 You are now logged in via SAML SSO!
```

---

## 7. Troubleshooting

### 7.1 Lỗi: "Port already in use"

**Triệu chứng:**
```
Error: listen EADDRINUSE: address already in use :::7000
```

**Giải pháp:**

```powershell
# Tìm process đang dùng port 7000
netstat -ano | findstr :7000

# Kill process (thay <PID> bằng số process ID)
taskkill /PID <PID> /F
```

### 7.2 Lỗi: "Cannot find module 'libxmljs2'"

**Triệu chứng:**
```
Error: Cannot find module 'libxmljs2'
```

**Giải pháp:**

```powershell
# Cài đặt lại dependencies
npm install libxmljs2 --save
```

### 7.3 Lỗi: "SAML Response validation failed"

**Triệu chứng:**
```
❌ SAML Response validation failed
```

**Giải pháp:**

1. **Kiểm tra validation mode:**

```javascript
// Thử chuyển sang DISABLED mode để test
const VALIDATION_MODE = ValidationMode.DISABLED;
```

2. **Kiểm tra console logs:**

```powershell
# Backend log sẽ hiển thị chi tiết lỗi
```

3. **Xem chi tiết error:**

Mở `backend/validator.js` và thêm logging:

```javascript
console.log('📋 XML content:', xml);
```

### 7.4 Lỗi: "Session lost after redirect"

**Triệu chứng:**
- Login thành công nhưng vẫn redirect về IdP

**Giải pháp:**

1. **Xóa cookies và thử lại:**
   - Mở DevTools (F12)
   - Application → Cookies → Clear

2. **Kiểm tra session configuration:**

```javascript
// backend/index.js và frontend/index.js
app.use(session({ 
  secret: 'saml-idp-demo', 
  resave: false, 
  saveUninitialized: true,
  cookie: { secure: false } // Quan trọng cho HTTP
}));
```

### 7.5 Debug Mode

#### Bật Debug Logs

**Backend (`backend/index.js`):**

```javascript
// Thêm sau require statements
const DEBUG = true;

// Thêm middleware logging
app.use((req, res, next) => {
  if (DEBUG) {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log('📋 Body:', req.body);
    console.log('🍪 Session:', req.session);
  }
  next();
});
```

**Frontend (`frontend/index.js`):** tương tự

#### Xem SAML XML

Mở browser DevTools:
1. Network tab
2. Tìm request có "SAMLResponse"
3. View Form Data
4. Decode Base64:

```javascript
// Browser console
atob('SAMLResponse_base64_string_here')
```

### 7.6 Certificates Issues

**Triệu chứng:**
```
Error: Unable to load certificate
```

**Giải pháp:**

```powershell
# Kiểm tra certificates tồn tại
cd app\saml\backend\certs
dir

# Nếu không có, tạo mới:
# (Backend sẽ tự tạo khi start lần đầu)
```

---

## 8. Next Steps

### 8.1 Đọc Chi Tiết SAML Flow

```powershell
# Đọc tài liệu flow
notepad SAML_FLOW_EXPLAINED.md
```

### 8.2 Đọc Chi Tiết Validator

```powershell
# Đọc tài liệu validator
notepad VALIDATOR_EXPLANATION.md
```

### 8.3 Customize Demo

1. **Thay đổi user credentials:**

Mở `backend/index.js`, tìm:

```javascript
const users = {
  minhnh3: { password: 'password', email: 'minhnh3@example.com', role: 'user' }
};

// Thêm user mới:
const users = {
  minhnh3: { password: 'password', email: 'minhnh3@example.com', role: 'user' },
  admin: { password: 'admin123', email: 'admin@example.com', role: 'admin' }
};
```

2. **Thay đổi UI:**

- Login form: `backend/views/login.ejs`
- Protected page: `frontend/views/protected.ejs`

3. **Thêm attributes:**

Mở `backend/index.js`, tìm `createTemplateCallback`:

```javascript
const attributes = {
  username: user.username,
  email: user.email,
  role: user.role,
  // Thêm attributes mới:
  department: 'Engineering',
  location: 'HCMUT'
};
```

---

## 9. Production Checklist

Trước khi deploy lên production:

- [ ] Đổi validation mode sang `STRICT`
- [ ] Đổi session secret thành random string
- [ ] Enable HTTPS (thay `http://` thành `https://`)
- [ ] Thay đổi default credentials
- [ ] Thêm rate limiting
- [ ] Thêm logging system
- [ ] Setup SSL certificates chính thức
- [ ] Test với real SAML IdP (Okta, Auth0, Azure AD)

---

## 📚 Tài Liệu Tham Khảo

- **SAML Flow**: `SAML_FLOW_EXPLAINED.md` - Chi tiết 9 bước SAML authentication
- **Validator**: `VALIDATOR_EXPLANATION.md` - Cách hoạt động của validator
- **Quick Start**: `QUICK_START.md` - Hướng dẫn nhanh 3 bước
- **Main README**: `readme.md` - Overview của project

---

## 🆘 Cần Giúp Đỡ?

1. Check console logs của cả backend và frontend
2. Đọc error messages cẩn thận
3. Tham khảo Troubleshooting section
4. Test validator với `node test-validator-complete.js`
5. Thử DISABLED mode để isolate vấn đề

---

**✅ Chúc bạn chạy demo thành công!** 🎉
