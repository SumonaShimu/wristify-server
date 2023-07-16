const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

//connect mongo
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7omvjfn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // client.connect((err) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    // });
    const watchCollection = client.db('watchCollection').collection('watches');


    //get all watches
    app.get('/allwatches', async (req, res) => {
      const cursor = watchCollection.find().limit(20);
      const result = await cursor.toArray();
      res.send(result);
    })
    //get a watch by id
    app.get('/watch/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const options = {

      };

      const result = await watchCollection.findOne(query, options);
      res.send(result);
    })
    // Create index for watch name 
    const indexKeys = { name: 1 };
    const indexOptions = { name: "nameIndex" };
    const result = await watchCollection.createIndex(indexKeys, indexOptions);

    app.get('/search/:text', async (req, res) => {
      const text = req.params.text;
      const result = await watchCollection
        .find({
          name: { $regex: text, $options: "i" }
        }).toArray();

      res.send(result);
    });

    //get mywatches
    app.get('/mywatches', async (req, res) => {
      let query = {};
      console.log(req.query.email)
      if (req.query?.email) {
        query = {
          sellerEmail: req.query.email
        }
      }
      const result = await watchCollection.find(query).sort({ "price": 1 }).toArray();
      res.send(result);
    })
    //post
    app.post('/addwatch', async (req, res) => {
      const addedwatch = req.body;
      console.log(addedwatch);
      const result = await watchCollection.insertOne(addedwatch);
      res.send(result);
    });
    //update
    app.patch('/watch/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedwatch = req.body;
      console.log(updatedwatch);
      const updatedDoc = {
        $set: {
          ...updatedwatch
        }
      }

      const result = await watchCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
    //delete
    app.delete('/watch/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await watchCollection.deleteOne(query);
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('wristify running')
})

app.listen(port, () => {
  console.log(`wristify Server is running on port ${port}`)
})


