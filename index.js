require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3015;

const fs = require("fs");

const SpotifyWebApi = require("spotify-web-api-node");

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});
// console.log(process.env.CLIENT_ID);
// Retrieve an access token
spotifyApi
  .clientCredentialsGrant()
  .then((data) => spotifyApi.setAccessToken(data.body["access_token"]))
  .catch((error) =>
    console.log("Something went wrong when retrieving an access token", error)
  );

// --------------------------------------------------
// Serving static files
app.use(express.static("public"));

// --------------------------------------------------
// Parsing Form
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --------------------------------------------------
// Set Templates engine
app.set("view engine", "ejs");

// --------------- Home ---------------
app.get("/", (req, res) => {
  res.status(200).render("home", {
    title: "Home",
  });
});

// --------------- SearchResults ---------------

app.get("/artist-search", (req, res) => {
  console.log(req.query);

  spotifyApi
    .searchArtists(req.query.q)
    .then((data) => {
      // console.log(data.body);
      let artistsList = data.body.artists.items;

      // ----------write to file----------
      fs.writeFileSync("db/Artists.json", JSON.stringify(artistsList));

      // ----------render----------
      res.status(200).render("searchResults", {
        title: "Search",
        data: artistsList,
        search: req.query.q,
      });
    })
    .catch((err) =>
      console.log("The error while searching artists occurred: ", err)
    );
});

app.get("/albums/:artistId", (req, res, next) => {
  let artistId = req.params.artistId;
  // let artistId = req.url.substring(req.url.lastIndexOf("/") + 1);
  console.log(artistId);

  spotifyApi
    .getArtist(artistId)
    .then((artistData) => {
      // console.log(artistData.body);
      let artistName = artistData.body.name;

      spotifyApi
        .getArtistAlbums(artistId)
        .then((data) => {
          // console.log(data.body);
          let artistAlbums = data.body.items;

          // ----------write to file----------
          fs.writeFileSync("db/Albums.json", JSON.stringify(artistAlbums));

          // ----------render----------
          res.status(200).render("albums", {
            title: artistName,
            data: artistAlbums,
          });
        })
        .catch((err) =>
          console.log("The error while checking albums occurred: ", err)
        );
    })
    .catch((err) =>
      console.log("The error while checking artist occurred: ", err)
    );
});

app.get("/tracks/:albumId", (req, res, next) => {
  let albumId = req.params.albumId;
  // let albumId = req.url.substring(req.url.lastIndexOf("/") + 1);
  console.log(albumId);

  spotifyApi
    .getAlbum(albumId)
    .then((albumData) => {
      // console.log(albumData.body);
      let albumName = albumData.body.name;
      let albumImages = albumData.body.images;

      spotifyApi
        .getAlbumTracks(albumId)
        .then((data) => {
          // console.log(data.body);
          let albumTracks = data.body.items;

          // ----------write to file----------
          fs.writeFileSync("db/Tracks.json", JSON.stringify(albumTracks));

          // ----------render----------
          res.status(200).render("tracks", {
            title: albumName,
            data: albumTracks,
            images: albumImages,
          });
        })
        .catch((err) =>
          console.log("The error while checking tracks occurred: ", err)
        );
    })
    .catch((err) =>
      console.log("The error while checking album occurred: ", err)
    );
});

// --------------------------------------------------
// Render 404-Page

app.use((req, res) => {
  res.render("404", { title: "404" });
});

// --------------------------------------------------
// Set Listening Port

app.listen(PORT, (req, res) => {
  console.log(`server listening at http://localhost:${PORT}`);
});
