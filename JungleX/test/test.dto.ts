import { Bytes } from "ethers";
import { Address } from "viem";
import { Contract, Signer } from "ethers";

export type ApproveVoucherReqType = {
  signer: Signer;
  nftContract: string;
  owner: string;
  operator: string;
  approved: boolean;
  nonce: number;
  deadline: number;
};

export type ApproveVoucherType = {
  owner: Address;
  operator: Address;
  approved: boolean;
  nonce: number;
  deadline: number;
};

export type VoucherReqType = {
  marketContract: Contract;
  signer: Signer;
  buyer: string;
  seller: string;
  creator: string;
  tokenId: number;
  contentsId: number;
  price: number;
  nonce: number;
};

export type VoucherType = {
  buyer: Address;
  seller: Address;
  creator: Address;
  tokenId: number;
  contentsId: number;
  price: number;
  nonce: number;
};

export type VoucherResType = {
  buyer: Address;
  seller: Address;
  creator: Address;
  tokenId: number;
  contentsId: number;
  price: number;
  nonce: number;
  signature: Bytes;
};

export type PermitVoucherReqType = {
  signer: Signer;
  tokenContract: string;
  owner: string;
  spender: string;
  value: number;
  nonce: number;
  deadline: number;
};

export type PermitVoucherType = {
  owner: Address;
  spender: Address;
  value: number;
  nonce: number;
  deadline: number;
};

export type PermitVoucherResType = {
  owner: Address;
  value: number;
  deadline: number;
  v: number;
  r: string;
  s: string;
};
