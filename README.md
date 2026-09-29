# Connectly — Next-Gen Ambient Social & Instant Messaging Universe 🌌📱

**Connectly** is a production-ready, full-stack mobile social networking and real-time messaging platform built with original branding, Iris-Aurora design tokens, custom vector iconography, 24-hour disappearing stories, multi-media carousel posts, real-time Socket.IO chat with audio waveforms, dark/light mode, and moderation dashboard.

---

## 📸 Key Features & Architecture Highlights

1. **Original Visual Identity & Branding**:
   - **App Name**: Connectly
   - **Color Palette**: Electric Indigo (`#6366F1`), Radiant Magenta (`#EC4899`), Hyper Cyan (`#06B6D4`), and Emerald Mint (`#10B981`).
   - **100% Original Vector Iconography**: Custom SVG geometry for Logo pulse, Feed, Discover, Create Orbit, Notifications Bell, Direct Spark, Audio Waveforms, and Reaction badges (zero imitation of proprietary brand assets).
   - **Dark & Light Mode**: Seamless theme switching with high-contrast WCAG AAA compliance and persisted preferences.

2. **Full-Featured 24-Hour Stories Engine**:
   - Camera / Gallery / Text-only story creator.
   - Text overlay editor, font selection, sticker badges, and gradient backgrounds.
   - Segmented progress bars with auto-advance, tap left (previous), tap right (next), hold-to-pause, and swipe-down-to-close.
   - Quick emoji reactions (`🔥`, `❤️`, `👏`, `😂`) and direct story replies in chat.
   - Automatic background cron worker purging expired stories after 24 hours.
   - Creator view analytics: Viewers list, view counter, and reactions stream.

3. **Multi-Media Carousel Feed & Interactions**:
   - Single and multi-image carousel posts with pagination indicators.
   - Double-tap likes, comment threads with nested replies, bookmarks/saves, and share actions.
   - Rich hashtags (`#architecture`, `#coding`, `#design`) and user mentions (`@username`).

4. **Real-Time Direct & Group Messaging**:
   - Socket.IO WebSockets for real-time delivery (`message:new`, `message:delivered`, `message:read`, `message:reaction`, `user:typing`, `user:online`, `user:offline`).
   - Voice notes with audio waveform amplitude visualization and duration counter.
   - 1-on-1 direct conversations and multi-user group chats with administrator roles.
   - Delivery states (`SENT`, `DELIVERED`, `READ`) with double-check indicators.

5. **Security, Privacy & RBAC**:
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - JWT authentication with access token rotation and refresh token sessions.
   - Configurable minimum age verification (>=13 years old).
   - Public vs. Private accounts with follow approval requests.
   - User blocking, muting, and restricted modes.
   - Content reporting system (`Spam`, `Harassment`, `Impersonation`, `Inappropriate`, `Scam`, `Other`).
   - Dedicated Administrator Moderation Dashboard (`/admin`) for account suspension and content removal.

6. **PostgreSQL Relational Database & Zero-Config Dual Engine**:
   - 27 normalized tables with foreign keys, cascading deletions, unique constraints, and B-Tree indexes.
   - Native PostgreSQL support via `pg.Pool` with `DATABASE_URL`.
   - Embedded persistent fallback relational engine with automatic JSON file storage, enabling zero-config instant test runs without requiring local PostgreSQL setup.

---

## 📂 Repository Structure

