import test from "node:test";
import assert from "node:assert/strict";
import {
  isMemberId,
  isMemberProfilePublic,
  isSlug,
} from "./department-member-visibility.ts";

const MEMBER_ID = "e1454876-6bed-4797-bded-e0de8dba7fee";

const publishedMember = {
  id: MEMBER_ID,
  publicationStatus: "published",
  isPublic: true,
};

const publishedDepartment = {
  slug: "choir",
  publicationStatus: "published",
  publishedAt: "2026-01-01T00:00:00.000Z",
};

test("validates member identifiers and slugs before any database access", () => {
  assert.equal(isMemberId(MEMBER_ID), true);
  assert.equal(isMemberId("not-a-uuid"), false);
  assert.equal(isMemberId(""), false);
  assert.equal(isSlug("choir"), true);
  assert.equal(isSlug("Sunday Service"), false);
  assert.equal(isSlug(""), false);
});

test("admits a published, approved member of a due department", () => {
  assert.equal(
    isMemberProfilePublic(
      publishedMember,
      publishedDepartment,
      { slug: "choir", memberId: MEMBER_ID },
      new Date("2026-10-22T00:00:00.000Z"),
    ),
    true,
  );
});

test("rejects draft, archived, or unapproved members", () => {
  const route = { slug: "choir", memberId: MEMBER_ID };
  const now = new Date("2026-10-22T00:00:00.000Z");
  assert.equal(
    isMemberProfilePublic(
      { ...publishedMember, publicationStatus: "draft" },
      publishedDepartment,
      route,
      now,
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(
      { ...publishedMember, publicationStatus: "archived" },
      publishedDepartment,
      route,
      now,
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(
      { ...publishedMember, isPublic: false },
      publishedDepartment,
      route,
      now,
    ),
    false,
  );
});

test("rejects member/department mismatches and department mismatches", () => {
  const now = new Date("2026-10-22T00:00:00.000Z");
  assert.equal(
    isMemberProfilePublic(
      { ...publishedMember, id: "11111111-1111-4111-8111-111111111111" },
      publishedDepartment,
      { slug: "choir", memberId: MEMBER_ID },
      now,
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(
      publishedMember,
      publishedDepartment,
      { slug: "media", memberId: MEMBER_ID },
      now,
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(
      publishedMember,
      { ...publishedDepartment, publicationStatus: "draft" },
      { slug: "choir", memberId: MEMBER_ID },
      now,
    ),
    false,
  );
});

test("rejects unpublished and future-dated departments", () => {
  const route = { slug: "choir", memberId: MEMBER_ID };
  assert.equal(
    isMemberProfilePublic(
      publishedMember,
      { ...publishedDepartment, publishedAt: "2999-01-01T00:00:00.000Z" },
      route,
      new Date("2026-10-22T00:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(
      publishedMember,
      { ...publishedDepartment, publishedAt: null },
      route,
      new Date("2026-10-22T00:00:00.000Z"),
    ),
    false,
  );
  assert.equal(
    isMemberProfilePublic(publishedMember, publishedDepartment, {
      slug: "not-a slug!",
      memberId: "not-a-uuid",
    }),
    false,
  );
});
