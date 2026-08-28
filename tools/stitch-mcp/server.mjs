import { StitchProxy } from "@google/stitch-sdk";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const apiKey = process.env.STITCH_API_KEY;
if (!apiKey) {
  throw new Error("STITCH_API_KEY is required");
}

const proxy = new StitchProxy({ apiKey });
const transport = new StdioServerTransport();
await proxy.start(transport);
