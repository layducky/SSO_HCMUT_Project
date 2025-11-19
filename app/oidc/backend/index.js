import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import cors from 'cors';
import pkg from 'openid-client';
const { Issuer } = pkg;


const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());


const redisClient = createClient({ url: 'redis://redis:6379' });
redisClient.on('error', (err) => console.log('Redis Client Error', err));
await redisClient.connect();

const store = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
});

app.use(
  session({
    store,
    secret: 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);


let client;

async function initOIDC() {
  try {
    const internalIssuerUrl = process.env.OIDC_ISSUER;
    const publicIssuerUrl = process.env.OIDC_PUBLIC_ISSUER;

    const discoveredIssuer = await Issuer.discover(internalIssuerUrl);
    
    const issuer = new Issuer({
      issuer: publicIssuerUrl,
      authorization_endpoint: `${publicIssuerUrl}/protocol/openid-connect/auth`,
      token_endpoint: `${internalIssuerUrl}/protocol/openid-connect/token`,
      userinfo_endpoint: `${internalIssuerUrl}/protocol/openid-connect/userinfo`,
      jwks_uri: `${internalIssuerUrl}/protocol/openid-connect/certs`,
      end_session_endpoint: `${publicIssuerUrl}/protocol/openid-connect/logout`,
      revocation_endpoint: discoveredIssuer.metadata.revocation_endpoint,
      introspection_endpoint: discoveredIssuer.metadata.introspection_endpoint,
      response_types_supported: discoveredIssuer.metadata.response_types_supported,
      subject_types_supported: discoveredIssuer.metadata.subject_types_supported,
      id_token_signing_alg_values_supported: discoveredIssuer.metadata.id_token_signing_alg_values_supported,
    });

    client = new issuer.Client({
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [process.env.OIDC_REDIRECT_URI],
      response_types: ['code'],
    });


    console.log('✅ OIDC Client initialized:');

  } catch (err) {
    console.error('❌ Failed to initialize OIDC client:', err);
  }
}

initOIDC();

app.get('/', (req, res) => {
  res.send('OIDC backend running');
});

app.get('/login', (req, res) => {
  if (!client) return res.status(503).send('OIDC client not ready');

  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    response_type: 'code',
  });

  console.log('🔗 Auth URL:', authUrl);  
  return res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  if (!client) return res.status(503).send('OIDC client not ready');
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(process.env.OIDC_REDIRECT_URI, params);
    req.session.tokenSet = tokenSet;

    const userinfo = await client.userinfo(tokenSet.access_token);
    req.session.user = userinfo;

    // Redirect về frontend
    res.redirect(`http://localhost:3001?logged_in=true`);
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).send('Login failed');
  }
});


app.get('/user', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: req.session.user });
});

app.listen(port, () => console.log(`✅ OIDC backend listening on port ${port}`));
