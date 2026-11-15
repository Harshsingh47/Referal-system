import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows / ISP local DNS querySrv ECONNREFUSED for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

let mongoMemoryServerInstance = null;

/**
 * Connect to MongoDB Atlas (or in-memory fallback in dev)
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('<username>') && !uri.includes('username:password')) {
    try {
      console.log('[Database] Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      console.log(`[Database] MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[Database Error] Failed to connect to MongoDB Atlas: ${error.message}`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }

  // Fallback to MongoMemoryServer in development if no valid external Atlas URI is provided or fails
  try {
    console.log('[Database] Initializing In-Memory MongoDB Server for development/testing...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();

    const conn = await mongoose.connect(memoryUri, {
      autoIndex: true
    });

    console.log(`[Database] In-Memory MongoDB Connected at: ${memoryUri}`);
    return conn;
  } catch (memError) {
    console.error(`[Database Error] In-Memory MongoDB initialization failed: ${memError.message}`);
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
