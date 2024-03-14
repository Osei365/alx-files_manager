import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';


class AuthController {
    static async getConnect(req, res) {
      const authorization = req.header('Authorization') || '';
      console.log(authorization);

      const details = authorization.split(' ')[1];

      const decodedDetails = Buffer.from(details, 'base64').toString(
        'utf-8',
      );
      console.log(decodedDetails);

      const email = decodedDetails.split(':')[0];
      const password = decodedDetails.split(':')[1];
      console.log(email, password);

      if (!email || !password) return res.status(401).send({error: 'Unauthorized'})

      const sha1Password = sha1(password);

      const user = await dbClient.db.collection('users').findOne({
        email,
        password: sha1Password
      });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      const token = uuidv4();
      const key = `auth_${token}`;

      await redisClient.set(key, user._id.toString(), 24 * 3600);
      return res.status(200).send({token});


    }

    static async getDisconnect(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      const _id = await redisClient.get(key);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})

      await redisClient.del(key);

      return res.status(204).send();

    }
}

module.exports = AuthController;