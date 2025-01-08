import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../../prisma/prisma-client";
import isAuthorMatch from "../../components/products/author-match";
import getAccountFromRequest from "../../utils/api/get-account-from-request";
import removeDiacritics from "../../utils/front-end/remove-diacritics";


export type RegisterProductParams = {
  title_en: string;
  title_fr: string;
  publish_date: Date | null;
  doi: string;
  all_author: string;
  product_type_id: number;
  note: string;
  institute_id: number[];
  on_going: boolean; // Include on_going field
  peer_reviewed: boolean; // Include peer_reviewed field
};

export type RegisterProductRes = Awaited<ReturnType<typeof registerProduct>>;

function registerProduct(params: RegisterProductParams) {
  return db.product.create({
    data: {
      title_en: params.title_en,
      title_fr: params.title_fr,
      publish_date: params.publish_date,
      doi: params.doi,
      all_author: params.all_author,
      product_type_id: Number(params.product_type_id),
      note: params.note,
      on_going: params.on_going, // Set on_going field from params
      peer_reviewed: params.peer_reviewed, // Set peer_reviewed field from params
    },
    select: {
      id: true, // Add this line to select the id of the created product
    },
  });
}

// Add this function before the handler function
async function fetchMembers() {
  return db.member.findMany({
    include: {
      account: true,
    },
  });
}

// Replace the useState line in the handler function with this line:

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterProductRes | string>
) {
  const params: RegisterProductParams = req.body;
  const {
    title_en,
    title_fr,

    all_author,
    on_going,
    peer_reviewed,
    product_type_id,
  } = params;
  if (typeof title_en !== "string")
    return res.status(400).send("Please provide the title in english");
  if (typeof title_fr !== "string")
    return res.status(400).send("Please provide the title in french");
  if (!["boolean", "undefined"].includes(typeof on_going))
    return res.status(400).send("on_going is required.");
  if (!["boolean", "undefined"].includes(typeof peer_reviewed))
    return res.status(400).send("peer_reviewed is required.");
  if (typeof all_author !== "string")
    return res.status(400).send("Author is required.");
  if (isNaN(product_type_id))
    return res.status(400).send("product_type_id is required.");

  try {
    const currentUser = await getAccountFromRequest(req, res);
    if (!currentUser) return;

    const newProduct = await registerProduct(params);

    // Get the matched authors
    const members = await fetchMembers();

    const authors = all_author.split(/[,;&]/).map((author) => author.trim());
    console.log("authors", authors);

    const matchedAuthors = Array.from(
      new Set(
        authors
          .map((author) => {
            const foundAccount = members.find(
              (member) =>
                member &&
                member.account &&
                member.account.first_name &&
                member.account.last_name &&
                isAuthorMatch(
                  removeDiacritics(author), // Add removeDiacritics here
                  member.account.first_name,
                  member.account.last_name
                )
            );

            return foundAccount ? foundAccount.id : null;
          })
          .filter((authorId) => authorId !== null) // Filter out null values here
          .map((authorId) => authorId as number) // Map the remaining values as numbers
      )
    );

    // Insert matched authors into the product_member_author table
    await Promise.all(
      matchedAuthors.map((authorId) =>
        db.product_member_author.create({
          data: {
            member_id: authorId,
            product_id: newProduct.id,
          },
        })
      )
    );

    //temp code keep here incase we want to add the person adding product as user!
    // const check =
    //   currentUser.member &&
    //   (await db.product_member_author.upsert({
    //     where: {
    //       member_id_product_id: {
    //         member_id: currentUser.id,
    //         product_id: newProduct.id,
    //       },
    //     },
    //     create: {
    //       member_id: currentUser.member?.id,
    //       product_id: newProduct.id,
    //     },
    //     update: {},
    //   }));

    // console.log("check", check);

    await Promise.all(
      params.institute_id.map((instituteId) =>
        db.productInstitute.create({
          data: {
            instituteId: instituteId,
            productId: newProduct.id,
          },
        })
      )
    );

    return res.status(200).send(newProduct);
  } catch (e: any) {
    console.error("Error while registering product:", e);
    return res.status(500).send({
      ...e,
      message: "An error occurred while registering the product.",
    });
  }
}
