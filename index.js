const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qxclpw1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const artCraftCollection = client.db('artCraftDB').collection('artCraft');
    const SubcategoryCollection = client.db('artCraftSubcategoryDB').collection('artCraftSubcategory');



    app.get('/artCraft', async (req , res) => {
      try {
        const cursor = artCraftCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })


    app.get('/artCraft/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await artCraftCollection.findOne(query);
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })



    app.get("/myArtCraft/:email", async (req, res) => {
    try {
      console.log(req.params.email);
      const result = await artCraftCollection.find({ userEmail: req.params.email }).toArray();
        console.log(result)
        res.send(result)
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }

    })

        

    app.post('/addArtCraftItem', async (req, res) => {
      try {
        const newArtCraft = req.body;
        console.log(newArtCraft);
        const result = await artCraftCollection.insertOne(newArtCraft);
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })


    app.put('/updateItem/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedItem = req.body;   
      const item = {
          $set: {
            image: updatedItem.image,
            itemName: updatedItem.itemName,
            subcategoryName: updatedItem.subcategoryName,
            shortDescription: updatedItem.shortDescription,
            price: updatedItem.price,
            rating: updatedItem.rating,
            customization: updatedItem.customization,
            processingTime: updatedItem.processingTime,
            stockStatus: updatedItem.stockStatus
          }
      }

      const result = await artCraftCollection.updateOne(filter, item, options);
      res.send(result);
  })

    app.delete('/deleteItem/:id', async (req, res) => {
   try{
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await artCraftCollection.deleteOne(query);
    res.send(result);
   }
   catch (error) {
    res.status(500).send({ message: "some thing went wrong" })
  }
  })


// Art & Craft SubCategory Section

app.get('/artCraftSubcategory', async (req , res) => {
  try {
    const cursor = SubcategoryCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  }
  catch (error) {
    res.status(500).send({ message: "some thing went wrong" })
  }
})                    


  app.get('/artCraftSubcategory/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await SubcategoryCollection.findOne(query);
      res.send(result);
    }
    catch (error) {
      res.status(500).send({ message: "some thing went wrong" })
    }
  })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

 
app.get('/', (req, res) => {
  res.send('Art and Craft server')
})

app.listen(port, () => {
  console.log(`Art & Craft Server is running on port: ${port}`)
})