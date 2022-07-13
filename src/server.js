const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());
const port = 8000;

const withDb = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to bd", error });
    console.log(error);
  }
};

app.get("/", (req, res) => res.send("Hello World!"));
app.post("/hello", (req, res) => {
  res.send(`Hello ${req.body.name}!`);
  console.log(req.body.name);
});

app.get("/api/articles/:name", async (req, res) => {
  // try {
  //   const articleName = req.params.name;
  //   const client = await MongoClient.connect("mongodb://localhost:27017", {
  //     useNewUrlParser: true,
  //   });
  //   const db = client.db("blog");
  //   const articleInfo = await db
  //     .collection("articles")
  //     .findOne({ name: articleName });
  //   res.status(200).json(articleInfo);
  //   client.close();
  // } catch (error) {
  //   res.status(500).json({ message: "Error connecting to bd", error });
  //   console.log(error);
  // }
  withDb(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDb(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { upvotes: articleInfo.upvotes + 1 } }
      );
    const newArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(newArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;

  withDb(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { comments: articleInfo.comments.concat({ username, text }) } }
      );
    const newArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(newArticleInfo);
  }, res);
});

app.get("*", (re, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
