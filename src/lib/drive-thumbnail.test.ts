import { describe, expect, it } from "vitest";
import { getDriveFileId, getDriveThumbnailUrl } from "@/lib/drive-thumbnail";

describe("getDriveFileId", () => {
  it("extracts the id from a /file/d/<id>/view link", () => {
    expect(
      getDriveFileId("https://drive.google.com/file/d/19fQjPKHJ3pUkurGkI3rvrBFioPczBLL7/view?usp=sharing")
    ).toBe("19fQjPKHJ3pUkurGkI3rvrBFioPczBLL7");
  });

  it("extracts the id from an open?id= link", () => {
    expect(getDriveFileId("https://drive.google.com/open?id=abc-DEF_123")).toBe("abc-DEF_123");
  });

  it("returns null for non-Drive or malformed urls", () => {
    expect(getDriveFileId("https://www.youtube.com/watch?v=xyz")).toBeNull();
    expect(getDriveFileId("https://evil.com/file/d/abc/view")).toBeNull();
    expect(getDriveFileId("not a url")).toBeNull();
    expect(getDriveFileId("https://drive.google.com/drive/folders/abc")).toBeNull();
  });
});

describe("getDriveThumbnailUrl", () => {
  it("builds the thumbnail url with the requested width", () => {
    expect(getDriveThumbnailUrl("https://drive.google.com/file/d/abc123/view", 640)).toBe(
      "https://drive.google.com/thumbnail?id=abc123&sz=w640"
    );
  });

  it("defaults to 800px and returns null when there is no id", () => {
    expect(getDriveThumbnailUrl("https://drive.google.com/file/d/abc123/view")).toContain("sz=w800");
    expect(getDriveThumbnailUrl("https://vimeo.com/1")).toBeNull();
  });
});
