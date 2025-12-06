/**
 * Test SAML Validator - Complete Test Suite
 * 
 * This script tests different validation modes with sample SAML XML
 * Usage: node test-validator-complete.js
 */

const { createValidator, ValidationMode, getValidationInfo } = require('./backend/validator');

console.log('\n');
console.log('═'.repeat(70));
console.log('🧪 SAML Validator - Complete Test Suite');
console.log('═'.repeat(70));
console.log('\n');

// Sample SAML Response (Valid)
const validSAMLResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" 
                ID="_12345" 
                Version="2.0" 
                IssueInstant="2025-12-06T10:00:00Z"
                Destination="http://localhost:7001/assert">
  <saml:Issuer>http://localhost:7000/idp</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion ID="_assertion123" Version="2.0" IssueInstant="2025-12-06T10:00:00Z">
    <saml:Issuer>http://localhost:7000/idp</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">minhnh3</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="2025-12-06T10:05:00Z" 
                                       Recipient="http://localhost:7001/assert"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2025-12-06T10:00:00Z" NotOnOrAfter="2025-12-06T10:05:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>http://localhost:7001/sp</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2025-12-06T10:00:00Z" SessionIndex="sess-123">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="username" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" 
                            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                            xsi:type="xs:string">minhnh3</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;

// Sample SAML AuthnRequest (Valid)
const validAuthnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_request456"
                    Version="2.0"
                    IssueInstant="2025-12-06T10:00:00Z"
                    Destination="http://localhost:7000/sso"
                    AssertionConsumerServiceURL="http://localhost:7001/assert"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>http://localhost:7001/sp</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified" 
                      AllowCreate="true"/>
</samlp:AuthnRequest>`;

// Invalid XML - Malformed
const invalidXML = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
  <saml:Issuer>http://localhost:7000/idp
  <!-- Missing closing tag -->
</samlp:Response>`;

// Invalid SAML Structure (Not SAML)
const invalidSAMLStructure = `<?xml version="1.0" encoding="UTF-8"?>
<RandomElement>
  <NotSAML>This is not a SAML document</NotSAML>
  <AnotherTag>No SAML namespace here</AnotherTag>
</RandomElement>`;

// Missing Required SAML Elements
const missingSAMLElements = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_incomplete"
                Version="2.0">
  <!-- Missing: Issuer, Status, Assertion -->
</samlp:Response>`;

// SAML Response with missing Issuer
const missingIssuer = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_noissuer"
                Version="2.0">
  <!-- Missing: Issuer -->
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
</samlp:Response>`;

// Test cases
const testCases = [
  { 
    name: '✅ Valid SAML Response', 
    xml: validSAMLResponse,
    shouldPass: { disabled: true, relaxed: true, strict: true }
  },
  { 
    name: '✅ Valid SAML AuthnRequest', 
    xml: validAuthnRequest,
    shouldPass: { disabled: true, relaxed: true, strict: true }
  },
  { 
    name: '❌ Invalid XML (malformed)', 
    xml: invalidXML,
    shouldPass: { disabled: true, relaxed: false, strict: false }
  },
  { 
    name: '❌ Invalid SAML Structure (not SAML)', 
    xml: invalidSAMLStructure,
    shouldPass: { disabled: true, relaxed: false, strict: false }
  },
  { 
    name: '⚠️  Missing Required Elements', 
    xml: missingSAMLElements,
    shouldPass: { disabled: true, relaxed: true, strict: false }
  },
  { 
    name: '⚠️  Missing Issuer', 
    xml: missingIssuer,
    shouldPass: { disabled: true, relaxed: true, strict: false }
  }
];

// Test function
function testValidator(mode, testCase) {
  const validator = createValidator(mode);
  const result = validator.validate(testCase.xml);
  
  const expected = testCase.shouldPass[mode];
  const passed = result.isValid === expected;
  
  const statusIcon = passed ? '✅' : '❌';
  const resultIcon = result.isValid ? '✅ VALID' : '❌ INVALID';
  
  console.log(`  ${statusIcon} ${resultIcon}`);
  
  if (!result.isValid) {
    console.log(`     Error: ${result.error}`);
  }
  
  if (!passed) {
    console.log(`     ⚠️  UNEXPECTED: Expected ${expected ? 'VALID' : 'INVALID'}`);
  }
  
  return passed;
}

