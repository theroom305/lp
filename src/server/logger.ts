import pino from "pino";

export const logger = pino({
  name: "room305-lp",
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "room305-lp",
  },
});
