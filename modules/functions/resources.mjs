import {db, dFiles, storagePath} from "../../index.mjs";
import fs from "fs";
import path from "path";
import Logger from "@hackthedev/terminal-logger"
import {ensureMediaVariants} from "./transcoding.mjs";

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

export async function checkResourceCleanup(resource){
    // if the file doesnt exist anymore we delete it
    const resourcePath =resource?.fileHash ? path.join(process.cwd(), "uploads", resource?.fileHash) : null;
    if(resource?.fileHash && !fs.existsSync(resourcePath)){
        await db.queryDatabase(`DELETE FROM resources WHERE fileHash = ?`, [resource?.fileHash])
        Logger.warn("File didnt exist anymore so the database has removed it")
    }

    await checkForUnregisteredResources();
}

export async function checkForUnregisteredResources(){
    let files = fs.readdirSync(path.join(process.cwd(), "public", "uploads"), { withFileTypes: true });

    for (let file of files){
        if (!file.isFile()) continue;

        if (
            file.name.endsWith("_medium") ||
            file.name.endsWith("_preview") ||
            file.name.includes("_medium.") ||
            file.name.includes("_preview.")
        ) continue;

        let filePath = path.join(file.path, file.name);
        let fileExtension = path.extname(file.name).slice(1);

        let fileHash = dFiles.getFileHash(filePath);
        let existingFileHashRow = await db.queryDatabase(
            `SELECT * FROM resources WHERE fileHash = ?`,
            [fileHash]
        );

        if (existingFileHashRow.length === 0){
            fs.renameSync(
                filePath,
                path.join(file.path, `${fileHash}.${fileExtension}`)
            );

            let fileType = fileExtension === "gif" ? "gif" : "unknown";

            await db.queryDatabase(
                `INSERT INTO resources (fileHash, status, type) VALUES (?, ?, ?)`,
                [fileHash, "pending", fileType]
            );
        }
    }
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
