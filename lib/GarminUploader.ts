import { GarminConnect } from "garmin-connect";
import { type ISocialProfile, UploadFileType } from "garmin-connect/dist/garmin/types";
import { logger } from "./Logger.ts";

const AUTH_REFRESH_BUFFER_SECONDS = 5 * 60;

export class GarminUploader {
  private garminConnect: GarminConnect | undefined = undefined;
  private authenticationPromise: Promise<void> | undefined = undefined;

  private readonly userName: string;
  private readonly password: string;

  constructor(userName: string, password: string) {
    this.userName = userName;
    this.password = password;
  }

  public async initialize(): Promise<void> {
    await this.authenticate("startup");
  }

  private async authenticate(reason: string): Promise<void> {
    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }

    this.authenticationPromise = (async () => {
      try {
        logger.info(`Logging in to Garmin Connect (${reason})`);

        // Create a fresh client for full logins. Reusing a client with an expired
        // bearer token can leak the stale Authorization header into Garmin's SSO
        // endpoints and leave long-running processes unable to recover.
        const garminConnect = new GarminConnect({
          username: this.userName,
          password: this.password,
        });

        await garminConnect.login();
        const profile: ISocialProfile = await garminConnect.getUserProfile();

        this.garminConnect = garminConnect;
        logger.info(`Garmin Connect logged in as ${profile.userName}`);
      } catch (error) {
        logger.error({ err: error }, "error creating garmin client");
        throw error;
      } finally {
        this.authenticationPromise = undefined;
      }
    })();

    return this.authenticationPromise;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.garminConnect) {
      await this.authenticate("no active session");
      return;
    }

    const token = this.garminConnect.client.oauth2Token;
    const now = Date.now() / 1000;

    if (token && token.expires_at > now + AUTH_REFRESH_BUFFER_SECONDS) {
      return;
    }

    if (
      token?.refresh_token_expires_at &&
      token.refresh_token_expires_at > now + AUTH_REFRESH_BUFFER_SECONDS
    ) {
      try {
        logger.info("Garmin session is expiring; refreshing OAuth token");
        await this.garminConnect.client.refreshOauth2Token();
        return;
      } catch (error) {
        logger.warn({ err: error }, "Garmin OAuth refresh failed; falling back to a fresh login");
      }
    }

    await this.authenticate("session expired");
  }

  public async uploadFile(filePath: string): Promise<void> {
    await this.ensureAuthenticated();

    try {
      await this.uploadFileWithCurrentSession(filePath);
    } catch (error) {
      if (!this.isAuthError(error)) {
        logger.error({ err: error }, `Error uploading file ${filePath}`);
        throw error;
      }

      logger.warn(
        { err: error },
        "Garmin session was rejected during upload; logging in again and retrying once",
      );
      await this.authenticate("upload session rejected");
      await this.uploadFileWithCurrentSession(filePath);
    }
  }

  private async uploadFileWithCurrentSession(filePath: string): Promise<void> {
    if (!this.garminConnect) {
      throw new Error("Garmin client not initialized");
    }

    logger.info(`Uploading ${filePath} to Garmin Connect`);
    await this.garminConnect.uploadActivity(filePath, UploadFileType.fit);
    logger.info(`Successfully uploaded ${filePath}`);
  }

  private isAuthError(error: unknown): boolean {
    if (typeof error !== "object" || !error) {
      return false;
    }

    const possibleAuthError = error as {
      message?: string;
      response?: { status?: number; statusText?: string };
    };
    const status = possibleAuthError.response?.status;
    const message =
      `${possibleAuthError.message ?? ""} ${possibleAuthError.response?.statusText ?? ""}`.toLowerCase();

    return (
      status === 401 ||
      status === 403 ||
      message.includes("401") ||
      message.includes("403") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("token") ||
      message.includes("session")
    );
  }
}
