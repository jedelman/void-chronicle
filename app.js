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

            // Check if session has required fields (detect old format)
            if (!sessionData.handle || !sessionData.email) {
                console.log('Old session format detected, clearing...');
                localStorage.removeItem('void_session');
                showLogin();
                return;
            }

            console.log('Attempting to resume session:', JSON.stringify(sessionData, null, 2));

            // Create agent with existing session
            agent = new BskyAgent({
                service: 'https://bsky.social'
            });

            // Resume session - the sessionData should be the complete session object
            await agent.resumeSession(sessionData);

            console.log('Session resumed successfully');

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
        console.log('Full session data:', JSON.stringify(session, null, 2));

        // Fetch user profile
        currentUser = await agent.getProfile({ actor: agent.session.did });

        console.log('Profile fetched:', currentUser);

        // Store the entire session object from agent.session, not the login response
        localStorage.setItem('void_session', JSON.stringify(agent.session));

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

// Show Create Chapter form
async function showCreateChapter() {
    contentArea.innerHTML = `
        <h2>Create Chapter</h2>
        <form id="chapter-form">
            <div style="margin-bottom: 20px;">
                <label for="chapter-title" style="display: block; margin-bottom: 8px;">Title:</label>
                <input type="text" id="chapter-title" placeholder="Chapter title..." maxlength="100" required
                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0;">
            </div>

            <div style="margin-bottom: 20px;">
                <label for="chapter-summary" style="display: block; margin-bottom: 8px;">Summary:</label>
                <textarea id="chapter-summary" rows="6" placeholder="Narrative summary of this chapter..." maxlength="2000" required
                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0; resize: vertical;"></textarea>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px;">Characteristics:</label>
                <div id="characteristics-loader" style="color: #a0a0a0;">Loading your characteristics...</div>
                <div id="characteristics-list" style="display: none; margin-top: 10px; max-height: 300px; overflow-y: auto; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;"></div>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="is-quest" style="width: 20px; height: 20px;">
                    <span style="font-size: 1.1rem; font-weight: 600;">This is a Quest</span>
                </label>
                <p style="font-size: 0.9rem; color: #a0a0a0; margin-top: 5px; margin-left: 30px;">
                    Quests are special chapters where you accept or complete a task given by another user
                </p>
            </div>

            <div id="quest-fields" style="display: none; margin-bottom: 20px; padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 8px; border-left: 3px solid #00d4ff;">
                <h3 style="margin-bottom: 15px;">🎯 Quest Details</h3>

                <div style="margin-bottom: 20px;">
                    <label for="questor-handle" style="display: block; margin-bottom: 8px;">Questor Handle:</label>
                    <input type="text" id="questor-handle" placeholder="@handle.bsky.social" required
                        style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0;">
                    <p style="font-size: 0.8rem; color: #a0a0a0; margin-top: 5px;">
                        The person who gave you this quest (or yourself if creating a self-quest)
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <label for="quest-status" style="display: block; margin-bottom: 8px;">Quest Status:</label>
                    <select id="quest-status" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #e0e0e0;">
                        <option value="active">Active (in progress)</option>
                        <option value="completed">Completed</option>
                        <option value="release-requested">Release Requested</option>
                    </select>
                </div>
            </div>

            <div id="chapter-preview" style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; display: none;">
                <h3 style="margin-bottom: 10px;">Preview:</h3>
                <div id="preview-content"></div>
            </div>

            <button type="submit" class="action-btn primary">Create Chapter</button>
        </form>
    `;

    // Load characteristics for selection
    await loadCharacteristicsForSelection();

    // Add form handlers
    document.getElementById('chapter-form').addEventListener('submit', handleCreateChapter);
    document.getElementById('chapter-title').addEventListener('input', updateChapterPreview);
    document.getElementById('chapter-summary').addEventListener('input', updateChapterPreview);
    document.getElementById('is-quest').addEventListener('change', handleQuestToggle);
    document.getElementById('questor-handle').addEventListener('input', updateChapterPreview);
    document.getElementById('quest-status').addEventListener('change', updateChapterPreview);
}

