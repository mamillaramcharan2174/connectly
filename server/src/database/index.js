const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let pool = null;
let isEmbedded = false;

// Embedded In-Memory / File Persistent Relational Store for zero-config fallback
class EmbeddedDatabase {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.tables = {
      users: [],
      profiles: [],
      follows: [],
      follow_requests: [],
      posts: [],
      post_media: [],
      likes: [],
      comments: [],
      comment_likes: [],
      saved_posts: [],
      stories: [],
      story_media: [],
      story_views: [],
      story_reactions: [],
      conversations: [],
      conversation_members: [],
      messages: [],
      message_reactions: [],
      notifications: [],
      reports: [],
      blocked_users: [],
      muted_users: [],
      close_friends: [],
      hashtags: [],
      post_hashtags: [],
      mentions: [],
      sessions: []
    };
    this.load();
  }

  load() {
    if (this.storagePath && fs.existsSync(this.storagePath)) {
      try {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const parsed = JSON.parse(raw);
        for (const key of Object.keys(this.tables)) {
          if (parsed[key]) this.tables[key] = parsed[key];
        }
      } catch (err) {
        console.warn('[DB Engine] Warning loading local database file, starting clean:', err.message);
      }
    }
  }

  save() {
    if (this.storagePath) {
      try {
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.storagePath, JSON.stringify(this.tables, null, 2), 'utf8');
      } catch (err) {
        console.error('[DB Engine] Failed to save database file:', err.message);
      }
    }
  }

  // Simplified SQL parser/executor covering standard CRUD operations with $1, $2 placeholders
  async query(sqlText, params = []) {
    const rawSql = sqlText.trim();
    const cleanSql = rawSql.replace(/\s+/g, ' ');

    // Normalize param placeholders from $1, $2 to array lookup
    const resolveParam = (token) => {
      const match = token.match(/\$(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        return params[idx];
      }
      if (token.startsWith("'") && token.endsWith("'")) return token.slice(1, -1);
      if (token.toLowerCase() === 'null') return null;
      if (token.toLowerCase() === 'true') return true;
      if (token.toLowerCase() === 'false') return false;
      if (!isNaN(token)) return Number(token);
      return token;
    };

    // --- INSERT INTO ---
    if (/^INSERT INTO/i.test(cleanSql)) {
      const match = cleanSql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(?:\s*ON CONFLICT.*)?(?:\s*RETURNING\s+(.+))?/i);
      if (!match) throw new Error(`[DB Engine] Could not parse INSERT: ${cleanSql}`);
      const tableName = match[1].toLowerCase();
      const columns = match[2].split(',').map(c => c.trim().toLowerCase());
      const valuesTokens = match[3].split(',').map(v => v.trim());

      if (!this.tables[tableName]) this.tables[tableName] = [];

      const newRow = {};
      columns.forEach((col, idx) => {
        newRow[col] = resolveParam(valuesTokens[idx]);
      });
      if (!newRow.id) newRow.id = uuidv4();
      if (!newRow.created_at) newRow.created_at = new Date().toISOString();
      if (newRow.updated_at === undefined && columns.includes('updated_at')) newRow.updated_at = new Date().toISOString();

      // Check ON CONFLICT
      if (/ON CONFLICT/i.test(cleanSql)) {
        // Simple deduplication for unique combinations
        const existingIdx = this.tables[tableName].findIndex(r => {
          if (tableName === 'likes') return r.user_id === newRow.user_id && r.post_id === newRow.post_id;
          if (tableName === 'follows') return r.follower_id === newRow.follower_id && r.following_id === newRow.following_id;
          if (tableName === 'saved_posts') return r.user_id === newRow.user_id && r.post_id === newRow.post_id;
          if (tableName === 'story_views') return r.story_id === newRow.story_id && r.viewer_id === newRow.viewer_id;
          if (tableName === 'story_reactions') return r.story_id === newRow.story_id && r.user_id === newRow.user_id && r.emoji === newRow.emoji;
          if (tableName === 'blocked_users') return r.blocker_id === newRow.blocker_id && r.blocked_id === newRow.blocked_id;
          if (tableName === 'close_friends') return r.user_id === newRow.user_id && r.friend_id === newRow.friend_id;
          return r.id === newRow.id;
        });
        if (existingIdx !== -1) {
          return { rows: [this.tables[tableName][existingIdx]], rowCount: 1 };
        }
      }

      // Apply default values for boolean flags if not specified
      if (tableName === 'posts') {
        if (newRow.is_deleted === undefined) newRow.is_deleted = false;
        if (newRow.is_archived === undefined) newRow.is_archived = false;
      }
      if (tableName === 'stories') {
        if (newRow.is_deleted === undefined) newRow.is_deleted = false;
      }
      if (tableName === 'users') {
        if (newRow.is_suspended === undefined) newRow.is_suspended = false;
        if (newRow.is_private === undefined) newRow.is_private = false;
      }

      this.tables[tableName].push(newRow);
      this.save();
      return { rows: [newRow], rowCount: 1 };
    }


    // --- SELECT ---
    if (/^SELECT/i.test(cleanSql)) {
      return this._executeSelect(cleanSql, params);
    }

    // --- UPDATE ---
    if (/^UPDATE/i.test(cleanSql)) {
      const match = cleanSql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+RETURNING\s+(.+))?$/i);
      if (!match) throw new Error(`[DB Engine] Could not parse UPDATE: ${cleanSql}`);
      const tableName = match[1].toLowerCase();
      const setClause = match[2];
      const whereClause = match[3];

      if (!this.tables[tableName]) return { rows: [], rowCount: 0 };

      // Parse SET assignments
      const assignments = setClause.split(',').map(s => s.trim());
      const updatedRows = [];

      this.tables[tableName] = this.tables[tableName].map(row => {
        if (this._evaluateWhere(row, whereClause, params)) {
          const updated = { ...row };
          assignments.forEach(assign => {
            const [c, valStr] = assign.split('=').map(x => x.trim());
            const col = c.toLowerCase();
            if (valStr.includes('+ 1')) {
              updated[col] = (Number(updated[col]) || 0) + 1;
            } else if (valStr.includes('- 1')) {
              updated[col] = Math.max(0, (Number(updated[col]) || 0) - 1);
            } else {
              updated[col] = resolveParam(valStr);
            }
          });
          if ('updated_at' in updated) updated.updated_at = new Date().toISOString();
          updatedRows.push(updated);
          return updated;
        }
        return row;
      });

      this.save();
      return { rows: updatedRows, rowCount: updatedRows.length };
    }

    // --- DELETE FROM ---
    if (/^DELETE FROM/i.test(cleanSql)) {
      const match = cleanSql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+RETURNING\s+(.+))?$/i);
      if (!match) throw new Error(`[DB Engine] Could not parse DELETE: ${cleanSql}`);
      const tableName = match[1].toLowerCase();
      const whereClause = match[2];

      if (!this.tables[tableName]) return { rows: [], rowCount: 0 };

      const initialCount = this.tables[tableName].length;
      const deletedRows = [];
      this.tables[tableName] = this.tables[tableName].filter(row => {
        if (this._evaluateWhere(row, whereClause, params)) {
          deletedRows.push(row);
          return false;
        }
        return true;
      });

      this.save();
      return { rows: deletedRows, rowCount: initialCount - this.tables[tableName].length };
    }

    // Pass through DDL or CREATE TABLE without error
    if (/^(CREATE|ALTER|DROP|TRUNCATE)/i.test(cleanSql)) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }

  _evaluateWhere(row, whereClause, params) {
    if (!whereClause) return true;

    // Handle compound expressions
    const conditions = whereClause.split(/\s+AND\s+/i);
    return conditions.every(cond => {
      const trimmed = cond.trim();
      if (!trimmed) return true;

      // Handle OR within parens or simple OR
      if (trimmed.includes(' OR ')) {
        const orParts = trimmed.replace(/^\(|\)$/g, '').split(/\s+OR\s+/i);
        return orParts.some(p => this._evaluateSingleCondition(row, p.trim(), params));
      }

      return this._evaluateSingleCondition(row, trimmed, params);
    });
  }

  _evaluateSingleCondition(row, cond, params) {
    // Check equality =
    let m = cond.match(/^([\w\.]+)\s*=\s*(.+)$/);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      const val = this._resolveVal(m[2].trim(), params);
      const rowVal = row[field];
      if (typeof val === 'boolean') {
        return Boolean(rowVal) === val;
      }
      return String(rowVal) === String(val);
    }

    // Check != or <>
    m = cond.match(/^([\w\.]+)\s*(?:!=|<>)\s*(.+)$/);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      const val = this._resolveVal(m[2].trim(), params);
      const rowVal = row[field];
      if (typeof val === 'boolean') {
        return Boolean(rowVal) !== val;
      }
      return String(rowVal) !== String(val);
    }


    // Check >
    m = cond.match(/^([\w\.]+)\s*>\s*(.+)$/);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      const val = this._resolveVal(m[2].trim(), params);
      return new Date(row[field]).getTime() > new Date(val).getTime();
    }

    // Check <
    m = cond.match(/^([\w\.]+)\s*<\s*(.+)$/);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      const val = this._resolveVal(m[2].trim(), params);
      return new Date(row[field]).getTime() < new Date(val).getTime();
    }

    // Check IS NULL / IS NOT NULL
    m = cond.match(/^([\w\.]+)\s+IS\s+NOT\s+NULL$/i);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      return row[field] !== null && row[field] !== undefined;
    }
    m = cond.match(/^([\w\.]+)\s+IS\s+NULL$/i);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      return row[field] === null || row[field] === undefined;
    }

    // Check ILIKE / LIKE
    m = cond.match(/^([\w\.]+)\s+(?:ILIKE|LIKE)\s+(.+)$/i);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      let pattern = this._resolveVal(m[2].trim(), params);
      if (typeof pattern === 'string') {
        const regexStr = pattern.replace(/%/g, '.*').replace(/_/g, '.');
        return new RegExp(regexStr, 'i').test(String(row[field] || ''));
      }
      return false;
    }

    // Check IN (...)
    m = cond.match(/^([\w\.]+)\s+IN\s*\(([^)]+)\)$/i);
    if (m) {
      const field = m[1].includes('.') ? m[1].split('.')[1].toLowerCase() : m[1].toLowerCase();
      const items = m[2].split(',').map(s => this._resolveVal(s.trim(), params));
      return items.includes(row[field]);
    }

    return true;
  }

  _resolveVal(token, params) {
    const match = token.match(/\$(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      return params[idx];
    }
    if (token.startsWith("'") && token.endsWith("'")) return token.slice(1, -1);
    if (token.toLowerCase() === 'null') return null;
    if (token.toLowerCase() === 'true') return true;
    if (token.toLowerCase() === 'false') return false;
    if (!isNaN(token)) return Number(token);
    return token;
  }

  _executeSelect(sql, params) {
    // Extract main table
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return { rows: [], rowCount: 0 };
    const mainTable = fromMatch[1].toLowerCase();

    let rows = (this.tables[mainTable] || []).map(r => {
      const row = { ...r };
      // Join enrichment for common tables in embedded mode
      if (mainTable === 'posts' || mainTable === 'stories' || mainTable === 'comments' || mainTable === 'messages') {
        const uId = r.user_id || r.sender_id;
        const user = (this.tables['users'] || []).find(u => u.id === uId) || {};
        const profile = (this.tables['profiles'] || []).find(pr => pr.user_id === uId) || {};
        row.username = user.username || '';
        row.is_suspended = user.is_suspended || false;
        row.display_name = profile.display_name || '';
        row.avatar_url = profile.avatar_url || '';
        row.is_online = profile.is_online || false;
        row.last_seen_at = profile.last_seen_at || '';
      }
      if (mainTable === 'conversation_members') {
        const user = (this.tables['users'] || []).find(u => u.id === r.user_id) || {};
        const profile = (this.tables['profiles'] || []).find(pr => pr.user_id === r.user_id) || {};
        const conv = (this.tables['conversations'] || []).find(c => c.id === r.conversation_id) || {};
        row.username = user.username || '';
        row.display_name = profile.display_name || '';
        row.avatar_url = profile.avatar_url || '';
        row.is_online = profile.is_online || false;
        row.last_seen_at = profile.last_seen_at || '';
        row.is_group = conv.is_group || false;
        row.group_name = conv.group_name || '';
        row.group_avatar = conv.group_avatar || '';
        row.last_message_text = conv.last_message_text || '';
        row.last_message_at = conv.last_message_at || '';
      }
      return row;
    });


    // Extract WHERE
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER BY|\s+LIMIT|\s+GROUP BY|$)/i);
    if (whereMatch) {
      rows = rows.filter(row => this._evaluateWhere(row, whereMatch[1], params));
    }

    // Extract ORDER BY
    const orderMatch = sql.match(/ORDER BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const field = orderMatch[1].toLowerCase();
      const dir = (orderMatch[2] || 'ASC').toUpperCase();
      rows.sort((a, b) => {
        let va = a[field];
        let vb = b[field];
        if (typeof va === 'string' && (va.includes('T') || !isNaN(Date.parse(va)))) {
          va = new Date(va).getTime();
          vb = new Date(vb).getTime();
        }
        if (va < vb) return dir === 'ASC' ? -1 : 1;
        if (va > vb) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Extract LIMIT / OFFSET
    const limitMatch = sql.match(/LIMIT\s+(\$?\d+)/i);
    const offsetMatch = sql.match(/OFFSET\s+(\$?\d+)/i);

    if (offsetMatch) {
      const offset = Number(this._resolveVal(offsetMatch[1], params)) || 0;
      rows = rows.slice(offset);
    }
    if (limitMatch) {
      const limit = Number(this._resolveVal(limitMatch[1], params)) || 100;
      rows = rows.slice(0, limit);
    }

    return { rows, rowCount: rows.length };
  }
}

// Database Connection Factory
function getDb() {
  if (pool) return pool;

  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.startsWith('postgres')) {
    console.log('[DB] Connecting to PostgreSQL Cluster via pg.Pool...');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    isEmbedded = false;
  } else {
    console.log('[DB] Running Embedded Persistent Relational Database Engine (zero-config mode)');
    const dbPath = path.join(__dirname, '..', '..', 'data', 'connectly.db.json');
    pool = new EmbeddedDatabase(dbPath);
    isEmbedded = true;
  }

  return pool;
}

module.exports = {
  getDb,
  query: (text, params) => getDb().query(text, params),
  isEmbedded: () => isEmbedded
};
