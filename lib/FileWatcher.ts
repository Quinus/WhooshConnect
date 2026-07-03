import { EventEmitter } from "events";
import fs from "fs";
import chokidar from "chokidar";
import { logger } from "./Logger.ts";

export class FileWatcher extends EventEmitter {
  private readonly folderPath: string;

  constructor(folderPath: string) {
    super();
    this.folderPath = this.validateFolderPath(folderPath);
  }

  private validateFolderPath(folderPath: string): string {
    if (!fs.existsSync(folderPath)) {
      logger.error(`Specified folder does not exist: ${folderPath}`);
      throw new Error(`Specified folder does not exist: ${folderPath}`);
    }

    return folderPath;
  }

  public start() {
    logger.info(`Starting file watcher ${this.folderPath}`);

    const watcher = chokidar.watch(this.folderPath, { ignoreInitial: true });

    watcher
      .on("add", (filePath) => this.handleFileDetected(filePath))
      .on("change", (filePath) => this.handleFileDetected(filePath))
      .on("error", (error) => {
        logger.error(`Failed to start watcher ${this.folderPath}: ${error}`);
        this.emit("error", error);
      });

    return this;
  }

  private handleFileDetected(filePath: string) {
    if (filePath.endsWith(".fit")) {
      logger.info(`Detected FIT file: ${filePath}`);
      this.emit("fitFileDetected", filePath);
    }
  }
}
