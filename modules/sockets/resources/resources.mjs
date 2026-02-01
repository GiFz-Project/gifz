import {starter} from "../../../index.mjs";
import {getResources} from "../../functions/resources.mjs";

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


export default (io) => (socket) => {}
