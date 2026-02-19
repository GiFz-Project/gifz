import {db, dFiles} from "../../index.mjs";
import bcrypt from "bcrypt";
import {config} from "./configHelper.mjs";

export function isTerminated(terminated){
    if(typeof terminated !== "number") throw new Error("terminated must be a number. Got: " + typeof terminated);
    if(terminated === 0) return false;
    if(terminated === -1) return true;
    if(terminated > 0) return true;
}
export async function hashPassword(password) {
    const saltRounds = 10; // potential config setting, 20 is painful!!!!
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
}

export function generateId(length) {
    let result = '1';
    const characters = '0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length - 1) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export async function getAccountRateLimit(req){
    const { name = null, token = null } = req.body ?? {};

    let account = null;
    if(name && token){
        account = await getAccountFromDbByIdOrName(sanitizeUsername(name));
        if(!await validateAccount(name, token)) account = null;
    }

    return {
        search_rate_limit: account?.search_rate_limit ?? config.ratelimits.gifs.search.ip,
        upload_rate_limit: account?.upload_rate_limit ?? config.ratelimits.gifs.upload.ip,
        file_access_rate_limit: account?.file_access_rate_limit ?? config.ratelimits.files.access.ip,
    }
}

export async function getAccountFromDbByIdOrName(accountId){
    if(!accountId) throw new Error("accountId must be defined");
    let accountRow = await db.queryDatabase("SELECT * FROM accounts WHERE id = ? OR name = ?", [accountId, accountId]);
    if(accountRow?.length === 0) return null;
    return accountRow[0];
}

export async function isAdmin(req){
    const authHeader = req.headers.authorization; // "Bearer <token>"
    const userName = req.headers["x-user-name"];

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if(!userName || !token) return false;

    let account = await getAccountFromDbByIdOrName(userName);
    if(!account) return false;

    if(account?.token === token && account?.isAdmin === 1) return true;
    return false;
}

export async function updateAccountByIdOrName(accountId, column, value){
    if(!accountId) throw new Error("accountId must be defined");
    if(!column) throw new Error("column must be defined");
    if(!value) throw new Error("value must be defined");

    let accountRow = await db.queryDatabase(`UPDATE accounts SET ${column} = ? WHERE id = ? OR name = ?`, [value, accountId, accountId]);
    return accountRow[0];
}
export async function validateAccount(accountId, accountToken){
    if(!accountId || !accountToken) return false;

    let accountObj = await getAccountFromDbByIdOrName(accountId)
    if(accountObj?.token !== accountToken) return false;
    if(isTerminated(accountObj?.isTerminated)) return false;
    return true;
}

export function sanitizeUsername(name){
    return dFiles.sanitizeFilename(name);
}

export async function checkForExistingAccountByIdOrName(name, returnObj = false){
    // check for existing account
    let existingAccount = await getAccountFromDbByIdOrName(sanitizeUsername(name))
    if(existingAccount && !returnObj) return true;
    if(existingAccount && returnObj) return existingAccount;
    return false
}

export async function isAdminAccount(nameOrId){
    if(!nameOrId) throw new Error("nameOrId must be defined");

    let accountRow = await getAccountFromDbByIdOrName(sanitizeUsername(nameOrId))
    if(accountRow?.length === 0) return false;
    return accountRow?.isAdmin === 1;
}

export async function insertAccountIntoDb(id, token, name, passwordHash){
    if(!id) throw new Error("accountId must be defined");
    if(!token) throw new Error("token must be defined");
    if(!name) throw new Error("name must be defined");
    if(!passwordHash) throw new Error("passwordHash must be defined");

    return await db.queryDatabase(
        `INSERT IGNORE INTO accounts (id, token, name, password) VALUES (?,?,?,?)`,
        [id, token, sanitizeUsername(name), passwordHash])
}

export async function createAccount(name, password) {
    if (!name) throw new Error("name must be defined");
    if (!password) throw new Error("password must be defined");

    // check for existing account
    let existingAccount = await checkForExistingAccountByIdOrName(name)
    if (existingAccount) return {error: "Account already exists"};

    // hash pw
    let passwordHash = await hashPassword(password);
    if (!passwordHash) throw new Error("password hashing failed");

    // setup and prep data
    let id = generateId(16);
    let token = generateId(64);
    let clearedName = sanitizeUsername(name)

    // insert into db
    let insertResult = await insertAccountIntoDb(id, token, clearedName, passwordHash);

    return {
        id,
        token,
        clearedName,
        password: passwordHash,
        error: null,
    }
}