// Load characteristics for chapter selection
async function loadCharacteristicsForSelection() {
    const loader = document.getElementById('characteristics-loader');
    const list = document.getElementById('characteristics-list');

    try {
        const response = await agent.com.atproto.repo.listRecords({
            repo: agent.session.did,
            collection: 'com.jason-edelman.void-chronicle.characteristic',
            limit: 100,
            reverse: true
        });

        const characteristics = response.data.records || [];

        if (characteristics.length === 0) {
            loader.textContent = 'No characteristics found. Create some characteristics first!';
            return;
        }

        // Enrich with handles and post data
        const enriched = await Promise.all(
            characteristics.map(async (char) => {
                try {
                    let targetHandle = char.value.targetDid;
                    try {
                        const profile = await agent.getProfile({ actor: char.value.targetDid });
                        targetHandle = profile.data.handle;
                    } catch (e) {
                        console.warn('Failed to resolve handle for DID:', char.value.targetDid);
                    }

                    return {
                        ...char,
                        enriched: {
                            targetHandle,
                            timestamp: new Date(char.value.createdAt).toLocaleString()
                        }
                    };
                } catch (e) {
                    console.error('Error enriching characteristic:', e);
                    return char;
                }
            })
        );

        // Render checkboxes
        const verbIcons = {
            gift: '🎁',
            thank: '👍',
            applaud: '🏃',
            witness: '👁️'
        };

        list.innerHTML = enriched.map(char => `
            <label style="display: flex; align-items: flex-start; gap: 10px; padding: 10px; cursor: pointer; border-radius: 5px; transition: background 0.2s; margin-bottom: 5px;">
                <input type="checkbox" class="characteristic-checkbox" value="${char.uri}" style="margin-top: 5px;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                        <span>${verbIcons[char.value.verb] || '🎁'}</span>
                        <span style="font-weight: 600; color: #00d4ff;">${char.value.verb.charAt(0).toUpperCase() + char.value.verb.slice(1)}</span>
                        <span style="color: #a0a0a0;">@${char.enriched.targetHandle}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: #a0a0a0;">${char.enriched.timestamp}</div>
                    ${char.value.note ? `<div style="font-size: 0.9rem; color: #e0e0e0; margin-top: 5px; font-style: italic;">"${char.value.note}"</div>` : ''}
                </div>
            </label>
        `).join('');

        // Add change listeners for preview updates
        document.querySelectorAll('.characteristic-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateChapterPreview);
        });

        loader.style.display = 'none';
        list.style.display = 'block';
    } catch (error) {
        console.error('Error loading characteristics:', error);
        loader.textContent = `Failed to load characteristics: ${error.message}`;
    }
}

// Handle quest toggle
function handleQuestToggle() {
    const isQuest = document.getElementById('is-quest').checked;
    const questFields = document.getElementById('quest-fields');

    if (isQuest) {
        questFields.style.display = 'block';
        // Pre-fill questor with current user for convenience
        document.getElementById('questor-handle').value = currentUser.data.handle;
    } else {
        questFields.style.display = 'none';
    }

    updateChapterPreview();
}

// Update chapter preview
function updateChapterPreview() {
    const title = document.getElementById('chapter-title').value;
    const summary = document.getElementById('chapter-summary').value;
    const isQuest = document.getElementById('is-quest').checked;
    const questorHandle = document.getElementById('questor-handle').value;
    const questStatus = document.getElementById('quest-status').value;

    const previewDiv = document.getElementById('chapter-preview');
    const previewContent = document.getElementById('preview-content');

    // Get selected characteristics
    const selectedCharacteristics = Array.from(document.querySelectorAll('.characteristic-checkbox:checked')).map(cb => cb.value);

    if (title || summary || isQuest || selectedCharacteristics.length > 0) {
        previewDiv.style.display = 'block';

        previewContent.innerHTML = `
            ${title ? `<p><strong>Title:</strong> ${title}</p>` : ''}
            ${summary ? `<p><strong>Summary:</strong> ${summary.substring(0, 200)}${summary.length > 200 ? '...' : ''}</p>` : ''}
            <p><strong>Characteristics:</strong> ${selectedCharacteristics.length} selected</p>
            ${isQuest ? `
                <div style="padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 5px; margin-top: 10px;">
                    <p style="margin: 0;"><strong>🎯 Quest</strong></p>
                    ${questorHandle ? `<p style="margin: 5px 0 0 0;"><strong>Questor:</strong> ${questorHandle}</p>` : ''}
                    <p style="margin: 5px 0 0 0;"><strong>Status:</strong> ${questStatus}</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #a0a0a0;"><strong>Quest Giver:</strong> ${currentUser.data.handle} (you)</p>
                </div>
            ` : ''}
        `;
    } else {
        previewDiv.style.display = 'none';
    }
}

