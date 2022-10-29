import { GetServerSideProps } from "next";
import Render from "../../../components/render";
import { formatDate } from "../../../utils/formatters";
import { request } from "../../../utils/request";

export const getServerSideProps: GetServerSideProps = async ({
  res,
  params,
}) => {
  return await request("contracts/" + params?.id, res);
};

export default function Page({ data }: { data: any }) {
  return (
    <>
      <h1>Contract #{data.id || "<<unknown>>"}</h1>
      {!data.id ? null : <Render {...{ data }} />}
    </>
  );
}
