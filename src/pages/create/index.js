"use client"

import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from "react-toastify"
import { useWallet } from '@solana/wallet-adapter-react'

import { VersionedTransaction, 
    TransactionMessage 
} from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import { useContract } from '../../contexts/ContractContext'
import { TOKEN_TOTAL_SUPPLY } from '@/engine/consts'
import { connection, 
  addLookupTableInfo 
} from '../../engine/config'
import { createToken } from '../../engine/createToken'
import { send } from '../../engine/utils'
import { updateToken } from '@/api/token'

export default function CreateCoin() {
  const { connected } = useWallet();

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const coinName = useRef(null)
  const ticker = useRef(null)
  const description = useRef(null)
  const [coinImage, setCoinImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imgBufer, setImageBuffer] = useState()
  const twitterLink = useRef(null)
  const telegramLink = useRef(null)
  const website = useRef(null)

  const handleCreateCoin = () => {
    if (coinName.current?.value === '') {
      toast.error('No name!')
      return
    }
    if (imageName === '') {
      toast.error('No image uploaded!')
      return
    }
    if (ticker.current?.value === '') {
      toast.error('No ticker!')
      return
    }
    if (!connected) {
      toast.error('Not connected wallet!')
      return
    }

    setIsDialogOpen(true)
  };

  const handleFileRead = (event) => {
    const imageBuffer = event.target.result;
    // console.log('imageBuffer:', imageBuffer);
    setImageBuffer(imageBuffer);
  };

  return (
    <section className={`flex flex-col gap-8 sm:max-w-[400px] w-full mx-auto pt-10 sm:pt-[80px] px-4 pb-20`}>
      <div className='flex flex-col gap-8 z-10'>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-2xl font-bold text-white'>Name</p>
          <input ref={coinName} type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='Name' />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-2xl font-bold text-white'>Ticker</p>
          <input ref={ticker} type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='Ticker' />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-2xl font-bold text-white'>Description</p>
          <textarea ref={description} className={`w-full h-[179px] rounded-xl px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none `} placeholder='Description'></textarea>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <p className='text-2xl font-bold text-white'>Choose Image</p>
          <div className='relative'>
            <label htmlFor="coinImage" className='absolute right-4 inset-y-3.5'>
              <div className={`bg-white rounded-xl p-3 text-xs cursor-pointer `}>Choose Image</div>
              <input id='coinImage' type='file' className='hidden' accept='image/*' onChange={(e) => {
                if (e.target.files.length > 0) {
                  const src = URL.createObjectURL(e.target.files[0])
                  setCoinImage(src)
                  setImageName(e.target.files[0].name)
                  setImageFile(e.target.files[0])

                  let reader = new FileReader();
                  reader.onload = handleFileRead;
                  reader.readAsArrayBuffer(e.target.files[0]);
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
        <Disclosure as="div" defaultOpen={false}>
          <DisclosureButton className="group flex w-full items-center gap-2">
            <span className={`text-base text-[#FFCC48] `}>
              Show more option
            </span>
            <svg className='group-data-[open]:rotate-180' width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 21.25C17.6086 21.25 21.75 17.1086 21.75 12C21.75 6.89137 17.6086 2.75 12.5 2.75C7.39137 2.75 3.25 6.89137 3.25 12C3.25 17.1086 7.39137 21.25 12.5 21.25Z" stroke="#E0B33F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14.9101 11L12.5001 13L10.0901 11" stroke="#E0B33F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </DisclosureButton>
          <DisclosurePanel className="mt-8 flex flex-col gap-8">
            <div className="flex flex-col gap-2 w-full">
              <p className='text-2xl font-bold text-white'>Twitter Link</p>
              <input ref={twitterLink} type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='(Optional)' />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className='text-2xl font-bold text-white'>Telegram Link</p>
              <input ref={telegramLink} type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='(Optional)' />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className='text-2xl font-bold text-white'>Website</p>
              <input ref={website} type="text" className={`w-full h-[69px] rounded-xl px-6 border border-white text-[#808080] bg-[#121212] text-base `} placeholder='(Optional)' />
            </div>
          </DisclosurePanel>
        </Disclosure>
        <button type="button" className={`bg-white rounded-lg w-full h-10 text-base `} onClick={handleCreateCoin}>Create Coin</button>
        {/* <p className={`text-xl text-white `}>Cost to deploy: ~0.02 SOL</p> */}
        <CreateCoinDialog isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen}
          name={coinName.current?.value}
          ticker={ticker.current?.value}
          description={description.current?.value}
          coinImage={coinImage}
          imgFile={imageFile}
          imgBuffer={imgBufer}
          twitterLink={twitterLink.current?.value}
          telegramLink={telegramLink.current?.value}
          websiteLink={website.current?.value}
        />
      </div>
    </section>
  )
}

function CreateCoinDialog({ isDialogOpen, setIsDialogOpen, name, ticker, description, imgFile, imgBuffer, twitterLink, telegramLink, websiteLink }) {
  const walletCtx = useWallet();
  const { isContractInitialized, 
    getCreatePoolTx, 
    getBuyTx 
  } = useContract();

  const [mode, setMode] = useState('sol');
  const [amount, setAmount] = useState();

  const onChangeAmount = (e) => {
    if (Number(e.target.value) < 0) return;
    setAmount(e.target.value);
  }

  const handleCreateCoin = async () => {
    if (!walletCtx.connected) {
      toast.error('Not connected wallet!');
      return;
    }
    
    const id = toast.loading(`Creating '${name}' token...`);

    try {
      const isInitialized = await isContractInitialized();
      if (!isInitialized) {
        toast.error('Contract not initialized yet!');
        return;
      }

      const { mintKeypair, imageUrl, createIxs: allIxs } = await createToken(walletCtx, name, ticker, description, imgBuffer, imgFile, websiteLink, twitterLink, telegramLink);

      const createPoolTx = await getCreatePoolTx(mintKeypair.publicKey.toBase58(), TOKEN_TOTAL_SUPPLY, NATIVE_MINT, 0);
      allIxs.push(createPoolTx);

      if (Number(amount) > 0) {
        const buyTx = await getBuyTx(mintKeypair.publicKey.toBase58(), Number(amount));
        allIxs.push(buyTx);
      }

      console.log('allIxs:', allIxs);

      const blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
      const message = new TransactionMessage({
        payerKey: walletCtx.publicKey, 
        instructions: allIxs, 
        recentBlockhash: blockhash, 
      }).compileToV0Message(Object.values({ ...(addLookupTableInfo ?? {}) }));
      const transaction = new VersionedTransaction(message);
      transaction.sign([mintKeypair]);

      const txHash = await send(connection, walletCtx, transaction);
      console.log('txHash:', txHash);

      const result = await updateToken(name, ticker, description, imageUrl, twitterLink, telegramLink, websiteLink, mintKeypair.publicKey.toBase58());
      if (!result) {
        toast.dismiss(id);
        toast.error("Failed to update token info!");
        setIsDialogOpen(false);
        return;
      }

      toast.dismiss(id);
      toast.success(`Created a new bonding curve with token '${name}'`);

      setIsDialogOpen(false);
    } catch (err) {
      console.error('handleCreateCoin err:', err);
      toast.dismiss(id);
      toast.error(err.message);
    }
  }

  return (
    <Transition appear show={isDialogOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none`} onClose={() => setIsDialogOpen(false)}>
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
                <p className='text-[32px] text-bold text-white'>Choose how many [{ticker}] you want to buy (Optional)</p>
                <p className='text-xl text-white'>Tip: Its optional but buying a small amount of coins helps protect your coin from snipers</p>
                <div className='flex flex-col gap-2 items-end'>
                  <button type='button' className='text-xl text-white text-bold cursor-pointer' onClick={() => {
                    if (mode === 'sol')
                      setMode('coin')
                    else
                      setMode('sol')
                  }}>Switch to {ticker}</button>
                  <div className='relative w-full'>
                    {mode === 'sol' ? (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className={`text-xl text-white `}>SOL</p>
                        <Image
                          src="/sol.png"
                          width={32}
                          height={32}
                          alt="sol"
                        />
                      </div>
                    ) : (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className={`text-xl text-white `}>{ticker}</p>
                        <Image
                          className='rounded-full'
                          src={coinImage}
                          width={32}
                          height={32}
                          alt="coin"
                        />
                      </div>
                    )}
                    <input value={amount} onChange={onChangeAmount} 
                      type="number" 
                      className={`w-full h-[74px] bg-[#121212] pl-6 rounded-xl border border-white text-[#808080] text-base `} 
                      placeholder='0.0 (optional)' 
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-white rounded-xl w-full h-[50px] text-xl text-bold' onClick={handleCreateCoin}>Create Coin</button>
                  {/* <p className={`text-xl text-white `}>Cost to deploy: ~0.02 SOL</p> */}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}