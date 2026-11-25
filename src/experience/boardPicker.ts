/**
 * Lets the HTML tray drop a dragged region onto the 3D map: given a screen
 * point, returns the province under it (or null). BoardScene fills it in.
 */
export const boardPicker: { current: ((clientX: number, clientY: number) => string | null) | null } = { current: null };
