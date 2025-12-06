# 🔐 SAML Schema Validator - Giải Thích Chi Tiết

## 📋 Tổng Quan

```javascript
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: true };
  }
});
```

Đây là **Schema Validator** - một thành phần BẮT BUỘC trong thư viện `samlify` để validate SAML XML messages.

---

## 🎯 Mục Đích

### **Trong Production (Thực tế):**

Schema Validator kiểm tra:
- ✅ XML structure đúng chuẩn SAML 2.0
- ✅ Required fields có đầy đủ không
- ✅ Data types đúng format
- ✅ Namespace declarations đúng
- ✅ Element nesting đúng hierarchy

### **Trong Demo (Hiện tại):**

```javascript
validate: (xml) => {
  return { isValid: true }; // ⚠️ LUÔN trả về TRUE
}
```

- ⏩ **Bỏ qua tất cả validation**
- ⏩ **Chấp nhận mọi XML**
- ⏩ **Đơn giản hóa cho demo**

---

## 🧪 Experiments - Tác Động Khi Thay Đổi

### **Test 1: XÓA Validator Hoàn Toàn**

#### ❌ Code SAI:
```javascript
const saml = require('samlify');

// ❌ KHÔNG có setSchemaValidator
const idp = saml.IdentityProvider({
  entityID: 'http://localhost:7000/idp',
  // ...config
});
```

#### 💥 Kết quả:
```
Error: Schema validator is not properly configured
  at Object.createLoginResponse (node_modules/samlify/src/entity-idp.ts:234)
  at app.post (/backend/index.js:157)
```

#### 📊 Tác động:
- ❌ **Demo sẽ CRASH khi tạo SAML Response**
- ❌ **IdP không thể generate SAML message**
- ❌ **User không thể đăng nhập**

---

### **Test 2: Thay Bằng Strict Validator**

#### ✅ Code với Strict Validation:
```javascript
const libxmljs = require('libxmljs2'); // npm install libxmljs2
const fs = require('fs');

// Load SAML 2.0 XSD Schema
const samlProtocolSchema = fs.readFileSync(
  path.join(__dirname, 'schemas/saml-schema-protocol-2.0.xsd'), 
  'utf8'
);
const xsdDoc = libxmljs.parseXml(samlProtocolSchema);

saml.setSchemaValidator({
  validate: (xml) => {
    try {
      const xmlDoc = libxmljs.parseXml(xml);
      const isValid = xmlDoc.validate(xsdDoc);
      
      if (!isValid) {
        console.error('SAML Validation Errors:', xmlDoc.validationErrors);
        return {
          isValid: false,
          error: xmlDoc.validationErrors
        };
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('XML Parse Error:', error.message);
      return {
        isValid: false,
        error: error.message
      };
    }
  }
});
```

#### 📊 Tác động:
- ✅ **Demo vẫn hoạt động** (nếu SAML đúng format)
- ✅ **An toàn hơn** - phát hiện malformed SAML
- ⚠️ **Cần cài thêm dependencies**: `libxmljs2`
- ⚠️ **Cần download SAML XSD schemas**

---

### **Test 3: Log Validator Để Debug**

#### 🔍 Code với Logging:
```javascript
saml.setSchemaValidator({
  validate: (xml) => {
    console.log('═══════════════════════════════════════');
    console.log('📝 SAML XML Validation Request');
    console.log('═══════════════════════════════════════');
    console.log('XML Length:', xml.length, 'bytes');
    console.log('XML Preview:', xml.substring(0, 200));
    console.log('═══════════════════════════════════════');
    
    // For demo: always pass
    return { isValid: true };
  }
});
```

#### 📊 Console Output:
```
═══════════════════════════════════════
📝 SAML XML Validation Request
═══════════════════════════════════════
XML Length: 2847 bytes
XML Preview: <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_abc123" Version="2.0" IssueInstant="2025-12-06T10:30:...
═══════════════════════════════════════
```

#### 📊 Tác động:
- ✅ **Demo vẫn hoạt động bình thường**
- ✅ **Có thêm logs để debug**
- ✅ **Hiểu rõ khi nào validator được gọi**

---

## 📚 Khi Nào Validator Được Gọi?

### **Backend (IdP) - Line 157:**
```javascript
const response = await idp.createLoginResponse(
  spInstance,
  requestInfo,
  'post',
  { nameID: username, attributes: { username } }
);
// ☝️ Validator được gọi NGAY TẠI ĐÂY
```

