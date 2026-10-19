import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import DashboardPage from "@/app/(dashboard)/page";

afterEach(() => {
  cleanup();
});

describe("Dashboard page", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: /dashboard/i })
    ).toBeInTheDocument();
  });

  it("renders stat cards", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Total Posts")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
  });

  it("renders empty states for sections", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Recent Posts")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Scheduled")).toBeInTheDocument();
  });
});
