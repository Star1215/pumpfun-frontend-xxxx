"use client"

import Image from "next/image"
import Link from "next/link"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { useRef, useState, useEffect } from "react"
import { UserCircleIcon } from '@heroicons/react/20/solid'
import { useWallet } from "@solana/wallet-adapter-react"
import { useLogin } from "@/hooks/auth/useLogin"
import { format } from "date-fns";
import { useLogout } from "@/hooks/auth/useLogout";

import useIsMounted from "./useIsMounted"
import {
  DATATYPE_LASTTOKEN,
  DATATYPE_LASTTRADE
} from "../engine/consts";

export default function Header() {
  const wallet = useWallet()
  const { login } = useLogin()
  const { logout } = useLogout()

  const mounted = useIsMounted()

  const [ws, setWs] = useState(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const div1Ref = useRef(null)
  const div2Ref = useRef(null)
  const [lastTokenInfo, setLastTokenInfo] = useState(null)
  const [lastTradeInfo, setLastTradeInfo] = useState(null)
  const baseURL = `${process.env.NEXT_PUBLIC_SOCKET_URL}`

  console.log("lastTradeInfo", lastTradeInfo);

  useEffect(() => {
    if (wallet.publicKey !== null && wallet.disconnecting === false)
      login(wallet.publicKey.toBase58())
    if (wallet.disconnecting === true)
      logout()
  }, [wallet])

  useEffect(() => {
    const websocket = new WebSocket(baseURL)
    setWs(websocket)
    websocket.onopen = () => {
      console.log("websocket opened!")
    }

    websocket.onmessage = (event) => {
      console.log("websocket onmessage!")
      const data = JSON.parse(atob(event.data)).message;

      if (data.type === DATATYPE_LASTTOKEN)
        setLastTokenInfo(data.data)
      else if (data.type === DATATYPE_LASTTRADE) {
        setLastTradeInfo(data.data)
        getCheckoutStatus()
      }
    }
  }, [])

  const getCheckoutStatus = () => {
    if (div1Ref.current) {
      if (div1Ref.current.classList.contains('animate-shake') === true)
        div1Ref.current.classList.remove('animate-shake')
      else
        div1Ref.current.classList.add('animate-shake')

      if (div2Ref.current.classList.contains('animate-shake') === true)
        div2Ref.current.classList.remove('animate-shake')
      else
        div2Ref.current.classList.add('animate-shake')
    }
  }

  return (
    <header className="z-20 flex flex-col gap-2 items-center p-2">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-2 items-center">
          <Link href="/">
            <Image
              className="rounded-full"
              src="/pumpfunlogo.webp"
              width={25}
              height={25}
              alt=""
            // priority={true}
            />
          </Link>
          <div className="flex max-sm:flex-col gap-1 ml-4">
            <button type="button" className="gap-3 items-center rounded-full" onClick={() => setIsDialogOpen(true)}>
              {/* <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1.29692C9.7842 1.29689 7.61817 1.95393 5.7758 3.18494C3.93343 4.41595 2.49747 6.16565 1.64952 8.21277C0.801573 10.2599 0.579713 12.5125 1.012 14.6857C1.44429 16.8589 2.5113 18.8551 4.07812 20.4219C5.11843 21.4622 6.35347 22.2875 7.7127 22.8505C9.07194 23.4135 10.5288 23.7033 12 23.7033C13.4712 23.7033 14.928 23.4135 16.2873 22.8505C17.6465 22.2875 18.8815 21.4622 19.9219 20.4219C20.9622 19.3816 21.7874 18.1466 22.3504 16.7873C22.9134 15.4281 23.2032 13.9713 23.2032 12.5C23.2032 11.0288 22.9134 9.57199 22.3504 8.21275C21.7874 6.85352 20.9622 5.61848 19.9219 4.57817C18.884 3.5346 17.6494 2.70726 16.2896 2.14403C14.9298 1.58081 13.4718 1.29288 12 1.29692ZM12 22.3907C6.54627 22.3907 2.10937 17.9538 2.10937 12.5C2.10937 7.04632 6.54627 2.60942 12 2.60942C17.4537 2.60942 21.8906 7.04632 21.8906 12.5C21.8906 17.9538 17.4537 22.3907 12 22.3907Z" fill="white" />
              <path d="M12.0017 5.81641C11.0288 5.8175 10.096 6.20447 9.40807 6.89241C8.72011 7.58036 8.33314 8.51311 8.33203 9.48602H9.64453C9.64453 8.86086 9.89287 8.26131 10.3349 7.81925C10.777 7.3772 11.3765 7.12886 12.0017 7.12886C12.6268 7.12886 13.2264 7.3772 13.6684 7.81925C14.1105 8.26131 14.3588 8.86086 14.3588 9.48602C14.3588 10.7209 13.7788 11.301 13.0443 12.0354C12.248 12.8317 11.3454 13.7343 11.3454 15.5128H12.6579C12.6579 14.278 13.238 13.6978 13.9724 12.9634C14.7688 12.1671 15.6713 11.2645 15.6713 9.48602C15.6702 8.51311 15.2833 7.58036 14.5953 6.89241C13.9073 6.20447 12.9746 5.8175 12.0017 5.81641Z" fill="white" />
              <path d="M11.2461 17.1172H12.7528V18.4297H11.2461V17.1172Z" fill="white" />
            </svg> */}
              <p className={`text-sm text-white`}>[how it works]</p>
            </button>
            <div className="flex gap-2">
              <a href="https://nextjs.org" target="_blank" className="items-center rounded-full">
                <div className="">
                  <svg width="20" height="20" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.5639 20.46L13.8624 10.9458L13.1048 9.86982L8.31107 3.06401L7.9139 2.5H2.02344L3.46007 4.54018L9.8339 13.5903L10.5915 14.6652L15.7127 21.9368L16.1101 22.5003H22.0005L20.5639 20.46ZM16.8101 21.1981L11.4896 13.6435L10.7319 12.5681L4.55795 3.80209H7.21369L12.2066 10.8914L12.9642 11.9668L19.4659 21.1979H16.8101V21.1981Z" fill="white" />
                    <path d="M10.7316 12.5664L11.4892 13.6418L10.591 14.6633L3.69944 22.4983H2L9.83335 13.5885L10.7316 12.5664Z" fill="white" />
                    <path d="M21.2917 2.5L13.8629 10.9458L12.9647 11.9668L12.207 10.8914L13.1052 9.86982L18.1374 4.14596L19.5922 2.5H21.2917Z" fill="white" />
                  </svg>
                </div>
              </a>
              <a href="https://nextjs.org" target="_blank" className="items-center rounded-full">
                <div className="">
                  <svg width="20" height="20" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.2071 3.82422L2 11.5939V12.717L7.50115 14.4153L9.24095 19.9969L10.6298 19.9966L12.8689 17.7056L17.5958 21.1775L18.5158 20.8275L22 4.4897L21.2071 3.82422ZM17.5587 19.6961L11.3334 15.1236L10.6395 16.0682L11.9149 17.005L10.1033 18.8247L8.68173 14.2642L16.9156 9.34799L16.3148 8.34169L7.95976 13.3302L3.91775 12.0824L20.6236 5.32457L17.5587 19.6961Z" fill="white" />
                  </svg>
                </div>
              </a>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {lastTradeInfo !== null && (
              <div ref={div1Ref} className="hidden sm:flex gap-1 p-2 items-center bg-[#FCA5A5] rounded-md h-[36px]">
                <Link href={`/profile/${lastTradeInfo.walletAddr}`} className="flex items-center gap-1 hover:underline">
                  <Image
                    className="rounded-full"
                    src={lastTradeInfo.avatar === null ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTradeInfo.avatar}`}
                    width={24}
                    height={24}
                    alt=""
                  />
                  <p className={`text-sm `}>{lastTradeInfo.username}</p>
                </Link>
                <p className={`text-sm `}>{lastTradeInfo.isBuy === true ? 'bought' : 'sold'} {lastTradeInfo.quoteAmount} SOL of</p>
                <Link href={`/token/${lastTradeInfo.mintAddr}`} className="flex items-center gap-1">
                  <p className={`text-sm hover:underline `}>{lastTradeInfo.tokenName}</p>
                  <Image
                    className="rounded-full"
                    src={lastTradeInfo.logo}
                    width={24}
                    height={24}
                    alt=""
                  />
                </Link>
              </div>
            )}
            {lastTokenInfo !== null && (
              <div className="hidden lg:flex gap-1 p-2 items-center bg-[#93C5FD] rounded-md h-[36px]">
                <Link href={`/profile/${lastTokenInfo.walletAddr}`} className="flex items-center gap-1 hover:underline">
                  <Image
                    className="rounded-full"
                    src={lastTokenInfo.avatar === null ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTokenInfo.avatar}`}
                    width={24}
                    height={24}
                    alt=""
                  />
                  <p className={`text-sm `}>{lastTokenInfo.username}</p>
                </Link>
                <p className={`text-sm `}>created</p>
                <Link href={`/token/${lastTokenInfo.mintAddr}`} className="flex items-center gap-1">
                  <p className={`text-sm hover:underline `}>{lastTokenInfo.token}</p>
                  <Image
                    className="rounded-full"
                    src={lastTokenInfo.logo}
                    width={24}
                    height={24}
                    alt=""
                  />
                </Link>
                <p className={`text-sm`}>on {format(new Date(lastTokenInfo.cdate || null), "MM/dd/yyyy")}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {mounted && <WalletMultiButton />}
          {wallet.publicKey !== null && (
            <Link href={`/profile/${wallet.publicKey.toBase58()}`}>
              <UserCircleIcon className="size-8 fill-white" />
            </Link>
          )}
        </div>
      </div>
      {lastTradeInfo !== null && (
        <div ref={div2Ref} className="flex sm:hidden gap-1 p-2 items-center bg-[#FCA5A5] rounded-md h-[36px]">
          <Link href={`/profile/${lastTradeInfo.walletAddr}`} className="flex items-center gap-1 hover:underline">
            <Image
              className="rounded-full"
              src={lastTradeInfo.avatar === null ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${lastTradeInfo.avatar}`}
              width={24}
              height={24}
              alt=""
            />
            <p className={`text-sm `}>{lastTradeInfo.username}</p>
          </Link>
          <p className={`text-sm `}>{lastTradeInfo.isBuy === true ? 'bought' : 'sold'} {lastTradeInfo.quoteAmount} SOL of</p>
          <Link href={`/${lastTradeInfo.mintAddr}`} className="flex items-center gap-1">
            <p className={`text-sm hover:underline `}>{lastTradeInfo.tokenName}</p>
            <Image
              className="rounded-full"
              src={lastTradeInfo.logo}
              width={24}
              height={24}
              alt=""
            />
          </Link>
        </div>
      )}
      <HowItWorksDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
    </header>
  )
}

function HowItWorksDialog({ isDialogOpen, setIsDialogOpen }) {
  return (
    <Transition appear show={isDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none `} onClose={() => setIsDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-8 p-10 w-full max-w-xl rounded-lg bg-[#1B1D28] border border-white backdrop-blur-2xl">
                <p className='text-[32px] text-bold text-white text-center'>How it works</p>
                <p className='text-xl text-white text-center'>Pump prevents rugs by making sure that all created tokens are safe. Each coin on pump is a <span className='text-[#FFCC48]'>fair-launch</span> with no presale and <span className='text-[#FF3131]'>no team allocation.</span></p>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 border border-white rounded-lg text-xl text-white w-fit">
                      Step 01
                    </div>
                    <p className="text-xl text-white">Pick a coin that you like</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 border border-white rounded-lg text-xl text-white w-fit">
                      Step 02
                    </div>
                    <p className="text-xl text-white">Buy the coin on the bonding curve</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 border border-white rounded-lg text-xl text-white w-fit">
                      Step 03
                    </div>
                    <p className="text-xl text-white">Sell at any time to lock in your profits or losses</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 border border-white rounded-lg text-xl text-white w-fit">
                      Step 04
                    </div>
                    <p className="text-xl text-white">When enough people buy on the bonding curve it reaches a market cap of $69k</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="px-3 py-1 border border-white rounded-lg text-xl text-white w-fit">
                      Step 05
                    </div>
                    <p className="text-xl text-white">$12k of liquidity is then deposited in Raydium and burned</p>
                  </div>
                </div>
                <button type="button" className="bg-white text-black rounded-xl text-xl font-bold p-3" onClick={() => setIsDialogOpen(false)}>I&apos;m ready to pump</button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}