const RaspiCam = require("raspicam");
const vision = require("@google-cloud/vision");

async function start() {
  const photoPath = `./photos/IMG_${new Date().toISOString()}.jpg`;
  const options = {
    mode: "photo",
    output: photoPath,
    log: console.log,
  };

  const Camera = new RaspiCam(options);

  Camera.start();
  // Imports the Google Cloud client library

  Camera.on("read", async function (err, timestamp, filename) {
    console.log("onRead", filename);
    // Creates a client
    const client = new vision.ImageAnnotatorClient();

    // Performs label detection on the image file
    const [result] = await client.labelDetection(photoPath);
    const labels = result.labelAnnotations;
    console.log("Labels:");
    labels.forEach((label) => console.log(label.description));
  });
}

start();
