import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.json());

const withDB = async (operation, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017");
    const db = client.db("react-blog");

    await operation(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting database", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const name = req.params.name;
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: name });
    res.status(200).json(articlesInfo);
  }, res);
});

app.post("/api/articles/:name/upvotes", async (req, res) => {
  withDB(async (db) => {
    const name = req.params.name;

    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: name });
    await db.collection("articles").updateOne(
      { name: name },
      {
        $set: {
          upvotes: articlesInfo.upvotes + 1,
        },
      }
    );
    const updatedArticlesInfo = await db
      .collection("articles")
      .findOne({ name: name });
    res.status(200).json(updatedArticlesInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on Port 8000"));
