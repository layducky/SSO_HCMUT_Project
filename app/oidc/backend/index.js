import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import pkg from 'openid-client';
const { Issuer } = pkg;


const app = express();
const port = process.env.PORT || 8080;

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
    const issuerUrl =
      process.env.OIDC_ISSUER ||
      'http://keycloak:8080/realms/demo'; // phù hợp với docker network

    const issuer = await Issuer.discover(issuerUrl);

    client = new issuer.Client({
      client_id: process.env.OIDC_CLIENT_ID || 'oidc-demo',
      client_secret: process.env.OIDC_CLIENT_SECRET || 'demosecret',
      redirect_uris: [process.env.OIDC_REDIRECT_URI || 'http://localhost:3001/callback'],
      response_types: ['code'],
    });

    console.log('✅ OIDC Client initialized with issuer:', issuerUrl);
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
  const url = client.authorizationUrl({
    scope: 'openid profile email',
    redirect_uri: client.redirect_uris[0],
  });
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  if (!client) return res.status(503).send('OIDC client not ready');
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(client.redirect_uris[0], params);
    req.session.tokenSet = tokenSet;
    const userinfo = await client.userinfo(tokenSet.access_token);
    req.session.user = userinfo;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).send('OIDC callback failed');
  }
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.json({ user: req.session.user });
});

app.listen(port, () => console.log(`✅ OIDC backend listening on port ${port}`));
