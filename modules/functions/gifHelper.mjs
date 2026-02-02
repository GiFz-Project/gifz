import {db} from "../../index.mjs";
import {config} from "./configHelper.mjs";
import Logger from "@hackthedev/terminal-logger"
import DateTools from "@hackthedev/datetools";
import {isAdmin} from "./accounts.mjs";

let startedViewJob = false;

export async function runResourceViewJob(skipInterval = false, intervalMs = 5 * 60_000, batchLimit = 1000){
    if(startedViewJob === true) throw new Error("Job already started");

    setInterval(async () => {
        await processViews();
    }, intervalMs);

    if(skipInterval){
        await processViews();
    }

    startedViewJob = true;

    async function processViews(){
        try {
            const rows = await db.queryDatabase(
                `
                SELECT DISTINCT resourceId
                FROM resource_views
                WHERE status = 'pending'
                LIMIT ?
                `,
                [batchLimit]
            );

            for (const r of rows) {
                Logger.info(`Processing views of resource ${r.resourceId}`);
                await processResourceViews(r.resourceId, batchLimit);
            }
        } catch (err) {
            console.error("runResourceViewJob error:", err);
        }
    }
}

export async function getSafeResource(req, resource){
    resource = structuredClone(resource)
    if(!await isAdmin(req)){
        if(resource.hasOwnProperty("ip")) delete resource.ip
        if(resource.hasOwnProperty("country_code")) delete resource.country_code
    }
    return resource;
}

export async function addResourceView(rowId, country_code){
    if(!rowId) throw new Error("Resource id not specified");
    await db.queryDatabase(
        `INSERT IGNORE INTO resource_views (resourceId, status, country_code) VALUES (?, 'pending', ?)`,
        [rowId, country_code || "unkown"]
    );
}

export async function processResourceViews(rowId, limit = 1000){
    if(!rowId) throw new Error("Resource id was not specified when processing views");

    const rows = await db.queryDatabase(
        `
        SELECT rowId
        FROM resource_views
        WHERE resourceId = ? AND status = 'pending'
        LIMIT ?
        `,
        [rowId, limit]
    );

    if(!rows.length) return 0;

    const ids = rows.map(r => r.rowId);
    const count = ids.length;

    await db.queryDatabase(
        `
        UPDATE resources
        SET views = views + ?
        WHERE rowId = ?
        `,
        [count, rowId]
    );

    const placeholders = ids.map(() => "?").join(",");

    await db.queryDatabase(
        `
        UPDATE resource_views
        SET status = 'processed'
        WHERE rowId IN (${placeholders})
        `,
        ids
    );

    return count;
}

export async function getGifByHash(hash){
    if(!hash) throw new Error("Hash not specified");

    let gifRow = await db.queryDatabase(`SELECT * FROM resources WHERE fileHash = ?`, [hash]);
    if(gifRow?.length === 0) return null;
    return gifRow[0];
}

export async function getNewGIFS(limit = 50, timestamp = null) {
    const where = [
        "IsBlocked = 0",
        "status = 'approved'",
        "type = 'gif'"
    ];

    const params = [];

    if (!timestamp) {
        timestamp = DateTools.getDateFromOffset(`-${config.uploads.trending_duration} days`).getTime();
    }

    if (timestamp) {
        where.push("created >= ?");
        params.push(timestamp);
    }

    if (typeof limit !== "number" || limit > config.ratelimits.gifs.search.max_amount) {
        limit = config.ratelimits.gifs.search.max_amount;
    }

    const gifs = await db.queryDatabase(
        `
        SELECT *
        FROM resources
        WHERE ${where.join(" AND ")}
        ORDER BY created DESC
        LIMIT ${limit}
        `,
        params
    );

    return gifs;
}


export async function getPopularGIFS(limit = 50, timestamp = null) {
    const where = [
        "IsBlocked = 0",
        "status = 'approved'",
        "type = 'gif'"
    ];

    const params = [];

    if (!timestamp) {
        timestamp = DateTools.getDateFromOffset(`-${config.uploads.trending_duration} days`).getTime();
    }

    if (timestamp) {
        where.push("created >= ?");
        params.push(timestamp);
    }


    // max limit
    if(typeof limit !== "number" && limit != null) limit = config.ratelimits.gifs.search.max_amount;
    if(Number(limit) > config.ratelimits.gifs.search.max_amount)
        limit = config.ratelimits.gifs.search.max_amount;

    const gifs = await db.queryDatabase(
        `
        SELECT *
        FROM resources
        WHERE ${where.join(" AND ")}
        ORDER BY views DESC
        LIMIT ${limit}
        `,
        params
    );

    return gifs;
}

export async function searchPopularGifs(search, timestamp = null, limit= 50) {
    if (!search || !search?.length) return await getPopularGIFS(limit, timestamp);

    const tags = search
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

    if (!tags.length) return [];

    const tagClauses = tags.map(() => "FIND_IN_SET(?, tags)").join(" AND ");
    const params = [...tags];

    const where = [
        "IsBlocked = 0",
        "status = 'approved'",
        "type = 'gif'",
        `(${tagClauses})`
    ];

    if (timestamp) {
        where.push("created >= ?");
        params.push(timestamp);
    }

    if (typeof limit !== "number" || limit > config.ratelimits.gifs.search.max_amount) {
        limit = config.ratelimits.gifs.search.max_amount;
    }

    const gifs = await db.queryDatabase(
        `
            SELECT *
            FROM resources
            WHERE ${where.join(" AND ")}
            ORDER BY views DESC
                LIMIT ${limit}
        `,
        params
    );

    return gifs;
}
