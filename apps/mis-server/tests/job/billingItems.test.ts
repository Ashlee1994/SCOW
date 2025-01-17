/* eslint-disable max-len */
import { Server } from "@ddadaal/tsgrpc-server";
import { asyncClientCall } from "@ddadaal/tsgrpc-utils";
import { ChannelCredentials } from "@grpc/grpc-js";
import { MikroORM } from "@mikro-orm/core";
import { MySqlDriver } from "@mikro-orm/mysql";
import { Decimal, decimalToMoney, numberToMoney } from "@scow/lib-decimal";
import { createServer } from "src/app";
import { AmountStrategy, JobPriceItem } from "src/entities/JobPriceItem";
import { Tenant } from "src/entities/Tenant";
import { AddBillingItemRequest, JobBillingItem, JobServiceClient } from "src/generated/server/job";
import { calculateJobPrice, createPriceMap } from "src/plugins/price";
import { createPriceItems } from "src/tasks/createBillingItems";
import { DEFAULT_TENANT_NAME } from "src/utils/constants";
import { dropDatabase } from "tests/data/helpers";

let server: Server;
let orm: MikroORM<MySqlDriver>;
let oldPriceItem: JobPriceItem;
let client: JobServiceClient;

beforeEach(async () => {
  server =  await createServer();
  orm = server.ext.orm;

  await orm.getSchemaGenerator().ensureDatabase();
  await orm.getMigrator().up();

  // insert tenant
  const em = orm.em.fork();
  const anotherTenant = new Tenant({ name: "another" });
  await em.persistAndFlush(anotherTenant);

  await createPriceItems(em, server.logger);

  // insert an old price item
  oldPriceItem = new JobPriceItem({
    itemId: "HPC102", amount: AmountStrategy.CPUS_ALLOC,
    price: new Decimal("0.02"), path: ["hpc00", "C032M0128G", "low"],
  });

  oldPriceItem.createTime = new Date(new Date().getTime() - 100000);

  await em.persistAndFlush(oldPriceItem);

  await server.start();
  client = new JobServiceClient(server.serverAddress, ChannelCredentials.createInsecure());

});

afterEach(async () => {
  await dropDatabase(orm);
  await server.close();
});

interface PriceItem {
  itemId: string;
  price: Decimal;
  path: string[];
  tenant?: string;
}

const expectedPriceItems: PriceItem[] = [
  { itemId: "HPC102", price: new Decimal("0.02"), path: ["hpc00", "C032M0128G", "low"]},
  { itemId: "HPC01", price: new Decimal("0.04"), path: ["hpc00", "C032M0128G", "low"]},
  { itemId: "HPC02", price: new Decimal("0.06"), path: ["hpc00", "C032M0128G", "normal"]},
  { itemId: "HPC03", price: new Decimal("0.08"), path: ["hpc00", "C032M0128G", "high"]},
  { itemId: "HPC04", price: new Decimal("0.04"), path: ["hpc00", "C032M0128G", "cryoem"]},
  { itemId: "HPC05", price: new Decimal("2.50"), path: ["hpc00", "GPU", "low"]},
  { itemId: "HPC06", price: new Decimal("3.75"), path: ["hpc00", "GPU", "normal"]},
  { itemId: "HPC07", price: new Decimal("5.00"), path: ["hpc00", "GPU", "high"]},
  { itemId: "HPC08", price: new Decimal("2.50"), path: ["hpc00", "GPU", "cryoem"]},
  { itemId: "HPC09", price: new Decimal("0.00"), path: ["hpc00", "life"]},
  { itemId: "HPC10", price: new Decimal("0.05"), path: ["hpc01", "compute", "low"]},
  { itemId: "HPC11", price: new Decimal("0.06"), path: ["hpc01", "compute", "normal"]},
  { itemId: "HPC12", price: new Decimal("0.07"), path: ["hpc01", "compute", "high"]},
  { itemId: "HPC13", price: new Decimal("4.00"), path: ["hpc01", "gpu", "low"]},
  { itemId: "HPC14", price: new Decimal("5.00"), path: ["hpc01", "gpu", "normal"]},
  { itemId: "HPC15", price: new Decimal("6.00"), path: ["hpc01", "gpu", "high"]},
  { itemId: "HPC100", price: new Decimal("0.08"), path: ["hpc00", "C032M0128G", "low"], tenant: "another" },
];

it("creates billing items in db", async () => {

  const em = orm.em.fork();

  const priceItems = await em.find(JobPriceItem, {}, { populate: ["tenant"]});

  priceItems.forEach((x) => {
    expect({
      itemId: x.itemId,
      price: x.price,
      path: x.path,
      ...x.tenant ? { tenant: x.tenant.getEntity().name } : undefined,
    }).toEqual(expectedPriceItems.find((e) => e.itemId === x.itemId));
  });

});

