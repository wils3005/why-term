import { spawn } from "child_process";
import { join } from "path";

import fastify, {
  FastifyError,
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import fastifyStatic from "fastify-static";
import fastifyWebsocket, { WebsocketHandler } from "fastify-websocket";
import pino, { stdTimeFunctions } from "pino";
import { z } from "zod";

type ErrorHandler = (
  this: FastifyInstance,
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

const websocketHandler: WebsocketHandler = ({ socket }) => {
  const childProcess = spawn(SHELL);
  const { stdin, stdout, stderr } = childProcess;

  stdout
    .on("error", (error) => logger.error({ error }, "STDOUT ERROR"))
    .on("readable", () => {
      const message = String(stdout.read());
      logger.debug({ message }, "STDOUT READABLE");

      switch (message) {
        case "null":
        case "undefined":
          break;
        default:
          socket.send(message);
      }
    });

  stderr
    .on("error", (error) => logger.error({ error }, "STDERR ERROR"))
    .on("readable", () => {
      const message = String(stderr.read());
      logger.debug({ message }, "STDERR READABLE");

      switch (message) {
        case "null":
        case "undefined":
          break;
        default:
          socket.send(message);
      }
    });

  socket
    .on("error", (error) => logger.error({ error }, "WEBSOCKET ERROR"))
    .on("message", (rawData) => {
      const message = String(rawData);
      logger.debug({ message }, "WEBSOCKET MESSAGE");

      switch (message) {
        case "sigterm":
          childProcess.kill("SIGTERM");
          break;
        default:
          stdin.write(rawData);
          stdin.write("\n");
      }
    });
};

const errorHandler: ErrorHandler = async function (error, _, reply) {
  await reply.status(400).send(error);
};

const { FASTIFY_HOST, FASTIFY_PORT, PINO_LOG_LEVEL, SHELL } = z
  .object({
    FASTIFY_HOST: z.string().nonempty(),
    FASTIFY_PORT: z.string().nonempty().transform(Number),
    PINO_LOG_LEVEL: z.string().nonempty(),
    SHELL: z.string().nonempty(),
  })
  .parse(process.env);

const logger = pino({
  level: PINO_LOG_LEVEL,
  redact: [],
  timestamp: stdTimeFunctions.isoTime,
});

process.on("uncaughtException", (error) => {
  logger.error({ error }, "UNCAUGHT EXCEPTION");
  process.exit(1);
});

void fastify({ logger })
  .register(fastifyStatic, { root: join(process.cwd(), "static/") })
  .register(fastifyWebsocket)
  .setErrorHandler(errorHandler)
  .get("/api", { websocket: true }, websocketHandler)
  .listen({ host: FASTIFY_HOST, port: FASTIFY_PORT });
