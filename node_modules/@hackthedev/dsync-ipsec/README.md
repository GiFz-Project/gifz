# dSyncIPSec
This library comes with features meant to prevent abuse in form of spam and other malicious activities and comes with the following detections and features:

- Block known abusers, bogon IPs, datacenters, crawlers, proxies, satelites, Tor IPs and VPNs.
- Possibility to block traffic from entire Countries
- Whitelist and Blacklist feature based on IP address and Company Domains

The library was designed for usage with `express` and filtering abusive and (potentially) malicious traffic based on the IP address.

> [!IMPORTANT]
>
> It is highly recommended that you cache or store the API response!!!!

------

## Setup

```js
import dSyncIPSec from "@hackthedev/dsync-ipsec"

// will use default settings
export let ipsec = new dSyncIPSec();

// alternatively, with settings already specified.
// settings shown here are the default settings.
export let ipsec = new dSyncIPSec({
    blockBogon: true,
    blockDatacenter: true,
    blockSatelite: true,
    blockCrawler: true,
    blockProxy: true,
    blockVPN: true,
    blockTor: true,
    blockAbuser: true,
    // some arrays
    whitelistedUrls: [],
    whitelistedIps: [],
    blockedCountryCodes: [],
    whitelistedCompanyDomains: [],
    blacklistedIps = [
        "::1",
        "127.0.0.1",
        "localhost"
    ]
}); 
```

------

## Updating settings

```js
// you can only specify the keys that you actually want to update
ipsec.updateRule({
    blockBogon: true,
    blockSatelite: true,
    blockCrawler: true,
    blockProxy: true,
    blockVPN: true,
    blockTor: true,
    blockAbuser: true,

    whitelistedUrls: [],
    whitelistedIps: [],
    blacklistedIps: [],
    companyDomainWhitelist: [],
});
```

------

## Filtering express traffic

```js
await ipsec.filterExpressTraffic(app)
```

------

## Manually getting IP Info

```js
await lookupIP("1.1.1.1")
```

Example response object:

```json
{
  "ip": "1.1.1.1",
  "rir": "APNIC",
  "is_bogon": false,
  "is_mobile": false,
  "is_satellite": false,
  "is_crawler": false,
  "is_datacenter": true,
  "is_tor": false,
  "is_proxy": false,
  "is_vpn": false,
  "is_abuser": true,
  "datacenter": {
    "datacenter": "kamatera.com",
    "network": "1.1.1.1/24",
    "country": "HK",
    "city": "Hong Kong",
    "postal": "0"
  },
  "company": {
    "name": "APNIC Research and Development",
    "abuser_score": "0.0156 (Elevated)",
    "domain": "apnic.net",
    "type": "business",
    "network": "1.1.1.0 - 1.1.1.255",
    "whois": "https://api.ipapi.is/?whois=1.1.1.0"
  },
  "abuse": {
    "name": "APNIC Research and Development",
    "address": "6 Cordelia St",
    "email": "helpdesk@apnic.net",
    "phone": "+61-7-38583100"
  },
  "asn": {
    "asn": 13335,
    "abuser_score": "0.0267 (Elevated)",
    "route": "1.1.1.0/24",
    "descr": "CLOUDFLARENET, US",
    "country": "us",
    "active": true,
    "org": "Cloudflare, Inc.",
    "domain": "cloudflare.com",
    "abuse": "abuse@cloudflare.com",
    "type": "hosting",
    "created": "2010-07-14",
    "updated": "2017-02-17",
    "rir": "ARIN",
    "whois": "https://api.ipapi.is/?whois=AS13335"
  },
  "location": {
    "is_eu_member": false,
    "calling_code": "61",
    "currency_code": "AUD",
    "continent": "OC",
    "country": "Australia",
    "country_code": "AU",
    "state": "New South Wales",
    "city": "Sydney",
    "latitude": -33.86785,
    "longitude": 151.20732,
    "zip": "1001",
    "timezone": "Australia/Sydney",
    "local_time": "2026-01-16T15:26:18+11:00",
    "local_time_unix": 1768537578,
    "is_dst": true
  },
  "elapsed_ms": 0.16
}
```

