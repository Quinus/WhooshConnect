import {Logger} from "./lib/Logger.ts";
import {GarminUploader} from "./lib/GarminUploader.ts";
import {FileWatcher} from "./lib/FileWatcher.ts";
import winston from "winston";
import {homedir} from "os";

async function main() {
    const logger = Logger.getInstance();

    const requiredEnvVars = ['GARMIN_USER_NAME', 'GARMIN_PASSWORD', 'FOLDER_PATH'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }

    try {
        const uploader = new GarminUploader(
            process.env.GARMIN_USER_NAME!,
            process.env.GARMIN_PASSWORD!
        );
        await uploader.initialize();

        new FileWatcher(`${homedir()}/${process.env.FOLDER_PATH!}`)
            .start()
            .on('fitFileDetected', async (filePath) => {
                try {
                    await uploader.uploadFile(filePath);
                } catch (e) {
                    logger.error("Upload failed", e);
                }
            })
            .on('error', (error) => {
                logger.error('Watcher encountered an error', error);
            });

        logger.info("🚴‍⬆️️⌚️ WhooshConnect is running...");
    } catch (err) {
        logger.error(`Error in initialization`, err);
        process.exit(1);
    }
}

main().catch((error) => {
    const logger: winston.Logger = Logger.getInstance();
    logger.error('Unhandled error in main application', error);
    process.exit(1);
});
