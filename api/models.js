import { GoogleGenerativeAI } from "@google/generative-ai";

const { rateLimiter } = require('../utils/rateLimit');
const { withLogging } = require('../utils/withLogging');

export default async function handler(request, response) {
  return withLogging(async (req, res) => {
    if (!rateLimiter(req, res)) return; // response handled inside
    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.status(500).json({ error: "No API key" });
    }
    const apiKeys = rawApiKey.split(',').map(k => k.trim()).filter(Boolean);
    if (apiKeys.length === 0) {
      return res.status(500).json({ error: "No API key" });
    }
    const apiKey = apiKeys[0];
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const data = await fetch(url).then(r => r.json());
    return res.status(200).json({ models: data.models });
  })(request, response);
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return response.status(500).json({ error: "No API key" });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    return response.status(200).json({ models: data.models });
  } catch (err) {
    return response.status(500).json({ error: err.message });
  }
}
