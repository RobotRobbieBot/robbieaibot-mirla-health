/**
 * llmService.js — unified LLM router
 *
 * USE_LOCAL_LLM=true  → Ollama (LOCAL_LLM_MODEL, default qwen3.6:latest)
 * USE_LOCAL_LLM=false → Claude API (CLAUDE_API_KEY)
 *
 * Vision calls (images/scanned PDFs) always go to Claude regardless of flag.
 * If Ollama fails, automatically falls back to Claude.
 */

const axios    = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const USE_LOCAL   = process.env.USE_LOCAL_LLM   === 'true';
const LOCAL_MODEL = process.env.LOCAL_LLM_MODEL || 'qwen3.6:latest';
const OLLAMA_BASE = process.env.OLLAMA_URL       || 'http://localhost:11434';
const CLOUD_MODEL = process.env.CLAUDE_MODEL     || 'claude-opus-4-7';

function getAnthropicClient() {
  const key = process.env.CLAUDE_API_KEY;
  if (!key || key === 'your_claude_api_key_here') return null;
  return new Anthropic({ apiKey: key });
}

/**
 * Send a chat message to the configured LLM.
 *
 * @param {string}        system      - System prompt
 * @param {string|Array}  userContent - User message (string for text, Array for vision)
 * @param {Object}        opts
 * @param {number}        opts.maxTokens  - Max tokens in response (default 2000)
 * @param {boolean}       opts.forceCloud - Skip Ollama, always use Claude (use for vision)
 * @returns {Promise<string>} The model's text response
 */
async function chat(system, userContent, { maxTokens = 2000, forceCloud = false } = {}) {
  const isText = typeof userContent === 'string';

  // ── Local (Ollama) path ────────────────────────────────────────────────
  if (USE_LOCAL && !forceCloud && isText) {
    try {
      const res = await axios.post(
        `${OLLAMA_BASE}/v1/chat/completions`,
        {
          model: LOCAL_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user',   content: userContent }
          ],
          stream: false
        },
        { timeout: 300000 }   // 5 min — large models can be slow on first run
      );
      const text = res.data.choices[0].message.content;
      console.log(`[llm] local (${LOCAL_MODEL}) responded (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn(`[llm] Ollama failed — ${err.message} — falling back to Claude`);
      // Fall through to Claude
    }
  }

  // ── Cloud (Claude) path ────────────────────────────────────────────────
  const client = getAnthropicClient();
  if (!client) {
    throw new Error(
      'No LLM available — set USE_LOCAL_LLM=true in .env or add a valid CLAUDE_API_KEY'
    );
  }

  const res = await client.messages.create({
    model:      CLOUD_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userContent }]
  });

  const text = res.content[0].text;
  console.log(`[llm] cloud (${CLOUD_MODEL}) responded (${text.length} chars)`);
  return text;
}

/**
 * Multi-turn chat (for conversation history like chatWithAgent).
 * Passes history as the full messages array rather than a single user turn.
 *
 * @param {string}   system   - System prompt
 * @param {Array}    messages - Full [{role, content}] array incl. history
 * @param {Object}   opts
 * @returns {Promise<string>}
 */
async function chatWithHistory(system, messages, { maxTokens = 8000, forceCloud = false } = {}) {
  const lastContent = messages[messages.length - 1]?.content;
  const isText = typeof lastContent === 'string';

  // ── Local path ─────────────────────────────────────────────────────────
  if (USE_LOCAL && !forceCloud && isText) {
    try {
      const withSystem = [{ role: 'system', content: system }, ...messages];
      const res = await axios.post(
        `${OLLAMA_BASE}/v1/chat/completions`,
        { model: LOCAL_MODEL, messages: withSystem, stream: false },
        { timeout: 300000 }
      );
      const text = res.data.choices[0].message.content;
      console.log(`[llm] local (${LOCAL_MODEL}) chat responded (${text.length} chars)`);
      return text;
    } catch (err) {
      console.warn(`[llm] Ollama failed — ${err.message} — falling back to Claude`);
    }
  }

  // ── Cloud path ─────────────────────────────────────────────────────────
  const client = getAnthropicClient();
  if (!client) throw new Error('No LLM available');

  const res = await client.messages.create({
    model: CLOUD_MODEL, max_tokens: maxTokens, system, messages
  });
  return res.content[0].text;
}

module.exports = { chat, chatWithHistory, USE_LOCAL, LOCAL_MODEL };
