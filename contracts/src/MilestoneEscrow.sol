// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {EscrowCore} from "./EscrowCore.sol";

/**
 * @title MilestoneEscrow
 * @dev UUPS Upgradeable milestone-based escrow contract with auto-release and emergency functions
 * @notice Production-ready contract for managing milestone-based payments with advanced features
 */
contract MilestoneEscrow is 
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    // Custom errors for gas efficiency
    error InvalidMilestoneIndex();
    error MilestoneNotSubmitted();
    error AutoReleaseNotEnabled();
    error AutoReleasePeriodNotExpired();
    error FundsAlreadyReleased();
    error InvalidMilestoneStatus();
    error InvalidResolutionType();
    error EmergencyOnly();
    error InvalidEscrowId();
    error UnauthorizedAccess();
    
    // Reference to EscrowCore contract
    EscrowCore public escrowCore;
    
    // Milestone status enum
    enum MilestoneStatus {
        PENDING,
        IN_PROGRESS,
        SUBMITTED,
        APPROVED,
        DISPUTED,
        CANCELLED
    }
    
    // Enhanced Milestone struct
    struct Milestone {
        uint256 escrowId;
        string title;
        string description;
        uint256 amount;
        uint256 dueDate;
        MilestoneStatus status;
        uint256 submittedAt;
        uint256 approvedAt;
        string submissionUrl;
        string feedback;
        uint256 revisionCount;
        bool fundsReleased;
        uint256 autoReleaseTime;
        bool autoReleaseEnabled;
        address assignedTo;
        uint256 priority;
        uint256 approvalsRequired;
        uint256 approvalCount;
    }
    
    // Storage
    mapping(uint256 => Milestone[]) public milestones;
    mapping(uint256 => uint256) public escrowMilestoneCount;
    mapping(uint256 => uint256) public escrowCompletedMilestones;
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneTips;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public milestoneApprovals;
    
    // Configuration
    uint256 public defaultAutoReleaseWindow;
    mapping(uint256 => bool) public escrowAutoReleaseEnabled;
    
    // Version tracking
    uint256 public constant VERSION = 1;
    string public constant VERSION_STRING = "1.0.0";
    
    // Roles
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Events
    event MilestoneCreated(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string title,
        uint256 amount,
        uint256 dueDate
    );
    
    event MilestoneStarted(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        uint256 timestamp
    );
    
    event MilestoneSubmitted(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string submissionUrl,
        uint256 timestamp
    );
    
    event MilestoneApproved(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        uint256 amount,
        uint256 tip,
        uint256 timestamp
    );
    
    event MilestoneDisputed(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string reason,
        uint256 timestamp
    );
    
    event MilestoneAutoReleased(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        uint256 amount,
        uint256 timestamp
    );
    
    event AutoReleaseConfigUpdated(
        uint256 indexed escrowId,
        bool enabled,
        uint256 window
    );
    
    event EmergencyWithdrawal(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        address recipient,
        uint256 amount,
        string reason
    );
    
    event MilestonePaused(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        MilestoneStatus previousStatus,
        string reason
    );
    
    event MilestoneForceResolved(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string resolutionType,
        uint256 buyerAmount,
        uint256 sellerAmount,
        string reason
    );
    
    event TokensRecovered(
        address indexed token,
        address indexed recipient,
        uint256 amount
    );
    
    event EmergencyStopActivated(
        address indexed activatedBy,
        uint256 timestamp
    );
    
    event ContractUpgraded(
        address indexed previousImplementation,
        address indexed newImplementation,
        uint256 version
    );
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initialize the contract
     * @param _escrowCore Address of the EscrowCore contract
     * @param _admin Admin address
     */
    function initialize(
        address _escrowCore,
        address _admin
    ) public initializer {
        require(_escrowCore != address(0), "Invalid EscrowCore address");
        require(_admin != address(0), "Invalid admin address");
        
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        escrowCore = EscrowCore(payable(_escrowCore));
        defaultAutoReleaseWindow = 3 days;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
        _grantRole(ARBITRATOR_ROLE, _admin);
    }
    
    /**
     * @dev Required by UUPS pattern to authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {
        emit ContractUpgraded(address(this), newImplementation, VERSION);
    }
    
    /**
     * @dev Create milestones for an escrow
     * @param _escrowId The escrow ID
     * @param _titles Array of milestone titles
     * @param _descriptions Array of milestone descriptions
     * @param _amounts Array of milestone amounts
     * @param _dueDates Array of milestone due dates
     */
    function createMilestones(
        uint256 _escrowId,
        string[] memory _titles,
        string[] memory _descriptions,
        uint256[] memory _amounts,
        uint256[] memory _dueDates
    ) external payable whenNotPaused {
        require(
            _titles.length == _descriptions.length &&
            _titles.length == _amounts.length &&
            _titles.length == _dueDates.length,
            "Array lengths mismatch"
        );
        require(_titles.length > 0, "No milestones provided");
        
        // Verify escrow exists and caller is authorized
        (address buyer, , uint256 escrowAmount, , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(buyer != address(0), "Escrow does not exist");
        require(msg.sender == buyer, "Only buyer can create milestones");
        
        uint256 totalMilestoneAmount = 0;
        
        for (uint256 i = 0; i < _titles.length; i++) {
            require(_amounts[i] > 0, "Invalid amount");
            require(_dueDates[i] > block.timestamp, "Invalid due date");
            require(bytes(_titles[i]).length > 0, "Title required");
            
            Milestone storage milestone = milestones[_escrowId].push();
            milestone.escrowId = _escrowId;
            milestone.title = _titles[i];
            milestone.description = _descriptions[i];
            milestone.amount = _amounts[i];
            milestone.dueDate = _dueDates[i];
            milestone.status = MilestoneStatus.PENDING;
            milestone.autoReleaseEnabled = true;
            milestone.approvalsRequired = 1;
            milestone.priority = i;
            
            totalMilestoneAmount += _amounts[i];
            
            emit MilestoneCreated(
                _escrowId,
                milestones[_escrowId].length - 1,
                _titles[i],
                _amounts[i],
                _dueDates[i]
            );
        }
        
        require(totalMilestoneAmount == escrowAmount, "Milestone amounts must equal escrow amount");
        require(msg.value == totalMilestoneAmount, "Incorrect ETH sent for milestones");
        escrowMilestoneCount[_escrowId] = _titles.length;
    }
    
    /**
     * @dev Start working on a milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function startMilestone(uint256 _escrowId, uint256 _milestoneIndex) 
        external 
        whenNotPaused 
    {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        
        // Verify caller is the seller or assigned party
        (, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(
            msg.sender == seller || msg.sender == milestone.assignedTo,
            "Unauthorized"
        );
        
        require(milestone.status == MilestoneStatus.PENDING, "Invalid status");
        
        // Check if previous milestone is completed (if not first)
        if (_milestoneIndex > 0) {
            Milestone storage prevMilestone = milestones[_escrowId][_milestoneIndex - 1];
            require(
                prevMilestone.status == MilestoneStatus.APPROVED,
                "Previous milestone not completed"
            );
        }
        
        milestone.status = MilestoneStatus.IN_PROGRESS;
        
        emit MilestoneStarted(_escrowId, _milestoneIndex, block.timestamp);
    }
    
    /**
     * @dev Submit milestone for review
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _submissionUrl URL to submitted work
     */
    function submitMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _submissionUrl
    ) external whenNotPaused {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        
        // Verify caller is the seller
        (, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(msg.sender == seller || msg.sender == milestone.assignedTo, "Unauthorized");
        
        require(milestone.status == MilestoneStatus.IN_PROGRESS, "Milestone not in progress");
        require(bytes(_submissionUrl).length > 0, "Submission URL required");
        
        milestone.status = MilestoneStatus.SUBMITTED;
        milestone.submittedAt = block.timestamp;
        milestone.submissionUrl = _submissionUrl;
        
        // Set auto-release time if enabled
        if (milestone.autoReleaseEnabled) {
            milestone.autoReleaseTime = block.timestamp + defaultAutoReleaseWindow;
        }
        
        emit MilestoneSubmitted(_escrowId, _milestoneIndex, _submissionUrl, block.timestamp);
    }
    
    /**
     * @dev Approve milestone and release payment
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _feedback Optional feedback
     */
    function approveMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _feedback
    ) external payable nonReentrant whenNotPaused {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        
        if (milestone.status != MilestoneStatus.SUBMITTED) {
            revert MilestoneNotSubmitted();
        }
        if (milestone.fundsReleased) {
            revert FundsAlreadyReleased();
        }
        
        // Verify caller
        (address buyer, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(msg.sender == buyer, "Only buyer can approve");
        
        // Process approval
        milestone.status = MilestoneStatus.APPROVED;
        milestone.approvedAt = block.timestamp;
        milestone.feedback = _feedback;
        milestone.fundsReleased = true;
        
        // Handle tip
        uint256 tipAmount = msg.value;
        if (tipAmount > 0) {
            milestoneTips[_escrowId][_milestoneIndex] = tipAmount;
        }
        
        // Calculate fee (using EscrowCore's fee structure)
        uint256 feeAmount = (milestone.amount * 250) / 10000; // 2.5% default fee
        uint256 sellerAmount = milestone.amount - feeAmount + tipAmount;
        
        // Transfer funds
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(escrowCore.feeRecipient()).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        (bool success, ) = payable(seller).call{value: sellerAmount}("");
        require(success, "Transfer failed");
        
        // Update progress
        escrowCompletedMilestones[_escrowId]++;
        
        // Check if all milestones completed
        if (escrowCompletedMilestones[_escrowId] == escrowMilestoneCount[_escrowId]) {
            // Mark escrow as completed in EscrowCore if possible
            // This would require adding a function in EscrowCore or handling differently
        }
        
        emit MilestoneApproved(_escrowId, _milestoneIndex, milestone.amount, tipAmount, block.timestamp);
    }
    
    /**
     * @dev Request revision for a submitted milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _reason Reason for revision request
     */
    function requestMilestoneRevision(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _reason
    ) external whenNotPaused {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.SUBMITTED, "Not submitted");
        require(bytes(_reason).length > 0, "Reason required");
        
        // Verify caller is buyer
        (address buyer, , , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(msg.sender == buyer, "Only buyer can request revision");
        
        milestone.status = MilestoneStatus.IN_PROGRESS;
        milestone.revisionCount++;
        milestone.feedback = _reason;
        milestone.autoReleaseTime = 0; // Reset auto-release
        
        emit MilestoneDisputed(_escrowId, _milestoneIndex, _reason, block.timestamp);
    }
    
    /**
     * @dev Dispute a milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _reason Dispute reason
     */
    function disputeMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _reason
    ) external whenNotPaused {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.SUBMITTED || 
            milestone.status == MilestoneStatus.IN_PROGRESS,
            "Invalid status for dispute"
        );
        require(bytes(_reason).length > 0, "Reason required");
        
        // Verify caller is buyer or seller
        (address buyer, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(msg.sender == buyer || msg.sender == seller, "Unauthorized");
        
        milestone.status = MilestoneStatus.DISPUTED;
        milestone.autoReleaseTime = 0; // Disable auto-release
        
        emit MilestoneDisputed(_escrowId, _milestoneIndex, _reason, block.timestamp);
    }
    
    /**
     * @dev Auto-release milestone after review period
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function autoReleaseMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex
    ) external nonReentrant whenNotPaused {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            revert InvalidMilestoneIndex();
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        
        if (milestone.status != MilestoneStatus.SUBMITTED) {
            revert MilestoneNotSubmitted();
        }
        if (!milestone.autoReleaseEnabled) {
            revert AutoReleaseNotEnabled();
        }
        if (block.timestamp < milestone.autoReleaseTime) {
            revert("Auto-release period not expired");
        }
        if (milestone.fundsReleased) {
            revert FundsAlreadyReleased();
        }
        
        // Process auto-release
        _processAutoRelease(_escrowId, _milestoneIndex);
    }
    
    /**
     * @dev Batch auto-release multiple milestones
     * @param _escrowId The escrow ID
     * @param _milestoneIndices Array of milestone indices
     */
    function batchAutoReleaseMilestones(
        uint256 _escrowId,
        uint256[] calldata _milestoneIndices
    ) external nonReentrant whenNotPaused {
        require(_milestoneIndices.length > 0, "No milestones provided");
        require(_milestoneIndices.length <= 10, "Too many milestones");
        
        for (uint256 i = 0; i < _milestoneIndices.length; i++) {
            uint256 milestoneIndex = _milestoneIndices[i];
            require(milestoneIndex < milestones[_escrowId].length, "Invalid milestone index");
            
            Milestone storage milestone = milestones[_escrowId][milestoneIndex];
            
            // Check if milestone can be auto-released
            if (milestone.status == MilestoneStatus.SUBMITTED &&
                milestone.autoReleaseEnabled &&
                milestone.autoReleaseTime > 0 &&
                block.timestamp >= milestone.autoReleaseTime &&
                !milestone.fundsReleased) {
                
                _processAutoRelease(_escrowId, milestoneIndex);
            }
        }
    }
    
    /**
     * @dev Internal function to process auto-release
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function _processAutoRelease(uint256 _escrowId, uint256 _milestoneIndex) internal {
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        (, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        
        // Mark milestone as approved
        milestone.status = MilestoneStatus.APPROVED;
        milestone.approvedAt = block.timestamp;
        milestone.fundsReleased = true;
        
        // Calculate and transfer funds
        uint256 feeAmount = (milestone.amount * 250) / 10000;
        uint256 sellerAmount = milestone.amount - feeAmount;
        
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(escrowCore.feeRecipient()).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        (bool success, ) = payable(seller).call{value: sellerAmount}("");
        require(success, "Transfer failed");
        
        escrowCompletedMilestones[_escrowId]++;
        
        emit MilestoneAutoReleased(_escrowId, _milestoneIndex, milestone.amount, block.timestamp);
    }
    
    /**
     * @dev Configure auto-release settings
     * @param _escrowId The escrow ID
     * @param _enabled Enable/disable auto-release
     * @param _window Auto-release window in seconds
     */
    function configureAutoRelease(
        uint256 _escrowId,
        bool _enabled,
        uint256 _window
    ) external {
        // Verify caller is buyer
        (address buyer, , , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        require(msg.sender == buyer, "Only buyer can configure");
        require(_window >= 1 days && _window <= 30 days, "Invalid window");
        
        escrowAutoReleaseEnabled[_escrowId] = _enabled;
        if (_window != defaultAutoReleaseWindow) {
            defaultAutoReleaseWindow = _window;
        }
        
        // Update existing pending/submitted milestones
        Milestone[] storage escrowMilestones = milestones[_escrowId];
        for (uint256 i = 0; i < escrowMilestones.length; i++) {
            if (escrowMilestones[i].status == MilestoneStatus.PENDING ||
                escrowMilestones[i].status == MilestoneStatus.SUBMITTED) {
                escrowMilestones[i].autoReleaseEnabled = _enabled;
            }
        }
        
        emit AutoReleaseConfigUpdated(_escrowId, _enabled, _window);
    }
    
    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdrawal of stuck milestone funds (admin only)
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _recipient The recipient address for the funds
     * @param _reason Reason for emergency withdrawal
     */
    function emergencyWithdrawMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        address _recipient,
        string memory _reason
    ) external onlyRole(ADMIN_ROLE) nonReentrant whenPaused {
        require(_milestoneIndex < milestones[_escrowId].length, "Invalid milestone index");
        require(_recipient != address(0), "Invalid recipient");
        require(bytes(_reason).length > 0, "Reason required");
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        require(!milestone.fundsReleased, "Funds already released");
        
        milestone.fundsReleased = true;
        milestone.status = MilestoneStatus.CANCELLED;
        
        (bool success, ) = payable(_recipient).call{value: milestone.amount}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdrawal(_escrowId, _milestoneIndex, _recipient, milestone.amount, _reason);
    }
    
    /**
     * @dev Emergency pause specific milestone (admin only)
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _reason Reason for pausing
     */
    function emergencyPauseMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _reason
    ) external onlyRole(ADMIN_ROLE) {
        require(_milestoneIndex < milestones[_escrowId].length, "Invalid milestone index");
        require(bytes(_reason).length > 0, "Reason required");
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        require(milestone.status != MilestoneStatus.APPROVED, "Milestone already approved");
        require(milestone.status != MilestoneStatus.CANCELLED, "Milestone already cancelled");
        
        MilestoneStatus previousStatus = milestone.status;
        milestone.status = MilestoneStatus.DISPUTED;
        milestone.autoReleaseEnabled = false;
        
        emit MilestonePaused(_escrowId, _milestoneIndex, previousStatus, _reason);
    }
    
    /**
     * @dev Force resolve a disputed milestone (arbitrator only)
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _resolution Resolution type: 0 = refund to buyer, 1 = release to seller, 2 = split
     * @param _splitPercentage If split, percentage to seller (0-100)
     * @param _reason Reason for force resolution
     */
    function forceResolveMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        uint8 _resolution,
        uint256 _splitPercentage,
        string memory _reason
    ) external onlyRole(ARBITRATOR_ROLE) nonReentrant {
        require(_milestoneIndex < milestones[_escrowId].length, "Invalid milestone index");
        require(_resolution <= 2, "Invalid resolution type");
        require(bytes(_reason).length > 0, "Reason required");
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        (address buyer, address seller, , , , , , , ) = escrowCore.getEscrowDetails(_escrowId);
        
        require(milestone.status == MilestoneStatus.DISPUTED, "Milestone not disputed");
        require(!milestone.fundsReleased, "Funds already released");
        
        milestone.fundsReleased = true;
        
        if (_resolution == 0) {
            // Refund to buyer
            milestone.status = MilestoneStatus.CANCELLED;
            (bool success, ) = payable(buyer).call{value: milestone.amount}("");
            require(success, "Refund failed");
            
            emit MilestoneForceResolved(_escrowId, _milestoneIndex, "refunded_to_buyer", milestone.amount, 0, _reason);
            
        } else if (_resolution == 1) {
            // Release to seller
            milestone.status = MilestoneStatus.APPROVED;
            milestone.approvedAt = block.timestamp;
            
            uint256 feeAmount = (milestone.amount * 250) / 10000;
            uint256 sellerAmount = milestone.amount - feeAmount;
            
            if (feeAmount > 0) {
                (bool feeSuccess, ) = payable(escrowCore.feeRecipient()).call{value: feeAmount}("");
                require(feeSuccess, "Fee transfer failed");
            }
            
            (bool success, ) = payable(seller).call{value: sellerAmount}("");
            require(success, "Seller payment failed");
            
            escrowCompletedMilestones[_escrowId]++;
            
            emit MilestoneForceResolved(_escrowId, _milestoneIndex, "released_to_seller", 0, sellerAmount, _reason);
            
        } else {
            // Split between buyer and seller
            require(_splitPercentage <= 100, "Invalid split percentage");
            
            milestone.status = MilestoneStatus.APPROVED;
            milestone.approvedAt = block.timestamp;
            
            uint256 sellerAmount = (milestone.amount * _splitPercentage) / 100;
            uint256 buyerAmount = milestone.amount - sellerAmount;
            
            if (buyerAmount > 0) {
                (bool buyerSuccess, ) = payable(buyer).call{value: buyerAmount}("");
                require(buyerSuccess, "Buyer payment failed");
            }
            
            if (sellerAmount > 0) {
                uint256 feeAmount = (sellerAmount * 250) / 10000;
                uint256 netSellerAmount = sellerAmount - feeAmount;
                
                if (feeAmount > 0) {
                    (bool feeSuccess, ) = payable(escrowCore.feeRecipient()).call{value: feeAmount}("");
                    require(feeSuccess, "Fee transfer failed");
                }
                
                (bool sellerSuccess, ) = payable(seller).call{value: netSellerAmount}("");
                require(sellerSuccess, "Seller payment failed");
            }
            
            emit MilestoneForceResolved(_escrowId, _milestoneIndex, "split", buyerAmount, sellerAmount, _reason);
        }
    }
    
    /**
     * @dev Recover accidentally sent ERC20 tokens (admin only)
     * @param _token The token contract address
     * @param _to The recipient address
     * @param _amount The amount to recover
     */
    function recoverErc20(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyRole(ADMIN_ROLE) {
        require(_token != address(0), "Invalid token");
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Invalid amount");
        
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", _to, _amount)
        );
        
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token recovery failed");
        
        emit TokensRecovered(_token, _to, _amount);
    }
    
    /**
     * @dev Emergency stop all milestone auto-releases (admin only)
     */
    function emergencyStopAutoReleases() external onlyRole(ADMIN_ROLE) {
        defaultAutoReleaseWindow = 365 days; // Set to maximum to effectively disable
        emit EmergencyStopActivated(msg.sender, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get milestone details
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function getMilestone(uint256 _escrowId, uint256 _milestoneIndex)
        external
        view
        returns (Milestone memory)
    {
        require(_milestoneIndex < milestones[_escrowId].length, "Invalid index");
        return milestones[_escrowId][_milestoneIndex];
    }
    
    /**
     * @dev Get all milestones for an escrow
     * @param _escrowId The escrow ID
     */
    function getMilestones(uint256 _escrowId)
        external
        view
        returns (Milestone[] memory)
    {
        return milestones[_escrowId];
    }
    
    /**
     * @dev Get milestone progress for an escrow
     * @param _escrowId The escrow ID
     */
    function getMilestoneProgress(uint256 _escrowId)
        external
        view
        returns (
            uint256 total,
            uint256 completed,
            uint256 inProgress,
            uint256 disputed
        )
    {
        Milestone[] storage escrowMilestones = milestones[_escrowId];
        total = escrowMilestones.length;
        
        for (uint256 i = 0; i < escrowMilestones.length; i++) {
            if (escrowMilestones[i].status == MilestoneStatus.APPROVED) {
                completed++;
            } else if (escrowMilestones[i].status == MilestoneStatus.IN_PROGRESS || 
                       escrowMilestones[i].status == MilestoneStatus.SUBMITTED) {
                inProgress++;
            } else if (escrowMilestones[i].status == MilestoneStatus.DISPUTED) {
                disputed++;
            }
        }
    }
    
    /**
     * @dev Check if milestone can be auto-released
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function canAutoRelease(uint256 _escrowId, uint256 _milestoneIndex)
        external
        view
        returns (bool canRelease, uint256 timeRemaining)
    {
        if (_milestoneIndex >= milestones[_escrowId].length) {
            return (false, 0);
        }
        
        Milestone storage milestone = milestones[_escrowId][_milestoneIndex];
        
        if (milestone.status != MilestoneStatus.SUBMITTED ||
            !milestone.autoReleaseEnabled ||
            milestone.autoReleaseTime == 0 ||
            milestone.fundsReleased) {
            return (false, 0);
        }
        
        if (block.timestamp >= milestone.autoReleaseTime) {
            return (true, 0);
        } else {
            return (false, milestone.autoReleaseTime - block.timestamp);
        }
    }
    
    /**
     * @dev Get all milestones eligible for auto-release
     * @param _escrowId The escrow ID
     * @return eligibleIndices Array of milestone indices eligible for auto-release
     */
    function getAutoReleaseEligibleMilestones(uint256 _escrowId)
        external
        view
        returns (uint256[] memory eligibleIndices)
    {
        Milestone[] storage escrowMilestones = milestones[_escrowId];
        uint256 count = 0;
        
        // First, count eligible milestones
        for (uint256 i = 0; i < escrowMilestones.length; i++) {
            if (escrowMilestones[i].status == MilestoneStatus.SUBMITTED &&
                escrowMilestones[i].autoReleaseEnabled &&
                escrowMilestones[i].autoReleaseTime > 0 &&
                block.timestamp >= escrowMilestones[i].autoReleaseTime &&
                !escrowMilestones[i].fundsReleased) {
                count++;
            }
        }
        
        // Create array of correct size and populate
        eligibleIndices = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < escrowMilestones.length; i++) {
            if (escrowMilestones[i].status == MilestoneStatus.SUBMITTED &&
                escrowMilestones[i].autoReleaseEnabled &&
                escrowMilestones[i].autoReleaseTime > 0 &&
                block.timestamp >= escrowMilestones[i].autoReleaseTime &&
                !escrowMilestones[i].fundsReleased) {
                eligibleIndices[index] = i;
                index++;
            }
        }
    }
    
    /**
     * @dev Get contract version
     */
    function getVersion() external pure returns (string memory) {
        return VERSION_STRING;
    }
    
    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}