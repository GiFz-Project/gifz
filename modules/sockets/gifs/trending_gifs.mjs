import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import {starter} from "../../../index.mjs";
import DateTools from "@hackthedev/datetools";
import {config} from "../../functions/configHelper.mjs";
import {
    getGifByHash,
    getNewGIFS,
    getPopularGIFS,
    getSafeResource,
    searchPopularGifs
} from "../../functions/gifHelper.mjs";
import {isAdmin} from "../../functions/accounts.mjs";

const rateLimiter = new dSyncRateLimit({
    windowMs: (60_000 * 10),
    getBlockUntil: async (req) => {
        if(await isAdmin(req)) return null;
        return DateTools.getDateFromOffset("10 minutes");
    }
});

starter.app.get(
    "/gifs/search/:searchTerm{/:timestamp}{/:limit}",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.ip
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.total
        },
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return null;
            return DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
        }
    }),
    async (req, res) => {
        const {searchTerm, timestamp, limit} = req.params;

        if (!searchTerm)
            return res.status(400).json({error: "Missing search term"});

        const search = decodeURIComponent(searchTerm)
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        const ts = timestamp ? Number(timestamp) : null;
        const lim = limit ? Number(limit) : null;

        let popularGifs = await searchPopularGifs(search, ts, lim);
        for(let gif of popularGifs) {
            gif = await getSafeResource(req, gif);
        }

        return res.status(200).json({error: null, gifs: popularGifs});
    }
);

starter.app.get(
    "/gifs/trending{/:limit}{/:timestamp}",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.ip
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.total
        },
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return null;
            return DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
        }
    }),
    async (req, res) => {
        const {timestamp, limit} = req.params;

        let popularGifs = await getPopularGIFS(limit, timestamp);
        popularGifs = await Promise.all(
            popularGifs.map(gif => getSafeResource(req, gif))
        );

        return res.status(200).json({error: null, gifs: popularGifs});
    }
);

starter.app.get(
    "/gifs/new{/:limit}{/:timestamp}",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.ip
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.total
        },
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return 9999;
            return DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
        }
    }),
    async (req, res) => {
        const {timestamp, limit} = req.params;

        let newGifs = await getNewGIFS(limit, timestamp);
        newGifs = await Promise.all(
            newGifs.map(gif => getSafeResource(req, gif))
        );

        return res.status(200).json({error: null, gifs: newGifs});
    }
);

starter.app.get(
    "/resource/:hash",
    rateLimiter.middleware({
        getIpLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.ip
        },
        getTotalLimit: async (req) => {
            if(await isAdmin(req)) return 9999;
            return config.ratelimits.gifs.search.total
        },
        getBlockUntil: async (req) => {
            if(await isAdmin(req)) return 9999;
            DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
        }
    }),
    async (req, res) => {
        const {hash} = req.params;

        let gif = await getGifByHash(hash);
        gif = getSafeResource(req, gif);
        return res.status(200).json({error: null, ...gif});
    }
);


export default (io) => (socket) => {
}