import {db} from "../../index.mjs";

export async function getPopularGIFS(timestamp = null) {
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

    const gifs = await db.queryDatabase(
        `
        SELECT *
        FROM resources
        WHERE ${where.join(" AND ")}
        ORDER BY views DESC
        `,
        params
    );

    return gifs;
}

export async function searchPopularGifs(search, timestamp = null) {
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

    const gifs = await db.queryDatabase(
        `
        SELECT *
        FROM resources
        WHERE ${where.join(" AND ")}
        ORDER BY views DESC
        `,
        params
    );

    return gifs;
}
