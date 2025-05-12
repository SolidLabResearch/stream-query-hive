import { createServer, Server, ServerResponse, IncomingMessage } from "http";
import { GETHandler } from "./GETHandler";
import { POSTHandler } from "./POSTHandler";

export type RSPAgentQuery = {
    id: string,
    rspql_query: string,
    rstream_topic: string,
    data_topic: string
}

export const RSPAgentQueryRecord: Record<string, RSPAgentQuery> = {};

export class HTTPServer {
    private readonly http_server: Server;
    public logger: any;

    constructor(http_port: 8080, logger: any) {
        this.http_server = createServer(this.request_handler.bind(this)).listen(http_port);
        this.logger = logger;
        this.logger.info(`HTTP Server started on port ${http_port}`);
    }


    private async request_handler(request: IncomingMessage, response: ServerResponse) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Allow-Methods", "*");

        let body: string = "";

        switch (request.method) {
            case "GET": {
                this.logger.info(`GET request received: ${request.url}`);
                GETHandler.handle(request, response, RSPAgentQueryRecord);
                return;
            }

            case "POST": {
                body = await new Promise<string>((resolve) => {
                    let data = ""
                    request.on("data", (chunk: Buffer) => {
                        data += chunk.toString();
                    });


                    request.on("end", () => resolve(data));
                });

                this.logger.info(`POST request received: ${request.url}`);

                await POSTHandler.handle(request, response, body, RSPAgentQueryRecord);

                break;
            }

            default: {
                response.statusCode = 405;
                response.setHeader("Content-Type", "application/json");
                const errorResponse = JSON.stringify({ error: "Method Not Allowed" });
                response.setHeader("Content-Length", Buffer.byteLength(errorResponse));
                response.write(errorResponse);
                response.end();
            }
        }
    }
}