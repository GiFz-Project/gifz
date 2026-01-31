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
                    ]
                } = {}) {

        this.blockBogon = blockBogon;
        this.blockDatacenter = blockDatacenter;
        this.blockSatelite = blockSatelite;
        this.blockCrawler = blockCrawler;
        this.blockProxy = blockProxy;
        this.blockVPN = blockVPN;
        this.blockTor = blockTor;
        this.blockAbuser = blockAbuser;

        this.urlWhitelist = whitelistedUrls
        this.ipWhitelist = whitelistedIps
        this.ipBlacklist = blacklistedIps
        this.companyDomainWhitelist = whitelistedCompanyDomains
        this.blockedCountriesByCode = blockedCountryCodes
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
                }){

        if(blockBogon !== null) this.blockBogon = blockBogon
        if(blockDatacenter !== null) this.blockDatacenter = blockDatacenter
        if(blockSatelite !== null) this.blockSatelite =blockSatelite
        if(blockCrawler !== null) this.blockCrawler = blockCrawler
        if(blockProxy !== null) this.blockProxy = blockProxy
        if(blockVPN !== null) this.blockVPN = blockVPN
        if(blockTor !== null) this.blockTor = blockTor
        if(blockAbuser !== null) this.blockAbuser = blockAbuser

        if (whitelistedUrls !== null) this.urlWhitelist = whitelistedUrls
        if (whitelistedIps !== null) this.ipWhitelist = whitelistedIps
        if (blacklistedIps !== null) this.ipBlacklist = blacklistedIps
        if (blockedCountryCodes !== null) this.blockedCountriesByCode = blockedCountryCodes
    }


    whitelistIP(ip, allowDuplicates = false){
        if(!ip) throw new Error("Unable to whitelist ip as no ip was provided.");
        if(!ArrayTools.matches(this.ipWhitelist, ip) && !allowDuplicates)
            ArrayTools.addEntry(this.ipWhitelist, ip);
        if(ArrayTools.matches(this.ipBlacklist, ip))
            this.ipBlacklist = ArrayTools.removeEntry(this.ipBlacklist, ip);
    }

    blacklistIp(ip, allowDuplicates = false){
        if(!ip) throw new Error("Unable to blacklist ip as no ip was provided.");
        if(!ArrayTools.matches(this.ipBlacklist, ip) && !allowDuplicates)
            ArrayTools.addEntry(this.ipBlacklist, ip);
        if(ArrayTools.matches(this.ipWhitelist, ip))
            this.ipWhitelist = ArrayTools.removeEntry(this.ipWhitelist, ip);
    }


    isBlacklistedIp(ip){
        if(!ip) throw new Error("Coudlnt check ip blacklist as no ip was provided.")
        return ArrayTools.matches(this.ipBlacklist, ip)
    }

    isWhitelistedIp(ip){
        if(!ip) throw new Error("Coudlnt check ip blacklist as no ip was provided.")
        return ArrayTools.matches(this.ipWhitelist, ip)
    }

    async filterExpressTraffic(app){
        if(!app) throw new Error("Unable to filter express traffic as no express app was provided.");

        app.use(async (req, res, next) => {
            const ipInfo = await this.lookupIP(this.getClientIp(req));
            if (!ipInfo) return next();

            // whitelist some urls for functionality
            let reqPath = req.path;
            if(!reqPath) throw new Error("Unable to get request path from req parameter as it wasnt specified or null");

            // first check for ip blacklist
            if(ArrayTools.matches(this.ipBlacklist, ipInfo?.ip)) return res.sendStatus(403);

            // then we can check for whitelisted urls as these bypass normal checks
            // url whitelist
            if(ArrayTools.matches(this.urlWhitelist, reqPath)) return next();
            // let whitelisted ips pass
            if(ArrayTools.matches(this.ipWhitelist, ipInfo?.ip)) return next();
            // company domain whitelist
            if(ArrayTools.matches(this.companyDomainWhitelist, ipInfo?.company?.domain)) return next();

            // looking kinda beautiful
            if (ipInfo?.is_bogon && this.blockBogon) return res.sendStatus(403);
            if (ipInfo?.is_datacenter && this.blockDatacenter) return res.sendStatus(403);
            if (ipInfo?.is_satelite && this.blockSatelite) return res.sendStatus(403);
            if (ipInfo?.is_crawler && this.blockCrawler) return res.sendStatus(403);
            if (ipInfo?.is_proxy && this.blockProxy) return res.sendStatus(403);
            if (ipInfo?.is_vpn && this.blockVPN) return res.sendStatus(403);
            if (ipInfo?.is_tor && this.blockTor) return res.sendStatus(403);
            if (ipInfo?.is_abuser && this.blockAbuser) return res.sendStatus(403);

            if (
                ipInfo.location?.country_code &&
                ArrayTools.matches(this.blockedCountriesByCode, ipInfo?.location?.country_code?.toLowerCase())
            ) return res.sendStatus(403);

            // continue
            next();
        });
    }

    getClientIp(req) {
        if(!req) throw new Error("Unable to get client ip from req parameter as it wasnt specified or null");
        const xf = req.headers["x-forwarded-for"];
        if (xf) return xf.split(",")[0].trim();
        return req.socket?.remoteAddress || req.connection?.remoteAddress;
    }

    async lookupIP(ip){
        if(!ip) throw new Error("Unable to lookup ip as it wasnt provided.")

        // if an ip is blacklisted we return with an error "reponse"
        if(this.isBlacklistedIp(ip)) return {error: `IP ${ip} was local.`};

        // make request to get ip info
        let ipRequest = await fetch(`https://api.ipapi.is/?q=${ip}`);
        if(ipRequest.status === 200){
            let ipData = await ipRequest.json();
            return ipData;
        }
        else{
            return {error: "Failed to fetch IP data"};
        }
    }
}