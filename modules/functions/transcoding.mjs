import { db, storagePath } from "../../index.mjs";
import { readdir, access } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

let startedTranscodingJob = false;

let mediaVariants = {
    preview: {
        ext: "gif",
        args: ["-vf", "scale=320:-1,fps=12"]
    },
    medium: {
        ext: "gif",
        args: ["-vf", "scale=800:-1,fps=24"]
    }
};

export async function runTranscodingJob(skipInterval = false, intervalMs = 5 * 60_000) {
    if (startedTranscodingJob) throw new Error("Job already started");

    setInterval(async () => {
        await ensureMediaVariants(storagePath, mediaVariants);
    }, intervalMs);

    if (skipInterval) {
        await ensureMediaVariants(storagePath, mediaVariants);
    }

    startedTranscodingJob = true;
}

export async function ensureMediaVariants(dir, variants) {
    const files = await readdir(dir);

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const base = path.basename(file, ext);

        if (base.includes("_")) continue;
        if (ext !== ".gif") continue;

        const src = path.join(dir, file);

        for (const [name, cfg] of Object.entries(variants)) {
            const out = path.join(dir, `${base}_${name}.${cfg.ext}`);

            if (await exists(out)) continue;

            await runFFmpeg([
                "-i", src,
                ...(cfg.args || []),
                "-y",
                out
            ]);
        }
    }
}

async function exists(p) {
    try {
        await access(p);
        return true;
    } catch {
        return false;
    }
}

function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        const p = spawn("ffmpeg", args, { stdio: "ignore" });
        p.on("exit", code => (code === 0 ? resolve() : reject(code)));
    });
}
