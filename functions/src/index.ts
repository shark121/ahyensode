import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
const cors = require("cors");

admin.initializeApp();
const corsHandler = cors({ origin: true });

export const proxyImage = onRequest({ cors: true }, (req, res) => {
  // Use cors middleware to forcefully set headers if needed,
  // though v2 config {cors: true} often handles preflight automatically.
  corsHandler(req, res, async () => {
    try {
      const imagePath = req.query.path as string;

      if (!imagePath) {
        res.status(400).send("Missing 'path' query parameter.");
        return;
      }

      logger.info(`Proxying image request for path: ${imagePath}`);

      const bucket = admin.storage().bucket();
      const file = bucket.file(imagePath);

      const [exists] = await file.exists();
      if (!exists) {
        logger.warn(`File not found: ${imagePath}`);
        res.status(404).send("Image not found.");
        return;
      }

      // Get file metadata to set the correct content type
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType || "application/octet-stream";

      // Explicitly set CORS and Content headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, s-maxage=31536000",
      );

      // Pipe the file data directly to the client
      const readStream = file.createReadStream();

      // Handle stream errors
      readStream.on("error", (err) => {
        logger.error(`Error streaming file ${imagePath}:`, err);
        if (!res.headersSent) {
          res.status(500).send("Error fetching image from storage.");
        }
      });

      readStream.pipe(res);
    } catch (error) {
      logger.error("Error processing proxy request:", error);
      if (!res.headersSent) {
        res.status(500).send("Internal Server Error.");
      }
    }
  });
});
