import { ServerResponse, IncomingMessage } from "http";
import { RSPAgentQuery } from "./HTTPServer";


export class POSTHandler {
    public static async handle(request: IncomingMessage, response: ServerResponse, body: string, rspAgentRecord: Record<string, RSPAgentQuery>) {
        response.setHeader("Content-Type", "application/json");


        let parsedBody: any;

        try {
            parsedBody = JSON.parse(body);


        }

        catch (error) {
            response.statusCode = 400;
            const errorResponse = JSON.stringify({
                error: "Invalid JSON"
            });

            response.setHeader("Content-Length", Buffer.byteLength(errorResponse));
            response.write(errorResponse);
            response.end();
            return;
        }

        try {

            switch (request.url) {
                case "/register": {
                    await this.registerQueryAndAgent(parsedBody, response, rspAgentRecord);
                    break;
                }
            }

        } catch (error) {
            if (!response.headersSent) {
                response.statusCode = 500;
                const errorResponse = JSON.stringify({
                    error: "Internal Server Error",
                    message: error instanceof Error ? error.message : "Unknown Error"
                });

                response.setHeader("Content-Length", Buffer.byteLength(errorResponse));
                response.write(errorResponse);

                response.end();
            }
        }
    }

    private static async registerQueryAndAgent(parsedBody: any, response: ServerResponse, rspAgentRecord: any) {
        if (!parsedBody.id || !parsedBody.rspql_query || !parsedBody.rstream_topic || !parsedBody.data_topic) {
            response.writeHead(400);
            response.end(JSON.stringify({
                error: 'Missing Required Fields'
            }));
            return;
        }

        rspAgentRecord[parsedBody.id] = parsedBody;

        response.writeHead(200);

        response.end(JSON.stringify({
            message: 'Registered',
        }));
        return;
    }
}