// Run all tests
function runAllTests() {
  const modes = [
    { mode: ValidationMode.DISABLED, label: 'DISABLED (No Validation)' },
    { mode: ValidationMode.RELAXED, label: 'RELAXED (Recommended)' },
    { mode: ValidationMode.STRICT, label: 'STRICT (Production)' }
  ];
  
  const results = {};
  
  modes.forEach(({ mode, label }) => {
    console.log('\n' + '─'.repeat(70));
    console.log(`🔍 Testing: ${label}`);
    console.log('─'.repeat(70));
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach(testCase => {
      console.log(`\n📝 ${testCase.name}`);
      const success = testValidator(mode, testCase);
      
      if (success) {
        passed++;
      } else {
        failed++;
      }
    });
    
    console.log('\n' + '─'.repeat(70));
    console.log(`📊 Results: ${passed}/${testCases.length} passed, ${failed} failed`);
    
    results[mode] = { passed, failed, total: testCases.length };
  });
  
  return results;
}

// Display comparison
function displayComparison(results) {
  console.log('\n\n');
  console.log('═'.repeat(70));
  console.log('📊 VALIDATION MODE COMPARISON');
  console.log('═'.repeat(70));
  console.log('\n');
  
  console.log('┌─────────────────┬─────────┬─────────┬─────────────┐');
  console.log('│ Mode            │ Passed  │ Failed  │ Success Rate│');
  console.log('├─────────────────┼─────────┼─────────┼─────────────┤');
  
  Object.keys(results).forEach(mode => {
    const { passed, failed, total } = results[mode];
    const rate = ((passed / total) * 100).toFixed(0);
    const modeName = mode.toUpperCase().padEnd(15);
    const passStr = passed.toString().padStart(7);
    const failStr = failed.toString().padStart(7);
    const rateStr = `${rate}%`.padStart(11);
    
    console.log(`│ ${modeName} │${passStr} │${failStr} │${rateStr} │`);
  });
  
  console.log('└─────────────────┴─────────┴─────────┴─────────────┘');
  console.log('\n');
}

// Display recommendations
function displayRecommendations() {
  console.log('═'.repeat(70));
  console.log('💡 RECOMMENDATIONS');
  console.log('═'.repeat(70));
  console.log('\n');
  
  console.log('🔴 DISABLED Mode:');
  console.log('   • Use for: Quick demos, prototyping');
  console.log('   • Security: ⚠️  LOW - Accepts all XML');
  console.log('   • Performance: ⚡ FASTEST');
  console.log('   • Code: const VALIDATION_MODE = ValidationMode.DISABLED;');
  console.log('\n');
  
  console.log('🟡 RELAXED Mode (Current):');
  console.log('   • Use for: Development, testing');
  console.log('   • Security: ✅ MEDIUM - Checks well-formedness');
  console.log('   • Performance: ⚡ FAST');
  console.log('   • Code: const VALIDATION_MODE = ValidationMode.RELAXED;');
  console.log('\n');
  
  console.log('🟢 STRICT Mode:');
  console.log('   • Use for: Production environments');
  console.log('   • Security: ✅✅ HIGH - Full validation');
  console.log('   • Performance: ⚡ MODERATE');
  console.log('   • Code: const VALIDATION_MODE = ValidationMode.STRICT;');
  console.log('\n');
  
  console.log('═'.repeat(70));
  console.log('🔧 HOW TO CHANGE MODE');
  console.log('═'.repeat(70));
  console.log('\n');
  console.log('1. Open: backend/index.js or frontend/index.js');
  console.log('2. Find: const VALIDATION_MODE = ValidationMode.RELAXED;');
  console.log('3. Change to: ValidationMode.DISABLED, .RELAXED, or .STRICT');
  console.log('4. Restart the server');
  console.log('\n');
}

// Display XML info
function displayXMLInfo() {
  console.log('═'.repeat(70));
  console.log('📋 SAMPLE XML STRUCTURES');
  console.log('═'.repeat(70));
  console.log('\n');
  
  [
    { name: 'Valid SAML Response', xml: validSAMLResponse },
    { name: 'Valid SAML AuthnRequest', xml: validAuthnRequest }
  ].forEach(({ name, xml }) => {
    console.log(`${name}:`);
    const info = getValidationInfo(xml);
    console.log(`  Root Element: ${info.rootElement}`);
    console.log(`  Namespaces: ${info.namespaces.length}`);
    info.namespaces.forEach(ns => {
      console.log(`    - ${ns.prefix || '(default)'}: ${ns.href}`);
    });
    console.log(`  Has Signature: ${info.hasSignature}`);
    console.log(`  XML Size: ${info.xmlLength} bytes`);
    console.log('\n');
  });
}

// Main execution
console.log('Starting validator tests...\n');

const results = runAllTests();
displayComparison(results);
displayRecommendations();
displayXMLInfo();

console.log('═'.repeat(70));
console.log('✅ Test Suite Completed Successfully');
console.log('═'.repeat(70));
console.log('\n');
