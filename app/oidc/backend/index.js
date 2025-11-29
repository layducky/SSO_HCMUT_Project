import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import cors from 'cors';
import pkg from 'openid-client';
const { Issuer } = pkg;

const app = express();
const port = process.env.PORT || 8080;

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const OIDC_ISSUER = process.env.OIDC_ISSUER || 'http://oidc-provider:8080';
const OIDC_PUBLIC_ISSUER = process.env.OIDC_PUBLIC_ISSUER || 'http://localhost:9090';
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || 'oidc-demo';
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || 'demosecret';
const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || 'http://localhost:8081/callback';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

await connectRedis();

// Session store
const store = new RedisStore({
  client: redisClient,
  prefix: 'oidc:sess:',
});

app.use(
  session({
    store,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    },
  })
);

let client;

async function initOIDC() {
  let retries = 10;
  
  while (retries > 0) {
    try {
      const discoveredIssuer = await Issuer.discover(OIDC_ISSUER);
      
      // Custom issuer với public URLs cho browser redirects
      const issuer = new Issuer({
        issuer: OIDC_PUBLIC_ISSUER,
        authorization_endpoint: `${OIDC_PUBLIC_ISSUER}/protocol/openid-connect/auth`,
        token_endpoint: `${OIDC_ISSUER}/protocol/openid-connect/token`,
        userinfo_endpoint: `${OIDC_ISSUER}/protocol/openid-connect/userinfo`,
        jwks_uri: `${OIDC_ISSUER}/protocol/openid-connect/certs`,
        end_session_endpoint: `${OIDC_PUBLIC_ISSUER}/protocol/openid-connect/logout`,
        revocation_endpoint: discoveredIssuer.metadata.revocation_endpoint,
        response_types_supported: discoveredIssuer.metadata.response_types_supported,
        subject_types_supported: discoveredIssuer.metadata.subject_types_supported,
        id_token_signing_alg_values_supported: discoveredIssuer.metadata.id_token_signing_alg_values_supported,
      });

      client = new issuer.Client({
        client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_CLIENT_SECRET,
        redirect_uris: [OIDC_REDIRECT_URI],
        response_types: ['code'],
      });

      console.log('✅ OIDC Client initialized');
      return;

    } catch (err) {
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        throw err;
      }
    }
  }
}

initOIDC();

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'OIDC Backend is running',
    endpoints: { login: '/login', callback: '/callback', user: '/user', logout: '/logout' }
  });
});

// Login endpoint
app.get('/login', (req, res) => {
  if (!client) {
    return res.status(503).json({ error: 'OIDC client not ready' });
  }

  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    response_type: 'code',
  });

  return res.redirect(authUrl);
});

// Callback endpoint
app.get('/callback', async (req, res) => {
  if (!client) {
    return res.status(503).send('OIDC client not ready');
  }
  
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(OIDC_REDIRECT_URI, params);
    
    req.session.tokenSet = {
      access_token: tokenSet.access_token,
      id_token: tokenSet.id_token,
      expires_at: tokenSet.expires_at
    };

    const userinfo = await client.userinfo(tokenSet.access_token);
    req.session.user = userinfo;

    req.session.save((err) => {
      if (err) {
        return res.status(500).send('Session save failed');
      }
      res.redirect(`http://localhost:3001?logged_in=true`);
    });

  } catch (err) {
    console.error('Callback error:', err.message);
    res.status(500).send(`Login failed: ${err.message}`);
  }
});

// Get current user
app.get('/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  
  res.json({ user: req.session.user });
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ OIDC Backend running on port ${port}`);
});