import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative, resolve, sep } from "path";
import { describe, expect, it } from "vitest";
import selectableInstitutes from "../../src/utils/front-end/selectable-institutes";

const institute = (id: number, is_active: boolean) => ({
  id,
  name: `Institute ${id}`,
  urlIdentifier: `inst-${id}`,
  is_active,
});

describe("selectableInstitutes", () => {
  it("offers active institutes", () => {
    const list = [institute(1, true), institute(2, true)];

    expect(selectableInstitutes(list).map((i) => i.id)).toEqual([1, 2]);
  });

  it("drops deactivated ones, which must not be attachable to anything new", () => {
    const list = [institute(1, true), institute(2, false), institute(3, true)];

    expect(selectableInstitutes(list).map((i) => i.id)).toEqual([1, 3]);
  });

  it("returns nothing when every institute is deactivated", () => {
    expect(selectableInstitutes([institute(1, false)])).toEqual([]);
  });

  it("does not mutate the list it was given", () => {
    const list = [institute(1, true), institute(2, false)];

    selectableInstitutes(list);

    expect(list).toHaveLength(2);
  });
});

/**
 * Architecture guard, in the same spirit as `tests/api/route-authorization.test.ts`.
 *
 * The bug in issue #11 was not that any single picker was wrong; it was that the rule lived in
 * five separate components and four of them had drifted from it. A sixth picker added later would
 * drift the same way, so the rule is asserted over the source rather than trusted to memory.
 */
const COMPONENTS = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/components");

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("every institute picker filters deactivated institutes", () => {
  it("has no component mapping the institute list unfiltered", () => {
    const offenders = listFiles(COMPONENTS)
      .filter((f) => /\{\s*institutes\.map\(/.test(readFileSync(f, "utf8")))
      .map((f) => relative(COMPONENTS, f).split(sep).join("/"));

    // If this fails: wrap the list in selectableInstitutes(), so a deactivated institute cannot
    // be attached to a product, partner or member.
    expect(offenders).toEqual([]);
  });
});
