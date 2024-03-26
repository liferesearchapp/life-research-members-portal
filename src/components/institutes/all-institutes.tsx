import Button from "antd/lib/button";
import Table, { ColumnType } from "antd/lib/table";
import Title from "antd/lib/typography/Title";
import { FC, useContext, useEffect } from "react";
import PageRoutes from "../../routing/page-routes";
import { useRouter } from "next/router";
import { LanguageCtx } from "../../services/context/language-ctx";
import { AllInstitutesCtx } from "../../services/context/all-institutes-ctx";
import { institute } from "@prisma/client";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";

const AllInstitutes: FC = () => {
  const router = useRouter();
  const { en } = useContext(LanguageCtx);
  const { allInstitutes, loading, refresh } = useContext(AllInstitutesCtx);
  const { institute } = useSelectedInstitute();
  const keyedInstitutes = allInstitutes.map((m) => ({ ...m, key: m.id }));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateEvent = () => {
    if (institute) {
      router.push({
        pathname: "/institutes/register-institute",
      });
    }
  };

  const columns: ColumnType<institute>[] = [
    {
      title: en ? "Name" : "Nom",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: en ? "URL Identifier" : "Identifiant URL",
      dataIndex: "urlIdentifier",
      sorter: (a, b) => a.urlIdentifier.localeCompare(b.urlIdentifier),
    },
    {
      title: en ? "Description (EN)" : "Description (EN)",
      dataIndex: "description_en",
      sorter: (a, b) =>
        (a.description_en || "").localeCompare(b.description_en || ""),
    },
    {
      title: en ? "Description (FR)" : "Description (FR)",
      dataIndex: "description_fr",
      sorter: (a, b) =>
        (a.description_fr || "").localeCompare(b.description_fr || ""),
    },
  ];

  const header = () => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Title level={1} style={{ margin: 0 }}>
        {en ? "All Institutes" : "Tous les instituts"}
      </Title>
      <div style={{ flexGrow: 15 }}></div>
      <Button type="primary" size="large" onClick={() => handleCreateEvent()}>
        {en ? "Add Institute" : "Ajouter un institut"}
      </Button>
    </div>
  );

  return (
    <Table
      className="all-institutes-table"
      size="small"
      columns={columns}
      dataSource={keyedInstitutes}
      loading={loading}
      title={header}
      pagination={false}
      showSorterTooltip={false}
      sticky={{ offsetHeader: 74 }}
      scroll={{ x: "max-content" }}
      rowClassName={(_, index) =>
        "table-row " + (index % 2 === 0 ? "even" : "odd")
      }
    />
  );
};

export default AllInstitutes;
