import { Button, Checkbox, Form } from "antd";
import { NextPage } from "next";
import { Head } from "next/document";
import { useState } from "react";
import { CodeEditor } from "src/components/CodeEditor";
import { PageTitle } from "src/components/PageTitle";

interface FormInfo {
  data: string;
  whitelist: boolean;
}

const initialData: FormInfo = {
  data: "",
  whitelist: false,
};

export const ImportUsersPage: NextPage = () => {

  const [form] = Form.useForm<FormInfo>();

  const [loading, setLoading] = useState(false);

  const onFinish = async () => {
    const { data, whitelist } = await form.validateFields();

    setLoading(true);

  };



  return (
    <>
      <Head title="导入用户信息" />
      <PageTitle titleText={"导入用户信息"} />
      <Form form={form} initialValues={initialData}>
        <Form.Item name="data" label="数据" rules={[{ required: true }]}>
          <CodeEditor />
        </Form.Item>
        <Form.Item name="whitelist" valuePropName="checked">
          <Checkbox>将所有账户加入白名单</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          提交
        </Button>
      </Form>
    </>
  );
};
