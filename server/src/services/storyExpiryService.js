const { query } = require('../database');

/**
 * Story Expiration Service
 * Enforces requirement:
 * - Story expires automatically after 24 hours
 * - Automatically hide expired stories
 */
class StoryExpiryService {
  constructor(intervalMs = 60000) {
    this.intervalMs = intervalMs;
    this.timer = null;
  }

  start() {
    console.log('[Story Expiry Service] Started monitoring 24h stories expiration...');
    this.timer = setInterval(() => this.purgeExpiredStories(), this.intervalMs);
    // Initial run
    this.purgeExpiredStories();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async purgeExpiredStories() {
    try {
      const now = new Date().toISOString();
      const res = await query(
        `UPDATE stories 
         SET is_deleted = TRUE 
         WHERE expires_at < $1 AND is_deleted = FALSE 
         RETURNING id`,
        [now]
      );
      if (res.rows && res.rows.length > 0) {
        console.log(`[Story Expiry Service] Automatically expired ${res.rows.length} stories.`);
      }
    } catch (err) {
      console.error('[Story Expiry Service Error]', err.message);
    }
  }
}

module.exports = new StoryExpiryService();
