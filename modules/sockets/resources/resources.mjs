import {starter} from "../../../index.mjs";
import {getResources, searchResource} from "../../functions/resources.mjs";

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


        const resource = await searchResource(hash);
        if(resource?.length === 0) return res.status(404).json({ error: "Resource Not Found" });

        return res.status(200).json({ error: null, resource });

    } catch (err) {
        console.error("searchResource error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});



export default (io) => (socket) => {}
