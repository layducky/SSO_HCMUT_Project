const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const saml = require('samlify');

// Set up samlify validator according to documentation
saml.setSchemaValidator({
  validate: (xml) => {
    return { isValid: true }; // For demo purposes - you can implement proper validation here
  }
});

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'saml-idp-demo', resave: false, saveUninitialized: true }));

// Load certs
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')).toString();
const key = fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')).toString();

// SAML IdP config with proper login response template
const idp = saml.IdentityProvider({
  entityID: 'http://localhost:7000/idp',
  singleSignOnService: [{ Binding: saml.Constants.namespace.binding.post, Location: 'http://localhost:7000/sso' }],
  signingCert: cert,
  privateKey: key,
  wantAuthnRequestsSigned: false,
  isAssertionEncrypted: false,
  loginResponseTemplate: {
    context: `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{ID}" Version="2.0" IssueInstant="{IssueInstant}" Destination="{Destination}" InResponseTo="{InResponseTo}">
      <saml:Issuer>{Issuer}</saml:Issuer>
      <samlp:Status>
        <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
      </samlp:Status>
      <saml:Assertion ID="{AssertionID}" Version="2.0" IssueInstant="{IssueInstant}" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
        <saml:Issuer>{Issuer}</saml:Issuer>
        <saml:Subject>
          <saml:NameID Format="{NameIDFormat}">{NameID}</saml:NameID>
          <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
            <saml:SubjectConfirmationData NotOnOrAfter="{NotOnOrAfter}" Recipient="{SubjectRecipient}" InResponseTo="{InResponseTo}"/>
          </saml:SubjectConfirmation>
        </saml:Subject>
        <saml:Conditions NotBefore="{NotBefore}" NotOnOrAfter="{NotOnOrAfter}">
          <saml:AudienceRestriction>
            <saml:Audience>{Audience}</saml:Audience>
          </saml:AudienceRestriction>
        </saml:Conditions>
        <saml:AuthnStatement AuthnInstant="{AuthnInstant}" SessionIndex="{SessionIndex}">
          <saml:AuthnContext>
            <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
          </saml:AuthnContext>
        </saml:AuthnStatement>
        {AttributeStatement}
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

// SAML SP config (for IdP to know about SP)
const sp = saml.ServiceProvider({
  entityID: 'http://localhost:7001/sp',
  assertionConsumerService: [{ Binding: saml.Constants.namespace.binding.post, Location: 'http://localhost:7001/assert' }]
});

// Home endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SAML IdP Demo Home</title>
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 60px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px; text-align: center; }
          h2 { color: #2d3a4b; margin-bottom: 16px; }
          a { display: inline-block; margin: 12px 0; color: #667eea; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; }
          .meta { margin-top: 24px; font-size: 0.95em; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 SAML IdP Demo Home</h2>
          <p>Welcome to the SAML Identity Provider demo.</p>
          <a href="/sso">🔑 Direct SSO Login</a><br>
          <a href="/metadata">📄 View IdP Metadata</a>
          <div class="meta">Identity Provider | Powered by <b>samlify</b> &amp; Express</div>
        </div>
      </body>
    </html>
  `);
});

// SSO endpoint
app.get('/sso', (req, res) => {
  // Parse AuthnRequest if present
  const samlRequest = req.query.SAMLRequest;
  const relayState = req.query.RelayState || '';
  res.render('login', { relayState, samlRequest });
});

app.post('/sso', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const relayState = req.body.relayState;
  const samlRequest = req.body.samlRequest;

  // Require both username and password
  if (!username || !password) {
    return res.status(400).send('<h2>Username and password are required.</h2><a href="/sso">Back to login</a>');
  }

  // Only allow demo account
  if (!(username === 'minhnh3' && password === 'dhbkhcm2022')) {
    return res.status(401).send('<h2>Invalid demo account credentials.</h2><a href="/sso">Back to login</a>');
  }

  // Parse AuthnRequest (if present)
  let spEntityID = 'http://localhost:7001/sp';
  let acsUrl = 'http://localhost:7001/assert';
  let spInstance = sp;
  let requestInfo = null;
  if (samlRequest) {
    try {
      const parsed = await saml.Parser.parseAuthnRequest(samlRequest);
      spEntityID = parsed?.issuer?.value || spEntityID;
      acsUrl = parsed?.assertionConsumerServiceURL || acsUrl;
      // Only pass requestInfo if extract and extract.request exist
      if (parsed && parsed.extract && parsed.extract.request) {
        requestInfo = parsed;
      } else {
        requestInfo = null;
      }
    } catch (err) {
      console.error('Failed to parse AuthnRequest:', err);
      requestInfo = null;
    }
  }  // Build SAMLResponse
  const now = new Date();
  console.log('Creating SAML response with:');
  console.log('- SP Entity ID:', spEntityID);
  console.log('- ACS URL:', acsUrl);
  console.log('- Username:', username);
  console.log('- RequestInfo:', requestInfo ? 'present' : 'null');
  
  try {
    const response = await idp.createLoginResponse(
      spInstance,
      requestInfo, // Pass requestInfo as null if not properly parsed
      'post',
      {
        nameID: username,
        attributes: { username },
        sessionIndex: `${username}-${now.getTime()}`,
      }
    );    console.log('SAMLResponse generated successfully');
    console.log('Response type:', typeof response);
    console.log('Response length:', response ? response.length : 'undefined');
    
    // Debug: Log the actual SAML response content
    if (typeof response === 'string') {
      console.log('SAML Response preview:', response.substring(0, 500));
    } else {
      console.log('SAML Response (non-string):', response);
    }
      // Auto POST SAMLResponse to SP ACS
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
    `);} catch (err) {
    console.error('Error creating SAML response:', err);
    res.status(500).send('<h2>Error creating SAML response</h2><p>' + err.message + '</p>');
  }
});

// Metadata endpoint
app.get('/metadata', (req, res) => {
  res.type('application/xml');
  res.send(idp.getMetadata());
});

app.listen(7000, () => {
  console.log('SAML IdP running on http://localhost:7000');
});
