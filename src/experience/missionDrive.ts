/**
 * Game 1's moving state, shared by the 3D scene and its HUD without React
 * re-renders. Module-level so the road continues across provinces.
 */
/** Distance driven so far (metres); never reset, so the world never rewinds. */
export const odometer = { current: 0 };
/** The car: sideways offset on the road, current steering, its fixed z, and speed in m/s. */
export const drive = { lateral: 0, steer: 0, z: 2, speed: 0 };
/** The town stop: the odometer reading at which the car is level with the sign, and whose sign it is. */
export const stop = { odo: Number.NEGATIVE_INFINITY, regionId: "" };
