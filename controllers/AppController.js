import dbClient from '../utils/db'
import redisClient from '../utils/redis'


class AppController {

    static getStatus(req, res) {
      const status = {
        redis: redisClient.isAlive(),
        db: dbClient.isAlive()
      };
      res.status(200).send(status);
    }

    static async getStats(req, res) {
        const stats = {
            users: await dbClient.nbUsers(),
            files: await dbClient.nbUsers()
        };
        res.status(200).send(stats);
    }
}

module.exports = AppController;