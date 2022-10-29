import { GetServerSideProps } from "next";
import { useState } from "react";
import Button from "../../components/button";
import RenderList from "../../components/render-list";
import { callApi, request } from "../../utils/request";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  return await request("jobs/unpaid", res);
};

export default function Page({ data }: { data: any[] }) {
  const [loading, setLoading] = useState(false);
  const [paidJobs, setPaidJobs] = useState<number[]>([]); // list of jobs the user paid for in this session

  // not usig useCallback here as the function is pretty simple
  const payForJob = async (id: number) => {
    if (!confirm("Are you sure you want to pay for this job?")) return;
    setLoading(true);
    const response = await callApi(`jobs/${id}/pay`, "POST");
    const json = await response.json();
    if (json.ok) setPaidJobs((prev) => [id, ...prev]);
    setLoading(false);
  };
  return (
    <>
      <h1>List of unpaid jobs</h1>
      {loading ? <p className="my-4">Loading...</p> : ""}
      <RenderList
        data={data.filter((x) => !paidJobs.includes(x.id))}
        slot={(x) => (
          <div className="flex justify-end">
            <Button title="Pay for this job" onClick={() => payForJob(x.id)} />
          </div>
        )}
      />
    </>
  );
}
