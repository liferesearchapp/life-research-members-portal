import { describe, expect, it } from "vitest";
import matchesPartialMemberSearch, { SearchableMember } from "./member-search";

const member: SearchableMember = {
  name: "Ada Lovelace",
  faculty: { name_en: "Engineering", name_fr: "Ingénierie" },
  member_type: { name_en: "Researcher", name_fr: "Chercheuse" },
  has_keyword: [
    { keyword: { name_en: "Algorithms", name_fr: "Algorithmes" } },
  ],
  about_me_en: "Works on analytical engines",
  about_me_fr: "Travaille sur les machines analytiques",
  problem: [
    { name_en: "Computational complexity", name_fr: "Complexité informatique" },
  ],
};

describe("matchesPartialMemberSearch", () => {
  it("matches partial text without regard to case", () => {
    expect(matchesPartialMemberSearch(member, "LoVe")).toBe(true);
    expect(matchesPartialMemberSearch(member, "not-present")).toBe(false);
  });

  it.each([
    ["faculty in English", "engineer"],
    ["faculty in French", "ingén"],
    ["member type in English", "research"],
    ["member type in French", "cherche"],
    ["keyword in English", "algorithm"],
    ["keyword in French", "algorith"],
    ["About Me in English", "analytical"],
    ["About Me in French", "machines"],
    ["problem in English", "complexity"],
    ["problem in French", "informatique"],
  ])("searches %s", (_field, query) => {
    expect(matchesPartialMemberSearch(member, query)).toBe(true);
  });

  it("keeps the existing any-word behavior for multi-word searches", () => {
    expect(matchesPartialMemberSearch(member, "missing algorithms")).toBe(true);
    expect(matchesPartialMemberSearch(member, "missing absent")).toBe(false);
  });
});
