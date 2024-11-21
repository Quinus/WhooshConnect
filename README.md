# WhooshConnect

Simple Bun app that detects new .fit files in the 
MyWhoosh app folder and automatically uploads them to garmin connect.

Only tested on Mac OS. 
For usage on windows you should check in which folder the MyWhoosh app puts it's .fit files and change this in `FOLDER_PATH` in the .env file.

## Configuration

create a .env file with your Garmin Connect username and password.
> see .env.example for file structure</br>
> FOLDER_PATH should also be in your .env file.

## Running

This project was created using Bun, but should also work with Node.js if preferred.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Attribution

Garmin Connect integration is powered by https://github.com/Pythe1337N/garmin-connect

This project was created using `bun init` in bun v1.1.36. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
