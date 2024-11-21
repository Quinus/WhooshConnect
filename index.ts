import {GarminConnect} from "garmin-connect";
import {UploadFileType} from "garmin-connect/dist/garmin/types";
import {homedir} from 'os';

import chokidar from 'chokidar';

let garminConnect: GarminConnect | undefined = undefined;
try {
    garminConnect = new GarminConnect({
        username: process.env.GARMIN_USER_NAME ?? "",
        password: process.env.GARMIN_PASSWORD ?? "",
    });
    await garminConnect.login()
    const profile = await garminConnect.getUserProfile()
    console.log(`logged in as ${profile.userName}`)
} catch (e) {
    console.error("error creating garmin connect client", e);
}

const folderPath = `${homedir()}/${process.env.FOLDER_PATH}`;

if (garminConnect) {
    chokidar
        .watch(folderPath)
        .on('add', (filePath) => {
            console.log(`new file detected ${filePath}`);
            if (filePath && filePath.endsWith('.fit')) {
                uploadToGarmin(filePath);
            }
        });

    console.log("🚴‍⬆️️⌚️ WhooshConnect is running...");
    console.log(`watching folder ${folderPath}`);
}

function uploadToGarmin(filename: string) {
    console.log(`Uploading ${filename} to Garmin Connect`);
    garminConnect?.uploadActivity(
        filename,
        UploadFileType.fit
    ).then(() => {
        console.log(`Successfully uploaded ${filename}`);
    }).catch((e) => {
        console.error(`Error uploading ${filename} to Garmin Connect`, e);
    });
}
