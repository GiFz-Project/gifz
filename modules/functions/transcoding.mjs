import { storagePath } from "../../index.mjs";
import { readdir, access, unlink } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import Logger from "@hackthedev/terminal-logger";

let startedTranscodingJob = false;

const mediaVariants = {
    preview: {
        ext: "gif",
        scale: "320:-1",
        fps: 12
    },
    medium: {
        ext: "gif",
        scale: "800:-1",
        fps: 24
    }
};

export async function runTranscodingJob(skipInterval = false, force = false, intervalMs = 5 * 60_000) {
    if (startedTranscodingJob && !force)
        throw new Error("Job already started");

    if (!force) {
        setInterval(() => {
            ensureMediaVariants(storagePath, mediaVariants).catch(console.error);
        }, intervalMs);
    }

    if (skipInterval || force) {
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

            Logger.info(`Transcoding ${base} → ${name}`);

            await transcodeGifWithAlpha(src, out, cfg);
        }
    }
}

async function transcodeGifWithAlpha(src, out, cfg) {
    const palette = out + ".palette.png";
    const vf = `fps=${cfg.fps},scale=${cfg.scale}:flags=lanczos`;

    await runFFmpeg([
        "-i", src,
        "-vf", `${vf},palettegen=reserve_transparent=1`,
        "-y",
        palette
    ]);

    await runFFmpeg([
        "-i", src,
        "-i", palette,
        "-lavfi", `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
        "-y",
        out
    ]);

    await unlink(palette);
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
        p.on("exit", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`)));
    });
}
