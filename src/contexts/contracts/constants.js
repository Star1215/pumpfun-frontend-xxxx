
import { PublicKey } from '@solana/web3.js';
import { isMainNet } from '@/engine/config';

export const FEE_PRE_DIV = 1000;

export const PUMPFUN_PROGRAM_ID = isMainNet ? new PublicKey("J1VXiarstjLXGQHmUxsZtUa5Ek1ZXfk3GNzdaUF11Tv6") : new PublicKey("H5LZJeF5EYqon3a8crePnYrtStZawhGLQZs5xvsZeuxA")
export const MAINSTATE_PREFIX_SEED = "main";
export const POOLSTATE_PREFIX_SEED = "pool";
