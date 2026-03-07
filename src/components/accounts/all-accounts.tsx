import { FC, useContext, useEffect } from "react";
import type { AccountRes } from "../../pages/api/account/[id]";
import PageRoutes from "../../routing/page-routes";
import { useRouter } from "next/router";
import { LanguageCtx } from "../../services/context/language-ctx";
import { AllAccountsCtx } from "../../services/context/all-accounts-ctx";
import { Button, Table, Typography } from "antd";
import type { TableColumnType as ColumnType } from "antd";
const Title = Typography.Title;

const AllAccounts: FC = () => {
  const router = useRouter();
  const { en } = useContext(LanguageCtx);
  const { allAccounts, loading, refresh } = useContext(AllAccountsCtx);
  const keyedAccounts = allAccounts.map((m) => ({ ...m, key: m.id }));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnType<AccountRes>[] = [
    {
      title: en ? "First Name" : "Prénom",
      dataIndex: "first_name",
      sorter: (a, b) => (a.first_name || "").localeCompare(b.first_name || ""),
    },
    {
      title: en ? "Last Name" : "Nom de famille",
      dataIndex: "last_name",
      sorter: (a, b) => (a.last_name || "").localeCompare(b.last_name || ""),
    },
    {
      title: en ? "Login Email" : "Compte courriel",
      dataIndex: "login_email",
      sorter: (a, b) => (a.login_email || "").localeCompare(b.login_email || ""),
    },
    {
      title: en ? "Admin" : "Admin",
      dataIndex: "is_admin",
      width: "6rem",
      render: (text, record, index) => {
        return record.is_admin ? (en ? "Yes" : "Oui") : en ? "No" : "Non";
      },
      sorter: (a, b) => (a.is_admin ? 0 : 1) - (b.is_admin ? 0 : 1),
    },
    {
      title: en ? "Member" : "Membre",
      dataIndex: "member",
      width: "6rem",
      render: (text, record, index) => {
        return record.member ? (en ? "Yes" : "Oui") : en ? "No" : "Non";
      },
      sorter: (a, b) => (a.member ? 0 : 1) - (b.member ? 0 : 1),
    },
    {
      title: en ? "Active" : "Actif",
      dataIndex: ["member", "is_active"],
      width: "6rem",
      render: (text, record, index) => {
        if (!record.member) return "";
        return record.member.is_active ? (en ? "Yes" : "Oui") : en ? "No" : "Non";
      },
      sorter: (a, b) =>
        (a.member ? (a.member.is_active ? 0 : 1) : 2) -
        (b.member ? (b.member.is_active ? 0 : 1) : 2),
    },
    {
      title: en ? "Work Email" : "Courriel au travail",
      dataIndex: ["member", "work_email"],
      sorter: (a, b) => (a.member?.work_email || "").localeCompare(b.member?.work_email || ""),
    },
    {
      title: en ? "Work Phone" : "Téléphone au travail",
      dataIndex: ["member", "work_phone"],
      sorter: (a, b) => (a.member?.work_phone || "").localeCompare(b.member?.work_phone || ""),
    },
    {
      title: en ? "Mobile Phone" : "Téléphone mobile",
      dataIndex: ["member", "mobile_phone"],
      sorter: (a, b) => (a.member?.mobile_phone || "").localeCompare(b.member?.mobile_phone || ""),
    },
  ];

  const header = () => (
    <div style={{ display: "flex", alignItems: "center" }}>
      <Title level={1} style={{ margin: 0 }}>
        {en ? "All Accounts" : "Tous les comptes"}
      </Title>
      <div style={{ flexGrow: 15 }}></div>
      <Button type="primary" onClick={refresh} size="large" style={{ flexGrow: 1 }}>
        {en ? "Refresh" : "Rafraîchir"}
      </Button>
    </div>
  );

  return (
    <Table
      className="all-accounts-table"
      size="small"
      columns={columns}
      dataSource={keyedAccounts}
      loading={loading}
      title={header}
      pagination={false}
      showSorterTooltip={false}
      sticky={{ offsetHeader: 74 }}
      scroll={{ x: "max-content" }}
      rowClassName={(_, index) => "table-row " + (index % 2 === 0 ? "even" : "odd")}
      onRow={(record, _) => ({
        onClick: (_) => {
          router.push(PageRoutes.accountProfile(record.id));
        },
      })}
    />
  );
};

export default AllAccounts;
