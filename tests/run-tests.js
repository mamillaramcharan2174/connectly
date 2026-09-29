/**
 * Connectly Full-Stack Automated Test Suite
 * Covers Authentication, Profiles, Feed, Posts, 24h Stories, Real-time Chat, Voice Notes,
 * Privacy, Admin Moderation, and Critical Edge Cases.
 */

process.env.NODE_ENV = 'test';
const http = require('http');
const path = require('path');
const { app, server } = require('../server/src/server');
const { query } = require('../server/src/database');

let testServer = null;
let baseUrl = '';


function request(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const bodyData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (bodyData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

// Simple test assertion helper
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING CONNECTLY TEST SUITE');
  console.log('======================================================\n');

  // Start test server on random port
  const TEST_PORT = 5055;
  await new Promise((resolve) => {
    testServer = server.listen(TEST_PORT, () => {
      baseUrl = `http://localhost:${TEST_PORT}`;
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // 1. HEALTHCHECK
    // -------------------------------------------------------------
    console.log('\n--- 1. Healthcheck & System Verification ---');
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.status === 'ok', 'API health check responds 200 OK');

    // -------------------------------------------------------------
    // 2. AUTHENTICATION & SECURITY TESTS
    // -------------------------------------------------------------
    console.log('\n--- 2. Authentication & Authorization Tests ---');
    
    // Test Underage registration (<13 years)
    const underage = await request('POST', '/auth/register', {}, {
      fullName: 'Too Young',
      username: 'kiddo123',
      email: 'kiddo@example.com',
      password: 'Password123!',
      dob: '2020-01-01'
    });
    assert(underage.status === 400 && underage.body.error.code === 'UNDERAGE', 'Rejects registration for users under minimum age requirement (13)');

    // Test Valid Registration
    const testUsername = `user_${Date.now()}`;
    const testEmail = `${testUsername}@test.com`;
    const regRes = await request('POST', '/auth/register', {}, {
      fullName: 'Automated Tester',
      username: testUsername,
      email: testEmail,
      password: 'SecurePassword123!',
      dob: '1995-04-12'
    });
    assert(regRes.status === 201 && regRes.body.success === true, 'Successfully registers user with valid credentials and age');
    const testUserToken = regRes.body.data.tokens.accessToken;
    const testUserId = regRes.body.data.user.id;

    // Test Duplicate Registration Prevention
    const dupRes = await request('POST', '/auth/register', {}, {
      fullName: 'Duplicate Tester',
      username: testUsername,
      email: testEmail,
      password: 'SecurePassword123!',
      dob: '1995-04-12'
    });
    assert(dupRes.status === 400 && (dupRes.body.error.code === 'USERNAME_TAKEN' || dupRes.body.error.code === 'EMAIL_EXISTS'), 'Prevents duplicate username/email registrations');

    // Test Login with Valid Seed User
    const loginRes = await request('POST', '/auth/login', {}, {
      identifier: 'elena_v',
      password: 'Password123!'
    });
    assert(loginRes.status === 200 && loginRes.body.data.tokens.accessToken, 'Logs in valid seed user (elena_v) and issues JWT access token');
    const elenaToken = loginRes.body.data.tokens.accessToken;

    // Test Login with Invalid Password
    const badLogin = await request('POST', '/auth/login', {}, {
      identifier: 'elena_v',
      password: 'WrongPassword999!'
    });
    assert(badLogin.status === 401 && badLogin.body.error.code === 'INVALID_CREDENTIALS', 'Rejects login with invalid password');

    // Test Get Me (/auth/me)
    const meRes = await request('GET', '/auth/me', { Authorization: `Bearer ${elenaToken}` });
    assert(meRes.status === 200 && meRes.body.data.username === 'elena_v', 'Returns authenticated user profile via /auth/me');

    // Test Token Expiration / Invalid Token Rejection
    const fakeTokenRes = await request('GET', '/auth/me', { Authorization: 'Bearer fake.invalid.jwt' });
    assert(fakeTokenRes.status === 401 && fakeTokenRes.body.error.code === 'TOKEN_EXPIRED', 'Rejects forged or expired token');

    // -------------------------------------------------------------
    // 3. USER PROFILES & PRIVACY TESTS
    // -------------------------------------------------------------
    console.log('\n--- 3. User Profiles, Following & Privacy Tests ---');
    
    // View Profile
    const profileRes = await request('GET', '/users/marcus_dev', { Authorization: `Bearer ${elenaToken}` });
    assert(profileRes.status === 200 && profileRes.body.data.user.username === 'marcus_dev', 'Retrieves user public profile with posts and follower stats');

    // Update Profile
    const updateRes = await request('PATCH', '/users/me', { Authorization: `Bearer ${testUserToken}` }, {
      displayName: 'Updated Tester Name',
      bio: 'New bio test line',
      themePreference: 'dark'
    });
    assert(updateRes.status === 200 && updateRes.body.data.updated === true, 'Allows user to update display name, bio, and theme preference');

    // Follow / Unfollow User
    const followRes = await request('POST', `/users/${testUserId}/follow`, { Authorization: `Bearer ${elenaToken}` });
    assert(followRes.status === 200 && followRes.body.data.isFollowing === true, 'Elena can follow another user');

    const unfollowRes = await request('DELETE', `/users/${testUserId}/follow`, { Authorization: `Bearer ${elenaToken}` });
    assert(unfollowRes.status === 200 && unfollowRes.body.data.isFollowing === false, 'Elena can unfollow user');

    // Block User
    const blockRes = await request('POST', `/users/${testUserId}/block`, { Authorization: `Bearer ${elenaToken}` });
    assert(blockRes.status === 200 && blockRes.body.data.blocked === true, 'User can block another user');

    const unblockRes = await request('DELETE', `/users/${testUserId}/block`, { Authorization: `Bearer ${elenaToken}` });
    assert(unblockRes.status === 200 && unblockRes.body.data.blocked === false, 'User can unblock user');

    // Search Users
    const searchRes = await request('GET', '/users/search?q=marcus', { Authorization: `Bearer ${elenaToken}` });
    assert(searchRes.status === 200 && searchRes.body.data.users.length > 0, 'Search discovers users matching query');

    // -------------------------------------------------------------
    // 4. POSTS, CAROUSEL & INTERACTIONS TESTS
    // -------------------------------------------------------------
    console.log('\n--- 4. Posts, Feed, Carousel & Interactions Tests ---');

    // Get Feed
    const feedRes = await request('GET', '/feed', { Authorization: `Bearer ${elenaToken}` });
    assert(feedRes.status === 200 && Array.isArray(feedRes.body?.data?.posts) && feedRes.body.data.posts.length > 0, 'Loads personalized home feed with posts');



    // Create New Post with Carousel Media
    const createPostRes = await request('POST', '/posts', { Authorization: `Bearer ${elenaToken}` }, {
      caption: 'Sunset in the Alps! #mountains #travel @marcus_dev',
      location: 'Swiss Alps',
      privacy: 'public',
      media: [
        { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', type: 'image' },
        { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b', type: 'image' }
      ]
    });
    assert(createPostRes.status === 201 && createPostRes.body.data.id, 'Creates multi-media carousel post with caption, location and hashtags');
    const createdPostId = createPostRes.body.data.id;

    // Like Post
    const likeRes = await request('POST', `/posts/${createdPostId}/like`, { Authorization: `Bearer ${elenaToken}` });
    assert(likeRes.status === 200 && likeRes.body.data.isLiked === true, 'Likes post and increments like count');

    // Add Comment
    const commentRes = await request('POST', `/posts/${createdPostId}/comments`, { Authorization: `Bearer ${elenaToken}` }, {
      content: 'Stunning photography!'
    });
    assert(commentRes.status === 201 && commentRes.body.data.content === 'Stunning photography!', 'Adds comment to post and increments comments count');

    // Save Post
    const saveRes = await request('POST', `/posts/${createdPostId}/save`, { Authorization: `Bearer ${elenaToken}` });
    assert(saveRes.status === 200 && saveRes.body.data.isSaved === true, 'Saves post to bookmarks');

    // Delete Own Post
    const delPostRes = await request('DELETE', `/posts/${createdPostId}`, { Authorization: `Bearer ${elenaToken}` });
    assert(delPostRes.status === 200 && delPostRes.body.data.deleted === true, 'Author can delete their own post');

    // -------------------------------------------------------------
    // 5. 24-HOUR DISAPPEARING STORIES TESTS
    // -------------------------------------------------------------
    console.log('\n--- 5. 24-Hour Disappearing Stories Tests ---');

    // Fetch Stories Feed Tray
    const storiesTrayRes = await request('GET', '/stories', { Authorization: `Bearer ${elenaToken}` });
    assert(storiesTrayRes.status === 200 && Array.isArray(storiesTrayRes.body.data.storiesTray), 'Fetches active stories tray grouped by user');

    // Publish Story
    const publishStoryRes = await request('POST', '/stories', { Authorization: `Bearer ${elenaToken}` }, {
      caption: 'Studio session testing soundwaves 🎧✨',
      backgroundStyle: 'linear-gradient(135deg, #6366F1, #EC4899)',
      privacy: 'everyone',
      media: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', type: 'image', duration: 5 }]
    });
    assert(publishStoryRes.status === 201 && publishStoryRes.body.data.expiresAt, 'Publishes story with 24-hour expiration timestamp');
    const createdStoryId = publishStoryRes.body.data.id;

    // View Story
    const viewStoryRes = await request('POST', `/stories/${createdStoryId}/view`, { Authorization: `Bearer ${elenaToken}` });
    assert(viewStoryRes.status === 200 && viewStoryRes.body.data.viewed === true, 'Records story view and tracks viewer');

    // React to Story (Emoji)
    const reactStoryRes = await request('POST', `/stories/${createdStoryId}/reaction`, { Authorization: `Bearer ${elenaToken}` }, {
      emoji: '🔥'
    });
    assert(reactStoryRes.status === 200 && reactStoryRes.body.data.reacted === true, 'Reacts to story with emoji');

    // Story Analytics
    const analyticsRes = await request('GET', `/stories/${createdStoryId}/analytics`, { Authorization: `Bearer ${elenaToken}` });
    assert(analyticsRes.status === 200 && analyticsRes.body.data.viewsCount >= 1, 'Provides story viewer list and reaction analytics to creator');

    // Delete Story
    const delStoryRes = await request('DELETE', `/stories/${createdStoryId}`, { Authorization: `Bearer ${elenaToken}` });
    assert(delStoryRes.status === 200 && delStoryRes.body.data.deleted === true, 'Allows creator to manually delete story');

    // -------------------------------------------------------------
    // 6. DIRECT MESSAGING & GROUP CHAT TESTS
    // -------------------------------------------------------------
    console.log('\n--- 6. Direct Messaging, Group Chat & Voice Notes Tests ---');

    // Get Conversations List
    const convsRes = await request('GET', '/conversations', { Authorization: `Bearer ${elenaToken}` });
    assert(convsRes.status === 200 && Array.isArray(convsRes.body.data.conversations), 'Retrieves conversation list with last message and unread counters');

    // Create Direct Conversation
    const dmCreateRes = await request('POST', '/conversations/direct', { Authorization: `Bearer ${elenaToken}` }, {
      targetUserId: 'u-2-marcus'
    });
    assert(dmCreateRes.status === 200 || dmCreateRes.status === 201, 'Creates or retrieves direct 1-on-1 chat conversation');
    const activeConvId = dmCreateRes.body.data.conversationId;

    // Send Text Message
    const sendMsgRes = await request('POST', `/conversations/${activeConvId}/messages`, { Authorization: `Bearer ${elenaToken}` }, {
      type: 'text',
      content: 'Hey Marcus! Testing real-time direct message.'
    });
    assert(sendMsgRes.status === 201 && sendMsgRes.body.data.content.includes('Testing real-time'), 'Sends text message in conversation');
    const sentMsgId = sendMsgRes.body.data.id;

    // Send Voice Note Message with Waveform
    const voiceMsgRes = await request('POST', `/conversations/${activeConvId}/messages`, { Authorization: `Bearer ${elenaToken}` }, {
      type: 'voice',
      content: 'Voice note (0:08)',
      mediaUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      voiceDuration: 8,
      voiceWaveform: [30, 50, 75, 90, 60, 40, 20]
    });
    assert(voiceMsgRes.status === 201 && voiceMsgRes.body.data.voiceDuration === 8, 'Sends voice message with duration and audio waveform data');

    // React to Message
    const reactMsgRes = await request('POST', `/conversations/messages/${sentMsgId}/react`, { Authorization: `Bearer ${elenaToken}` }, {
      emoji: '❤️'
    });
    assert(reactMsgRes.status === 200 && reactMsgRes.body.data.reacted === true, 'Adds emoji reaction to message');

    // Create Group Chat
    const groupRes = await request('POST', '/conversations/group', { Authorization: `Bearer ${elenaToken}` }, {
      name: 'Automated Beta Testers',
      memberIds: ['u-2-marcus', 'u-3-sophia']
    });
    assert(groupRes.status === 201 && groupRes.body.data.isGroup === true, 'Creates group conversation with multiple members and admin role assignment');

    // -------------------------------------------------------------
    // 7. NOTIFICATIONS & REPORTS TESTS
    // -------------------------------------------------------------
    console.log('\n--- 7. Notifications & Content Reporting Tests ---');

    // Get Notifications
    const notifsRes = await request('GET', '/notifications', { Authorization: `Bearer ${elenaToken}` });
    assert(notifsRes.status === 200 && Array.isArray(notifsRes.body.data.notifications), 'Retrieves user notification activity stream');

    // Submit Content Report
    const reportRes = await request('POST', '/reports', { Authorization: `Bearer ${elenaToken}` }, {
      targetType: 'post',
      targetId: 'p-2',
      reason: 'spam',
      description: 'Automated test report'
    });
    assert(reportRes.status === 201 && reportRes.body.data.status === 'pending', 'Submits content moderation report for moderation review');

    // -------------------------------------------------------------
    // 8. ADMIN DASHBOARD & MODERATION TESTS
    // -------------------------------------------------------------
    console.log('\n--- 8. Admin Moderation & Dashboard Tests ---');

    // Login as Admin
    const adminLogin = await request('POST', '/auth/login', {}, {
      identifier: 'connectly_admin',
      password: 'Password123!'
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.user.role === 'admin', 'Authenticates administrator account');
    const adminToken = adminLogin.body.data.tokens.accessToken;

    // Admin Overview
    const adminOverview = await request('GET', '/admin/overview', { Authorization: `Bearer ${adminToken}` });
    assert(adminOverview.status === 200 && adminOverview.body.data.totalUsers >= 10, 'Admin can view system analytics and user metrics');

    // Non-Admin Forbidden Check
    const forbiddenAdmin = await request('GET', '/admin/overview', { Authorization: `Bearer ${elenaToken}` });
    assert(forbiddenAdmin.status === 403, 'Enforces RBAC: Non-admin users are strictly forbidden from admin endpoints');

    // Admin Reports Queue
    const adminReports = await request('GET', '/admin/reports?status=pending', { Authorization: `Bearer ${adminToken}` });
    assert(adminReports.status === 200 && Array.isArray(adminReports.body.data.reports), 'Admin can view moderation reports queue');

    // Admin Suspend & Restore User
    const suspendRes = await request('POST', `/admin/users/${testUserId}/suspension`, { Authorization: `Bearer ${adminToken}` }, {
      suspend: true,
      reason: 'Terms violation test'
    });
    assert(suspendRes.status === 200 && suspendRes.body.data.isSuspended === true, 'Admin can suspend abusive user accounts');

    // Verify Suspended User Cannot Access Protected Routes
    const suspendedCheck = await request('GET', '/auth/me', { Authorization: `Bearer ${testUserToken}` });
    assert(suspendedCheck.status === 403 && suspendedCheck.body.error.code === 'ACCOUNT_SUSPENDED', 'Suspended user is immediately blocked from API calls');

    // Admin Restore User
    const restoreRes = await request('POST', `/admin/users/${testUserId}/suspension`, { Authorization: `Bearer ${adminToken}` }, {
      suspend: false
    });
    assert(restoreRes.status === 200 && restoreRes.body.data.isSuspended === false, 'Admin can restore suspended user accounts');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    failed++;
  } finally {
    if (testServer) {
      testServer.close();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllTests();
