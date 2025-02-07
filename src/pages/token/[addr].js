"use client"

import Link from 'next/link'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Progress } from 'flowbite-react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { toast } from "react-toastify"
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react'
import Chart from '@/components/tradingview'
import { useMedia } from 'react-use'
import { format } from "date-fns"

import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import {
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID
} from "@raydium-io/raydium-sdk";

import { useContract } from '@/contexts/ContractContext'
import { TOKEN_DECIMALS } from "@/engine/consts";
import { connection } from '@/engine/config'
import { send } from '@/engine/utils'
import { swap } from '@/engine/swap'
import { getToken, getThreadData, reply, likeReply, dislikeReply, mentionReply, trade, getTradeHistory, getMarketId } from '@/api/token'
import { getUserId } from '@/utils'

const ProgressTheme = {
  base: 'bg-[#141414] rounded-full',
  size: {
    'sm': 'h-2'
  },
  color: {
    'white': 'bg-white'
  }
}

export default function TokenPage() {
  const { query } = useRouter();
  const { addr } = query;

  const { connected } = useWallet();
  const walletCtx = useWallet();
  const { isPoolComplete: isPoolCompleted } = useContract();

  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [isSlippageDialogOpen, setIsSlippageDialogOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState('buy')
  const [currentTab, setCurrentTab] = useState('Info')
  const [amount, setAmount] = useState('')
  const [tokenInfo, setTokenInfo] = useState(null)
  const [currentCoin, setCurrentCoin] = useState('sol')
  const [threadData, setThreadData] = useState(null)
  const [tradeHistory, setTradeHistory] = useState(null)
  const [postType, setPostType] = useState('normal')
  const [mentionReplyId, setMentionReplyId] = useState('')
  const [chartType, setChartType] = useState('pump chart')
  const isMobile = useMedia('(max-width: 768px)')
  const [isPoolComplete, setIsPoolComplete] = useState(false)
  const [txPending, setTxPending] = useState(false);
  const [updateData, setUpdateData] = useState(false);

  const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  useEffect(() => {
    if (addr !== undefined) {
      getTokenInfo()
      getThreadInfo()
      getTradeHistoryInfo()
    }
  }, [])

  useEffect(() => {
    console.log("txPending", txPending)
    if (!txPending) {
      setUpdateData((c) => !c);
    }
  }, [txPending]);

  useEffect(() => {
    if (walletCtx.publicKey !== null)
      checkCompleted()
  }, [walletCtx])

  useEffect(() => {
    setCurrentTab(isMobile ? 'Info' : 'Thread')
  }, [isMobile])

  useEffect(() => {
    const refreshData = async () => {
      console.log("updating data")
      await sleep(3000)
      getTokenInfo()
      if (currentTab === 'Thread')
        getThreadInfo()
      else
        getTradeHistoryInfo()
      checkCompleted()
    }
    if (addr !== undefined) {
      refreshData()
    }
  }, [addr, currentTab, connected, updateData])

  const checkCompleted = async () => {
    if (walletCtx.publicKey !== null && addr !== undefined) {
      // console.log("================")
      const result = await isPoolCompleted(addr, NATIVE_MINT)
      setIsPoolComplete(result)
      // console.log(result)
    }
  }

  const getTradeHistoryInfo = async () => {
    const result = await getTradeHistory(addr)
    setTradeHistory(result)
  }

  const getTokenInfo = async () => {
    const userId = getUserId()
    const result = await getToken(addr, userId)
    setTokenInfo(result)
  }

  const getThreadInfo = async () => {
    if (connected) {
      const userId = getUserId()
      const result = await getThreadData(addr, userId)
      // console.log(result)
      setThreadData(result)
    }
  }

  const onChangeAmount = (e) => {
    if (Number(e.target.value) < 0) return;
    setAmount(e.target.value);
  };

  const onTrade = (e) => {
    if (!connected) {
      toast.error('Not connected wallet!');
      return;
    }

    if (amount === '') {
      toast.warning('Please input amount');
      return;
    }

    if (currentMode === 'buy') {
      if (tokenInfo?.solBalance < amount) {
        toast.error('Insufficient balance!');
        return;
      }
    } else {
      if (tokenInfo?.tokenBalance < amount) {
        toast.error('Insufficient balance!');
        return;
      }
    }

    setIsTradeDialogOpen(true);
  };

  const handleReply = async (comment, imageFile) => {
    if (walletCtx.connected === false) {
      toast.error("Please connect wallet!")
      return
    }
    if (comment.current.value === '') {
      toast.error("Please add a comment!")
      return
    }

    await reply(addr, comment.current.value, imageFile)
    getThreadInfo()
    setIsPostDialogOpen(false)
  }

  const handleMentionReply = async (replyMentionId, comment, imageFile) => {
    if (walletCtx.connected === false) {
      toast.error("Please connect wallet!")
      return
    }
    if (comment.current.value === '') {
      toast.error("Please add a comment!")
      return
    }

    await mentionReply(replyMentionId, comment.current.value, imageFile)
    getThreadInfo()
    setIsPostDialogOpen(false)
  }

  function formatAmount(balance, zeros = 4) {
    try {
      const displayAmount = Number(balance);
      if (displayAmount > 0) {
        if (displayAmount < (1 / 10 ** zeros)) return `<${1 / 10 ** zeros}`;
        if (displayAmount < 1000) return displayAmount.toFixed(zeros).replace(/\.?0+$/, '');
        return (displayAmount / 1000).toFixed(zeros).replace(/\.?0+$/, '') + 'k';
      } else {
        return '0'
      }
    } catch (error) {
      console.log(error)
      return '0'
    }
  }

  function timeAgo(date) {
    const now = new Date();
    if (new Date(date).getTime() > now.getTime()) {
      return '-';
    }
    const diff = now.getTime() - new Date(date).getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    let formatted = '';
    if (years > 0) {
      formatted = `${years}y`;
    } else if (months > 0) {
      formatted = `${months}M`;
    } else if (days > 0) {
      formatted = `${days}d`;
    } else if (hours > 0) {
      formatted = `${hours}h`;
    } else if (minutes > 0) {
      formatted = `${minutes}m`;
    } else {
      formatted = 'now';
    }

    return formatted;
  }

  const tokenInfoSection = (
    <div className='flex flex-col gap-4 p-6 '>
      <div className='flex gap-[22px] items-start'>
        <Image
          src={tokenInfo?.logo}
          width={100}
          height={100}
          alt=""
        />
        <div className='flex flex-col gap-2'>
          <p className='text-base font-bold text-white'>{tokenInfo?.name} [ticker: {tokenInfo?.ticker}]</p>
          <p className='text-xs font-medium text-[#808080]'>{tokenInfo?.desc}</p>
          <div className='flex flex-col'>
            <p className='text-sm text-white'>Create by: <span className='text-[#808080]'>{tokenInfo?.username}</span></p>
            <p className='text-sm text-white'>Market cap: <span className='text-[#808080]'>{(tokenInfo?.marketCap / 1000).toFixed(2)}k</span></p>
            <p className='text-sm text-white'>Replies: <span className='text-[#808080]'>{tokenInfo?.replies}</span></p>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <p className='text-sm text-white font-medium'>bonding curve progress: {tokenInfo?.bondingCurveProgress.toFixed(1)}%</p>
        <Progress progress={tokenInfo?.bondingCurveProgress} size="sm" color="white" theme={ProgressTheme} />
      </div>
      <p className='text-sm font-medium text-[#808080]'>
        when the market cap reaches $69,000 all the liquidity from the bonding curve will be deposited into Raydium and burned. progression increases as the price goes up.
        <br />
        <br />
        there are {isPoolComplete ? 0 : (tokenInfo?.tokensAvailableForSale !== null ? tokenInfo?.tokensAvailableForSale.toFixed(0) : '751,404,142')} tokens still available for sale in the bonding curve and there is {isPoolComplete ? 0 : (tokenInfo?.realQuoteReserve !== null ? tokenInfo?.realQuoteReserve.toFixed(2) : '1,213')} SOL in the bonding curve.
      </p>
      <div className='flex flex-col gap-2'>
        {tokenInfo?.crownDate ? (
          <p className='text-sm text-[#ffff00] font-medium'>Crowned king of the hill on {tokenInfo?.crownDate}</p>
        ) : (
          <>
            <p className='text-sm text-white font-medium'>king of the hill progress: {tokenInfo?.kingOfTheHillProgress.toFixed(1)}%</p>
            <Progress progress={tokenInfo?.kingOfTheHillProgress} size="sm" color="white" theme={ProgressTheme} />
          </>
        )}
      </div>
      {/* <div className='text-base font-bold text-white border-b border-dotted border-[#282828] w-fit'>Crowned king of the hill on 17:19:57 15/05/2024</div> */}
      <div className='flex flex-col gap-3'>
        <p className='text-base font-semibold text-white'>Holder distribution</p>
        <div className='flex flex-col gap-2 text-sm text-white/[.80]'>
          {tokenInfo?.tokenHolderDistribution.map((item, index) => {
            return (
              <div key={index} className='flex justify-between'>
                <a href={`https://solscan.io/account/${item.walletAddr}`} target='_blank' className='hover:underline'>{index + 1}. {item.username} {item.bio === null ? '' : `(${item.bio})`}</a>
                <p>{item.holdPercent.toFixed(2)}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <section className={`z-10 flex flex-col sm:flex-row px-2 sm:px-8`}>
      <div className="z-10 flex sm:hidden flex-col w-full border-l-2 border-[#282828]">
        <div className="flex">
          <div className='relative w-full'>
            <button type="button" className={clsx('text-xl text-center py-4 uppercase w-full border-t border-r border-b border-[#282828]', currentMode === 'buy' ? 'text-white font-bold' : 'text-[#808080]')} onClick={() => setCurrentMode('buy')}>buy</button>
            {currentMode === 'buy' && (
              <div className='absolute bottom-0 w-full h-[2px] bg-white'></div>
            )}
          </div>
          <div className='relative w-full'>
            <button type="button" className={clsx('text-xl text-center py-4 uppercase w-full border-t border-r border-b border-[#282828]', currentMode === 'sell' ? 'text-white font-bold' : 'text-[#808080]')} onClick={() => setCurrentMode('sell')}>sell</button>
            {currentMode === 'sell' && (
              <div className='absolute bottom-0 w-full h-[2px] bg-white'></div>
            )}
          </div>
        </div>
        <div className='flex flex-col gap-5 p-6'>
          <div className='flex justify-between'>
            <button type='button' className={clsx('bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white', currentMode === 'buy' ? 'visible' : 'invisible')} onClick={() => {
              if (currentCoin === 'sol')
                setCurrentCoin(tokenInfo?.ticker)
              else
                setCurrentCoin('sol')
            }}>switch to {currentCoin === 'sol' ? tokenInfo?.ticker : 'SOL'}</button>
            <button type='button' className='bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white' onClick={() => setIsSlippageDialogOpen(true)}>Set max slippage</button>
          </div>
          <div className='relative'>
            <input value={amount} onChange={onChangeAmount} type='number' className='px-6 py-4 bg-[#121212] h-[66px] text-sm border border-white text-[#808080] w-full rounded-lg' placeholder='0.0' />
            {currentMode === 'buy' ? (
              <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                <p className='text-sm text-white uppercase'>{currentCoin === 'sol' ? 'SOL' : tokenInfo?.ticker}</p>
                <Image
                  className='rounded-full'
                  src={currentCoin === 'sol' ? '/img7.png' : tokenInfo?.logo}
                  width={34}
                  height={34}
                  alt="sol"
                />
              </div>
            ) : (
              <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                <p className='text-sm text-white uppercase'>{tokenInfo?.ticker}</p>
                <Image
                  className='rounded-full'
                  src={tokenInfo?.logo}
                  width={34}
                  height={34}
                  alt="coin"
                />
              </div>
            )}
          </div>
          {currentMode === 'buy' ? (
            <div className='flex gap-1'>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(0)}>reset</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(1)}>1 SOL</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(5)}>5 SOL</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(10)}>10 SOL</button>
            </div>
          ) : (
            <div className='flex gap-1'>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white'>reset</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white'>25%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white'>50%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white'>75%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white'>100%</button>
            </div>
          )}
          <button type='button' className={`bg-white rounded-lg py-4 text-base `} onClick={onTrade}>Place trade</button>
        </div>
      </div>
      <div className='z-10 flex flex-col w-full px-1'>
        {isPoolComplete === true && (
          <div className='flex items-center gap-2 bg-[#86efac] p-4 rounded-md w-fit'>
            <p className='text-black text-xl'>raydium pool seeded! view the coin on raydium</p>
            <a href={`https://dexscreener.com/${addr}`} target='_blank' className='text-xl font-medium hover:underline text-[#6cc9c6]'>here</a>
          </div>
        )}
        <div className='flex flex-wrap py-2 gap-4 items-center'>
          <p className='text-sm text-white'>{`${tokenInfo?.name} (${tokenInfo?.ticker})`}</p>
          <div className='flex gap-2 items-center'>
            <p className='text-sm text-[#3FDC4F]'>created by</p>
            <Image
              src={!tokenInfo?.avatar ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${tokenInfo?.avatar}`}
              width={16}
              height={16}
              alt=""
            />
            <Link href={`/profile/${tokenInfo?.walletAddr}`} className={`text-xs bg-[#8f8af7] px-1 rounded text-black hover:underline`}>{tokenInfo?.username}</Link>
          </div>
          <p className='text-sm text-[#3FDC4F]'>Market cap: ${tokenInfo?.marketCap.toFixed(2)}</p>
          <p className='text-sm text-[#3FDC4F]'>Virtual liquidity: ${tokenInfo?.virtLiq !== null ? tokenInfo?.virtLiq.toFixed(0) : '9,737'}</p>

        </div>
        {isPoolComplete === true && (
          <div className='flex gap-2 pb-2'>
            <div className={clsx('rounded-md text-base px-2 py-1 cursor-pointer', chartType === 'pump chart' ? 'bg-[#86efac] text-black' : 'text-white')} onClick={() => setChartType('pump chart')}>Pump chart</div>
            <div className={clsx('rounded-md text-base px-2 py-1 cursor-pointer', chartType === 'current chart' ? 'bg-[#86efac] text-black ' : 'text-white')} onClick={() => setChartType('current chart')}>Current chart</div>
          </div>
        )}
        {addr !== undefined && tokenInfo !== null && chartType === 'pump chart' && (
          <Chart stock={"Stock"} interval="15" width="100%" height="100%" tokenId={addr} symbol={tokenInfo?.ticker + "/Pump"} updateData={updateData} />
        )}
        {chartType === 'current chart' && (
          <iframe className={`w-full h-[600px]`} src="https://dexscreener.com/solana/GH8Ers4yzKR3UKDvgVu8cqJfGzU4cU62mTeg9bcJ7ug6?embed=1&theme=dark&trades=0&info=0"></iframe>
        )}
        <div className='flex flex-col gap-[17px] py-6'>
          <div className='flex gap-6'>
            <button type='button' className={clsx('text-base md:hidden', currentTab === 'Info' ? 'font-bold text-white' : 'text-[#808080]')} onClick={() => setCurrentTab('Info')}>Info</button>
            <button type='button' className={clsx('text-base', currentTab === 'Thread' ? 'font-bold text-white' : 'text-[#808080]')} onClick={() => setCurrentTab('Thread')}>Thread</button>
            <button type='button' className={clsx('text-base', currentTab === 'Trades' ? 'font-bold text-white' : 'text-[#808080]')} onClick={() => setCurrentTab('Trades')}>Trades</button>
          </div>
          {currentTab === 'Info' && (
            tokenInfoSection
          )}
          {currentTab === 'Thread' && (
            <div className='flex flex-col gap-2'>
              <div className='flex flex-col gap-[10px] p-4 bg-[#121212]'>
                <div className='flex gap-1 items-center'>
                  <Image
                    src={(tokenInfo?.avatar !== null && tokenInfo?.avatar !== undefined) ? `${process.env.NEXT_PUBLIC_AVATAR_URL}/${tokenInfo?.avatar}` : '/img6.png'}
                    width={16}
                    height={16}
                    alt=""
                  />
                  <Link href={`/profile/${tokenInfo?.walletAddr}`} className='bg-white rounded-[4px] text-sm px-1 hover:underline'>{tokenInfo?.username}</Link>
                  {/* <p className='text-xs text-[#808080]'>{format(new Date(tokenInfo?.cdate), "MM/dd/yyyy, HH:mm:ss")}</p> */}
                </div>
                <div className='flex gap-[22px]'>
                  {tokenInfo?.logo !== null && (
                    <Image
                      className='h-fit rounded-xl'
                      src={tokenInfo?.logo}
                      width={100}
                      height={100}
                      alt=""
                    />
                  )}
                  <p className='text-base font-bold text-white'>{`${tokenInfo?.name} (ticker: ${tokenInfo?.ticker})`}</p>
                  {/* <p className='text-base font-bold text-white'>{tokenInfo?.comment}</p> */}
                </div>
              </div>
              {threadData !== null && threadData.map((item, index) => {
                return (
                  <div key={index} className='flex flex-col gap-[10px] p-4 bg-[#121212]'>
                    <div className='flex gap-1 items-center'>
                      <Image
                        src={(item.avatar !== null && item.avatar !== undefined) ? `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}` : '/img6.png'}
                        width={16}
                        height={16}
                        alt=""
                      />
                      <Link href={`/profile/${item.walletAddr}`} className='bg-white rounded-[4px] text-sm px-1 hover:underline'>{item.username}</Link>
                      <p className='text-xs text-[#808080]'>{format(new Date(item.cdate), "MM/dd/yyyy, HH:mm:ss")}</p>
                      <div className='flex gap-2 items-center'>
                        <div className='cursor-pointer' onClick={async () => {
                          if (item.liked === true)
                            await dislikeReply(item.replyMentionId)
                          else
                            await likeReply(item.replyMentionId)
                          getThreadInfo()
                        }}>
                          <svg width="16" height="16" viewBox="0 0 15 15" fill="#ef4444" xmlns="http://www.w3.org/2000/svg"><path d="M1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.25769 1.35248 6.86058 1.92336 7.50002 2.93545C8.13946 1.92336 8.74235 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z" fill={item.liked === true ? '#ef4444' : 'white'} fillRule="evenodd" clipRule="evenodd"></path></svg>
                        </div>
                        <p className='text-xs text-[#808080]'>{item.likes}</p>
                        <p className='text-xs text-[#808080] cursor-pointer hover:underline' onClick={() => {
                          setMentionReplyId(item.replyMentionId)
                          setIsPostDialogOpen(true)
                        }}>#{item.replyMentionId}</p>
                      </div>
                      {item.buySell === 1 && (
                        <p className='flex gap-1 items-center text-[#3FDC4F]'>
                          {`bought ${item.quoteAmount} SOL`}
                        </p>
                      )}
                      {item.buySell === 2 && (
                        <p className='flex gap-1 items-center text-red-600'>
                          {`sold ${item.baseAmount}${tokenInfo?.ticker}`}
                        </p>
                      )}
                    </div>
                    <div className='flex gap-[22px]'>
                      {item.image !== null && (
                        <Image
                          className='h-fit rounded-xl'
                          src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${item.image}`}
                          width={100}
                          height={100}
                          alt=""
                        />
                      )}
                      <p className='text-base font-bold text-white'>{item.comment}</p>
                    </div>
                  </div>
                )
              })}
              <button type='button' className='bg-white rounded-lg text-base font-bold w-fit mx-auto px-4 py-2' onClick={() => {
                setMentionReplyId('')
                setIsPostDialogOpen(true)
              }}>Post a reply</button>
            </div>
          )}
          {currentTab === 'Trades' && (
            <div className='flex flex-col gap-1'>
              <div className='flex p-3 justify-between border border-[#282828] rounded-lg'>
                <div className='flex w-[90%] max-sm:w-[92%]'>
                  <p className='text-sm font-medium text-[#808080] max-sm:w-[30%] w-[25%]'>account</p>
                  <p className='text-sm font-medium text-[#808080] w-[10%] text-center'>type</p>
                  <p className='text-sm font-medium text-[#808080] max-sm:w-[25%] w-[20%] text-center'>SOL</p>
                  <p className='text-sm font-medium text-[#808080] max-sm:w-[25%] w-[20%] text-center'>{tokenInfo?.ticker}</p>
                  <p className='text-sm font-medium text-[#808080] max-sm:w-[10%] w-[25%] text-center'>date</p>
                </div>
                <p className='text-sm font-medium text-[#808080]'>txn</p>
              </div>
              {tradeHistory === null && (
                <div className='flex p-3 justify-center rounded-lg text-center text-white w-full'>
                  No data
                </div>
              )}
              {tradeHistory !== null && tradeHistory.length === 0 && (
                <div className='flex p-3 justify-center rounded-lg text-center text-white w-full'>
                  No data
                </div>
              )}
              {tradeHistory !== null && tradeHistory.length !== 0 && tradeHistory.map((item, index) => {
                return (
                  <div key={index} className='flex p-3 justify-between items-center rounded-lg bg-[#121212]'>
                    <div className='flex w-[90%] max-sm:w-[92%]'>
                      <div className='flex items-center gap-1 w-[25%] max-sm:w-[30%]'>
                        {(item.avatar !== null && item.avatar !== undefined) ? (
                          <Image
                            src={item.avatar === null ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`}
                            width={16}
                            height={16}
                            alt=""
                          />
                        ) : (
                          <Image
                            src="/img6.png"
                            width={16}
                            height={16}
                            alt=""
                          />
                        )}
                        <Link href={`/profile/${item.walletAddr}`} className='px-1 bg-white rounded-[4px] text-sm'>{item.username}</Link>
                      </div>
                      <p className={clsx('text-sm font-medium w-[10%] text-center', item.isBuy === true ? 'text-[#3FDC4F]' : 'text-red-600')}>{item.isBuy === true ? 'buy' : 'sell'}</p>
                      <p className='text-sm font-medium text-[#808080] w-[20%] max-sm:w-[25%] text-center'>{formatAmount(item?.quoteAmount ?? 0)}</p>
                      <p className='text-sm font-medium text-[#808080] w-[20%] max-sm:w-[25%] text-center'>{formatAmount(item?.baseAmount ?? 0, 2)}</p>
                      <p className='text-sm font-medium text-[#808080] w-[25%] max-sm:w-[10%] text-center'>{timeAgo(new Date(item.date))}</p>
                    </div>
                    <a href={`https://solscan.io/tx/${item.txhash}`} target='_blank' className='max-sm:hidden text-sm font-medium text-[#808080] hover:underline'>{item.txhash.substr(0, 6)}</a>
                    <a href={`https://solscan.io/tx/${item.txhash}`} target='_blank' className='sm:hidden'>
                      <svg
                        width={15}
                        height={15}
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                      >
                        <path
                          d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>

                    </a>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="z-10 flex flex-col sm:max-w-sm w-full border-l-2 border-[#282828] pb-20">
        <div className="hidden sm:flex">
          <div className='relative w-full'>
            <button type="button" className={clsx('text-xl text-center py-4 uppercase w-full border-t border-r border-b border-[#282828]', currentMode === 'buy' ? 'text-white font-bold' : 'text-[#808080]')} onClick={() => setCurrentMode('buy')}>buy</button>
            {currentMode === 'buy' && (
              <div className='absolute bottom-0 w-full h-[2px] bg-white'></div>
            )}
          </div>
          <div className='relative w-full'>
            <button type="button" className={clsx('text-xl text-center py-4 uppercase w-full border-t border-r border-b border-[#282828]', currentMode === 'sell' ? 'text-white font-bold' : 'text-[#808080]')} onClick={() => setCurrentMode('sell')}>sell</button>
            {currentMode === 'sell' && (
              <div className='absolute bottom-0 w-full h-[2px] bg-white'></div>
            )}
          </div>
        </div>
        <div className='hidden sm:flex flex-col gap-5 p-6'>
          <div className='flex justify-between'>
            <button type='button' className={clsx('bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white', currentMode === 'buy' ? 'visible' : 'invisible')} onClick={() => {
              if (currentCoin === 'sol')
                setCurrentCoin(tokenInfo?.ticker)
              else
                setCurrentCoin('sol')
            }}>switch to {currentCoin === 'sol' ? tokenInfo?.ticker : 'SOL'}</button>
            <button type='button' className='bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white' onClick={() => setIsSlippageDialogOpen(true)}>Set max slippage</button>
          </div>
          <div className='relative'>
            <input value={amount} onChange={onChangeAmount} type='number' className='px-6 py-2 bg-[#121212] h-[46px] text-sm border border-white text-[#808080] w-full rounded-lg' placeholder='0.0' />
            {currentMode === 'buy' ? (
              <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                <p className='text-sm text-white uppercase'>{currentCoin === 'sol' ? 'SOL' : tokenInfo?.ticker}</p>
                <Image
                  className='rounded-full'
                  src={currentCoin === 'sol' ? '/img7.png' : tokenInfo?.logo}
                  width={34}
                  height={34}
                  alt="sol"
                />
              </div>
            ) : (
              <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                <p className='text-sm text-white uppercase'>{tokenInfo?.ticker}</p>
                <Image
                  className='rounded-full'
                  src={tokenInfo?.logo}
                  width={34}
                  height={34}
                  alt="coin"
                />
              </div>
            )}
          </div>
          {currentMode === 'buy' ? (
            <div className='flex gap-1'>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(0)}>reset</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(1)}>1 SOL</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(5)}>5 SOL</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(10)}>10 SOL</button>
            </div>
          ) : (
            <div className='flex gap-1'>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(0)}>reset</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(tokenInfo?.tokenBalance / 4)}>25%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(tokenInfo?.tokenBalance / 2)}>50%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount((tokenInfo?.tokenBalance / 4) * 3)}>75%</button>
              <button type='button' className='bg-[#1A1A1A] px-4 py-1 rounded-lg text-sm text-white' onClick={() => setAmount(tokenInfo?.tokenBalance)}>100%</button>
            </div>
          )}
          <button type='button' className={`bg-white rounded-lg py-2 text-base `} onClick={onTrade}>Place trade</button>
        </div>
        {(tokenInfo?.twitter || tokenInfo?.telegram || tokenInfo?.website) && (
          <div className='flex justify-center gap-9 py-5 mx-auto bg-[#121212] border-t-2 border-r-2 border-b-2 border-[#282828] w-full'>
            {tokenInfo?.twitter !== null && (
              <a href={`${tokenInfo?.twitter}`} target='_blank' className='flex justify-center items-center gap-2'>
                <p className='text-sm font-semibold text-white'>Twitter</p>
                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.4932 14.5713L10.8025 7.91176L10.2722 7.15858L6.91672 2.39479L6.63872 2H2.51562L3.52121 3.42805L7.98264 9.76281L8.51295 10.5152L12.0976 15.605L12.3757 15.9994H16.4988L15.4932 14.5713ZM12.8657 15.0879L9.14154 9.80001L8.61123 9.04729L4.28969 2.91142H6.1486L9.64345 7.87364L10.1738 8.62636L14.7246 15.0878H12.8657V15.0879Z" fill="white" />
                  <path d="M8.61175 9.047L9.14206 9.79971L8.51335 10.5148L3.68954 15.9989H2.5L7.98304 9.7624L8.61175 9.047Z" fill="white" />
                  <path d="M16.0034 2L10.8036 7.91176L10.1748 8.62636L9.64453 7.87364L10.2732 7.15858L13.7956 3.15211L14.8139 2H16.0034Z" fill="white" />
                </svg>
              </a>
            )}
            {tokenInfo?.telegram !== null && (
              <a href={`${tokenInfo?.telegram}}`} target='_blank' className='flex justify-center items-center gap-2'>
                <p className='text-sm font-semibold text-white'>Telegram</p>
                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.4053 2.49219L2 8.31948V9.16179L6.12586 10.4355L7.43071 14.6217L8.47232 14.6215L10.1517 12.9033L13.6968 15.5072L14.3868 15.2446L17 2.9913L16.4053 2.49219ZM13.669 14.3961L9.00003 10.9667L8.47965 11.6751L9.4362 12.3777L8.07747 13.7426L7.0113 10.3222L13.1867 6.63502L12.7361 5.88029L6.46982 9.6217L3.43831 8.68586L15.9677 3.61745L13.669 14.3961Z" fill="white" />
                </svg>
              </a>
            )}
            {tokenInfo?.website !== null && (
              <a href={`${tokenInfo?.website}`} target='_blank' className='flex justify-center items-center gap-2'>
                <p className='text-sm font-semibold text-white'>Website</p>
                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 0.5625C7.83122 0.5625 6.19992 1.05735 4.81238 1.98448C3.42484 2.9116 2.34338 4.22936 1.70477 5.77111C1.06616 7.31286 0.899065 9.00936 1.22463 10.6461C1.55019 12.2828 2.35378 13.7862 3.53379 14.9662C4.7138 16.1462 6.21721 16.9498 7.85393 17.2754C9.49064 17.6009 11.1871 17.4338 12.7289 16.7952C14.2706 16.1566 15.5884 15.0752 16.5155 13.6876C17.4427 12.3001 17.9375 10.6688 17.9375 9C17.935 6.76301 17.0452 4.61837 15.4634 3.03658C13.8816 1.45479 11.737 0.565031 9.5 0.5625ZM9.5 16.3125C8.33844 16.3125 7.12232 14.8151 6.51875 12.375H12.4813C11.8777 14.8151 10.6616 16.3125 9.5 16.3125ZM6.29038 11.25C6.06988 9.7581 6.06988 8.2419 6.29038 6.75H12.7096C12.8212 7.49478 12.8765 8.24691 12.875 9C12.8765 9.75309 12.8212 10.5052 12.7096 11.25H6.29038ZM2.1875 9C2.18791 8.23587 2.30864 7.47657 2.54525 6.75H5.16088C4.94638 8.24233 4.94638 9.75767 5.16088 11.25H2.54525C2.30864 10.5234 2.18791 9.76413 2.1875 9ZM9.5 1.6875C10.6616 1.6875 11.8777 3.18488 12.4813 5.625H6.51875C7.12232 3.18488 8.33844 1.6875 9.5 1.6875ZM13.8391 6.75H16.4548C16.9316 8.2121 16.9316 9.7879 16.4548 11.25H13.8391C13.9458 10.5047 13.9996 9.75286 14 9C13.9996 8.24714 13.9458 7.49526 13.8391 6.75ZM15.9806 5.625H13.6366C13.3863 4.40157 12.8955 3.24004 12.1927 2.20781C13.8229 2.85795 15.1666 4.07012 15.9806 5.625ZM6.80732 2.20781C6.10451 3.24004 5.6137 4.40157 5.36338 5.625H3.01944C3.83345 4.07012 5.17711 2.85795 6.80732 2.20781ZM3.01944 12.375H5.36338C5.6137 13.5984 6.10451 14.76 6.80732 15.7922C5.17711 15.142 3.83345 13.9299 3.01944 12.375ZM12.1927 15.7922C12.8955 14.76 13.3863 13.5984 13.6366 12.375H15.9806C15.1666 13.9299 13.8229 15.142 12.1927 15.7922Z" fill="white" />
                </svg>
              </a>
            )}
          </div>
        )}
        {/* token info section */}
        <div className='max-md:hidden'>
          {tokenInfoSection}
        </div>
      </div>
      <PostDialog isPostDialogOpen={isPostDialogOpen} setIsPostDialogOpen={setIsPostDialogOpen} handleReply={handleReply} mentionReplyId={mentionReplyId} handleMentionReply={handleMentionReply} />
      <TradeDialog isTradeDialogOpen={isTradeDialogOpen} setIsTradeDialogOpen={setIsTradeDialogOpen} tokenMint={addr} ticker={tokenInfo?.ticker} amount={amount} isBuy={currentMode === 'buy'} setTxPending={setTxPending} />
      <SlippageDialog isSlippageDialogOpen={isSlippageDialogOpen} setIsSlippageDialogOpen={setIsSlippageDialogOpen} />
    </section>
  )
}

