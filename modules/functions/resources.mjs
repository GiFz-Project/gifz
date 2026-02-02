import {db, storagePath} from "../../index.mjs";
import fs from "fs";
import path from "path";

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

export async function deleteResource(hash) {
    if(!hash) throw new Error(`${hash} not found`);

    await db.queryDatabase(
        `
        DELETE FROM resources WHERE fileHash = ?
        `,
        [hash]
    );

    deleteAllVariants(hash)
}

export function deleteAllVariants(hash) {
    const files = fs.readdirSync(storagePath);

    const original = files.find(f => f === hash || f.startsWith(hash + "."));
    if (!original) return;

    const ext = original.includes(".") ? original.split(".").pop() : null;

    const variants = [
        ext ? `${hash}.${ext}` : hash,
        ext ? `${hash}_medium.${ext}` : `${hash}_medium`,
        ext ? `${hash}_preview.${ext}` : `${hash}_preview`,
    ];

    for (const name of variants) {
        const p = path.join(storagePath, name);
        if (fs.existsSync(p)) fs.unlinkSync(p);
    }
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
