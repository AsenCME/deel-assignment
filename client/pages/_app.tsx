import type { AppProps } from "next/app";
import NextNProgress from "nextjs-progressbar";

import "../styles/global.css";
import Nav from "../components/nav";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <NextNProgress {...pageProps} />
      <div>
        <Nav />
        <main className="px-4 container mx-auto">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}
