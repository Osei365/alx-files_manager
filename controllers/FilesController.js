import dbClient from '../utils/db';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

const path = process.env.FOLDER_PATH || '/tmp/files_manager';
class FilesController {
    static async postUpload(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      let _id = await redisClient.get(key);
      _id = ObjectId(_id);
      console.log(_id);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})
      
      const user = await dbClient.db.collection('users').findOne({ _id });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      const { name, type, parentId = 0, isPublic = false, data } = req.body

      const allowedTypes = ['folder', 'file', 'image'];
      if (!name) return res.status(400).send({error: 'Missing name'})
      if (!type || !allowedTypes.includes(type) ) return res.status(400).return({error: 'Missing type'})

      if (!data && type !== 'folder') return res.status(400).send({error: 'Missing data'})
      const newParentId = ObjectId(parentId);
      const file = await dbClient.db.collection('files').findOne({_id: newParentId})

      if (parentId !== 0) {
        if (!file) return res.status(400).send({error: 'Parent not found'})
        if (file.type !== 'folder') return res.status(400).send({error: 'Parent is not a folder'})
      }
      

      const new_file = {
        userId: user._id,
        name: name,
        type,
        isPublic,
        parentId
      }

      if (type !== 'folder') {
        const decodeData = Buffer.from(data, 'base64');
        const filename = uuidv4()
        const new_path = `${path}/${filename}`;
        new_file.localPath = new_path;
        try {
            await fsPromises.mkdir(path, { recursive: true });
            await fsPromises.writeFile(new_path, decodeData);
        } catch (err) {
            return res.status(400).send({error: err.message});
        }
      }

      const result = await dbClient.db.collection('files').insertOne(new_file);

      delete new_file.localPath;
      delete new_file._id;

      const final = {id: result.insertedId, ...new_file};

      return res.status(201).send(final);
    }

    static async getShow(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      let _id = await redisClient.get(key);
      _id = ObjectId(_id);
      console.log(_id);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})
      
      const user = await dbClient.db.collection('users').findOne({ _id });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      const file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(req.params.id),
        userId: _id
      })

      if (!file) return res.status(404).send({error: 'Not found'})

      return res.status(200).send(file)
    }

    static async getIndex(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      let _id = await redisClient.get(key);
      _id = ObjectId(_id);
      console.log(_id);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})
      
      const user = await dbClient.db.collection('users').findOne({ _id });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      let parentId = req.query.parentId || '0';
      const page =  Number(req.query.page) || 0;
      if (parentId === '0') parentId = 0
      if (parentId !== 0) {
        const result = await dbClient.db.collection('files').findOne({
            _id: ObjectId(parentId)
        })
        console.log(result);
        if (!result) {
            return res.status(200).send([])
        }
      }
      
      

      const files = await dbClient.db.collection('files').aggregate([
        {$match: { parentId } },
        {$sort: {order_number: -1 } },
        {$skip: page * 20 },
        {$limit: 20 } 
      ]).toArray();

      return res.status(200).send(files);

    }

    static async putPublish(req, res) {
      const token = req.header('X-Token');
      const key = `auth_${token}`;

      let _id = await redisClient.get(key);
      _id = ObjectId(_id);
      console.log(_id);

      if (!_id) return res.status(401).send({error: 'Unauthorized'})
      
      const user = await dbClient.db.collection('users').findOne({ _id });

      if (!user) return res.status(401).send({error: 'Unauthorized'})

      let file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(req.params.id),
        userId: _id
      })

      if (!file) return res.status(404).send({error: 'Not found'})

      const result = await dbClient.db.collection('files').updateOne(
        {
            _id: file._id,
            userId: _id,
        },
        {
            $set: {
                isPublic: true
              }
        }
      );

      file = await dbClient.db.collection('files').findOne({
        _id: ObjectId(req.params.id),
        userId: _id
      })
      return res.status(200).send(file);
    }

    static async putUnpublish(req, res) {
        const token = req.header('X-Token');
        const key = `auth_${token}`;
  
        let _id = await redisClient.get(key);
        _id = ObjectId(_id);
        console.log(_id);
  
        if (!_id) return res.status(401).send({error: 'Unauthorized'})
        
        const user = await dbClient.db.collection('users').findOne({ _id });
  
        if (!user) return res.status(401).send({error: 'Unauthorized'})
  
        let file = await dbClient.db.collection('files').findOne({
          _id: ObjectId(req.params.id),
          userId: _id
        })
  
        if (!file) return res.status(404).send({error: 'Not found'})
  
        const result = await dbClient.db.collection('files').updateOne(
          {
              _id: file._id,
              userId: _id,
          },
          {
              $set: {
                  isPublic: false
                }
          }
        );
        file = await dbClient.db.collection('files').findOne({
            _id: ObjectId(req.params.id),
            userId: _id
        })
        return res.status(200).send(file);
      }
}

module.exports = FilesController; 