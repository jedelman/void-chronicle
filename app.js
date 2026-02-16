// Import @atproto/api
import { BskyAgent } from '@atproto/api';

// App state
let agent = null;
let currentUser = null;

// DOM elements
const loginSection = document.getElementById('login-section');
const mainApp = document.getElementById('main-app');
const userAvatar = document.getElementById('user-avatar');
const userHandle = document.getElementById('user-handle');
const userDid = document.getElementById('user-did');
const contentArea = document.getElementById('content-area');

// Button handlers
document.getElementById('btn-create-characteristic').addEventListener('click', showCreateCharacteristic);
document.getElementById('btn-create-chapter').addEventListener('click', showCreateChapter);
document.getElementById('btn-chronicle').addEventListener('click', showChronicle);
document.getElementById('btn-character-sheet').addEventListener('click', showCharacterSheet);

// Check for existing session on load
async function init() {
    const session = localStorage.getItem('void_session');

    if (session) {
        try {
            const sessionData = JSON.parse(session);

            // Create agent with existing session
            agent = new BskyAgent({
                service: 'https://bsky.social'
            });

            // Resume session
            await agent.resumeSession(sessionData);

            // Fetch user profile
            currentUser = await agent.getProfile({ actor: sessionData.did });

            // Update UI
            showMainApp();
        } catch (error) {
            console.error('Session resume failed:', error);
            // Clear invalid session
            localStorage.removeItem('void_session');
            showLogin();
        }
    } else {
        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Handle OAuth callback
            handleOAuthCallback(code);
        } else {
            showLogin();
        }
    }
}

// Handle OAuth callback
async function handleOAuthCallback(code) {
    try {
        contentArea.innerHTML = '<div class="loading">Authenticating...</div>';

        // Exchange code for tokens
        const response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        const tokens = await response.json();

        if (tokens.error) {
            throw new Error(tokens.error_description || tokens.error);
        }

        // Create agent with tokens
        agent = new BskyAgent({
            service: 'https://bsky.social'
        });

        // Create session with access token
        await agent.createSession({
            identifier: 'temp', // Will be overwritten by OAuth
            password: 'temp',
        });

        // Actually, for OAuth we need to use the refresh token properly
        // For now, let's use a simpler approach - store the tokens and refresh when needed

        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);

        // Fetch user profile
        currentUser = await agent.getProfile({ actor: tokens.did });

        // Store session
        const sessionData = {
            did: tokens.did,
            accessJwt: tokens.access_token,
            refreshJwt: tokens.refresh_token,
        };
        localStorage.setItem('void_session', JSON.stringify(sessionData));

        // Show main app
        showMainApp();
    } catch (error) {
        console.error('OAuth error:', error);
        contentArea.innerHTML = `<div class="error">Authentication failed: ${error.message}</div>`;
        setTimeout(showLogin, 3000);
    }
}

// Show login screen
function showLogin() {
    loginSection.style.display = 'block';
    mainApp.style.display = 'none';
}

