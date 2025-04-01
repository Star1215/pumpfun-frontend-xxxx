"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRef, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { getFollowings, setFollow, setUnFollow } from '@/api/user'
import { useWallet } from "@solana/wallet-adapter-react";
import { findTokens, getKing } from '@/api/token'
import { getUserId } from '@/utils'
import { isMainNet } from "@/engine/config"

const sortType = [
  { id: 1, name: 'sort: bump order' },
  { id: 2, name: 'sort: last reply' },
  { id: 3, name: 'sort: reply count' },
  { id: 4, name: 'sort: market cap' },
  { id: 5, name: 'sort: creation time' },
]

const orderType = [
  { id: 1, name: 'sort: desc' },
  { id: 2, name: 'sort: asc' },
]

export default function BoardPage() {
  const wallet = useWallet()
  console.log('debug is mainnet::', isMainNet)
  const tokenDiv = useRef(null)
  const [currentTab, setCurrentTab] = useState('Terminal')
  const searchTokenName = useRef('')
  const [sortSelected, setSortSelected] = useState(sortType[0])
  const [orderSelected, setOrderSelected] = useState(orderType[0])
  const [showAnimations, setShowAnimations] = useState(true)
  const showAnimationsRef = useRef(showAnimations)
  const [includeNSFW, setIncludeNSFW] = useState(true)
  const [followingList, setFollowingList] = useState(null)
  const [tokenList, setTokenList] = useState(null)
  const [kingToken, setKingToken] = useState(null)

  useEffect(() => {
    getTokenList(searchTokenName.current.value, sortSelected.name, orderSelected.name, includeNSFW)
    getKingToken()

    const interval = setInterval(() => {
      if (tokenDiv.current && showAnimationsRef.current === true) {
        if (tokenDiv.current.classList.contains('animate-shake') === true)
          tokenDiv.current.classList.remove('animate-shake')
        else
          tokenDiv.current.classList.add('animate-shake')
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [])

  useEffect(() => {
    showAnimationsRef.current = showAnimations
  }, [showAnimations])

  useEffect(() => {
    getFollowingData()
  }, [])

  const getKingToken = async () => {
    const result = await getKing()
    // console.log(result)
    setKingToken(result)
  }

  const getTokenList = async (tokenName, sort, order, nsfw) => {
    const result = await findTokens(tokenName, sort, order, nsfw === true ? 1 : 0)
    // console.log(result)
    setTokenList(result)
  }

  const getFollowingData = async () => {
    const userId = getUserId()
    const result = await getFollowings(userId)
    setFollowingList(result)
  }

  const handleFollow = async (_id) => {
    await setFollow(_id)
    getFollowingData()
  }

  const handleUnFollow = async (_id) => {
    await setUnFollow(_id)
    getFollowingData()
  }

  return (
    <section className={`z-10 flex flex-col pt-10 sm:pt-4 gap-4 justify-center px-2 pb-20`}>
      <div className='z-[9] flex flex-col gap-8'>
        {kingToken !== null && (
          <Link href={`/token/${kingToken?.mintAddr}`} className="flex flex-col gap-4 w-fit mx-auto border hover:border-white border-transparent p-2">
            <div className='flex flex-col gap-4 bg-white w-full sm:w-[483px] mx-auto p-2'>
              <div className={`font-normal text-xl tracking-[8px] text-white bg-black text-center uppercase `}>king of the hill</div>
              <div className='flex gap-[22px] items-center'>
                <Image
                  src={kingToken?.logo}
                  width={100}
                  height={100}
                  alt=""
                />
                <div className='flex flex-col gap-2'>
                  <p className={`text-xl font-bold`}>{kingToken?.name} [ticker: {kingToken?.ticker}]</p>
                  <div className='flex flex-col'>
                    <p className={`text-base`}>Created by: {kingToken?.username}</p>
                    <p className={`text-base`}>Market cap: {kingToken?.marketCap?.toFixed(2)}k</p>
                    <p className={`text-base`}>Replies: {kingToken?.replies}</p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}
        <Link href="/create" className='flex mx-auto font-semibold text-2xl text-white'>
          [start a new coin]
        </Link>
      </div>
      <div className='z-10 flex flex-col gap-4'>
        <div className='relative w-full sm:max-w-[380px] sm:w-1/2 mx-auto'>
          <svg className='absolute right-4 inset-y-[15%] cursor-pointer' width="24" height="24" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={() => getTokenList(searchTokenName.current.value, sortSelected.name, orderSelected.name, includeNSFW)}>
            <g clipPath="url(#clip0_1_90)">
              <path d="M27.1461 24.9255L33.5706 31.3485L31.4481 33.471L25.0251 27.0465C22.6352 28.9623 19.6626 30.0044 16.5996 30C9.14761 30 3.09961 23.952 3.09961 16.5C3.09961 9.048 9.14761 3 16.5996 3C24.0516 3 30.0996 9.048 30.0996 16.5C30.104 19.563 29.0619 22.5356 27.1461 24.9255ZM24.1371 23.8125C26.0408 21.8548 27.1039 19.2306 27.0996 16.5C27.0996 10.698 22.4001 6 16.5996 6C10.7976 6 6.09961 10.698 6.09961 16.5C6.09961 22.3005 10.7976 27 16.5996 27C19.3303 27.0043 21.9544 25.9412 23.9121 24.0375L24.1371 23.8125Z" fill="white" />
            </g>
            <defs>
              <clipPath id="clip0_1_90">
                <rect width="36" height="36" fill="white" transform="translate(0.0996094)" />
              </clipPath>
            </defs>
          </svg>
          <input ref={searchTokenName} type="text" className={`w-full h-[40px] bg-[#121212] p-4 rounded-lg border border-white text-white text-sm `} placeholder='Search for token' onKeyDown={(e) => {
            if (e.key === 'Enter')
              getTokenList(searchTokenName.current.value, sortSelected.name, orderSelected.name, includeNSFW)
          }} />
        </div>
        <div className='flex flex-col gap-6'>
          {/* <div className='flex gap-6'>
            <div className={clsx(`text-2xl cursor-pointer`, currentTab === 'Following' ? 'font-bold text-white' : 'font-normal text-[#808080]')} onClick={() => setCurrentTab('Following')}>Following</div>
            <div className={clsx(`text-2xl cursor-pointer`, currentTab === 'Terminal' ? 'font-bold text-white' : 'font-normal text-[#808080]')} onClick={() => setCurrentTab('Terminal')}>Terminal</div>
          </div> */}
          {currentTab === 'Following' ? (
            <div className='flex flex-col gap-6'>
              <p className={`text-xl text-white`}>Follow some of your friends to start curating your feed</p>
              {wallet.publicKey !== null && (
                <div className='flex gap-6'>
                  <p className={`text-xl text-white`}>People you may know</p>
                  <button type='button' className={`text-xl text-[#808080]`} onClick={getFollowingData}>[Refresh]</button>
                </div>
              )}
              <div className='flex flex-col sm:flex-row gap-6'>
                {followingList !== null && followingList.map((item, index) => {
                  return (
                    <div key={index} className='flex flex-col gap-2'>
                      <div className='flex gap-2 items-center'>
                        <Image
                          className='rounded-full'
                          src={item.avatar === null ? '/img3.png' : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`}
                          width={24}
                          height={24}
                          alt=""
                        />
                        <p className={`text-xl text-white`}>{item.username}</p>
                      </div>
                      <p className={`text-xl text-[#808080]`}>{item.numFollowers} Followers</p>
                      {item.followed === true ? (
                        <button type='button' className='bg-white rounded-lg text-base w-[200px] h-[37px]' onClick={() => handleUnFollow(item._id)}>UnFollow</button>
                      ) : (
                        <button type='button' className='bg-white rounded-lg text-base w-[200px] h-[37px]' onClick={() => handleFollow(item._id)}>Follow</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-6 sm:px-12'>
              <div className='flex flex-col sm:flex-row items-center gap-6'>
                <div className='flex flex-col sm:flex-row gap-3 max-sm:w-full'>
                  <Listbox value={sortSelected} onChange={setSortSelected}>
                    <ListboxButton
                      className={clsx(
                        `group flex justify-between items-center w-[170px] max-sm:w-full bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white`,
                        `focus:outline-none data-[focus]:outline-none`
                      )}
                    >
                      {sortSelected.name}
                      <svg className='group-data-[open]:rotate-180' width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5373 21.75C17.6459 21.75 21.7873 17.6086 21.7873 12.5C21.7873 7.39137 17.6459 3.25 12.5373 3.25C7.42866 3.25 3.28729 7.39137 3.28729 12.5C3.28729 17.6086 7.42866 21.75 12.5373 21.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14.9473 11.5L12.5373 13.5L10.1273 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions
                        anchor="bottom"
                        className="w-[var(--button-width)] rounded-lg border border-white/5 bg-[#1A1A1A] p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none z-10"
                      >
                        {sortType.map((sort) => (
                          <ListboxOption
                            key={sort.name}
                            value={sort}
                            className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                            onClick={() => getTokenList(searchTokenName.current.value, sort.name, orderSelected.name, includeNSFW)}
                          >
                            <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                            <div className={`text-sm text-white`}>{sort.name}</div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </Listbox>
                  <Listbox value={orderSelected} onChange={setOrderSelected}>
                    <ListboxButton
                      className={clsx(
                        `group flex justify-between items-center w-[130px] max-sm:w-full bg-[#1A1A1A] rounded-lg px-4 py-[10px] text-sm text-white`,
                        `focus:outline-none data-[focus]:outline-none`
                      )}
                    >
                      {orderSelected.name}
                      <svg className='group-data-[open]:rotate-180' width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5373 21.75C17.6459 21.75 21.7873 17.6086 21.7873 12.5C21.7873 7.39137 17.6459 3.25 12.5373 3.25C7.42866 3.25 3.28729 7.39137 3.28729 12.5C3.28729 17.6086 7.42866 21.75 12.5373 21.75Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14.9473 11.5L12.5373 13.5L10.1273 11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </ListboxButton>
                    <Transition leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <ListboxOptions
                        anchor="bottom"
                        className="w-[var(--button-width)] rounded-lg border border-white/5 bg-[#1A1A1A] p-1 [--anchor-gap:var(--spacing-1)] focus:outline-none z-10"
                      >
                        {orderType.map((order) => (
                          <ListboxOption
                            key={order.name}
                            value={order}
                            className="group flex cursor-default items-center gap-2 rounded-lg py-1.5 px-3 select-none data-[focus]:bg-white/10"
                            onClick={() => getTokenList(searchTokenName.current.value, sortSelected.name, order.name, includeNSFW)}
                          >
                            <CheckIcon className="invisible size-4 fill-white group-data-[selected]:visible" />
                            <div className={`text-sm text-white`}>{order.name}</div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </Listbox>
                </div>
                <div className='flex gap-8'>
                  <div className='flex gap-1'>
                    <p className={`text-sm text-white`}>Show animations:</p>
                    <div className='flex gap-1 items-center'>
                      <button type="button" className={clsx('rounded-[4px] px-2 text-sm', showAnimations === true ? 'bg-white text-black' : 'bg-none text-white')} onClick={() => setShowAnimations(true)}>On</button>
                      <button type="button" className={clsx('rounded-[4px] px-2 text-sm', showAnimations === true ? 'bg-none text-white' : 'bg-white text-black')} onClick={() => setShowAnimations(false)}>Off</button>
                    </div>
                  </div>
                  <div className='flex gap-1'>
                    <p className={`text-sm text-white`}>Include nsfw:</p>
                    <div className='flex gap-1 items-center'>
                      <button type="button" className={clsx('rounded-[4px] px-2 text-sm', includeNSFW === true ? 'bg-white text-black' : 'bg-none text-white')} onClick={() => {
                        setIncludeNSFW(true)
                        getTokenList(searchTokenName.current.value, sortSelected.name, orderSelected.name, true)
                      }}>On</button>
                      <button type="button" className={clsx('rounded-[4px] px-2 text-sm', includeNSFW === true ? 'bg-none text-white' : 'bg-white text-black')} onClick={() => {
                        setIncludeNSFW(false)
                        getTokenList(searchTokenName.current.value, sortSelected.name, orderSelected.name, false)
                      }}>Off</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6'>
                {tokenList !== null && tokenList.map((item, index) => {
                  return (
                    <Link key={index} ref={index === 0 ? tokenDiv : null} href={`/token/${item.mintAddr}`} className='flex gap-5 items-start border hover:border-white border-transparent p-2'>
                      <Image
                        src={item.logo}
                        width={120}
                        height={120}
                        alt=""
                      />
                      <div className='flex flex-col'>
                        <div className='flex gap-2 items-center'>
                          <p className={`text-xs text-white`}>Created by</p>
                          <Image
                            src={item.avatar === null ? "/img3.png" : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`}
                            width={18}
                            height={18}
                            alt=""
                          />
                          <Link href={`/profile/${item.walletAddr}`} className={`text-xs text-white hover:underline`}>{item.username}</Link>
                        </div>
                        <p className={`text-xs text-[#97FF73]`}>Market cap: {item.marketCap.toFixed(2)}K</p>
                        <p className={`text-xs text-[#808080]`}>Replies: {item.replies}</p>
                        <p className={`text-sm text-[#808080]`}><span className='font-bold'>{`${item.name} (ticker: ${item.ticker}): `}</span>{item.desc}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}