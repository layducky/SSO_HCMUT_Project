# 🔐 SAML SSO Flow - Giải Thích Chi Tiết

## 📋 Tổng Quan

SAML (Security Assertion Markup Language) là một chuẩn mở cho phép Single Sign-On (SSO). Demo này bao gồm:

- **Identity Provider (IdP)** - Backend: Server xác thực người dùng (port 7000)
- **Service Provider (SP)** - Frontend: Ứng dụng yêu cầu xác thực (port 7001)

---

## 🔄 Luồng Hoạt Động SAML (SP-Initiated Flow)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │  SP (7001)  │         │  IdP (7000) │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                        │
       │ 1. Truy cập /protected│                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │ 2. Redirect to IdP    │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 3. GET /sso           │                        │
       ├────────────────────────────────────────────────>│
       │                       │                        │
       │ 4. Login Form         │                        │
       │<────────────────────────────────────────────────┤
       │                       │                        │
       │ 5. POST credentials   │                        │
       ├────────────────────────────────────────────────>│
       │                       │                        │
       │                       │  6. Generate SAML      │
       │                       │     Response           │
       │                       │<───────────────────────┤
       │                       │                        │
       │ 7. POST SAMLResponse  │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 8. POST to /assert    │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │                       │  9. Validate SAML      │
       │                       │     & Create Session   │
       │                       ├────────────────────────>│
       │                       │                        │
       │ 10. Redirect          │                        │
       │     to /protected     │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 11. Access Protected  │                        │
       │     Resource          │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │ 12. Protected Content │                        │
       │<──────────────────────┤                        │
```

---

## 📝 Chi Tiết Từng Bước

### **BƯỚC 1: Khởi tạo cấu hình SAML**

#### 📂 File: `backend/index.js` (IdP)

```javascript
// Line 5-13: Cấu hình validator
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: true };
  }
});

// Line 21-23: Load SSL certificates
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')).toString();
const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')).toString();

// Line 25-67: Khởi tạo IdP với template SAML Response
const idp = saml.IdentityProvider({
  entityID: 'http://localhost:7000/idp',
  singleSignOnService: [{ 
    Binding: saml.Constants.namespace.binding.post, 
    Location: 'http://localhost:7000/sso' 
  }],
  signingCert: cert,
  privateKey: key,
  wantAuthnRequestsSigned: false,
  isAssertionEncrypted: false,
  loginResponseTemplate: {
    context: `<samlp:Response ...>
      <saml:Assertion>
        <saml:Subject>
          <saml:NameID>{NameID}</saml:NameID>
        </saml:Subject>
        <saml:AttributeStatement>
          {AttributeStatement}
        </saml:AttributeStatement>
      </saml:Assertion>
    </samlp:Response>`,
    attributes: [
      {
        name: 'username',
        valueTag: 'username',
        nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        valueXsiType: 'xs:string'
      }
    ]
  }
});
```

**🔍 Giải thích:**
- `entityID`: Định danh duy nhất của IdP
- `singleSignOnService`: URL endpoint xử lý đăng nhập
- `signingCert` & `privateKey`: Chứng chỉ SSL để ký SAML Response
- `loginResponseTemplate`: Template XML cho SAML Response

#### 📂 File: `frontend/index.js` (SP)

```javascript
// Line 20-23: Cấu hình Service Provider
const sp = saml.ServiceProvider({
  entityID: 'http://localhost:7001/sp',
  assertionConsumerService: [{ 
    Binding: saml.Constants.namespace.binding.post, 
    Location: 'http://localhost:7001/assert' 
  }]
});