### **Frontend (SP) - Line 91:**
```javascript
const parsed = await sp.parseLoginResponse(idp, 'post', { 
  body: { SAMLResponse, RelayState } 
});
// ☝️ Validator được gọi NGAY TẠI ĐÂY
```

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SAML Message Flow                        │
└─────────────────────────────────────────────────────────────┘

Backend (IdP):
┌──────────────────┐
│ User Login       │
└────────┬─────────┘
         │
         v
┌──────────────────────────────────────┐
│ idp.createLoginResponse()            │  <--- ⚙️ Validator Called
│   ├─ Generate SAML XML               │
│   ├─ ✅ Validate XML (validator)     │
│   ├─ Sign with Private Key           │
│   └─ Base64 Encode                   │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────┐
│ Send to SP       │
└──────────────────┘


Frontend (SP):
┌──────────────────┐
│ Receive SAML     │
└────────┬─────────┘
         │
         v
┌──────────────────────────────────────┐
│ sp.parseLoginResponse()              │  <--- ⚙️ Validator Called
│   ├─ Base64 Decode                   │
│   ├─ ✅ Validate XML (validator)     │
│   ├─ Verify Signature                │
│   ├─ Extract User Info               │
│   └─ Create Session                  │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────┐
│ User Logged In   │
└──────────────────┘
```

---

## ⚙️ Các Option Implementation

### **Option 1: Demo Mode (Hiện tại)**

```javascript
// ✅ Đơn giản, không dependencies
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: true };
  }
});
```

**Sử dụng khi:**
- 🎯 Demo và testing
- 🎯 Không quan tâm SAML structure
- 🎯 Muốn tập trung vào logic flow

---

### **Option 2: Logging Mode**

```javascript
// ✅ Debug-friendly
saml.setSchemaValidator({
  validate: (xml) => {
    console.log('🔍 Validating SAML XML:');
    console.log('- Length:', xml.length);
    console.log('- Type:', xml.includes('samlp:Response') ? 'Response' : 'Request');
    console.log('- Preview:', xml.substring(0, 150) + '...');
    
    // Check basic structure
    if (!xml.includes('samlp:') && !xml.includes('saml:')) {
      console.warn('⚠️ XML might not be valid SAML format!');
    }
    
    return { isValid: true };
  }
});
```

**Sử dụng khi:**
- 🔍 Muốn debug SAML messages
- 🔍 Học hiểu SAML structure
- 🔍 Troubleshoot issues

---

### **Option 3: Basic Validation**

```javascript
// ✅ Basic checks without full XSD
saml.setSchemaValidator({
  validate: (xml) => {
    try {
      // Basic checks
      if (!xml || xml.length === 0) {
        return { isValid: false, error: 'Empty XML' };
      }
      
      // Check SAML namespaces
      if (!xml.includes('urn:oasis:names:tc:SAML:2.0')) {
        return { isValid: false, error: 'Missing SAML namespace' };
      }
      
      // Check for Response or Request
      if (!xml.includes('samlp:Response') && !xml.includes('samlp:AuthnRequest')) {
        return { isValid: false, error: 'Not a valid SAML message' };
      }
      
      // Check for Assertion (in Response)
      if (xml.includes('samlp:Response') && !xml.includes('saml:Assertion')) {
        return { isValid: false, error: 'Response missing Assertion' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
});
```

**Sử dụng khi:**
- ✅ Cần validation cơ bản
- ✅ Không muốn cài thêm dependencies
- ✅ Balance giữa security và simplicity

---

### **Option 4: Production Mode với libxmljs2**

```javascript
// ✅ Full XSD validation
const libxmljs = require('libxmljs2');
const fs = require('fs');
const path = require('path');

// Load SAML schemas
const protocolSchema = fs.readFileSync(
  path.join(__dirname, 'schemas/saml-schema-protocol-2.0.xsd'),
  'utf8'
);
const assertionSchema = fs.readFileSync(
  path.join(__dirname, 'schemas/saml-schema-assertion-2.0.xsd'),
  'utf8'
);

const xsdDoc = libxmljs.parseXml(protocolSchema);

saml.setSchemaValidator({
  validate: (xml) => {
    try {
      const xmlDoc = libxmljs.parseXml(xml);
      const isValid = xmlDoc.validate(xsdDoc);
      
      if (!isValid) {
        const errors = xmlDoc.validationErrors.map(e => e.message).join(', ');
        console.error('❌ SAML Validation Failed:', errors);
        return {
          isValid: false,
          error: errors
        };
      }
      
      console.log('✅ SAML XML is valid');
      return { isValid: true };
    } catch (error) {
      console.error('❌ XML Parse Error:', error.message);
      return {
        isValid: false,
        error: error.message
      };
    }
  }
});
```

**Cài đặt:**
```bash
npm install libxmljs2
```

**Download schemas:**
```bash
mkdir -p schemas
cd schemas
wget https://docs.oasis-open.org/security/saml/v2.0/saml-schema-protocol-2.0.xsd
wget https://docs.oasis-open.org/security/saml/v2.0/saml-schema-assertion-2.0.xsd
```

**Sử dụng khi:**
- 🏢 Production environment
- 🏢 Cần security cao
- 🏢 Validate against official SAML spec

---

## 📊 Comparison Table

| Feature | Demo Mode | Basic Validation | Full XSD Validation |
|---------|-----------|------------------|---------------------|
| **Security** | ❌ Low | ⚠️ Medium | ✅ High |
| **Performance** | ✅ Fast | ✅ Fast | ⚠️ Slower |
| **Dependencies** | ✅ None | ✅ None | ❌ libxmljs2 |
| **Setup Complexity** | ✅ Simple | ✅ Simple | ⚠️ Complex |
| **Error Detection** | ❌ None | ⚠️ Basic | ✅ Complete |
| **Production Ready** | ❌ No | ⚠️ Maybe | ✅ Yes |

---

## 🎯 Khuyến Nghị

### **Cho Demo/Development:**
```javascript
// ✅ Sử dụng Demo Mode hoặc Logging Mode
saml.setSchemaValidator({
  validate: (xml) => {
    console.log('🔍 SAML XML Length:', xml.length);
    return { isValid: true };
  }
});
```

### **Cho Production:**
```javascript
// ✅ Sử dụng Full XSD Validation
saml.setSchemaValidator({
  validate: (xml) => {
    // Implement proper XSD validation
    return validateAgainstSAMLSchema(xml);
  }
});
```

---

## 🚨 Lưu Ý Quan Trọng

### **1. KHÔNG THỂ XÓA**
```javascript
// ❌ Code này sẽ CRASH
const saml = require('samlify');
// Missing: saml.setSchemaValidator(...)
const idp = saml.IdentityProvider({...});
```

### **2. PHẢI GỌI TRƯỚC khi khởi tạo IdP/SP**
```javascript
// ✅ ĐÚNG thứ tự
saml.setSchemaValidator({...});  // 1️⃣ Set validator TRƯỚC
const idp = saml.IdentityProvider({...});  // 2️⃣ Khởi tạo SAU

// ❌ SAI thứ tự
const idp = saml.IdentityProvider({...});  // ❌ Lỗi!
saml.setSchemaValidator({...});  // Quá muộn
```

### **3. Global Setting**
```javascript
// Validator áp dụng cho TẤT CẢ IdP và SP
saml.setSchemaValidator({...});

const idp = saml.IdentityProvider({...});  // ✅ Dùng validator này
const sp = saml.ServiceProvider({...});    // ✅ Dùng validator này
```

---

## 📝 Tóm Tắt

| Câu Hỏi | Trả Lời |
|---------|---------|
| **Validator là gì?** | Hàm kiểm tra SAML XML có đúng chuẩn không |
| **Có thể xóa không?** | ❌ KHÔNG - Demo sẽ crash |
| **Có thể thay đổi không?** | ✅ CÓ - Nhưng phải trả về `{ isValid: boolean }` |
| **Khi nào được gọi?** | Khi `createLoginResponse()` và `parseLoginResponse()` |
| **Demo có bị ảnh hưởng không?** | ⚠️ CÓ - Nếu xóa hoặc return sai format |

---

## 🧪 Test Yourself

Hãy thử các scenarios sau:

### **Test 1: Remove Validator**
```javascript
// Comment out validator
// saml.setSchemaValidator({...});

// Chạy demo và xem lỗi gì xảy ra
```

### **Test 2: Add Logging**
```javascript
saml.setSchemaValidator({
  validate: (xml) => {
    console.log('🔍 XML:', xml);
    return { isValid: true };
  }
});

// Xem log khi nào validator được gọi
```

### **Test 3: Return Invalid**
```javascript
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: false, error: 'Test error' };
  }
});

