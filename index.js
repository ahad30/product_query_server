const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://assignment-11-ahad.netlify.app",
    "https://ahad-product-query.web.app",
    "https://ahad-product-query.firebaseapp.com",
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
  console.log(req?.cookies)
  const token = req?.cookies?.token
  console.log(token)
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(403).send({ message: 'unauthorized access' })
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
    const recommendQueryCollection = client.db('productQueriesDB').collection('recommendQuery');



    // jwt generate
    app.post('/jwt', async (req, res) => {
      const email = req.body
      console.log(email)
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
      const user = req.body;
      console.log('logging out', user);
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true })
    })




    // app.get('/getSingleQuery', async (req, res) => {
    //   try {
    //     const cursor = productQueryCollection.find().sort({ _id: -1 });
    //     const result = await cursor.toArray();
    //     res.send(result);
    //   }
    //   catch (error) {
    //     res.status(500).send({ message: "some thing went wrong" })
    //   }
    // })

     
    app.get('/getSingleQuery', async (req, res) => {
 
      const sort = req.query.sort
      const search = req.query.search
      console.log(search);

      let query = {
        itemName: { $regex: search, $options: 'i' },
      }
      let options = {}
      if (sort) options = { sort: { deadline: sort === 'asc' ? 1 : -1 } }
      const result = await productQueryCollection.find(query, options).toArray()

      res.send(result)
  })


    app.get('/queryDetails/:id', async (req, res) => {
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



    app.get("/mySingleQuery/:email",verifyToken, async (req, res) => {
      try {
        // const tokenEmail = req.user.email
        const email = req.params.email
        // if (tokenEmail !== email) {
        //   return res.status(403).send({ message: 'forbidden access' })
        // }              
        const result = await productQueryCollection.find({ 'posterInfo.userEmail': email }).sort({ _id:-1}).toArray();
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
        const result = await productQueryCollection.insertOne({ ...newProduct, recommended: [] });
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })


    app.put('/updateQueryItem/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedItem = req.body;
      const item = {
        $set: {
          ...updatedItem
        }
      }

      const result = await productQueryCollection.updateOne(filter, item, options);
      res.send(result);
    })

    app.delete('/deleteQueryItem/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await productQueryCollection.deleteOne(query);
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })


    // Recommend Section

    app.get('/recommendQuery', async (req, res) => {
      try {

        const cursor = recommendQueryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      }
      catch (error) {
        res.status(500).send({ message: "some thing went wrong" })
      }
    })








    

    // Save recommend data in db
    app.post('/addRecommend', async (req, res) => {
      const recommendationData = req.body
      console.log(recommendationData)
      // check if its a duplicate request
      // const query = {
      //   email: recommendationData.email,
      //   jobId: recommendationData.jobId,
      // }
      // const alreadyApplied = await recommendQueryCollection.findOne(query)
      // console.log(alreadyApplied)
      // if (alreadyApplied) {
      //   return res
      //     .status(400)
      //     .send('You have already placed a bid on this job.')
      // }

      const result = await recommendQueryCollection.insertOne(recommendationData)

      // update recommend count in productQuery collection
      // const updateDoc = {
      //   $inc: { recommendation_count: 1 },
      // }
      // const jobQuery = { _id: new ObjectId(recommendationData.queryId) }
      // const updateBidCount = await productQueryCollection.updateOne(jobQuery, updateDoc)
      // console.log(updateBidCount)
      res.send(result)
    })


    app.put('/addComment/:id', async (req, res) => {
      const id = req.params.id;
      const recommendationData = req.body;

      try {
        const result = await productQueryCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { recommended: recommendationData } }
        );

        console.log(result);
        res.send({ result: result });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'An error occurred while adding the comment.' });
      }
    });



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