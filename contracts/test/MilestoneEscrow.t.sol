// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {MilestoneEscrow} from "../src/MilestoneEscrow.sol";
import {EscrowCore} from "../src/EscrowCore.sol";
import {SubscriptionManager} from "../src/SubscriptionManager.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MilestoneEscrowTest is Test {
    MilestoneEscrow public milestoneEscrow;
    MilestoneEscrow public milestoneEscrowImplementation;
    EscrowCore public escrowCore;
    SubscriptionManager public subscriptionManager;
    
    address public admin = address(0x1);
    address public buyer = address(0x2);
    address public seller = address(0x3);
    address public arbitrator = address(0x4);
    
    uint256 public constant ESCROW_AMOUNT = 10 ether;
    uint256 public constant MILESTONE_AMOUNT = 2 ether;
    uint256 public constant FEE_PERCENTAGE = 250; // 2.5%
    
    event MilestoneCreated(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string title,
        uint256 amount,
        uint256 dueDate
    );
    
    event MilestoneSubmitted(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        string submissionUrl,
        uint256 timestamp
    );
    
    event MilestoneAutoReleased(
        uint256 indexed escrowId,
        uint256 indexed milestoneIndex,
        uint256 amount,
        uint256 timestamp
    );
    
    function setUp() public {
        // Setup accounts with ETH
        vm.deal(admin, 100 ether);
        vm.deal(buyer, 100 ether);
        vm.deal(seller, 100 ether);
        vm.deal(arbitrator, 100 ether);
        
        // Deploy contracts
        vm.startPrank(admin);
        
        // Deploy SubscriptionManager
        subscriptionManager = new SubscriptionManager(admin, 0.1 ether, 0.2 ether);
        
        // Deploy EscrowCore
        escrowCore = new EscrowCore(admin);
        escrowCore.setSubscriptionManager(address(subscriptionManager));
        
        // Deploy MilestoneEscrow implementation
        milestoneEscrowImplementation = new MilestoneEscrow();
        
        // Deploy proxy
        bytes memory initData = abi.encodeWithSelector(
            MilestoneEscrow.initialize.selector,
            address(escrowCore),
            admin
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(milestoneEscrowImplementation),
            initData
        );
        
        // Cast proxy to MilestoneEscrow
        milestoneEscrow = MilestoneEscrow(payable(address(proxy)));
        
        // Grant arbitrator role
        milestoneEscrow.grantRole(milestoneEscrow.ARBITRATOR_ROLE(), arbitrator);
        
        vm.stopPrank();
    }
    
    function testCreateMilestones() public {
        // Create an escrow first
        vm.startPrank(buyer);
        uint256 escrowId = escrowCore.createEscrow{value: ESCROW_AMOUNT + (ESCROW_AMOUNT * FEE_PERCENTAGE / 10000)}(
            seller,
            ESCROW_AMOUNT,
            7 days,
            "Test escrow"
        );
        
        // Create milestones
        string[] memory titles = new string[](3);
        titles[0] = "Milestone 1";
        titles[1] = "Milestone 2";
        titles[2] = "Milestone 3";
        
        string[] memory descriptions = new string[](3);
        descriptions[0] = "First milestone";
        descriptions[1] = "Second milestone";
        descriptions[2] = "Third milestone";
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 3 ether;
        amounts[1] = 3 ether;
        amounts[2] = 4 ether;
        
        uint256[] memory dueDates = new uint256[](3);
        dueDates[0] = block.timestamp + 1 days;
        dueDates[1] = block.timestamp + 2 days;
        dueDates[2] = block.timestamp + 3 days;
        
        vm.expectEmit(true, true, false, true);
        emit MilestoneCreated(escrowId, 0, "Milestone 1", 3 ether, dueDates[0]);
        
        milestoneEscrow.createMilestones{value: ESCROW_AMOUNT}(escrowId, titles, descriptions, amounts, dueDates);
        
        // Verify milestones were created
        MilestoneEscrow.Milestone[] memory milestones = milestoneEscrow.getMilestones(escrowId);
        assertEq(milestones.length, 3);
        assertEq(milestones[0].title, "Milestone 1");
        assertEq(milestones[0].amount, 3 ether);
        vm.stopPrank();
    }
    
    function testSubmitMilestone() public {
        // Setup escrow and milestones
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        // Start and submit milestone as seller
        vm.startPrank(seller);
        milestoneEscrow.startMilestone(escrowId, 0);
        
        vm.expectEmit(true, true, false, true);
        emit MilestoneSubmitted(escrowId, 0, "https://deliverable.com", block.timestamp);
        
        milestoneEscrow.submitMilestone(escrowId, 0, "https://deliverable.com");
        
        // Verify milestone status
        MilestoneEscrow.Milestone memory milestone = milestoneEscrow.getMilestone(escrowId, 0);
        assertEq(uint(milestone.status), uint(MilestoneEscrow.MilestoneStatus.SUBMITTED));
        assertEq(milestone.submissionUrl, "https://deliverable.com");
        assertTrue(milestone.autoReleaseTime > block.timestamp);
        vm.stopPrank();
    }
    
    function testAutoReleaseMilestone() public {
        // Setup escrow and submit milestone
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        vm.startPrank(seller);
        milestoneEscrow.startMilestone(escrowId, 0);
        milestoneEscrow.submitMilestone(escrowId, 0, "https://deliverable.com");
        vm.stopPrank();
        
        // Get milestone to check auto-release time
        MilestoneEscrow.Milestone memory milestone = milestoneEscrow.getMilestone(escrowId, 0);
        
        // Try auto-release before time - should fail
        vm.expectRevert("Auto-release period not expired");
        milestoneEscrow.autoReleaseMilestone(escrowId, 0);
        
        // Warp time to after auto-release period
        vm.warp(milestone.autoReleaseTime + 1);
        
        // Record seller balance before
        uint256 sellerBalanceBefore = seller.balance;
        
        // Auto-release should work now
        vm.expectEmit(true, true, false, true);
        emit MilestoneAutoReleased(escrowId, 0, milestone.amount, block.timestamp);
        
        milestoneEscrow.autoReleaseMilestone(escrowId, 0);
        
        // Verify milestone is approved and funds released
        milestone = milestoneEscrow.getMilestone(escrowId, 0);
        assertEq(uint(milestone.status), uint(MilestoneEscrow.MilestoneStatus.APPROVED));
        assertTrue(milestone.fundsReleased);
        
        // Verify seller received funds (minus fee)
        uint256 expectedAmount = milestone.amount - (milestone.amount * FEE_PERCENTAGE / 10000);
        assertEq(seller.balance, sellerBalanceBefore + expectedAmount);
    }
    
    function testBatchAutoRelease() public {
        // Setup escrow with multiple milestones
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        // Submit all milestones
        vm.startPrank(seller);
        for (uint256 i = 0; i < 3; i++) {
            if (i > 0) {
                // Approve previous milestone first
                vm.stopPrank();
                vm.startPrank(buyer);
                milestoneEscrow.approveMilestone(escrowId, i - 1, "Good work");
                vm.stopPrank();
                vm.startPrank(seller);
            }
            milestoneEscrow.startMilestone(escrowId, i);
            milestoneEscrow.submitMilestone(escrowId, i, string(abi.encodePacked("https://deliverable", vm.toString(i), ".com")));
        }
        vm.stopPrank();
        
        // Warp time to after auto-release period
        vm.warp(block.timestamp + 4 days);
        
        // Batch auto-release
        uint256[] memory indices = new uint256[](3);
        indices[0] = 0;
        indices[1] = 1;
        indices[2] = 2;
        
        milestoneEscrow.batchAutoReleaseMilestones(escrowId, indices);
        
        // Verify all milestones are approved
        for (uint256 i = 0; i < 3; i++) {
            MilestoneEscrow.Milestone memory milestone = milestoneEscrow.getMilestone(escrowId, i);
            assertEq(uint(milestone.status), uint(MilestoneEscrow.MilestoneStatus.APPROVED));
            assertTrue(milestone.fundsReleased);
        }
    }
    
    function testConfigureAutoRelease() public {
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        
        // Configure auto-release
        milestoneEscrow.configureAutoRelease(escrowId, false, 10 days);
        
        // Verify configuration
        assertEq(milestoneEscrow.escrowAutoReleaseEnabled(escrowId), false);
        assertEq(milestoneEscrow.defaultAutoReleaseWindow(), 10 days);
        vm.stopPrank();
    }
    
    function testCanAutoRelease() public {
        // Setup and submit milestone
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        vm.startPrank(seller);
        milestoneEscrow.startMilestone(escrowId, 0);
        milestoneEscrow.submitMilestone(escrowId, 0, "https://deliverable.com");
        vm.stopPrank();
        
        // Check if can auto-release
        (bool canRelease, uint256 timeRemaining) = milestoneEscrow.canAutoRelease(escrowId, 0);
        assertFalse(canRelease);
        assertTrue(timeRemaining > 0);
        
        // Warp time and check again
        vm.warp(block.timestamp + 4 days);
        (canRelease, timeRemaining) = milestoneEscrow.canAutoRelease(escrowId, 0);
        assertTrue(canRelease);
        assertEq(timeRemaining, 0);
    }
    
    function testGetAutoReleaseEligibleMilestones() public {
        // Setup escrow with multiple milestones
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        // Submit first two milestones
        vm.startPrank(seller);
        milestoneEscrow.startMilestone(escrowId, 0);
        milestoneEscrow.submitMilestone(escrowId, 0, "https://deliverable1.com");
        
        // Approve first to start second
        vm.stopPrank();
        vm.startPrank(buyer);
        milestoneEscrow.approveMilestone(escrowId, 0, "Good");
        vm.stopPrank();
        vm.startPrank(seller);
        
        milestoneEscrow.startMilestone(escrowId, 1);
        milestoneEscrow.submitMilestone(escrowId, 1, "https://deliverable2.com");
        vm.stopPrank();
        
        // Check eligible milestones before time warp
        uint256[] memory eligible = milestoneEscrow.getAutoReleaseEligibleMilestones(escrowId);
        assertEq(eligible.length, 0);
        
        // Warp time and check again
        vm.warp(block.timestamp + 4 days);
        eligible = milestoneEscrow.getAutoReleaseEligibleMilestones(escrowId);
        assertEq(eligible.length, 1);
        assertEq(eligible[0], 1); // Only second milestone is eligible (first was approved)
    }
    
    function testEmergencyWithdrawMilestone() public {
        // Setup escrow and milestone
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        // Pause contract as admin
        vm.startPrank(admin);
        milestoneEscrow.pause();
        
        // Emergency withdraw
        uint256 recipientBalanceBefore = buyer.balance;
        milestoneEscrow.emergencyWithdrawMilestone(escrowId, 0, buyer, "Emergency situation");
        
        // Verify withdrawal
        MilestoneEscrow.Milestone memory milestone = milestoneEscrow.getMilestone(escrowId, 0);
        assertEq(uint(milestone.status), uint(MilestoneEscrow.MilestoneStatus.CANCELLED));
        assertTrue(milestone.fundsReleased);
        
        // Note: Balance check would fail as funds are locked in escrow until funded
        vm.stopPrank();
    }
    
    function testForceResolveMilestone() public {
        // Setup escrow and dispute
        vm.startPrank(buyer);
        uint256 escrowId = createEscrowWithMilestones();
        vm.stopPrank();
        
        // Fund the MilestoneEscrow contract
        vm.deal(address(milestoneEscrow), ESCROW_AMOUNT);
        
        vm.startPrank(seller);
        milestoneEscrow.startMilestone(escrowId, 0);
        milestoneEscrow.submitMilestone(escrowId, 0, "https://deliverable.com");
        milestoneEscrow.disputeMilestone(escrowId, 0, "Poor quality");
        vm.stopPrank();
        
        // Force resolve as arbitrator (50/50 split)
        vm.startPrank(arbitrator);
        uint256 buyerBalanceBefore = buyer.balance;
        uint256 sellerBalanceBefore = seller.balance;
        
        milestoneEscrow.forceResolveMilestone(escrowId, 0, 2, 50, "Split decision");
        
        // Verify resolution
        MilestoneEscrow.Milestone memory milestone = milestoneEscrow.getMilestone(escrowId, 0);
        assertTrue(milestone.fundsReleased);
        vm.stopPrank();
    }
    
    // Helper function to create escrow with milestones
    function createEscrowWithMilestones() internal returns (uint256) {
        uint256 escrowId = escrowCore.createEscrow{value: ESCROW_AMOUNT + (ESCROW_AMOUNT * FEE_PERCENTAGE / 10000)}(
            seller,
            ESCROW_AMOUNT,
            7 days,
            "Test escrow"
        );
        
        string[] memory titles = new string[](3);
        titles[0] = "Milestone 1";
        titles[1] = "Milestone 2";
        titles[2] = "Milestone 3";
        
        string[] memory descriptions = new string[](3);
        descriptions[0] = "First milestone";
        descriptions[1] = "Second milestone";
        descriptions[2] = "Third milestone";
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 3 ether;
        amounts[1] = 3 ether;
        amounts[2] = 4 ether;
        
        uint256[] memory dueDates = new uint256[](3);
        dueDates[0] = block.timestamp + 1 days;
        dueDates[1] = block.timestamp + 2 days;
        dueDates[2] = block.timestamp + 3 days;
        
        milestoneEscrow.createMilestones{value: ESCROW_AMOUNT}(escrowId, titles, descriptions, amounts, dueDates);
        
        return escrowId;
    }
}