import "./load-env"; // must precede any import that touches the database
import db from "../../../prisma/prisma-client";

/** Pins down which Prisma 4 / SQL Server query shapes actually work on composite-key join models. */
async function probe(label: string, fn: () => Promise<unknown>) {
  try {
    const r = await fn();
    console.log(`OK    ${label} -> ${JSON.stringify(r)}`);
  } catch (e: any) {
    const msg = String(e.message).split("\n").find((l: string) => l.includes("message:")) ?? e.message;
    console.log(`FAIL  ${label} -> ${msg.trim().slice(0, 120)}`);
  }
}

async function main() {
  // Baseline: filtering a single-PK model through a composite-PK join relation.
  await probe("product.count via institutes.some", () =>
    db.product.count({ where: { institutes: { some: { instituteId: 1 } } } })
  );

  // The failing shape: filtering a COMPOSITE-PK model through a relation.
  await probe("product_member_author.count via product relation", () =>
    db.product_member_author.count({ where: { product: { institutes: { some: { instituteId: 1 } } } } })
  );
  await probe("product_member_author.count via simple product relation", () =>
    db.product_member_author.count({ where: { product: { id: 1 } } })
  );

  // Candidate workaround: filter by scalar FK with an explicit id list.
  await probe("product_member_author.count via product_id in []", async () => {
    const ids = (
      await db.product.findMany({
        where: { institutes: { some: { instituteId: 1 } } },
        select: { id: true },
      })
    ).map((p) => p.id);
    return db.product_member_author.count({ where: { product_id: { in: ids } } });
  });

  await probe("product_topic.groupBy via product relation", () =>
    db.product_topic.groupBy({
      by: ["topic_id"],
      where: { product: { institutes: { some: { instituteId: 1 } } } },
      _count: { _all: true },
    })
  );
  await probe("product_topic.groupBy via product_id in []", async () => {
    const ids = (
      await db.product.findMany({
        where: { institutes: { some: { instituteId: 1 } } },
        select: { id: true },
      })
    ).map((p) => p.id);
    return db.product_topic.groupBy({
      by: ["topic_id"],
      where: { product_id: { in: ids } },
      _count: { _all: true },
    });
  });

  // Nested relation count inside a select (used by products.byTopic powerBi).
  await probe("product.findMany with _count of authors", () =>
    db.product.findMany({
      where: { institutes: { some: { instituteId: 1 } } },
      select: { id: true, _count: { select: { product_member_author: true } } },
    })
  );

  // Owned-entity join models (grant/supervision/event side).
  await probe("grant_member_involved.count via grant relation", () =>
    db.grant_member_involved.count({ where: { grant: { instituteId: 1 } } })
  );
  await probe("supervision_principal_supervisor.findMany via supervision relation", () =>
    db.supervision_principal_supervisor.findMany({
      where: { supervision: { instituteId: 1 } },
      select: { member_id: true },
    })
  );
  await probe("event_topic.groupBy via event relation", () =>
    db.event_topic.groupBy({
      by: ["topic_id"],
      where: { event: { instituteId: 1 } },
      _count: { _all: true },
    })
  );
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
