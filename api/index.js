import app from '../backend/src/app.js';
import { connectDB } from '../backend/src/config/db.js';

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless DB Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }

  return app(req, res);
}
