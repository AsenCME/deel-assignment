import Button from "./button";
import Render from "./render";

export default function RenderList({
  data,
  slot,
}: {
  data: any[];
  slot?: (data: any) => React.ReactNode;
}) {
  if (!data.length) return <p>No data</p>;
  return (
    <div className="w-full mt-4">
      {data.map((x, i) => (
        <div key={i} className="p-4 pt-0 hoverable mt-4">
          <Render data={x} />
          {!slot ? null : slot(x)}
        </div>
      ))}
    </div>
  );
}
