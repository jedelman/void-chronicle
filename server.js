import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// OAuth configuration - these should be moved to environment variables
const BLUESKY_CLIENT_ID = 'https://jedelman.github.io/void-chronicle';
const BLUESKY_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/callback';
const BLUESKY_SCOPE = 'atproto transition:generic transition:refresh';

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Route: Home
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route: Auth - Start OAuth flow
app.get('/auth', (req, res) => {
    // Redirect to Bluesky OAuth authorization endpoint
    const authUrl = `https://bsky.app/xrpc/com.atproto.server.oauth.authorize?` +
        `client_id=${encodeURIComponent(BLUESKY_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(BLUESKY_REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(BLUESKY_SCOPE)}&` +
        `response_type=code&` +
        `state=${encodeURIComponent(Date.now().toString())}`;

    res.redirect(authUrl);
});

// Route: Callback - Handle OAuth redirect
app.get('/callback', (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        res.status(400).send('Missing authorization code');
        return;
    }

    // In a real implementation, you would:
    // 1. Exchange the authorization code for tokens
    // 2. Store tokens securely (session, secure cookie, etc.)
    // 3. Redirect to the main app with session established

    // For now, we'll store the code in session and redirect to index
    // In production, this should use secure server-side sessions
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route: Exchange code for tokens (called from frontend)
app.post('/api/auth/token', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ error: 'Missing authorization code' });
            return;
        }

        // Exchange code for tokens using Bluesky OAuth token endpoint
        const tokenResponse = await fetch('https://bsky.app/xrpc/com.atproto.server.oauth.token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: BLUESKY_REDIRECT_URI,
                client_id: BLUESKY_CLIENT_ID,
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            res.status(400).json(tokens);
            return;
        }

        res.json(tokens);
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Failed to exchange authorization code' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Void Chronicle server running at http://localhost:${PORT}`);
    console.log(`OAuth redirect URI: ${BLUESKY_REDIRECT_URI}`);
});
