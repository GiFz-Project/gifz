import {
    createAccount,
    getAccountFromDbByIdOrName, getAccountRateLimit, isAdmin,
    isAdminAccount,
    isTerminated,
    sanitizeUsername, validateAccount
} from "../../functions/accounts.mjs";
import bcrypt from "bcrypt";
import {starter} from "../../../index.mjs";
import dSyncRateLimit from "@hackthedev/dsync-ratelimit";
import DateTools from "@hackthedev/datetools";

const register_limit = new dSyncRateLimit({
    windowMs: 60_000,
    getIpLimit: async (req) => {
        if(await isAdmin(req)) return 9999;
        return 3;
    },

    getTotalLimit: async (req) => {
        if(await isAdmin(req)) return 9999;
        return 50;
    },

    getBlockUntil: async (req) => {
        if(await isAdmin(req)) return null;
        return DateTools.getDateFromOffset("10 minutes");
    }
});

starter.app.get("/permission/check/:perm", starter.express.json(), async (req, res) => {
    try {
        const { perm } = req.params;

        if (!perm)
            return res.status(400).json({ error: "Missing perm parameter", check: false })

        // admins have all perms, always
        if(await isAdmin(req)) return res.status(200).json({ error: null, check: true})

        // todo: actual perm check eventually


        return res.status(200).json({
            error: null,
            check: false
        });

    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

starter.app.post("/account/", starter.express.json(), async (req, res) => {
    try {
        const { name, token } = req.body;

        if (!name)
            return res.status(400).json({ error: "Missing name parameter" })

        if (!token)
            return res.status(400).json({ error: "Missing token parameter" })

        // admins have all perms, always
        if(!await validateAccount(name, token)) return res.status(403).json({ error: "Auth failed"})

        return res.status(200).json({
            error: null,
            account: {
                ...await getAccountFromDbByIdOrName(name),
                ...await getAccountRateLimit(req)
            }
        });

    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});


starter.app.post("/register", starter.express.json(), register_limit.middleware(), async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password)
            return res.status(400).json({ error: "Missing name or password" });

        const result = await createAccount(name, password);

        if (result?.error)
            return res.status(400).json({ error: result.error });

        return res.status(200).json({
            error: null,
            id: result.id,
            token: result.token,
            name: result.clearedName
        });

    } catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

starter.app.post("/login/verify", starter.express.json(), async (req, res) => {
    try {
        const { name, token } = req.body;

        if (!name || !token)
            return res.status(400).json({ error: "Missing name or password" });

       let result = await validateAccount(sanitizeUsername(name), token)

        return res.status(200).json({
            error: null,
            result
        });

    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

starter.app.post("/login", starter.express.json(), register_limit.middleware(), async (req, res) => {
    try {
        const { name = null, password = null } = req?.body || {};

        if (!name || !password)
            return res.status(400).json({ error: "Missing name or password" });

        const account = await getAccountFromDbByIdOrName(sanitizeUsername(name));
        if (!account)
            return res.status(401).json({ error: "Invalid credentials" });

        if (isTerminated(account?.isTerminated))
            return res.status(403).json({ error: "Account terminated" });

        const valid = await bcrypt.compare(password, account?.password);
        if (!valid)
            return res.status(401).json({ error: "Invalid credentials" });

        return res.status(200).json({
            error: null,
            id: account?.id,
            token: account?.token,
            name: account?.name
        });

    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});



export default (io) => (socket) => {}