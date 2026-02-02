class API {
    static ACCOUNT = class{
        static PERMISSION = class{
            static async check(perm){
                if (!perm)
                    throw new Error("perm was not supplied ")

                let response = await fetch(`/permission/check/${perm}`,
                    {
                        headers: {
                            "Authorization": `Bearer ${User.Auth.get().token}`,
                            "X-User-Name": User.Auth.get().name
                        }
                    });
                if (response.status !== 200) throw new Error(response.statusText);
                return response.json();
            }
        }
    }

    static RESOURCES = class {
        static async Search(hash) {
            if (!hash)
                throw new Error("hash was not supplied in search")

            let response = await fetch(`/resources/search/${hash}`,
                {
                    headers: {
                        "Authorization": `Bearer ${User.Auth.get().token}`,
                        "X-User-Name": User.Auth.get().name
                    }
                });
            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

        static async List(timestamp = null, limit = null) {
            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!")

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)")

            let response = await fetch(`/resources/list${timestamp ? `/${timestamp}` : ""}`,
                {
                    headers: {
                        "Authorization": `Bearer ${User.Auth.get().token}`,
                        "X-User-Name": User.Auth.get().name
                    }
                })
            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }
    }

    static GIFS = class {
        static async getPopularGIFs(timestamp = null, limit = null) {
            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!")

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)")

            let response = await fetch(`/gifs/trending${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`,
                {
                    headers: {
                        "Authorization": `Bearer ${User.Auth.get().token}`,
                        "X-User-Name": User.Auth.get().name
                    }
                })
            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

        static async getNewGIFs(timestamp = null, limit = null) {
            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!")

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)")

            let response = await fetch(`/gifs/new${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`,
                {
                    headers: {
                        "Authorization": `Bearer ${User.Auth.get().token}`,
                        "X-User-Name": User.Auth.get().name
                    }
                })
            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

        static async searchPopularGIFs(searchTermArray, timestamp = null, limit = null) {
            if (!searchTermArray || !searchTermArray.length)
                return await this.getPopularGIFs(timestamp, limit);

            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!");

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)");

            const searchParam = Array.isArray(searchTermArray)
                ? encodeURIComponent(searchTermArray.join(","))
                : encodeURIComponent(searchTermArray);

            let response = await fetch(
                `/gifs/search/${searchParam}${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`,
                {
                    headers: {
                        "Authorization": `Bearer ${User.Auth.get().token}`,
                        "X-User-Name": User.Auth.get().name
                    }
                }
            );

            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

    }
}