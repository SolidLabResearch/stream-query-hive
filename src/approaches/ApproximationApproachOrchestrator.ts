import fs from 'fs';
import { QueryCombiner } from 'hive-thought-rewriter';
import { Orchestrator } from "../orchestrator/Orchestrator";
import { OrchestratorApprox } from "../orchestrator/OrchestratorApprox";
import { ApproximationApproach } from "./ApproximationApproach";

/**
 *
 * @param filePath
 * @param intervalMs
 */
function startResourceUsageLogging(filePath = 'approximation_resource_usage.log', intervalMs = 100) {
  const writeHeader = !fs.existsSync(filePath);
  const logStream = fs.createWriteStream(filePath, { flags: 'a' });
  if (writeHeader) {
    logStream.write('timestamp,cpu_user,cpu_system,rss,heapTotal,heapUsed,heapUsedMB,external\n');
  }
  setInterval(() => {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    const now = Date.now();
    const line = [
      now,
      (cpu.user / 1000).toFixed(2),
      (cpu.system / 1000).toFixed(2),
      mem.rss,
      mem.heapTotal,
      mem.heapUsed,
      (mem.heapUsed / 1024 / 1024).toFixed(2),
      mem.external
    ].join(',') + '\n';
    logStream.write(line);
  }, intervalMs);
}

startResourceUsageLogging('approximation_resource_usage.csv', 100);

/**
 *
 */
async function orchestrateApproximationApproach() {
    const orchestrator = new OrchestratorApprox();
    await executeSubQueries(orchestrator);

    const registeredQuery = `
PREFIX mqtt_broker: <mqtt://localhost:1883/>
PREFIX saref: <https://saref.etsi.org/core/>
PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
PREFIX : <https://rsp.js> 
REGISTER RStream <output> AS
SELECT (AVG(?o) AS ?avgX) (AVG(?o2) AS ?avgY) (AVG(?o3) AS ?avgZ)
FROM NAMED WINDOW :w1 ON STREAM mqtt_broker:accX [RANGE 120000 STEP 30000]
FROM NAMED WINDOW :w2 ON STREAM mqtt_broker:accY [RANGE 120000 STEP 30000]
FROM NAMED WINDOW :w3 ON STREAM mqtt_broker:accZ [RANGE 120000 STEP 30000]
WHERE {
   { WINDOW :w1 {
        ?s saref:hasValue ?o .
        ?s saref:relatesToProperty dahccsensors:x .
}}
    UNION
    { WINDOW :w2 {
        ?s saref:hasValue ?o2 .
        ?s saref:relatesToProperty dahccsensors:y .
    }}
    UNION
    { WINDOW :w3 {
        ?s saref:hasValue ?o3 .
        ?s saref:relatesToProperty dahccsensors:z .
    }}
}
    `;

    console.log("Approximation approach orchestrated successfully.");

    const approximationApproach = new ApproximationApproach(registeredQuery, "output");
    // Run the registered query
    approximationApproach.process();
    // orchestrator.runRegisteredQuery(registeredQuery);
    console.log("Approximation approach orchestrated successfully.");

}

/**
 *
 * @param orchestrator
 */
async function executeSubQueries(orchestrator: OrchestratorApprox) {
    // Add sub-queries
    const query1 = `
            PREFIX mqtt_broker: <mqtt://localhost:1883/>
    PREFIX saref: <https://saref.etsi.org/core/>
PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
PREFIX : <https://rsp.js> 
REGISTER RStream <output> AS
SELECT (AVG(?o) AS ?avgX)
FROM NAMED WINDOW :w1 ON STREAM mqtt_broker:accX [RANGE 60000 STEP 60000]
WHERE {
    WINDOW :w1 {
        ?s saref:hasValue ?o .
        ?s saref:relatesToProperty dahccsensors:x .
    }
}
    `;
    const query2 = `
                PREFIX mqtt_broker: <mqtt://localhost:1883/>
    PREFIX saref: <https://saref.etsi.org/core/>
PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
PREFIX : <https://rsp.js> 
REGISTER RStream <output> AS
SELECT (AVG(?o2) AS ?avgY)
FROM NAMED WINDOW :w2 ON STREAM mqtt_broker:accY [RANGE 60000 STEP 60000]
WHERE {
    WINDOW :w2 {
        ?s saref:hasValue ?o2 .
        ?s saref:relatesToProperty dahccsensors:y .
    }
}
    `;
    
    const query3 = `
                    PREFIX mqtt_broker: <mqtt://localhost:1883/>
    PREFIX saref: <https://saref.etsi.org/core/>
PREFIX dahccsensors: <https://dahcc.idlab.ugent.be/Homelab/SensorsAndActuators/>
PREFIX : <https://rsp.js> 
REGISTER RStream <output> AS
SELECT (AVG(?o3) AS ?avgZ)
FROM NAMED WINDOW :w3 ON STREAM mqtt_broker:accZ [RANGE 60000 STEP 60000]
WHERE {
    WINDOW :w3 {
        ?s saref:hasValue ?o3 .
        ?s saref:relatesToProperty dahccsensors:z .
    }
}
    `;

    orchestrator.addSubQuery(query1);
    orchestrator.addSubQuery(query2);
    orchestrator.addSubQuery(query3);
    console.log("Sub-queries added:", orchestrator.getSubQueries());
}

orchestrateApproximationApproach().catch(console.error);