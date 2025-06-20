import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Глобальные переменные для кэширования соединения с MongoDB
 * Это помогает избежать создания нового соединения при каждом запросе в режиме разработки
 */
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongoConnection = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Пожалуйста, укажите MONGODB_URI в переменных окружения');
  }

  // В процессе сборки возвращаем заглушку для placeholder URI
  if (MONGODB_URI.includes('placeholder') || MONGODB_URI.includes('0.0.0.0')) {
    console.log('MongoDB: Using placeholder connection during build');
    throw new Error('MongoDB не доступен во время сборки (используется placeholder)');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
export { connectDB as connectToDatabase }; 