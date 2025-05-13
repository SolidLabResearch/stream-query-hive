import { HTTPServer } from "./services/server/HTTPServer";
import * as bunyan from "bunyan";
import * as fs from 'fs';
import config from './config/httpServerConfig.json';

import { program } from "commander";

function getTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
}

const log_file = fs.createWriteStream(`aggregator-${getTimestamp()}.log`, { flags: 'a' });
const logger = bunyan.createLogger({
    name: "Streaming Query Hive",
    streams: [
        {
            level: 'info',
            stream: log_file
        },
    ],
    serializers: {
        log: (log_data: any) => {
            return {
                ...log_data,
                query_id: log_data.query_id || 'no_query_id',
            }
        }
    }
});

async function main() {
    new HTTPServer(config.port, logger)
}

main().then(() => {
    console.log(`HTTP server has started`);
});