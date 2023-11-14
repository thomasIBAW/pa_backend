import {MongoClient} from 'mongodb';


// Connection URL
// const url = 'mongodb://admin:mdcpassword@10.10.0.153:27017';
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

  return insertResult;
}

export async function findAll(coll) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const findResult = await collection.find({}).sort({dateTimeStart:1}).project({_id:0}).toArray();
  console.log('Found documents =>', findResult);

  return findResult;
}

export async function findOne(coll, uuid) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const findResult = await collection.find({uuid:uuid}).sort({dateTimeStart:1}).project({_id:0}).toArray();
  console.log('Found document =>', findResult);

  return findResult;
}

export async function patchOne(coll, uuid, data) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const updateResult = await collection.updateOne({ uuid: uuid }, { $set: data });
  console.log('Updated document =>', updateResult);

  return updateResult;
}

export async function deleteOne(coll, uuid) {

  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(coll);

  const deleteResult = await collection.deleteOne({ uuid: uuid });
  console.log('Deleted document =>', deleteResult);


  return deleteResult;
}