import {MongoClient} from 'mongodb';


// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'family';

export async function write(coll, data) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const insertResult = await collection.insertOne(data);
  console.log('Inserted document =>', insertResult);

  return 'done.';
}

