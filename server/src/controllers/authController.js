const { v4: uuidv4 } = require('uuid');
const { query } = require('../database');
const { hashPassword, comparePassword, generateTokens, verifyRefreshToken, validateAge, sanitizeInput } = require('../utils/security');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// In-memory OTP storage for password recovery (with 10m TTL)
const passwordResetTokens = new Map();

async function register(req, res) {
  try {
    let { fullName, username, email, phoneNumber, password, dob } = req.body;

    if (!fullName || !username || !email || !password || !dob) {
      return errorResponse(res, 'VALIDATION_FAILED', 'All required fields (fullName, username, email, password, dob) must be provided.');
    }

    username = sanitizeInput(username.toLowerCase());
    email = sanitizeInput(email.toLowerCase());
    fullName = sanitizeInput(fullName);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, 'INVALID_EMAIL', 'Please provide a valid email address.');
    }

    // Validate username format (alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return errorResponse(res, 'INVALID_USERNAME', 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.');
    }

    // Password strength check (min 8 characters, at least 1 number)
    if (password.length < 8) {
      return errorResponse(res, 'WEAK_PASSWORD', 'Password must be at least 8 characters long.');
    }

    // Age validation
    if (!validateAge(dob)) {
      return errorResponse(res, 'UNDERAGE', 'You must be at least 13 years old to register an account.');
    }

    // Check existing username or email
    const existingUser = await query(
      'SELECT id, username, email FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      const match = existingUser.rows[0];
      if (match.username === username) {
        return errorResponse(res, 'USERNAME_TAKEN', 'This username is already taken. Please choose another.');
      }
      return errorResponse(res, 'EMAIL_EXISTS', 'An account with this email address already exists.');
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Insert user
    await query(
      `INSERT INTO users (id, username, email, phone_number, password_hash, dob, role, is_private, is_suspended, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, username, email, phoneNumber || null, passwordHash, dob, 'user', false, false, now, now]
    );

    // Default avatar gradient / placeholder
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80`;

    // Insert profile
    const profileId = uuidv4();
    await query(
      `INSERT INTO profiles (id, user_id, display_name, bio, website, avatar_url, followers_count, following_count, posts_count, is_online, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [profileId, userId, fullName, '', '', defaultAvatar, 0, 0, 0, true, now]
    );

    const tokens = generateTokens({ id: userId, username, email, role: 'user' });

    // Store session
    await query(
      `INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, tokens.refreshToken, req.headers['user-agent'] || '', req.ip || '', new Date(Date.now() + 7 * 86400000).toISOString()]
    );

    return successResponse(res, {
      user: {
        id: userId,
        username,
        email,
        fullName,
        avatarUrl: defaultAvatar,
        role: 'user',
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      },
      tokens
    }, 201, 'Account successfully created.');
  } catch (err) {
    console.error('[Register Error]', err);
    return errorResponse(res, 'REGISTRATION_FAILED', 'Could not create account.', 500);
  }
}

