import ExpressStarter from "@hackthedev/express-starter"
import SocketTools from "@hackthedev/socket-tools"
import dSyncFiles from "@hackthedev/dsync-files";
import dSyncSql from "@hackthedev/dsync-sql"
import Logger from "@hackthedev/terminal-logger";
import dSyncIPSec from "@hackthedev/dsync-ipsec"

import path from "path"
import fs from "fs"
import {getConfigObject} from "./modules/functions/configHelper.mjs";

console.clear();

Logger.info("  ____ _ _____")
Logger.info(" / ___(_)  ___|___")
Logger.info("| |  _| | |_ |_  /")
Logger.info("| |_| | |  _| / /")
Logger.info(` \\____|_|_|  /___|`)
Logger.info("")

export const dFiles = new dSyncFiles();
let config = getConfigObject();

export let storagePath = path.resolve(config.storage.path)
let usedUpStorageBytes = await dFiles.getFolderSize(storagePath);

Logger.info(Logger.colors.underscore + Logger.colors.bright + "Overview")
Logger.info(`Storage usage: ${(usedUpStorageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB / ${config.storage.max_size_gb} GB`)
Logger.space(2)


// do db stuff
export let db = new dSyncSql({
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.pass,
    database: config.sql.db,
    waitForConnections: true, // optional
    connectionLimit: config.sql.connection_limit, // optional
    queueLimit: 0, // optional
});

// some definitions and ip security settings
export let starter;
export let socketTools;

export let ipsec = new dSyncIPSec({
    blockBogon: true,
    blockDatacenter: true,
    blockSatelite: true,
    blockCrawler: true,
    blockProxy: true,
    blockVPN: true,
    blockTor: true,
    blockAbuser: true,
    // some arrays
    whitelistedUrls: [
        "/^/discover(/.*)?$/",
        "/^/uploads(/.*)?$/",
    ],
    whitelistedIps: [],
    blockedCountryCodes: [],
    whitelistedCompanyDomains: [],
    blacklistedIps: [
        "::1",
        "127.0.0.1",
        "localhost"
    ]
});

initMain();


const tables = [
    {
        name: "accounts",
        columns: [
            {name: "rowId", type: "int(12) NOT NULL AUTO_INCREMENT"},
            {name: "id", type: "VARCHAR(20) NOT NULL"},
            {name: "token", type: "varchar(255) NOT NULL"},
            {name: "password", type: "text DEFAULT NULL"},
            {name: "name", type: "varchar(255) DEFAULT NULL"},
            {name: "icon", type: "varchar(1000) DEFAULT NULL"},
            {name: "isTerminated", type: "bigint NOT NULL DEFAULT 0"},
            {name: "isAdmin", type: "bigint NOT NULL DEFAULT 0"},
            {name: "upload_limit", type: "bigint NOT NULL DEFAULT 10"},
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "name (name)"},
        ]
    },
    {
        name: "servers",
        columns: [
            {name: "rowId", type: "int(12) NOT NULL AUTO_INCREMENT"},
            {name: "host", type: "varchar(255) DEFAULT NULL"},
            {name: "isBlocked", type: "bigint NOT NULL DEFAULT 0"},
            {name: "trust_score", type: "DECIMAL(12,8) NOT NULL DEFAULT 0.5"},
            {name: "status", type: "varchar(255) NOT NULL DEFAULT 'pending'"},
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "host (host)"},
        ]
    },
    {
        name: "resources",
        columns: [
            {name: "rowId", type: "int(12) NOT NULL AUTO_INCREMENT"},
            {name: "host", type: "varchar(255) DEFAULT NULL"},
            {name: "accountId", type: "VARCHAR(20) DEFAULT NULL"},
            {name: "fileHash", type: "varchar(255) DEFAULT NULL"},
            {name: "isBlocked", type: "bigint NOT NULL DEFAULT 0"},
            {name: "status", type: "varchar(255) NOT NULL DEFAULT 'pending'"},
            //
            {name: "views", type: "bigint NOT NULL DEFAULT 0"},
            {name: "tags", type: "text NOT NULL"},
            {name: "type", type: "varchar(255) NOT NULL DEFAULT 'unkown'"}, // image, gif, ...
            //
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "fileHash (fileHash)"},
        ]
    },
    {
        name: "audit_log",
        columns: [
            {name: "rowId", type: "int(16) NOT NULL AUTO_INCREMENT"},
            {name: "logId", type: "varchar(255) NOT NULL"},
            {name: "refId", type: "varchar(255) NOT NULL"},
            //
            {name: "text", type: "text NOT NULL"},
            {name: "extra_data", type: "text NOT NULL"},
            //
            {name: "isSensitive", type: "int NOT NULL DEFAULT 0"},
            //
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "logId (logId)"},
        ]
    }
]

async function initMain() {
    // Wait for database
    Logger.info("Starting up...");
    Logger.warn("Waiting for database connection...")

    await db.waitForConnection()
    Logger.success("Database connected!");

    // start up express and socket.io
    starter = new ExpressStarter()
    starter.registerErrorHandlers(); // to avoid hard crashes and enable logging
    starter.registerTemplateMiddleware({ // cool template engine
        getPlaceholders: async (req) => {
            return [
                ["project_name", () => "GiFz"]
            ]
        },
        getExtensions: async (req) => {
            return ['.html', '.js', ]
        }
    });


    // ip based abuse
    await ipsec.filterExpressTraffic(starter.app)

    // setup static files to serve
    starter.app.use(
        starter.express.static(
            starter.dirname + "/public",
        ),
    );

    // begin to listen
    starter.startHttpServer(config.port);

    // attach socket.io to existing server for real-time stuff
    socketTools = new SocketTools({expressHttpServer: starter.server});
    socketTools.listen();


    // create mysql stuff if needed
    for (const table of tables) {
        await db.checkAndCreateTable(table);
    }

    await initUploadHandle();

    Logger.space(2)
}

async function initUploadHandle() {
    dFiles.registerFileUploadHandle({
        app: starter.app,
        urlPath: "/upload",
        uploadPath: storagePath,
        limits: {
            getMaxMB: async (req) => {
                return 15;
            },

            getMaxFolderSizeMB: async (req) => {
                return Number(config.storage.max_size_gb) * 1024; // GB
            },

            getAllowedMimes: async (req) => {
                return [
                    "image/png",
                    "image/jpeg",
                    "image/gif",
                ];
            },

            canUpload: async (req) => {
                return true;
            },
        }
    });

    starter.app.use((req, res) => {
        res.sendFile(path.join(starter.dirname, "public", "index.html"));
    });
}