import ArrayTools from "@hackthedev/arraytools"

export default class dSyncIPSec {
    constructor({
                    blockBogon = true,
                    blockDatacenter = true,
                    blockSatelite = true,
                    blockCrawler = true,
                    blockProxy = true,
                    blockVPN = true,
                    blockTor = true,
                    blockAbuser = true,
                    // some arrays
                    whitelistedUrls = [],
                    whitelistedIps = [],
                    blockedCountryCodes = [],
                    whitelistedCompanyDomains = [],
                    blacklistedIps = [
                        "::1",
                        "127.0.0.1",
                        "localhost"
                    ],
                    //
                    checkCache = null,
                    setCache = null
                } = {}) {

        this.blockBogon = blockBogon;
        this.blockDatacenter = blockDatacenter;
        this.blockSatelite = blockSatelite;
        this.blockCrawler = blockCrawler;
        this.blockProxy = blockProxy;
        this.blockVPN = blockVPN;
        this.blockTor = blockTor;
        this.blockAbuser = blockAbuser;

        this.urlWhitelist = whitelistedUrls;
        this.ipWhitelist = whitelistedIps;
        this.ipBlacklist = blacklistedIps;
        this.companyDomainWhitelist = whitelistedCompanyDomains;
        this.blockedCountriesByCode = blockedCountryCodes;

        this.checkCache = checkCache;
        this.setCache = setCache;
    }

    updateRule({
                   blockBogon = null,
                   blockDatacenter = null,
                   blockSatelite = null,
                   blockCrawler = null,
                   blockProxy = null,
                   blockVPN = null,
                   blockTor = null,
                   blockAbuser = null,

                   whitelistedUrls = null,
                   whitelistedIps = null,
                   blockedCountryCodes = null,
                   whitelistedCompanyDomains = null,
                   blacklistedIps = null,
               }) {

        if (blockBogon !== null) this.blockBogon = blockBogon
        if (blockDatacenter !== null) this.blockDatacenter = blockDatacenter
        if (blockSatelite !== null) this.blockSatelite = blockSatelite
        if (blockCrawler !== null) this.blockCrawler = blockCrawler
        if (blockProxy !== null) this.blockProxy = blockProxy
        if (blockVPN !== null) this.blockVPN = blockVPN
        if (blockTor !== null) this.blockTor = blockTor
        if (blockAbuser !== null) this.blockAbuser = blockAbuser

        if (whitelistedUrls !== null) this.urlWhitelist = whitelistedUrls
        if (whitelistedIps !== null) this.ipWhitelist = whitelistedIps
        if (blacklistedIps !== null) this.ipBlacklist = blacklistedIps
        if (blockedCountryCodes !== null) this.blockedCountriesByCode = blockedCountryCodes
    }


    whitelistIP(ip, allowDuplicates = false) {
        if (!ip) throw new Error("Unable to whitelist ip as no ip was provided.");
        if (!ArrayTools.matches(this.ipWhitelist, ip) && !allowDuplicates)
            ArrayTools.addEntry(this.ipWhitelist, ip);
        if (ArrayTools.matches(this.ipBlacklist, ip))
            this.ipBlacklist = ArrayTools.removeEntry(this.ipBlacklist, ip);
    }

    blacklistIp(ip, allowDuplicates = false) {
        if (!ip) throw new Error("Unable to blacklist ip as no ip was provided.");
        if (!ArrayTools.matches(this.ipBlacklist, ip) && !allowDuplicates)
            ArrayTools.addEntry(this.ipBlacklist, ip);
        if (ArrayTools.matches(this.ipWhitelist, ip))
            this.ipWhitelist = ArrayTools.removeEntry(this.ipWhitelist, ip);
    }


    isBlacklistedIp(ip) {
        if (!ip) throw new Error("Coudlnt check ip blacklist as no ip was provided.")
        return ArrayTools.matches(this.ipBlacklist, ip)
    }

    isWhitelistedIp(ip) {
        if (!ip) throw new Error("Coudlnt check ip blacklist as no ip was provided.")
        return ArrayTools.matches(this.ipWhitelist, ip)
    }

    async checkRequest(req) {
        let clientIP = this.getClientIp(req);

        // remove localhost ips
        if(clientIP === "::1" || clientIP === "127.0.0.1") return { allow: true }

        const ipInfo = await this.lookupIP(clientIP);
        if (!ipInfo) return { allow: true };
        if (ipInfo?.blocked === true) return { allow: false };

        const reqPath = req.path;
        if (!reqPath) return { allow: true };

        if (ArrayTools.matches(this.ipBlacklist, ipInfo.ip))
            return { allow: false, code: 403 };

        if (ArrayTools.matches(this.urlWhitelist, reqPath))
            return { allow: true };

        if (ArrayTools.matches(this.ipWhitelist, ipInfo.ip))
            return { allow: true };

        if (ArrayTools.matches(this.companyDomainWhitelist, ipInfo?.company?.domain))
            return { allow: true };

        if (ipInfo.is_bogon && this.blockBogon) return { allow: false, code: 403 };
        if (ipInfo.is_datacenter && this.blockDatacenter) return { allow: false, code: 403 };
        if (ipInfo.is_satelite && this.blockSatelite) return { allow: false, code: 403 };
        if (ipInfo.is_crawler && this.blockCrawler) return { allow: false, code: 403 };
        if (ipInfo.is_proxy && this.blockProxy) return { allow: false, code: 403 };
        if (ipInfo.is_vpn && this.blockVPN) return { allow: false, code: 403 };
        if (ipInfo.is_tor && this.blockTor) return { allow: false, code: 403 };
        if (ipInfo.is_abuser && this.blockAbuser) return { allow: false, code: 403 };

        if (
            ipInfo.location?.country_code &&
            ArrayTools.matches(
                this.blockedCountriesByCode,
                ipInfo.location.country_code.toLowerCase()
            )
        ) return { allow: false, code: 403 };

        return { allow: true };
    }


    filterExpressTraffic(app) {
        app.use(async (req, res, next) => {
            const r = await this.checkRequest(req);
            if (!r.allow) return res.sendStatus(r.code || 403);
            next();
        });
    }


    getClientIp(req) {
        if (!req) throw new Error("Unable to get client ip from req parameter as it wasnt specified or null");
        const xf = req.headers["x-forwarded-for"];
        if (xf) return xf.split(",")[0].trim();
        return req.socket?.remoteAddress || req.connection?.remoteAddress;
    }

    async lookupIP(ip) {
        if (!ip) throw new Error("Unable to lookup ip as it wasnt provided.")

        // if an ip is blacklisted we return with an error "reponse"
        if (this.isBlacklistedIp(ip)) return {error: `IP ${ip} was blacklisted.`, blocked: true};

        // if we use cache we can skip the fetch
        if (this.checkCache && typeof this.checkCache === "function") {
            let ipInfo = await this.checkCache(ip);
            if (ipInfo) return ipInfo;
        }

        // make request to get ip info
        let ipRequest = await fetch(`https://api.ipapi.is/?q=${ip}`);
        if (ipRequest.status === 200) {
            let ipData = await ipRequest.json();

            // possibility to set cache
            if(this.setCache && typeof this.setCache === "function") await this.setCache(ip, ipData);

            return ipData;
        } else {
            return {error: "Failed to fetch IP data"};
        }
    }
}