const express = require("express");
const localtunnel = require("localtunnel");

const app = express();
const port = 3000;

const RaspiCam = require("raspicam");
const vision = require("@google-cloud/vision");

const { Storage } = require("@google-cloud/storage");
const bucketName = "safetify-photos";

async function start() {
  return new Promise((resolve, reject) => {
    const photoPath = `./photos/IMG_${new Date().toISOString()}.jpg`;
    const options = {
      mode: "photo",
      output: photoPath,
      log: console.log,
    };
    const storage = new Storage();
    const Camera = new RaspiCam(options);

    Camera.start();

    Camera.on("read", async function (err, timestamp, filename) {
      const client = new vision.ImageAnnotatorClient();
      const [result] = await client.faceDetection(photoPath);
      const faces = result.faceAnnotations;
      console.log("faces", faces);
      if (faces.length > 0) {
        const uploadedPhoto = await storage
          .bucket(bucketName)
          .upload(photoPath, {
            gzip: true,
            metadata: {
              cacheControl: "public, max-age=31536000",
            },
          });
        console.log("uploadedPhoto", uploadedPhoto);
        resolve({ message: "Found people", photo: uploadedPhoto });
      } else {
        console.log("Not Found");
        resolve({ message: "No one at home" });
      }
    });
  });
}

app.get("/", function (req, res) {
  console.log("/");
  res.send("Home");
});

app.get("/ring", async function (req, res) {
  const photo = await start();
  res.send(photo);
});

app.listen(port, async () => {
  const tunnel = await localtunnel({ port: 3000, subdomain: "safetify-api" });
  console.log(`Listening at http://localhost:${port} and tunnel ${tunnel.url}`);
});
