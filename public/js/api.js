class API {
    static GIFS = class {
        static async getPopularGIFs(timestamp = null, limit = null) {
            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!")

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)")

            let response = await fetch(`/gifs/trending${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`)
            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

        static async getNewGIFs(timestamp = null, limit = null) {
            if (timestamp && typeof timestamp !== "number")
                throw new Error("Timestamp must be a timestamp (number/integer) in miliseconds!")

            if (limit && typeof limit !== "number")
                throw new Error("Limit must be a number (integer)")

            let response = await fetch(`/gifs/new${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`)
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
                `/gifs/search/${searchParam}${timestamp ? `/${timestamp}` : ""}${limit ? `/${limit}` : ""}`
            );

            if (response.status !== 200) throw new Error(response.statusText);

            return response.json();
        }

    }
}