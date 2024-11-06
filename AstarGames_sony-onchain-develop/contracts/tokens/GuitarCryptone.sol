// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.20;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

contract GuitarCryptone is ERC721Upgradeable, EIP712Upgradeable, AccessControlUpgradeable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  mapping(uint256 => uint256) private _nonces;
  // solhint-disable-next-line var-name-mixedcase
  /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
  bytes32 private constant PERMIT_TYPEHASH = keccak256("Permit(address spender,uint256 tokenId,uint256 nonce,uint256 deadline)");

  /* State variable */
  string public baseURI;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(string memory name_, string memory symbol_, string calldata baseURI_) public initializer {
    __ERC721_init(name_, symbol_);
    __EIP712_init(name_, "1");
    __AccessControl_init();

    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _grantRole(MINTER_ROLE, _msgSender());
    baseURI = baseURI_;
  }

  function setBaseURI(string calldata baseURI_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    baseURI = baseURI_;
  }

  function mintBatch(address[] calldata tos_, uint256[] calldata tokenIds_) public onlyRole(MINTER_ROLE) {
    require(tos_.length == tokenIds_.length, "GuitarCryptone: INVALID_LENGTH");
    for (uint256 i = 0; i < tos_.length; ) {
      _safeMint(tos_[i], tokenIds_[i]);
      unchecked {
        i += 1;
      }
    }
  }

  function safeMint(address to_, uint256 tokenId_) public onlyRole(MINTER_ROLE) {
    _safeMint(to_, tokenId_);
  }

  function burnBatch(uint256[] calldata tokenIds_) public onlyRole(MINTER_ROLE) {
    address sender = _msgSender();
    for (uint256 i = 0; i < tokenIds_.length; ) {
      _update(address(0), tokenIds_[i], sender);
      unchecked {
        i += 1;
      }
    }
  }

  /* Override function  */
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function nonces(uint256 tokenId) external view virtual returns (uint256) {
    return _nonces[tokenId];
  }

  function permit(address spender, uint256 tokenId, uint256 deadline, bytes calldata signature) external {
    _permit(spender, tokenId, deadline, signature);
  }

  function _permit(address spender, uint256 tokenId, uint256 deadline, bytes calldata signature) internal virtual {
    bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, spender, tokenId, _nonces[tokenId], deadline));
    bytes32 hash = _hashTypedDataV4(structHash);

    address signer = ECDSA.recover(hash, signature);
    bool isValidEOASignature = signer != address(0) && _isApprovedOrOwner(signer, tokenId);
    require(signer != address(0), "ERC721Permit: Zero signer!");
    require(_isApprovedOrOwner(signer, tokenId), "ERC721Permit: not owner!");

    require(
      isValidEOASignature ||
        _isValidContractERC1271Signature(ownerOf(tokenId), hash, signature) ||
        _isValidContractERC1271Signature(getApproved(tokenId), hash, signature),
      "ERC721Permit: invalid signature"
    );

    _permitApprove(spender, tokenId);
  }

  function _permitApprove(address to, uint256 tokenId) internal {
    address auth = _requireOwned(tokenId);
    _approve(to, tokenId, auth, false);
  }

  function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
    address owner = _requireOwned(tokenId);
    return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
  }

  function _isValidContractERC1271Signature(address signer, bytes32 hash, bytes calldata signature) private view returns (bool) {
    (bool success, bytes memory result) = signer.staticcall(abi.encodeWithSelector(IERC1271.isValidSignature.selector, hash, signature));
    return (success && result.length == 32 && abi.decode(result, (bytes4)) == IERC1271.isValidSignature.selector);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function safeTransferFromWithPermit(
    address from,
    address to,
    uint256 tokenId,
    uint256 deadline,
    bytes calldata signature
  ) external onlyRole(MINTER_ROLE) {
    _permit(to, tokenId, deadline, signature);
    _nonces[tokenId] += 1;
    safeTransferFrom(from, to, tokenId, "");
  }
}

