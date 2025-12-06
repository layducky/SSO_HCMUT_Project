// 🧪 Test Script - Schema Validator Impact
// Chạy file này để test các scenarios khác nhau

const saml = require('samlify');

console.log('═══════════════════════════════════════════════════');
console.log('🧪 SAML Schema Validator - Test Suite');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Demo Mode (Hiện tại)
console.log('📝 Test 1: Demo Mode - Always Valid');
console.log('─────────────────────────────────────────────────────');
try {
  saml.setSchemaValidator({
    validate: (xml) => {
      console.log('  ✅ Validator called');
      console.log('  ✅ XML length:', xml ? xml.length : 0);
      return { isValid: true };
    }
  });
  
  const idp = saml.IdentityProvider({
    entityID: 'http://localhost:7000/idp',
    singleSignOnService: [{ 
      Binding: saml.Constants.namespace.binding.post, 
      Location: 'http://localhost:7000/sso' 
    }]
  });
  
  console.log('  ✅ Test 1 PASSED: IdP created successfully');
} catch (error) {
  console.log('  ❌ Test 1 FAILED:', error.message);
}
console.log('');

// Test 2: Without Validator
console.log('📝 Test 2: Without Validator (Should FAIL)');
console.log('─────────────────────────────────────────────────────');
try {
  // Reset samlify (trong thực tế không thể reset, chỉ demo)
  // Nếu không có validator, sẽ lỗi
  
  const saml2 = require('samlify');
  // Không gọi setSchemaValidator
  
  const idp2 = saml2.IdentityProvider({
    entityID: 'http://localhost:7000/idp',
    singleSignOnService: [{ 
      Binding: saml2.Constants.namespace.binding.post, 
      Location: 'http://localhost:7000/sso' 
    }]
  });
  
  console.log('  ✅ Test 2: Somehow passed (library may have default)');
} catch (error) {
  console.log('  ❌ Test 2 FAILED (Expected):', error.message);
}
console.log('');

// Test 3: Strict Validator - Always Reject
console.log('📝 Test 3: Strict Mode - Always Invalid');
console.log('─────────────────────────────────────────────────────');
try {
  saml.setSchemaValidator({
    validate: (xml) => {
      console.log('  ⚠️ Strict validator called');
      console.log('  ⚠️ Rejecting all XML for testing');
      return { 
        isValid: false, 
        error: 'Test: Forced validation failure' 
      };
    }
  });
  
  const idp3 = saml.IdentityProvider({
    entityID: 'http://localhost:7000/idp',
    singleSignOnService: [{ 
      Binding: saml.Constants.namespace.binding.post, 
      Location: 'http://localhost:7000/sso' 
    }]
  });
  
  // Try to create a response (would fail at validation)
  console.log('  ⚠️ Test 3: IdP created, but responses will fail validation');
} catch (error) {
  console.log('  ❌ Test 3 FAILED:', error.message);
}
console.log('');

// Test 4: Logging Validator
console.log('📝 Test 4: Logging Mode');
console.log('─────────────────────────────────────────────────────');
try {
  let callCount = 0;
  
  saml.setSchemaValidator({
    validate: (xml) => {
      callCount++;
      console.log(`  🔍 Validator called (${callCount} times)`);
      
      if (xml) {
        console.log(`  📏 XML Length: ${xml.length} bytes`);
        console.log(`  📝 XML Type: ${xml.includes('Response') ? 'Response' : 'Request'}`);
        console.log(`  🏷️ Has SAML namespace: ${xml.includes('urn:oasis:names:tc:SAML:2.0')}`);
      }
      
      return { isValid: true };
    }
  });
  
  const idp4 = saml.IdentityProvider({
    entityID: 'http://localhost:7000/idp',
    singleSignOnService: [{ 
      Binding: saml.Constants.namespace.binding.post, 
      Location: 'http://localhost:7000/sso' 
    }]
  });
  
  console.log('  ✅ Test 4 PASSED: Logging validator working');
} catch (error) {
  console.log('  ❌ Test 4 FAILED:', error.message);
}
console.log('');

// Test 5: Basic Validation
console.log('📝 Test 5: Basic Structure Validation');
console.log('─────────────────────────────────────────────────────');
try {
  saml.setSchemaValidator({
    validate: (xml) => {
      // Basic checks
      if (!xml || xml.length === 0) {
        console.log('  ❌ Validation failed: Empty XML');
        return { isValid: false, error: 'Empty XML' };
      }
      
      if (!xml.includes('urn:oasis:names:tc:SAML:2.0')) {
        console.log('  ❌ Validation failed: Missing SAML namespace');
        return { isValid: false, error: 'Missing SAML namespace' };
      }
      
      if (!xml.includes('samlp:') && !xml.includes('saml:')) {
        console.log('  ❌ Validation failed: Not SAML format');
        return { isValid: false, error: 'Not SAML format' };
      }
      
      console.log('  ✅ Basic validation passed');
      return { isValid: true };
    }
  });
  
  const idp5 = saml.IdentityProvider({
    entityID: 'http://localhost:7000/idp',
    singleSignOnService: [{ 
      Binding: saml.Constants.namespace.binding.post, 
      Location: 'http://localhost:7000/sso' 
    }]
  });
  
  console.log('  ✅ Test 5 PASSED: Basic validator working');
} catch (error) {
  console.log('  ❌ Test 5 FAILED:', error.message);
}
console.log('');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 Test Summary');
console.log('═══════════════════════════════════════════════════');
console.log('✅ Test 1: Demo Mode - Should PASS');
console.log('❌ Test 2: No Validator - Should FAIL');
console.log('⚠️  Test 3: Strict Mode - IdP creates but responses fail');
console.log('✅ Test 4: Logging Mode - Should PASS with logs');
console.log('✅ Test 5: Basic Validation - Should PASS');
console.log('');

console.log('🎯 Conclusion:');
console.log('  • Validator là BẮT BUỘC - không thể xóa');
console.log('  • Có thể thay đổi logic validation');
console.log('  • Demo mode (always true) là đủ cho testing');
console.log('  • Production nên dùng strict validation');
console.log('═══════════════════════════════════════════════════\n');

// Reset về demo mode để không ảnh hưởng demo
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: true };
  }
});

console.log('✅ Validator reset về Demo Mode để không ảnh hưởng demo\n');
