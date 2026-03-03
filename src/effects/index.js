/**
 * effects/index.js — Public API for the visual effects subsystem.
 *
 * Usage (in main.js or elsewhere):
 *   import { MissileTrajectory, DetonationSequence, latLonToVector3, ... }
 *     from './effects/index.js';
 */

export { MissileTrajectory, latLonToVector3 } from './MissileTrajectory.js';
export { MushroomCloud }                       from './MushroomCloud.js';
export { ShockwaveRing }                       from './ShockwaveRing.js';
export { ThermalFlash }                        from './ThermalFlash.js';
export { BlastRingOverlay }                    from './BlastRingOverlay.js';
export { DetonationSequence }                  from './DetonationSequence.js';
export {
  mushroomVertexShader,
  mushroomFragmentShader,
  createMushroomMaterial,
} from './MushroomShader.js';
