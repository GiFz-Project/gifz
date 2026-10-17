import ExpressStarter from "@hackthedev/express-starter"
import SocketTools from "@hackthedev/socket-tools"
import dSyncFiles from "@hackthedev/dsync-files";
import dSyncSql from "@hackthedev/dsync-sql"
import Logger from "@hackthedev/terminal-logger";
import dSyncIPSec from "@hackthedev/dsync-ipsec"
//import dSyncIPSec from "E:\\network-z-dev\\dSyncIPSec\\index.mjs"

import path from "path"
import fs from "fs"
import {getConfigObject} from "./modules/functions/configHelper.mjs";
import {addResourceView, getGifByHash, getSafeResource, runResourceViewJob} from "./modules/functions/gifHelper.mjs";
import {getCache, setCache} from "./modules/functions/cache.mjs";
import {runTranscodingJob} from "./modules/functions/transcoding.mjs";
import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import DateTools from "@hackthedev/datetools";
import {getAccountRateLimit, isAdmin, validateAccount} from "./modules/functions/accounts.mjs";

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

// create storage directory path if it doesnt exist yet
if(!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);

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
    ],
    //
    checkCache: async (ip) => {
        let ipInfoRow = await getCache(ip, "ip_cache");
        if(ipInfoRow?.length === 0){
            await setCache(ip, "ip_cache");
        }
    },
    setCache: async (ip, data) => {
        await setCache(ip, "ip_cache", JSON.stringify(data));
    }
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
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
            //
            {name: "upload_limit", type: "bigint NOT NULL DEFAULT 10"},
            {name: "search_rate_limit", type: "bigint DEFAULT NULL"},
            {name: "upload_rate_limit", type: "bigint DEFAULT NULL"},
            {name: "file_access_rate_limit", type: "bigint DEFAULT NULL"},
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
            {name: "status", type: "varchar(255) NOT NULL DEFAULT 'pending'"},
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
            {name: "ip", type: "varchar(255) DEFAULT NULL"},
            {name: "country_code", type: "varchar(255) DEFAULT NULL"},
            //
            {name: "views", type: "bigint NOT NULL DEFAULT 0"},
            {name: "tags", type: "text NOT NULL"},
            {name: "type", type: "varchar(255) NOT NULL DEFAULT 'unkown'"}, // image, gif, ...
            //
            {name: "isBlocked", type: "bigint NOT NULL DEFAULT 0"},
            {name: "isNSFW", type: "bigint NOT NULL DEFAULT 0"},
            {name: "isSensitive", type: "bigint NOT NULL DEFAULT 0"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "fileHash (fileHash)"},
        ]
    },
    {
        name: "resource_views",
        columns: [
            {name: "rowId", type: "int(12) NOT NULL AUTO_INCREMENT"},
            {name: "resourceId", type: "varchar(255) DEFAULT NULL"},
            {name: "status", type: "varchar(255) NOT NULL DEFAULT 'pending'"},
            {name: "country_code", type: "varchar(10) NOT NULL DEFAULT 'unkown'"},
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "created (created)"},
        ]
    },
    {
        name: "cache",
        columns: [
            {name: "rowId", type: "int(12) NOT NULL AUTO_INCREMENT"},
            {name: "type", type: "varchar(255) NOT NULL"},
            {name: "identifier", type: "varchar(255) NOT NULL"},
            {name: "data", type: "text NOT NULL DEFAULT 'pending'"},
            {name: "created", type: "bigint NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)"},
        ],
        keys: [
            {name: "PRIMARY KEY", type: "(rowId)"},
            {name: "UNIQUE KEY", type: "identifier (identifier)"},
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

    // ip based abuse
    await ipsec.filterExpressTraffic(starter.app)

    starter.registerErrorHandlers(); // to avoid hard crashes and enable logging
    starter.registerTemplateMiddleware({ // cool template engine
        getPlaceholders: async (req) => {
            return [
                ["project_name", () => "GiFz"],
                ["title", () => config.instance.info.title],
                ["footer", () => config.instance.info.footer],
                ["rules", () => config.instance.info.rules],
                ["max_tags", () => config?.uploads?.max_tags ?? 5],
            ]
        },
        getExtensions: async (req) => {
            return ['.html', '.js',]
        }
    });



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

    await runResourceViewJob(true);
    await runTranscodingJob(true);
}

async function initUploadHandle() {

    const file_ratelimits = new dSyncRateLimit({
        windowMs: 60_000,
        getBlockUntil: async (req) => {
            return DateTools.getDateFromOffset(config.ratelimits.gifs.upload.block_duration);
        }
    });

    dFiles.registerFileUploadHandle({
        app: starter.app,
        urlPath: "/upload",
        uploadPath: storagePath,
        limits: {
            getMaxMB: async (req) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                if(await isAdmin(req)) return Infinity;
                return (await getAccountRateLimit(req)).upload_limit || config.uploads.upload_limit;
            },

            getMaxFolderSizeMB: async (req) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                return Number(config.storage.max_size_gb) * 1024; // GB
            },

            canAccessFiles: async (req) => {
                if(await isAdmin(req)) return true;

                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                let fileHash = req.params.id.split("_")[0];
                let gif = await getGifByHash(fileHash);

                if(gif.isBlocked) return false
                if(gif.status !== "approved") return false
                return true;
            },

            getAllowedMimes: async (req) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow) return false;

                return [
                    "image/png",
                    "image/jpeg",
                    "image/gif",
                ];
            },

            canUpload: async (req) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                // upload rate limit
                const rUser = file_ratelimits.check(`upload/${ipsec.getClientIp(req)}`, (await getAccountRateLimit(req)).upload_rate_limit || config.ratelimits.gifs.upload.ip);
                const rTotal = file_ratelimits.check(`upload/total`, config.ratelimits.gifs.upload.total);

                if ((!rUser.ok || !rTotal.ok) && !await isAdmin(req)) {
                    return false;
                }

                const tags = req?.query.tags;
                return !!tags;
            },

            onFileAccess: async (req) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                let fileHash = req.params.id.split("_")[0];

                // file access rate limit
                const rUser = file_ratelimits.check(`file/${fileHash}/${ipsec.getClientIp(req)}`, (await getAccountRateLimit(req)).file_access_rate_limit || config.ratelimits.files.access.ip);
                const rTotal = file_ratelimits.check(`file/${fileHash}/total`, config.ratelimits.files.access.total);

                if ((!rUser.ok || !rTotal.ok) && !await isAdmin(req)) {
                    return false;
                }


                let gif = await getGifByHash(fileHash);
                if(!gif) console.error("Unable to update views for resource ", fileHash);

                let clientIp = ipsec.getClientIp(req);
                let ipInfo = clientIp ? await ipsec.lookupIP(clientIp) : null;

                addResourceView(gif.rowId, ipInfo?.location?.country_code);
            },

            onFinish: async (req, file) => {
                const r = await ipsec.checkRequest(req);
                if (!r.allow && !await isAdmin(req)) return false;

                let accountId = req?.query?.accountId;
                const token = req?.query?.token;
                const rawTags = req?.query?.tags;

                if (!accountId) accountId = 0;
                if (accountId && !token) accountId = 0;

                // if login stuff present, use for credits
                if (accountId && token) {
                    if(!await validateAccount(accountId, token)){
                        accountId = 0;
                    }
                }

                const ext = file.ext?.toLowerCase();
                const mime = file.mimeType?.toLowerCase();

                let insertType = "unknown";
                if (ext === "gif" || mime === "image/gif") {
                    insertType = "gif";
                }

                let tags = null;

                if (rawTags) {
                    tags = rawTags
                        .split(",")
                        .map(t => t.toLowerCase())
                        .filter(Boolean)
                        .slice(0, config.uploads.max_tags)
                        .join(",");
                }

                let clientIp = ipsec.getClientIp(req);
                let ipInfo = await ipsec.lookupIP(clientIp);

                await db.queryDatabase(
                    `
                        INSERT INTO resources (fileHash, type, accountId, tags, created, status, ip, country_code)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        file.hash,
                        insertType,
                        accountId,
                        tags,
                        new Date().getTime(),
                        config.uploads.default_status,
                        ipInfo?.ip || "unkown",
                        ipInfo?.location?.country_code || "unkown"
                    ]
                );

                runTranscodingJob(false, true);
            }
        }
    });

    starter.app.use((req, res) => {
        res.sendFile(path.join(starter.dirname, "public", "index.html"));
    });
}