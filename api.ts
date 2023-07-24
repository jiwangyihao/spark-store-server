import { MongoClient } from "mongodb";
// Replace the uri string with your connection string.
const uri = process.env.MongoDB;
const client = new MongoClient(uri!);
const database = client.db("applications");
const collection = database.collection("applications");
async function run() {
  try {
    // Query for a movie that has the title 'Back to the Future'
    const query = { Name: "网易云音乐" };
    const application = await collection.findOne(query);
    console.log(application);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
//run().catch(console.dir);

export default collection;
