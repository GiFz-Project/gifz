import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import {starter} from "../../../index.mjs";
import DateTools from "@hackthedev/datetools";
import {config} from "../../functions/configHelper.mjs";

const rateLimiter = new dSyncRateLimit({
    windowMs: (60_000 * 10),
    getBlockUntil: async (req) => {
        return DateTools.getDateFromOffset("10 minutes");
    }
});

starter.app.get(
    "/gifs/trending{/:timestamp}",
    rateLimiter.middleware({
        getIpLimit: async () => config.ratelimits.gifs.search.ip,
        getTotalLimit: async () => config.ratelimits.gifs.search.total,
        getBlockUntil: async () => DateTools.getDateFromOffset(config.ratelimits.gifs.search.block_duration)
    }),
    async (req, res) => {
        // whatever you wanna do in this endpoint
    }
);



export default (io) => (socket) => {}