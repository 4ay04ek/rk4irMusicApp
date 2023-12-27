import { AppDataSource } from "./data-source";
import * as express from "express";
import * as multer from "multer";
import * as fs from "fs";
import { User } from "./entity/User";
import { Playlist } from "./entity/Playlist";
import { Track } from "./entity/Track";
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./static/`);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9) + "";
    cb(null, uniqueSuffix);
  },
});
const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    cb(null, file.mimetype.startsWith("image"));
  },
}).single("file");

app.use(express.json({ limit: 10 * 1024 * 1024 }));
app.use(express.static("static"));

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MusicApp API",
    version: "1.0.0",
  },
};

const options = {
  swaggerDefinition,
  apis: ["src/index.ts"],
  servers: [
    {
      url: "http://localhost:3000",
      description: "Main server",
    },
  ],
};

const swaggerSpec = swaggerJSDoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /file:
 *   post:
 *     summary: Handles file upload and relocation based on the specified scope in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to be uploaded
 *               scope:
 *                 type: string
 *                 enum: [user, playlist]
 *                 description: Specifies the scope ('user' or 'playlist')
 *     responses:
 *       '200':
 *         description: Returns path to file in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scope:
 *                   type: string
 *                   description: Specifies the scope ('user' or 'playlist')
 *                 id:
 *                   type: string
 *                   description: id of created file
 */
app.post("/file", upload, (req, res) => {
  if (!req.file) return res.sendStatus(403);

  let path = req.body.scope;
  if (path !== "user" && path !== "playlist") {
    fs.rm(`./static/${req.file.filename}`, () => {});
    return res.sendStatus(403);
  }
  fs.rename(
    `./static/${req.file.filename}`,
    `./static/${path}/${req.file.filename}.${req.file.mimetype.split("/")[1]}`,
    () => {}
  );
  res.json({
    scope: path,
    id: req.file.filename,
  });
});

/**
 * @openapi
 * /file/remove:
 *   post:
 *     summary: Handles removal of a file based on the specified scope and file ID provided in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID of the file to be removed
 *     responses:
 *       '200':
 *         description: File removal successful
 *       '404':
 *         description: File with the provided ID not found
 */
app.post("/file/remove", (req, res) => {
  let path = req.body.scope;
  if (path !== "user" && path !== "playlist") return res.sendStatus(403);
  if (!req.body.id) return res.sendStatus(403);
  fs.rm(`./static/${path}/${req.body.id}`, () => {});
  res.sendStatus(200);
});

/**
 * @openapi
 * /auth:
 *   post:
 *     summary: Endpoint to handle user authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 description: User login
 *               password:
 *                 type: string
 *                 description: User password
 *     responses:
 *       '200':
 *         description: Authentication successful
 *       '400':
 *         description: Invalid input or missing fields
 */
app.post("/auth", (req, res) => {
  let { login, password } = req.body;
  if (!login || !password) return res.sendStatus(403);
  AppDataSource.getRepository(User)
    .findBy({
      login,
      password,
    })
    .then((r) => {
      if (!r.length) res.sendStatus(401);
      else res.send(r[0].id + "");
    });
});

/**
 * @openapi
 * /user:
 *   get:
 *     summary: Endpoint to retrieve user information by ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: User information retrieved successfully
 *       '404':
 *         description: User with the provided ID not found
 */
app.get("/user", (req, res) => {
  let { id } = req.query;
  if (!id) return res.sendStatus(403);
  AppDataSource.getRepository(User)
    .findOneBy({
      id: parseInt(id.toString()),
    })
    .then((r) => {
      res.send(
        r
          ? {
              username: r.username,
              avatar: r.avatar,
            }
          : 404
      );
    });
});

/**
 * @openapi
 * /user/playlists:
 *   get:
 *     summary: Retrieves playlists associated with a user based on the provided user ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       '200':
 *         description: Sends user's playlists
 *       '403':
 *         description: ID is missing (Forbidden)
 */
app.get("/user/playlists", async (req, res) => {
  let { id } = req.query;
  if (!id) return res.sendStatus(403);
  let user = await AppDataSource.getRepository(User).findOne({
    where: {
      id: parseInt(id.toString()),
    },
    relations: {
      playlists: true,
    },
  });
  res.send(user ? user.playlists : 404);
});

/**
 * @openapi
 * /user/playlists/add:
 *   post:
 *     summary: Adds a playlist to a user's list based on user ID and playlist ID provided in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               playlistId:
 *                 type: string
 *                 description: Playlist ID
 *     responses:
 *       '200':
 *         description: Successfully added playlist to user's list
 *       '403':
 *         description: userId or playlistId is missing (Forbidden)
 */
app.post("/user/playlists/add", async (req, res) => {
  let { userId, playlistId } = req.body;
  if (!userId || !playlistId) res.sendStatus(403);
  let user = await AppDataSource.getRepository(User).findOne({
    where: {
      id: userId,
    },
    relations: {
      playlists: true,
    },
  });
  let playlist = await AppDataSource.getRepository(Playlist).findOneBy({
    id: playlistId,
  });
  if (!user) return res.sendStatus(404);
  user.playlists ??= [];
  user.playlists.push(playlist);
  AppDataSource.getRepository(User).save(user);
  res.sendStatus(200);
});

/**
 * @openapi
 * /user/playlists/remove:
 *   post:
 *     summary: Removes a playlist from a user's list based on user ID and playlist ID provided in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               playlistId:
 *                 type: string
 *                 description: Playlist ID
 *     responses:
 *       '200':
 *         description: Successfully removed playlist from user's list
 *       '403':
 *         description: userId or playlistId is missing (Forbidden)
 */
app.post("/user/playlists/remove", async (req, res) => {
  let { userId, playlistId } = req.body;
  if (!userId || !playlistId) res.sendStatus(403);
  let user = await AppDataSource.getRepository(User).findOne({
    where: {
      id: userId,
    },
    relations: {
      playlists: true,
    },
  });
  if (!user) return res.sendStatus(404);
  user.playlists ??= [];
  user.playlists = user.playlists.filter((p) => p.id !== playlistId);
  AppDataSource.getRepository(User).save(user);
  res.sendStatus(200);
});

/**
 * @openapi
 * /user:
 *   post:
 *     summary: Handler for creating a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 description: User's login
 *               password:
 *                 type: string
 *                 description: User's password
 *               username:
 *                 type: string
 *                 description: User's username
 *               avatar:
 *                 type: string
 *                 description: User's avatar
 *     responses:
 *       '200':
 *         description: Sends status 200 with the new user's ID if successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: New user's ID
 *       '403':
 *         description: login, password, or username is missing (Forbidden)
 */
app.post("/user", (req, res) => {
  let { login, password, username, avatar } = req.body;
  if (!login || !password || !username) return res.sendStatus(403);
  AppDataSource.getRepository(User)
    .save({
      login,
      password,
      username,
      avatar,
    })
    .then((r) => {
      res.send(r.id + "");
    });
});

/**
 * @openapi
 * /playlist:
 *   post:
 *     summary: Handler for creating a new playlist.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the playlist
 *               thumbnail:
 *                 type: string
 *                 description: URL of the playlist thumbnail
 *               private:
 *                 type: boolean
 *                 description: Indicates if the playlist is private (optional)
 *     responses:
 *       '200':
 *         description: Sends status 200 with the new playlist's ID if successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playlistId:
 *                   type: string
 *                   description: New playlist's ID
 *       '403':
 *         description: title or thumbnail is missing (Forbidden)
 */
app.post("/playlist", (req, res) => {
  let { title, thumbnail } = req.body;
  let p = req.body["private"];
  if (!title || !thumbnail) return res.sendStatus(403);
  AppDataSource.getRepository(Playlist)
    .save({
      title,
      thumbnail,
      private: p,
    })
    .then((r) => {
      res.send(r.id + "");
    });
});

/**
 * @openapi
 * /playlist/add:
 *   post:
 *     summary: Adds a track to a playlist based on the URL and playlist ID provided in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL of the track to be added to the playlist
 *               playlistId:
 *                 type: string
 *                 description: ID of the playlist to which the track will be added
 *     responses:
 *       '200':
 *         description: Successfully added track to the playlist
 *       '403':
 *         description: url or playlistId is missing (Forbidden)
 */
app.post("/playlist/add", async (req, res) => {
  let { url, playlistId } = req.body;
  if (!url || !playlistId) return res.sendStatus(403);
  let track = await AppDataSource.getRepository(Track).save({
    url,
  });
  let playlist = await AppDataSource.getRepository(Playlist).findOne({
    where: {
      id: playlistId,
    },
    relations: {
      tracks: true,
    },
  });
  if (!playlist) return res.sendStatus(404);
  playlist.tracks ??= [];
  playlist.tracks.push(track);
  AppDataSource.getRepository(Playlist).save(playlist);
  res.sendStatus(200);
});

/**
 * @openapi
 * /playlist/remove:
 *   post:
 *     summary: Removes a track from a playlist based on track ID and playlist ID provided in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackId:
 *                 type: string
 *                 description: ID of the track to removed added from the playlist
 *               playlistId:
 *                 type: string
 *                 description: ID of the playlist to which the track will be added
 *     responses:
 *       '200':
 *         description: Successfully removed track from the playlist
 *       '403':
 *         description: trackId or playlistId is missing (Forbidden)
 */
app.post("/playlist/remove", async (req, res) => {
  let { playlistId, trackId } = req.body;
  if (!trackId || !playlistId) return res.sendStatus(403);
  let playlist = await AppDataSource.getRepository(Playlist).findOne({
    where: {
      id: playlistId,
    },
    relations: {
      tracks: true,
    },
  });
  if (!playlist) return res.sendStatus(404);
  playlist.tracks = playlist.tracks.filter((t) => t.id !== trackId);
  AppDataSource.getRepository(Playlist).save(playlist);
  res.sendStatus(200);
});

/**
 * @openapi
 * /playlist/drop:
 *   post:
 *     summary: Removes a playlist by its ID from the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playlistId:
 *                 type: string
 *                 description: The ID of the playlist to be removed
 *     responses:
 *       '200':
 *         description: Successfully removed the playlist from the system
 *       '403':
 *         description: playlistId is missing (Forbidden)
 */
app.post("/playlist/drop", async (req, res) => {
  let { playlistId } = req.body;
  if (!playlistId) return res.sendStatus(403);
  await AppDataSource.getRepository(Playlist).delete(playlistId);
  res.sendStatus(200);
});

/**
 * @openapi
 * /playlist:
 *   get:
 *     summary: Retrieves a playlist by its ID.
 *     parameters:
 *       - in: query
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the playlist to retrieve
 *     responses:
 *       '200':
 *         description: Sends the retrieved playlist if successful
 *       '403':
 *         description: playlistId is missing (Forbidden)
 */
app.get("/playlist", async (req, res) => {
  let { playlistId } = req.query;
  if (!playlistId) return res.sendStatus(403);
  let playlist = await AppDataSource.getRepository(Playlist).findOne({
    where: {
      id: parseInt(playlistId.toString()),
    },
    relations: {
      tracks: true,
    },
  });
  res.send(playlist || 404);
});

/**
 * @openapi
 * /playlist/search:
 *   get:
 *     summary: Searches from a playlists with query.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search string
 *     responses:
 *       '200':
 *         description: Sends the retrieved playlists if successful
 *       '403':
 *         description: q is missing (Forbidden)
 */
app.get("/playlist/search", async (req, res) => {
  let { q } = req.query;
  if (!q || q.toString().includes("'")) return res.sendStatus(403);
  let playlist = await AppDataSource.getRepository(Playlist)
    .createQueryBuilder("playlist")
    .where(`playlist.title LIKE '%${q}%' AND playlist.private = false`)
    .execute();
  res.send(playlist);
});

app.listen(3000, async () => {
  await AppDataSource.initialize();
  console.log("Server is listening on port 3000");
});
