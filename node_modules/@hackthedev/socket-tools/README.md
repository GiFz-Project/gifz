# Socket Toolbox

This small and awesome library was made to simplify a basic socket.io setup by using an existing express server. In this example the express server will be setup with the [express-starter](#) library. The library will scan a directory for files that include socket.io handlers to keep everything modular without pain. Files inside the scanned directory that do not have the required socket handler block will fail to load and cause an error.

```js
import ExpressStarter from "@hackthedev/express-starter"
import SocketTools from "@hackthedev/socket-tools"

// express setup
let starter = new ExpressStarter()
starter.registerErrorHandlers();
starter.registerTemplateMiddleware();
starter.app.use(starter.express.static(starter.dirname + "/public"));
starter.startHttpServer(5000);

// Socket.io Setup
let socketTools = new SocketTools({expressHttpServer: starter.server});
socketTools.listen();
```

------

## Setting up socket events

On default the socket library will recursively scan for `.mjs` files inside the `./modules/sockets` folder relative from what `process.cwd()` returns. These files at a very minimum are required to have this structure:

```js
export default (io) => (socket) => {
    socket.on('hello', function (data, response) {
        response({ error: null, message: "Hi " + data.name })
    });
}
```

You can define multiple socket events and even functions inside or outside of the required `export default (io) => (socket) => {}`  block. You can do literally anything as long as the required block is present, because otherwise it will abort loading that file and logging it as error.

```js
function getLeftMessage(){
    return ", have a great time!";
}

export default (io) => (socket) => {
    socket.on('hello', function (data, response) {
        response({ error: null, message: "Hi " + data.name })
    });
    
    socket.on('bye', function (data, response) {
        response({ error: null, message: "Bye " + data.name + getLeftMessage() })
    });
}
```

------

## Custom sockets directory

You can also specify a custom directory path to scan that for files instead. The default will always be `path.join(process.cwd(), "modules/sockets")`

```js
let socketTools = new SocketTools({expressHttpServer: starter.server, modulesDir: path.join(process.cwd(), "sockets")});
```

------

## Non-socket files in scan directory

If you have files inside the "scan directory" aka `modulesDir` then you can add the following line to the file to avoid the socket toolbox from reporting errors: `export default (io) => (socket) => {}`

By leaving it empty it wont have any real effect and avoids errors and possible crashes.
