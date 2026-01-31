import {db} from "../../index.mjs";
import {config} from "./configHelper.mjs";

export async function addResourceView(rowId){
    if(!rowId) throw new Error("Resource id not specified");
    await db.queryDatabase(`INSERT IGNORE INTO resource_views (resourceId) VALUES (?)`, [rowId])
}

export async function processResourceViews(rowId){
    if(!rowId) throw new Error("Resource id not specified");

    let unprocessedViews = await db.queryDatabase(`SELECT rowId resource_views WHERE resourceId = ? AND status='pending'`, [rowId])
    console.log(unprocessedViews);
}

export async function getPopularGIFS(limit = 50, timestamp = null) {
    const where = [
        "IsBlocked = 0",
        "status = 'approved'",
        "type = 'gif'"
    ];

    const params = [];

    if (timestamp) {
        where.push("created_at >= ?");
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

export async function searchPopularGifs(search, limit= 50, timestamp = null) {
    if (!search || !search.length) return await getPopularGIFS(timestamp);

    const tagClauses = search.map(() =>
        "CONCAT(',', tags, ',') LIKE ?"
    ).join(" OR ");

    const params = search.map(t => `%,${t},%`);

    const where = [
        "IsBlocked = 0",
        "status = 'approved'",
        "type = 'gif'",
        `(${tagClauses})`
    ];

    if (timestamp) {
        where.push("created_at >= ?");
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
