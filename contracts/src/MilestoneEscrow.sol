// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./EscrowCore.sol";

/**
 * @title MilestoneEscrow
 * @dev Extension of EscrowCore for milestone-based payments in freelance projects
 */
contract MilestoneEscrow is EscrowCore {
    // Milestone status enum
    enum MilestoneStatus {
        PENDING,      // Not yet started
        IN_PROGRESS,  // Work has begun
        SUBMITTED,    // Work submitted for review
        APPROVED,     // Approved and paid
        DISPUTED,     // Under dispute
        CANCELLED     // Cancelled
    }

    // Milestone struct
    struct Milestone {
        uint256 escrowId;        // Parent escrow ID
        string title;            // Milestone title
        string description;      // Milestone description
        uint256 amount;          // Payment amount for this milestone
        uint256 dueDate;         // Due date timestamp
        MilestoneStatus status;  // Current status
        uint256 submittedAt;     // Submission timestamp
        uint256 approvedAt;      // Approval timestamp
        string submissionUrl;    // Link to submitted work
        string feedback;         // Client feedback
        uint256 revisionCount;   // Number of revisions requested
        bool fundsReleased;      // Whether funds have been released
    }

    // Milestone mappings
    mapping(uint256 => Milestone[]) public escrowMilestones;
    mapping(uint256 => mapping(uint256 => bool)) public milestoneApprovals;
    mapping(uint256 => uint256) public escrowMilestoneCount;
    mapping(uint256 => uint256) public escrowCompletedMilestones;
    
    // Tip tracking
    mapping(uint256 => mapping(uint256 => uint256)) public milestoneTips;
    
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
    
    event MilestoneRevisionRequested(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string reason,
        uint256 timestamp
    );
    
    event MilestoneDisputed(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string reason,
        uint256 timestamp
    );

    // Constructor
    constructor(address _feeRecipient) EscrowCore(_feeRecipient) {}

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
    ) external escrowExists(_escrowId) onlyBuyer(_escrowId) {
        require(
            _titles.length == _descriptions.length &&
            _titles.length == _amounts.length &&
            _titles.length == _dueDates.length,
            "Array lengths mismatch"
        );
        
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == Status.CREATED || escrow.status == Status.FUNDED, "Invalid escrow status");
        
        uint256 totalMilestoneAmount = 0;
        
        for (uint256 i = 0; i < _titles.length; i++) {
            require(_amounts[i] > 0, "Milestone amount must be greater than 0");
            require(_dueDates[i] > block.timestamp, "Due date must be in future");
            
            Milestone memory milestone = Milestone({
                escrowId: _escrowId,
                title: _titles[i],
                description: _descriptions[i],
                amount: _amounts[i],
                dueDate: _dueDates[i],
                status: MilestoneStatus.PENDING,
                submittedAt: 0,
                approvedAt: 0,
                submissionUrl: "",
                feedback: "",
                revisionCount: 0,
                fundsReleased: false
            });
            
            escrowMilestones[_escrowId].push(milestone);
            totalMilestoneAmount += _amounts[i];
            
            emit MilestoneCreated(
                _escrowId,
                escrowMilestones[_escrowId].length - 1,
                _titles[i],
                _amounts[i],
                _dueDates[i]
            );
        }
        
        // Verify total milestone amount matches escrow amount
        require(totalMilestoneAmount == escrow.amount, "Milestone total must equal escrow amount");
        escrowMilestoneCount[_escrowId] = _titles.length;
    }

    /**
     * @dev Start working on a milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function startMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex
    ) external escrowExists(_escrowId) onlySeller(_escrowId) {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.PENDING, "Milestone not pending");
        
        // Check if previous milestone is completed (if not first milestone)
        if (_milestoneIndex > 0) {
            Milestone storage prevMilestone = escrowMilestones[_escrowId][_milestoneIndex - 1];
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
    ) external escrowExists(_escrowId) onlySeller(_escrowId) {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.IN_PROGRESS, "Milestone not in progress");
        require(bytes(_submissionUrl).length > 0, "Submission URL required");
        
        milestone.status = MilestoneStatus.SUBMITTED;
        milestone.submittedAt = block.timestamp;
        milestone.submissionUrl = _submissionUrl;
        
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
    ) external payable escrowExists(_escrowId) onlyBuyer(_escrowId) nonReentrant {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.SUBMITTED, "Milestone not submitted");
        require(!milestone.fundsReleased, "Funds already released");
        
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == Status.FUNDED, "Escrow not funded");
        
        milestone.status = MilestoneStatus.APPROVED;
        milestone.approvedAt = block.timestamp;
        milestone.feedback = _feedback;
        milestone.fundsReleased = true;
        
        // Handle tip if provided
        uint256 tipAmount = msg.value;
        if (tipAmount > 0) {
            milestoneTips[_escrowId][_milestoneIndex] = tipAmount;
        }
        
        // Calculate platform fee for this milestone
        uint256 feeAmount = (milestone.amount * _getTieredFeePercentage(escrow.buyer)) / BASIS_POINTS;
        
        // Transfer fee to platform
        if (feeAmount > 0 && !escrow.feeCollected) {
            totalFeesCollected += feeAmount;
            (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Transfer milestone amount + tip to seller
        uint256 sellerAmount = milestone.amount - feeAmount + tipAmount;
        (bool success, ) = payable(escrow.seller).call{value: sellerAmount}("");
        require(success, "Payment transfer failed");
        
        // Update completed milestones count
        escrowCompletedMilestones[_escrowId]++;
        
        // Check if all milestones are completed
        if (escrowCompletedMilestones[_escrowId] == escrowMilestoneCount[_escrowId]) {
            escrow.status = Status.COMPLETED;
            
            // Update active escrow counts
            if (userActiveEscrowCount[escrow.buyer] > 0) {
                userActiveEscrowCount[escrow.buyer]--;
            }
            if (userActiveEscrowCount[escrow.seller] > 0) {
                userActiveEscrowCount[escrow.seller]--;
            }
            
            emit EscrowCompleted(_escrowId, escrow.seller, escrow.amount, 0, block.timestamp);
        }
        
        emit MilestoneApproved(_escrowId, _milestoneIndex, milestone.amount, tipAmount, block.timestamp);
    }

    /**
     * @dev Request revision for a milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _reason Reason for revision request
     */
    function requestMilestoneRevision(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _reason
    ) external escrowExists(_escrowId) onlyBuyer(_escrowId) {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.SUBMITTED, "Milestone not submitted");
        require(bytes(_reason).length > 0, "Reason required");
        
        milestone.status = MilestoneStatus.IN_PROGRESS;
        milestone.revisionCount++;
        
        emit MilestoneRevisionRequested(_escrowId, _milestoneIndex, _reason, block.timestamp);
    }

    /**
     * @dev Raise dispute for a milestone
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _reason Dispute reason
     */
    function disputeMilestone(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        string memory _reason
    ) external escrowExists(_escrowId) onlyParty(_escrowId) {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(
            milestone.status == MilestoneStatus.IN_PROGRESS || 
            milestone.status == MilestoneStatus.SUBMITTED,
            "Invalid milestone status for dispute"
        );
        
        milestone.status = MilestoneStatus.DISPUTED;
        
        // Also mark the parent escrow as disputed
        Escrow storage escrow = escrows[_escrowId];
        escrow.status = Status.DISPUTED;
        disputeReasons[_escrowId] = _reason;
        
        emit MilestoneDisputed(_escrowId, _milestoneIndex, _reason, block.timestamp);
        emit DisputeRaised(_escrowId, msg.sender, _reason, block.timestamp);
    }

    /**
     * @dev Resolve milestone dispute
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     * @param _approveMilestone Whether to approve the milestone
     * @param _resolution Resolution details
     */
    function resolveMilestoneDispute(
        uint256 _escrowId,
        uint256 _milestoneIndex,
        bool _approveMilestone,
        string memory _resolution
    ) external escrowExists(_escrowId) onlyRole(ARBITRATOR_ROLE) nonReentrant {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        
        Milestone storage milestone = escrowMilestones[_escrowId][_milestoneIndex];
        require(milestone.status == MilestoneStatus.DISPUTED, "Milestone not disputed");
        
        if (_approveMilestone) {
            // Approve and pay the milestone
            milestone.status = MilestoneStatus.APPROVED;
            milestone.approvedAt = block.timestamp;
            milestone.fundsReleased = true;
            
            Escrow storage escrow = escrows[_escrowId];
            
            // Calculate and transfer payment
            uint256 feeAmount = (milestone.amount * _getTieredFeePercentage(escrow.buyer)) / BASIS_POINTS;
            uint256 sellerAmount = milestone.amount - feeAmount;
            
            (bool success, ) = payable(escrow.seller).call{value: sellerAmount}("");
            require(success, "Payment transfer failed");
            
            escrowCompletedMilestones[_escrowId]++;
        } else {
            // Return milestone to pending or cancel
            milestone.status = MilestoneStatus.CANCELLED;
        }
        
        resolutionDetails[_escrowId] = _resolution;
    }

    /**
     * @dev Get all milestones for an escrow
     * @param _escrowId The escrow ID
     */
    function getMilestones(uint256 _escrowId) 
        external 
        view 
        escrowExists(_escrowId) 
        returns (Milestone[] memory) 
    {
        return escrowMilestones[_escrowId];
    }

    /**
     * @dev Get specific milestone details
     * @param _escrowId The escrow ID
     * @param _milestoneIndex The milestone index
     */
    function getMilestone(uint256 _escrowId, uint256 _milestoneIndex)
        external
        view
        escrowExists(_escrowId)
        returns (Milestone memory)
    {
        require(_milestoneIndex < escrowMilestones[_escrowId].length, "Invalid milestone index");
        return escrowMilestones[_escrowId][_milestoneIndex];
    }

    /**
     * @dev Get milestone progress for an escrow
     * @param _escrowId The escrow ID
     */
    function getMilestoneProgress(uint256 _escrowId)
        external
        view
        escrowExists(_escrowId)
        returns (
            uint256 total,
            uint256 completed,
            uint256 inProgress,
            uint256 disputed
        )
    {
        Milestone[] storage milestones = escrowMilestones[_escrowId];
        total = milestones.length;
        
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i].status == MilestoneStatus.APPROVED) {
                completed++;
            } else if (milestones[i].status == MilestoneStatus.IN_PROGRESS || 
                       milestones[i].status == MilestoneStatus.SUBMITTED) {
                inProgress++;
            } else if (milestones[i].status == MilestoneStatus.DISPUTED) {
                disputed++;
            }
        }
    }
}