require("@testing-library/jest-dom");

if (!global.setImmediate) {
  // This is as gross as it looks. It's a workaround for using PouchDB in tests.
  global.setImmediate = global.setTimeout; // ts: as unknown as typeof setImmediate;
}
