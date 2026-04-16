import localtunnel from "localtunnel";

const port = Number(process.env.PORT || 3000);

const tunnel = await localtunnel({
  port,
  local_host: "127.0.0.1",
});

console.log(`PUBLIC_URL=${tunnel.url}`);

tunnel.on("close", () => {
  console.log("PUBLIC_TUNNEL_CLOSED");
  process.exit(0);
});

process.on("SIGINT", () => tunnel.close());
process.on("SIGTERM", () => tunnel.close());

setInterval(() => {}, 60_000);
