const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RUNS = 1;
const LOGS_DIR = 'logs/streaming-query-hive';
const APPROACH_CMD = ['node', ['dist/approaches/StreamingQueryHiveApproachOrchestrator.js']];
const PUBLISH_CMD = ['node', ['dist/streamer/src/publish.js']];
const LOG_FILES = [
  'streaming_query_chunk_aggregator_log.csv',
  'streaming_query_hive_resource_log.log',
  'replayer-log.csv'
];
const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

function killLingeringProcesses() {
  try {
    execSync('pkill -f StreamingQueryHiveApproachOrchestrator.js');
  } catch (e) { }
  try {
    execSync('pkill -f publish.js');
  } catch (e) { }
  // Optionally, kill all node processes (uncomment if needed)
  // try { execSync('pkill -f node'); } catch (e) {}
  // Optionally, kill MQTT broker (uncomment if needed)
  // try { execSync('pkill -f mosquitto'); } catch (e) { }
}

async function runOnce(iter) {
  console.log(`--- Streaming Query Hive Run ${iter} ---`);

  killLingeringProcesses(); // Ensure no lingering processes before starting

  const approach = spawn(APPROACH_CMD[0], APPROACH_CMD[1], { stdio: 'inherit' });

  await new Promise(res => setTimeout(res, 2000));
  const publisher = spawn(PUBLISH_CMD[0], PUBLISH_CMD[1], { stdio: 'inherit' });

  const timeout = setTimeout(() => {
    console.log('Timeout reached, killing processes...');
    approach.kill();
    publisher.kill();
    killLingeringProcesses(); // Extra cleanup on timeout
  }, TIMEOUT_MS);

  await new Promise((resolve) => { publisher.on('exit', () => resolve()); });
  await new Promise((resolve) => { approach.on('exit', () => resolve()); });

  clearTimeout(timeout);

  killLingeringProcesses(); // Ensure no lingering processes after run

  const iterDir = path.join(LOGS_DIR, `iteration${iter}`);
  if (!fs.existsSync(iterDir)) fs.mkdirSync(iterDir, { recursive: true });

  for (const file of LOG_FILES) {
    if (fs.existsSync(file)) {
      const newName = path.join(iterDir, file);
      fs.renameSync(file, newName);
    }
  }

  // Terminate the process after files are moved
  process.exit(0);
}

(async () => {
  await runOnce(1);
  // for (let i = 1; i <= RUNS; i++) {
  //   await runOnce(1);
  //   await new Promise(res => setTimeout(res, 2000));
  // }
  console.log('All Streaming Query Hive runs complete.');
})();