// Handle create chapter
async function handleCreateChapter(e) {
    e.preventDefault();

    const title = document.getElementById('chapter-title').value;
    const summary = document.getElementById('chapter-summary').value;
    const isQuest = document.getElementById('is-quest').checked;
    const questorHandle = document.getElementById('questor-handle').value;
    const questStatus = document.getElementById('quest-status').value;

    // Get selected characteristics
    const selectedCharacteristics = Array.from(document.querySelectorAll('.characteristic-checkbox:checked')).map(cb => cb.value);

    if (selectedCharacteristics.length === 0) {
        alert('Please select at least one characteristic for this chapter.');
        return;
    }

    try {
        const record = {
            $type: 'com.jason-edelman.void-chronicle.chapter',
            title: title,
            summary: summary,
            characteristics: selectedCharacteristics,
            createdAt: new Date().toISOString(),
        };

        // Add quest-specific fields if this is a quest
        if (isQuest) {
            record.isQuest = true;

            // Resolve questor handle to DID
            const questorDidResponse = await agent.resolveHandle({ handle: questorHandle.replace('@', '') });
            if (!questorDidResponse.data.did) {
                throw new Error('Failed to resolve questor handle');
            }

            record.questor = {
                did: questorDidResponse.data.did,
                handle: questorHandle.replace('@', '')
            };

            // Quest giver is always the current user
            record.questGiver = {
                did: agent.session.did,
                handle: currentUser.data.handle
            };

            // Set quest status fields
            if (questStatus === 'completed') {
                record.completedAt = new Date().toISOString();
            } else if (questStatus === 'release-requested') {
                record.questReleaseRequested = true;
            }
        }

        // Create chapter record via AT Protocol
        const result = await agent.com.atproto.repo.createRecord({
            repo: agent.session.did,
            collection: 'com.jason-edelman.void-chronicle.chapter',
            record: record,
        });

        contentArea.innerHTML = `
            <h2>Chapter Created!</h2>
            <div style="padding: 20px; background: rgba(0, 212, 255, 0.1); border-radius: 8px; margin: 20px 0;">
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Characteristics:</strong> ${selectedCharacteristics.length}</p>
                ${isQuest ? `<p style="margin-top: 10px;"><strong>🎯 Quest Chapter</strong></p>
                <p><strong>Questor:</strong> ${questorHandle}</p>
                <p><strong>Status:</strong> ${questStatus}</p>` : ''}
                <p style="margin-top: 10px; color: #a0a0a0;">URI: ${result.uri}</p>
            </div>
            <button class="action-btn" onclick="showCreateChapter()">Create Another</button>
        `;
    } catch (error) {
        console.error('Error creating chapter:', error);
        contentArea.innerHTML = `<div class="error">Failed to create chapter: ${error.message}</div>`;
    }
}

// Show Chronicle View
async function showChronicle() {
    contentArea.innerHTML = `
        <h2>Chronicle View</h2>
        <p style="color: #a0a0a0; margin-bottom: 20px;">Timeline of your journey</p>
        <div class="loading">Loading chronicle...</div>
        <div id="chronicle-timeline" class="chronicle-timeline"></div>
        <div id="scroll-sentinel" class="scroll-sentinel"></div>
    `;

    try {
        // Initialize infinite scroll state
        window.chronicleState = {
            cursor: null,
            isLoading: false,
            hasMore: true,
            allCharacteristics: []
        };

        // Load initial batch
        await loadChronicleBatch();

        // Set up intersection observer for infinite scroll
        setupInfiniteScroll();
    } catch (error) {
        console.error('Error loading chronicle:', error);
        contentArea.innerHTML = `
            <h2>Chronicle View</h2>
            <div class="error">Failed to load chronicle: ${error.message}</div>
        `;
    }
}