const priceItemToJobBillingItem = (x: PriceItem) => <JobBillingItem>({
  id: x.itemId, path: x.path.join("."), tenantName: x.tenant, price: decimalToMoney(x.price),
  createTime: expect.any(Date), amountStrategy: expect.any(String),
});

it("returns all default billing items", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { activeOnly: false });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.filter((x) => !x.tenant).map(priceItemToJobBillingItem),
  );
});

it("returns only active billing items of default ", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { activeOnly: true });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.filter((x) => !x.tenant && x.itemId !== oldPriceItem.itemId).map(priceItemToJobBillingItem),
  );
});

it("returns all billing items applicable to default tenant", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { tenantName: DEFAULT_TENANT_NAME, activeOnly: false });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.filter((x) => x.tenant !== "another").map(priceItemToJobBillingItem),
  );
});

it("returns all billing items applicable to another tenant", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { tenantName: "another", activeOnly: false });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.map(priceItemToJobBillingItem),
  );
});

it("returns active billing items applicable to default tenant", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { tenantName: DEFAULT_TENANT_NAME, activeOnly: true });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.filter((x) => x.itemId !== oldPriceItem.itemId && !x.tenant).map(priceItemToJobBillingItem),
  );
});

it("returns active billing items applicable to another tenant", async () => {
  const reply = await asyncClientCall(client, "getBillingItems", { tenantName: "another", activeOnly: true });

  expect(reply.items).toIncludeSameMembers(
    expectedPriceItems.filter((x) => x.itemId !== oldPriceItem.itemId && x.itemId !== "HPC01").map(priceItemToJobBillingItem),
  );
});

it("adds billing item to default", async () => {
  const request: AddBillingItemRequest = {
    amountStrategy: AmountStrategy.CPUS_ALLOC, itemId: "HPC203",
    path: "hpc00.C032M0128G.low", description: "",
    price: numberToMoney(10),
  };

  await asyncClientCall(client, "addBillingItem", request);

  const reply = await asyncClientCall(client, "getBillingItems", { activeOnly: true });

  expect(reply.items).toIncludeAllMembers([{
    amountStrategy: request.amountStrategy,
    id: request.itemId,
    path: request.path,
    createTime: expect.any(Date),
    price: request.price,
    tenantName: request.tenantName,
  } as JobBillingItem]);

  expect(reply.items.find((x) => x.id === "HPC01")).toBeUndefined();
});

it("adds billing item to another tenant", async () => {
  const request: AddBillingItemRequest = {
    amountStrategy: AmountStrategy.CPUS_ALLOC, itemId: "HPC203",
    path: "hpc00.C032M0128G.low", description: "",
    price: numberToMoney(10), tenantName: "another",
  };

  await asyncClientCall(client, "addBillingItem", request);

  const reply = await asyncClientCall(client, "getBillingItems", { tenantName: "another", activeOnly: true });

  expect(reply.items).toIncludeAllMembers([{
    amountStrategy: request.amountStrategy,
    id: request.itemId,
    path: request.path,
    createTime: expect.any(Date),
    price: request.price,
    tenantName: request.tenantName,
  } as JobBillingItem]);

  expect(reply.items.find((x) => x.id === "HPC01")).toBeUndefined();
});

it("calculates price", async () => {

  const priceMap = await createPriceMap(orm.em.fork(), server.logger);


  // obtain test data by running the following data in db
  // select json_object('biJobIndex', bi_job_index, 'cluster', cluster, 'partition', `partition`, 'qos', qos, 'timeUsed', time_used, 'cpusAlloc', cpus_alloc, 'gpu', gpu, 'memReq', mem_req, 'memAlloc', mem_alloc, 'price', price) from job_info where cluster="未名生科一号" limit 20;
  const testData = (await import("./testData.json")).default;

  const wrongPrices = [] as { biJobIndex: number; tenantPrice: { expected: number; actual: number }; accountPrice: { expected: number; actual: number } }[];

  testData.forEach((t) => {
    const price = calculateJobPrice(t, priceMap.getPriceItem, server.logger);
    if (price.tenant.price.toNumber() !== t.tenantPrice || price.account.price.toNumber() !== t.accountPrice) {
      wrongPrices.push({
        biJobIndex: t.biJobIndex,
        tenantPrice: { expected: t.tenantPrice, actual: price.tenant.price.toNumber() },
        accountPrice: { expected: t.accountPrice, actual: price.account.price.toNumber() },
      });
    }
  });

  expect(wrongPrices).toBeArrayOfSize(0);

});