// Show main application
function showMainApp() {
    loginSection.style.display = 'none';
    mainApp.style.display = 'block';

    // Update user profile
    if (currentUser) {
        userHandle.textContent = currentUser.data.handle;
        userDid.textContent = currentUser.data.did;

        // Avatar
        if (currentUser.data.avatar) {
            userAvatar.innerHTML = `<img src="${currentUser.data.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            userAvatar.textContent = currentUser.data.handle.charAt(0).toUpperCase();
        }
    }

    contentArea.innerHTML = '<div class="loading">Select an action above...</div>';
}

// Show Create Characteristic form
function showCreateCharacteristic() {
    contentArea.innerHTML = `
        <h2>Create Characteristic</h2>
        <form id="characteristic-form">
            <div style="margin-bottom: 20px;">
                <label for="post-url" style="display: block; margin-bottom: 8px;">Post URL:</label>
                <input type="url" id="post-url" placeholder="https://bsky.app/profile/handle/post/abc123" required
                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0;">
            </div>

            <div style="margin-bottom: 20px;">
                <label for="verb" style="display: block; margin-bottom: 8px;">Verb:</label>
                <select id="verb" required style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0;">
                    <option value="gift">Gift</option>
                    <option value="thank">Thank</option>
                    <option value="applaud">Applaud</option>
                    <option value="witness">Witness</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label for="note" style="display: block; margin-bottom: 8px;">Note (optional):</label>
                <textarea id="note" rows="4" placeholder="Add a note about this characteristic..." maxlength="500"
                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0; resize: vertical;"></textarea>
            </div>

            <div id="characteristic-preview" style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; display: none;">
                <h3 style="margin-bottom: 10px;">Preview:</h3>
                <div id="preview-content"></div>
            </div>

            <button type="submit" class="action-btn primary">Create Characteristic</button>
        </form>
    `;

    // Add form handler
    document.getElementById('characteristic-form').addEventListener('submit', handleCreateCharacteristic);
    document.getElementById('post-url').addEventListener('input', updateCharacteristicPreview);
    document.getElementById('verb').addEventListener('change', updateCharacteristicPreview);
}

// Update characteristic preview
async function updateCharacteristicPreview() {
    const postUrl = document.getElementById('post-url').value;
    const verb = document.getElementById('verb').value;
    const note = document.getElementById('note').value;
    const previewDiv = document.getElementById('characteristic-preview');
    const previewContent = document.getElementById('preview-content');

    if (postUrl && verb) {
        previewDiv.style.display = 'block';

        // Try to resolve post URL
        let targetDid = 'Unknown User';
        let postText = 'Loading post...';

        try {
            // Parse URL
            const match = postUrl.match(/https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/);
            if (match) {
                const [, handle, postRkey] = match;

                // Resolve handle to DID
                const resolveResponse = await fetch(`https://bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
                const resolveData = await resolveResponse.json();
                if (resolveData.did) {
                    targetDid = handle;

                    // Fetch post
                    const postUri = `at://${resolveData.did}/app.bsky.feed.post/${postRkey}`;
                    const postResponse = await fetch(`https://bsky.app/xrpc/app.bsky.feed.getPosts?uris=${postUri}`);
                    const postData = await postResponse.json();

                    if (postData.posts && postData.posts.length > 0) {
                        postText = postData.posts[0].record?.text || 'Post text not available';
                    }
                }
            }
        } catch (error) {
            console.error('Error resolving post:', error);
        }

        previewContent.innerHTML = `
            <p><strong>Verb:</strong> ${verb}</p>
            <p><strong>Target:</strong> ${targetDid}</p>
            <p><strong>Post:</strong> ${postText.substring(0, 100)}...</p>
            ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        `;
    } else {
        previewDiv.style.display = 'none';
    }
}

// Handle create characteristic
async function handleCreateCharacteristic(e) {
    e.preventDefault();

    const postUrl = document.getElementById('post-url').value;
    const verb = document.getElementById('verb').value;
    const note = document.getElementById('note').value;

    try {
        // Parse URL to get URI/CID
        const match = postUrl.match(/https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/);
        if (!match) {
            throw new Error('Invalid post URL');
        }

        const [, handle, postRkey] = match;

        // Resolve handle to DID
        const resolveResponse = await fetch(`https://bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
        const resolveData = await resolveResponse.json();

        if (!resolveData.did) {
            throw new Error('Failed to resolve handle');
        }

        const targetDid = resolveData.did;
        const postUri = `at://${targetDid}/app.bsky.feed.post/${postRkey}`;

        // Fetch post to get CID
        const postResponse = await fetch(`https://bsky.app/xrpc/app.bsky.feed.getPosts?uris=${postUri}`);
        const postData = await postResponse.json();

        if (!postData.posts || postData.posts.length === 0) {
            throw new Error('Post not found');
        }

        const postCid = postData.posts[0].cid;

        // Create characteristic record
        const record = {
            $type: 'com.rpg.characteristic',
            verb: verb,
            targetPost: {
                uri: postUri,
                cid: postCid,
            },
            targetDid: targetDid,
            note: note || undefined,
            createdAt: new Date().toISOString(),
        };

        // Create record via AT Protocol
        const result = await agent.com.atproto.repo.createRecord({
            repo: agent.session.did,
            collection: 'com.rpg.characteristic',
            record: record,
        });

        contentArea.innerHTML = `
            <h2>Characteristic Created!</h2>
            <div style="padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 8px; margin: 20px 0;">
                <p><strong>Verb:</strong> ${verb}</p>
                <p><strong>Target:</strong> @${handle}</p>
                ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                <p style="margin-top: 10px; color: #a0a0a0;">URI: ${result.uri}</p>
            </div>
            <button class="action-btn" onclick="showCreateCharacteristic()">Create Another</button>
        `;
    } catch (error) {
        console.error('Error creating characteristic:', error);
        contentArea.innerHTML = `<div class="error">Failed to create characteristic: ${error.message}</div>`;
    }
}

// Show Create Chapter form (placeholder)
function showCreateChapter() {
    contentArea.innerHTML = `
        <h2>Create Chapter</h2>
        <div class="loading">Coming soon...</div>
    `;
}

// Show Chronicle View (placeholder)
function showChronicle() {
    contentArea.innerHTML = `
        <h2>Chronicle View</h2>
        <div class="loading">Coming soon...</div>
    `;
}

// Show Character Sheet (placeholder)
function showCharacterSheet() {
    contentArea.innerHTML = `
        <h2>Character Sheet</h2>
        <div class="loading">Coming soon...</div>
    `;
}

// Initialize app
init();
