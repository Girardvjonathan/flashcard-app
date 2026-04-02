import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "@/components/tags/tag-input";

describe("TagInput", () => {
  it("renders existing tags", () => {
    render(<TagInput value={["react", "typescript"]} onChange={vi.fn()} />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("adds a tag on Enter", async () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "nextjs{Enter}");
    expect(onChange).toHaveBeenCalledWith(["nextjs"]);
  });

  it("adds a tag on comma", async () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "nextjs,");
    expect(onChange).toHaveBeenCalledWith(["nextjs"]);
  });

  it("removes a tag when × is clicked", async () => {
    const onChange = vi.fn();
    render(<TagInput value={["react", "typescript"]} onChange={onChange} />);
    const removeBtn = screen.getByRole("button", { name: /remove react/i });
    await userEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(["typescript"]);
  });

  it("does not add duplicate tags", async () => {
    const onChange = vi.fn();
    render(<TagInput value={["react"]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "react{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not add empty tags", async () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "  {Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears input after adding a tag", async () => {
    render(<TagInput value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.type(input, "nextjs{Enter}");
    expect(input.value).toBe("");
  });

  it("adds pending tag on blur", async () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "nextjs");
    await userEvent.tab();
    expect(onChange).toHaveBeenCalledWith(["nextjs"]);
  });
});
