import {db} from "../../index.mjs";

export async function getResources(timestamp = null, limit = 100) {
    const where = [];
    const params = [];

    if (timestamp) {
        where.push("created >= ?");
        params.push(timestamp);
    }

    return await db.queryDatabase(
        `
        SELECT *
        FROM resources
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY created DESC
        LIMIT ${limit}
        `,
        params
    );
}

export async function searchResource(hash) {
    if(!hash) throw new Error("No hash in search")

    return await db.queryDatabase(
        `
        SELECT *
        FROM resources
        WHERE fileHash LIKE ?
        `,
        [`%${hash}%`]
    );
}
