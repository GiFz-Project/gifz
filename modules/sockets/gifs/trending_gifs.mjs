import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import {starter} from "../../../index.mjs";
import DateTools from "@hackthedev/datetools";
import {config} from "../../functions/configHelper.mjs";
import {getPopularGIFS, searchPopularGifs} from "../../functions/gifHelper.mjs";

const rateLimiter = new dSyncRateLimit({
    windowMs: (60_000 * 10),
    getBlockUntil: async (req) => {
        return DateTools.getDateFromOffset("10 minutes");
    }
});

starter.app.get(
    "/gifs/search/:searchTerm{/:timestamp}{/:limit}",
    rateLimiter.middleware({
        getIpLimit: async () => config.ratelimits.gifs.search.ip,
        getTotalLimit: async () => config.ratelimits.gifs.search.total,
        getBlockUntil: async () => DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
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

        return res.status(200).json({error: null, gifs: popularGifs});
    }
);

starter.app.get(
    "/gifs/trending{/:timestamp}{/:limit}",
    rateLimiter.middleware({
        getIpLimit: async () => config.ratelimits.gifs.search.ip,
        getTotalLimit: async () => config.ratelimits.gifs.search.total,
        getBlockUntil: async () => DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
    }),
    async (req, res) => {
        const {timestamp, limit} = req.params;

        let popularGifs = await getPopularGIFS(limit, timestamp);
        return res.status(200).json({error: null, gifs: popularGifs});
    }
);


export default (io) => (socket) => {
}