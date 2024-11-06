// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity 0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
  function transfer(address to, uint256 value) external returns (bool);

  function transferFrom(address from, address to, uint256 value) external returns (bool);

  function allowance(address owner, address spender) external view returns (uint256);

  function balanceOf(address account) external returns (uint256);
}

contract GuitarCryptonePaymentGateway is AccessControl, ReentrancyGuard {
  using ECDSA for bytes32;
  using MessageHashUtils for bytes32;

  /* Event */
  event Paid(address userAddress, uint256 amount, uint256 erc20Type, string id, uint256 timestamp);
  event Claimed(address userAddress, uint256 amount, uint256 erc20Type, string id, uint256 timestamp);
  event Deposited(uint256 amount, uint256 erc20Type, uint256 timestamp);
  event Withdrawn(uint256 amount, uint256 erc20Type, uint256 timestamp);

  /* Struct */
  struct Signature {
    uint256 timestamp;
    bytes32 orderId;
    bytes32 identifier;
    bytes signature;
  }

  /* Constant */
  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
  bytes32 public constant CONTRACT_ID = keccak256("GuitarCryptonePaymentGateway");

  /* State variable */
  mapping(uint256 => address) public erc20Addresses;
  mapping(address => mapping(uint256 => uint256)) public totalDepositedAmountByAddresses;
  mapping(address => mapping(uint256 => uint256)) public totalWithdrawnAmountByAddresses;

  address public verifierAddress;
  uint256 private _signatureExpireTime;
  mapping(bytes32 => bool) private _executedOrderIds;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor(address verifier_, uint256 expireTime_) {
    require(verifier_ != address(0), "Zero address");

    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    _grantRole(OPERATOR_ROLE, _msgSender());

    verifierAddress = verifier_;
    _signatureExpireTime = expireTime_;
  }

  /* Management function */
  function setERC20Addresses(uint256[] calldata erc20Types_, address[] calldata erc20Addresses_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(erc20Types_.length == erc20Addresses_.length);
    for (uint256 i = 0; i < erc20Types_.length; ) {
      erc20Addresses[erc20Types_[i]] = erc20Addresses_[i];
      unchecked {
        i += 1;
      }
    }
  }

  function setVerifierAdress(address verifier_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(verifier_ != address(0), "Zero Address");
    verifierAddress = verifier_;
  }

  function setSignatureExpireTime(uint256 expireTime_) external onlyRole(DEFAULT_ADMIN_ROLE) {
    _signatureExpireTime = expireTime_;
  }

  /* Modifier */
  modifier isUsableSignature(
    bytes32 orderId_,
    uint256 timestamp_,
    bytes32 identifier_
  ) {
    require(!_executedOrderIds[orderId_], "Signature has already used");
    require(identifier_ == CONTRACT_ID, "Invalid contract identifier");
    require(timestamp_ + _signatureExpireTime >= block.timestamp, "Signature has already expired");
    _;
  }

  /* Main function */
  function payment(
    uint256 amount_,
    uint256 erc20Type_,
    string calldata id_,
    Signature calldata signature_
  ) external nonReentrant isUsableSignature(signature_.orderId, signature_.timestamp, signature_.identifier) {
    address sender = _msgSender();
    require(_isValidAmountSignature(signature_, sender, amount_, erc20Type_, id_), "Invalid signature");

    IERC20 erc20 = _checkErc20Amount(amount_, erc20Type_);
    _executedOrderIds[signature_.orderId] = true;
    totalDepositedAmountByAddresses[sender][erc20Type_] += amount_;

    _checkAllowance(erc20, sender, address(this), amount_);
    require(erc20.transferFrom(sender, address(this), amount_), "Transfer failed");

    emit Paid(sender, amount_, erc20Type_, id_, block.timestamp);
  }

  function claim(address receiver_, uint256 amount_, uint256 erc20Type_, string calldata id_) external nonReentrant onlyRole(OPERATOR_ROLE) {
    require(receiver_ != address(0), "Invalid receiver address");
    IERC20 erc20 = _checkErc20Amount(amount_, erc20Type_);
    totalWithdrawnAmountByAddresses[receiver_][erc20Type_] += amount_;

    require(erc20.transfer(receiver_, amount_), "Transfer failed");

    emit Claimed(receiver_, amount_, erc20Type_, id_, block.timestamp);
  }

  function deposit(uint256 amount_, uint256 erc20Type_) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
    address sender = _msgSender();
    IERC20 erc20 = _checkErc20Amount(amount_, erc20Type_);
    totalDepositedAmountByAddresses[sender][erc20Type_] += amount_;
    require(erc20.transferFrom(sender, address(this), amount_), "Transfer failed");

    emit Deposited(amount_, erc20Type_, block.timestamp);
  }

  function withdraw(uint256 amount_, uint256 erc20Type_) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
    address sender = _msgSender();
    IERC20 erc20 = _checkErc20Amount(amount_, erc20Type_);
    totalWithdrawnAmountByAddresses[sender][erc20Type_] += amount_;
    require(erc20.transfer(sender, amount_), "Transfer failed");

    emit Withdrawn(amount_, erc20Type_, block.timestamp);
  }

  /* Private function */
  function _checkErc20Amount(uint256 amount_, uint256 erc20Type_) private view returns (IERC20) {
    require(amount_ > 0, "Invalid amount");
    IERC20 erc20 = IERC20(erc20Addresses[erc20Type_]);
    require(address(erc20) != address(0), "Invalid ERC20 type");
    return erc20;
  }

  function _checkAllowance(IERC20 erc20, address owner_, address spender_, uint256 amount_) private {
    require(erc20.balanceOf(owner_) >= amount_, "Not enough balance");
    require(erc20.allowance(owner_, spender_) >= amount_, "Not enough allowance");
  }

  function _verifySignature(bytes32 data, bytes calldata signature_) private view returns (bool) {
    return data.toEthSignedMessageHash().recover(signature_) == verifierAddress;
  }

  function _isValidAmountSignature(
    Signature calldata signature_,
    address sender_,
    uint256 amount_,
    uint256 erc20Type_,
    string calldata id_
  ) private view returns (bool) {
    bytes32 hashValue = keccak256(
      abi.encodePacked(signature_.orderId, signature_.identifier, sender_, amount_, erc20Type_, id_, signature_.timestamp)
    );
    return _verifySignature(hashValue, signature_.signature);
  }
}
