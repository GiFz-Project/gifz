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
    // causes issues with short givs otherwise. this way it seems to work for now.
    const frameDuration = 1 / cfg.fps;
    const vf = `tpad=stop_mode=clone:stop_duration=${frameDuration},fps=${cfg.fps},scale=${cfg.scale}:flags=lanczos`;

    await runFFmpeg([
        "-i", src,
        "-filter_complex",
        `[0:v]${vf},split[frames][paletteInput];` +
        `[paletteInput]palettegen=reserve_transparent=1[palette];` +
        `[frames][palette]paletteuse=dither=bayer:bayer_scale=5`,
        "-loop", "0",
        "-y",
        out
    ]);
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
        const p = spawn("ffmpeg", args, {
            stdio: ["ignore", "ignore", "pipe"]
        });

        let stderr = "";

        // basically now with this code the goal is to better catch ffmpeg erros.
        p.stderr.on("data", data => {
            stderr += data.toString();
        });

        p.on("error", reject);
        p.on("exit", code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`ffmpeg exited with ${code}\n${stderr}`));
            }
        });
    });
}