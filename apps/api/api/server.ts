// Vercel entry point: one Node function serves every path (see vercel.json) and the
// back office WebSocket. Local development uses src/local.ts instead.
import { server } from "../src/server.js"

export default server
