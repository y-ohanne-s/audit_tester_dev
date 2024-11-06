// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.20;

import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IGuitarCryptone} from "./interfaces/IGuitarCryptone.sol";

contract GuitarCryptoneGateway is ERC721Holder, AccessControl, ReentrancyGuard {
  /* Event */
  event NftImported(address indexed from, uint256 indexed erc721Type, uint256[] tokenIds, string id);
  event NftExported(address indexed to, uint256 indexed erc721Type, uint256[] tokenIds, string id);

  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  /* State variable */
  mapping(uint256 => address) public erc721Addresses;
  mapping(address => mapping(uint256 => address)) public erc721TokenImporters;

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _grantRole(OPERATOR_ROLE, _msgSender());
  }

  /* Management function */
  function setERC721Addresses(uint256[] calldata erc721Types_, address[] calldata erc721Addresses_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(erc721Types_.length == erc721Addresses_.length);
    for (uint256 i = 0; i < erc721Types_.length; ) {
      erc721Addresses[erc721Types_[i]] = erc721Addresses_[i];
      unchecked {
        i += 1;
      }
    }
  }

  function importNfts(
    address from_,
    uint256 erc721Type_,
    uint256[] calldata tokenIds_,
    string calldata id_,
    uint256 deadline,
    bytes[] calldata signatures
  ) external onlyRole(OPERATOR_ROLE) {
    address erc721Address = erc721Addresses[erc721Type_];
    require(erc721Address != address(0), "INVALID_ERC721_TYPE");
    require(tokenIds_.length > 0, "INVALID_TOKEN_IDS");
    _processBatch(from_, erc721Address, tokenIds_.length, deadline, tokenIds_, signatures);
    emit NftImported(from_, erc721Type_, tokenIds_, id_);
  }

  function _processBatch(
    address from_,
    address erc721Address,
    uint256 batchSize,
    uint256 deadline,
    uint256[] calldata tokenIds,
    bytes[] calldata signatures
  ) internal {
    IGuitarCryptone erc721Contract = IGuitarCryptone(erc721Address);

    for (uint256 i = 0; i < batchSize; ) {
      uint256 tokenId = tokenIds[i];
      erc721TokenImporters[erc721Address][tokenId] = from_;
      erc721Contract.safeTransferFromWithPermit(from_, address(this), tokenId, deadline, signatures[i]);
      unchecked {
        i += 1;
      }
    }
  }

  function exportNfts(
    address to_,
    uint256 erc721Type_,
    uint256[] calldata tokenIds_,
    string calldata id_
  ) external nonReentrant onlyRole(OPERATOR_ROLE) {
    address erc721Address = erc721Addresses[erc721Type_];
    require(erc721Address != address(0), "INVALID_ERC721_TYPE");
    require(to_ != address(0), "INVALID_ADDRESS");
    require(tokenIds_.length > 0, "INVALID_TOKEN_IDS");

    IGuitarCryptone erc721Contract = IGuitarCryptone(erc721Address);
    uint256 count = tokenIds_.length;
    for (uint256 i = 0; i < count; ) {
      uint256 tokenId = tokenIds_[i];
      address importor = erc721TokenImporters[erc721Address][tokenId];
      if (importor == address(0)) {
        erc721Contract.safeMint(to_, tokenId);
      } else if (importor == to_) {
        erc721Contract.safeTransferFrom(address(this), to_, tokenId);
        erc721TokenImporters[erc721Address][tokenId] = address(0);
      } else {
        revert("INVALID_IMPORTER");
      }
      unchecked {
        i += 1;
      }
    }

    emit NftExported(to_, erc721Type_, tokenIds_, id_);
  }
}
