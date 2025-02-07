import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "@/components/Header";
import Script from 'next/script';
import WalletContextProvider from "@/contexts/WalletContext";
import ContractContextProvider from '@/contexts/ContractContext';
import Head from "next/head";

export default function App({ Component, pageProps }) {
  // return <Component {...pageProps} />;
  return (
    <>
      <Head>
        <title>Pump</title>
      </Head>
      <WalletContextProvider>
        <ContractContextProvider>
          <div className="w-full min-h-screen flex flex-col bg-[#1B1D28] overflow-hidden">
            <Header />
            <div className="relative">
              {/* <svg className='absolute z-auto' width="1921" height="1319" viewBox="0 0 1921 1319" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g opacity="0.1">
                  <path d="M-1079 0L3001 -0.000178342" stroke="white" strokeWidth="2" />
                  <path d="M-1079 120.004L3001 120.004" stroke="white" strokeWidth="2" />
                  <path d="M-1079 240L3001 240" stroke="white" strokeWidth="2" />
                  <path d="M-1079 360.004L3001 360.004" stroke="white" strokeWidth="2" />
                  <path d="M-1079 480L3001 480" stroke="white" strokeWidth="2" />
                  <path d="M-1079 600.004L3001 600.004" stroke="white" strokeWidth="2" />
                  <path d="M-1079 720L3001 720" stroke="white" strokeWidth="2" />
                  <path d="M-1079 840L3001 840" stroke="white" strokeWidth="2" />
                  <path d="M-1079 959.996L3001 959.996" stroke="white" strokeWidth="2" />
                  <path d="M-1079 1080L3001 1080" stroke="white" strokeWidth="2" />
                  <path d="M1.00049 0L1.00044 1080" stroke="white" strokeWidth="2" />
                  <path d="M120.996 0L120.996 1080" stroke="white" strokeWidth="2" />
                  <path d="M241 0L241 1080" stroke="white" strokeWidth="2" />
                  <path d="M360.996 0L360.996 1080" stroke="white" strokeWidth="2" />
                  <path d="M481 0L481 1080" stroke="white" strokeWidth="2" />
                  <path d="M600.996 0L600.996 1080" stroke="white" strokeWidth="2" />
                  <path d="M721 0L721 1080" stroke="white" strokeWidth="2" />
                  <path d="M840.996 0L840.996 1080" stroke="white" strokeWidth="2" />
                  <path d="M961 0L961 1080" stroke="white" strokeWidth="2" />
                  <path d="M1081 0L1081 1080" stroke="white" strokeWidth="2" />
                  <path d="M1201 0L1201 1080" stroke="white" strokeWidth="2" />
                  <path d="M1321 0L1321 1080" stroke="white" strokeWidth="2" />
                  <path d="M1441 0L1441 1080" stroke="white" strokeWidth="2" />
                  <path d="M1561 0L1561 1080" stroke="white" strokeWidth="2" />
                  <path d="M1681 0L1681 1080" stroke="white" strokeWidth="2" />
                  <path d="M1801 0L1801 1080" stroke="white" strokeWidth="2" />
                  <path d="M1921 0L1921 1080" stroke="white" strokeWidth="2" />
                </g>
                <ellipse cx="961" cy="543.5" rx="1371" ry="775.5" fill="url(#paint0_radial_91_23)" />
                <defs>
                  <radialGradient id="paint0_radial_91_23" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(961 543.5) rotate(90) scale(775.5 1371)">
                    <stop stopOpacity="0" />
                    <stop offset="1" />
                  </radialGradient>
                </defs>
              </svg> */}
              <Component {...pageProps} />
            </div>
          </div>
        </ContractContextProvider>
      </WalletContextProvider>
      <ToastContainer
        autoClose={5000}
        hideProgressBar
        pauseOnHover={false}
        pauseOnFocusLoss={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
      />
    </>
  )
}
