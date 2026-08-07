import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { type FC, useCallback, useContext, useEffect, useState } from "react";
import ApiRoutes from "../../routing/api-routes";
import type { InstituteTopicInfo } from "../../pages/api/institute-topics";
import { LanguageCtx } from "../../services/context/language-ctx";
import { useSelectedInstitute } from "../../services/context/selected-institute-ctx";
import getAuthHeader from "../../services/headers/auth-header";
import { contentTypeJsonHeader } from "../../services/headers/content-type-headers";
import Notification from "../../services/notifications/notification";

type TopicFormData = {
  name_en: string;
  name_fr: string;
  is_active?: boolean;
};

const InstituteTopicManager: FC = () => {
  const { en } = useContext(LanguageCtx);
  const { institute } = useSelectedInstitute();
  const [createForm] = Form.useForm<TopicFormData>();
  const [editForm] = Form.useForm<TopicFormData>();
  const [topics, setTopics] = useState<InstituteTopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTopic, setEditingTopic] =
    useState<InstituteTopicInfo | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!institute) {
      setTopics([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const query = new URLSearchParams({ instituteId: String(institute.id) });
      const response = await fetch(`${ApiRoutes.instituteTopics}?${query}`, {
        headers: authHeader,
      });
      if (!response.ok) throw await response.text();
      setTopics(await response.json());
    } catch (error) {
      new Notification().error(error);
    } finally {
      setLoading(false);
    }
  }, [institute]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  async function createTopic(data: TopicFormData) {
    if (!institute) return;
    setSaving(true);
    const notification = new Notification();
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const response = await fetch(ApiRoutes.instituteTopics, {
        method: "POST",
        headers: { ...authHeader, ...contentTypeJsonHeader },
        body: JSON.stringify({ ...data, institute_id: institute.id }),
      });
      if (!response.ok) throw await response.text();
      createForm.resetFields();
      notification.success(
        en ? "Topic added to this institute." : "Sujet ajouté à cet institut."
      );
      await fetchTopics();
    } catch (error) {
      notification.error(error);
    } finally {
      setSaving(false);
    }
  }

  function openEditor(topic: InstituteTopicInfo) {
    setEditingTopic(topic);
    editForm.setFieldsValue({
      name_en: topic.name_en,
      name_fr: topic.name_fr,
      is_active: topic.is_active,
    });
  }

  async function updateTopic(data: TopicFormData) {
    if (!institute || !editingTopic) return;
    setSaving(true);
    const notification = new Notification();
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const response = await fetch(
        ApiRoutes.updateInstituteTopic(editingTopic.id),
        {
          method: "PATCH",
          headers: { ...authHeader, ...contentTypeJsonHeader },
          body: JSON.stringify({
            ...data,
            is_active: data.is_active ?? false,
            institute_id: institute.id,
          }),
        }
      );
      if (!response.ok) throw await response.text();
      setEditingTopic(null);
      notification.success(
        en ? "Topic updated." : "Sujet mis à jour."
      );
      await fetchTopics();
    } catch (error) {
      notification.error(error);
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<InstituteTopicInfo> = [
    {
      title: en ? "English topic" : "Sujet en anglais",
      dataIndex: "name_en",
      sorter: (a, b) => a.name_en.localeCompare(b.name_en),
    },
    {
      title: en ? "French topic" : "Sujet en français",
      dataIndex: "name_fr",
      sorter: (a, b) => a.name_fr.localeCompare(b.name_fr),
    },
    {
      title: en ? "Status" : "Statut",
      dataIndex: "is_active",
      width: 120,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active
            ? en
              ? "Active"
              : "Actif"
            : en
            ? "Inactive"
            : "Inactif"}
        </Tag>
      ),
    },
    {
      title: en ? "Actions" : "Actions",
      key: "actions",
      width: 110,
      render: (_, topic) => (
        <Button icon={<EditOutlined />} onClick={() => openEditor(topic)}>
          {en ? "Edit" : "Modifier"}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <div>
        <Typography.Title level={1}>
          {en ? "Grant Topics" : "Sujets de subvention"}
        </Typography.Title>
        <Typography.Paragraph>
          {en
            ? `Manage the topics available for ${institute?.name || "this institute"}. Inactive topics remain on existing records but cannot be selected for new grants.`
            : `Gérez les sujets disponibles pour ${
                institute?.name_fr || institute?.name || "cet institut"
              }. Les sujets inactifs restent sur les dossiers existants, mais ne peuvent pas être sélectionnés pour de nouvelles subventions.`}
        </Typography.Paragraph>
      </div>

      <Form<TopicFormData>
        form={createForm}
        layout="vertical"
        onFinish={createTopic}
        style={{ maxWidth: 720 }}
      >
        <Typography.Title level={3}>
          {en ? "Add a topic" : "Ajouter un sujet"}
        </Typography.Title>
        <Form.Item
          label={en ? "Topic name (English)" : "Nom du sujet (anglais)"}
          name="name_en"
          rules={[{ required: true, whitespace: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={en ? "Topic name (French)" : "Nom du sujet (français)"}
          name="name_fr"
          rules={[{ required: true, whitespace: true, message: en ? "Required" : "Requis" }]}
        >
          <Input />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<PlusOutlined />}
          loading={saving}
        >
          {en ? "Add topic" : "Ajouter le sujet"}
        </Button>
      </Form>

      <Table<InstituteTopicInfo>
        rowKey="id"
        columns={columns}
        dataSource={topics}
        loading={loading}
        pagination={false}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={en ? "Edit topic" : "Modifier le sujet"}
        open={!!editingTopic}
        onCancel={() => setEditingTopic(null)}
        onOk={() => editForm.submit()}
        confirmLoading={saving}
        destroyOnClose
      >
        <Form<TopicFormData>
          form={editForm}
          layout="vertical"
          onFinish={updateTopic}
          preserve={false}
        >
          <Form.Item
            label={en ? "Topic name (English)" : "Nom du sujet (anglais)"}
            name="name_en"
            rules={[{ required: true, whitespace: true, message: en ? "Required" : "Requis" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Topic name (French)" : "Nom du sujet (français)"}
            name="name_fr"
            rules={[{ required: true, whitespace: true, message: en ? "Required" : "Requis" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={en ? "Available for new grants" : "Disponible pour les nouvelles subventions"}
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default InstituteTopicManager;
