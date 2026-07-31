import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAcceptFamilyShare,
  canViewSharedWatch,
  isValidInviteEmail,
  normalizeInviteEmail,
} from "./family-shares";

describe("family-shares", () => {
  it("normalizes and validates emails", () => {
    assert.equal(normalizeInviteEmail("  A@B.Com "), "a@b.com");
    assert.equal(isValidInviteEmail("a@b.com"), true);
    assert.equal(isValidInviteEmail("nope"), false);
  });

  it("gates accept by email and status", () => {
    const share = {
      status: "pending" as const,
      invitee_email: "co@example.com",
      owner_parent_id: "owner1",
    };
    assert.equal(
      canAcceptFamilyShare(share, { id: "m1", email: "co@example.com" }).ok,
      true,
    );
    assert.equal(
      canAcceptFamilyShare(share, { id: "m1", email: "other@example.com" }).ok,
      false,
    );
    assert.equal(
      canAcceptFamilyShare(share, { id: "owner1", email: "co@example.com" }).ok,
      false,
    );
  });

  it("allows view only for active members", () => {
    assert.equal(
      canViewSharedWatch(
        {
          status: "active",
          member_profile_id: "m1",
          owner_parent_id: "o1",
        },
        "m1",
      ),
      true,
    );
    assert.equal(
      canViewSharedWatch(
        {
          status: "pending",
          member_profile_id: "m1",
          owner_parent_id: "o1",
        },
        "m1",
      ),
      false,
    );
  });
});
