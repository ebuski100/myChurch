import assert from "node:assert/strict";
import test from "node:test";

const { createServerCookieAdapter } = await import(
  new URL("./server-cookie-adapter.ts", import.meta.url).href
);

function createCookieStore(initialCookies = []) {
  const cookies = new Map(
    initialCookies.map(({ name, value }) => [name, value]),
  );
  const writes = [];

  return {
    cookies,
    writes,
    store: {
      getAll() {
        return [...cookies].map(([name, value]) => ({ name, value }));
      },
      set(name, value, options) {
        writes.push({ name, value, options });
        if (options.maxAge === 0) cookies.delete(name);
        else cookies.set(name, value);
      },
    },
  };
}

test("server cookie adapter reads all cookies and persists SDK writes", () => {
  const { cookies, writes, store } = createCookieStore([
    { name: "existing", value: "old" },
  ]);
  const adapter = createServerCookieAdapter(store, true);

  assert.deepEqual(adapter.getAll(), [{ name: "existing", value: "old" }]);
  adapter.setAll([
    { name: "existing", value: "new", options: { path: "/", maxAge: 60 } },
    { name: "chunk.0", value: "chunk", options: { path: "/" } },
    { name: "obsolete", value: "", options: { path: "/", maxAge: 0 } },
  ]);

  assert.equal(writes.length, 3);
  assert.equal(cookies.get("existing"), "new");
  assert.equal(cookies.get("chunk.0"), "chunk");
  assert.equal(cookies.has("obsolete"), false);
});

test("read-only server render adapter never attempts cookie writes", () => {
  const { cookies, writes, store } = createCookieStore([
    { name: "existing", value: "old" },
  ]);
  const adapter = createServerCookieAdapter(store, false);

  adapter.setAll([
    { name: "existing", value: "new", options: { path: "/" } },
  ]);

  assert.equal(writes.length, 0);
  assert.equal(cookies.get("existing"), "old");
});
