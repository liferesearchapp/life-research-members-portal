type LocalizedName = {
  name_en: string | null;
  name_fr: string | null;
};

export type SearchableMember = {
  name: string;
  faculty: LocalizedName | null;
  member_type: LocalizedName | null;
  has_keyword: Array<{ keyword: LocalizedName }>;
  about_me_en: string | null;
  about_me_fr: string | null;
  problem: LocalizedName[];
};

export default function matchesPartialMemberSearch(
  member: SearchableMember,
  searchTerm: string
) {
  const searchWords = searchTerm
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (searchWords.length === 0) return true;

  const memberData = [
    member.name.toLowerCase(),
    member.faculty?.name_en?.toLowerCase() ?? "",
    member.faculty?.name_fr?.toLowerCase() ?? "",
    member.member_type?.name_en?.toLowerCase() ?? "",
    member.member_type?.name_fr?.toLowerCase() ?? "",
    ...member.has_keyword.flatMap(({ keyword }) => [
      keyword.name_en?.toLowerCase() ?? "",
      keyword.name_fr?.toLowerCase() ?? "",
    ]),
    member.about_me_en?.toLowerCase() ?? "",
    member.about_me_fr?.toLowerCase() ?? "",
    ...member.problem.flatMap((problem) => [
      problem.name_en?.toLowerCase() ?? "",
      problem.name_fr?.toLowerCase() ?? "",
    ]),
  ];

  return searchWords.some((word) =>
    memberData.some((data) => data.includes(word))
  );
}
