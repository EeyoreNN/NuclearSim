/**
 * physics/index.js — Nuclear Physics Engine public API
 *
 * Re-exports all physics module APIs for use by other agents.
 * No Three.js dependencies — pure physics calculations only.
 */

export {
  blastRadius,
  allBlastRings,
  optimalBurstHeight,
  fireballRadius,
  craterRadius,
  BLAST_REF_RADII
} from './BlastCalculator.js';

export {
  thermalRadius,
  thermalFluence,
  allThermalRings,
  THERMAL_REF_RADII_1KT
} from './ThermalCalculator.js';

export {
  promptRadiationRadius,
  falloutArrivalTime,
  doseRateAtTime,
  accumulatedDose,
  FALLOUT_CONTOURS
} from './RadiationCalculator.js';

export { FalloutPlume }      from './FalloutPlume.js';
export { CasualtyEstimator } from './CasualtyEstimator.js';
export { PopulationGrid }    from './PopulationGrid.js';

export {
  estimateSoot,
  winterSeverity
} from './NuclearWinter.js';

// Convenience constant used by multiple modules
export const EARTH_RADIUS_KM = 6371;
