import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

class UsersController {

    static async postUsers(req, res) {
      const { email, password } = req.body;

      if (!email) {return res.status(400).send({error: 'Missing email'})}

      if (!password) return res.status(400).send({error: 'Missing password'})

      const emailExists = await dbClient.db.collection('users').findOne({ email });

      if (emailExists) return res.status(400).send({error: 'Already exist'})

      const sha1Password = sha1(password);

      let result;

      try {
        result = await dbClient.db.collection('users').insertOne({
            email,
            password: sha1Password
        });
      } catch (err) {
        return res.status(500).send({ error: 'Error creating user.' });
      }

      const user = {
        id: result.insertedId,
        email,
      };
      return res.status(201).send(user);

    }

    static async getMe(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      let _id = await redisClient.get(key);
      _id = ObjectId(_id);
      console.log(_id);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})
      
      const user = await dbClient.db.collection('users').findOne({ _id });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      return res.status(200).send({id: user._id, email: user.email});
    }
}

module.exports = UsersController;