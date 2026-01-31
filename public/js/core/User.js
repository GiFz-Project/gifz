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
        static get() {
            return {
                id: localStorage.getItem("id"),
                token: localStorage.getItem("token")
            };
        }
        static getName() {
            return localStorage.getItem("name")
        }
        static setId(id) {
            localStorage.setItem("id", id)
        }
        static setName(name) {
            localStorage.setItem("name", name)
        }
        static setToken(token) {
            localStorage.setItem("token", token)
        }
    };
}
