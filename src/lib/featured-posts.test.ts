import { describe, expect, it } from "vitest";
import { pickHomepagePosts } from "@/lib/featured-posts";

type Post = { id: string; title: string };

const posts: Post[] = [
  { id: "a", title: "hoy" },
  { id: "b", title: "ayer" },
  { id: "c", title: "anteayer" },
  { id: "d", title: "hace 3 días" },
  { id: "e", title: "hace 4 días" },
];

describe("pickHomepagePosts", () => {
  it("keeps the newest published post as the hero when nothing is featured", () => {
    expect(pickHomepagePosts(null, posts)).toEqual(posts.slice(0, 4));
  });

  it("returns an empty list when there are no published posts", () => {
    expect(pickHomepagePosts(null, [])).toEqual([]);
  });

  it("uses the newest featured post as the hero and does not repeat it", () => {
    const featured = posts[0];
    expect(pickHomepagePosts(featured, posts.slice(0, 4)).map((post) => post.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("pins an older featured post and fills the other cards by date", () => {
    const featured = posts[3];
    expect(pickHomepagePosts(featured, posts.slice(0, 4)).map((post) => post.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("still pins a featured post that is outside the latest window", () => {
    const featured = posts[4];
    expect(pickHomepagePosts(featured, posts.slice(0, 4)).map((post) => post.id)).toEqual([
      "e",
      "a",
      "b",
      "c",
    ]);
  });

  it("respects the card limit", () => {
    expect(pickHomepagePosts(posts[2], posts, 2).map((post) => post.id)).toEqual(["c", "a"]);
  });
});
