import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSyncUser } from "@/hooks/useSyncUser";

// ---- Mock @clerk/clerk-react ----
const mockUseUser = vi.fn();
vi.mock("@clerk/clerk-react", () => ({
  useUser: () => mockUseUser(),
}));

// ---- Mock @/lib/supabase ----
const mockUpsert = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      upsert: mockUpsert,
    }),
  },
}));

describe("useSyncUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when user is not signed in", () => {
    mockUseUser.mockReturnValue({ isSignedIn: false, user: null });

    renderHook(() => useSyncUser());

    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("calls supabase upsert with correct payload when signed in", async () => {
    const fakeUser = {
      id: "clerk_123",
      primaryEmailAddress: { emailAddress: "test@example.com" },
      fullName: "Test User",
    };

    mockUseUser.mockReturnValue({ isSignedIn: true, user: fakeUser });
    mockUpsert.mockResolvedValue({ error: null });

    renderHook(() => useSyncUser());

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        clerk_user_id: "clerk_123",
        email: "test@example.com",
        full_name: "Test User",
      },
      { onConflict: "clerk_user_id" }
    );
  });

  it("does not set or overwrite the role field", async () => {
    const fakeUser = {
      id: "clerk_456",
      primaryEmailAddress: { emailAddress: "admin@example.com" },
      fullName: "Admin User",
    };

    mockUseUser.mockReturnValue({ isSignedIn: true, user: fakeUser });
    mockUpsert.mockResolvedValue({ error: null });

    renderHook(() => useSyncUser());

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledTimes(1);
    });

    // Assert the upserted object does NOT contain a `role` key
    const upsertedPayload = mockUpsert.mock.calls[0][0];
    expect(upsertedPayload).not.toHaveProperty("role");
  });

  it("logs error on supabase failure without throwing", async () => {
    const fakeUser = {
      id: "clerk_789",
      primaryEmailAddress: { emailAddress: "fail@example.com" },
      fullName: "Fail User",
    };

    mockUseUser.mockReturnValue({ isSignedIn: true, user: fakeUser });
    mockUpsert.mockResolvedValue({
      error: { message: "some db error" },
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useSyncUser());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "[useSyncUser] Supabase upsert error:",
        "some db error"
      );
    });

    consoleSpy.mockRestore();
  });
});
