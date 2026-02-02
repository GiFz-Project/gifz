class User {
    static Icon = class {
        static get() {
            return localStorage.getItem("icon");
        }
        static set(value) {
            localStorage.setItem("icon", value);
        }
    };

    static generateId(length) {
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

    static Auth = class {
        static async register(name, password) {
            if (!name || !password)
                throw new Error("Missing name or password");

            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password })
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Register failed");

            localStorage.setItem("id", data.id);
            localStorage.setItem("token", data.token);

            return data;
        }

        static async login(name, password) {
            if (!name || !password)
                throw new Error("Missing name or password");

            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, password })
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Login failed");

            this.setName(data?.name)
            this.setToken(data?.token)
            return data;
        }

        static isLoggedIn() {
            return !!this.get();
        }

        static get() {
            return {
                name: localStorage.getItem("name"),
                token: localStorage.getItem("token")
            };
        }
        static setName(name) {
            localStorage.setItem("name", name)
        }
        static setToken(token) {
            localStorage.setItem("token", token)
        }
    };
}
