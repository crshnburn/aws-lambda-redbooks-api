import { MongoClient } from 'mongodb'
import * as fs from 'fs';
import * as path from 'path'
import * as tls from 'tls'

let cachedDb = null;

function connectToDatabase() {
    if (cachedDb) {
        return Promise.resolve(cachedDb);
    }
    
    let caBundle = fs.readFileSync(path.resolve(process.env.LAMBDA_TASK_ROOT, "./global-bundle.pem"));
    const secureContext = tls.createSecureContext({
      ca: caBundle
    });
    let user = process.env.MONGODB_USER;
    let password = process.env.MONGODB_PASSWORD;
    let url = process.env.MONGODB_URL;

    return MongoClient.connect(
        `mongodb://${user}:${password}@${url}`,
        { tls: true, secureContext }
    ).then(db => {
        cachedDb = db;
        return cachedDb;
    });
}

export const handler = async (event) => {
  var client = await connectToDatabase()
  var db = client.db("test")
  var collection = db.collection("collection")
  let title = event.pathParameters.title
  console.log('Looking for book with title ' + title)
  let book = await collection.findOne({title: title})
  delete book._id
  const response = {
    statusCode: 200,
    body: JSON.stringify(book),
  };
  return response;
};
