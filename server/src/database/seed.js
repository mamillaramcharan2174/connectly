const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('./index');

async function seed() {
  console.log('[Seed] Seeding Connectly database with realistic sample data...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed 10 Users & Profiles
  const rawUsers = [
    {
      id: 'u-1-elena',
      username: 'elena_v',
      email: 'elena@connectly.app',
      name: 'Elena Rostova',
      bio: 'Architectural photographer & visual storyteller 📐✨ Capturing light and shadow across Europe.',
      website: 'https://elenarostova.design',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-2-marcus',
      username: 'marcus_dev',
      email: 'marcus@connectly.app',
      name: 'Marcus Chen',
      bio: 'Fullstack tinkerer | Building open-source mobile tools 🚀 Coffee & clean code enthusiast.',
      website: 'https://github.com/marcuschen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-3-sophia',
      username: 'sophia_art',
      email: 'sophia@connectly.app',
      name: 'Sophia Miller',
      bio: 'Digital illustrator & 3D animator 🎨 Exploring generative color palettes and surreal worlds.',
      website: 'https://sophiamiller.art',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-4-alex',
      username: 'alex_sound',
      email: 'alex@connectly.app',
      name: 'Alex Rivera',
      bio: 'Ambient sound designer & synth lover 🎧 Ambient frequencies for late-night productivity.',
      website: 'https://soundcloud.com/alexrivera',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-5-maya',
      username: 'maya_wanderer',
      email: 'maya@connectly.app',
      name: 'Maya Tanaka',
      bio: 'Documenting hidden alpine trails & solo bikepacking expeditions 🚲🏔️ Leave no trace.',
      website: 'https://mayatrails.org',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-6-liam',
      username: 'liam_photo',
      email: 'liam@connectly.app',
      name: 'Liam Sterling',
      bio: 'Film photographer | 35mm grain & cinematic portraits 🎞️ Tokyo / London / NYC.',
      website: 'https://liamsterling.com',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-7-chloe',
      username: 'chloe_fit',
      email: 'chloe@connectly.app',
      name: 'Chloe Dubois',
      bio: 'Movement coach & mindful ergonomics 🧘‍♀️ Helping developers maintain healthy posture & mobility.',
      website: 'https://chloemovement.com',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-8-kenji',
      username: 'kenji_design',
      email: 'kenji@connectly.app',
      name: 'Kenji Sato',
      bio: 'Design Systems lead @ Aura Studio. Minimalist typography, micro-interactions, dark UI.',
      website: 'https://kenjisato.io',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-9-zara',
      username: 'zara_tech',
      email: 'zara@connectly.app',
      name: 'Zara Al-Mansoor',
      bio: 'AI researcher & robotics hardware specialist 🤖 Exploring edge AI computing.',
      website: 'https://zaratech.dev',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      is_private: false
    },
    {
      id: 'u-10-admin',
      username: 'connectly_admin',
      email: 'admin@connectly.app',
      name: 'Connectly Official & Moderation',
      bio: 'Official Connectly Platform Operations & Security Team. Keeping the community safe and connected.',
      website: 'https://connectly.app',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      role: 'admin',
      is_private: false
    }
  ];

  for (const u of rawUsers) {
    await query(
      `INSERT INTO users (id, username, email, phone_number, password_hash, dob, role, is_private, is_suspended)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.username, u.email, '+15550192834', passwordHash, '1998-05-15', u.role, u.is_private, false]
    );

    await query(
      `INSERT INTO profiles (id, user_id, display_name, bio, website, avatar_url, followers_count, following_count, posts_count, is_online)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [uuidv4(), u.id, u.name, u.bio, u.website, u.avatar, 342, 184, 12, true]
    );
  }

  // 2. Follow relationships
  const followPairs = [
    ['u-1-elena', 'u-2-marcus'],
    ['u-1-elena', 'u-3-sophia'],
    ['u-1-elena', 'u-5-maya'],
    ['u-2-marcus', 'u-1-elena'],
    ['u-2-marcus', 'u-8-kenji'],
    ['u-3-sophia', 'u-1-elena'],
    ['u-3-sophia', 'u-6-liam'],
    ['u-4-alex', 'u-2-marcus'],
    ['u-5-maya', 'u-1-elena'],
    ['u-6-liam', 'u-3-sophia'],
    ['u-7-chloe', 'u-1-elena'],
    ['u-8-kenji', 'u-2-marcus']
  ];

  for (const [follower, following] of followPairs) {
    await query(
      `INSERT INTO follows (id, follower_id, following_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [uuidv4(), follower, following]
    );
  }

  // 3. Seed 20 Posts with Media, Captions, Hashtags
  const postSpecs = [
    {
      id: 'p-1',
      userId: 'u-1-elena',
      caption: 'Dawn breaking over the Brutalist pavilion. The interplay of raw concrete textures and morning mist is pure serenity. #architecture #brutalism #minimalism #design',
      location: 'Berlin, Germany',
      images: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80'
      ],
      likes: 89,
      comments: 12
    },
    {
      id: 'p-2',
      userId: 'u-2-marcus',
      caption: 'Refactored our real-time messaging pipeline to zero-allocation buffers! Socket latency dropped below 14ms across the board. Speed is a feature. ⚡ #coding #engineering #reactnative',
      location: 'San Francisco, CA',
      images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1080&q=80'],
      likes: 142,
      comments: 24
    },
    {
      id: 'p-3',
      userId: 'u-3-sophia',
      caption: 'Experimenting with chromatic glass spheres in Blender 4.3. The refractive dispersion creates such ethereal reflections. Which tint do you prefer? 🌈 #3d #blender #digitalart',
      location: 'London, UK',
      images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80'],
      likes: 210,
      comments: 31
    },
    {
      id: 'p-4',
      userId: 'u-5-maya',
      caption: 'Camped at 2,400m under an unbroken canopy of stars. Waking up to frost on the tent and hot pour-over coffee. Nothing beats backcountry stillness. ☕🏕️ #adventure #bikepacking #mountains',
      location: 'Dolomites, Italy',
      images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80'],
      likes: 198,
      comments: 18
    },
    {
      id: 'p-5',
      userId: 'u-6-liam',
      caption: 'Streets of Shibuya in neon rain. Shot on Portra 400 pushed two stops. Love the grain structure in the highlights. 🎞️ #tokyo #filmphotography #35mm #street',
      location: 'Shibuya, Tokyo',
      images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1080&q=80'],
      likes: 177,
      comments: 15
    },
    {
      id: 'p-6',
      userId: 'u-8-kenji',
      caption: 'New design token architecture for dark mode interfaces. Focus on high-frequency contrast ratios (WCAG AAA) and comfortable ambient luminance. ✨ #ui #ux #designsystems',
      location: 'Kyoto, Japan',
      images: ['https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1080&q=80'],
      likes: 165,
      comments: 20
    },
    {
      id: 'p-7',
      userId: 'u-4-alex',
      caption: 'Analog patch cables, tape delays, and warm modular oscillators. Capturing ocean wave binaural samples for our upcoming ambient EP. 🌊🎛️ #synth #modular #ambientmusic',
      location: 'Reykjavik, Iceland',
      images: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1080&q=80'],
      likes: 94,
      comments: 8
    },
    {
      id: 'p-8',
      userId: 'u-7-chloe',
      caption: 'Quick 5-minute thoracic spine decompression routine for everyone sitting in office chairs all day! Save this for your mid-afternoon slump. 🧘‍♀️ #wellness #ergonomics #mobility',
      location: 'Paris, France',
      images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1080&q=80'],
      likes: 312,
      comments: 42
    },
    {
      id: 'p-9',
      userId: 'u-9-zara',
      caption: 'First test flight with our autonomous obstacle avoidance drone running lightweight quantized vision models on edge silicon! 🛸 #robotics #ai #hardware',
      location: 'Zurich, Switzerland',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1080&q=80'],
      likes: 245,
      comments: 19
    },
    {
      id: 'p-10',
      userId: 'u-1-elena',
      caption: 'Spiral staircase geometry in Copenhagen. The golden ratio found in architectural flow. 🌀 #copenhagen #architecture #patterns',
      location: 'Copenhagen, Denmark',
      images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80'],
      likes: 128,
      comments: 14
    },
    {
      id: 'p-11',
      userId: 'u-2-marcus',
      caption: 'Dark mode preview of Connectly mobile UI! Notice the gentle purple neon glow on active story rings and smooth haptic feedback. Clean, fast, native. 📱✨ #connectly #mobiledev',
      location: 'San Francisco, CA',
      images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80'],
      likes: 278,
      comments: 36
    },
    {
      id: 'p-12',
      userId: 'u-3-sophia',
      caption: 'Watercolor studies turned into vector illustrations. Combining organic botanical brushstrokes with digital geometry. 🌿🌺 #digitalillustration #vectorart',
      location: 'Bristol, UK',
      images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80'],
      likes: 153,
      comments: 11
    },
    {
      id: 'p-13',
      userId: 'u-5-maya',
      caption: 'Glacial lakes at sunrise. The water was so quiet it looked like polished lapis lazuli. 💙 #nature #wanderlust #landscape',
      location: 'Banff National Park, Canada',
      images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80'],
      likes: 289,
      comments: 22
    },
    {
      id: 'p-14',
      userId: 'u-6-liam',
      caption: 'Backstage jazz club portraits. 1/30s shutter speed capturing smoke and saxophone vibrato. 🎷 #jazz #streetphotography #blackandwhite',
      location: 'Greenwich Village, NYC',
      images: ['https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1080&q=80'],
      likes: 190,
      comments: 16
    },
    {
      id: 'p-15',
      userId: 'u-8-kenji',
      caption: 'Crafting the Connectly custom icon set: stroke balance, optical kerning, and rounded joins for maximum legibility at small sizes. ✏️ #iconography #designsystem',
      location: 'Kyoto, Japan',
      images: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1080&q=80'],
      likes: 201,
      comments: 27
    },
    {
      id: 'p-16',
      userId: 'u-4-alex',
      caption: 'Synthesizing thunderstorm effects using white noise filters, modulated resonance, and tape saturation. ⚡🎧 #sounddesign #synthpatch',
      location: 'Stockholm, Sweden',
      images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1080&q=80'],
      likes: 112,
      comments: 9
    },
    {
      id: 'p-17',
      userId: 'u-7-chloe',
      caption: 'Morning sun salutation sequence on the rooftop. Breath and focus set the tone for the entire creative day. 🌅 #yoga #mindfulness #health',
      location: 'Nice, France',
      images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1080&q=80'],
      likes: 184,
      comments: 13
    },
    {
      id: 'p-18',
      userId: 'u-9-zara',
      caption: 'Custom PCB arrived from fabrication! Surface mount soldering done under microscope. Time to power on and check the voltage rails. 🔬⚡ #electronics #hardware',
      location: 'Lausanne, Switzerland',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1080&q=80'],
      likes: 219,
      comments: 17
    },
    {
      id: 'p-19',
      userId: 'u-1-elena',
      caption: 'Archways of the Alhambra during golden hour. Islamic geometric tilework that has stood for centuries. 🕌🇪🇸 #spain #history #travel',
      location: 'Granada, Spain',
      images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1080&q=80'],
      likes: 230,
      comments: 15
    },
    {
      id: 'p-20',
      userId: 'u-10-admin',
      caption: 'Welcome to Connectly 1.0! 🚀 A next-gen social experience built for authentic community, real-time messaging, and creator freedom. Explore, connect, and inspire.',
      location: 'Connectly HQ',
      images: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80'],
      likes: 540,
      comments: 68
    }
  ];

  for (const p of postSpecs) {
    await query(
      `INSERT INTO posts (id, user_id, caption, location, privacy, likes_count, comments_count, shares_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.userId, p.caption, p.location, 'public', p.likes, p.comments, 14]
    );

    for (let idx = 0; idx < p.images.length; idx++) {
      await query(
        `INSERT INTO post_media (id, post_id, media_url, media_type, thumbnail_url, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [uuidv4(), p.id, p.images[idx], 'image', p.images[idx], idx]
      );
    }

    // Add some sample likes
    await query(
      `INSERT INTO likes (id, user_id, post_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [uuidv4(), 'u-1-elena', p.id]
    );
    await query(
      `INSERT INTO likes (id, user_id, post_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [uuidv4(), 'u-2-marcus', p.id]
    );
  }

  // 4. Seed Comments & Replies
  const sampleComments = [
    { postId: 'p-1', userId: 'u-2-marcus', content: 'Incredible framing Elena! That morning light is magical.' },
    { postId: 'p-1', userId: 'u-8-kenji', content: 'The geometry in the third arch is so satisfying.' },
    { postId: 'p-2', userId: 'u-1-elena', content: '14ms latency is wild! Smooth scrolling in chat makes all the difference.' },
    { postId: 'p-3', userId: 'u-4-alex', content: 'The refractive caustics look so realistic. Did you use Cycles or LuxCore?' },
    { postId: 'p-4', userId: 'u-6-liam', content: 'Nothing beats that mountain air. What sleeping bag rating were you using?' },
    { postId: 'p-11', userId: 'u-3-sophia', content: 'Loving this UI colorway! The purple aurora gradient is gorgeous.' }
  ];

  for (const c of sampleComments) {
    const commentId = uuidv4();
    await query(
      `INSERT INTO comments (id, post_id, user_id, content, likes_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [commentId, c.postId, c.userId, c.content, 4]
    );
  }

  // 5. Seed 10 Active 24-Hour Stories
  const now = new Date();
  const storySpecs = [
    {
      id: 's-1',
      userId: 'u-1-elena',
      caption: 'Catching the sunrise train to Zurich 🚂☕',
      bg: 'linear-gradient(135deg, #6366F1, #EC4899)',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-2',
      userId: 'u-2-marcus',
      caption: 'Late night debugging session powered by yerba mate 🌿⚡',
      bg: 'linear-gradient(135deg, #1E1B4B, #312E81)',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-3',
      userId: 'u-3-sophia',
      caption: 'New 3D shader experiment live in viewport! ✨',
      bg: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-4',
      userId: 'u-5-maya',
      caption: 'Alpine trail waypoint at 2,800m! Look at this ridge 🏔️',
      bg: 'linear-gradient(135deg, #059669, #10B981)',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-5',
      userId: 'u-6-liam',
      caption: 'Developing 120 format black and white negatives in the darkroom 🎞️',
      bg: 'linear-gradient(135deg, #18181B, #3F3F46)',
      image: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-6',
      userId: 'u-8-kenji',
      caption: 'Prototyping fluid gestures for the Story viewer component 📲',
      bg: 'linear-gradient(135deg, #4338CA, #6366F1)',
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-7',
      userId: 'u-4-alex',
      caption: 'Studio monitor acoustic calibration day 🎚️🔊',
      bg: 'linear-gradient(135deg, #831843, #BE185D)',
      image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-8',
      userId: 'u-7-chloe',
      caption: 'Morning stretch challenge: 10 minutes every single day 🤸‍♀️',
      bg: 'linear-gradient(135deg, #D97706, #F59E0B)',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-9',
      userId: 'u-9-zara',
      caption: 'Soldering tiny surface-mount LEDs for our custom cyber badge ✨🔌',
      bg: 'linear-gradient(135deg, #0F766E, #14B8A6)',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 's-10',
      userId: 'u-10-admin',
      caption: 'Community guidelines update: Be respectful, authentic, and creative! 💜',
      bg: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const s of storySpecs) {
    // Expires in 22 hours from now
    const expiresAt = new Date(now.getTime() + 22 * 60 * 60 * 1000).toISOString();
    await query(
      `INSERT INTO stories (id, user_id, caption, background_style, privacy, views_count, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.userId, s.caption, s.bg, 'everyone', 45, expiresAt]
    );

    await query(
      `INSERT INTO story_media (id, story_id, media_url, media_type, duration)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [uuidv4(), s.id, s.image, 'image', 5]
    );

    // Record view
    await query(
      `INSERT INTO story_views (id, story_id, viewer_id, viewed_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [uuidv4(), s.id, 'u-1-elena', now.toISOString()]
    );
  }

  // 6. Seed Conversations (1-on-1 and Group Chat)
  const conv1Id = 'c-1-dm';
  const convGroupId = 'c-2-group';

  // DM between Elena and Marcus
  await query(
    `INSERT INTO conversations (id, is_group, last_message_text, last_message_at)
     VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
    [conv1Id, false, 'The latest UI animations look so smooth!', now.toISOString()]
  );

  await query(
    `INSERT INTO conversation_members (id, conversation_id, user_id, role)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [uuidv4(), conv1Id, 'u-1-elena', 'member']
  );
  await query(
    `INSERT INTO conversation_members (id, conversation_id, user_id, role)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [uuidv4(), conv1Id, 'u-2-marcus', 'member']
  );

  // Group chat: "Connectly Creators Circle"
  await query(
    `INSERT INTO conversations (id, is_group, group_name, group_avatar, created_by, last_message_text, last_message_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
    [
      convGroupId,
      true,
      'Connectly Creators Circle 🎨✨',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
      'u-1-elena',
      'Welcome everyone to the new creator hub!',
      now.toISOString()
    ]
  );

  for (const mId of ['u-1-elena', 'u-2-marcus', 'u-3-sophia', 'u-8-kenji']) {
    await query(
      `INSERT INTO conversation_members (id, conversation_id, user_id, role)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [uuidv4(), convGroupId, mId, mId === 'u-1-elena' ? 'admin' : 'member']
    );
  }

  // Seed sample messages in DM (text, image, voice message with waveform)
  const dmMsgs = [
    {
      id: 'm-1',
      convId: conv1Id,
      senderId: 'u-2-marcus',
      type: 'text',
      content: 'Hey Elena! Did you see the new camera gestures in the Story editor?',
      status: 'read'
    },
    {
      id: 'm-2',
      convId: conv1Id,
      senderId: 'u-1-elena',
      type: 'text',
      content: 'Yes! The hold-to-record and swipe-to-zoom feel super fluid.',
      status: 'read'
    },
    {
      id: 'm-3',
      convId: conv1Id,
      senderId: 'u-2-marcus',
      type: 'voice',
      content: 'Voice note (0:14)',
      mediaUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      voiceDuration: 14,
      voiceWaveform: JSON.stringify([20, 45, 78, 60, 90, 85, 40, 65, 30, 80, 95, 70, 40, 25]),
      status: 'read'
    },
    {
      id: 'm-4',
      convId: conv1Id,
      senderId: 'u-1-elena',
      type: 'text',
      content: 'The latest UI animations look so smooth!',
      status: 'read'
    }
  ];

  for (const m of dmMsgs) {
    await query(
      `INSERT INTO messages (id, conversation_id, sender_id, message_type, content, media_url, voice_duration, voice_waveform, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.convId, m.senderId, m.type, m.content, m.mediaUrl || '', m.voiceDuration || 0, m.voiceWaveform || '', m.status]
    );
  }

  // 7. Seed Notifications
  const notifs = [
    {
      recipientId: 'u-1-elena',
      actorId: 'u-2-marcus',
      type: 'like_post',
      refId: 'p-1',
      refType: 'post',
      message: 'marcus_dev liked your post.'
    },
    {
      recipientId: 'u-1-elena',
      actorId: 'u-3-sophia',
      type: 'comment',
      refId: 'p-1',
      refType: 'post',
      message: 'sophia_art commented: "Incredible framing Elena!"'
    },
    {
      recipientId: 'u-1-elena',
      actorId: 'u-5-maya',
      type: 'follow',
      refId: 'u-5-maya',
      refType: 'user',
      message: 'maya_wanderer started following you.'
    },
    {
      recipientId: 'u-1-elena',
      actorId: 'u-8-kenji',
      type: 'story_reaction',
      refId: 's-1',
      refType: 'story',
      message: 'kenji_design reacted 🔥 to your story.'
    }
  ];

  for (const n of notifs) {
    await query(
      `INSERT INTO notifications (id, recipient_id, actor_id, type, reference_id, reference_type, message, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), n.recipientId, n.actorId, n.type, n.refId, n.refType, n.message, false]
    );
  }

  console.log('[Seed] Database seeded with 10 users, 20 posts, 10 stories, comments, chats, voice notes & notifications.');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('[Seed Error]', err);
    process.exit(1);
  });
}

module.exports = { seed };
