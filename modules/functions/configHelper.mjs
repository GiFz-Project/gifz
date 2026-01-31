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

    JSONTools.checkObjectKeys(jsonObject, "sql.host", "localhost", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.user", "root", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.pass", "", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.db", "gifz", true);
    JSONTools.checkObjectKeys(jsonObject, "sql.connection_limit", 10, true);

    JSONTools.checkObjectKeys(jsonObject, "port", 2052, true);

    saveConfig("config.json", jsonObject);
}

export function saveConfig(fileName = "config.json", data){
    if(!data) throw new Error("No data provided")
    if(typeof data !== "object") throw new Error("Data needs to be a JSON object");

    let configDir = path.join(process.cwd(), "configs");
    fs.writeFileSync(path.join(configDir, fileName), JSON.stringify(data, null ,4));
}