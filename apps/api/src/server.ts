import { createApp } from "@/app";
import { env } from "@/lib/env";

async function start() {
  const app = await createApp();
  await app.listen({
    host: env.apiHost,
    port: env.apiPort,
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
