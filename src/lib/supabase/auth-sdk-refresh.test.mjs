import assert from "node:assert/strict";
import test from "node:test";
import {
  createServerClient,
  stringFromBase64URL,
  stringToBase64URL,
} from "@supabase/ssr";

const { createServerCookieAdapter } = await import(
  new URL("./server-cookie-adapter.ts", import.meta.url).href
);

const supabaseUrl = "https://project-ref.supabase.co";
const publishableKey = "test-publishable-key";
const cookieName = "sb-project-ref-auth-token";

function makeJwt(payload) {
  const header = stringToBase64URL(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const encodedPayload = stringToBase64URL(JSON.stringify(payload));
  return `${header}.${encodedPayload}.${stringToBase64URL("signature")}`;
}

function createExpiredSessionCookie() {
  const accessToken = makeJwt({
    iss: `${supabaseUrl}/auth/v1`,
    sub: "00000000-0000-0000-0000-000000000001",
    exp: Math.floor(Date.now() / 1000) - 60,
    iat: Math.floor(Date.now() / 1000) - 3600,
    role: "authenticated",
  });
  const value = `base64-${stringToBase64URL(
    JSON.stringify({
      access_token: accessToken,
      refresh_token: "original-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) - 60,
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        role: "authenticated",
      },
    }),
  )}`;

  return { name: cookieName, value };
}

function createAuthClient(fetchMock) {
  let cookies = [createExpiredSessionCookie()];

  return {
    client: createServerClient(supabaseUrl, publishableKey, {
      global: { fetch: fetchMock },
      cookies: createServerCookieAdapter({
        getAll() {
          return cookies;
        },
        set(name, value, options) {
          cookies = cookies.filter((cookie) => cookie.name !== name);
          if (options?.maxAge !== 0 && value) cookies.push({ name, value });
        },
      }, true),
    }),
    getCookies() {
      return cookies;
    },
  };
}

function createAuthFetch() {
  let refreshRequests = 0;
  const refreshTokensUsed = [];
  const fetchMock = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.pathname.endsWith("/auth/v1/token")) {
      refreshRequests += 1;
      let requestBody = init?.body;
      if (typeof requestBody === "string") {
        requestBody = JSON.parse(requestBody);
      } else if (input instanceof Request) {
        requestBody = await input.clone().json();
      }
      refreshTokensUsed.push(requestBody?.refresh_token);
      await new Promise((resolve) => setImmediate(resolve));
      const accessToken = makeJwt({
        iss: `${supabaseUrl}/auth/v1`,
        sub: "00000000-0000-0000-0000-000000000001",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        role: "authenticated",
      });
      const response = Response.json({
        access_token: accessToken,
        refresh_token: `rotated-refresh-token-${refreshRequests}`,
        token_type: "bearer",
        expires_in: 3600,
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          aud: "authenticated",
          role: "authenticated",
        },
      });
      return response;
    }

    if (url.pathname.endsWith("/auth/v1/user")) {
      return Response.json({
        id: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        role: "authenticated",
      });
    }

    throw new Error(`Unexpected Auth endpoint: ${url.pathname}`);
  };

  return {
    fetchMock,
    getRefreshRequestCount: () => refreshRequests,
    getRefreshTokensUsed: () => refreshTokensUsed,
  };
}

test("cookie-backed getClaims refreshes an expired cookie session once", async () => {
  const authFetch = createAuthFetch();
  const { client, getCookies } = createAuthClient(authFetch.fetchMock);

  const { data, error } = await client.auth.getClaims();

  assert.equal(error, null);
  assert.equal(typeof data?.claims?.sub, "string");
  assert.equal(authFetch.getRefreshRequestCount(), 1);
  assert.deepEqual(authFetch.getRefreshTokensUsed(), [
    "original-refresh-token",
  ]);
  const storedCookie = getCookies().find(({ name }) => name === cookieName);
  assert.ok(storedCookie);
  const storedSession = JSON.parse(
    stringFromBase64URL(storedCookie.value.slice("base64-".length)),
  );
  assert.equal(storedSession.refresh_token, "rotated-refresh-token-1");
});
