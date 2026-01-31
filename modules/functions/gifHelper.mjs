import {db} from "../../index.mjs";
import {config} from "./configHelper.mjs";

export async function getPopularGIFS(limit = 50, timestamp = null) {
    const where = [
        "IsBlocked = 0",
        "status = 'verified'",
        "type = 'gif'"
    ];

    const params = [];

    if (timestamp) {
        where.push("created_at >= ?");
        params.push(timestamp);
    }

    // max limit
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
        "status = 'verified'",
        "type = 'gif'",
        `(${tagClauses})`
    ];

    if (timestamp) {
        where.push("created_at >= ?");
        params.push(timestamp);
    }

    // max limit
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