// Line 25-32: Cấu hình IdP metadata cho SP
const idp = saml.IdentityProvider({
  entityID: 'http://localhost:7000/idp',
  singleSignOnService: [{ 
    Binding: saml.Constants.namespace.binding.post, 
    Location: 'http://localhost:7000/sso' 
  }],
  signingCert: fs.readFileSync(path.join(__dirname, '../backend/certs/cert.pem')).toString(),
  wantAuthnRequestsSigned: false,
  isAssertionEncrypted: false
});
```

**🔍 Giải thích:**
- `assertionConsumerService`: URL endpoint nhận SAML Response từ IdP
- SP cần biết thông tin IdP để validate SAML Response

---

### **BƯỚC 2: User truy cập tài nguyên được bảo vệ**

#### 📂 File: `frontend/index.js` - Line 68-75

```javascript
// Protected resource
app.get('/protected', (req, res) => {
  if (!req.session.user) {
    // ❌ Chưa đăng nhập -> Redirect đến IdP
    res.redirect('http://localhost:7000/sso?RelayState=protected');
  } else {
    // ✅ Đã đăng nhập -> Hiển thị trang protected
    res.render('protected', { user: req.session.user });
  }
});
```

**🔍 Giải thích:**
- Kiểm tra `req.session.user` để xác định user đã đăng nhập chưa
- Nếu chưa: Redirect đến IdP endpoint `/sso`
- `RelayState=protected`: Tham số để IdP biết redirect về đâu sau khi đăng nhập

---

### **BƯỚC 3: IdP hiển thị form đăng nhập**

#### 📂 File: `backend/index.js` - Line 104-109

```javascript
// SSO endpoint - GET
app.get('/sso', (req, res) => {
  const samlRequest = req.query.SAMLRequest;
  const relayState = req.query.RelayState || '';
  res.render('login', { relayState, samlRequest });
});
```

**🔍 Giải thích:**
- Nhận `RelayState` từ query string
- Render form đăng nhập với EJS template

#### 📂 File: `backend/views/login.ejs`

```html
<form method="post" action="/sso">
  <input type="hidden" name="relayState" value="<%= relayState %>">
  <input type="hidden" name="samlRequest" value="<%= samlRequest %>">
  <input type="text" name="username" placeholder="Username" required>
  <input type="password" name="password" placeholder="Password" required>
  <button type="submit">Sign In</button>
