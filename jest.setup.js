import "@testing-library/jest-dom";

const mockRouter = { replace: jest.fn(), push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/fleet-setup",
  redirect: jest.fn(),
}));
global.mockRouter = mockRouter;

beforeEach(() => {
  mockRouter.replace.mockReset();
  mockRouter.push.mockReset();
  window.localStorage.clear();
});
