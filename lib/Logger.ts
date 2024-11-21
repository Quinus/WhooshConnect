import * as winston from "winston";
import {homedir} from "os";
import * as path from "node:path";
import {mkdirSync} from 'fs'
import DailyRotateFile from 'winston-daily-rotate-file';

export class Logger {
    private static instance: winston.Logger;

    private constructor() {
    }

    public static getInstance(): winston.Logger {
        if (!this.instance) {
            const logDir = path.join(homedir(), ".whooshconnect", 'logs');
            mkdirSync(logDir, {recursive: true});

            this.instance = winston.createLogger({
                level: "info",
                format: winston.format.combine(
                    winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
                    winston.format.errors({stack: true}),
                    winston.format.splat(),
                    winston.format.json(),
                ),
                defaultMeta: {service: 'whooshconnect'},
                transports: [
                    // console transport
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
                            winston.format.colorize({all: true}),
                            winston.format.printf(({timeStamp, level, message, stack}) => {
                                return `${timeStamp} ${level}: ${message}${stack ? '\n' + stack : ''}`;
                            })
                        )
                    }),
                    // file for info or above
                    new DailyRotateFile({
                        filename: path.join(logDir, 'app-%DATE%.log'),
                        datePattern: 'YYYY-MM-DD',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '14d',
                        level: 'info'
                    }),
                    // error file
                    new DailyRotateFile({
                        filename: path.join(logDir, 'error-%DATE%.log'),
                        datePattern: 'YYYY-MM-DD',
                        zippedArchive: true,
                        maxSize: '20m',
                        maxFiles: '14d',
                        level: 'error'
                    })
                ],
                exceptionHandlers: [
                    new winston.transports.File({
                        filename: path.join(logDir, 'exceptions.log'),
                    })
                ],
                rejectionHandlers: [
                    new winston.transports.File({
                        filename: path.join(logDir, 'rejections.log'),
                    })
                ]
            });
        }
        return this.instance;
    }
}