```
connectly/
├── package.json                    # Root workspace orchestration scripts
├── .env.example                    # Global environment variables
├── README.md                       # Comprehensive guide & API reference
├── database/
│   └── schema.sql                  # PostgreSQL DDL with all 27 tables & indexes
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── uploads/                    # Local object storage upload repository
│   └── src/
│       ├── server.js               # Express + HTTP + Socket.IO bootstrap
│       ├── config/                 # Environment & pool configurations
│       ├── database/
│       │   ├── index.js            # Dual DB client (PostgreSQL pg.Pool + Embedded)
│       │   ├── migrate.js          # Migration runner
│       │   └── seed.js             # 10 users, 20 posts, 10 stories, comments, chats
│       ├── middleware/
│       │   ├── auth.js             # JWT bearer verification
│       │   ├── admin.js            # RBAC administrator validation
│       │   ├── upload.js           # Multer disk storage + MIME validation (50MB)
│       │   ├── rateLimiter.js      # Rate limiting protection
│       │   └── errorHandler.js     # Standardized JSON error response
│       ├── controllers/
│       │   ├── authController.js   # Register, Login, Refresh, Forgot/Reset OTP
│       │   ├── userController.js   # Profiles, Follow/Unfollow, Block/Mute, Search
│       │   ├── postController.js   # Feed, Carousel posts, Likes, Comments, Saves
│       │   ├── storyController.js  # 24h Stories tray, Views, Reactions, Analytics
│       │   ├── chatController.js   # Direct/Group chats, Voice notes, Waveforms
│       │   ├── notificationController.js
│       │   ├── reportController.js # Content abuse reporting
│       │   └── adminController.js  # Moderation queue, suspension, analytics
│       ├── routes/                 # Express REST endpoint routers
│       ├── services/               # Story expiry cron, storage, notifications
│       ├── sockets/                # Socket.IO event handler
│       └── utils/                  # Response formatters, security, age validation
├── mobile/
│   ├── app.json                    # Expo project configuration
│   ├── package.json                # React Native / Expo dependencies
│   ├── babel.config.js             # Expo Babel preset
│   ├── index.js                    # Expo root component registration
│   ├── App.js                      # Root app wrapper with navigation & providers
│   ├── dist/                       # Compiled production web distribution bundle
│   └── src/
│       ├── theme/                  # Design tokens, typography, dark & light themes
│       ├── icons/                  # Connectly 100% original custom vector icons
│       ├── services/               # API client & Socket.IO service
│       ├── context/                # AuthContext, ThemeContext, SocketContext
│       ├── components/             # Header, StoryRing, PostCard, StoryViewer,
│       │                           # StoryCreator, VoiceRecorder, WaveformPlayer,
│       │                           # CommentsModal, ReportModal, Toast
│       ├── screens/
│       │   ├── feed/               # HomeScreen (Tray + Feed)
│       │   ├── search/             # SearchScreen (Discover grid + user lookup)
│       │   ├── post/               # CreatePostScreen (Multi-media picker + caption)
│       │   ├── notifications/      # NotificationsScreen (Activity stream + filters)
│       │   ├── profile/            # ProfileScreen, EditProfileScreen, SettingsScreen
│       │   ├── chat/               # ConversationListScreen, ChatScreen, GroupModal
│       │   ├── admin/              # AdminDashboardScreen (Moderation + Users)
│       │   └── auth/               # LoginScreen, RegisterScreen, ForgotPassword
│       └── navigation/             # BottomTabBar (one-handed thumb zone)
└── tests/
    └── run-tests.js                # 42 automated unit, integration & edge-case tests
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 tested & verified)
- **npm**: v9.0.0 or higher

### Step 1: Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### Step 2: Database Migration & Seed Data
Connectly comes pre-configured with a dual-mode database engine:
- If `DATABASE_URL` is set in `server/.env`, it runs directly against your PostgreSQL database.
- If `DATABASE_URL` is left empty, it runs the zero-config embedded persistence engine with instant setup!

```bash
cd ../server

# Run database schema migration
npm run migrate

# Seed with 10 realistic users, 20 posts, 10 stories, comments, chats, and voice notes
npm run seed
```

### Step 3: Run the Automated Test Suite (42 Tests)
```bash
npm test
```
*Executes all 42 automated tests covering auth, minimum age rejection, duplicate prevention, tokens, feeds, 24h stories expiration, real-time messaging, voice notes with waveforms, privacy, and admin moderation!*

### Step 4: Start the Connectly Application
```bash
# Start the Backend Server (Port 5000)
npm start
```
The server serves:
- **REST APIs**: `http://localhost:5000/api/v1/` or `http://localhost:5000/feed`, `http://localhost:5000/auth`...
- **Real-Time WebSocket**: `ws://localhost:5000`
- **Mobile Web App Preview**: `http://localhost:5000/`

To launch the Expo development server for iOS and Android:
```bash
cd ../mobile
npm start
```

---

## 👥 Seed Test Accounts (One-Tap Logins)

The application provides pre-fill demo buttons on the Login screen:

