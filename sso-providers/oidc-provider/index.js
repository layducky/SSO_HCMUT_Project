import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { createClient } from 'redis';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 8080;

const ISSUER = process.env.ISSUER || 'http://localhost:9090';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Generate RSA keys
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// Request Logger
app.use((req, res, next) => {
  console.log("\n==== 📥 Incoming Request ====");
  console.log("➡️ Method:", req.method);
  console.log("➡️ URL:", req.originalUrl);
  console.log("➡️ Query:", req.query);
  console.log("➡️ Body:", req.body);
  console.log("➡️ Headers:", {
    ...req.headers,
    authorization: req.headers.authorization ? '[REDACTED TOKEN]' : undefined
  });
  console.log("================================\n");
  next();
});


// Redis client
const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Error:', err));

async function connectRedis() {
  let retries = 5;
  while (retries > 0) {
    try {
      await redisClient.connect();
      console.log('✅ Redis connected');
      return;
    } catch (err) {
      retries--;
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

await connectRedis();

// Mock users
const users = [
  {
    id: '1',
    username: 'user1',
    password: await bcrypt.hash('password1', 10),
    email: 'admin@demo.com',
    name: 'Administrator',
    preferred_username: 'user1'
  },
];

// Registered clients
const clients = new Map([
  [process.env.OIDC_CLIENT_ID || 'oidc-demo', {
    client_id: process.env.OIDC_CLIENT_ID || 'oidc-demo',
    client_secret: process.env.OIDC_CLIENT_SECRET || 'demosecret',
    redirect_uris: [process.env.OIDC_REDIRECT_URI || 'http://localhost:8081/callback'],
    grant_types: ['authorization_code'],
    response_types: ['code']
  }]
]);

// OIDC Discovery
app.get('/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
    token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
    userinfo_endpoint: `${ISSUER}/protocol/openid-connect/userinfo`,
    jwks_uri: `${ISSUER}/protocol/openid-connect/certs`,
    end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
    revocation_endpoint: `${ISSUER}/protocol/openid-connect/revoke`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'name', 'email', 'preferred_username']
  });
});

// JWKS endpoint
app.get('/protocol/openid-connect/certs', (req, res) => {
  const jwk = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
  res.json({
    keys: [{
      ...jwk,
      kid: 'default-key',
      use: 'sig',
      alg: 'RS256'
    }]
  });
});

// Authorization endpoint (GET)
app.get('/protocol/openid-connect/auth', async (req, res) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  const client = clients.get(client_id);
  if (!client || !client.redirect_uris.includes(redirect_uri) || response_type !== 'code') {
    return res.status(400).send('Invalid request');
  }

  // Simple login form
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Sign In</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .login { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
        h2 { margin: 0 0 1.5rem; text-align: center; color: #333; }
        input { width: 100%; padding: 0.5rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 0.6rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        button:hover { background: #0056b3; }
        .info { margin-top: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; font-size: 0.85rem; color: #666; }
      </style>
    </head>
    <body>
      <div class="login">
        <h2>🔐 Sign In</h2>
        <form method="POST" action="/protocol/openid-connect/auth">
          <input type="hidden" name="client_id" value="${client_id}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
          <input type="hidden" name="response_type" value="${response_type}" />
          <input type="hidden" name="scope" value="${scope || ''}" />
          <input type="hidden" name="state" value="${state || ''}" />
          <input type="text" name="username" placeholder="Username" required autofocus />
          <input type="password" name="password" placeholder="Password" required />
          <button type="submit">Sign In</button>
        </form>
        <div class="info">Demo: admin / admin</div>
      </div>
    </body>
    </html>
  `);
});

// Authorization endpoint (POST)
app.post('/protocol/openid-connect/auth', async (req, res) => {
  const { username, password, client_id, redirect_uri, state, scope } = req.body;

  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }

  const code = crypto.randomBytes(32).toString('hex');
  await redisClient.setEx(`authcode:${code}`, 600, JSON.stringify({
    client_id,
    redirect_uri,
    user_id: user.id,
    scope: scope || 'openid profile email',
    created_at: Date.now()
  }));

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);
  
  res.redirect(redirectUrl.toString());
});

// Token endpoint
app.post('/protocol/openid-connect/token', async (req, res) => {
  let { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  if (req.headers.authorization?.startsWith("Basic ")) {
    const decoded = Buffer.from(
      req.headers.authorization.split(" ")[1],
      "base64"
    ).toString();

    const [basicId, basicSecret] = decoded.split(":");

    client_id = basicId;
    client_secret = basicSecret;
  }

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  const client = clients.get(client_id);
  if (!client || client.client_secret !== client_secret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  const codeData = await redisClient.get(`authcode:${code}`);
  if (!codeData) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  const authData = JSON.parse(codeData);
  if (authData.client_id !== client_id || authData.redirect_uri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  await redisClient.del(`authcode:${code}`);

  const user = users.find(u => u.id === authData.user_id);
  if (!user) {
    return res.status(400).json({ error: 'invalid_grant' });
  }

  const now = Math.floor(Date.now() / 1000);
  const accessToken = jwt.sign(
    { sub: user.id, aud: client_id, iss: ISSUER, exp: now + 3600, iat: now, scope: authData.scope },
    privateKey,
    { algorithm: 'RS256', keyid: 'default-key' }
  );

  const idToken = jwt.sign(
    { sub: user.id, aud: client_id, iss: ISSUER, exp: now + 3600, iat: now, auth_time: now, name: user.name, email: user.email, preferred_username: user.preferred_username },
    privateKey,
    { algorithm: 'RS256', keyid: 'default-key' }
  );

  await redisClient.setEx(`token:${accessToken}`, 3600, JSON.stringify({
    user_id: user.id,
    client_id,
    scope: authData.scope
  }));

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    id_token: idToken,
    scope: authData.scope
  });
});

// UserInfo endpoint
app.get('/protocol/openid-connect/userinfo', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  const accessToken = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(accessToken, publicKey, { algorithms: ['RS256'] });
    const user = users.find(u => u.id === decoded.sub);
    
    if (!user) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    res.json({
      sub: user.id,
      name: user.name,
      email: user.email,
      preferred_username: user.preferred_username
    });
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
});

// Logout endpoint
app.get('/protocol/openid-connect/logout', (req, res) => {
  const { redirect_uri } = req.query;
  res.redirect(redirect_uri || 'http://localhost:3001');
});

// Token revocation
app.post('/protocol/openid-connect/revoke', async (req, res) => {
  const { token } = req.body;
  if (token) await redisClient.del(`token:${token}`);
  res.json({ success: true });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ OIDC Provider running on port ${port}`);
  console.log(`📍 Discovery: ${ISSUER}/.well-known/openid-configuration`);
});