// Demo sẽ fail như thế nào?
```

---

**📅 Created:** December 6, 2025  
**🔖 Version:** 1.0.0  
**✍️ Author:** SAML Demo Team

# 🔐 SAML XML Schema Validator - Complete Guide

## 📋 Tổng Quan

SAML XML Schema Validator là một component quan trọng để đảm bảo tính hợp lệ và bảo mật của SAML messages. Demo này cung cấp 3 validation modes khác nhau.

---

## 🎯 Validation Modes

### **1. DISABLED Mode** 🔴

```javascript
const VALIDATION_MODE = ValidationMode.DISABLED;
```

**Đặc điểm:**
- ⚠️ **Không validate** - Chấp nhận mọi XML
- ⚡ **Nhanh nhất** - Không có overhead
- 🎯 **Dùng cho**: Quick demos, prototyping

**Code:**
```javascript
validate: (xml) => {
  console.log('⚠️  Validation DISABLED - accepting all XML');
  return { isValid: true };
}
```

**Khi nào dùng:**
- ✅ Development ban đầu
- ✅ Testing nhanh
- ❌ KHÔNG dùng trong production

---

### **2. RELAXED Mode** 🟡 (Recommended)

```javascript
const VALIDATION_MODE = ValidationMode.RELAXED;
```

**Đặc điểm:**
- ✅ **Well-formedness check** - Kiểm tra XML hợp lệ
- ✅ **SAML structure check** - Verify có SAML namespace
- ✅ **Root element check** - Đảm bảo có Response/Request
- ⚡ **Performance tốt**
- 🎯 **Dùng cho**: Development, Testing, Demo

**Code Flow:**
```javascript
validate: (xml) => {
  // Step 1: Parse XML
  const xmlDoc = libxmljs.parseXml(xml);
  
  // Step 2: Check SAML namespace
  const hasSAMLNamespace = namespaces.some(ns => 
    ns.href().includes('urn:oasis:names:tc:SAML')
  );
  
  // Step 3: Check root element
  const validRootElements = ['Response', 'AuthnRequest', ...];
  const hasValidRoot = validRootElements.includes(rootName);
  
  return { isValid: true };
}
```

**Khi nào dùng:**
- ✅ Development
- ✅ Testing environments
- ✅ Demo presentations
- ⚠️ Production (với caveat)

---

### **3. STRICT Mode** 🟢 (Production)

```javascript
const VALIDATION_MODE = ValidationMode.STRICT;
```

**Đặc điểm:**
- ✅✅ **Full XSD validation** - Validate theo SAML 2.0 spec
- ✅✅ **Required elements check** - Verify tất cả required fields
- ✅✅ **Structure validation** - Check toàn bộ structure
- ⚡ **Performance moderate** - Có overhead nhưng đáng giá
- 🎯 **Dùng cho**: Production environments

**Code Flow:**
```javascript
validate: (xml) => {
  // Step 1: Parse XML
  const xmlDoc = libxmljs.parseXml(xml);
  
  // Step 2: Check required elements
  const errors = [];
  
  // For Response
  if (rootName === 'Response') {
    if (!xmlDoc.get('//saml:Issuer')) {
      errors.push('Missing required element: Issuer');
    }
    if (!xmlDoc.get('//samlp:Status')) {
      errors.push('Missing required element: Status');
    }
    // ... more checks
  }
  
  // Step 3: Return result
  if (errors.length > 0) {
    return { isValid: false, error: errors.join('; ') };
  }
  
  return { isValid: true };
}
```

**Khi nào dùng:**
- ✅✅ Production environments
- ✅✅ Enterprise applications
- ✅ Security-critical systems

---

## 📊 So Sánh Chi Tiết

| Feature | DISABLED | RELAXED | STRICT |
|---------|----------|---------|--------|
| **XML Parsing** | ❌ No | ✅ Yes | ✅ Yes |
| **Well-formedness** | ❌ No | ✅ Yes | ✅ Yes |
| **SAML Namespace** | ❌ No | ✅ Yes | ✅ Yes |
| **Root Element** | ❌ No | ✅ Yes | ✅ Yes |
| **Required Fields** | ❌ No | ⚠️ Warn | ✅ Enforce |
| **XSD Schema** | ❌ No | ❌ No | ✅ Yes* |
| **Performance** | ⚡⚡⚡ Fast | ⚡⚡ Fast | ⚡ Moderate |
| **Security** | 🔴 Low | 🟡 Medium | 🟢 High |
| **Error Messages** | ❌ None | ✅ Basic | ✅✅ Detailed |

*Note: STRICT mode trong demo này check required elements nhưng chưa có full XSD validation (cần schema files)

---

## 🔧 Cách Sử Dụng

### **Bước 1: Chọn Mode**

Edit file `backend/index.js` hoặc `frontend/index.js`:

```javascript
const { createValidator, ValidationMode } = require('./validator');

