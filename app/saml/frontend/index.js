const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const saml = require('samlify');
const fs = require('fs');

const { Validator } = saml;

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
app.use(session({ secret: 'saml-sp-demo', resave: false, saveUninitialized: true }));

// SAML SP config
const sp = saml.ServiceProvider({
  entityID: 'http://localhost:7001/sp',
  assertionConsumerService: [{ Binding: saml.Constants.namespace.binding.post, Location: 'http://localhost:7001/assert' }]
});

// SAML IdP config (for SP to verify SAMLResponse)
const idp = saml.IdentityProvider({
  entityID: 'http://localhost:7000/idp',
  singleSignOnService: [{ Binding: saml.Constants.namespace.binding.post, Location: 'http://localhost:7000/sso' }],
  signingCert: fs.readFileSync(path.join(__dirname, '../backend/certs/cert.pem')).toString(),
  wantAuthnRequestsSigned: false,
  isAssertionEncrypted: false
});

// Home route
app.get('/', (req, res) => {
  const loggedOut = req.query.logged_out === 'true';
  const isLoggedIn = req.session.user;
  
  res.send(`
    <html>
      <head>
        <title>SAML SP Demo Home</title>
        <link href="https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
          .container { max-width: 500px; margin: 60px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px; text-align: center; }
          h2 { color: #2d3a4b; margin-bottom: 16px; }
          a { display: inline-block; margin: 12px 0; color: #1976d2; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; }
          .meta { margin-top: 24px; font-size: 0.95em; color: #888; }
          .logout-message { background: #e8f5e8; color: #2e7d32; padding: 12px; border-radius: 8px; margin: 16px 0; font-weight: 500; }
          .user-status { background: #e3f2fd; color: #1976d2; padding: 12px; border-radius: 8px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>SAML SP Demo Home</h2>
          <p>Welcome to the SAML Service Provider demo.</p>
          ${loggedOut ? '<div class="logout-message">✅ You have been successfully logged out.</div>' : ''}
          ${isLoggedIn ? `<div class="user-status">👤 Logged in as: <strong>${isLoggedIn.username}</strong></div>` : ''}
          <a href="/protected">🔒 Access Protected Resource</a><br>
          <a href="/metadata">📄 View SP Metadata</a>
          <div class="meta">Powered by <b>samlify</b> &amp; Express</div>
        </div>
      </body>
    </html>
  `);
});

// Protected resource
app.get('/protected', (req, res) => {
  if (!req.session.user) {
    // Redirect to IdP SSO
    res.redirect('http://localhost:7000/sso?RelayState=protected');
  } else {
    res.render('protected', { user: req.session.user });
  }
});

// Assertion Consumer Service (ACS)
app.post('/assert', async (req, res) => {
  try {    const { SAMLResponse, RelayState } = req.body;
    console.log('Received SAMLResponse, attempting to parse...');
    console.log('RelayState:', RelayState);
    console.log('SAMLResponse type:', typeof SAMLResponse);
    console.log('SAMLResponse length:', SAMLResponse ? SAMLResponse.length : 'undefined');
    
    // Debug: Log first part of SAMLResponse
    if (typeof SAMLResponse === 'string') {
      console.log('SAMLResponse preview:', SAMLResponse.substring(0, 200));
    }
    
    // Parse SAMLResponse
    const parsed = await sp.parseLoginResponse(idp, 'post', { body: { SAMLResponse, RelayState } });
    console.log('SAMLResponse parsed successfully:', parsed);
    
    // Extract user info
    const { extract } = parsed;
    if (!extract) {
      throw new Error('No extract data found in SAMLResponse');
    }
    
    req.session.user = {
      username: extract.attributes?.username || extract.nameID || 'Unknown',
      nameID: extract.nameID,
      attributes: extract.attributes
    };
    
    console.log('User session created:', req.session.user);
    
    // Redirect to protected resource or RelayState
    if (RelayState && RelayState !== '') {
      res.redirect(`/${RelayState}`);
    } else {
      res.redirect('/protected');
    }
  } catch (err) {
    console.error('SAMLResponse parse error:', err.message);
    console.error('Full error:', err);
    console.error('Stack trace:', err.stack);
    res.status(400).send(`<h2>Invalid SAMLResponse</h2><p>Error: ${err.message}</p><pre>${err.stack}</pre>`);
  }
});

// Metadata endpoint
app.get('/metadata', (req, res) => {
  res.type('application/xml');
  res.send(sp.getMetadata());
});

// Logout route
app.get('/logout', (req, res) => {
  if (req.session.user) {
    const username = req.session.user.username;
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

app.listen(7001, () => {
  console.log('SAML SP running on http://localhost:7001');
});
