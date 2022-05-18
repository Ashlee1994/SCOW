import { ReloadOutlined } from "@ant-design/icons";
import { Button, Col, Form, InputNumber, message, Modal, Row, Select, Tooltip } from "antd";
import { useWatch } from "antd/lib/form/Form";
import moment from "moment";
import React, { useState } from "react";
import { api } from "src/apis";
import { SingleClusterSelector } from "src/components/ClusterSelector";
import { Editor } from "src/components/Editor";
import { InputGroupFormItem } from "src/components/InputGroupFormItem";
import { Cluster, CLUSTERS, publicConfig } from "src/utils/config";

interface JobForm {
  cluster: Cluster;
  partition: string | undefined;
  nodeCount: number;
  coreCount: number;
  command: string;
  jobName: string;
  qos: string;
  maxTime: number;
}

function genJobName() {
  return moment().format("YYYYMMDDhhmmss");
}

const getPartitionInfo = (cluster: Cluster, partition?: string) => {
  return partition
    ? publicConfig.CLUSTERS_CONFIG[cluster.id].partitions[partition]
    : undefined;
};

function firstPartition(cluster: Cluster) {
  const partitionName = Object.keys(publicConfig.CLUSTERS_CONFIG[cluster.id].partitions)[0];
  return [partitionName, getPartitionInfo(cluster, partitionName)] as const;
}

const defaultCluster = CLUSTERS[0];

const [defaultPartitionName, defaultPartitionInfo] = firstPartition(defaultCluster);

const initialValues = {
  cluster: defaultCluster,
  command: "",
  jobName: genJobName(),
  partition: defaultPartitionName,
  nodeCount: 1,
  coreCount: 1,
  qos: defaultPartitionInfo?.qos?.[0],
  maxTime: 30,
} as JobForm;



export const SubmitJobForm: React.FC = ({}) => {

  const [form] = Form.useForm<JobForm>();
  const [loading, setLoading] = useState(false);

  const reloadJobName = () => {
    form.setFieldsValue({ jobName: genJobName() });
  };

  const submit = async () => {
    const { cluster, command, jobName } = await form.validateFields();

    setLoading(true);

    await api.submitJob({ body: { cluster: cluster.id, command, jobName } })
      .httpError(409, (e) => {
        const { result, message: serverMessage  } = e;
        if (result === "ALREADY_EXISTS") {
          message.error("作业名已经存在。正在生成新作业名");
          reloadJobName();
        } else if (result === "SBATCH_FAILED") {
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
        reloadJobName();
      })
      .finally(() => setLoading(false));
  };

  const cluster = useWatch("cluster", form) ?? initialValues.cluster;
  const partition = useWatch("partition", form) ?? initialValues.partition;

  return (
    <Form<JobForm>
      form={form}
      initialValues={initialValues}
      onFinish={submit}
      onValuesChange={(changed) => {
        if (changed.cluster) {
          const [name, info] = firstPartition(changed.cluster);
          form.setFieldsValue({ cluster: changed.cluster, partition: name, qos: info?.qos?.[0] });
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
          <Form.Item<JobForm> label="分区" name="partition"
            dependencies={["cluster"]}
            rules={[{ required: true }]}
          >
            <Select
              options={Object.keys(publicConfig.CLUSTERS_CONFIG[cluster.id].partitions)
                .map((x) => ({ label: x, value: x }))}
            />
          </Form.Item>
        </Col>
        <Col span={24} sm={12}>
          <Form.Item<JobForm> label="QOS" name="qos"
            dependencies={["cluster", "partition"]}
            rules={[{ required: true }]}
          >
            <Select options={partition
              ? publicConfig.CLUSTERS_CONFIG[cluster.id].partitions[partition]
                .qos?.map((x) => ({ label: x, value: x }))
              : []} />
          </Form.Item>
        </Col>
        <Col span={24} sm={6} >
          <Form.Item<JobForm> label="节点数" name="nodeCount"
            dependencies={["cluster", "partition"]}
            rules={[
              { required: true, type: "integer", max: getPartitionInfo(cluster, partition)?.nodes  },
            ]}
          >
            <InputNumber min={1} />
          </Form.Item>
        </Col>
        <Col span={24} sm={6}>
          <Form.Item<JobForm> label="CPU核心数" name="coreCount"
            dependencies={["cluster", "partition"]}
            rules={[
              { required: true, type: "integer", max: getPartitionInfo(cluster, partition)?.cores },
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
      <Form.Item<JobForm>>
        <Button type="primary" htmlType="submit" loading={loading}>
          提交
        </Button>
      </Form.Item>
    </Form>
  );
};
