import { formatDate } from "../utils/formatters";

function RenderKey({ k, data }: { k: string; data: any }) {
  if (["createdAt", "updatedAt"].includes(k))
    return <p>{formatDate(data[k])}</p>;

  if (["Client", "Contractor"].includes(k))
    return (
      <p>
        {data[k].firstName} {data[k].lastName}
      </p>
    );

  return <p>{data[k]}</p>;
}

export default function Render({ data }: { data: any }) {
  return (
    <>
      {Object.keys(data).map((k) => (
        <div key={k}>
          <h6 className="text-gray-600 mt-4">{k.toUpperCase()}</h6>
          <RenderKey {...{ k, data }} />
        </div>
      ))}
    </>
  );
}
