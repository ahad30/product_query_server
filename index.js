const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://solosphere.web.app',
  ],
  credentials: true,
  optionSuccessStatus: 200,
}


// middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser())


// verify jwt middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      console.log(decoded)

      req.user = decoded
      next()
    })
  }
}


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

    const productQueryCollection = client.db('productQueriesDB').collection('productQuery');
    const SubcategoryCollection = client.db('artCraftSubcategoryDB').collection('artCraftSubcategory');


    // jwt generate
    app.post('/jwt', async (req, res) => {    
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    // Clear token on logout
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true })
    })




    app.get('/getSingleQuery', async (req , res) => {
      try {
        const cursor = productQueryCollection.find();
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
        const result = await productQueryCollection.findOne(query);
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })



    app.get("/myArtCraft/:email", async (req, res) => {
    try {
      console.log(req.params.email);
      const result = await productQueryCollection.find({ userEmail: req.params.email }).toArray();
        console.log(result)
        res.send(result)
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }

    })

    

    app.post('/addSingleQuery', async (req, res) => {
      try {
        const newProduct = req.body;
        console.log(newProduct);
        const result = await productQueryCollection.insertOne(newProduct);
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

      const result = await productQueryCollection.updateOne(filter, item, options);
      res.send(result);
  })

    app.delete('/deleteItem/:id', async (req, res) => {
   try{
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await productQueryCollection.deleteOne(query);
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
  res.send('Akeneo server')
})

app.listen(port, () => {
  console.log(`Akeneo Server is running on port: ${port}`)
})