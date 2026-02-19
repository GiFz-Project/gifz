import fs from "fs"
import JSONTools from "@hackthedev/json-tools"
import path from "path";

export let config = null;

export function getConfigObject(fileName = "config.json", forceReload = false){
    let configDir = path.join(process.cwd(), "configs");
    let mainConfigPath = path.join(process.cwd(), "configs", fileName);

    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, {recursive: true});
    if (!fs.existsSync(mainConfigPath)) fs.writeFileSync(mainConfigPath, "{}");

    if(!config) config = JSONTools.tryParse(fs.readFileSync(path.join(configDir, fileName), "utf8"))
    if(forceReload) config = JSONTools.tryParse(fs.readFileSync(path.join(configDir, fileName), "utf8"))

    buildConfig(config);

    return config;
}

function buildConfig(jsonObject){
    if(!jsonObject) throw new Error("No JSON object provided")
    if(typeof jsonObject !== "object") throw new Error("Data needs to be a JSON object");

    JSONTools.checkObjectKeys(jsonObject, "instance.info.title", "GiFz - Open Source GIF API", true);
    JSONTools.checkObjectKeys(jsonObject, "instance.info.footer", `
        <a href="https://github.com/GiFz-Project/gifz">Github</a>&bullet;
        <a href="https://ko-fi.com/shydevil">Donate</a>
    `, true);
    JSONTools.checkObjectKeys(jsonObject, "instance.info.rules", `
        <ul>
            <li>No Copyright Protected Material</li>
            <li>No illegal content (CSAM, ...)</li>
        </ul>
    `, true);


    JSONTools.checkObjectKeys(jsonObject, "sql.host", "localhost", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.user", "root", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.pass", "", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.db", "gifz", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.connection_limit", 10, true);

    JSONTools.checkObjectKeys(jsonObject, "port", 2052, true);

    JSONTools.checkObjectKeys(jsonObject, "storage.max_size_gb", 2, true);
    JSONTools.checkObjectKeys(jsonObject, "storage.path", "./public/uploads/", true);

    // Rate Limits :P
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.search.max_amount", 50, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.search.ip", 50, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.search.total", 20_000, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.search.block_duration", "20 minutes", true);
    //
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.upload.ip", 10, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.upload.total", 2_000, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.gifs.upload.block_duration", "10 minutes", true);
    //
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.files.access.ip", 200, true);
    JSONTools.checkObjectKeys(jsonObject, "ratelimits.files.access.total", 80_000, true);



    JSONTools.checkObjectKeys(jsonObject, "uploads.default_status", "pending", true);
    JSONTools.checkObjectKeys(jsonObject, "uploads.max_tags", 20, true);
    JSONTools.checkObjectKeys(jsonObject, "uploads.trending_duration", 30, true);
    JSONTools.checkObjectKeys(jsonObject, "uploads.upload_limit", 10, true);

    saveConfig("config.json", jsonObject);
}

export function saveConfig(fileName = "config.json", data){
    if(!data) throw new Error("No data provided")
    if(typeof data !== "object") throw new Error("Data needs to be a JSON object");

    let configDir = path.join(process.cwd(), "configs");
    fs.writeFileSync(path.join(configDir, fileName), JSON.stringify(data, null ,4));
}