// Chọn mode ở đây:
const VALIDATION_MODE = ValidationMode.RELAXED; // DISABLED, RELAXED, or STRICT

const validator = createValidator(VALIDATION_MODE);
saml.setSchemaValidator(validator);
```

### **Bước 2: Restart Server**

```bash
# Backend
cd backend
node index.js

# Frontend
cd frontend
node index.js
```

### **Bước 3: Verify**

Check console logs để xác nhận mode:
```
📋 SAML Validator initialized in RELAXED mode
```

---

## 🧪 Testing

### **Run Test Suite**

```bash
cd app/saml
node test-validator-complete.js
```

### **Test Output:**

```
═══════════════════════════════════════════════════════════════════
🧪 SAML Validator - Complete Test Suite
═══════════════════════════════════════════════════════════════════

──────────────────────────────────────────────────────────────────
🔍 Testing: RELAXED (Recommended)
──────────────────────────────────────────────────────────────────

📝 ✅ Valid SAML Response
  ✅ VALID
  ✅ XML is well-formed and has basic SAML structure

📝 ❌ Invalid XML (malformed)
  ❌ INVALID
     Error: XML parsing failed: ...

...
```

---

## 💻 Code Examples

### **Example 1: Custom Validator**

```javascript
const { createValidator, ValidationMode } = require('./validator');

