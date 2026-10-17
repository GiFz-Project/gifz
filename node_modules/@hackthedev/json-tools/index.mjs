import path from "path";
import fs from "fs";

export default class JSONTools {
    static checkObjectKeys(obj, path, defaultValue = null, mutate = false) {
        const keys = path.split('.');

        function recursiveCheck(currentObj, keyIndex) {
            const key = keys[keyIndex];

            if (key === '*') {
                for (const k in currentObj) {
                    if (currentObj.hasOwnProperty(k)) {
                        recursiveCheck(currentObj[k], keyIndex + 1);
                    }
                }
            } else {
                if (!(key in currentObj)) {
                    currentObj[key] = (keyIndex === keys.length - 1) ? defaultValue : {};
                }
                if (keyIndex < keys.length - 1) {
                    recursiveCheck(currentObj[key], keyIndex + 1);
                }
            }
        }

        if(mutate) recursiveCheck(obj, 0);
        recursiveCheck(structuredClone(obj), 0);
    }

    static createConfig(filePath){
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath, "{}", {recursive: true});
        }
    }

    static saveConfig(filePath, content){
        fs.writeFileSync(filePath, JSON.stringify(content, null, 4), {recursive: true});
    }

    static getConfig(configPath){
        return fs.existsSync(configPath) ? this.tryParse(fs.readFileSync(configPath, {encoding: "utf-8"})) : {};
    }

    static tryParse(jsonString){
        if(!jsonString) throw new Error("Invalid JSON string");
        if(typeof jsonString !== "string") throw new Error(`Suplpied JSON string was not a string. Type: ${typeof jsonString}`);

        try{
            return JSON.parse(jsonString);
        }catch(e){
            console.error(e);
            return null;
        }
    }

    static findInJson(obj, keyToFind, valueToFind, returnPath = false) {
        let result = null;
        let foundPath = "";

        function search(currentObj, currentPath = "") {
            if (typeof currentObj !== "object" || currentObj === null) {
                return;
            }

            for (const key in currentObj) {
                let newPath = currentPath ? `${currentPath}.${key}` : key;

                if (key === keyToFind && currentObj[key] === valueToFind) {
                    if (currentPath.includes("channel")) {
                        result = currentObj;
                        foundPath = currentPath;
                        return;
                    }
                }

                if (typeof currentObj[key] === "object" && currentObj[key] !== null) {
                    search(currentObj[key], newPath);
                    if (result) return;
                }
            }
        }

        search(obj);

        return returnPath ? foundPath : result;
    }
}