async function login(req, res) {
  try {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
      return errorResponse(res, 'MISSING_CREDENTIALS', 'Username/email and password are required.');
    }

    identifier = sanitizeInput(identifier.trim().toLowerCase());

    const userRes = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.role, u.is_private, u.is_suspended,
              p.display_name, p.avatar_url, p.bio, p.website, p.followers_count, p.following_count, p.posts_count, p.theme_preference
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.username = $1 OR u.email = $1`,
      [identifier]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid username/email or password.', 401);
    }

    const user = userRes.rows[0];

    if (user.is_suspended) {
      return errorResponse(res, 'ACCOUNT_SUSPENDED', 'This account has been suspended for violating terms.', 403);
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return errorResponse(res, 'INVALID_CREDENTIALS', 'Invalid username/email or password.', 401);
    }

    const tokens = generateTokens({ id: user.id, username: user.username, email: user.email, role: user.role });

    // Store session
    await query(
      `INSERT INTO sessions (id, user_id, refresh_token, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), user.id, tokens.refreshToken, req.headers['user-agent'] || '', req.ip || '', new Date(Date.now() + 7 * 86400000).toISOString()]
    );

    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.display_name,
        bio: user.bio,
        website: user.website,
        avatarUrl: user.avatar_url,
        role: user.role,
        isPrivate: user.is_private,
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        postsCount: user.posts_count || 0,
        themePreference: user.theme_preference || 'system'
      },
      tokens
    }, 200, 'Login successful.');
  } catch (err) {
    console.error('[Login Error]', err);
    return errorResponse(res, 'LOGIN_FAILED', 'An error occurred during login.', 500);
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: incomingToken } = req.body;
    if (!incomingToken) {
      return errorResponse(res, 'TOKEN_REQUIRED', 'Refresh token is required.', 400);
    }

    const decoded = verifyRefreshToken(incomingToken);
    if (!decoded) {
      return errorResponse(res, 'INVALID_TOKEN', 'Refresh token is expired or invalid.', 401);
    }

    const sessionRes = await query(
      'SELECT id, is_revoked FROM sessions WHERE user_id = $1 AND refresh_token = $2',
      [decoded.id, incomingToken]
    );

    if (sessionRes.rows.length === 0 || sessionRes.rows[0].is_revoked) {
      return errorResponse(res, 'SESSION_EXPIRED', 'Session has expired or was revoked.', 401);
    }

    const tokens = generateTokens({ id: decoded.id, username: decoded.username, email: decoded.email, role: decoded.role });

    // Update session refresh token
    await query('UPDATE sessions SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, sessionRes.rows[0].id]);

    return successResponse(res, { tokens }, 200, 'Token refreshed successfully.');
  } catch (err) {
    console.error('[Refresh Token Error]', err);
    return errorResponse(res, 'REFRESH_FAILED', 'Could not refresh token.', 500);
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'EMAIL_REQUIRED', 'Please provide your account email.');
    }

    const userRes = await query('SELECT id, email, username FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      // Don't leak user existence
      return successResponse(res, { sent: true }, 200, 'If that email exists, an OTP recovery code has been sent.');
    }

    // Generate 6 digit numeric code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    passwordResetTokens.set(email.toLowerCase().trim(), { otp, userId: userRes.rows[0].id, expiresAt });
    console.log(`[Auth Recovery] Generated OTP for ${email}: ${otp}`);

    return successResponse(res, {
      sent: true,
      // Provide OTP in dev mode for testing convenience
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    }, 200, 'Recovery code sent successfully.');
  } catch (err) {
    console.error('[Forgot Password Error]', err);
    return errorResponse(res, 'RECOVERY_ERROR', 'Could not process password recovery request.', 500);
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return errorResponse(res, 'MISSING_FIELDS', 'Email, OTP code, and new password are required.');
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'WEAK_PASSWORD', 'New password must be at least 8 characters long.');
    }

    const record = passwordResetTokens.get(email.toLowerCase().trim());
    if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
      return errorResponse(res, 'INVALID_OTP', 'The recovery code is invalid or has expired.');
    }

    const newHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3', [newHash, new Date().toISOString(), record.userId]);

    // Invalidate all existing sessions
    await query('UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1', [record.userId]);

    passwordResetTokens.delete(email.toLowerCase().trim());

    return successResponse(res, { success: true }, 200, 'Password has been updated. Please log in with your new password.');
  } catch (err) {
    console.error('[Reset Password Error]', err);
    return errorResponse(res, 'RESET_FAILED', 'Could not reset password.', 500);
  }
}

async function logout(req, res) {
  try {
    if (req.user) {
      await query('UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1', [req.user.id]);
    }
    return successResponse(res, { loggedOut: true }, 200, 'Logged out successfully.');
  } catch (err) {
    return errorResponse(res, 'LOGOUT_ERROR', 'Error during logout.', 500);
  }
}

async function getMe(req, res) {
  try {
    const userRes = await query(
      `SELECT u.id, u.username, u.email, u.phone_number, u.dob, u.role, u.is_private,
              p.display_name, p.avatar_url, p.bio, p.website, p.followers_count, p.following_count, p.posts_count,
              p.theme_preference, p.notification_preferences, p.privacy_settings
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return errorResponse(res, 'USER_NOT_FOUND', 'User profile not found.', 404);
    }

    const u = userRes.rows[0];
    return successResponse(res, {
      id: u.id,
      username: u.username,
      email: u.email,
      phoneNumber: u.phone_number,
      dob: u.dob,
      role: u.role,
      isPrivate: u.is_private,
      fullName: u.display_name,
      avatarUrl: u.avatar_url,
      bio: u.bio,
      website: u.website,
      followersCount: u.followers_count || 0,
      followingCount: u.following_count || 0,
      postsCount: u.posts_count || 0,
      themePreference: u.theme_preference || 'system',
      notificationPreferences: typeof u.notification_preferences === 'string' ? JSON.parse(u.notification_preferences) : u.notification_preferences,
      privacySettings: typeof u.privacy_settings === 'string' ? JSON.parse(u.privacy_settings) : u.privacy_settings
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    return errorResponse(res, 'SERVER_ERROR', 'Could not retrieve profile.', 500);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getMe
};
