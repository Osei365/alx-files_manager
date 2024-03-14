import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log('Redis client not connected to the server:', err);
    });
  }

  isAlive() {
    let value = true;
    this.client.on('connect', () => {
      value = true;
    })
    return value;
  }

  async get(key) {
    const value = await promisify(this.client.get).bind(this.client)(key);
    return value;
  }

  async set(key, value, dur) {
    await promisify(this.client.setex).bind(this.client)(key, dur, value);
  }

  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

export const redisClient = new RedisClient();
module.exports = redisClient;