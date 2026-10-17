import {starter} from "../../../index.mjs";
import {deleteResource, getResources, searchResource} from "../../functions/resources.mjs";
import {isAdmin} from "../../functions/accounts.mjs";
import {config} from "../../functions/configHelper.mjs";
import DateTools from "@hackthedev/datetools";
import {getGifByHash, getSafeResource, updateResource} from "../../functions/gifHelper.mjs";
import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import fs from "fs";
const rateLimiter = new dSyncRateLimit({
    windowMs: (60_000 * 10),
    getBlockUntil: async (req) => {
        if(await isAdmin(req)) return null;
        return DateTools.getDateFromOffset("10 minutes");
    },
    getTotalLimit: async (req) => {
        if(await isAdmin(req)) return Infinity;
        return 2;
    }
});

starter.app.get("/resources/list{/:timestamp}", async (req, res) => {
    try {
        const timestamp = req.params.timestamp
            ? Number(req.params.timestamp)
            : null;

        if (req.params.timestamp && Number.isNaN(timestamp)) {
            return res.status(400).json({ error: "Invalid timestamp" });
        }

        const resources = await getResources(timestamp);
        return res.status(200).json({ error: null, resources });

    } catch (err) {
        console.error("getResources error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});


starter.app.get("/resources/search/:hash", async (req, res) => {
    try {
        const hash = req.params?.hash;
        if(!hash) return res.status(400).json({ error: "Missing hash" });


        let resource = await searchResource(hash);
        if(resource?.length === 0) return res.status(404).json({ error: "Resource Not Found" });

        resource = await Promise.all(
            resource.map(async (gif) => await getSafeResource(req, gif))
        );

        return res.status(200).json({ error: null, resource });

    } catch (err) {
        console.error("searchResource error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});


starter.app.post(
    "/resource/update/:hash/:key/:value",
    rateLimiter.middleware({
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return null;
            return DateTools.getDateFromOffset("10 minutes");
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return Infinity;
            return 2;
        }
    }),
    async (req, res) => {
        const {hash, key, value} = req.params;

        if(!hash) return res.status(400).json({ error: "Missing hash" });
        if(!key) return res.status(400).json({ error: "Missing key" });
        if(!value) return res.status(400).json({ error: "Missing value" });

        if(!await isAdmin(req)) return res.status(403).json({ error: "Denied" });

        let result = await updateResource(hash, key, value);
        return res.status(200).json({error: null, result});
    }
);

starter.app.post(
    "/resource/delete/:hash",
    rateLimiter.middleware({
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return null;
            return DateTools.getDateFromOffset("10 minutes");
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return Infinity;
            return 2;
        }
    }),
    async (req, res) => {
        const {hash} = req.params;

        if(!hash) return res.status(400).json({ error: "Missing hash" });
        if(!await isAdmin(req)) return res.status(403).json({ error: "Denied" });

        await deleteResource(hash);
        return res.status(200).json({error: null});
    }
);

starter.app.get(
    "/resource/:hash",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if(await isAdmin(req)) return Infinity;
            return config.ratelimits.gifs.search.ip
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return Infinity;
            return config.ratelimits.gifs.search.total
        },
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return null;
            return DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
        }
    }),
    async (req, res) => {
        const {hash} = req.params;
        if(!hash) return res.status(400).json({ error: "Missing hash" });

        let gif = await getGifByHash(hash);
        gif = await getSafeResource(req, gif);

        return res.status(200).json({error: null, ...gif});
    }
);





export default (io) => (socket) => {}
