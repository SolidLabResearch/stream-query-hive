
import { IncomingMessage, ServerResponse } from "http";
import { RSPAgentQuery } from "./HTTPServer";

/**
 * GETHandler class
 * Handles GET requests for the RSP Agent.
 * It provides endpoints to fetch queries and check the status of the server.
 * The class is responsible for responding to the requests 
 * and sending the appropriate data back to the client.
 * 
 */
export class GETHandler {
    /**
     *
     * @param request
     * @param response
     * @param rspAgentRecord
     */
    public static async handle(request: IncomingMessage, response: ServerResponse, rspAgentRecord: Record<string, RSPAgentQuery>) {
        if (request.url === "/fetchQueries" && request.method === "GET") {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify(rspAgentRecord));
        }
        else if (request.url === "/status" && request.method === "GET") {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ active: true }));
        }
        else {
            response.writeHead(404, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: "Not Found" }));
            return;
        }
    }
}