// Custom validator với logging
const customValidator = {
  validate: (xml) => {
    console.log('🔍 Validating XML...', xml.substring(0, 100));
    
    const baseValidator = createValidator(ValidationMode.RELAXED);
    const result = baseValidator.validate(xml);
    
    if (!result.isValid) {
      console.error('❌ Validation failed:', result.error);
    } else {
      console.log('✅ Validation passed');
    }
    
    return result;
  }
};

saml.setSchemaValidator(customValidator);
```

### **Example 2: Conditional Validation**

```javascript
const { createValidator, ValidationMode } = require('./validator');

// Sử dụng STRICT trong production, RELAXED trong development
const mode = process.env.NODE_ENV === 'production' 
  ? ValidationMode.STRICT 
  : ValidationMode.RELAXED;

const validator = createValidator(mode);
saml.setSchemaValidator(validator);
```

### **Example 3: Validation với Error Handling**

```javascript
const { createValidator, ValidationMode, getValidationInfo } = require('./validator');

const validator = createValidator(ValidationMode.STRICT);

// Wrap validation với try-catch
const safeValidator = {
  validate: (xml) => {
    try {
      const result = validator.validate(xml);
      
      if (!result.isValid) {
        // Log validation info for debugging
        const info = getValidationInfo(xml);
        console.error('Validation failed:', {
          error: result.error,
          info: info
        });
      }
      
      return result;
    } catch (error) {
      console.error('Validator error:', error);
      return { 
        isValid: false, 
        error: 'Validator exception: ' + error.message 
      };
    }
  }
};

