import fs from "fs";

export default class Logger {
    static logDebug = false;

    static colors = {
        reset: "\x1b[0m",
        bright: "\x1b[1m",
        dim: "\x1b[2m",
        underscore: "\x1b[4m",
        blink: "\x1b[5m",
        reverse: "\x1b[7m",
        hidden: "\x1b[8m",

        fgBlack: "\x1b[30m",
        fgRed: "\x1b[31m",
        fgGreen: "\x1b[32m",
        fgYellow: "\x1b[33m",
        fgBlue: "\x1b[34m",
        fgMagenta: "\x1b[35m",
        fgCyan: "\x1b[36m",
        fgWhite: "\x1b[37m",
        fgGray: "\x1b[90m",

        bgBlack: "\x1b[40m",
        bgRed: "\x1b[41m",
        bgGreen: "\x1b[42m",
        bgYellow: "\x1b[43m",
        bgBlue: "\x1b[44m",
        bgMagenta: "\x1b[45m",
        bgCyan: "\x1b[46m",
        bgWhite: "\x1b[47m"
    };

    static log(level, message, color = Logger.colors.fgWhite) {
        if (message instanceof Error) {
            Logger.printErrorWithFrame(level, message, color);
            return;
        }

        console.log(
            `${color}${Logger.displayDate()}[${level}] ${message}${Logger.colors.reset}`
        );
    }

    static printErrorWithFrame(level, err, color) {
        const reset = Logger.colors.reset;

        console.log(
            `${color}${Logger.displayDate()}[${level}] ${err.name}: ${err.message}${reset}`
        );

        if (!err.stack) return;

        const stackLines = err.stack.split("\n");
        const firstFrame = stackLines.find(l => l.includes("(") && l.includes(":"));
        const match = firstFrame?.match(/\((.*):(\d+):(\d+)\)/);

        if (!match) {
            console.log(`${color}${err.stack}${reset}`);
            return;
        }

        const [, file, lineStr, colStr] = match;
        const line = parseInt(lineStr, 10);
        const col = parseInt(colStr, 10);

        try {
            const lines = fs.readFileSync(file, "utf8").split("\n");
            const start = Math.max(0, line - 3);
            const end = Math.min(lines.length, line + 2);

            for (let i = start; i < end; i++) {
                const ln = String(i + 1).padStart(3, " ");
                console.log(`${color}${ln} | ${lines[i]}${reset}`);
                if (i + 1 === line) {
                    console.log(
                        `${color}    | ${" ".repeat(Math.max(col - 1, 0))}^${reset}`
                    );
                }
            }
        } catch {
        }

        for (const l of stackLines.slice(1)) {
            console.log(`${color}${l}${reset}`);
        }
    }


    static space(amount = 1) {
        for (let i = 0; i < amount; i++) console.log(" ");
    }

    static info(message, color = "") {
        Logger.log(
            "INFO",
            message,
            color ? Logger.colors.fgCyan + color : Logger.colors.fgCyan
        );
    }

    static success(message, color = "") {
        Logger.log(
            "SUCCESS",
            message,
            color ? Logger.colors.fgGreen + color : Logger.colors.fgGreen
        );
    }

    static warn(message, color = "") {
        Logger.log(
            "WARN",
            message,
            color ? Logger.colors.fgYellow + color : Logger.colors.fgYellow
        );
    }

    static error(message, color = "") {
        Logger.log(
            "ERROR",
            message,
            color ? Logger.colors.fgRed + color : Logger.colors.fgRed
        );
    }

    static debug(message, color = "") {
        if (!Logger.logDebug) return;
        Logger.log(
            "DEBUG",
            message,
            color
                ? Logger.colors.bright + Logger.colors.fgBlack + color
                : Logger.colors.bright + Logger.colors.fgBlack
        );
    }

    static displayDate() {
        const d = new Date();
        const date =
            d.getFullYear() +
            "-" +
            String(d.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(d.getDate()).padStart(2, "0");
        const time =
            String(d.getHours()).padStart(2, "0") +
            ":" +
            String(d.getMinutes()).padStart(2, "0") +
            ":" +
            String(d.getSeconds()).padStart(2, "0");
        return `[${date} ${time}] `;
    }
}
