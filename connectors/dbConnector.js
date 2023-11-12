import {MongoClient} from 'mongodb';


// Connection URL
const url = 'mongodb://admin:mdcpassword@10.10.0.153:27017';
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

export async function findAll(coll) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const findResult = await collection.find({}).sort({dateTimeStart:1}).project({subject:1,dateTimeStart:1, uuid:1}).toArray();
  console.log('Found documents =>', findResult);

  return findResult;
}

export async function findOne(coll, uuid) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const findResult = await collection.find({uuid:uuid}).sort({dateTimeStart:1}).project({subject:1,dateTimeStart:1}).toArray();
  console.log('Found document =>', findResult);

  return findResult;
}
