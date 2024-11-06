//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IGuitarCryptone {
  function safeMint(address to_, uint256 tokenId_) external;

  function mintBatch(address[] calldata tos_, uint256[] calldata tokenIds_) external;

  function burnBatch(uint256[] calldata tokenIds_) external;

  function safeTransferFrom(address from_, address to_, uint256 tokenId_) external;

  function safeTransferFromWithPermit(address from, address to, uint256 tokenId, uint256 deadline, bytes memory signature) external;
}
