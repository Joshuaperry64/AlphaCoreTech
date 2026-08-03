import { syncFromServer } from './src/components/db_sync.js';

// Mock localStorage
globalThis.localStorage = {
  setItem: () => {}
};

// Mock fetch to simulate network delay
globalThis.fetch = async (url) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: async () => ({ data: "mock" })
      });
    }, 100);
  });
};

async function runBenchmark() {
  const start = performance.now();
  await syncFromServer();
  const end = performance.now();
  console.log(`Execution time: ${end - start} ms`);
}

runBenchmark();
