import { useMemo } from "react";
import { useState } from "react";
import Button from "../../../components/button";
import { callApi } from "../../../utils/request";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(0);
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const validationErrors = useMemo<string[]>(() => {
    const arr = [];
    if (!userId || userId <= 0) arr.push("User ID must be positive");
    if (!amount || amount <= 0) arr.push("Balance must be positive");
    return arr;
  }, [userId, amount]);

  const transferMoney = async () => {
    setTouched(true);
    if (validationErrors.length > 0) return alert("There are errors");

    setLoading(true);
    const response = await callApi("balances/deposit/" + userId, "POST", {
      amount,
    });
    const json = await response.json();
    if (!json.ok) setError(json.message);
    else {
      setError("");
      alert("Money sent successfully");
    }
    setLoading(false);
  };

  return (
    <>
      <h1>Transfer money</h1>

      {!error ? null : (
        <div className="p-4 my-4 bg-red-700 text-white">{error}</div>
      )}

      {!validationErrors || !touched
        ? null
        : validationErrors.map((x: string, i: number) => (
            <div key={i} className="p-4 my-4 bg-red-700 text-white">
              {x}
            </div>
          ))}
      <div className="mt-4 flex flex-col gap-4">
        <input
          type="text"
          placeholder="The ID of the user you wish to send money to"
          onChange={(e) => setUserId(Number(e.target.value))}
          className="rounded bg-gray-50 border-2 border-gray-600 w-full px-4 py-2 font-bold text-lg"
        />
        <input
          type="number"
          placeholder="The amount of money you want to send"
          onChange={(e) => setAmount(Number(e.target.value))}
          className="rounded bg-gray-50 border-2 border-gray-600 w-full px-4 py-2 font-bold text-lg"
        />
        <Button title="Transfer" onClick={transferMoney} />
      </div>
    </>
  );
}
