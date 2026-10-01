import { simulateDamage, type DamageJob } from "./damageSimulation";

self.onmessage = ({ data: job }: MessageEvent<DamageJob>) => {
  const owner = { generation: job.generation, fingerprint: job.fingerprint };
  try {
    const result = simulateDamage(job, progress => self.postMessage({ ...owner, progress }));
    self.postMessage({ ...owner, result });
  } catch (error) {
    self.postMessage({ ...owner, error: error instanceof Error ? error.message : "Simulation failed" });
  }
};