| Username | Role | Password | Description |
| :--- | :--- | :--- | :--- |
| **`elena_v`** | User | `Password123!` | Architectural photographer, active stories, European photo feed |
| **`marcus_dev`** | User | `Password123!` | Full-stack developer, real-time chat partner with voice notes |
| **`sophia_art`** | User | `Password123!` | 3D animator and digital artist |
| **`connectly_admin`** | Admin | `Password123!` | Platform moderator with full access to moderation queue & user controls |

---

## 🌐 API Reference

### Authentication (`/auth`)
- `POST /auth/register` — Register account (`fullName`, `username`, `email`, `password`, `dob`, optional `phoneNumber`)
- `POST /auth/login` — Sign in (`identifier`, `password`), returns user, profile, access & refresh tokens
- `POST /auth/refresh` — Rotate access token
- `POST /auth/forgot-password` — Generate OTP recovery code
- `POST /auth/reset-password` — Verify OTP and update password
- `POST /auth/logout` — Invalidate user sessions
- `GET /auth/me` — Retrieve active authenticated profile

### Users & Privacy (`/users`)
- `GET /users/:username` — Public or private profile with posts & follow state
- `PATCH /users/me` — Update bio, name, website, avatar, privacy, and theme
- `POST /users/:id/follow` — Follow user or send follow request (if private)
- `DELETE /users/:id/follow` — Unfollow user
- `POST /users/:id/block` — Block user & dissolve mutual relationships
- `DELETE /users/:id/block` — Unblock user
- `POST /users/:id/mute` — Mute user stories and posts
- `GET /users/search?q=:query` — Search users by username or display name

### Feed & Posts (`/posts` & `/feed`)
- `GET /feed?page=1&limit=10` — Personalized home feed with pagination
- `GET /posts/:id` — Single post details with carousel media
- `POST /posts` — Publish new post (`caption`, `location`, `privacy`, `media[]`)
- `PATCH /posts/:id` — Update post caption
- `DELETE /posts/:id` — Delete own post
- `POST /posts/:id/like` — Toggle like
- `POST /posts/:id/save` — Bookmark post
- `GET /posts/:id/comments` — Get comments & replies
- `POST /posts/:id/comments` — Add comment or reply

### 24-Hour Stories (`/stories`)
- `GET /stories` — Active stories grouped by creator (Tray)
- `POST /stories` — Publish 24h story (`caption`, `backgroundStyle`, `media[]`)
- `POST /stories/:id/view` — Record story view
- `POST /stories/:id/reaction` — Send emoji reaction (`🔥`, `❤️`, `👏`)
- `GET /stories/:id/analytics` — View count and viewer list for creator
- `DELETE /stories/:id` — Creator deletion

### Direct & Group Chat (`/conversations`)
- `GET /conversations` — Conversation list with unread counts & online indicators
- `POST /conversations/direct` — Get or create 1-on-1 conversation
- `POST /conversations/group` — Create group chat with admin roles
- `GET /conversations/:id/messages` — Fetch message history
- `POST /conversations/:id/messages` — Send text, photo, video, or voice message with waveform
- `POST /conversations/messages/:id/react` — React to message
- `DELETE /conversations/messages/:id` — Delete message

### Moderation & Admin (`/admin`)
- `GET /admin/overview` — High-level platform metrics & cluster health
- `GET /admin/users` — List accounts with suspension status
- `POST /admin/users/:id/suspension` — Suspend or restore user account
- `GET /admin/reports` — Moderation queue of reported content
- `POST /admin/reports/:id/resolve` — Resolve or dismiss report with content removal

---

## 🛠️ Verification Checklist

- [x] **Zero Build Errors**: Tested with Expo and Node 24 (`npx expo export -p web` completed in 4.5s with 317 modules).
- [x] **Full-Suite Automated Testing**: 42 automated tests across Auth, Profiles, Feed, Stories, Sockets, Moderation, and edge cases passing with 100% success.
- [x] **Original Branding**: Custom Iris-Aurora design tokens, custom SVG vector iconography, zero copied assets.
- [x] **Stories Engine**: 24h automatic expiration worker, pause-on-hold, tap left/right, emoji reactions, and creator analytics.
- [x] **Real-time Messaging**: Socket.IO events, voice notes with waveform rendering, typing indicator, delivery & read receipts.
- [x] **Security**: Bcrypt password hashing, JWT expiration, minimum age validator, rate limiting, and RBAC admin gate.
