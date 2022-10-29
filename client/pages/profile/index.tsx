import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Button from "../../components/button";
import Render from "../../components/render";
import { request } from "../../utils/request";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  return await request("me", res);
};

export default function Page({ data }: { data: any }) {
  const { push } = useRouter();
  return (
    <>
      <h1>My profile</h1>
      <Render {...{ data }} />
      <div className="h-4" />
      <Button title="Transfer money" onClick={() => push("/profile/deposit")} />
    </>
  );
}
