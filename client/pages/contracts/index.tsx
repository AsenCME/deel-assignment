import { GetServerSideProps } from "next";
import Link from "next/link";
import { formatDateRelative } from "../../utils/formatters";
import { request } from "../../utils/request";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  return await request("all-contracts", res);
};

export default function Page({ data }: { data: any[] }) {
  return (
    <>
      <h1>Contracts</h1>
      <p>Displays all of your active contracts</p>
      <div className="flex flex-col gap-4 mt-4">
        {data.map((x) => (
          <Link key={x.id} href={`/contracts/${x.id}`}>
            <div className="p-4 rounded hoverable">
              <div className="flex justify-between gap-4">
                <div>{x.status}</div>
                <div>{formatDateRelative(x.createdAt)}</div>
              </div>
              {/*  */}
              <h6 className="mt-2 text-gray-600">Terms</h6>
              {x.terms}
              {/*  */}
              <div className="flex gap-4">
                <div>
                  <h6 className="mt-2 text-gray-600">
                    Client {x.role === "client" ? "(me)" : ""}
                  </h6>
                  {x.Client.firstName} {x.Client.lastName}
                </div>
                {/*  */}
                <div>
                  <h6 className="mt-2 text-gray-600">
                    Contractor {x.role === "contractor" ? "(me)" : ""}
                  </h6>
                  {x.Contractor.firstName} {x.Contractor.lastName}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
