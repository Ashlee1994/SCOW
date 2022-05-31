import { ReloadOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, InputNumber, message, Modal, Row, Select, Tooltip } from "antd";
import { useWatch } from "antd/lib/form/Form";
import randomWords from "random-words";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "src/apis";
import { SingleClusterSelector } from "src/components/ClusterSelector";
import { Editor } from "src/components/Editor";
import { InputGroupFormItem } from "src/components/InputGroupFormItem";
import { AccountSelector } from "src/pageComponents/job/AccountSelector";
import { Cluster, publicConfig } from "src/utils/config";
import { defaultCluster, defaultPartitionInfo,
  defaultPartitionName, firstPartition, getPartitionInfo } from "src/utils/jobForm";

interface JobForm {
  cluster: Cluster;
  partition: string | undefined;
  nodeCount: number;
  coreCount: number;
  command: string;
  jobName: string;
  qos: string | undefined;
  maxTime: number;
  account: string;
  comment: string;
}

function genJobName() {
  return randomWords({ exactly: 2, join: "-" });
}


const initialValues = {
  cluster: defaultCluster,
  command: "",
  partition: defaultPartitionName,
  nodeCount: 1,
  coreCount: 1,
  qos: defaultPartitionInfo?.qos?.[0] ?? null,
  maxTime: 30,
} as JobForm;

interface Props {
  initial?: typeof initialValues;
}

export const SubmitJobForm: React.FC<Props> = ({ initial = initialValues }) => {

  const [form] = Form.useForm<JobForm>();
  const [loading, setLoading] = useState(false);

  const reloadJobName = () => {
    form.setFieldsValue({ jobName: genJobName() });
  };

  const submit = async () => {
    const { cluster, command, jobName, coreCount,
      maxTime, nodeCount, partition, qos, account, comment } = await form.validateFields();

    setLoading(true);

    await api.submitJob({ body: {
      cluster: cluster.id, command, jobName, account,
      coreCount, maxTime, nodeCount, partition, qos, comment,
    } })
      .httpError(409, (e) => {
        const { code, message: serverMessage  } = e;
        if (code === "ALREADY_EXISTS") {
          message.error("作业名已经存在。已生成新作业名");
          reloadJobName();
        } else if (code === "SBATCH_FAILED") {
          Modal.error({
            title: "提交作业失败",
            content: serverMessage,
          });
        } else {
          throw e;
        }
      })
      .then(({ jobId }) => {
        message.success("提交成功！您的新作业ID为：" + jobId);
      })
      .finally(() => setLoading(false));
  };

  const cluster = useWatch("cluster", form) ?? initial.cluster;

  const partition = useWatch("partition", form) ?? initial.partition;

  // if partition is no longer available, use the first partition of the cluster
  useEffect(() => {
    if (!getPartitionInfo(cluster, partition)) {
      form.setFieldsValue({ partition: firstPartition(cluster)[0] });
    }
  }, [partition]);

  const currentPartitionInfo = useMemo(() => getPartitionInfo(cluster, partition), [cluster, partition]);

  return (
    <Form<JobForm>
      form={form}
      initialValues={initial}
      onFinish={submit}
      onValuesChange={(changed) => {
        if (changed.cluster) {
          const [name, info] = firstPartition(changed.cluster);
          form.setFieldsValue({ cluster: changed.cluster, partition: name, qos: info?.qos?.[0] });
        } else if (changed.partition) {
          const partitionInfo = getPartitionInfo(cluster, changed.partition);
          form.setFieldsValue({ qos: partitionInfo?.qos?.[0] });
        }
      }}
    >
      <Row gutter={4}>
        <Col span={24} sm={12}>
          <Form.Item<JobForm> label="集群" name="cluster" rules={[{ required: true }]}>
            <SingleClusterSelector />
          </Form.Item>
        </Col>
        <Col span={24} sm={12}>
          <Form.Item<JobForm> label="作业名" name="jobName" rules={[{ required: true }]}>
            <InputGroupFormItem deltaWidth="32px">
              <Tooltip title="重新生成作业名">
                <Button icon={<ReloadOutlined />} onClick={reloadJobName} />
              </Tooltip>
            </InputGroupFormItem>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item<JobForm> label="命令" name="command" rules={[{ required: true }]}>
        <Editor height="50vh" />
      </Form.Item>
      <Row gutter={4}>
        <Col span={24} sm={12}>
          <Form.Item<JobForm> label="账户" name="account"
            rules={[{ required: true }]} dependencies={["cluster"]}
          >
            <AccountSelector cluster={cluster.id} />
          </Form.Item>
        </Col>
        <Col span={24} sm={6}>
          <Form.Item<JobForm> label="分区" name="partition"
            dependencies={["cluster"]}
            rules={[{ required: true }]}
          >
            <Select
              disabled={!currentPartitionInfo}
              options={Object.keys(publicConfig.CLUSTERS_CONFIG[cluster.id].partitions)
                .map((x) => ({ label: x, value: x }))}
            />
          </Form.Item>
        </Col>
        <Col span={24} sm={6}>
          <Form.Item<JobForm> label="QOS" name="qos"
            dependencies={["cluster", "partition"]}
            rules={[{ required: true }]}
          >
            <Select
              disabled={(!currentPartitionInfo?.qos) || currentPartitionInfo.qos.length === 0}
              options={currentPartitionInfo?.qos?.map((x) => ({ label: x, value: x }))}
            />
          </Form.Item>
        </Col>
        <Col span={24} sm={6} >
          <Form.Item<JobForm> label="节点数" name="nodeCount"
            dependencies={["cluster", "partition"]}
            rules={[
              { required: true, type: "integer", max: currentPartitionInfo?.nodes  },
            ]}
          >
            <InputNumber min={1} />
          </Form.Item>
        </Col>
        <Col span={24} sm={6}>
          <Form.Item<JobForm> label="CPU核心数" name="coreCount"
            dependencies={["cluster", "partition"]}
            rules={[
              { required: true, type: "integer", max: currentPartitionInfo?.cores },
            ]}
          >
            <InputNumber min={1} />
          </Form.Item>
        </Col>
        <Col span={24} sm={12}>
          <Form.Item label="最长运行时间" name="maxTime" rules={[{ required: true }]}>
            <InputNumber min={1} step={1} addonAfter={"分钟"} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="备注" name="comment">
        <Input.TextArea />
      </Form.Item>
      <Form.Item<JobForm>>
        <Button type="primary" htmlType="submit" loading={loading}>
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
