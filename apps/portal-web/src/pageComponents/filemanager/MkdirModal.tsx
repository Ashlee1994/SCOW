import { Form, Input, message, Modal } from "antd";
import { join } from "path";
import { useState } from "react";
import { mkdir } from "src/pageComponents/filemanager/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  reload: () => void;
  cluster: string;
  path: string;
}

interface FormProps {
  newFileName: string;
}

export const MkdirModal: React.FC<Props> = ({ visible, onClose, path, reload, cluster }) => {
  const [form] = Form.useForm<FormProps>();
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      visible={visible}
      title="创建目录"
      okText={"确认"}
      cancelText="取消"
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnClose
      onOk={async () => {
        const { newFileName } = await form.validateFields();
        setLoading(true);
        await mkdir({ cluster, path: join(path, newFileName)  })
          .then(() => {
            message.success("创建成功");
            reload();
            onClose();
          })
          .finally(() => setLoading(false));
      }}
    >
      <Form form={form}>
        <Form.Item label="要创建的目录的目录">
          <strong>{path}</strong>
        </Form.Item>
        <Form.Item<FormProps> label="目录名" name="newFileName" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};