function PostDialog({ isPostDialogOpen, setIsPostDialogOpen, handleReply, mentionReplyId, handleMentionReply }) {
  const comment = useRef('')
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState(null)

  return (
    <Transition appear show={isPostDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none `} onClose={() => setIsPostDialogOpen(false)}>
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
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-lg bg-[#1B1D28] border border-white backdrop-blur-2xl">
                <div className="flex flex-col gap-2 w-full">
                  <p className='text-2xl font-bold text-white'>Add a comment</p>
                  <textarea ref={comment} className={`w-full h-[160px] rounded-xl px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none `} placeholder='Comment'></textarea>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p className='text-2xl font-bold text-white'>Image (Optional)</p>
                  <div className='relative'>
                    <label htmlFor="postImage" className='absolute right-4 inset-y-3.5'>
                      <div className={`bg-white rounded-xl p-3 text-xs cursor-pointer `}>Choose Image</div>
                      <input id='postImage' type='file' className='hidden' accept='image/*' onChange={(e) => {
                        if (e.target.files.length > 0) {
                          setImageName(e.target.files[0].name)
                          setImageFile(e.target.files[0])
                        }
                        else {
                          setImageName('')
                          setImageFile(null)
                        }
                      }} />
                    </label>
                    <input type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='Choose Image' value={imageName} disabled />
                  </div>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-white rounded-xl w-full h-[50px] text-xl font-bold' onClick={() => {
                    if (mentionReplyId === '')
                      handleReply(comment, imageFile)
                    else
                      handleMentionReply(mentionReplyId, comment, imageFile)
                  }}>Post Reply</button>
                  <button type='button' className='rounded-xl w-full h-[50px] text-xl text-white underline' onClick={() => setIsPostDialogOpen(false)}>Cancel</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function TradeDialog({ isTradeDialogOpen, setIsTradeDialogOpen, setTxPending, tokenMint, ticker, amount, isBuy }) {
  const comment = useRef('')
  const walletCtx = useWallet();
  const { isPoolCreated,
    getBuyTx,
    getSellTx,
    isPoolComplete
  } = useContract();

  const onTrade = async () => {
    if (!walletCtx.connected) {
      toast.error('Not connected wallet!');
      return;
    }

    setTxPending(true);
    const isPoolCompleted2 = await isPoolComplete(tokenMint, NATIVE_MINT);
    if (isPoolCompleted2) {
      // swap on Raydium
      const id = toast.loading(`Trading ${ticker}...`);

      try {
        let inputTokenAmount;
        let outputToken;

        if (isBuy) {
          inputTokenAmount = new TokenAmount(Token.WSOL, BigInt(Math.trunc(Number(amount) * LAMPORTS_PER_SOL)));
          outputToken = new Token(TOKEN_PROGRAM_ID, tokenMint, TOKEN_DECIMALS);
        }
        else {
          inputTokenAmount = new TokenAmount(new Token(TOKEN_PROGRAM_ID, tokenMint, TOKEN_DECIMALS),
            BigInt(Math.trunc(Number(amount) * (10 ** TOKEN_DECIMALS))));
          outputToken = Token.WSOL;
        }

        const marketId = await getMarketId(tokenMint, Token.WSOL.mint.toBase58());
        // console.log('marketId:', marketId);
        const txHashes = await swap(walletCtx, inputTokenAmount, outputToken, new PublicKey(marketId), isBuy);
        console.log('  trade txHashes:', txHashes);

        toast.dismiss(id);
        toast.success('Swap complete!');

        // await trade(tokenMint, isBuy,
        //   isBuy ? 0 : Number(amount), // To do - cryptoprince
        //   isBuy ? Number(amount) : 0, // To do - cryptoprince
        //   txHashes[0], 
        //   comment.current.value
        // );

        setIsTradeDialogOpen(false);
        setTxPending(false);
      } catch (err) {
        console.error(err);
        toast.dismiss(id);
        toast.error(err.message);
      }

      return;
    }

    const created = await isPoolCreated(tokenMint, NATIVE_MINT);
    if (!created) {
      toast.error(`Pool not created for token '${tokenMint}'`);
      return;
    }

    const id = toast.loading(`Trading ${ticker}...`);

    try {
      let tx = null;

      if (isBuy)
        tx = new Transaction().add(await getBuyTx(tokenMint, Number(amount)));
      else
        tx = new Transaction().add(await getSellTx(tokenMint, Number(amount)));
      // console.log('tx:', tx);

      const txHash = await send(connection, walletCtx, tx);
      console.log('  trade txHash:', txHash);

      toast.dismiss(id);
      toast.success('Trade complete!');

      await trade(tokenMint, isBuy,
        isBuy ? 0 : Number(amount), // To do - cryptoprince
        isBuy ? Number(amount) : 0, // To do - cryptoprince
        txHash,
        comment.current.value
      );

      setIsTradeDialogOpen(false);
      setTxPending(false);
    } catch (err) {
      console.error(err);
      toast.dismiss(id);
      toast.error(err.message);
    }
  };

  return (
    <Transition appear show={isTradeDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none `} onClose={() => setIsTradeDialogOpen(false)}>
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
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-lg bg-[#1B1D28] border border-white backdrop-blur-2xl">
                <div className='flex flex-col gap-6'>
                  <div className="flex flex-col gap-2">
                    <p className='text-2xl font-bold text-white'>Add a comment</p>
                    <textarea ref={comment} className={`w-full h-[160px] rounded-xl px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none `} placeholder='Comment'></textarea>
                  </div>
                  <p className='text-xl text-white'>
                    {isBuy ? (`Buy ${ticker} with ${amount} SOL`) : (`Sell ${amount} ${ticker}`)}
                  </p>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-white rounded-xl w-full h-[50px] text-xl font-bold' onClick={onTrade}>Place Trade</button>
                  <button type='button' className='rounded-xl w-full h-[50px] text-xl text-white underline' onClick={() => setIsTradeDialogOpen(false)}>Cancel</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function SlippageDialog({ isSlippageDialogOpen, setIsSlippageDialogOpen }) {
  const slippage = useRef('')

  return (
    <Transition appear show={isSlippageDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none `} onClose={() => setIsSlippageDialogOpen(false)}>
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
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-lg bg-[#1B1D28] border border-white backdrop-blur-2xl">
                <div className='flex flex-col gap-6'>
                  <div className="flex flex-col gap-2">
                    <p className='text-2xl font-bold text-white'>Set max slippage (%)</p>
                    <input ref={slippage} type='number' className={`w-full h-[58px] rounded-xl px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none `} />
                  </div>
                  <p className='text-xl text-white'>This is the maximum amount of slippage you are willing to accept when placing trades</p>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-white rounded-xl w-full h-[50px] text-xl font-bold' onClick={() => setIsSlippageDialogOpen(false)}>Place Trade</button>
                  <button type='button' className='rounded-xl w-full h-[50px] text-xl text-white underline' onClick={() => setIsSlippageDialogOpen(false)}>Cancel</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}