


//JUST ADDED Needs to be completely reworked!! Not to be used now

//used to initialize the DB on the first run, specially to create needed indexes


import 'dotenv/config'
import { MongoClient, ServerApiVersion } from "mongodb";

const url = process.env.mongo_connection || 'mongodb://db:27017';

const client = new MongoClient(url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }})

console.log('Going to create connection to: ', url)


async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db().command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const db = client.db()
        const users = db.collection('users')
        const family = db.collection('family')
        const people = db.collection('people')
        const tags = db.collection('tags')
        const calendar = db.collection('calendar')

        
        console.log('Cleaning DB...')
        if (await users.countDocuments() > 0) await users.drop()
        if (await family.countDocuments() > 0) await family.drop()
        if (await people.countDocuments() > 0) await people.drop()
        if (await tags.countDocuments() > 0) await tags.drop()
        if (await calendar.countDocuments() > 0) await calendar.drop()
        
        // console.log('Start inserting Data...')
        // const res = await collection.insertMany(issuesDB)
        // console.log('Result of insert is: '+ JSON.stringify(res.insertedIds))
        
        const count = await users.countDocuments()
        console.log('Entered Data: ', count)
        
        console.log('Creating Indexes ....')
        await users.createIndex({uuid:1}, {unique:true})
        await family.createIndex({uuid:1}, {unique:true})
        await tags.createIndex({uuid:1}, {unique:true})
        await people.createIndex({uuid:1}, {unique:true})
        await appointments.createIndex({uuid:1}, {unique:true})
        // await users.createIndex({:1})
        // await users.createIndex({owner:1})
        // await users.createIndex({created:1})
        
        // const indexes = await users.indexes()
        // console.log(indexes)

        // await counters.insertOne({_id: 'issues', current: count})
        
    }
    catch{ (err) => {console.log('New Error Received', err)}
       
    } 
    finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch((err) => {console.log('New Error Received', err)});

// client.connect( function(err, client) {
    //     if (err) console.log("error", err)
    //     console.log('connected...')


// })