</form>
```

**🔍 Giải thích:**
- Hidden fields để giữ `relayState` và `samlRequest`
- Form POST về `/sso` để xử lý đăng nhập

---

### **BƯỚC 4: User nhập thông tin đăng nhập**

#### 📂 File: `backend/index.js` - Line 111-137

```javascript
app.post('/sso', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const relayState = req.body.relayState;
  const samlRequest = req.body.samlRequest;

  // ✅ BƯỚC 4.1: Validate credentials
  if (!username || !password) {
    return res.status(400).send('<h2>Username and password are required.</h2>');
  }

  // ✅ BƯỚC 4.2: Kiểm tra tài khoản demo
  if (!(username === 'minhnh3' && password === 'dhbkhcm2022')) {
    return res.status(401).send('<h2>Invalid demo account credentials.</h2>');
  }

  // ✅ BƯỚC 4.3: Parse SAML Request (nếu có)
  let spEntityID = 'http://localhost:7001/sp';
  let acsUrl = 'http://localhost:7001/assert';
  let requestInfo = null;
  
  if (samlRequest) {
    try {
      const parsed = await saml.Parser.parseAuthnRequest(samlRequest);
      spEntityID = parsed?.issuer?.value || spEntityID;
      acsUrl = parsed?.assertionConsumerServiceURL || acsUrl;
      if (parsed && parsed.extract && parsed.extract.request) {
        requestInfo = parsed;
      }
    } catch (err) {
      console.error('Failed to parse AuthnRequest:', err);
    }
  }
  
  // ... tiếp BƯỚC 5
});
```

**🔍 Giải thích:**
- **Bước 4.1**: Validate input không được rỗng
- **Bước 4.2**: Hardcode check credentials (trong production nên query database)
- **Bước 4.3**: Parse SAML AuthnRequest để lấy thông tin SP

---

### **BƯỚC 5: IdP tạo SAML Response**

#### 📂 File: `backend/index.js` - Line 139-168

```javascript
  // ✅ BƯỚC 5.1: Chuẩn bị thông tin cho SAML Response
  const now = new Date();
  console.log('Creating SAML response with:');
  console.log('- SP Entity ID:', spEntityID);
  console.log('- ACS URL:', acsUrl);
  console.log('- Username:', username);
  
  try {
    // ✅ BƯỚC 5.2: Generate SAML Response
    const response = await idp.createLoginResponse(
      spInstance,
      requestInfo,
      'post',
      {
        nameID: username,
        attributes: { username },
        sessionIndex: `${username}-${now.getTime()}`,
      }
    );
    
    console.log('SAMLResponse generated successfully');
    
    // ✅ BƯỚC 5.3: Auto-submit form với SAML Response
    res.send(`
      <html>
        <body onload="document.forms[0].submit()">
          <form method="post" action="${acsUrl}">
            <input type="hidden" name="SAMLResponse" value="${response.context}">
            <input type="hidden" name="RelayState" value="${relayState}">
          </form>
          <p>Logging in as <b>${username}</b>... Redirecting to Service Provider.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Error creating SAML response:', err);
    res.status(500).send('<h2>Error creating SAML response</h2>');
  }
```

**🔍 Giải thích:**
- **Bước 5.1**: Log thông tin debug
- **Bước 5.2**: Gọi `createLoginResponse()` để tạo SAML Response XML được ký bằng private key
- **Bước 5.3**: Tạo HTML form tự động submit về SP's ACS endpoint

**📦 SAML Response Structure:**
```xml
<samlp:Response ID="..." Version="2.0" IssueInstant="...">
  <saml:Issuer>http://localhost:7000/idp</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion ID="..." Version="2.0">
    <saml:Subject>
      <saml:NameID>minhnh3</saml:NameID>
    </saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="username">
        <saml:AttributeValue>minhnh3</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
  <ds:Signature>...</ds:Signature>
</samlp:Response>
```

---

### **BƯỚC 6: Browser POST SAML Response về SP**

Sau khi IdP tạo form HTML với SAML Response, browser tự động submit về SP:

```
POST http://localhost:7001/assert
Content-Type: application/x-www-form-urlencoded

SAMLResponse=<base64_encoded_saml_response>
&RelayState=protected
```

---

### **BƯỚC 7: SP validate SAML Response**

#### 📂 File: `frontend/index.js` - Line 78-122

```javascript
app.post('/assert', async (req, res) => {
  try {
    // ✅ BƯỚC 7.1: Lấy SAML Response từ request
    const { SAMLResponse, RelayState } = req.body;
    console.log('Received SAMLResponse, attempting to parse...');
    console.log('RelayState:', RelayState);
    
    // ✅ BƯỚC 7.2: Parse và validate SAML Response
    const parsed = await sp.parseLoginResponse(idp, 'post', { 
      body: { SAMLResponse, RelayState } 
    });
    console.log('SAMLResponse parsed successfully:', parsed);
    
    // ✅ BƯỚC 7.3: Extract user info từ SAML Response
    const { extract } = parsed;
    if (!extract) {
      throw new Error('No extract data found in SAMLResponse');
    }
    
    // ✅ BƯỚC 7.4: Tạo session cho user
    req.session.user = {
      username: extract.attributes?.username || extract.nameID || 'Unknown',
      nameID: extract.nameID,
      attributes: extract.attributes
    };
    
    console.log('User session created:', req.session.user);
    
    // ✅ BƯỚC 7.5: Redirect về trang được yêu cầu ban đầu
    if (RelayState && RelayState !== '') {
      res.redirect(`/${RelayState}`);
    } else {
      res.redirect('/protected');
    }
  } catch (err) {
    console.error('SAMLResponse parse error:', err.message);
    res.status(400).send(`<h2>Invalid SAMLResponse</h2><p>${err.message}</p>`);
  }
});
```

**🔍 Giải thích:**
- **Bước 7.1**: Extract SAMLResponse và RelayState từ POST body
- **Bước 7.2**: `parseLoginResponse()` thực hiện:
  - Decode base64 SAMLResponse
  - Parse XML
  - Verify chữ ký số (signature) bằng IdP's public certificate
  - Validate thời gian hợp lệ (NotBefore, NotOnOrAfter)
  - Kiểm tra Audience, Recipient
- **Bước 7.3**: Extract thông tin user từ SAML Assertion
- **Bước 7.4**: Tạo session lưu thông tin user
- **Bước 7.5**: Redirect về trang ban đầu (dùng RelayState)

---

### **BƯỚC 8: Hiển thị tài nguyên được bảo vệ**

#### 📂 File: `frontend/index.js` - Line 68-75

```javascript
app.get('/protected', (req, res) => {
  if (!req.session.user) {
    res.redirect('http://localhost:7000/sso?RelayState=protected');
  } else {
    // ✅ User đã có session -> Hiển thị protected page
    res.render('protected', { user: req.session.user });
  }
});
```

#### 📂 File: `frontend/views/protected.ejs`

```html
<div class="container">
  <h2><i class="fa-solid fa-lock"></i> Protected Resource</h2>
  <div class="user-info">
    <i class="fa-solid fa-user"></i>
    <div class="username"><%= user.username %></div>
    <div>Welcome, you have successfully signed in via SAML SSO!</div>
  </div>
  <a href="/" class="btn">Back to Home</a>
  <a href="/logout" class="btn btn-logout">Logout</a>
</div>
```

**🔍 Giải thích:**
- Hiển thị thông tin user từ session
- Cung cấp link logout

---

### **BƯỚC 9: Logout**

#### 📂 File: `frontend/index.js` - Line 130-145

```javascript
app.get('/logout', (req, res) => {
  if (req.session.user) {
    const username = req.session.user.username;
    
    // ✅ Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).send('Error during logout');
      }
      console.log(`User ${username} logged out successfully`);
      res.redirect('/?logged_out=true');
    });
  } else {
    res.redirect('/');
  }
});
```

**🔍 Giải thích:**
- Xóa session của user
- Redirect về home page với query param `logged_out=true`

---

## 🔐 Bảo Mật SAML

### 1. **Chữ ký số (Digital Signature)**

```javascript
// backend/index.js - Line 26-28
signingCert: cert,    // Public certificate
privateKey: key,      // Private key
```

- IdP ký SAML Response bằng **private key**
- SP verify chữ ký bằng **public certificate**
- Đảm bảo SAML Response không bị giả mạo

### 2. **Thời gian hợp lệ**

```xml
<saml:Conditions NotBefore="2025-12-06T10:00:00Z" 
                 NotOnOrAfter="2025-12-06T10:05:00Z">
```

- SAML Response chỉ valid trong khoảng thời gian ngắn (vd: 5 phút)
- Prevent replay attacks

### 3. **Audience Restriction**

```xml
<saml:AudienceRestriction>
  <saml:Audience>http://localhost:7001/sp</saml:Audience>
</saml:AudienceRestriction>
```

- SAML Response chỉ dành cho SP cụ thể
- Prevent man-in-the-middle attacks

### 4. **InResponseTo**

```xml
<samlp:Response InResponseTo="<request_id>">
```

- Link SAML Response với SAML Request ban đầu
- Prevent unsolicited responses

---

## 📊 So Sánh với Các Giao Thức Khác

| Đặc điểm | SAML | OAuth 2.0 | OpenID Connect |
|----------|------|-----------|----------------|
| **Mục đích** | Authentication & Authorization | Authorization | Authentication |
| **Format** | XML | JSON | JSON |
| **Sử dụng** | Enterprise SSO | API Authorization | Modern SSO |
| **Độ phức tạp** | Cao | Trung bình | Trung bình |
| **Mobile-friendly** | Không | Có | Có |

---

## 🧪 Test Cases

### Test 1: Đăng nhập thành công
```
✅ Input: minhnh3 / dhbkhcm2022
✅ Expected: Redirect to /protected with session
✅ Code: backend/index.js line 124-126
```

### Test 2: Sai password
```
❌ Input: minhnh3 / wrongpassword
❌ Expected: Show error "Invalid demo account credentials"
❌ Code: backend/index.js line 124-126
```

### Test 3: Access protected resource without login
```
🔒 Action: GET /protected without session
🔄 Expected: Redirect to IdP login
🔄 Code: frontend/index.js line 70-71
```

### Test 4: Logout
```
🚪 Action: GET /logout
✅ Expected: Destroy session and redirect to home
✅ Code: frontend/index.js line 135-140
```

---

## 🐛 Debug Tips

### 1. **Enable Console Logs**

```javascript
// backend/index.js - Line 147-155
console.log('Creating SAML response with:');
console.log('- SP Entity ID:', spEntityID);
console.log('- ACS URL:', acsUrl);
console.log('- Username:', username);
```

### 2. **Check SAML Response**

```javascript
// frontend/index.js - Line 85-93
console.log('Received SAMLResponse, attempting to parse...');
console.log('SAMLResponse type:', typeof SAMLResponse);
console.log('SAMLResponse length:', SAMLResponse ? SAMLResponse.length : 'undefined');
```

### 3. **Inspect Network Tab**

- Xem POST request đến `/assert`
- Check SAMLResponse parameter (base64)
- Decode để xem SAML XML

### 4. **Common Errors**

| Error | Nguyên nhân | Giải pháp |
|-------|-------------|-----------|
| `Invalid signature` | Certificate mismatch | Check cert.pem đúng |
| `Expired assertion` | System time sai | Sync clock |
| `Invalid audience` | SP entityID sai | Check config |
| `No extract data` | Parse lỗi | Check SAML XML format |

---

## 📚 Tài Liệu Tham Khảo

1. **SAML 2.0 Spec**: https://docs.oasis-open.org/security/saml/
2. **Samlify Library**: https://github.com/tngan/samlify
3. **SAML Validator**: https://www.samltool.com/validate_response.php

---

## 🎯 Kết Luận

SAML SSO Flow bao gồm 9 bước chính:

1. ⚙️ **Khởi tạo**: Config IdP & SP
2. 🚪 **Access**: User truy cập /protected
3. 🔄 **Redirect**: SP redirect đến IdP
4. 📝 **Login**: User nhập credentials
5. 🔐 **Create**: IdP tạo SAML Response
6. 📤 **POST**: Browser POST về SP
7. ✅ **Validate**: SP validate SAML Response
8. 🎉 **Success**: Hiển thị protected resource
9. 👋 **Logout**: Xóa session

**Key Points:**
- SAML sử dụng XML và chữ ký số
- IdP và SP không share session, chỉ trao đổi SAML token
- RelayState giúp maintain application context
- Phù hợp cho enterprise environment

---

**📝 Created by:** SAML Demo Team  
**📅 Date:** December 6, 2025  
**🔖 Version:** 1.0.0