// Load a batch of characteristics
async function loadChronicleBatch() {
    if (!window.chronicleState || window.chronicleState.isLoading || !window.chronicleState.hasMore) {
        return;
    }

    window.chronicleState.isLoading = true;
    showLoadingIndicator();

    try {
        const params = {
            repo: agent.session.did,
            collection: 'com.jason-edelman.void-chronicle.characteristic',
            limit: 20,
            reverse: true  // newest first
        };

        if (window.chronicleState.cursor) {
            params.cursor = window.chronicleState.cursor;
        }

        const response = await agent.com.atproto.repo.listRecords(params);
        const characteristics = response.data.records || [];

        // Update state
        window.chronicleState.hasMore = characteristics.length === 20;
        window.chronicleState.cursor = response.data.cursor;

        if (characteristics.length === 0 && window.chronicleState.allCharacteristics.length === 0) {
            // Empty state
            document.getElementById('chronicle-timeline').innerHTML = `
                <div class="empty-state">
                    <p style="font-size: 24px; margin-bottom: 10px;">📜</p>
                    <h3>Your chronicle is empty!</h3>
                    <p style="color: #a0a0a0;">Start your journey by creating characteristics. Every action you take becomes part of your story.</p>
                </div>
            `;
            return;
        }

        // Enrich characteristics
        const enriched = await Promise.all(
            characteristics.map(async (char) => {
                try {
                    // Resolve handle from targetDid
                    let targetHandle = char.value.targetDid;
                    try {
                        const profile = await agent.getProfile({ actor: char.value.targetDid });
                        targetHandle = profile.data.handle;
                    } catch (e) {
                        console.warn('Failed to resolve handle for DID:', char.value.targetDid);
                    }

                    // Fetch post details
                    let postText = '';
                    if (char.value.targetPost?.uri) {
                        try {
                            const posts = await agent.getPosts({ uris: [char.value.targetPost.uri] });
                            if (posts.data.posts && posts.data.posts.length > 0) {
                                postText = posts.data.posts[0].record?.text || '';
                            }
                        } catch (e) {
                            console.warn('Failed to fetch post:', char.value.targetPost.uri);
                        }
                    }

                    return {
                        ...char,
                        enriched: {
                            targetHandle,
                            postText,
                            timestamp: new Date(char.value.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                        }
                    };
                } catch (e) {
                    console.error('Error enriching characteristic:', e);
                    return char;
                }
            })
        );

        // Add to state
        window.chronicleState.allCharacteristics = [
            ...window.chronicleState.allCharacteristics,
            ...enriched
        ];

        // Render timeline
        renderChronicleTimeline(window.chronicleState.allCharacteristics);

    } catch (error) {
        console.error('Error loading chronicle batch:', error);
        if (window.chronicleState.allCharacteristics.length === 0) {
            document.getElementById('chronicle-timeline').innerHTML = `
                <div class="error">Failed to load chronicle: ${error.message}</div>
            `;
        }
    } finally {
        window.chronicleState.isLoading = false;
        hideLoadingIndicator();
    }
}

// Set up infinite scroll observer
function setupInfiniteScroll() {
    const sentinel = document.getElementById('scroll-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                loadChronicleBatch();
            }
        },
        { threshold: 0.1 }
    );

    observer.observe(sentinel);
}

// Show loading indicator
function showLoadingIndicator() {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
        const spinner = sentinel.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    }
}

// Hide loading indicator
function hideLoadingIndicator() {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
        const spinner = sentinel.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }
}

