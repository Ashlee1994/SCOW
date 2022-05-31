import { getConfigFromFile } from "@scow/config";
import { APP_SERVER_CONFIG_BASE_PATH, AppServer, AppServerConfigSchema } from "@scow/config/build/appConfig/appServer";
import { GetServerSideProps, NextPage } from "next";
import { join } from "path";
import { requireAuth } from "src/auth/requireAuth";
import { SSRProps } from "src/auth/server";
import { UnifiedErrorPage } from "src/components/errorPages/UnifiedErrorPage";
import { PageTitle } from "src/components/PageTitle";
import { LaunchAppForm } from "src/pageComponents/app/LaunchAppForm";
import { Head } from "src/utils/head";
import { queryToString } from "src/utils/querystring";

type Props = SSRProps<{
  config: AppServer;
}, 400 | 404>;

export const AppIndexPage: NextPage<Props> = requireAuth(() => true)((props: Props) => {

  if ("error" in props) {
    return <UnifiedErrorPage code={props.error} />;
  }

  const { config } = props;

  return (
    <div>
      <Head title={`启动${config.name}`} />
      <PageTitle titleText={`启动${config.name}`} />
      <LaunchAppForm config={config} />
    </div>
  );
});

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {

  const app = queryToString(query.app);

  if (!app) { return { props: { error: 400 } }; }

  const config = getConfigFromFile(AppServerConfigSchema, join(APP_SERVER_CONFIG_BASE_PATH, app), true);

  if (!config) { return { props: { error: 404 } };}

  return {
    props: {
      config,
    },
  };
};



export default AppIndexPage;
