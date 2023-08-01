import { MongoClient } from "mongodb";
// Replace the uri string with your connection string.
const uri = process.env.MongoDB;
const mongo = new MongoClient(uri!);
const database = mongo.db("applications");
const appCol = database.collection("applications");
const taskCol = database.collection("tasks");

import { Client } from "@elastic/elasticsearch";

const elastic = new Client({
  cloud: {
    id: "My_deployment:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGVhMjRlMDUwZmRlNTRmZThhYTZkZDY5ZGQ4MjA1ODQ2JDg3NTY1ZmQ5NTY5ZDRlOGZiNWNhZGM5OTdiZTEwZTg5",
  },
  auth: {
    username: "elastic",
    password: process.env.elastic!,
  },
});

export { appCol, taskCol, elastic };
