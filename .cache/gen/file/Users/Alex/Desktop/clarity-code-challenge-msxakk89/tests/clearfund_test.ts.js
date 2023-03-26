import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { launch, pledge, pledgeAmountEmpty, pledgeAmountLessThan500, getCampaign, unpledge, unpledgeMoreThanPledged, unpledgeAll, getInvestment, refund, pledgeAmountGreaterThanGoal } from '../helpers/clearfund.ts';
function setup() {
    description: "Crowdfunding is a way to raise money for an individual or organization by collecting donations through family, friends, friends of friends, strangers, businesses, and more.";
}
// TEST CASES
// LAUNCHING A CAMPAIGN
// a user should be able to launch a new campaign
Clarinet.test({
    name: "A user should be able to launch a new campaign",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectOk().expectUint(1);
    }
});
// a user should be able to view campaign information
Clarinet.test({
    name: "A user should be able to view campaign information",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const newCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = newCampaign.result;
        expectedCampaign.expectOk();
        //console.log(expectedCampaign) 
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"Test Campaign"})');
    }
});
// a user should not be able to launch a campaign with a fundGoal of 0
Clarinet.test({
    name: "a user should not be able to launch a campaign without a fundGoal",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(0),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(102);
    }
});
// a user should not be able to launch a campaign without a title, description, or link
Clarinet.test({
    name: "a user should not be able to launch a campaign without a title, description, or link",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8(''),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(101);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Name'),
                types.buff(''),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result2 = block2.receipts[0].result;
        result.expectErr().expectUint(101);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Name'),
                types.buff('This is a campaign that I made.'),
                types.utf8(''),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        const result3 = block3.receipts[0].result;
        result.expectErr().expectUint(101);
    }
});
// a user should not be able to launch a campaign starting sooner than current block
Clarinet.test({
    name: "a user should not be able to launch a campaign starting sooner than current block",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(0),
                types.uint(100)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(103);
    }
});
// a user should not be able to launch a campaign ending sooner than current block
Clarinet.test({
    name: "a user should not be able to launch a campaign ending sooner than current block",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(0)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(104);
    }
});
// a user should not be able to launch a campaign ending more than 12960 blocks in the future
Clarinet.test({
    name: "a user should not be able to launch a campaign ending more than 12960 blocks in the future",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(20000)
            ], wallet_1)
        ]);
        const result = block.receipts[0].result;
        result.expectErr().expectUint(104);
    }
});
// CANCELING A CAMPAIGN
// a campign owner should be able to cancel a campaign before it starts
Clarinet.test({
    name: "a campign owner should be able to cancel a campaign before it starts",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(100)
            ], wallet_1)
        ]);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_1)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectOk();
        const newCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        assertEquals(newCampaign.result, '(err u105)');
    }
});
// a campaign owner should not be able to cancel a campaign after it starts
Clarinet.test({
    name: "a campaign owner should not be able to cancel a campaign after it starts",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_1)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectErr();
    }
});
// a user who does not own a campaign should not be able to cancel it
Clarinet.test({
    name: "a user who does not own a campaign should not be able to cancel it",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(5),
                types.uint(100)
            ], wallet_1)
        ]);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'cancel', [
                types.uint(1)
            ], wallet_2)
        ]);
        const cancelledCampaign = block2.receipts[0].result;
        cancelledCampaign.expectErr();
    }
});
// UPDATING A CAMPAIGN
// a campaign owner should be able to update the title, description, and link of a campaign
Clarinet.test({
    name: "a campaign owner should be able to update the title, description, and link of a campaign",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_1)
        ]);
        const updatedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = updatedCampaign.result;
        //console.log(expectedCampaign)
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x4e6577206465736372697074696f6e, endsAt: u100, fundGoal: u10000, link: u"https://newexample.org", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"New Title"})');
    }
});
// a user who does not own a campaign should not be able to update any information
Clarinet.test({
    name: "a user who does not own a campaign should not be able to update any information",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_2)
        ]);
        const expectedCampaign = block2.receipts[0].result;
        expectedCampaign.expectErr();
    }
});
// a campaign owner should not be able to update a campaign after it has ended
Clarinet.test({
    name: "a campaign owner should not be able to update a campaign after it has ended",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(200);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'update', [
                types.uint(1),
                types.utf8("New Title"),
                types.buff("New description"),
                types.utf8("https://newexample.org")
            ], wallet_1)
        ]);
        const expectedCampaign = block2.receipts[0].result;
        expectedCampaign.expectErr();
    }
});
// CLAIMING CAMPAIGN FUNDS
// a campaign owner should be able to collect funds after the funding goal has been reached
Clarinet.test({
    name: "a campaign owner should be able to collect funds after the funding goal has been reached",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        // console.log(block)
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        // console.log(block2)
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        // console.log(block3)
        const claimedCampaignBlock = block3.receipts[0].result;
        claimedCampaignBlock.expectOk();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: true, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u20000, pledgedCount: u1, startsAt: u2, targetReached: true, targetReachedBy: u6, title: u"Test Campaign"})');
    }
});
// a campaign owner should not be able to collect funds before funding goal has been reached
Clarinet.test({
    name: "a campaign owner should not be able to collect funds before funding goal has been reached",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const claimedCampaignBlock = block2.receipts[0].result;
        claimedCampaignBlock.expectErr();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: false, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u0, pledgedCount: u0, startsAt: u2, targetReached: false, targetReachedBy: u0, title: u"Test Campaign"})');
    }
});
// a campaign owner should not be able to claim funds twice
Clarinet.test({
    name: "a campaign owner should not be able to claim funds twice",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const claimedCampaignBlock = block3.receipts[0].result;
        claimedCampaignBlock.expectOk();
        const claimedCampaign = chain.callReadOnlyFn('clearfund', 'get-campaign', [
            types.uint(1)
        ], wallet_1);
        const expectedCampaign = claimedCampaign.result;
        expectedCampaign.expectOk();
        assertEquals(expectedCampaign, '(ok {campaignOwner: ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5, claimed: true, description: 0x5468697320697320612063616d706169676e20746861742049206d6164652e, endsAt: u100, fundGoal: u10000, link: u"https://example.com", pledgedAmount: u20000, pledgedCount: u1, startsAt: u2, targetReached: true, targetReachedBy: u6, title: u"Test Campaign"})');
        let block4 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_1)
        ]);
        const failedClaim = block4.receipts[0].result;
        failedClaim.expectErr();
        assertEquals(failedClaim, '(err u116)');
    }
});
// a user who does not own a campaign should not be able to claim funds
Clarinet.test({
    name: "a user who does not own a campaign should not be able to claim funds",
    async fn (chain, accounts) {
        const wallet_1 = accounts.get("wallet_1").address;
        const wallet_2 = accounts.get("wallet_2").address;
        let block = chain.mineBlock([
            Tx.contractCall('clearfund', 'launch', [
                types.utf8('Test Campaign'),
                types.buff('This is a campaign that I made.'),
                types.utf8('https://example.com'),
                types.uint(10000),
                types.uint(2),
                types.uint(100)
            ], wallet_1)
        ]);
        chain.mineEmptyBlockUntil(5);
        let block2 = chain.mineBlock([
            Tx.contractCall('clearfund', 'pledge', [
                types.uint(1),
                types.uint(20000)
            ], wallet_2)
        ]);
        let block3 = chain.mineBlock([
            Tx.contractCall('clearfund', 'claim', [
                types.uint(1)
            ], wallet_2)
        ]);
        const claimedCampaign = block3.receipts[0].result;
        claimedCampaign.expectErr();
        assertEquals(claimedCampaign, '(err u107)');
    }
});
// PLEDGING TO A CAMPAIGN
Clarinet.test({
    name: "pledge: a user should be able to invest in a campaign that is active",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "pledge: the pledged amount should transfer to clearfund contract on successful pledge",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 1000);
    }
});
Clarinet.test({
    name: "pledge: the count of investors should increment when a new investor pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        const wallet4 = accounts.get("wallet_4").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet4)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u3");
    }
});
Clarinet.test({
    name: "pledge: the count of investors should stay the same when an investor pledges again",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u2");
    }
});
Clarinet.test({
    name: "pledge: the pledged amount should increase when an investor pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3)
        ]);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedAmount: u4000");
    }
});
Clarinet.test({
    name: "pledge: the pledged mount should should reflect the correct investments by user in investment map ",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet2),
            pledge(wallet3),
            pledge(wallet3)
        ]);
        const investmentWallet2 = getInvestment(chain, wallet2);
        investmentWallet2.result.expectOk().expectSome();
        assertStringIncludes(investmentWallet2.result, "amount: u2000");
        const investmentWallet3 = getInvestment(chain, wallet3);
        investmentWallet3.result.expectOk().expectSome();
        assertStringIncludes(investmentWallet3.result, "amount: u3000");
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that was never launched",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(105);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that has not started",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(108);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to invest in a campaign that has ended",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            pledge(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(109);
    }
});
Clarinet.test({
    name: "pledge: a user should not be able to pledge 0 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledgeAmountEmpty(wallet1)
        ]);
        block.receipts[0].result.expectErr().expectUint(110);
    }
});
Clarinet.test({
    name: "pledge: a user should not be sent an NFT when pledging less than 500 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledgeAmountLessThan500(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const nftReceived = assetsMaps.assets[".donorpass.donorpass"];
        assertEquals(nftReceived, undefined);
    }
});
Clarinet.test({
    name: "pledge: a user should be sent an NFT when pledging more than 500 STX",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const nftReceivedByInvestor = assetsMaps.assets[".donorpass.donorpass"][wallet2];
        assertEquals(nftReceivedByInvestor, 1);
    }
});
// // UNPLEDGING FROM A CAMPAIGN
Clarinet.test({
    name: "unpledge: a user should be able to unpledge their investment",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[1].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "unpledge: the unpledge amount is deducted from clearfund contract on successful unpledge",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 500);
    }
});
Clarinet.test({
    name: "unpledge: the amount pledged should decrement by the same amount a user unpledged",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxAmountAfterUnpledge = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxAmountAfterUnpledge, 500);
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedAmount: u500");
    }
});
Clarinet.test({
    name: "unpledge: the pledgedCount should decrement if a user unpledges their entire investment amount",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledgeAll(wallet2)
        ]);
        block.receipts[1].result.expectOk();
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u0");
    }
});
Clarinet.test({
    name: "unpledge: the pledgedCount should not decrement if a user unpledges some of their investment amount",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[1].result.expectOk();
        const campaign = getCampaign(chain, deployer);
        campaign.result.expectOk().expectTuple();
        assertStringIncludes(campaign.result, "pledgedCount: u1");
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge if the campaign has ended",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledge(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(109);
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge more than they have pledged",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            pledge(wallet2),
            unpledgeMoreThanPledged(wallet2)
        ]);
        block.receipts[1].result.expectErr().expectUint(113);
        assertEquals(block.receipts[1].events.length, 0);
    }
});
Clarinet.test({
    name: "unpledge: a user should not be able to unpledge someone else's investment",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund, 1000);
        const block = chain.mineBlock([
            unpledge(wallet3)
        ]);
        const assetsMaps2 = chain.getAssetsMaps();
        const stxFundsTransferredToClearfund2 = assetsMaps2.assets["STX"][`${deployer}.clearfund`];
        assertEquals(stxFundsTransferredToClearfund2, 1000);
        block.receipts[0].result.expectErr().expectUint(112);
    }
});
// // REFUND FROM A CAMPAIGN
Clarinet.test({
    name: "refund: a user can get refund from the campaign that has ended and not reached its goal",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
Clarinet.test({
    name: "refund: the total amount pledged is refunded to the investor from the campaign on successful refund",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const assetsMaps = chain.getAssetsMaps();
        const stxFundsClearfundAfterPledge = assetsMaps.assets["STX"][`${deployer}.clearfund`];
        const stxFundsWallet2AfterPledge = assetsMaps.assets["STX"][wallet2];
        chain.mineBlock([
            refund(wallet2)
        ]);
        const assetsMaps2 = chain.getAssetsMaps();
        const stxFundsWallet2AfterRefund = assetsMaps2.assets["STX"][wallet2];
        assertEquals(stxFundsWallet2AfterRefund, stxFundsWallet2AfterPledge + stxFundsClearfundAfterPledge);
    }
});
Clarinet.test({
    name: "refund: the investment record is deleted from the investment map on successful refund to the user",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        chain.mineBlock([
            refund(wallet2)
        ]);
        const investment = getInvestment(chain, deployer);
        investment.result.expectOk().expectNone();
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that does not exist",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(105);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign where the user did not make any pledges",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(112);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that is still active",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(114);
    }
});
Clarinet.test({
    name: "refund: a user cannot get refund from a campaign that has ended and has reached the goal",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(20);
        chain.mineBlock([
            pledge(wallet2),
            pledgeAmountGreaterThanGoal(wallet2)
        ]);
        chain.mineEmptyBlockUntil(60);
        const block = chain.mineBlock([
            refund(wallet2)
        ]);
        block.receipts[0].result.expectErr().expectUint(115);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvQWxleC9EZXNrdG9wL2NsYXJpdHktY29kZS1jaGFsbGVuZ2UtbXN4YWtrODkvdGVzdHMvY2xlYXJmdW5kX3Rlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgeyBDbGFyaW5ldCwgVHgsIENoYWluLCBBY2NvdW50LCB0eXBlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC42L2luZGV4LnRzJztcbmltcG9ydCB7IGFzc2VydEVxdWFscywgYXNzZXJ0U3RyaW5nSW5jbHVkZXMgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45MC4wL3Rlc3RpbmcvYXNzZXJ0cy50cyc7XG5pbXBvcnQge1xuICAgIGxhdW5jaCxcbiAgICBwbGVkZ2UsXG4gICAgcGxlZGdlQW1vdW50RW1wdHksXG4gICAgcGxlZGdlQW1vdW50TGVzc1RoYW41MDAsXG4gICAgZ2V0Q2FtcGFpZ24sXG4gICAgdW5wbGVkZ2UsXG4gICAgdW5wbGVkZ2VNb3JlVGhhblBsZWRnZWQsXG4gICAgdW5wbGVkZ2VBbGwsXG4gICAgZ2V0SW52ZXN0bWVudCxcbiAgICByZWZ1bmQsXG4gICAgcGxlZGdlQW1vdW50R3JlYXRlclRoYW5Hb2FsXG59IGZyb20gJy4uL2hlbHBlcnMvY2xlYXJmdW5kLnRzJ1xuXG5mdW5jdGlvbiBzZXR1cCgpIHtcbiAgICBkZXNjcmlwdGlvbjogXCJDcm93ZGZ1bmRpbmcgaXMgYSB3YXkgdG8gcmFpc2UgbW9uZXkgZm9yIGFuIGluZGl2aWR1YWwgb3Igb3JnYW5pemF0aW9uIGJ5IGNvbGxlY3RpbmcgZG9uYXRpb25zIHRocm91Z2ggZmFtaWx5LCBmcmllbmRzLCBmcmllbmRzIG9mIGZyaWVuZHMsIHN0cmFuZ2VycywgYnVzaW5lc3NlcywgYW5kIG1vcmUuXCJcbn1cblxuLy8gVEVTVCBDQVNFU1xuXG4vLyBMQVVOQ0hJTkcgQSBDQU1QQUlHTlxuLy8gYSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIGxhdW5jaCBhIG5ldyBjYW1wYWlnblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJBIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gbGF1bmNoIGEgbmV3IGNhbXBhaWduXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFVpbnQoMSk7XG4gICAgfSxcbn0pO1xuXG4vLyBhIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gdmlldyBjYW1wYWlnbiBpbmZvcm1hdGlvblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJBIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gdmlldyBjYW1wYWlnbiBpbmZvcm1hdGlvblwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcblxuICAgICAgICBjb25zdCBuZXdDYW1wYWlnbiA9IGNoYWluLmNhbGxSZWFkT25seUZuKFxuICAgICAgICAgICAgJ2NsZWFyZnVuZCcsXG4gICAgICAgICAgICAnZ2V0LWNhbXBhaWduJyxcbiAgICAgICAgICAgIFt0eXBlcy51aW50KDEpXSxcbiAgICAgICAgICAgIHdhbGxldF8xXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXhwZWN0ZWRDYW1wYWlnbiA9IG5ld0NhbXBhaWduLnJlc3VsdDtcbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RPaygpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGV4cGVjdGVkQ2FtcGFpZ24pIFxuICAgICAgICBhc3NlcnRFcXVhbHMoZXhwZWN0ZWRDYW1wYWlnbiwgJyhvayB7Y2FtcGFpZ25Pd25lcjogU1QxU0ozRFRFNURON1g1NFlESDVENjRSM0JDQjZBMkFHMlpROFlQRDUsIGNsYWltZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogMHg1NDY4Njk3MzIwNjk3MzIwNjEyMDYzNjE2ZDcwNjE2OTY3NmUyMDc0Njg2MTc0MjA0OTIwNmQ2MTY0NjUyZSwgZW5kc0F0OiB1MTAwLCBmdW5kR29hbDogdTEwMDAwLCBsaW5rOiB1XCJodHRwczovL2V4YW1wbGUuY29tXCIsIHBsZWRnZWRBbW91bnQ6IHUwLCBwbGVkZ2VkQ291bnQ6IHUwLCBzdGFydHNBdDogdTIsIHRhcmdldFJlYWNoZWQ6IGZhbHNlLCB0YXJnZXRSZWFjaGVkQnk6IHUwLCB0aXRsZTogdVwiVGVzdCBDYW1wYWlnblwifSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gbGF1bmNoIGEgY2FtcGFpZ24gd2l0aCBhIGZ1bmRHb2FsIG9mIDBcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiB3aXRob3V0IGEgZnVuZEdvYWxcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICByZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDIpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiB3aXRob3V0IGEgdGl0bGUsIGRlc2NyaXB0aW9uLCBvciBsaW5rXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gbGF1bmNoIGEgY2FtcGFpZ24gd2l0aG91dCBhIHRpdGxlLCBkZXNjcmlwdGlvbiwgb3IgbGlua1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwMSk7XG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnTmFtZScpLCB0eXBlcy5idWZmKCcnKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQyID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgcmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTAxKTtcblxuICAgICAgICBsZXQgYmxvY2szID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdOYW1lJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDMgPSBibG9jazMucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICByZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDEpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiBzdGFydGluZyBzb29uZXIgdGhhbiBjdXJyZW50IGJsb2NrXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gbGF1bmNoIGEgY2FtcGFpZ24gc3RhcnRpbmcgc29vbmVyIHRoYW4gY3VycmVudCBibG9ja1wiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMCksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICByZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDMpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiBlbmRpbmcgc29vbmVyIHRoYW4gY3VycmVudCBibG9ja1xuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGxhdW5jaCBhIGNhbXBhaWduIGVuZGluZyBzb29uZXIgdGhhbiBjdXJyZW50IGJsb2NrXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCg1KSwgdHlwZXMudWludCgwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0O1xuICAgICAgICByZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDQpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBsYXVuY2ggYSBjYW1wYWlnbiBlbmRpbmcgbW9yZSB0aGFuIDEyOTYwIGJsb2NrcyBpbiB0aGUgZnV0dXJlXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gbGF1bmNoIGEgY2FtcGFpZ24gZW5kaW5nIG1vcmUgdGhhbiAxMjk2MCBibG9ja3MgaW4gdGhlIGZ1dHVyZVwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoNSksIHR5cGVzLnVpbnQoMjAwMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIHJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwNCk7XG4gICAgfSxcbn0pO1xuXG4vLyBDQU5DRUxJTkcgQSBDQU1QQUlHTlxuLy8gYSBjYW1waWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIGNhbmNlbCBhIGNhbXBhaWduIGJlZm9yZSBpdCBzdGFydHNcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSBjYW1waWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIGNhbmNlbCBhIGNhbXBhaWduIGJlZm9yZSBpdCBzdGFydHNcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDUpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjYW5jZWwnLCBbdHlwZXMudWludCgxKV0sIHdhbGxldF8xKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGNhbmNlbGxlZENhbXBhaWduID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdDtcbiAgICAgICAgY2FuY2VsbGVkQ2FtcGFpZ24uZXhwZWN0T2soKTtcblxuICAgICAgICBjb25zdCBuZXdDYW1wYWlnbiA9IGNoYWluLmNhbGxSZWFkT25seUZuKFxuICAgICAgICAgICAgJ2NsZWFyZnVuZCcsXG4gICAgICAgICAgICAnZ2V0LWNhbXBhaWduJyxcbiAgICAgICAgICAgIFt0eXBlcy51aW50KDEpXSxcbiAgICAgICAgICAgIHdhbGxldF8xXG4gICAgICAgICk7XG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKG5ld0NhbXBhaWduLnJlc3VsdCwgJyhlcnIgdTEwNSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNhbmNlbCBhIGNhbXBhaWduIGFmdGVyIGl0IHN0YXJ0c1xuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBub3QgYmUgYWJsZSB0byBjYW5jZWwgYSBjYW1wYWlnbiBhZnRlciBpdCBzdGFydHNcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg1KVxuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnY2FuY2VsJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBjYW5jZWxsZWRDYW1wYWlnbiA9IGJsb2NrMi5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIGNhbmNlbGxlZENhbXBhaWduLmV4cGVjdEVycigpO1xuICAgIH0sXG59KTtcblxuLy8gYSB1c2VyIHdobyBkb2VzIG5vdCBvd24gYSBjYW1wYWlnbiBzaG91bGQgbm90IGJlIGFibGUgdG8gY2FuY2VsIGl0XG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciB3aG8gZG9lcyBub3Qgb3duIGEgY2FtcGFpZ24gc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNhbmNlbCBpdFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXRfMiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCg1KSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnY2FuY2VsJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMilcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBjYW5jZWxsZWRDYW1wYWlnbiA9IGJsb2NrMi5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIGNhbmNlbGxlZENhbXBhaWduLmV4cGVjdEVycigpO1xuICAgIH0sXG59KTtcblxuLy8gVVBEQVRJTkcgQSBDQU1QQUlHTlxuLy8gYSBjYW1wYWlnbiBvd25lciBzaG91bGQgYmUgYWJsZSB0byB1cGRhdGUgdGhlIHRpdGxlLCBkZXNjcmlwdGlvbiwgYW5kIGxpbmsgb2YgYSBjYW1wYWlnblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIHVwZGF0ZSB0aGUgdGl0bGUsIGRlc2NyaXB0aW9uLCBhbmQgbGluayBvZiBhIGNhbXBhaWduXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNSlcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ3VwZGF0ZScsIFt0eXBlcy51aW50KDEpLCB0eXBlcy51dGY4KFwiTmV3IFRpdGxlXCIpLCB0eXBlcy5idWZmKFwiTmV3IGRlc2NyaXB0aW9uXCIpLCB0eXBlcy51dGY4KFwiaHR0cHM6Ly9uZXdleGFtcGxlLm9yZ1wiKV0sIHdhbGxldF8xKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IHVwZGF0ZWRDYW1wYWlnbiA9IGNoYWluLmNhbGxSZWFkT25seUZuKFxuICAgICAgICAgICAgJ2NsZWFyZnVuZCcsXG4gICAgICAgICAgICAnZ2V0LWNhbXBhaWduJyxcbiAgICAgICAgICAgIFt0eXBlcy51aW50KDEpXSxcbiAgICAgICAgICAgIHdhbGxldF8xXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXhwZWN0ZWRDYW1wYWlnbiA9IHVwZGF0ZWRDYW1wYWlnbi5yZXN1bHQ7XG4gICAgICAgIC8vY29uc29sZS5sb2coZXhwZWN0ZWRDYW1wYWlnbilcbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RPaygpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoZXhwZWN0ZWRDYW1wYWlnbiwgJyhvayB7Y2FtcGFpZ25Pd25lcjogU1QxU0ozRFRFNURON1g1NFlESDVENjRSM0JDQjZBMkFHMlpROFlQRDUsIGNsYWltZWQ6IGZhbHNlLCBkZXNjcmlwdGlvbjogMHg0ZTY1NzcyMDY0NjU3MzYzNzI2OTcwNzQ2OTZmNmUsIGVuZHNBdDogdTEwMCwgZnVuZEdvYWw6IHUxMDAwMCwgbGluazogdVwiaHR0cHM6Ly9uZXdleGFtcGxlLm9yZ1wiLCBwbGVkZ2VkQW1vdW50OiB1MCwgcGxlZGdlZENvdW50OiB1MCwgc3RhcnRzQXQ6IHUyLCB0YXJnZXRSZWFjaGVkOiBmYWxzZSwgdGFyZ2V0UmVhY2hlZEJ5OiB1MCwgdGl0bGU6IHVcIk5ldyBUaXRsZVwifSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgdXNlciB3aG8gZG9lcyBub3Qgb3duIGEgY2FtcGFpZ24gc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVwZGF0ZSBhbnkgaW5mb3JtYXRpb25cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSB1c2VyIHdobyBkb2VzIG5vdCBvd24gYSBjYW1wYWlnbiBzaG91bGQgbm90IGJlIGFibGUgdG8gdXBkYXRlIGFueSBpbmZvcm1hdGlvblwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG5cbiAgICAgICAgY29uc3Qgd2FsbGV0XzEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXRfMiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNSlcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ3VwZGF0ZScsIFt0eXBlcy51aW50KDEpLCB0eXBlcy51dGY4KFwiTmV3IFRpdGxlXCIpLCB0eXBlcy5idWZmKFwiTmV3IGRlc2NyaXB0aW9uXCIpLCB0eXBlcy51dGY4KFwiaHR0cHM6Ly9uZXdleGFtcGxlLm9yZ1wiKV0sIHdhbGxldF8yKVxuICAgICAgICBdKVxuXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2FtcGFpZ24gPSBibG9jazIucmVjZWlwdHNbMF0ucmVzdWx0XG5cbiAgICAgICAgZXhwZWN0ZWRDYW1wYWlnbi5leHBlY3RFcnIoKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHVwZGF0ZSBhIGNhbXBhaWduIGFmdGVyIGl0IGhhcyBlbmRlZFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBub3QgYmUgYWJsZSB0byB1cGRhdGUgYSBjYW1wYWlnbiBhZnRlciBpdCBoYXMgZW5kZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMDApXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICd1cGRhdGUnLCBbdHlwZXMudWludCgxKSwgdHlwZXMudXRmOChcIk5ldyBUaXRsZVwiKSwgdHlwZXMuYnVmZihcIk5ldyBkZXNjcmlwdGlvblwiKSwgdHlwZXMudXRmOChcImh0dHBzOi8vbmV3ZXhhbXBsZS5vcmdcIildLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBleHBlY3RlZENhbXBhaWduID0gYmxvY2syLnJlY2VpcHRzWzBdLnJlc3VsdFxuXG4gICAgICAgIGV4cGVjdGVkQ2FtcGFpZ24uZXhwZWN0RXJyKCk7XG4gICAgfSxcbn0pO1xuXG4vLyBDTEFJTUlORyBDQU1QQUlHTiBGVU5EU1xuLy8gYSBjYW1wYWlnbiBvd25lciBzaG91bGQgYmUgYWJsZSB0byBjb2xsZWN0IGZ1bmRzIGFmdGVyIHRoZSBmdW5kaW5nIGdvYWwgaGFzIGJlZW4gcmVhY2hlZFxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJhIGNhbXBhaWduIG93bmVyIHNob3VsZCBiZSBhYmxlIHRvIGNvbGxlY3QgZnVuZHMgYWZ0ZXIgdGhlIGZ1bmRpbmcgZ29hbCBoYXMgYmVlbiByZWFjaGVkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldF8yID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGJsb2NrKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDUpXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdwbGVkZ2UnLCBbdHlwZXMudWludCgxKSwgdHlwZXMudWludCgyMDAwMCldLCB3YWxsZXRfMilcbiAgICAgICAgXSlcbiAgICAgICAgLy8gY29uc29sZS5sb2coYmxvY2syKVxuICAgICAgICBsZXQgYmxvY2szID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2NsYWltJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcbiAgICAgICAgLy8gY29uc29sZS5sb2coYmxvY2szKVxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ25CbG9jayA9IGJsb2NrMy5yZWNlaXB0c1swXS5yZXN1bHRcblxuICAgICAgICBjbGFpbWVkQ2FtcGFpZ25CbG9jay5leHBlY3RPaygpO1xuXG4gICAgICAgIGNvbnN0IGNsYWltZWRDYW1wYWlnbiA9IGNoYWluLmNhbGxSZWFkT25seUZuKFxuICAgICAgICAgICAgJ2NsZWFyZnVuZCcsXG4gICAgICAgICAgICAnZ2V0LWNhbXBhaWduJyxcbiAgICAgICAgICAgIFt0eXBlcy51aW50KDEpXSxcbiAgICAgICAgICAgIHdhbGxldF8xXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXhwZWN0ZWRDYW1wYWlnbiA9IGNsYWltZWRDYW1wYWlnbi5yZXN1bHQ7XG4gICAgICAgIGV4cGVjdGVkQ2FtcGFpZ24uZXhwZWN0T2soKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGV4cGVjdGVkQ2FtcGFpZ24sICcob2sge2NhbXBhaWduT3duZXI6IFNUMVNKM0RURTVETjdYNTRZREg1RDY0UjNCQ0I2QTJBRzJaUThZUEQ1LCBjbGFpbWVkOiB0cnVlLCBkZXNjcmlwdGlvbjogMHg1NDY4Njk3MzIwNjk3MzIwNjEyMDYzNjE2ZDcwNjE2OTY3NmUyMDc0Njg2MTc0MjA0OTIwNmQ2MTY0NjUyZSwgZW5kc0F0OiB1MTAwLCBmdW5kR29hbDogdTEwMDAwLCBsaW5rOiB1XCJodHRwczovL2V4YW1wbGUuY29tXCIsIHBsZWRnZWRBbW91bnQ6IHUyMDAwMCwgcGxlZGdlZENvdW50OiB1MSwgc3RhcnRzQXQ6IHUyLCB0YXJnZXRSZWFjaGVkOiB0cnVlLCB0YXJnZXRSZWFjaGVkQnk6IHU2LCB0aXRsZTogdVwiVGVzdCBDYW1wYWlnblwifSknKTtcbiAgICB9LFxufSk7XG5cbi8vIGEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNvbGxlY3QgZnVuZHMgYmVmb3JlIGZ1bmRpbmcgZ29hbCBoYXMgYmVlbiByZWFjaGVkXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgY2FtcGFpZ24gb3duZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNvbGxlY3QgZnVuZHMgYmVmb3JlIGZ1bmRpbmcgZ29hbCBoYXMgYmVlbiByZWFjaGVkXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgbGV0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2xhdW5jaCcsIFt0eXBlcy51dGY4KCdUZXN0IENhbXBhaWduJyksIHR5cGVzLmJ1ZmYoJ1RoaXMgaXMgYSBjYW1wYWlnbiB0aGF0IEkgbWFkZS4nKSwgdHlwZXMudXRmOCgnaHR0cHM6Ly9leGFtcGxlLmNvbScpLCB0eXBlcy51aW50KDEwMDAwKSwgdHlwZXMudWludCgyKSwgdHlwZXMudWludCgxMDApXSwgd2FsbGV0XzEpXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNSlcblxuICAgICAgICBsZXQgYmxvY2syID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2NsYWltJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ25CbG9jayA9IGJsb2NrMi5yZWNlaXB0c1swXS5yZXN1bHRcblxuICAgICAgICBjbGFpbWVkQ2FtcGFpZ25CbG9jay5leHBlY3RFcnIoKTtcblxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ24gPSBjaGFpbi5jYWxsUmVhZE9ubHlGbihcbiAgICAgICAgICAgICdjbGVhcmZ1bmQnLFxuICAgICAgICAgICAgJ2dldC1jYW1wYWlnbicsXG4gICAgICAgICAgICBbdHlwZXMudWludCgxKV0sXG4gICAgICAgICAgICB3YWxsZXRfMVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGV4cGVjdGVkQ2FtcGFpZ24gPSBjbGFpbWVkQ2FtcGFpZ24ucmVzdWx0O1xuICAgICAgICBleHBlY3RlZENhbXBhaWduLmV4cGVjdE9rKCk7XG4gICAgICAgIGFzc2VydEVxdWFscyhleHBlY3RlZENhbXBhaWduLCAnKG9rIHtjYW1wYWlnbk93bmVyOiBTVDFTSjNEVEU1RE43WDU0WURINUQ2NFIzQkNCNkEyQUcyWlE4WVBENSwgY2xhaW1lZDogZmFsc2UsIGRlc2NyaXB0aW9uOiAweDU0Njg2OTczMjA2OTczMjA2MTIwNjM2MTZkNzA2MTY5Njc2ZTIwNzQ2ODYxNzQyMDQ5MjA2ZDYxNjQ2NTJlLCBlbmRzQXQ6IHUxMDAsIGZ1bmRHb2FsOiB1MTAwMDAsIGxpbms6IHVcImh0dHBzOi8vZXhhbXBsZS5jb21cIiwgcGxlZGdlZEFtb3VudDogdTAsIHBsZWRnZWRDb3VudDogdTAsIHN0YXJ0c0F0OiB1MiwgdGFyZ2V0UmVhY2hlZDogZmFsc2UsIHRhcmdldFJlYWNoZWRCeTogdTAsIHRpdGxlOiB1XCJUZXN0IENhbXBhaWduXCJ9KScpO1xuICAgIH0sXG59KTtcblxuLy8gYSBjYW1wYWlnbiBvd25lciBzaG91bGQgbm90IGJlIGFibGUgdG8gY2xhaW0gZnVuZHMgdHdpY2VcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiYSBjYW1wYWlnbiBvd25lciBzaG91bGQgbm90IGJlIGFibGUgdG8gY2xhaW0gZnVuZHMgdHdpY2VcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuXG4gICAgICAgIGNvbnN0IHdhbGxldF8xID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0XzIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGxldCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdsYXVuY2gnLCBbdHlwZXMudXRmOCgnVGVzdCBDYW1wYWlnbicpLCB0eXBlcy5idWZmKCdUaGlzIGlzIGEgY2FtcGFpZ24gdGhhdCBJIG1hZGUuJyksIHR5cGVzLnV0ZjgoJ2h0dHBzOi8vZXhhbXBsZS5jb20nKSwgdHlwZXMudWludCgxMDAwMCksIHR5cGVzLnVpbnQoMiksIHR5cGVzLnVpbnQoMTAwKV0sIHdhbGxldF8xKVxuICAgICAgICBdKTtcblxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDUpXG5cbiAgICAgICAgbGV0IGJsb2NrMiA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdwbGVkZ2UnLCBbdHlwZXMudWludCgxKSwgdHlwZXMudWludCgyMDAwMCldLCB3YWxsZXRfMilcbiAgICAgICAgXSlcblxuICAgICAgICBsZXQgYmxvY2szID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2NsYWltJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBjbGFpbWVkQ2FtcGFpZ25CbG9jayA9IGJsb2NrMy5yZWNlaXB0c1swXS5yZXN1bHRcblxuICAgICAgICBjbGFpbWVkQ2FtcGFpZ25CbG9jay5leHBlY3RPaygpO1xuXG4gICAgICAgIGNvbnN0IGNsYWltZWRDYW1wYWlnbiA9IGNoYWluLmNhbGxSZWFkT25seUZuKFxuICAgICAgICAgICAgJ2NsZWFyZnVuZCcsXG4gICAgICAgICAgICAnZ2V0LWNhbXBhaWduJyxcbiAgICAgICAgICAgIFt0eXBlcy51aW50KDEpXSxcbiAgICAgICAgICAgIHdhbGxldF8xXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZXhwZWN0ZWRDYW1wYWlnbiA9IGNsYWltZWRDYW1wYWlnbi5yZXN1bHQ7XG4gICAgICAgIGV4cGVjdGVkQ2FtcGFpZ24uZXhwZWN0T2soKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGV4cGVjdGVkQ2FtcGFpZ24sICcob2sge2NhbXBhaWduT3duZXI6IFNUMVNKM0RURTVETjdYNTRZREg1RDY0UjNCQ0I2QTJBRzJaUThZUEQ1LCBjbGFpbWVkOiB0cnVlLCBkZXNjcmlwdGlvbjogMHg1NDY4Njk3MzIwNjk3MzIwNjEyMDYzNjE2ZDcwNjE2OTY3NmUyMDc0Njg2MTc0MjA0OTIwNmQ2MTY0NjUyZSwgZW5kc0F0OiB1MTAwLCBmdW5kR29hbDogdTEwMDAwLCBsaW5rOiB1XCJodHRwczovL2V4YW1wbGUuY29tXCIsIHBsZWRnZWRBbW91bnQ6IHUyMDAwMCwgcGxlZGdlZENvdW50OiB1MSwgc3RhcnRzQXQ6IHUyLCB0YXJnZXRSZWFjaGVkOiB0cnVlLCB0YXJnZXRSZWFjaGVkQnk6IHU2LCB0aXRsZTogdVwiVGVzdCBDYW1wYWlnblwifSknKTtcblxuICAgICAgICBsZXQgYmxvY2s0ID0gY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgICAgICAgIFR4LmNvbnRyYWN0Q2FsbCgnY2xlYXJmdW5kJywgJ2NsYWltJywgW3R5cGVzLnVpbnQoMSldLCB3YWxsZXRfMSlcbiAgICAgICAgXSlcblxuICAgICAgICBjb25zdCBmYWlsZWRDbGFpbSA9IGJsb2NrNC5yZWNlaXB0c1swXS5yZXN1bHQ7XG4gICAgICAgIGZhaWxlZENsYWltLmV4cGVjdEVycigpO1xuICAgICAgICBhc3NlcnRFcXVhbHMoZmFpbGVkQ2xhaW0sICcoZXJyIHUxMTYpJylcbiAgICB9LFxufSk7XG5cbi8vIGEgdXNlciB3aG8gZG9lcyBub3Qgb3duIGEgY2FtcGFpZ24gc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNsYWltIGZ1bmRzXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImEgdXNlciB3aG8gZG9lcyBub3Qgb3duIGEgY2FtcGFpZ24gc2hvdWxkIG5vdCBiZSBhYmxlIHRvIGNsYWltIGZ1bmRzXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcblxuICAgICAgICBjb25zdCB3YWxsZXRfMSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldF8yID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBsZXQgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAnbGF1bmNoJywgW3R5cGVzLnV0ZjgoJ1Rlc3QgQ2FtcGFpZ24nKSwgdHlwZXMuYnVmZignVGhpcyBpcyBhIGNhbXBhaWduIHRoYXQgSSBtYWRlLicpLCB0eXBlcy51dGY4KCdodHRwczovL2V4YW1wbGUuY29tJyksIHR5cGVzLnVpbnQoMTAwMDApLCB0eXBlcy51aW50KDIpLCB0eXBlcy51aW50KDEwMCldLCB3YWxsZXRfMSlcbiAgICAgICAgXSk7XG5cbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg1KVxuXG4gICAgICAgIGxldCBibG9jazIgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgVHguY29udHJhY3RDYWxsKCdjbGVhcmZ1bmQnLCAncGxlZGdlJywgW3R5cGVzLnVpbnQoMSksIHR5cGVzLnVpbnQoMjAwMDApXSwgd2FsbGV0XzIpXG4gICAgICAgIF0pXG5cbiAgICAgICAgbGV0IGJsb2NrMyA9IGNoYWluLm1pbmVCbG9jayhbXG4gICAgICAgICAgICBUeC5jb250cmFjdENhbGwoJ2NsZWFyZnVuZCcsICdjbGFpbScsIFt0eXBlcy51aW50KDEpXSwgd2FsbGV0XzIpXG4gICAgICAgIF0pXG5cbiAgICAgICAgY29uc3QgY2xhaW1lZENhbXBhaWduID0gYmxvY2szLnJlY2VpcHRzWzBdLnJlc3VsdFxuXG4gICAgICAgIGNsYWltZWRDYW1wYWlnbi5leHBlY3RFcnIoKTtcbiAgICAgICAgYXNzZXJ0RXF1YWxzKGNsYWltZWRDYW1wYWlnbiwgJyhlcnIgdTEwNyknKTtcbiAgICB9LFxufSk7XG5cbi8vIFBMRURHSU5HIFRPIEEgQ0FNUEFJR05cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiBhIHVzZXIgc2hvdWxkIGJlIGFibGUgdG8gaW52ZXN0IGluIGEgY2FtcGFpZ24gdGhhdCBpcyBhY3RpdmVcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcblxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RCb29sKHRydWUpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogdGhlIHBsZWRnZWQgYW1vdW50IHNob3VsZCB0cmFuc2ZlciB0byBjbGVhcmZ1bmQgY29udHJhY3Qgb24gc3VjY2Vzc2Z1bCBwbGVkZ2VcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQgPSBhc3NldHNNYXBzLmFzc2V0c1tcIlNUWFwiXVtgJHtkZXBsb3llcn0uY2xlYXJmdW5kYF1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKHN0eEZ1bmRzVHJhbnNmZXJyZWRUb0NsZWFyZnVuZCwgMTAwMClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiB0aGUgY291bnQgb2YgaW52ZXN0b3JzIHNob3VsZCBpbmNyZW1lbnQgd2hlbiBhIG5ldyBpbnZlc3RvciBwbGVkZ2VzXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDMgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfM1wiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQ0ID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzRcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCBwbGVkZ2Uod2FsbGV0MyksIHBsZWRnZSh3YWxsZXQ0KSBdKVxuXG4gICAgICAgIGNvbnN0IGNhbXBhaWduID0gZ2V0Q2FtcGFpZ24oY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBjYW1wYWlnbi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RUdXBsZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGNhbXBhaWduLnJlc3VsdCwgXCJwbGVkZ2VkQ291bnQ6IHUzXCIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogdGhlIGNvdW50IG9mIGludmVzdG9ycyBzaG91bGQgc3RheSB0aGUgc2FtZSB3aGVuIGFuIGludmVzdG9yIHBsZWRnZXMgYWdhaW5cIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlKHdhbGxldDMpLCBwbGVkZ2Uod2FsbGV0MiksIHBsZWRnZSh3YWxsZXQzKSBdKVxuXG4gICAgICAgIGNvbnN0IGNhbXBhaWduID0gZ2V0Q2FtcGFpZ24oY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBjYW1wYWlnbi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RUdXBsZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGNhbXBhaWduLnJlc3VsdCwgXCJwbGVkZ2VkQ291bnQ6IHUyXCIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogdGhlIHBsZWRnZWQgYW1vdW50IHNob3VsZCBpbmNyZWFzZSB3aGVuIGFuIGludmVzdG9yIHBsZWRnZXNcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlKHdhbGxldDMpLCBwbGVkZ2Uod2FsbGV0MiksIHBsZWRnZSh3YWxsZXQzKSBdKVxuXG4gICAgICAgIGNvbnN0IGNhbXBhaWduID0gZ2V0Q2FtcGFpZ24oY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBjYW1wYWlnbi5yZXN1bHQuZXhwZWN0T2soKS5leHBlY3RUdXBsZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGNhbXBhaWduLnJlc3VsdCwgXCJwbGVkZ2VkQW1vdW50OiB1NDAwMFwiKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IHRoZSBwbGVkZ2VkIG1vdW50IHNob3VsZCBzaG91bGQgcmVmbGVjdCB0aGUgY29ycmVjdCBpbnZlc3RtZW50cyBieSB1c2VyIGluIGludmVzdG1lbnQgbWFwIFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQzID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzNcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCBwbGVkZ2Uod2FsbGV0MyksIHBsZWRnZSh3YWxsZXQyKSwgcGxlZGdlKHdhbGxldDMpLCBwbGVkZ2Uod2FsbGV0MykgXSlcblxuICAgICAgICBjb25zdCBpbnZlc3RtZW50V2FsbGV0MiA9IGdldEludmVzdG1lbnQoY2hhaW4sIHdhbGxldDIpXG4gICAgICAgIGludmVzdG1lbnRXYWxsZXQyLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFNvbWUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhpbnZlc3RtZW50V2FsbGV0Mi5yZXN1bHQsIFwiYW1vdW50OiB1MjAwMFwiKVxuXG4gICAgICAgIGNvbnN0IGludmVzdG1lbnRXYWxsZXQzID0gZ2V0SW52ZXN0bWVudChjaGFpbiwgd2FsbGV0MylcbiAgICAgICAgaW52ZXN0bWVudFdhbGxldDMucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0U29tZSgpXG4gICAgICAgIGFzc2VydFN0cmluZ0luY2x1ZGVzKGludmVzdG1lbnRXYWxsZXQzLnJlc3VsdCwgXCJhbW91bnQ6IHUzMDAwXCIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBpbnZlc3QgaW4gYSBjYW1wYWlnbiB0aGF0IHdhcyBuZXZlciBsYXVuY2hlZFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MSkgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTA1KVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gaW52ZXN0IGluIGEgY2FtcGFpZ24gdGhhdCBoYXMgbm90IHN0YXJ0ZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQxKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMDgpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInBsZWRnZTogYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byBpbnZlc3QgaW4gYSBjYW1wYWlnbiB0aGF0IGhhcyBlbmRlZFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNjApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDEpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDEwOSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiBhIHVzZXIgc2hvdWxkIG5vdCBiZSBhYmxlIHRvIHBsZWRnZSAwIFNUWFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNvbnN0IGJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlQW1vdW50RW1wdHkod2FsbGV0MSkgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTEwKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJwbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIHNlbnQgYW4gTkZUIHdoZW4gcGxlZGdpbmcgbGVzcyB0aGFuIDUwMCBTVFhcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlQW1vdW50TGVzc1RoYW41MDAod2FsbGV0MikgXSlcblxuICAgICAgICBjb25zdCBhc3NldHNNYXBzID0gY2hhaW4uZ2V0QXNzZXRzTWFwcygpXG4gICAgICAgIGNvbnN0IG5mdFJlY2VpdmVkID0gYXNzZXRzTWFwcy5hc3NldHNbXCIuZG9ub3JwYXNzLmRvbm9ycGFzc1wiXVxuICAgICAgICBhc3NlcnRFcXVhbHMobmZ0UmVjZWl2ZWQsIHVuZGVmaW5lZClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicGxlZGdlOiBhIHVzZXIgc2hvdWxkIGJlIHNlbnQgYW4gTkZUIHdoZW4gcGxlZGdpbmcgbW9yZSB0aGFuIDUwMCBTVFhcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBuZnRSZWNlaXZlZEJ5SW52ZXN0b3IgPSBhc3NldHNNYXBzLmFzc2V0c1tcIi5kb25vcnBhc3MuZG9ub3JwYXNzXCJdW3dhbGxldDJdXG4gICAgICAgIGFzc2VydEVxdWFscyhuZnRSZWNlaXZlZEJ5SW52ZXN0b3IsIDEpXG4gICAgfSxcbn0pO1xuXG4vLyAvLyBVTlBMRURHSU5HIEZST00gQSBDQU1QQUlHTlxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJ1bnBsZWRnZTogYSB1c2VyIHNob3VsZCBiZSBhYmxlIHRvIHVucGxlZGdlIHRoZWlyIGludmVzdG1lbnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzFdLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdEJvb2wodHJ1ZSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IHRoZSB1bnBsZWRnZSBhbW91bnQgaXMgZGVkdWN0ZWQgZnJvbSBjbGVhcmZ1bmQgY29udHJhY3Qgb24gc3VjY2Vzc2Z1bCB1bnBsZWRnZVwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQgPSBhc3NldHNNYXBzLmFzc2V0c1tcIlNUWFwiXVtgJHtkZXBsb3llcn0uY2xlYXJmdW5kYF1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKHN0eEZ1bmRzVHJhbnNmZXJyZWRUb0NsZWFyZnVuZCwgNTAwKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJ1bnBsZWRnZTogdGhlIGFtb3VudCBwbGVkZ2VkIHNob3VsZCBkZWNyZW1lbnQgYnkgdGhlIHNhbWUgYW1vdW50IGEgdXNlciB1bnBsZWRnZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhBbW91bnRBZnRlclVucGxlZGdlID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGFzc2VydEVxdWFscyhzdHhBbW91bnRBZnRlclVucGxlZGdlLCA1MDApXG5cbiAgICAgICAgY29uc3QgY2FtcGFpZ24gPSBnZXRDYW1wYWlnbihjaGFpbiwgZGVwbG95ZXIpXG4gICAgICAgIGNhbXBhaWduLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFR1cGxlKClcbiAgICAgICAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMoY2FtcGFpZ24ucmVzdWx0LCBcInBsZWRnZWRBbW91bnQ6IHU1MDBcIilcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IHRoZSBwbGVkZ2VkQ291bnQgc2hvdWxkIGRlY3JlbWVudCBpZiBhIHVzZXIgdW5wbGVkZ2VzIHRoZWlyIGVudGlyZSBpbnZlc3RtZW50IGFtb3VudFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgdW5wbGVkZ2VBbGwod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMV0ucmVzdWx0LmV4cGVjdE9rKClcblxuICAgICAgICBjb25zdCBjYW1wYWlnbiA9IGdldENhbXBhaWduKGNoYWluLCBkZXBsb3llcilcbiAgICAgICAgY2FtcGFpZ24ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0VHVwbGUoKVxuICAgICAgICBhc3NlcnRTdHJpbmdJbmNsdWRlcyhjYW1wYWlnbi5yZXN1bHQsIFwicGxlZGdlZENvdW50OiB1MFwiKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJ1bnBsZWRnZTogdGhlIHBsZWRnZWRDb3VudCBzaG91bGQgbm90IGRlY3JlbWVudCBpZiBhIHVzZXIgdW5wbGVkZ2VzIHNvbWUgb2YgdGhlaXIgaW52ZXN0bWVudCBhbW91bnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGJsb2NrLnJlY2VpcHRzWzFdLnJlc3VsdC5leHBlY3RPaygpXG5cbiAgICAgICAgY29uc3QgY2FtcGFpZ24gPSBnZXRDYW1wYWlnbihjaGFpbiwgZGVwbG95ZXIpXG4gICAgICAgIGNhbXBhaWduLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFR1cGxlKClcbiAgICAgICAgYXNzZXJ0U3RyaW5nSW5jbHVkZXMoY2FtcGFpZ24ucmVzdWx0LCBcInBsZWRnZWRDb3VudDogdTFcIilcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gdW5wbGVkZ2UgaWYgdGhlIGNhbXBhaWduIGhhcyBlbmRlZFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDYwKVxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSwgdW5wbGVkZ2Uod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTA5KVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJ1bnBsZWRnZTogYSB1c2VyIHNob3VsZCBub3QgYmUgYWJsZSB0byB1bnBsZWRnZSBtb3JlIHRoYW4gdGhleSBoYXZlIHBsZWRnZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MiksIHVucGxlZGdlTW9yZVRoYW5QbGVkZ2VkKHdhbGxldDIpIF0pXG5cbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMV0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTEzKVxuICAgICAgICBhc3NlcnRFcXVhbHMoYmxvY2sucmVjZWlwdHNbMV0uZXZlbnRzLmxlbmd0aCwgMClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidW5wbGVkZ2U6IGEgdXNlciBzaG91bGQgbm90IGJlIGFibGUgdG8gdW5wbGVkZ2Ugc29tZW9uZSBlbHNlJ3MgaW52ZXN0bWVudFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQzID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzNcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhGdW5kc1RyYW5zZmVycmVkVG9DbGVhcmZ1bmQgPSBhc3NldHNNYXBzLmFzc2V0c1tcIlNUWFwiXVtgJHtkZXBsb3llcn0uY2xlYXJmdW5kYF1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKHN0eEZ1bmRzVHJhbnNmZXJyZWRUb0NsZWFyZnVuZCwgMTAwMClcblxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHVucGxlZGdlKHdhbGxldDMpIF0pXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwczIgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3Qgc3R4RnVuZHNUcmFuc2ZlcnJlZFRvQ2xlYXJmdW5kMiA9IGFzc2V0c01hcHMyLmFzc2V0c1tcIlNUWFwiXVtgJHtkZXBsb3llcn0uY2xlYXJmdW5kYF1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKHN0eEZ1bmRzVHJhbnNmZXJyZWRUb0NsZWFyZnVuZDIsIDEwMDApXG5cbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTEyKVxuICAgIH0sXG59KTtcblxuLy8gLy8gUkVGVU5EIEZST00gQSBDQU1QQUlHTlxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IGEgdXNlciBjYW4gZ2V0IHJlZnVuZCBmcm9tIHRoZSBjYW1wYWlnbiB0aGF0IGhhcyBlbmRlZCBhbmQgbm90IHJlYWNoZWQgaXRzIGdvYWxcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNjApXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0Qm9vbCh0cnVlKVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IHRoZSB0b3RhbCBhbW91bnQgcGxlZGdlZCBpcyByZWZ1bmRlZCB0byB0aGUgaW52ZXN0b3IgZnJvbSB0aGUgY2FtcGFpZ24gb24gc3VjY2Vzc2Z1bCByZWZ1bmRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNjApXG5cbiAgICAgICAgY29uc3QgYXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhGdW5kc0NsZWFyZnVuZEFmdGVyUGxlZGdlID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bYCR7ZGVwbG95ZXJ9LmNsZWFyZnVuZGBdXG4gICAgICAgIGNvbnN0IHN0eEZ1bmRzV2FsbGV0MkFmdGVyUGxlZGdlID0gYXNzZXRzTWFwcy5hc3NldHNbXCJTVFhcIl1bd2FsbGV0Ml1cblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcblxuICAgICAgICBjb25zdCBhc3NldHNNYXBzMiA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBzdHhGdW5kc1dhbGxldDJBZnRlclJlZnVuZCA9IGFzc2V0c01hcHMyLmFzc2V0c1tcIlNUWFwiXVt3YWxsZXQyXVxuICAgICAgICBhc3NlcnRFcXVhbHMoc3R4RnVuZHNXYWxsZXQyQWZ0ZXJSZWZ1bmQsIHN0eEZ1bmRzV2FsbGV0MkFmdGVyUGxlZGdlICsgc3R4RnVuZHNDbGVhcmZ1bmRBZnRlclBsZWRnZSlcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwicmVmdW5kOiB0aGUgaW52ZXN0bWVudCByZWNvcmQgaXMgZGVsZXRlZCBmcm9tIHRoZSBpbnZlc3RtZW50IG1hcCBvbiBzdWNjZXNzZnVsIHJlZnVuZCB0byB0aGUgdXNlclwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDIwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg2MClcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcblxuICAgICAgICBjb25zdCBpbnZlc3RtZW50ID0gZ2V0SW52ZXN0bWVudChjaGFpbiwgZGVwbG95ZXIpXG4gICAgICAgIGludmVzdG1lbnQucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0Tm9uZSgpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInJlZnVuZDogYSB1c2VyIGNhbm5vdCBnZXQgcmVmdW5kIGZyb20gYSBjYW1wYWlnbiB0aGF0IGRvZXMgbm90IGV4aXN0XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcbiAgICAgICAgYmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTA1KVxuICAgIH0sXG59KTtcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJyZWZ1bmQ6IGEgdXNlciBjYW5ub3QgZ2V0IHJlZnVuZCBmcm9tIGEgY2FtcGFpZ24gd2hlcmUgdGhlIHVzZXIgZGlkIG5vdCBtYWtlIGFueSBwbGVkZ2VzXCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG5cbiAgICAgICAgY29uc3QgYmxvY2sgPSBjaGFpbi5taW5lQmxvY2soWyByZWZ1bmQod2FsbGV0MikgXSlcblxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMTIpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInJlZnVuZDogYSB1c2VyIGNhbm5vdCBnZXQgcmVmdW5kIGZyb20gYSBjYW1wYWlnbiB0aGF0IGlzIHN0aWxsIGFjdGl2ZVwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDIgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMlwiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcblxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHJlZnVuZCh3YWxsZXQyKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMTQpXG4gICAgfSxcbn0pO1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcInJlZnVuZDogYSB1c2VyIGNhbm5vdCBnZXQgcmVmdW5kIGZyb20gYSBjYW1wYWlnbiB0aGF0IGhhcyBlbmRlZCBhbmQgaGFzIHJlYWNoZWQgdGhlIGdvYWxcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCgyMClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpLCBwbGVkZ2VBbW91bnRHcmVhdGVyVGhhbkdvYWwod2FsbGV0MikgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg2MClcblxuICAgICAgICBjb25zdCBibG9jayA9IGNoYWluLm1pbmVCbG9jayhbIHJlZnVuZCh3YWxsZXQyKSBdKVxuICAgICAgICBibG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgxMTUpXG4gICAgfSxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsUUFBUSxFQUFFLEVBQUUsRUFBa0IsS0FBSyxRQUFRLDhDQUE4QyxDQUFDO0FBQ25HLFNBQVMsWUFBWSxFQUFFLG9CQUFvQixRQUFRLGlEQUFpRCxDQUFDO0FBQ3JHLFNBQ0ksTUFBTSxFQUNOLE1BQU0sRUFDTixpQkFB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