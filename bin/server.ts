#!/usr/bin/env node

/**
 * Module dependencies.
 */
import app from "../app";
const debug = require("debug")("spark-store-sever:server");
import http from "http";

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "2345");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: { syscall: string; code: any }) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  if (error.code === "EACCES") {
    console.error(bind + " requires elevated privileges");
    process.exit(1);
  } else if (error.code === "EADDRINUSE") {
    console.error(bind + " is already in use");
    process.exit(1);
  } else {
    throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
}
