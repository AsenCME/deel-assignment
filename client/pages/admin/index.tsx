import Button from "../../components/button";
import { useState } from "react";
import Category from "../../components/category";
import { callApi } from "../../utils/request";
import RenderList from "../../components/render-list";
import Render from "../../components/render";

export default function Page() {
  const [start, setStart] = useState("2020-01-01");
  const [end, setEnd] = useState("2022-01-01");
  const [limit, setLimit] = useState(2);
  const [result, setResult] = useState<any>(null);
  const [category, setCategory] = useState<"profession" | "clients">(
    "profession"
  );

  const getBest = async () => {
    let endpoint = "";
    if (category === "profession")
      endpoint = `admin/best-profession?start=${start}&end=${end}`;
    else if (category === "clients")
      endpoint = `admin/best-clients?start=${start}&end=${end}&limit=${limit}`;

    const data = await (await callApi(endpoint)).json();
    if (data) setResult({ type: category, data });
  };

  return (
    <div className="pb-12">
      <h1>Best of something</h1>

      <h6 className="mt-4">Choose a category</h6>
      <div className="flex mt-2 gap-4">
        <Category
          name="profession"
          isSelected={category === "profession"}
          onClick={() => setCategory("profession")}
        />
        <Category
          name="clients"
          isSelected={category === "clients"}
          onClick={() => setCategory("clients")}
        />
      </div>

      <h6 className="mt-4">Choose a period</h6>
      <div className="flex w-full gap-4">
        <div className="w-full">
          <p>Start</p>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border-2 border-gray-50 rounded-full bg-gray-50 px-4 py-2 w-full"
          />
        </div>
        <div className="w-full">
          <p>End</p>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border-2 border-gray-50 rounded-full bg-gray-50 px-4 py-2 w-full"
          />
        </div>
      </div>

      {category === "clients" ? (
        <>
          <h6 className="mt-4">Choose a limit</h6>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border-2 border-gray-50 rounded-full bg-gray-50 px-4 py-2 w-full"
          />
        </>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button title="Get best" onClick={getBest} />
      </div>

      <h6 className="mt-4">Result</h6>
      {!result ? (
        "No data"
      ) : result.type === "clients" ? (
        <RenderList data={result.data} />
      ) : (
        <Render data={result.data} />
      )}
    </div>
  );
}
