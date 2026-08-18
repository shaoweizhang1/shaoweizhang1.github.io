// Topic hues, spread around the colour wheel by index rather than picked
// from a fixed palette by hash. The palette version kept handing out
// near-neighbours — a set of six topics could easily draw 265, 320 and 340
// and land three bubbles in the same pink-violet corner, which is exactly
// the thing the colour is supposed to distinguish.
//
// The golden angle is what gives the separation: successive multiples of
// 137.5 degrees never revisit a region until the whole circle is covered,
// so any prefix of the sequence is about as spread out as that many hues
// can be. The trade-off is that a topic's hue depends on its position in
// the sorted topic list, so adding a topic can shift the ones after it —
// acceptable, since nothing here relies on a topic keeping one colour
// forever.
const GOLDEN_ANGLE = 137.508;

// Where the sequence starts. Chosen so the first two topics come out blue
// and orange rather than two shades of red.
const HUE_OFFSET = 210;

export function hueForIndex(index: number): number {
  return Math.round((HUE_OFFSET + index * GOLDEN_ANGLE) % 360);
}
