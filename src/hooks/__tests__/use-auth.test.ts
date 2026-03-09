import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

describe("useAuth", () => {
  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    it("sets isLoading to true during sign-in and resets after", async () => {
      const { result } = renderHook(() => useAuth());

      let resolve!: (v: any) => void;
      const deferred = new Promise((r) => { resolve = r; });
      mockSignInAction.mockReturnValue(deferred as any);

      let signInPromise: Promise<any>;
      act(() => { signInPromise = result.current.signIn("user@example.com", "password"); });

      expect(result.current.isLoading).toBe(true);

      await act(async () => { resolve({ success: false }); await signInPromise!; });

      expect(result.current.isLoading).toBe(false);
    });

    it("returns the result from the signIn action", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" } as any);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrong");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
    });

    it("calls signInAction with provided email and password", async () => {
      mockSignInAction.mockResolvedValue({ success: false } as any);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "secret");
      });

      expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "secret");
    });

    it("does not navigate when sign-in fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false } as any);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("resets isLoading to false even when signInAction throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("sets isLoading to true during sign-up and resets after", async () => {
      mockSignUpAction.mockResolvedValue({ success: false } as any);
      const { result } = renderHook(() => useAuth());

      let loadingDuringCall = false;
      mockSignUpAction.mockImplementation(async () => {
        loadingDuringCall = result.current.isLoading;
        return { success: false } as any;
      });

      await act(async () => {
        await result.current.signUp("user@example.com", "password");
      });

      expect(loadingDuringCall).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("returns the result from the signUp action", async () => {
      mockSignUpAction.mockResolvedValue({ success: true } as any);
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "password");
      });

      expect(returnValue).toEqual({ success: true });
    });

    it("does not navigate when sign-up fails", async () => {
      mockSignUpAction.mockResolvedValue({ success: false } as any);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("resets isLoading to false even when signUpAction throws", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("user@example.com", "password").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post sign-in navigation", () => {
    describe("when anonymous work exists", () => {
      const anonWork = {
        messages: [{ role: "user", content: "Make a button" }],
        fileSystemData: { "/": {}, "/App.tsx": "export default () => <button />" },
      };

      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockSignInAction.mockResolvedValue({ success: true } as any);
        mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);
      });

      it("creates a project with the anonymous work data", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: anonWork.messages,
            data: anonWork.fileSystemData,
          })
        );
      });

      it("clears anonymous work after creating the project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockClearAnonWork).toHaveBeenCalled();
      });

      it("navigates to the new project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      });

      it("does not call getProjects when anonymous work is present", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockGetProjects).not.toHaveBeenCalled();
      });
    });

    describe("when anonymous work has no messages", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
        mockSignInAction.mockResolvedValue({ success: true } as any);
      });

      it("falls through to fetch existing projects", async () => {
        mockGetProjects.mockResolvedValue([{ id: "existing-id" }] as any);
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockGetProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/existing-id");
      });
    });

    describe("when no anonymous work exists and user has projects", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue(null);
        mockSignInAction.mockResolvedValue({ success: true } as any);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }, { id: "project-2" }] as any);
      });

      it("navigates to the most recent project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockPush).toHaveBeenCalledWith("/project-1");
      });

      it("does not create a new project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockCreateProject).not.toHaveBeenCalled();
      });
    });

    describe("when no anonymous work and no existing projects", () => {
      beforeEach(() => {
        mockGetAnonWorkData.mockReturnValue(null);
        mockSignInAction.mockResolvedValue({ success: true } as any);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "brand-new-id" } as any);
      });

      it("creates a new blank project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockCreateProject).toHaveBeenCalledWith(
          expect.objectContaining({ messages: [], data: {} })
        );
      });

      it("navigates to the newly created project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password");
        });

        expect(mockPush).toHaveBeenCalledWith("/brand-new-id");
      });
    });
  });
});
