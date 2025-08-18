// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {AchievementNFT} from "../src/AchievementNFT.sol";

contract AchievementNFTTest is Test {
    AchievementNFT public achievementNft;
    
    address public owner = address(1);
    address public minter = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public unauthorizedUser = address(5);
    
    string constant FIRST_TRADE_ID = "FIRST_TRADE";
    string constant VOLUME_10ETH_ID = "VOLUME_10ETH";
    string constant BATTLE_WIN_ID = "BATTLE_WIN";
    string constant COMMUNITY_HELPER_ID = "COMMUNITY_HELPER";
    string constant SPECIAL_EVENT_ID = "SPECIAL_EVENT";
    
    string constant TEST_METADATA_URI = "ipfs://QmTest123";
    string constant UPDATED_METADATA_URI = "ipfs://QmUpdated456";
    
    event AchievementCreated(
        string indexed achievementId,
        string name,
        AchievementNFT.AchievementCategory category,
        AchievementNFT.AchievementRarity rarity
    );
    
    event AchievementMinted(
        address indexed user,
        string indexed achievementId,
        uint256 tokenId,
        uint256 xpReward,
        uint256 combatPowerReward,
        uint256 timestamp
    );
    
    event AchievementProgressUpdated(
        address indexed user,
        string indexed achievementId,
        uint256 progress,
        uint256 requirement
    );
    
    event RewardsGranted(
        address indexed user,
        uint256 xpAmount,
        uint256 combatPowerAmount
    );
    
    function setUp() public {
        vm.startPrank(owner);
        achievementNft = new AchievementNFT();
        achievementNft.grantMinterRole(minter);
        vm.stopPrank();
        
        // Create sample achievements
        createSampleAchievements();
    }
    
    function createSampleAchievements() internal {
        vm.startPrank(owner);
        
        // First Trade Achievement
        achievementNft.createAchievement(
            FIRST_TRADE_ID,
            "First Trade",
            "Complete your first trade",
            AchievementNFT.AchievementCategory.TRADING,
            AchievementNFT.AchievementRarity.COMMON,
            100, // XP reward
            10,  // Combat power reward
            0,   // No requirement (manual mint)
            TEST_METADATA_URI
        );
        
        // Volume Achievement
        achievementNft.createAchievement(
            VOLUME_10ETH_ID,
            "Volume Trader",
            "Trade 10 ETH volume",
            AchievementNFT.AchievementCategory.VOLUME,
            AchievementNFT.AchievementRarity.UNCOMMON,
            500,
            50,
            10,  // Requires 10 trades
            TEST_METADATA_URI
        );
        
        // Battle Achievement
        achievementNft.createAchievement(
            BATTLE_WIN_ID,
            "Battle Victor",
            "Win your first battle",
            AchievementNFT.AchievementCategory.BATTLE,
            AchievementNFT.AchievementRarity.COMMON,
            150,
            20,
            0,
            TEST_METADATA_URI
        );
        
        // Community Achievement
        achievementNft.createAchievement(
            COMMUNITY_HELPER_ID,
            "Community Helper",
            "Help resolve disputes",
            AchievementNFT.AchievementCategory.COMMUNITY,
            AchievementNFT.AchievementRarity.RARE,
            1000,
            100,
            5,  // Requires 5 helpful actions
            TEST_METADATA_URI
        );
        
        // Special Event Achievement
        achievementNft.createAchievement(
            SPECIAL_EVENT_ID,
            "Special Event",
            "Limited time achievement",
            AchievementNFT.AchievementCategory.SPECIAL,
            AchievementNFT.AchievementRarity.LEGENDARY,
            5000,
            500,
            0,
            TEST_METADATA_URI
        );
        
        vm.stopPrank();
    }
    
    // Test: Create achievement
    function testCreateAchievement() public {
        vm.startPrank(owner);
        
        string memory newId = "NEW_ACHIEVEMENT";
        
        vm.expectEmit(true, false, false, true);
        emit AchievementCreated(
            newId,
            "New Achievement",
            AchievementNFT.AchievementCategory.TRADING,
            AchievementNFT.AchievementRarity.EPIC
        );
        
        achievementNft.createAchievement(
            newId,
            "New Achievement",
            "Test description",
            AchievementNFT.AchievementCategory.TRADING,
            AchievementNFT.AchievementRarity.EPIC,
            2000,
            200,
            0,
            TEST_METADATA_URI
        );
        
        // Verify achievement was created
        (,string memory name,,,,uint256 xpReward, uint256 combatPowerReward, bool exists, bool active,) = achievementNft.achievements(newId);
        assertEq(name, "New Achievement");
        assertEq(xpReward, 2000);
        assertEq(combatPowerReward, 200);
        assertTrue(exists);
        assertTrue(active);
        
        vm.stopPrank();
    }
    
    // Test: Batch create achievements
    function testBatchCreateAchievements() public {
        vm.startPrank(owner);
        
        string[] memory ids = new string[](3);
        ids[0] = "BATCH_1";
        ids[1] = "BATCH_2";
        ids[2] = "BATCH_3";
        
        string[] memory names = new string[](3);
        names[0] = "Batch Achievement 1";
        names[1] = "Batch Achievement 2";
        names[2] = "Batch Achievement 3";
        
        string[] memory descriptions = new string[](3);
        descriptions[0] = "Description 1";
        descriptions[1] = "Description 2";
        descriptions[2] = "Description 3";
        
        AchievementNFT.AchievementCategory[] memory categories = new AchievementNFT.AchievementCategory[](3);
        categories[0] = AchievementNFT.AchievementCategory.TRADING;
        categories[1] = AchievementNFT.AchievementCategory.VOLUME;
        categories[2] = AchievementNFT.AchievementCategory.BATTLE;
        
        AchievementNFT.AchievementRarity[] memory rarities = new AchievementNFT.AchievementRarity[](3);
        rarities[0] = AchievementNFT.AchievementRarity.COMMON;
        rarities[1] = AchievementNFT.AchievementRarity.UNCOMMON;
        rarities[2] = AchievementNFT.AchievementRarity.RARE;
        
        uint256[] memory xpRewards = new uint256[](3);
        xpRewards[0] = 100;
        xpRewards[1] = 200;
        xpRewards[2] = 300;
        
        uint256[] memory cpRewards = new uint256[](3);
        cpRewards[0] = 10;
        cpRewards[1] = 20;
        cpRewards[2] = 30;
        
        uint256[] memory requirements = new uint256[](3);
        requirements[0] = 0;
        requirements[1] = 5;
        requirements[2] = 10;
        
        string[] memory uris = new string[](3);
        uris[0] = "ipfs://1";
        uris[1] = "ipfs://2";
        uris[2] = "ipfs://3";
        
        achievementNft.batchCreateAchievements(
            ids,
            names,
            descriptions,
            categories,
            rarities,
            xpRewards,
            cpRewards,
            requirements,
            uris
        );
        
        // Verify all achievements were created
        for (uint256 i = 0; i < ids.length; i++) {
            (,string memory name,,,,,,,bool exists,) = achievementNft.achievements(ids[i]);
            assertEq(name, names[i]);
            assertTrue(exists);
        }
        
        vm.stopPrank();
    }
    
    // Test: Get achievements by category
    function testGetAchievementsByCategory() public view {
        string[] memory tradingAchievements = achievementNft.getAchievementsByCategory(
            AchievementNFT.AchievementCategory.TRADING
        );
        
        assertEq(tradingAchievements.length, 1);
        assertEq(tradingAchievements[0], FIRST_TRADE_ID);
        
        string[] memory battleAchievements = achievementNft.getAchievementsByCategory(
            AchievementNFT.AchievementCategory.BATTLE
        );
        
        assertEq(battleAchievements.length, 1);
        assertEq(battleAchievements[0], BATTLE_WIN_ID);
    }
    
    // Test: Get all achievements with pagination
    function testGetAllAchievements() public view {
        (string[] memory ids, string[] memory names, uint8[] memory categories, 
         uint8[] memory rarities, bool[] memory actives, uint256 total) = 
            achievementNft.getAllAchievements(0, 3);
        
        assertEq(ids.length, 3);
        assertEq(total, 5); // We created 5 sample achievements
        assertEq(ids[0], FIRST_TRADE_ID);
        assertEq(names[0], "First Trade");
        assertEq(categories[0], uint8(AchievementNFT.AchievementCategory.TRADING));
        assertEq(rarities[0], uint8(AchievementNFT.AchievementRarity.COMMON));
        assertTrue(actives[0]);
        
        // Test pagination
        (string[] memory ids2,,,,,) = achievementNft.getAllAchievements(3, 3);
        assertEq(ids2.length, 2); // Only 2 achievements left
    }
    
    // Test: Mint achievement
    function testMintAchievement() public {
        vm.startPrank(minter);
        
        uint256 tokenId = achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        
        assertEq(tokenId, 1);
        assertEq(achievementNft.ownerOf(tokenId), user1);
        assertTrue(achievementNft.hasAchievement(user1, FIRST_TRADE_ID));
        assertEq(achievementNft.getUserAchievementToken(user1, FIRST_TRADE_ID), tokenId);
        
        // Check rewards were granted
        assertEq(achievementNft.userTotalXp(user1), 100);
        assertEq(achievementNft.userTotalCombatPower(user1), 10);
        
        vm.stopPrank();
    }
    
    // Test: Cannot mint same achievement twice
    function testCannotMintSameAchievementTwice() public {
        vm.startPrank(minter);
        
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        
        vm.expectRevert(abi.encodeWithSelector(AchievementNFT.UserAlreadyHasAchievement.selector, user1, FIRST_TRADE_ID));
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        
        vm.stopPrank();
    }
    
    // Test: Batch mint achievements
    function testBatchMintAchievements() public {
        vm.startPrank(minter);
        
        string[] memory achievementIds = new string[](3);
        achievementIds[0] = FIRST_TRADE_ID;
        achievementIds[1] = BATTLE_WIN_ID;
        achievementIds[2] = SPECIAL_EVENT_ID;
        
        uint256[] memory tokenIds = achievementNft.batchMintAchievements(user1, achievementIds);
        
        assertEq(tokenIds.length, 3);
        assertEq(achievementNft.ownerOf(tokenIds[0]), user1);
        assertEq(achievementNft.ownerOf(tokenIds[1]), user1);
        assertEq(achievementNft.ownerOf(tokenIds[2]), user1);
        
        // Check total rewards
        uint256 expectedXp = 100 + 150 + 5000;
        uint256 expectedCp = 10 + 20 + 500;
        assertEq(achievementNft.userTotalXp(user1), expectedXp);
        assertEq(achievementNft.userTotalCombatPower(user1), expectedCp);
        
        vm.stopPrank();
    }
    
    // Test: Update user progress
    function testUpdateUserProgress() public {
        vm.startPrank(minter);
        
        vm.expectEmit(true, true, false, true);
        emit AchievementProgressUpdated(user1, VOLUME_10ETH_ID, 5, 10);
        
        achievementNft.updateUserProgress(user1, VOLUME_10ETH_ID, 5);
        
        assertEq(achievementNft.userProgress(user1, VOLUME_10ETH_ID), 5);
        
        vm.stopPrank();
    }
    
    // Test: Increment user progress
    function testIncrementUserProgress() public {
        vm.startPrank(minter);
        
        achievementNft.incrementUserProgress(user1, COMMUNITY_HELPER_ID, 2);
        assertEq(achievementNft.userProgress(user1, COMMUNITY_HELPER_ID), 2);
        
        achievementNft.incrementUserProgress(user1, COMMUNITY_HELPER_ID, 1);
        assertEq(achievementNft.userProgress(user1, COMMUNITY_HELPER_ID), 3);
        
        vm.stopPrank();
    }
    
    // Test: Auto-mint when requirement met
    function testAutoMintWhenRequirementMet() public {
        vm.startPrank(minter);
        
        // Update progress to just below requirement
        achievementNft.updateUserProgress(user1, VOLUME_10ETH_ID, 9);
        assertFalse(achievementNft.hasAchievement(user1, VOLUME_10ETH_ID));
        
        // Update to meet requirement - should auto-mint
        achievementNft.updateUserProgress(user1, VOLUME_10ETH_ID, 10);
        assertTrue(achievementNft.hasAchievement(user1, VOLUME_10ETH_ID));
        
        vm.stopPrank();
    }
    
    // Test: Get user achievements
    function testGetUserAchievements() public {
        vm.startPrank(minter);
        
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        achievementNft.mintAchievement(user1, BATTLE_WIN_ID);
        
        uint256[] memory userTokens = achievementNft.getUserAchievements(user1);
        assertEq(userTokens.length, 2);
        
        vm.stopPrank();
    }
    
    // Test: Get user achievement stats
    function testGetUserAchievementStats() public {
        vm.startPrank(minter);
        
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        achievementNft.mintAchievement(user1, BATTLE_WIN_ID);
        
        (
            uint256 totalAchievements,
            uint256 totalXp,
            uint256 totalCp,
            uint256 completionRate
        ) = achievementNft.getUserAchievementStats(user1);
        
        assertEq(totalAchievements, 2);
        assertEq(totalXp, 250); // 100 + 150
        assertEq(totalCp, 30);  // 10 + 20
        assertEq(completionRate, 40); // 2 out of 5 = 40%
        
        vm.stopPrank();
    }
    
    // Test: Toggle achievement active status
    function testToggleAchievementActive() public {
        vm.startPrank(owner);
        
        (,,,,,,,,bool active1,) = achievementNft.achievements(FIRST_TRADE_ID);
        assertTrue(active1);
        
        achievementNft.toggleAchievementActive(FIRST_TRADE_ID);
        (,,,,,,,,bool active2,) = achievementNft.achievements(FIRST_TRADE_ID);
        assertFalse(active2);
        
        achievementNft.toggleAchievementActive(FIRST_TRADE_ID);
        (,,,,,,,,bool active3,) = achievementNft.achievements(FIRST_TRADE_ID);
        assertTrue(active3);
        
        vm.stopPrank();
    }
    
    // Test: Cannot mint inactive achievement
    function testCannotMintInactiveAchievement() public {
        vm.startPrank(owner);
        achievementNft.toggleAchievementActive(FIRST_TRADE_ID);
        vm.stopPrank();
        
        vm.startPrank(minter);
        vm.expectRevert(abi.encodeWithSelector(AchievementNFT.AchievementNotActive.selector, FIRST_TRADE_ID));
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        vm.stopPrank();
    }
    
    // Test: Update achievement metadata
    function testUpdateAchievementMetadata() public {
        vm.startPrank(owner);
        
        achievementNft.updateAchievementMetadata(FIRST_TRADE_ID, UPDATED_METADATA_URI);
        (,,,,,,,,,string memory metadataUri) = achievementNft.achievements(FIRST_TRADE_ID);
        assertEq(metadataUri, UPDATED_METADATA_URI);
        
        vm.stopPrank();
    }
    
    // Test: Grant and revoke minter role
    function testGrantRevokeMinterRole() public {
        address newMinter = address(0x100);
        
        vm.startPrank(owner);
        
        achievementNft.grantMinterRole(newMinter);
        assertTrue(achievementNft.hasRole(achievementNft.MINTER_ROLE(), newMinter));
        
        achievementNft.revokeMinterRole(newMinter);
        assertFalse(achievementNft.hasRole(achievementNft.MINTER_ROLE(), newMinter));
        
        vm.stopPrank();
    }
    
    // Test: Pause and unpause
    function testPauseUnpause() public {
        vm.startPrank(owner);
        achievementNft.pause();
        vm.stopPrank();
        
        vm.startPrank(minter);
        vm.expectRevert();
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        vm.stopPrank();
        
        vm.startPrank(owner);
        achievementNft.unpause();
        vm.stopPrank();
        
        vm.startPrank(minter);
        uint256 tokenId = achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        assertEq(achievementNft.ownerOf(tokenId), user1);
        vm.stopPrank();
    }
    
    // Test: Get achievement statistics
    function testGetAchievementStats() public {
        vm.startPrank(minter);
        
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        achievementNft.mintAchievement(user2, FIRST_TRADE_ID);
        achievementNft.mintAchievement(user1, BATTLE_WIN_ID);
        
        (
            uint256 totalMinted,
            uint256 uniqueHolders,
            uint256 totalAchievementTypes
        ) = achievementNft.getAchievementStats();
        
        assertEq(totalMinted, 3);
        assertEq(uniqueHolders, 2); // user1 and user2
        assertEq(totalAchievementTypes, 5); // 5 sample achievements created
        
        vm.stopPrank();
    }
    
    // Test: Token URI
    function testTokenURI() public {
        vm.startPrank(minter);
        uint256 tokenId = achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        vm.stopPrank();
        
        string memory uri = achievementNft.tokenURI(tokenId);
        assertEq(uri, TEST_METADATA_URI);
    }
    
    // Test: Only authorized roles can create achievements
    function testOnlyAuthorizedCanCreateAchievements() public {
        vm.startPrank(unauthorizedUser);
        
        vm.expectRevert();
        achievementNft.createAchievement(
            "UNAUTHORIZED",
            "Unauthorized Achievement",
            "Should fail",
            AchievementNFT.AchievementCategory.TRADING,
            AchievementNFT.AchievementRarity.COMMON,
            100,
            10,
            0,
            TEST_METADATA_URI
        );
        
        vm.stopPrank();
    }
    
    // Test: Only minter can mint
    function testOnlyMinterCanMint() public {
        vm.startPrank(unauthorizedUser);
        
        vm.expectRevert();
        achievementNft.mintAchievement(user1, FIRST_TRADE_ID);
        
        vm.stopPrank();
    }
}
