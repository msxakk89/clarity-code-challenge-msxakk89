import { Clarinet } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { launch, pledge } from "../helpers/clearfund.ts";
import { getLastTokenId, mint, transfer, getOwner, getTokenUri } from "../helpers/donorpass.ts";
// tests for transfer functions
Clarinet.test({
    name: "transfer: a user cannot transfer nft if they do not own one",
    async fn (chain, accounts) {
        const sender = accounts.get("deployer").address;
        const receiver = accounts.get("wallet_1").address;
        const minedBlock = chain.mineBlock([
            transfer(sender, receiver, 0)
        ]);
        assertEquals(minedBlock.height, 2);
        minedBlock.receipts[0].result.expectErr().expectUint(3);
    }
});
Clarinet.test({
    name: "transfer: a user cannot transfer nft to themselves",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        // minting the donorpass
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        const minedBlock = chain.mineBlock([
            transfer(wallet2, wallet2, 1)
        ]);
        assertEquals(minedBlock.height, 42);
        minedBlock.receipts[0].result.expectErr().expectUint(2);
    }
});
Clarinet.test({
    name: "transfer: a user should be able transfer nft successfully to another recipient",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        // minting the donorpass
        const def = chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        const abc = chain.mineBlock([
            pledge(wallet2)
        ]);
        const minedBlock = chain.mineBlock([
            transfer(wallet2, wallet3, 1)
        ]);
        assertEquals(minedBlock.height, 42);
        minedBlock.receipts[0].result.expectOk().expectBool(true);
        const theAssetsMaps = chain.getAssetsMaps();
        assertEquals(theAssetsMaps.assets[".donorpass.donorpass"][wallet2], 0);
        assertEquals(theAssetsMaps.assets[".donorpass.donorpass"][wallet3], 1);
    }
});
// tests for mint functions
Clarinet.test({
    name: "mint: a user cannot mint the nft if it is not the clearfund contract",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const responseWhenNothingIsMinted = getLastTokenId(chain, deployer);
        assertEquals(responseWhenNothingIsMinted.result, `(ok u0)`);
        const minedBlock = chain.mineBlock([
            mint(deployer, wallet1)
        ]);
        assertEquals(minedBlock.height, 2);
        minedBlock.receipts[0].result.expectErr().expectUint(100);
        const theAssetsMaps = chain.getAssetsMaps();
        const investorNFTCount = theAssetsMaps.assets[".donorpass.donorpass"];
        assertEquals(investorNFTCount, undefined);
    }
});
Clarinet.test({
    name: "mint: only the clearfund contract can mint the nft",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        assertEquals(getLastTokenId(chain, deployer).result, `(ok u0)`);
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        assertEquals(getLastTokenId(chain, deployer).result, `(ok u1)`);
        const theAssetsMaps = chain.getAssetsMaps();
        const investorNFTCount = theAssetsMaps.assets[".donorpass.donorpass"][wallet2];
        assertEquals(investorNFTCount, 1);
    }
});
// tests for readonly functions
Clarinet.test({
    name: "get-last-token-id: a user is able to read the last nft id minted",
    async fn (chain, accounts) {
        const deployer = accounts.get("deployer").address;
        const wallet1 = accounts.get("wallet_1").address;
        const wallet2 = accounts.get("wallet_2").address;
        const wallet3 = accounts.get("wallet_3").address;
        assertEquals(getLastTokenId(chain, deployer).result, `(ok u0)`);
        chain.mineBlock([
            launch(wallet1)
        ]);
        chain.mineEmptyBlockUntil(40);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineBlock([
            pledge(wallet2)
        ]);
        chain.mineBlock([
            pledge(wallet3)
        ]);
        chain.mineBlock([
            pledge(wallet3)
        ]);
        assertEquals(getLastTokenId(chain, deployer).result, `(ok u4)`);
    }
});
Clarinet.test({
    name: "get-owner: a user is able to read the owner of the nft",
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
        chain.mineBlock([
            pledge(wallet3)
        ]);
        assertEquals(getOwner(chain, deployer, 1).result, `(ok (some ${wallet2}))`);
        assertEquals(getOwner(chain, deployer, 2).result, `(ok (some ${wallet3}))`);
    }
});
Clarinet.test({
    name: "get-token-uri: a user is able to read the owner of the nft",
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
        assertEquals(getTokenUri(chain, deployer, 1).result, `(ok none)`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvQWxleC9EZXNrdG9wL2NsYXJpdHktY29kZS1jaGFsbGVuZ2UtbXN4YWtrODkvdGVzdHMvZG9ub3JwYXNzX3Rlc3QudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2xhcmluZXQsIFR4LCBDaGFpbiwgQWNjb3VudCwgdHlwZXMgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC94L2NsYXJpbmV0QHYxLjAuNi9pbmRleC50cyc7XG5pbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tICdodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45MC4wL3Rlc3RpbmcvYXNzZXJ0cy50cyc7XG5pbXBvcnQgeyBsYXVuY2gsIHBsZWRnZSB9IGZyb20gXCIuLi9oZWxwZXJzL2NsZWFyZnVuZC50c1wiXG5pbXBvcnQgeyBnZXRMYXN0VG9rZW5JZCwgbWludCwgdHJhbnNmZXIsIGdldE93bmVyLCBnZXRUb2tlblVyaSB9IGZyb20gXCIuLi9oZWxwZXJzL2Rvbm9ycGFzcy50c1wiXG5cbi8vIHRlc3RzIGZvciB0cmFuc2ZlciBmdW5jdGlvbnNcbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidHJhbnNmZXI6IGEgdXNlciBjYW5ub3QgdHJhbnNmZXIgbmZ0IGlmIHRoZXkgZG8gbm90IG93biBvbmVcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBzZW5kZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCByZWNlaXZlciA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY29uc3QgbWluZWRCbG9jayA9IGNoYWluLm1pbmVCbG9jayhbdHJhbnNmZXIoc2VuZGVyLCByZWNlaXZlciwgMCldKVxuXG4gICAgICAgIGFzc2VydEVxdWFscyhtaW5lZEJsb2NrLmhlaWdodCwgMilcbiAgICAgICAgbWluZWRCbG9jay5yZWNlaXB0c1swXS5yZXN1bHQuZXhwZWN0RXJyKCkuZXhwZWN0VWludCgzKVxuICAgIH1cbn0pXG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwidHJhbnNmZXI6IGEgdXNlciBjYW5ub3QgdHJhbnNmZXIgbmZ0IHRvIHRoZW1zZWx2ZXNcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICAvLyBtaW50aW5nIHRoZSBkb25vcnBhc3NcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGNvbnN0IG1pbmVkQmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW3RyYW5zZmVyKHdhbGxldDIsIHdhbGxldDIsIDEpXSlcblxuICAgICAgICBhc3NlcnRFcXVhbHMobWluZWRCbG9jay5oZWlnaHQsIDQyKVxuICAgICAgICBtaW5lZEJsb2NrLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RFcnIoKS5leHBlY3RVaW50KDIpXG4gICAgfVxufSlcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJ0cmFuc2ZlcjogYSB1c2VyIHNob3VsZCBiZSBhYmxlIHRyYW5zZmVyIG5mdCBzdWNjZXNzZnVsbHkgdG8gYW5vdGhlciByZWNpcGllbnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgLy8gbWludGluZyB0aGUgZG9ub3JwYXNzXG4gICAgICAgIGNvbnN0IGRlZiA9IGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjb25zdCBhYmMgPSBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcblxuICAgICAgICBjb25zdCBtaW5lZEJsb2NrID0gY2hhaW4ubWluZUJsb2NrKFt0cmFuc2Zlcih3YWxsZXQyLCB3YWxsZXQzLCAxKV0pXG4gICAgICAgIGFzc2VydEVxdWFscyhtaW5lZEJsb2NrLmhlaWdodCwgNDIpXG4gICAgICAgIG1pbmVkQmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdE9rKCkuZXhwZWN0Qm9vbCh0cnVlKVxuXG4gICAgICAgIGNvbnN0IHRoZUFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgYXNzZXJ0RXF1YWxzKHRoZUFzc2V0c01hcHMuYXNzZXRzW1wiLmRvbm9ycGFzcy5kb25vcnBhc3NcIl1bd2FsbGV0Ml0sIDApXG4gICAgICAgIGFzc2VydEVxdWFscyh0aGVBc3NldHNNYXBzLmFzc2V0c1tcIi5kb25vcnBhc3MuZG9ub3JwYXNzXCJdW3dhbGxldDNdLCAxKVxuICAgIH1cbn0pXG5cbi8vIHRlc3RzIGZvciBtaW50IGZ1bmN0aW9uc1xuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJtaW50OiBhIHVzZXIgY2Fubm90IG1pbnQgdGhlIG5mdCBpZiBpdCBpcyBub3QgdGhlIGNsZWFyZnVuZCBjb250cmFjdFwiLFxuICAgIGFzeW5jIGZuKGNoYWluOiBDaGFpbiwgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+KSB7XG4gICAgICAgIGNvbnN0IGRlcGxveWVyID0gYWNjb3VudHMuZ2V0KFwiZGVwbG95ZXJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MSA9IGFjY291bnRzLmdldChcIndhbGxldF8xXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2VXaGVuTm90aGluZ0lzTWludGVkID0gZ2V0TGFzdFRva2VuSWQoY2hhaW4sIGRlcGxveWVyKVxuICAgICAgICBhc3NlcnRFcXVhbHMocmVzcG9uc2VXaGVuTm90aGluZ0lzTWludGVkLnJlc3VsdCwgYChvayB1MClgKVxuXG4gICAgICAgIGNvbnN0IG1pbmVkQmxvY2sgPSBjaGFpbi5taW5lQmxvY2soW1xuICAgICAgICAgICAgbWludChkZXBsb3llciwgd2FsbGV0MSlcbiAgICAgICAgXSlcblxuICAgICAgICBhc3NlcnRFcXVhbHMobWluZWRCbG9jay5oZWlnaHQsIDIpXG4gICAgICAgIG1pbmVkQmxvY2sucmVjZWlwdHNbMF0ucmVzdWx0LmV4cGVjdEVycigpLmV4cGVjdFVpbnQoMTAwKVxuXG4gICAgICAgIGNvbnN0IHRoZUFzc2V0c01hcHMgPSBjaGFpbi5nZXRBc3NldHNNYXBzKClcbiAgICAgICAgY29uc3QgaW52ZXN0b3JORlRDb3VudCA9IHRoZUFzc2V0c01hcHMuYXNzZXRzW1wiLmRvbm9ycGFzcy5kb25vcnBhc3NcIl1cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGludmVzdG9yTkZUQ291bnQsIHVuZGVmaW5lZClcbiAgICB9LFxufSk7XG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwibWludDogb25seSB0aGUgY2xlYXJmdW5kIGNvbnRyYWN0IGNhbiBtaW50IHRoZSBuZnRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcblxuICAgICAgICBhc3NlcnRFcXVhbHMoZ2V0TGFzdFRva2VuSWQoY2hhaW4sIGRlcGxveWVyKS5yZXN1bHQsIGAob2sgdTApYClcblxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBsYXVuY2god2FsbGV0MSkgXSlcbiAgICAgICAgY2hhaW4ubWluZUVtcHR5QmxvY2tVbnRpbCg0MClcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDIpIF0pXG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGdldExhc3RUb2tlbklkKGNoYWluLCBkZXBsb3llcikucmVzdWx0LCBgKG9rIHUxKWApXG5cbiAgICAgICAgY29uc3QgdGhlQXNzZXRzTWFwcyA9IGNoYWluLmdldEFzc2V0c01hcHMoKVxuICAgICAgICBjb25zdCBpbnZlc3Rvck5GVENvdW50ID0gdGhlQXNzZXRzTWFwcy5hc3NldHNbXCIuZG9ub3JwYXNzLmRvbm9ycGFzc1wiXVt3YWxsZXQyXVxuICAgICAgICBhc3NlcnRFcXVhbHMoaW52ZXN0b3JORlRDb3VudCwgMSlcbiAgICB9XG59KTtcblxuLy8gdGVzdHMgZm9yIHJlYWRvbmx5IGZ1bmN0aW9uc1xuXG5DbGFyaW5ldC50ZXN0KHtcbiAgICBuYW1lOiBcImdldC1sYXN0LXRva2VuLWlkOiBhIHVzZXIgaXMgYWJsZSB0byByZWFkIHRoZSBsYXN0IG5mdCBpZCBtaW50ZWRcIixcbiAgICBhc3luYyBmbihjaGFpbjogQ2hhaW4sIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50Pikge1xuICAgICAgICBjb25zdCBkZXBsb3llciA9IGFjY291bnRzLmdldChcImRlcGxveWVyXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDEgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfMVwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQyID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzJcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MyA9IGFjY291bnRzLmdldChcIndhbGxldF8zXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGdldExhc3RUb2tlbklkKGNoYWluLCBkZXBsb3llcikucmVzdWx0LCBgKG9rIHUwKWApXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDMpIF0pXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQzKSBdKVxuXG4gICAgICAgIGFzc2VydEVxdWFscyhnZXRMYXN0VG9rZW5JZChjaGFpbiwgZGVwbG95ZXIpLnJlc3VsdCwgYChvayB1NClgKVxuICAgIH1cbn0pXG5cbkNsYXJpbmV0LnRlc3Qoe1xuICAgIG5hbWU6IFwiZ2V0LW93bmVyOiBhIHVzZXIgaXMgYWJsZSB0byByZWFkIHRoZSBvd25lciBvZiB0aGUgbmZ0XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG4gICAgICAgIGNvbnN0IHdhbGxldDMgPSBhY2NvdW50cy5nZXQoXCJ3YWxsZXRfM1wiKSEuYWRkcmVzc1xuXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIGxhdW5jaCh3YWxsZXQxKSBdKVxuICAgICAgICBjaGFpbi5taW5lRW1wdHlCbG9ja1VudGlsKDQwKVxuICAgICAgICBjaGFpbi5taW5lQmxvY2soWyBwbGVkZ2Uod2FsbGV0MikgXSlcbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgcGxlZGdlKHdhbGxldDMpIF0pXG5cbiAgICAgICAgYXNzZXJ0RXF1YWxzKGdldE93bmVyKGNoYWluLCBkZXBsb3llciwgMSkucmVzdWx0LCBgKG9rIChzb21lICR7d2FsbGV0Mn0pKWApXG4gICAgICAgIGFzc2VydEVxdWFscyhnZXRPd25lcihjaGFpbiwgZGVwbG95ZXIsIDIpLnJlc3VsdCwgYChvayAoc29tZSAke3dhbGxldDN9KSlgKVxuXG4gICAgfVxufSlcblxuQ2xhcmluZXQudGVzdCh7XG4gICAgbmFtZTogXCJnZXQtdG9rZW4tdXJpOiBhIHVzZXIgaXMgYWJsZSB0byByZWFkIHRoZSBvd25lciBvZiB0aGUgbmZ0XCIsXG4gICAgYXN5bmMgZm4oY2hhaW46IENoYWluLCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4pIHtcbiAgICAgICAgY29uc3QgZGVwbG95ZXIgPSBhY2NvdW50cy5nZXQoXCJkZXBsb3llclwiKSEuYWRkcmVzc1xuICAgICAgICBjb25zdCB3YWxsZXQxID0gYWNjb3VudHMuZ2V0KFwid2FsbGV0XzFcIikhLmFkZHJlc3NcbiAgICAgICAgY29uc3Qgd2FsbGV0MiA9IGFjY291bnRzLmdldChcIndhbGxldF8yXCIpIS5hZGRyZXNzXG5cbiAgICAgICAgY2hhaW4ubWluZUJsb2NrKFsgbGF1bmNoKHdhbGxldDEpIF0pXG4gICAgICAgIGNoYWluLm1pbmVFbXB0eUJsb2NrVW50aWwoNDApXG4gICAgICAgIGNoYWluLm1pbmVCbG9jayhbIHBsZWRnZSh3YWxsZXQyKSBdKVxuXG4gICAgICAgIGFzc2VydEVxdWFscyhnZXRUb2tlblVyaShjaGFpbiwgZGVwbG95ZXIsIDEpLnJlc3VsdCwgYChvayBub25lKWApXG5cbiAgICB9XG59KSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFFBQVEsUUFBbUMsOENBQThDLENBQUM7QUFDbkcsU0FBUyxZQUFZLFFBQVEsaURBQWlELENBQUM7QUFDL0UsU0FBUyxNQUFNLEVBQUUsTUFBTSxRQUFRLHlCQUF5QixDQUFBO0FBQ3hELFNBQVMsY0FBYyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsUUFBUSx5QkFBeUIsQ0FBQTtBQUUvRiwrQkFBK0I7QUFDL0IsUUFBUSxDQUFDLElBQUksQ0FBQztJQUNWLElBQUksRUFBRSw2REFBNkQ7SUFDbkUsTUFBTSxFQUFFLEVBQUMsS0FBWSxFQUFFLFFBQThCLEVBQUU7UUFDbkQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBRSxPQUFPO1FBQ2hELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUUsT0FBTztRQUVsRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQUMsQ0FBQztRQUVuRSxZQUFZLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDbEMsVUFBVSxDQUFDLFFBQVEs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