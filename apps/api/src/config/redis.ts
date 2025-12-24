import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({ url: redisUrl });
export const redisSubscriber = createClient({ url: redisUrl });
export const redisPublisher = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisSubscriber.on('error', (err) => console.log('Redis Subscriber Error', err));
redisPublisher.on('error', (err) => console.log('Redis Publisher Error', err));

export const connectRedis = async () => {
    await redisClient.connect();
    await redisSubscriber.connect();
    await redisPublisher.connect();
    console.log('Connected to Redis');
};
