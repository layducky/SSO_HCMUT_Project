/**
 * SAML XML Schema Validator
 * 
 * This module provides XML schema validation for SAML messages.
 * It supports both strict validation (with XSD schema) and relaxed validation.
 */

const libxmljs = require('libxmljs2');

/**
 * Validation modes
 */
const ValidationMode = {
  STRICT: 'strict',     // Full XSD schema validation
  RELAXED: 'relaxed',   // Basic XML well-formedness check
  DISABLED: 'disabled'  // No validation (demo mode)
};

/**
 * Create a SAML validator
 * @param {string} mode - Validation mode: 'strict', 'relaxed', or 'disabled'
 * @returns {Object} Validator object with validate function
 */
function createValidator(mode = ValidationMode.RELAXED) {
  console.log(`📋 SAML Validator initialized in ${mode.toUpperCase()} mode`);

  return {
    validate: (xml) => {
      try {
        // Mode 1: DISABLED - Skip all validation (for demo)
        if (mode === ValidationMode.DISABLED) {
          console.log('⚠️  Validation DISABLED - accepting all XML');
          return { isValid: true };
        }

        // Mode 2: RELAXED - Basic XML well-formedness check
        if (mode === ValidationMode.RELAXED) {
          return validateRelaxed(xml);
        }

        // Mode 3: STRICT - Full XSD schema validation
        if (mode === ValidationMode.STRICT) {
          return validateStrict(xml);
        }

        // Default: relaxed mode
        return validateRelaxed(xml);

      } catch (error) {
        console.error('❌ Validation error:', error.message);
        return {
          isValid: false,
          error: error.message
        };
      }
    }
  };
}

/**
 * RELAXED validation - Check XML well-formedness and basic SAML structure
 */
function validateRelaxed(xml) {
  try {
    // Step 1: Parse XML to check well-formedness
    const xmlDoc = libxmljs.parseXml(xml);
    
    if (!xmlDoc) {
      return {
        isValid: false,
        error: 'Invalid XML: Failed to parse'
      };
    }

    // Step 2: Check for SAML namespace
    const namespaces = xmlDoc.root().namespaces();
    const hasSAMLNamespace = namespaces.some(ns => 
      ns.href() && (
        ns.href().includes('urn:oasis:names:tc:SAML') ||
        ns.href().includes('saml')
      )
    );

    if (!hasSAMLNamespace) {
      console.warn('⚠️  Warning: No SAML namespace found in XML');
      // Continue anyway for flexibility
    }

    // Step 3: Check root element
    const rootName = xmlDoc.root().name();
    const validRootElements = [
      'Response', 
      'AuthnRequest', 
      'LogoutRequest', 
      'LogoutResponse',
      'EntityDescriptor'
    ];

    const hasValidRoot = validRootElements.some(name => 
      rootName.includes(name) || rootName === name
    );

    if (!hasValidRoot) {
      console.warn(`⚠️  Warning: Unexpected root element: ${rootName}`);
      // Continue anyway for flexibility
    }

    console.log('✅ XML is well-formed and has basic SAML structure');
    return { isValid: true };

  } catch (error) {
    console.error('❌ XML parsing error:', error.message);
    return {
      isValid: false,
      error: `XML parsing failed: ${error.message}`
    };
  }
}

/**
 * STRICT validation - Full XSD schema validation
 * Note: This requires SAML XSD schema files
 */
function validateStrict(xml) {
  try {
    // Parse XML
    const xmlDoc = libxmljs.parseXml(xml);
    
    if (!xmlDoc) {
      return {
        isValid: false,
        error: 'Invalid XML: Failed to parse'
      };
    }

    // For strict validation, you would need to:
    // 1. Load SAML 2.0 XSD schema files
    // 2. Validate against the schema
    // 
    // Example (requires schema files):
    // const schemaDoc = libxmljs.parseXml(fs.readFileSync('./schemas/saml-schema-protocol-2.0.xsd'));
    // const isValid = xmlDoc.validate(schemaDoc);
    // 
    // Since we don't have schema files in this demo, we'll use relaxed validation
    // but with stricter checks

    // Check required SAML elements
    const errors = [];
    const rootName = xmlDoc.root().name();

    // Validate Response structure
    if (rootName === 'Response' || rootName.includes('Response')) {
      // Check for required elements
      const issuer = xmlDoc.get('//saml:Issuer', {
        saml: 'urn:oasis:names:tc:SAML:2.0:assertion',
        samlp: 'urn:oasis:names:tc:SAML:2.0:protocol'
      });

      if (!issuer) {
        errors.push('Missing required element: Issuer');
      }

      const status = xmlDoc.get('//samlp:Status', {
        samlp: 'urn:oasis:names:tc:SAML:2.0:protocol'
      });

      if (!status) {
        errors.push('Missing required element: Status');
      }

      // Check for Assertion (if it's a successful response)
      const statusCode = xmlDoc.get('//samlp:StatusCode/@Value', {
        samlp: 'urn:oasis:names:tc:SAML:2.0:protocol'
      });

      if (statusCode && statusCode.value().includes('Success')) {
        const assertion = xmlDoc.get('//saml:Assertion', {
          saml: 'urn:oasis:names:tc:SAML:2.0:assertion'
        });

        if (!assertion) {
          errors.push('Missing required element: Assertion (for successful response)');
        }
      }
    }

    // Validate AuthnRequest structure
    if (rootName === 'AuthnRequest' || rootName.includes('AuthnRequest')) {
      const issuer = xmlDoc.get('//saml:Issuer', {
        saml: 'urn:oasis:names:tc:SAML:2.0:assertion'
      });

      if (!issuer) {
        errors.push('Missing required element: Issuer');
      }
    }

    if (errors.length > 0) {
      console.error('❌ STRICT validation failed:', errors);
      return {
        isValid: false,
        error: errors.join('; ')
      };
    }

    console.log('✅ XML passed STRICT validation');
    return { isValid: true };

  } catch (error) {
    console.error('❌ STRICT validation error:', error.message);
    return {
      isValid: false,
      error: `Validation failed: ${error.message}`
    };
  }
}

/**
 * Validate SAML signature (basic check)
 */
function hasValidSignature(xmlDoc) {
  try {
    const signature = xmlDoc.get('//ds:Signature', {
      ds: 'http://www.w3.org/2000/09/xmldsig#'
    });

    return !!signature;
  } catch (error) {
    return false;
  }
}

/**
 * Extract validation info for debugging
 */
function getValidationInfo(xml) {
  try {
    const xmlDoc = libxmljs.parseXml(xml);
    const rootName = xmlDoc.root().name();
    const namespaces = xmlDoc.root().namespaces().map(ns => ({
      prefix: ns.prefix(),
      href: ns.href()
    }));

    return {
      rootElement: rootName,
      namespaces: namespaces,
      hasSignature: hasValidSignature(xmlDoc),
      xmlLength: xml.length
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// Export
module.exports = {
  createValidator,
  ValidationMode,
  getValidationInfo
};
