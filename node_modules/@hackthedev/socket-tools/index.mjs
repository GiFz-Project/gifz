import {Server} from "socket.io";
import {pathToFileURL} from "url";
import Logger from "@hackthedev/terminal-logger";
import path from "path";
import fs from "fs";

export default class SocketTools {
    constructor({
                    expressHttpServer,
                    maxHttpBufferSize,
                    pingInterval,
                    pingTimeout,
                    modulesDir,
                    cors = {}
                } = {}) {

        if (!expressHttpServer) throw new Error("SocketTools: expressHttpServer is required");
        if (!maxHttpBufferSize) maxHttpBufferSize = 1e8;
        if (!pingInterval) pingInterval = 25000;
        if (!pingTimeout) pingTimeout = 60000;
        if (!modulesDir) this.modulesDir = path.join(process.cwd(), "modules/sockets");

        if (!cors?.origin) cors.origin = "*";
        if (!cors?.methods) cors.methods = ["GET", "POST"];
        if (!cors?.credentials) cors.credentials = false;

        this.socketHandlers = [];
        this.activeSockets = new Map();

        this.io = new Server(expressHttpServer, {
            maxHttpBufferSize,
            secure: true,
            pingInterval,
            pingTimeout,
            cors
        });

        this.loadSocketHandlers(this.modulesDir);
    }

    getSocketIp(socket){
        return socket?.handshake?.headers["x-forwarded-for"]?.split(",")[0].trim()
            || socket?.handshake?.headers["x-real-ip"]
            || socket?.handshake?.address;
    }

    listen({
               onDisconnect = null,
               onConnection = null
           } = {}) {

        this.io.on("connection", async (socket) => {

            this.registerSocketEvents(socket);
            socket.on("disconnect", () => {

            })
        })
    }

    async loadSocketHandlers(mainHandlersDir) {
        const fileList = [];

        const scanDir = (dir) => {
            const files = fs.readdirSync(dir, {withFileTypes: true});
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    scanDir(filePath);
                }
                else if (file.name.endsWith(".mjs")) {
                    fileList.push(filePath);
                }
            }
        };

        scanDir(mainHandlersDir);

        for (const filePath of fileList) {
            const fileUrl = pathToFileURL(filePath).href;
            try {
                const {default: handlerFactory} = await import(fileUrl);
                const handler = handlerFactory(this.io);

                if (typeof handler === "function") {
                    this.socketHandlers.push(handler);
                    Logger.debug(`Preloaded socket handler: ${filePath}`);
                }
                else {
                    Logger.warn(`Ignored invalid socket handler in ${filePath}`);
                }
            } catch (err) {
                Logger.error(`Error importing socket handler: ${fileUrl}`);
                Logger.error(err);
            }
        }
    }

    registerSocketEvents(socket) {
        try {
            const attachedHandlers = [];

            for (const handler of this.socketHandlers) {
                const cleanup = handler(socket);
                if (typeof cleanup === "function") {
                    attachedHandlers.push(cleanup);
                }
            }

            this.activeSockets.set(socket.id, attachedHandlers);
        } catch (err) {
            console.error("Error registering socket events:", err);
        }
    }
}