saml.setSchemaValidator(safeValidator);
```

---

## 🐛 Troubleshooting

### **Issue 1: "Schema validator is not set"**

**Nguyên nhân:** Chưa gọi `saml.setSchemaValidator()`

**Giải pháp:**
```javascript
const { createValidator, ValidationMode } = require('./validator');
const validator = createValidator(ValidationMode.RELAXED);
saml.setSchemaValidator(validator); // ✅ Bắt buộc
```

### **Issue 2: "XML parsing failed"**

**Nguyên nhân:** XML không well-formed (thiếu closing tag, encoding issues)

**Giải pháp:**
- Check XML syntax
- Verify encoding (UTF-8)
- Use XML linter

**Debug:**
```javascript
const { getValidationInfo } = require('./validator');
const info = getValidationInfo(xml);
console.log('XML info:', info);
```

### **Issue 3: "Missing required element: Issuer"**

**Nguyên nhân:** SAML Response thiếu required elements

**Giải pháp:**
- Verify IdP configuration
- Check `loginResponseTemplate` có đầy đủ elements

**Debug:**
```javascript
// Temporarily switch to RELAXED mode
const VALIDATION_MODE = ValidationMode.RELAXED; // ✅ Sẽ pass
// vs
const VALIDATION_MODE = ValidationMode.STRICT;  // ❌ Sẽ fail
```

### **Issue 4: Performance Issues**

**Nguyên nhân:** STRICT mode với large XML

**Giải pháp:**
- Use RELAXED mode cho development
- Cache validation results
- Optimize XML size

---

## 📚 Best Practices

### **1. Development Phase**

```javascript
const VALIDATION_MODE = ValidationMode.RELAXED;
```

**Lý do:**
- ✅ Balance giữa security và performance
- ✅ Catch major issues
- ✅ Không block development flow

### **2. Testing Phase**

```javascript
const VALIDATION_MODE = ValidationMode.STRICT;
```

**Lý do:**
- ✅ Ensure production-ready
- ✅ Catch all issues early
- ✅ Validate against spec

### **3. Production Phase**

```javascript
const mode = process.env.SAML_VALIDATION_MODE || 'strict';
const VALIDATION_MODE = ValidationMode[mode.toUpperCase()];
```

**Lý do:**
- ✅ Flexible configuration
- ✅ Can adjust via environment variables
- ✅ Easy rollback if issues

### **4. Monitoring**

```javascript
const validator = createValidator(ValidationMode.STRICT);

// Wrapper với metrics
const monitoredValidator = {
  validate: (xml) => {
    const start = Date.now();
    const result = validator.validate(xml);
    const duration = Date.now() - start;
    
    // Log metrics
    console.log('Validation metrics:', {
      duration: `${duration}ms`,
      isValid: result.isValid,
      xmlSize: xml.length
    });
    
    return result;
  }
};

saml.setSchemaValidator(monitoredValidator);
```

---

## 🔐 Security Considerations

### **DISABLED Mode:**
- ⚠️ **Risk**: Accepts malformed/malicious XML
- ⚠️ **Risk**: No protection against injection attacks
- ⚠️ **Risk**: Cannot detect tampered messages

### **RELAXED Mode:**
- ✅ **Protection**: Against malformed XML
- ✅ **Protection**: Basic structure validation
- ⚠️ **Limited**: Doesn't check all required fields

### **STRICT Mode:**
- ✅✅ **Full Protection**: Against malformed XML
- ✅✅ **Full Protection**: All required elements validated
- ✅✅ **Full Protection**: Structure fully verified

---

## 📖 References

1. **SAML 2.0 Specification**: https://docs.oasis-open.org/security/saml/
2. **libxmljs2 Documentation**: https://github.com/marudor/libxmljs2
3. **XML Schema Validation**: https://www.w3.org/TR/xmlschema-1/

---

## 🎓 Advanced Topics

### **Custom Validation Rules**

```javascript
function createCustomValidator() {
  const baseValidator = createValidator(ValidationMode.RELAXED);
  
  return {
    validate: (xml) => {
      // Step 1: Base validation
      const baseResult = baseValidator.validate(xml);
      if (!baseResult.isValid) {
        return baseResult;
      }
      
      // Step 2: Custom rules
      const xmlDoc = libxmljs.parseXml(xml);
      
      // Example: Check for specific attribute
      const issuer = xmlDoc.get('//saml:Issuer');
      if (issuer && !issuer.text().startsWith('http://localhost:7000')) {
        return {
          isValid: false,
          error: 'Issuer must be from localhost:7000'
        };
      }
      
      // Example: Check timestamp
      const issueInstant = xmlDoc.root().attr('IssueInstant');
      if (issueInstant) {
        const timestamp = new Date(issueInstant.value());
        const now = new Date();
        if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
          return {
            isValid: false,
            error: 'Timestamp too old (> 5 minutes)'
          };
        }
      }
      
      return { isValid: true };
    }
  };
}

saml.setSchemaValidator(createCustomValidator());
```

---

## ✅ Checklist

Trước khi deploy:

- [ ] Đã chọn validation mode phù hợp
- [ ] Đã test với cả valid và invalid XML
- [ ] Đã verify console logs
- [ ] Đã handle validation errors properly
- [ ] Đã document validation mode đang dùng
- [ ] Đã setup monitoring (nếu production)

---

**📝 Created by:** SAML Demo Team  
**📅 Last Updated:** December 6, 2025  
**🔖 Version:** 1.0.0