// Render chronicle timeline
function renderChronicleTimeline(characteristics) {
    const timelineContainer = document.getElementById('chronicle-timeline');
    if (!timelineContainer) return;

    const verbIcons = {
        gift: { icon: '🎁', color: '#00d4ff', label: 'Gifted to' },
        thank: { icon: '👍', color: '#00ff88', label: 'Thanked' },
        applaud: { icon: '🏃', color: '#ffaa00', label: 'Applauded' },
        witness: { icon: '👁️', color: '#aa00ff', label: 'Witnessed' }
    };

    const html = `
        <div class="timeline-line"></div>
        ${characteristics.map(char => {
            const verb = verbIcons[char.value.verb] || verbIcons.gift;
            const hasNote = char.value.note && char.value.note.trim();
            const postPreview = char.enriched.postText
                ? (char.enriched.postText.length > 100
                    ? char.enriched.postText.substring(0, 100) + '...'
                    : char.enriched.postText)
                : '';

            return `
                <div class="chronicle-event">
                    <div class="chronicle-icon" style="border-color: ${verb.color}; color: ${verb.color};">●</div>
                    <div class="chronicle-content">
                        <div class="event-header">
                            <span class="verb-icon">${verb.icon}</span>
                            <span class="event-label">${verb.label} @${char.enriched.targetHandle}</span>
                        </div>
                        <div class="event-timestamp">${char.enriched.timestamp}</div>
                        ${postPreview ? `<div class="post-preview">"${postPreview}"</div>` : ''}
                        ${hasNote ? `<div class="event-note"><strong>Note:</strong> ${char.value.note}</div>` : ''}
                        ${char.value.targetPost?.uri ? `
                            <a class="view-post-link" href="${char.value.targetPost.uri}" target="_blank" rel="noopener noreferrer">
                                ↗️ View Original Post
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('')}
    `;

    timelineContainer.innerHTML = html;
}

// Show Character Sheet
async function showCharacterSheet() {
    contentArea.innerHTML = `
        <h2>Character Sheet</h2>
        <div class="loading">Loading character data...</div>
    `;

    try {
        // Fetch all characteristics from user's repo
        const characteristicsResponse = await agent.com.atproto.repo.listRecords({
            repo: agent.session.did,
            collection: 'com.jason-edelman.void-chronicle.characteristic',
            limit: 100,
            reverse: true
        });

        const characteristics = characteristicsResponse.data.records || [];

        // Calculate statistics
        const stats = {
            gift: 0,
            thank: 0,
            applaud: 0,
            witness: 0,
            total: characteristics.length
        };

        characteristics.forEach(char => {
            if (char.value.verb && stats[char.value.verb] !== undefined) {
                stats[char.value.verb]++;
            }
        });

        // Enrich characteristics with handle and post data
        const enrichedCharacteristics = await Promise.all(
            characteristics.map(async (char) => {
                try {
                    // Resolve handle from targetDid
                    let targetHandle = char.value.targetDid;
                    try {
                        const profile = await agent.getProfile({ actor: char.value.targetDid });
                        targetHandle = profile.data.handle;
                    } catch (e) {
                        console.warn('Failed to resolve handle for DID:', char.value.targetDid);
                    }

                    // Fetch post details
                    let postText = '';
                    if (char.value.targetPost?.uri) {
                        try {
                            const posts = await agent.getPosts({ uris: [char.value.targetPost.uri] });
                            if (posts.data.posts && posts.data.posts.length > 0) {
                                postText = posts.data.posts[0].record?.text || '';
                            }
                        } catch (e) {
                            console.warn('Failed to fetch post:', char.value.targetPost.uri);
                        }
                    }

                    return {
                        ...char,
                        enriched: {
                            targetHandle,
                            postText,
                            timestamp: new Date(char.value.createdAt).toLocaleString()
                        }
                    };
                } catch (e) {
                    console.error('Error enriching characteristic:', e);
                    return char;
                }
            })
        );

        // Group characteristics by verb
        const groupedByVerb = {
            gift: [],
            thank: [],
            applaud: [],
            witness: []
        };

        enrichedCharacteristics.forEach(char => {
            if (char.value.verb && groupedByVerb[char.value.verb]) {
                groupedByVerb[char.value.verb].push(char);
            }
        });

        // Render character sheet
        renderCharacterSheet(stats, groupedByVerb);
    } catch (error) {
        console.error('Error loading character sheet:', error);
        contentArea.innerHTML = `
            <h2>Character Sheet</h2>
            <div class="error">Failed to load character sheet: ${error.message}</div>
        `;
    }
}

// Render character sheet UI
function renderCharacterSheet(stats, groupedByVerb) {
    const verbIcons = {
        gift: '🎁',
        thank: '👍',
        applaud: '👏',
        witness: '👁️'
    };

    const verbColors = {
        gift: '#00d4ff',
        thank: '#00ff88',
        applaud: '#ffaa00',
        witness: '#aa00ff'
    };

    // Calculate percentages for progress bars
    const percentages = {};
    const maxCount = Math.max(stats.gift, stats.thank, stats.applaud, stats.witness, 1);
    for (const verb in stats) {
        if (verb !== 'total') {
            percentages[verb] = (stats[verb] / maxCount) * 100;
        }
    }

    contentArea.innerHTML = `
        <h2>Character Sheet</h2>
        <p style="color: #a0a0a0; margin-bottom: 20px;">Characteristics created by ${currentUser.data.handle}</p>

        <!-- Stats Dashboard -->
        <div style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 15px;">
            <h3 style="margin-bottom: 15px;">📊 Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${Object.entries(stats).filter(([key]) => key !== 'total').map(([verb, count]) => `
                    <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span style="font-size: 1.5rem;">${verbIcons[verb]}</span>
                            <span style="font-weight: 600; text-transform: capitalize;">${verb}</span>
                        </div>
                        <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">${count}</div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: 5px; height: 8px; overflow: hidden;">
                            <div style="background: ${verbColors[verb]}; width: ${percentages[verb]}%; height: 100%;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Characteristics Given -->
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px;">✨ Characteristics Given (${stats.total})</h3>
            ${Object.entries(groupedByVerb).map(([verb, characteristics]) => `
                ${characteristics.length > 0 ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                            <span>${verbIcons[verb]}</span>
                            <span style="text-transform: capitalize;">${verb}</span>
                            <span style="color: #a0a0a0; font-weight: normal;">(${characteristics.length})</span>
                        </h4>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${characteristics.map(char => `
                                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px; border-left: 3px solid ${verbColors[char.value.verb]};">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 600; color: ${verbColors[char.value.verb]};">
                                            ${verbIcons[char.value.verb]} ${char.value.verb.charAt(0).toUpperCase() + char.value.verb.slice(1)}
                                        </span>
                                        <span style="color: #a0a0a0; font-size: 0.85rem;">${char.enriched.timestamp}</span>
                                    </div>
                                    <p style="color: #a0a0a0; margin-bottom: 5px;">
                                        <strong>To:</strong> @${char.enriched.targetHandle}
                                    </p>
                                    ${char.enriched.postText ? `
                                        <p style="color: #e0e0e0; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; font-style: italic;">
                                            "${char.enriched.postText.substring(0, 150)}${char.enriched.postText.length > 150 ? '...' : ''}"
                                        </p>
                                    ` : ''}
                                    ${char.value.note ? `
                                        <p style="color: #e0e0e0; margin-top: 10px; padding: 10px; background: rgba(0,212,255,0.1); border-radius: 5px;">
                                            <strong>Note:</strong> ${char.value.note}
                                        </p>
                                    ` : ''}
                                    ${char.value.targetPost?.uri ? `
                                        <a href="${char.value.targetPost.uri}" target="_blank" style="color: #00d4ff; font-size: 0.85rem; text-decoration: none;">
                                            ↗️ View Original Post
                                        </a>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `).join('')}
            ${stats.total === 0 ? '<p style="color: #a0a0a0; padding: 20px; text-align: center;">No characteristics created yet. Start by creating one above!</p>' : ''}
        </div>

        <!-- Characteristics Received -->
        <div style="margin-bottom: 30px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 15px; text-align: center;">
            <h3 style="margin-bottom: 10px;">📥 Characteristics Received</h3>
            <p style="color: #a0a0a0; margin-bottom: 15px;">
                Network search coming soon! This will show all characteristics where others have recognized you.
            </p>
            <div style="display: inline-block; padding: 15px 30px; background: rgba(255,255,255,0.1); border-radius: 10px; color: #a0a0a0;">
                🔍 Building network indexer...
            </div>
        </div>
    `;
}
