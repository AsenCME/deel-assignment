import Link from "next/link";
import Button from "../components/button";

export default function Page() {
  return (
    <div className="absolute inset-0 bg-white h-screen flex items-center justify-center flex-col gap-4">
      <h1>OH NO!</h1>
      <p>Something went wrong!</p>
      <Link href="/">
        <Button title="Back to home" />
      </Link>
    </div>
  );
}
