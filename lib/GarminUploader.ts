import {GarminConnect} from "garmin-connect";
import winston from "winston";
import {Logger} from "./Logger.ts";
import {type ISocialProfile, UploadFileType} from "garmin-connect/dist/garmin/types";

export class GarminUploader {
    private garminConnect: GarminConnect | undefined = undefined;
    private logger: winston.Logger = Logger.getInstance();

    private readonly userName: string;
    private readonly password: string;

    constructor(userName: string, password: string) {
        this.userName = userName;
        this.password = password;
    }

    public async initialize(): Promise<void> {
        try {
            this.garminConnect = new GarminConnect({
                username: this.userName,
                password: this.password,
            });
            await this.garminConnect.login();

            const profile: ISocialProfile = await this.garminConnect.getUserProfile();
            this.logger.info(`Garmin Connect logged in as ${profile.userName}`);
        } catch (error) {
            this.logger.error("error creating garmin client", error);
            throw error;
        }
    }

    public async uploadFile(filePath: string): Promise<void> {
        if (!this.garminConnect) {
            throw new Error("Garmin client not initialized");
        }
        try {
            this.logger.info(`Uploading ${filePath} to Garmin Connect`);
            await this.garminConnect.uploadActivity(filePath, UploadFileType.fit);

            this.logger.info(`Successfully uploaded ${filePath}`);
        } catch (error) {
            this.logger.error(`Error uploading file ${filePath}`, error);
            throw error;
        }
    }
}
