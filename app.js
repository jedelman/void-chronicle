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
            currentUser = await agent.getProfile({ actor: agent.session.did });

            // Update UI
            showMainApp();
        } catch (error) {
            console.error('Session resume failed:', error);
            // Clear invalid session
            localStorage.removeItem('void_session');
            showLogin();
        }
    } else {
        showLogin();
    }
}

// Show login screen
function showLogin() {
    loginSection.style.display = 'block';
    mainApp.style.display = 'none';
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();

    const handle = document.getElementById('handle').value;
    const appPassword = document.getElementById('app-password').value;

    console.log('Login attempt for handle:', handle);

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Create agent
        agent = new BskyAgent({
            service: 'https://bsky.social'
        });

        console.log('Agent created, attempting login...');

        // Login with app password
        const session = await agent.login({
            identifier: handle,
            password: appPassword,
        });

        console.log('Login successful, session:', session);

        // Fetch user profile
        currentUser = await agent.getProfile({ actor: agent.session.did });

        console.log('Profile fetched:', currentUser);

        // Store session
        localStorage.setItem('void_session', JSON.stringify({
            did: session.did,
            accessJwt: session.accessJwt,
            refreshJwt: session.refreshJwt,
        }));

        console.log('Session stored, showing main app...');

        // Show main app
        showMainApp();
    } catch (error) {
        console.error('Login error:', error);
        alert(`Login failed: ${error.message}`);

        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
}

// Add login form listener
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// Initialize app
init();

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
            // Parse URL - validate format first
            const match = postUrl.match(/https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/);
            if (match) {
                const [, handle, postRkey] = match;

                // Validate handle format
                if (!handle || !handle.includes('.')) {
                    throw new Error('Invalid handle format');
                }

                // Validate postRkey is not empty
                if (!postRkey || postRkey.length === 0) {
                    throw new Error('Invalid post reference');
                }

                // Resolve handle to DID using agent
                const didResponse = await agent.resolveHandle({ handle: handle });
                if (didResponse.data.did) {
                    targetDid = handle;

                    // Fetch post using agent
                    const postUri = `at://${didResponse.data.did}/app.bsky.feed.post/${postRkey}`;
                    const postsResponse = await agent.getPosts({ uris: [postUri] });

                    if (postsResponse.data.posts && postsResponse.data.posts.length > 0) {
                        postText = postsResponse.data.posts[0].record?.text || 'Post text not available';
                    }
                }
            } else {
                postText = 'Waiting for valid post URL...';
            }
        } catch (error) {
            console.error('Error resolving post:', error);
            postText = 'Unable to load post: ' + error.message;
        }

        previewContent.innerHTML = `
            <p><strong>Verb:</strong> ${verb}</p>
            <p><strong>Target:</strong> ${targetDid}</p>
            <p><strong>Post:</strong> ${postText.substring(0, 100)}${postText.length > 100 ? '...' : ''}</p>
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

        // Resolve handle to DID using agent
        const didResponse = await agent.resolveHandle({ handle: handle });
        if (!didResponse.data.did) {
            throw new Error('Failed to resolve handle');
        }

        const targetDid = didResponse.data.did;
        const postUri = `at://${targetDid}/app.bsky.feed.post/${postRkey}`;

        // Fetch post to get CID using agent
        const postsResponse = await agent.getPosts({ uris: [postUri] });

        if (!postsResponse.data.posts || postsResponse.data.posts.length === 0) {
            throw new Error('Post not found');
        }

        const postCid = postsResponse.data.posts[0].cid;

        // Create characteristic record
        const record = {
            $type: 'com.jason-edelman.void-chronicle.characteristic',
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
            collection: 'com.jason-edelman.void-chronicle.characteristic',
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
