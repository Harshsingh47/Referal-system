import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows local DNS querySrv ECONNREFUSED for MongoDB Atlas
// NEVER run on Vercel/Linux as Lambda blocks outbound UDP port 53 to custom DNS servers!
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (e) {
    // Ignore if custom DNS cannot be set
  }
}

let cachedConnection = null;
let mongoMemoryServerInstance = null;

/**
 * Connect to MongoDB Atlas (with serverless connection caching)
 */
export const connectDB = async () => {
  // If connection is already open and ready, reuse it immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in the process of connecting, wait for it
  if (mongoose.connection.readyState === 2 && cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('<username>') && !uri.includes('username:password')) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas...');
      cachedConnection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      console.log(`[Database] MongoDB Atlas Connected Successfully: ${mongoose.connection.host}`);
      return mongoose.connection;
    } catch (error) {
      console.error(`[Database Error] Failed to connect to MongoDB Atlas: ${error.message}`);
      if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        throw new Error(`MongoDB Atlas connection error: ${error.message}. Please verify MONGODB_URI and ensure 0.0.0.0/0 is added to Atlas Network Access.`);
      }
    }
  } else if (process.env.VERCEL) {
    throw new Error('MONGODB_URI is not configured in Vercel Environment Variables. Please add MONGODB_URI in Vercel Project Settings.');
  }

  // Fallback to in-memory MongoDB ONLY in local development
  try {
    console.log('[Database] Initializing In-Memory MongoDB Server for local dev...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();

    await mongoose.connect(memoryUri, {
      autoIndex: true
    });

    console.log(`[Database] In-Memory MongoDB Connected at: ${memoryUri}`);
    return mongoose.connection;
  } catch (memError) {
    console.error(`[Database Error] In-Memory MongoDB failed: ${memError.message}`);
    throw memError;
  }
};

// Graceful connection closure
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
    }
    console.log('[Database] MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
});
