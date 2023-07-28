import { MongoClient } from "mongodb";
// Replace the uri string with your connection string.
const uri = process.env.MongoDB;
const client = new MongoClient(uri!);
const database = client.db("applications");
const appCol = database.collection("applications");
const taskCol = database.collection("tasks");

import Client from "@elastic/search-application-client";
// or through CDN
// const Client = window['SearchApplicationClient']

const elastic = Client(
  "spark",
  "https://ea24e050fde54fe8aa6dd69dd8205846.us-central1.gcp.cloud.es.io:443",
  "S0ZYcG5Ja0JDSm51dWFwUkNfTmU6Q2RSTk9RRnVTRy16azlLYWZqM0FRdw==",
  {
    search_fields: ["title", "description"],
  },
);

async function procedure() {
  const results = await elastic().query("spark").search();

  console.log(results);
}

//procedure();

export { appCol, taskCol };
