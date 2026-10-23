import test from "node:test";
import assert from "node:assert/strict";
import { createAdminNoticeTimer } from "./admin-notice-timer.ts";

function fakeTimers() {
  let nextId = 0;
  const pending = new Map();
  return {
    pending,
    host: {
      setTimeout(callback, milliseconds) {
        const id = ++nextId;
        pending.set(id, { callback, milliseconds });
        return id;
      },
      clearTimeout(id) {
        pending.delete(id);
      },
    },
    fire(id) {
      const timer = pending.get(id);
      pending.delete(id);
      timer?.callback();
    },
  };
}

test("admin notice timer dismisses after the configured three seconds", () => {
  const timers = fakeTimers();
  let dismissed = 0;
  const timer = createAdminNoticeTimer(() => dismissed++, timers.host);
  timer.start();

  assert.equal(timers.pending.size, 1);
  const [id, entry] = [...timers.pending.entries()][0];
  assert.equal(entry.milliseconds, 3000);
  timers.fire(id);
  assert.equal(dismissed, 1);
  assert.equal(timers.pending.size, 0);
});

test("replacing a notice resets its timer without duplicate pending timers", () => {
  const timers = fakeTimers();
  let dismissed = 0;
  const timer = createAdminNoticeTimer(() => dismissed++, timers.host);
  timer.start();
  const oldId = [...timers.pending.keys()][0];
  timer.start();

  assert.equal(timers.pending.size, 1);
  assert.equal(timers.pending.has(oldId), false);
  timers.fire([...timers.pending.keys()][0]);
  assert.equal(dismissed, 1);
});

test("cleanup cancels a pending notice timer", () => {
  const timers = fakeTimers();
  let dismissed = 0;
  const timer = createAdminNoticeTimer(() => dismissed++, timers.host);
  timer.start();
  const [id] = timers.pending.keys();
  timer.clear();
  timers.fire(id);

  assert.equal(dismissed, 0);
  assert.equal(timers.pending.size, 0);
});
