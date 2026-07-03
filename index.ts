import { GarminUploader } from "./lib/GarminUploader.ts";
import { FileWatcher } from "./lib/FileWatcher.ts";
import { homedir } from "os";
import { logger } from "./lib/Logger.ts";

async function main() {
  const requiredEnvVars = ["GARMIN_USER_NAME", "GARMIN_PASSWORD", "FOLDER_PATH"];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1);
  }

  try {
    const uploader = new GarminUploader(
      process.env.GARMIN_USER_NAME!,
      process.env.GARMIN_PASSWORD!,
    );
    await uploader.initialize();

    new FileWatcher(`${homedir()}/${process.env.FOLDER_PATH!}`)
      .start()
      .on("fitFileDetected", async (filePath) => {
        try {
          await uploader.uploadFile(filePath);
        } catch (error) {
          logger.error({ err: error }, "Upload failed");
        }
      })
      .on("error", (error) => {
        logger.error({ err: error }, "Watcher encountered an error");
      });

    logger.info("🚴‍⬆️️⌚️ WhooshConnect is running...");
  } catch (error) {
    logger.error({ err: error }, "Error in initialization");
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Unhandled error in main application");
  process.exit(1);
});
