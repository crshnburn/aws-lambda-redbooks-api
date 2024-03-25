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
  if (event["queryStringParameters"] != null && event["queryStringParameters"]['author'] != null) {
    let author = event["queryStringParameters"]['author']
    let books = await collection.find({"authors": author}).toArray();
    if (books.length == 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({message: "No Redbooks located for author " + author +"."})
      }
    } else {
      const response = {
        statusCode: 200,
        body: JSON.stringify(books.map(book => {delete book._id; return book})),
      };
    return response;
    }
  } else {
    let allBooks = await collection.find({}).toArray()
    return {
      statusCode: 200,
      body: JSON.stringify(allBooks.map(book => {delete book._id; return book}))
    }
  }
};