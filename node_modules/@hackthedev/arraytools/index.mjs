export default class ArrayTools {
    static addEntry(arr, value) {
        arr.push(value);
        return arr;
    }

    static removeEntry(arr, value) {
        return arr.filter(v => v !== value);
    }

    static matches(arr, value) {
        return arr.some(v => {
            if (v instanceof RegExp) return v.test(value);

            if (typeof v === "string") {
                const m = v.match(/^\/(.+)\/([gimsuy]*)$/);
                if (m) {
                    try {
                        return new RegExp(m[1], m[2]).test(value);
                    } catch {
                        return false;
                    }
                }
                return v === value;
            }

            return false;
        });
    }

    static merge(...arrays) {
        return arrays.flat();
    }
}
