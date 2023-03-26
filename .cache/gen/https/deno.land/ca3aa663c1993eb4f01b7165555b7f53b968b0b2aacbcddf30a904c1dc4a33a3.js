export * from "./types.ts";
export class Tx {
    type;
    sender;
    contractCall;
    transferStx;
    deployContract;
    constructor(type, sender){
        this.type = type;
        this.sender = sender;
    }
    static transferSTX(amount, recipient, sender) {
        const tx = new Tx(1, sender);
        tx.transferStx = {
            recipient,
            amount
        };
        return tx;
    }
    static contractCall(contract, method, args, sender) {
        const tx = new Tx(2, sender);
        tx.contractCall = {
            contract,
            method,
            args
        };
        return tx;
    }
    static deployContract(name, code, sender) {
        const tx = new Tx(3, sender);
        tx.deployContract = {
            name,
            code
        };
        return tx;
    }
}
export class Chain {
    sessionId;
    blockHeight = 1;
    constructor(sessionId){
        this.sessionId = sessionId;
    }
    mineBlock(transactions) {
        const result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/mine_block", {
            sessionId: this.sessionId,
            transactions: transactions
        }));
        this.blockHeight = result.block_height;
        const block = {
            height: result.block_height,
            receipts: result.receipts
        };
        return block;
    }
    mineEmptyBlock(count) {
        const result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/mine_empty_blocks", {
            sessionId: this.sessionId,
            count: count
        }));
        this.blockHeight = result.block_height;
        const emptyBlock = {
            session_id: result.session_id,
            block_height: result.block_height
        };
        return emptyBlock;
    }
    mineEmptyBlockUntil(targetBlockHeight) {
        const count = targetBlockHeight - this.blockHeight;
        if (count < 0) {
            throw new Error(`Chain tip cannot be moved from ${this.blockHeight} to ${targetBlockHeight}`);
        }
        return this.mineEmptyBlock(count);
    }
    callReadOnlyFn(contract, method, args, sender) {
        const result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/call_read_only_fn", {
            sessionId: this.sessionId,
            contract: contract,
            method: method,
            args: args,
            sender: sender
        }));
        const readOnlyFn = {
            session_id: result.session_id,
            result: result.result,
            events: result.events
        };
        return readOnlyFn;
    }
    getAssetsMaps() {
        const result = JSON.parse(// @ts-ignore
        Deno.core.opSync("api/v1/get_assets_maps", {
            sessionId: this.sessionId
        }));
        const assetsMaps = {
            session_id: result.session_id,
            assets: result.assets
        };
        return assetsMaps;
    }
}
export class Clarinet {
    static test(options) {
        // @ts-ignore
        Deno.test({
            name: options.name,
            only: options.only,
            ignore: options.ignore,
            async fn () {
                const hasPreDeploymentSteps = options.preDeployment !== undefined;
                let result = JSON.parse(// @ts-ignore
                Deno.core.opSync("api/v1/new_session", {
                    name: options.name,
                    loadDeployment: !hasPreDeploymentSteps,
                    deploymentPath: options.deploymentPath
                }));
                if (options.preDeployment) {
                    const chain = new Chain(result.session_id);
                    const accounts = new Map();
                    for (const account of result.accounts){
                        accounts.set(account.name, account);
                    }
                    await options.preDeployment(chain, accounts);
                    result = JSON.parse(// @ts-ignore
                    Deno.core.opSync("api/v1/load_deployment", {
                        sessionId: chain.sessionId,
                        deploymentPath: options.deploymentPath
                    }));
                }
                const chain1 = new Chain(result.session_id);
                const accounts1 = new Map();
                for (const account1 of result.accounts){
                    accounts1.set(account1.name, account1);
                }
                const contracts = new Map();
                for (const contract of result.contracts){
                    contracts.set(contract.contract_id, contract);
                }
                await options.fn(chain1, accounts1, contracts);
                JSON.parse(// @ts-ignore
                Deno.core.opSync("api/v1/terminate_session", {
                    sessionId: chain1.sessionId
                }));
            }
        });
    }
    static run(options) {
        // @ts-ignore
        Deno.test({
            name: "running script",
            async fn () {
                const result = JSON.parse(// @ts-ignore
                Deno.core.opSync("api/v1/new_session", {
                    name: "running script",
                    loadDeployment: true,
                    deploymentPath: undefined
                }));
                const accounts = new Map();
                for (const account of result.accounts){
                    accounts.set(account.name, account);
                }
                const contracts = new Map();
                for (const contract of result.contracts){
                    contracts.set(contract.contract_id, contract);
                }
                const stacks_node = {
                    url: result.stacks_node_url
                };
                await options.fn(accounts, contracts, stacks_node);
            }
        });
    }
}
export var types;
(function(types) {
    const byteToHex = [];
    for(let n = 0; n <= 0xff; ++n){
        const hexOctet = n.toString(16).padStart(2, "0");
        byteToHex.push(hexOctet);
    }
    function serializeTuple(input) {
        const items = [];
        for (const [key, value] of Object.entries(input)){
            if (Array.isArray(value)) {
                throw new Error("Tuple value can't be an array");
            } else if (!!value && typeof value === "object") {
                items.push(`${key}: { ${serializeTuple(value)} }`);
            } else {
                items.push(`${key}: ${value}`);
            }
        }
        return items.join(", ");
    }
    function ok(val) {
        return `(ok ${val})`;
    }
    types.ok = ok;
    function err(val) {
        return `(err ${val})`;
    }
    types.err = err;
    function some(val) {
        return `(some ${val})`;
    }
    types.some = some;
    function none() {
        return `none`;
    }
    types.none = none;
    function bool(val) {
        return `${val}`;
    }
    types.bool = bool;
    function int(val) {
        return `${val}`;
    }
    types.int = int;
    function uint(val) {
        return `u${val}`;
    }
    types.uint = uint;
    function ascii(val) {
        return JSON.stringify(val);
    }
    types.ascii = ascii;
    function utf8(val) {
        return `u${JSON.stringify(val)}`;
    }
    types.utf8 = utf8;
    function buff(val) {
        const buff = typeof val == "string" ? new TextEncoder().encode(val) : new Uint8Array(val);
        const hexOctets = new Array(buff.length);
        for(let i = 0; i < buff.length; ++i){
            hexOctets[i] = byteToHex[buff[i]];
        }
        return `0x${hexOctets.join("")}`;
    }
    types.buff = buff;
    function list(val) {
        return `(list ${val.join(" ")})`;
    }
    types.list = list;
    function principal(val) {
        return `'${val}`;
    }
    types.principal = principal;
    function tuple(val) {
        return `{ ${serializeTuple(val)} }`;
    }
    types.tuple = tuple;
})(types || (types = {}));
// deno-lint-ignore ban-types
function consume(src, expectation, wrapped) {
    let dst = (" " + src).slice(1);
    let size = expectation.length;
    if (!wrapped && src !== expectation) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    if (wrapped) {
        size += 2;
    }
    if (dst.length < size) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    if (wrapped) {
        dst = dst.substring(1, dst.length - 1);
    }
    const res = dst.slice(0, expectation.length);
    if (res !== expectation) {
        throw new Error(`Expected ${green(expectation.toString())}, got ${red(src.toString())}`);
    }
    let leftPad = 0;
    if (dst.charAt(expectation.length) === " ") {
        leftPad = 1;
    }
    const remainder = dst.substring(expectation.length + leftPad);
    return remainder;
}
String.prototype.expectOk = function() {
    return consume(this, "ok", true);
};
String.prototype.expectErr = function() {
    return consume(this, "err", true);
};
String.prototype.expectSome = function() {
    return consume(this, "some", true);
};
String.prototype.expectNone = function() {
    return consume(this, "none", false);
};
String.prototype.expectBool = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectUint = function(value) {
    try {
        consume(this, `u${value}`, false);
    } catch (error) {
        throw error;
    }
    return BigInt(value);
};
String.prototype.expectInt = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return BigInt(value);
};
String.prototype.expectBuff = function(value) {
    const buffer = types.buff(value);
    if (this !== buffer) {
        throw new Error(`Expected ${green(buffer)}, got ${red(this.toString())}`);
    }
    return value;
};
String.prototype.expectAscii = function(value) {
    try {
        consume(this, `"${value}"`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectUtf8 = function(value) {
    try {
        consume(this, `u"${value}"`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectPrincipal = function(value) {
    try {
        consume(this, `${value}`, false);
    } catch (error) {
        throw error;
    }
    return value;
};
String.prototype.expectList = function() {
    if (this.charAt(0) !== "[" || this.charAt(this.length - 1) !== "]") {
        throw new Error(`Expected ${green("(list ...)")}, got ${red(this.toString())}`);
    }
    const stack = [];
    const elements = [];
    let start = 1;
    for(let i = 0; i < this.length; i++){
        if (this.charAt(i) === "," && stack.length == 1) {
            elements.push(this.substring(start, i));
            start = i + 2;
        }
        if ([
            "(",
            "[",
            "{"
        ].includes(this.charAt(i))) {
            stack.push(this.charAt(i));
        }
        if (this.charAt(i) === ")" && stack[stack.length - 1] === "(") {
            stack.pop();
        }
        if (this.charAt(i) === "}" && stack[stack.length - 1] === "{") {
            stack.pop();
        }
        if (this.charAt(i) === "]" && stack[stack.length - 1] === "[") {
            stack.pop();
        }
    }
    const remainder = this.substring(start, this.length - 1);
    if (remainder.length > 0) {
        elements.push(remainder);
    }
    return elements;
};
String.prototype.expectTuple = function() {
    if (this.charAt(0) !== "{" || this.charAt(this.length - 1) !== "}") {
        throw new Error(`Expected ${green("(tuple ...)")}, got ${red(this.toString())}`);
    }
    let start = 1;
    const stack = [];
    const elements = [];
    for(let i = 0; i < this.length; i++){
        if (this.charAt(i) === "," && stack.length == 1) {
            elements.push(this.substring(start, i));
            start = i + 2;
        }
        if ([
            "(",
            "[",
            "{"
        ].includes(this.charAt(i))) {
            stack.push(this.charAt(i));
        }
        if (this.charAt(i) === ")" && stack[stack.length - 1] === "(") {
            stack.pop();
        }
        if (this.charAt(i) === "}" && stack[stack.length - 1] === "{") {
            stack.pop();
        }
        if (this.charAt(i) === "]" && stack[stack.length - 1] === "[") {
            stack.pop();
        }
    }
    const remainder = this.substring(start, this.length - 1);
    if (remainder.length > 0) {
        elements.push(remainder);
    }
    const tuple = {};
    for (const element of elements){
        for(let i1 = 0; i1 < element.length; i1++){
            if (element.charAt(i1) === ":") {
                const key = element.substring(0, i1).trim();
                const value = element.substring(i1 + 2).trim();
                tuple[key] = value;
                break;
            }
        }
    }
    return tuple;
};
Array.prototype.expectSTXTransferEvent = function(amount, sender, recipient) {
    for (const event of this){
        try {
            const { stx_transfer_event  } = event;
            return {
                amount: stx_transfer_event.amount.expectInt(amount),
                sender: stx_transfer_event.sender.expectPrincipal(sender),
                recipient: stx_transfer_event.recipient.expectPrincipal(recipient)
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected STXTransferEvent");
};
Array.prototype.expectSTXBurnEvent = function(amount, sender) {
    for (const event of this){
        try {
            const { stx_burn_event  } = event;
            return {
                amount: stx_burn_event.amount.expectInt(amount),
                sender: stx_burn_event.sender.expectPrincipal(sender)
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected STXBurnEvent");
};
Array.prototype.expectFungibleTokenTransferEvent = function(amount, sender, recipient, assetId) {
    for (const event of this){
        try {
            const { ft_transfer_event  } = event;
            if (!ft_transfer_event.asset_identifier.endsWith(assetId)) continue;
            return {
                amount: ft_transfer_event.amount.expectInt(amount),
                sender: ft_transfer_event.sender.expectPrincipal(sender),
                recipient: ft_transfer_event.recipient.expectPrincipal(recipient),
                assetId: ft_transfer_event.asset_identifier
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error(`Unable to retrieve expected FungibleTokenTransferEvent(${amount}, ${sender}, ${recipient}, ${assetId})\n${JSON.stringify(this)}`);
};
Array.prototype.expectFungibleTokenMintEvent = function(amount, recipient, assetId) {
    for (const event of this){
        try {
            const { ft_mint_event  } = event;
            if (!ft_mint_event.asset_identifier.endsWith(assetId)) continue;
            return {
                amount: ft_mint_event.amount.expectInt(amount),
                recipient: ft_mint_event.recipient.expectPrincipal(recipient),
                assetId: ft_mint_event.asset_identifier
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected FungibleTokenMintEvent");
};
Array.prototype.expectFungibleTokenBurnEvent = function(amount, sender, assetId) {
    for (const event of this){
        try {
            const { ft_burn_event  } = event;
            if (!ft_burn_event.asset_identifier.endsWith(assetId)) continue;
            return {
                amount: ft_burn_event.amount.expectInt(amount),
                sender: ft_burn_event.sender.expectPrincipal(sender),
                assetId: ft_burn_event.asset_identifier
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected FungibleTokenBurnEvent");
};
Array.prototype.expectPrintEvent = function(contractIdentifier, value) {
    for (const event of this){
        try {
            const { contract_event  } = event;
            if (!contract_event.topic.endsWith("print")) continue;
            if (!contract_event.value.endsWith(value)) continue;
            return {
                contract_identifier: contract_event.contract_identifier.expectPrincipal(contractIdentifier),
                topic: contract_event.topic,
                value: contract_event.value
            };
        } catch (error) {
            console.warn(error);
            continue;
        }
    }
    throw new Error("Unable to retrieve expected PrintEvent");
};
Array.prototype.expectNonFungibleTokenTransferEvent = function(tokenId, sender, recipient, assetAddress, assetId) {
    for (const event of this){
        try {
            const { nft_transfer_event  } = event;
            if (nft_transfer_event.value !== tokenId) continue;
            if (nft_transfer_event.asset_identifier !== `${assetAddress}::${assetId}`) continue;
            return {
                tokenId: nft_transfer_event.value,
                sender: nft_transfer_event.sender.expectPrincipal(sender),
                recipient: nft_transfer_event.recipient.expectPrincipal(recipient),
                assetId: nft_transfer_event.asset_identifier
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected NonFungibleTokenTransferEvent");
};
Array.prototype.expectNonFungibleTokenMintEvent = function(tokenId, recipient, assetAddress, assetId) {
    for (const event of this){
        try {
            const { nft_mint_event  } = event;
            if (nft_mint_event.value !== tokenId) continue;
            if (nft_mint_event.asset_identifier !== `${assetAddress}::${assetId}`) continue;
            return {
                tokenId: nft_mint_event.value,
                recipient: nft_mint_event.recipient.expectPrincipal(recipient),
                assetId: nft_mint_event.asset_identifier
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected NonFungibleTokenMintEvent");
};
Array.prototype.expectNonFungibleTokenBurnEvent = function(tokenId, sender, assetAddress, assetId) {
    for (const event of this){
        try {
            if (event.nft_burn_event.value !== tokenId) continue;
            if (event.nft_burn_event.asset_identifier !== `${assetAddress}::${assetId}`) continue;
            return {
                assetId: event.nft_burn_event.asset_identifier,
                tokenId: event.nft_burn_event.value,
                sender: event.nft_burn_event.sender.expectPrincipal(sender)
            };
        } catch (_error) {
            continue;
        }
    }
    throw new Error("Unable to retrieve expected NonFungibleTokenBurnEvent");
};
const noColor = Deno.noColor ?? true;
const enabled = !noColor;
function code(open, close) {
    return {
        open: `\x1b[${open.join(";")}m`,
        close: `\x1b[${close}m`,
        regexp: new RegExp(`\\x1b\\[${close}m`, "g")
    };
}
function run(str, code) {
    return enabled ? `${code.open}${str.replace(code.regexp, code.open)}${code.close}` : str;
}
export function red(str) {
    return run(str, code([
        31
    ], 39));
}
export function green(str) {
    return run(str, code([
        32
    ], 39));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMy4wL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBiYW4tdHMtY29tbWVudCBuby1uYW1lc3BhY2VcblxuaW1wb3J0IHtcbiAgRXhwZWN0RnVuZ2libGVUb2tlbkJ1cm5FdmVudCxcbiAgRXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudCxcbiAgRXhwZWN0RnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5NaW50RXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50LFxuICBFeHBlY3RQcmludEV2ZW50LFxuICBFeHBlY3RTVFhUcmFuc2ZlckV2ZW50LFxuICBFeHBlY3RTVFhCdXJuRXZlbnQsXG59IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCBjbGFzcyBUeCB7XG4gIHR5cGU6IG51bWJlcjtcbiAgc2VuZGVyOiBzdHJpbmc7XG4gIGNvbnRyYWN0Q2FsbD86IFR4Q29udHJhY3RDYWxsO1xuICB0cmFuc2ZlclN0eD86IFR4VHJhbnNmZXI7XG4gIGRlcGxveUNvbnRyYWN0PzogVHhEZXBsb3lDb250cmFjdDtcblxuICBjb25zdHJ1Y3Rvcih0eXBlOiBudW1iZXIsIHNlbmRlcjogc3RyaW5nKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNlbmRlciA9IHNlbmRlcjtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2ZlclNUWChhbW91bnQ6IG51bWJlciwgcmVjaXBpZW50OiBzdHJpbmcsIHNlbmRlcjogc3RyaW5nKSB7XG4gICAgY29uc3QgdHggPSBuZXcgVHgoMSwgc2VuZGVyKTtcbiAgICB0eC50cmFuc2ZlclN0eCA9IHtcbiAgICAgIHJlY2lwaWVudCxcbiAgICAgIGFtb3VudCxcbiAgICB9O1xuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHN0YXRpYyBjb250cmFjdENhbGwoXG4gICAgY29udHJhY3Q6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmdzOiBBcnJheTxzdHJpbmc+LFxuICAgIHNlbmRlcjogc3RyaW5nXG4gICkge1xuICAgIGNvbnN0IHR4ID0gbmV3IFR4KDIsIHNlbmRlcik7XG4gICAgdHguY29udHJhY3RDYWxsID0ge1xuICAgICAgY29udHJhY3QsXG4gICAgICBtZXRob2QsXG4gICAgICBhcmdzLFxuICAgIH07XG4gICAgcmV0dXJuIHR4O1xuICB9XG5cbiAgc3RhdGljIGRlcGxveUNvbnRyYWN0KG5hbWU6IHN0cmluZywgY29kZTogc3RyaW5nLCBzZW5kZXI6IHN0cmluZykge1xuICAgIGNvbnN0IHR4ID0gbmV3IFR4KDMsIHNlbmRlcik7XG4gICAgdHguZGVwbG95Q29udHJhY3QgPSB7XG4gICAgICBuYW1lLFxuICAgICAgY29kZSxcbiAgICB9O1xuICAgIHJldHVybiB0eDtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4Q29udHJhY3RDYWxsIHtcbiAgY29udHJhY3Q6IHN0cmluZztcbiAgbWV0aG9kOiBzdHJpbmc7XG4gIGFyZ3M6IEFycmF5PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHhEZXBsb3lDb250cmFjdCB7XG4gIGNvZGU6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4VHJhbnNmZXIge1xuICBhbW91bnQ6IG51bWJlcjtcbiAgcmVjaXBpZW50OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHhSZWNlaXB0IHtcbiAgcmVzdWx0OiBzdHJpbmc7XG4gIGV2ZW50czogQXJyYXk8dW5rbm93bj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmxvY2sge1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgcmVjZWlwdHM6IEFycmF5PFR4UmVjZWlwdD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWNjb3VudCB7XG4gIGFkZHJlc3M6IHN0cmluZztcbiAgYmFsYW5jZTogbnVtYmVyO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhaW4ge1xuICBzZXNzaW9uSWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZWFkT25seUZuIHtcbiAgc2Vzc2lvbl9pZDogbnVtYmVyO1xuICByZXN1bHQ6IHN0cmluZztcbiAgZXZlbnRzOiBBcnJheTx1bmtub3duPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbXB0eUJsb2NrIHtcbiAgc2Vzc2lvbl9pZDogbnVtYmVyO1xuICBibG9ja19oZWlnaHQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3NldHNNYXBzIHtcbiAgc2Vzc2lvbl9pZDogbnVtYmVyO1xuICBhc3NldHM6IHtcbiAgICBbbmFtZTogc3RyaW5nXToge1xuICAgICAgW293bmVyOiBzdHJpbmddOiBudW1iZXI7XG4gICAgfTtcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIENoYWluIHtcbiAgc2Vzc2lvbklkOiBudW1iZXI7XG4gIGJsb2NrSGVpZ2h0ID0gMTtcblxuICBjb25zdHJ1Y3RvcihzZXNzaW9uSWQ6IG51bWJlcikge1xuICAgIHRoaXMuc2Vzc2lvbklkID0gc2Vzc2lvbklkO1xuICB9XG5cbiAgbWluZUJsb2NrKHRyYW5zYWN0aW9uczogQXJyYXk8VHg+KTogQmxvY2sge1xuICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL21pbmVfYmxvY2tcIiwge1xuICAgICAgICBzZXNzaW9uSWQ6IHRoaXMuc2Vzc2lvbklkLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IHRyYW5zYWN0aW9ucyxcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLmJsb2NrSGVpZ2h0ID0gcmVzdWx0LmJsb2NrX2hlaWdodDtcbiAgICBjb25zdCBibG9jazogQmxvY2sgPSB7XG4gICAgICBoZWlnaHQ6IHJlc3VsdC5ibG9ja19oZWlnaHQsXG4gICAgICByZWNlaXB0czogcmVzdWx0LnJlY2VpcHRzLFxuICAgIH07XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG5cbiAgbWluZUVtcHR5QmxvY2soY291bnQ6IG51bWJlcik6IEVtcHR5QmxvY2sge1xuICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL21pbmVfZW1wdHlfYmxvY2tzXCIsIHtcbiAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgY291bnQ6IGNvdW50LFxuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMuYmxvY2tIZWlnaHQgPSByZXN1bHQuYmxvY2tfaGVpZ2h0O1xuICAgIGNvbnN0IGVtcHR5QmxvY2s6IEVtcHR5QmxvY2sgPSB7XG4gICAgICBzZXNzaW9uX2lkOiByZXN1bHQuc2Vzc2lvbl9pZCxcbiAgICAgIGJsb2NrX2hlaWdodDogcmVzdWx0LmJsb2NrX2hlaWdodCxcbiAgICB9O1xuICAgIHJldHVybiBlbXB0eUJsb2NrO1xuICB9XG5cbiAgbWluZUVtcHR5QmxvY2tVbnRpbCh0YXJnZXRCbG9ja0hlaWdodDogbnVtYmVyKTogRW1wdHlCbG9jayB7XG4gICAgY29uc3QgY291bnQgPSB0YXJnZXRCbG9ja0hlaWdodCAtIHRoaXMuYmxvY2tIZWlnaHQ7XG4gICAgaWYgKGNvdW50IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ2hhaW4gdGlwIGNhbm5vdCBiZSBtb3ZlZCBmcm9tICR7dGhpcy5ibG9ja0hlaWdodH0gdG8gJHt0YXJnZXRCbG9ja0hlaWdodH1gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5taW5lRW1wdHlCbG9jayhjb3VudCk7XG4gIH1cblxuICBjYWxsUmVhZE9ubHlGbihcbiAgICBjb250cmFjdDogc3RyaW5nLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIGFyZ3M6IEFycmF5PHVua25vd24+LFxuICAgIHNlbmRlcjogc3RyaW5nXG4gICk6IFJlYWRPbmx5Rm4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL2NhbGxfcmVhZF9vbmx5X2ZuXCIsIHtcbiAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgY29udHJhY3Q6IGNvbnRyYWN0LFxuICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgYXJnczogYXJncyxcbiAgICAgICAgc2VuZGVyOiBzZW5kZXIsXG4gICAgICB9KVxuICAgICk7XG4gICAgY29uc3QgcmVhZE9ubHlGbjogUmVhZE9ubHlGbiA9IHtcbiAgICAgIHNlc3Npb25faWQ6IHJlc3VsdC5zZXNzaW9uX2lkLFxuICAgICAgcmVzdWx0OiByZXN1bHQucmVzdWx0LFxuICAgICAgZXZlbnRzOiByZXN1bHQuZXZlbnRzLFxuICAgIH07XG4gICAgcmV0dXJuIHJlYWRPbmx5Rm47XG4gIH1cblxuICBnZXRBc3NldHNNYXBzKCk6IEFzc2V0c01hcHMge1xuICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL2dldF9hc3NldHNfbWFwc1wiLCB7XG4gICAgICAgIHNlc3Npb25JZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICB9KVxuICAgICk7XG4gICAgY29uc3QgYXNzZXRzTWFwczogQXNzZXRzTWFwcyA9IHtcbiAgICAgIHNlc3Npb25faWQ6IHJlc3VsdC5zZXNzaW9uX2lkLFxuICAgICAgYXNzZXRzOiByZXN1bHQuYXNzZXRzLFxuICAgIH07XG4gICAgcmV0dXJuIGFzc2V0c01hcHM7XG4gIH1cbn1cblxudHlwZSBQcmVEZXBsb3ltZW50RnVuY3Rpb24gPSAoXG4gIGNoYWluOiBDaGFpbixcbiAgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+XG4pID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuXG50eXBlIFRlc3RGdW5jdGlvbiA9IChcbiAgY2hhaW46IENoYWluLFxuICBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4sXG4gIGNvbnRyYWN0czogTWFwPHN0cmluZywgQ29udHJhY3Q+XG4pID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+O1xuXG5pbnRlcmZhY2UgVW5pdFRlc3RPcHRpb25zIHtcbiAgbmFtZTogc3RyaW5nO1xuICBvbmx5PzogdHJ1ZTtcbiAgaWdub3JlPzogdHJ1ZTtcbiAgZGVwbG95bWVudFBhdGg/OiBzdHJpbmc7XG4gIHByZURlcGxveW1lbnQ/OiBQcmVEZXBsb3ltZW50RnVuY3Rpb247XG4gIGZuOiBUZXN0RnVuY3Rpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29udHJhY3Qge1xuICBjb250cmFjdF9pZDogc3RyaW5nO1xuICBzb3VyY2U6IHN0cmluZztcbiAgY29udHJhY3RfaW50ZXJmYWNlOiB1bmtub3duO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YWNrc05vZGUge1xuICB1cmw6IHN0cmluZztcbn1cblxudHlwZSBTY3JpcHRGdW5jdGlvbiA9IChcbiAgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+LFxuICBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PixcbiAgbm9kZTogU3RhY2tzTm9kZVxuKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcblxuaW50ZXJmYWNlIFNjcmlwdE9wdGlvbnMge1xuICBmbjogU2NyaXB0RnVuY3Rpb247XG59XG5cbmV4cG9ydCBjbGFzcyBDbGFyaW5ldCB7XG4gIHN0YXRpYyB0ZXN0KG9wdGlvbnM6IFVuaXRUZXN0T3B0aW9ucykge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBEZW5vLnRlc3Qoe1xuICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgb25seTogb3B0aW9ucy5vbmx5LFxuICAgICAgaWdub3JlOiBvcHRpb25zLmlnbm9yZSxcbiAgICAgIGFzeW5jIGZuKCkge1xuICAgICAgICBjb25zdCBoYXNQcmVEZXBsb3ltZW50U3RlcHMgPSBvcHRpb25zLnByZURlcGxveW1lbnQgIT09IHVuZGVmaW5lZDtcblxuICAgICAgICBsZXQgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9uZXdfc2Vzc2lvblwiLCB7XG4gICAgICAgICAgICBuYW1lOiBvcHRpb25zLm5hbWUsXG4gICAgICAgICAgICBsb2FkRGVwbG95bWVudDogIWhhc1ByZURlcGxveW1lbnRTdGVwcyxcbiAgICAgICAgICAgIGRlcGxveW1lbnRQYXRoOiBvcHRpb25zLmRlcGxveW1lbnRQYXRoLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMucHJlRGVwbG95bWVudCkge1xuICAgICAgICAgIGNvbnN0IGNoYWluID0gbmV3IENoYWluKHJlc3VsdC5zZXNzaW9uX2lkKTtcbiAgICAgICAgICBjb25zdCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4gPSBuZXcgTWFwKCk7XG4gICAgICAgICAgZm9yIChjb25zdCBhY2NvdW50IG9mIHJlc3VsdC5hY2NvdW50cykge1xuICAgICAgICAgICAgYWNjb3VudHMuc2V0KGFjY291bnQubmFtZSwgYWNjb3VudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IG9wdGlvbnMucHJlRGVwbG95bWVudChjaGFpbiwgYWNjb3VudHMpO1xuXG4gICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvbG9hZF9kZXBsb3ltZW50XCIsIHtcbiAgICAgICAgICAgICAgc2Vzc2lvbklkOiBjaGFpbi5zZXNzaW9uSWQsXG4gICAgICAgICAgICAgIGRlcGxveW1lbnRQYXRoOiBvcHRpb25zLmRlcGxveW1lbnRQYXRoLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2hhaW4gPSBuZXcgQ2hhaW4ocmVzdWx0LnNlc3Npb25faWQpO1xuICAgICAgICBjb25zdCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4gPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiByZXN1bHQuYWNjb3VudHMpIHtcbiAgICAgICAgICBhY2NvdW50cy5zZXQoYWNjb3VudC5uYW1lLCBhY2NvdW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiByZXN1bHQuY29udHJhY3RzKSB7XG4gICAgICAgICAgY29udHJhY3RzLnNldChjb250cmFjdC5jb250cmFjdF9pZCwgY29udHJhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IG9wdGlvbnMuZm4oY2hhaW4sIGFjY291bnRzLCBjb250cmFjdHMpO1xuXG4gICAgICAgIEpTT04ucGFyc2UoXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvdGVybWluYXRlX3Nlc3Npb25cIiwge1xuICAgICAgICAgICAgc2Vzc2lvbklkOiBjaGFpbi5zZXNzaW9uSWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgcnVuKG9wdGlvbnM6IFNjcmlwdE9wdGlvbnMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgRGVuby50ZXN0KHtcbiAgICAgIG5hbWU6IFwicnVubmluZyBzY3JpcHRcIixcbiAgICAgIGFzeW5jIGZuKCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL25ld19zZXNzaW9uXCIsIHtcbiAgICAgICAgICAgIG5hbWU6IFwicnVubmluZyBzY3JpcHRcIixcbiAgICAgICAgICAgIGxvYWREZXBsb3ltZW50OiB0cnVlLFxuICAgICAgICAgICAgZGVwbG95bWVudFBhdGg6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBhY2NvdW50czogTWFwPHN0cmluZywgQWNjb3VudD4gPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiByZXN1bHQuYWNjb3VudHMpIHtcbiAgICAgICAgICBhY2NvdW50cy5zZXQoYWNjb3VudC5uYW1lLCBhY2NvdW50KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PiA9IG5ldyBNYXAoKTtcbiAgICAgICAgZm9yIChjb25zdCBjb250cmFjdCBvZiByZXN1bHQuY29udHJhY3RzKSB7XG4gICAgICAgICAgY29udHJhY3RzLnNldChjb250cmFjdC5jb250cmFjdF9pZCwgY29udHJhY3QpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YWNrc19ub2RlOiBTdGFja3NOb2RlID0ge1xuICAgICAgICAgIHVybDogcmVzdWx0LnN0YWNrc19ub2RlX3VybCxcbiAgICAgICAgfTtcbiAgICAgICAgYXdhaXQgb3B0aW9ucy5mbihhY2NvdW50cywgY29udHJhY3RzLCBzdGFja3Nfbm9kZSk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgdHlwZXMge1xuICBjb25zdCBieXRlVG9IZXg6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IG4gPSAwOyBuIDw9IDB4ZmY7ICsrbikge1xuICAgIGNvbnN0IGhleE9jdGV0ID0gbi50b1N0cmluZygxNikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICAgIGJ5dGVUb0hleC5wdXNoKGhleE9jdGV0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZVR1cGxlKGlucHV0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIGNvbnN0IGl0ZW1zOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoaW5wdXQpKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHVwbGUgdmFsdWUgY2FuJ3QgYmUgYW4gYXJyYXlcIik7XG4gICAgICB9IGVsc2UgaWYgKCEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGl0ZW1zLnB1c2goXG4gICAgICAgICAgYCR7a2V5fTogeyAke3NlcmlhbGl6ZVR1cGxlKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KX0gfWBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1zLnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1zLmpvaW4oXCIsIFwiKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBvayh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBgKG9rICR7dmFsfSlgO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGVycih2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBgKGVyciAke3ZhbH0pYDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBzb21lKHZhbDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGAoc29tZSAke3ZhbH0pYDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBub25lKCkge1xuICAgIHJldHVybiBgbm9uZWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gYm9vbCh2YWw6IGJvb2xlYW4pIHtcbiAgICByZXR1cm4gYCR7dmFsfWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gaW50KHZhbDogbnVtYmVyIHwgYmlnaW50KSB7XG4gICAgcmV0dXJuIGAke3ZhbH1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHVpbnQodmFsOiBudW1iZXIgfCBiaWdpbnQpIHtcbiAgICByZXR1cm4gYHUke3ZhbH1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGFzY2lpKHZhbDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gdXRmOCh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBgdSR7SlNPTi5zdHJpbmdpZnkodmFsKX1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGJ1ZmYodmFsOiBBcnJheUJ1ZmZlciB8IHN0cmluZykge1xuICAgIGNvbnN0IGJ1ZmYgPVxuICAgICAgdHlwZW9mIHZhbCA9PSBcInN0cmluZ1wiXG4gICAgICAgID8gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHZhbClcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSh2YWwpO1xuXG4gICAgY29uc3QgaGV4T2N0ZXRzID0gbmV3IEFycmF5KGJ1ZmYubGVuZ3RoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnVmZi5sZW5ndGg7ICsraSkge1xuICAgICAgaGV4T2N0ZXRzW2ldID0gYnl0ZVRvSGV4W2J1ZmZbaV1dO1xuICAgIH1cblxuICAgIHJldHVybiBgMHgke2hleE9jdGV0cy5qb2luKFwiXCIpfWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gbGlzdCh2YWw6IEFycmF5PHVua25vd24+KSB7XG4gICAgcmV0dXJuIGAobGlzdCAke3ZhbC5qb2luKFwiIFwiKX0pYDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBwcmluY2lwYWwodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYCcke3ZhbH1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHR1cGxlKHZhbDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICByZXR1cm4gYHsgJHtzZXJpYWxpemVUdXBsZSh2YWwpfSB9YDtcbiAgfVxufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBTdHJpbmcge1xuICAgIGV4cGVjdE9rKCk6IHN0cmluZztcbiAgICBleHBlY3RFcnIoKTogc3RyaW5nO1xuICAgIGV4cGVjdFNvbWUoKTogc3RyaW5nO1xuICAgIGV4cGVjdE5vbmUoKTogdm9pZDtcbiAgICBleHBlY3RCb29sKHZhbHVlOiBib29sZWFuKTogYm9vbGVhbjtcbiAgICBleHBlY3RVaW50KHZhbHVlOiBudW1iZXIgfCBiaWdpbnQpOiBiaWdpbnQ7XG4gICAgZXhwZWN0SW50KHZhbHVlOiBudW1iZXIgfCBiaWdpbnQpOiBiaWdpbnQ7XG4gICAgZXhwZWN0QnVmZih2YWx1ZTogQXJyYXlCdWZmZXIpOiBBcnJheUJ1ZmZlcjtcbiAgICBleHBlY3RBc2NpaSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nO1xuICAgIGV4cGVjdFV0ZjgodmFsdWU6IHN0cmluZyk6IHN0cmluZztcbiAgICBleHBlY3RQcmluY2lwYWwodmFsdWU6IHN0cmluZyk6IHN0cmluZztcbiAgICBleHBlY3RMaXN0KCk6IEFycmF5PHN0cmluZz47XG4gICAgZXhwZWN0VHVwbGUoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgfVxuXG4gIGludGVyZmFjZSBBcnJheTxUPiB7XG4gICAgZXhwZWN0U1RYVHJhbnNmZXJFdmVudChcbiAgICAgIGFtb3VudDogbnVtYmVyIHwgYmlnaW50LFxuICAgICAgc2VuZGVyOiBzdHJpbmcsXG4gICAgICByZWNpcGllbnQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdFNUWFRyYW5zZmVyRXZlbnQ7XG4gICAgZXhwZWN0U1RYQnVybkV2ZW50KFxuICAgICAgYW1vdW50OiBudW1iZXIgfCBiaWdpbnQsXG4gICAgICBzZW5kZXI6IFN0cmluZ1xuICAgICk6IEV4cGVjdFNUWEJ1cm5FdmVudDtcbiAgICBleHBlY3RGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudChcbiAgICAgIGFtb3VudDogbnVtYmVyIHwgYmlnaW50LFxuICAgICAgc2VuZGVyOiBzdHJpbmcsXG4gICAgICByZWNpcGllbnQ6IHN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdEZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50O1xuICAgIGV4cGVjdEZ1bmdpYmxlVG9rZW5NaW50RXZlbnQoXG4gICAgICBhbW91bnQ6IG51bWJlciB8IGJpZ2ludCxcbiAgICAgIHJlY2lwaWVudDogc3RyaW5nLFxuICAgICAgYXNzZXRJZDogc3RyaW5nXG4gICAgKTogRXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudDtcbiAgICBleHBlY3RGdW5naWJsZVRva2VuQnVybkV2ZW50KFxuICAgICAgYW1vdW50OiBudW1iZXIgfCBiaWdpbnQsXG4gICAgICBzZW5kZXI6IHN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdEZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQ7XG4gICAgZXhwZWN0UHJpbnRFdmVudChcbiAgICAgIGNvbnRyYWN0SWRlbnRpZmllcjogc3RyaW5nLFxuICAgICAgdmFsdWU6IHN0cmluZ1xuICAgICk6IEV4cGVjdFByaW50RXZlbnQ7XG4gICAgZXhwZWN0Tm9uRnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQoXG4gICAgICB0b2tlbklkOiBzdHJpbmcsXG4gICAgICBzZW5kZXI6IHN0cmluZyxcbiAgICAgIHJlY2lwaWVudDogc3RyaW5nLFxuICAgICAgYXNzZXRBZGRyZXNzOiBzdHJpbmcsXG4gICAgICBhc3NldElkOiBzdHJpbmdcbiAgICApOiBFeHBlY3ROb25GdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudDtcbiAgICBleHBlY3ROb25GdW5naWJsZVRva2VuTWludEV2ZW50KFxuICAgICAgdG9rZW5JZDogc3RyaW5nLFxuICAgICAgcmVjaXBpZW50OiBzdHJpbmcsXG4gICAgICBhc3NldEFkZHJlc3M6IHN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5NaW50RXZlbnQ7XG4gICAgZXhwZWN0Tm9uRnVuZ2libGVUb2tlbkJ1cm5FdmVudChcbiAgICAgIHRva2VuSWQ6IHN0cmluZyxcbiAgICAgIHNlbmRlcjogc3RyaW5nLFxuICAgICAgYXNzZXRBZGRyZXNzOiBzdHJpbmcsXG4gICAgICBhc3NldElkOiBzdHJpbmdcbiAgICApOiBFeHBlY3ROb25GdW5naWJsZVRva2VuQnVybkV2ZW50O1xuICB9XG59XG5cbi8vIGRlbm8tbGludC1pZ25vcmUgYmFuLXR5cGVzXG5mdW5jdGlvbiBjb25zdW1lKHNyYzogU3RyaW5nLCBleHBlY3RhdGlvbjogc3RyaW5nLCB3cmFwcGVkOiBib29sZWFuKSB7XG4gIGxldCBkc3QgPSAoXCIgXCIgKyBzcmMpLnNsaWNlKDEpO1xuICBsZXQgc2l6ZSA9IGV4cGVjdGF0aW9uLmxlbmd0aDtcbiAgaWYgKCF3cmFwcGVkICYmIHNyYyAhPT0gZXhwZWN0YXRpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihleHBlY3RhdGlvbi50b1N0cmluZygpKX0sIGdvdCAke3JlZChzcmMudG9TdHJpbmcoKSl9YFxuICAgICk7XG4gIH1cbiAgaWYgKHdyYXBwZWQpIHtcbiAgICBzaXplICs9IDI7XG4gIH1cbiAgaWYgKGRzdC5sZW5ndGggPCBzaXplKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGVkICR7Z3JlZW4oZXhwZWN0YXRpb24udG9TdHJpbmcoKSl9LCBnb3QgJHtyZWQoc3JjLnRvU3RyaW5nKCkpfWBcbiAgICApO1xuICB9XG4gIGlmICh3cmFwcGVkKSB7XG4gICAgZHN0ID0gZHN0LnN1YnN0cmluZygxLCBkc3QubGVuZ3RoIC0gMSk7XG4gIH1cbiAgY29uc3QgcmVzID0gZHN0LnNsaWNlKDAsIGV4cGVjdGF0aW9uLmxlbmd0aCk7XG4gIGlmIChyZXMgIT09IGV4cGVjdGF0aW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGVkICR7Z3JlZW4oZXhwZWN0YXRpb24udG9TdHJpbmcoKSl9LCBnb3QgJHtyZWQoc3JjLnRvU3RyaW5nKCkpfWBcbiAgICApO1xuICB9XG4gIGxldCBsZWZ0UGFkID0gMDtcbiAgaWYgKGRzdC5jaGFyQXQoZXhwZWN0YXRpb24ubGVuZ3RoKSA9PT0gXCIgXCIpIHtcbiAgICBsZWZ0UGFkID0gMTtcbiAgfVxuICBjb25zdCByZW1haW5kZXIgPSBkc3Quc3Vic3RyaW5nKGV4cGVjdGF0aW9uLmxlbmd0aCArIGxlZnRQYWQpO1xuICByZXR1cm4gcmVtYWluZGVyO1xufVxuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdE9rID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29uc3VtZSh0aGlzLCBcIm9rXCIsIHRydWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RFcnIgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwiZXJyXCIsIHRydWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RTb21lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gY29uc3VtZSh0aGlzLCBcInNvbWVcIiwgdHJ1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdE5vbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwibm9uZVwiLCBmYWxzZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEJvb2wgPSBmdW5jdGlvbiAodmFsdWU6IGJvb2xlYW4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGAke3ZhbHVlfWAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFVpbnQgPSBmdW5jdGlvbiAodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludCB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgdSR7dmFsdWV9YCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiBCaWdJbnQodmFsdWUpO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RJbnQgPSBmdW5jdGlvbiAodmFsdWU6IG51bWJlciB8IGJpZ2ludCk6IGJpZ2ludCB7XG4gIHRyeSB7XG4gICAgY29uc3VtZSh0aGlzLCBgJHt2YWx1ZX1gLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIEJpZ0ludCh2YWx1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEJ1ZmYgPSBmdW5jdGlvbiAodmFsdWU6IEFycmF5QnVmZmVyKSB7XG4gIGNvbnN0IGJ1ZmZlciA9IHR5cGVzLmJ1ZmYodmFsdWUpO1xuICBpZiAodGhpcyAhPT0gYnVmZmVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAke2dyZWVuKGJ1ZmZlcil9LCBnb3QgJHtyZWQodGhpcy50b1N0cmluZygpKX1gKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEFzY2lpID0gZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGBcIiR7dmFsdWV9XCJgLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RVdGY4ID0gZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGB1XCIke3ZhbHVlfVwiYCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0UHJpbmNpcGFsID0gZnVuY3Rpb24gKHZhbHVlOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGAke3ZhbHVlfWAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdExpc3QgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNoYXJBdCgwKSAhPT0gXCJbXCIgfHwgdGhpcy5jaGFyQXQodGhpcy5sZW5ndGggLSAxKSAhPT0gXCJdXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihcIihsaXN0IC4uLilcIil9LCBnb3QgJHtyZWQodGhpcy50b1N0cmluZygpKX1gXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHN0YWNrID0gW107XG4gIGNvbnN0IGVsZW1lbnRzID0gW107XG4gIGxldCBzdGFydCA9IDE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCIsXCIgJiYgc3RhY2subGVuZ3RoID09IDEpIHtcbiAgICAgIGVsZW1lbnRzLnB1c2godGhpcy5zdWJzdHJpbmcoc3RhcnQsIGkpKTtcbiAgICAgIHN0YXJ0ID0gaSArIDI7XG4gICAgfVxuICAgIGlmIChbXCIoXCIsIFwiW1wiLCBcIntcIl0uaW5jbHVkZXModGhpcy5jaGFyQXQoaSkpKSB7XG4gICAgICBzdGFjay5wdXNoKHRoaXMuY2hhckF0KGkpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIilcIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCIoXCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwifVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIntcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCJdXCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwiW1wiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgcmVtYWluZGVyID0gdGhpcy5zdWJzdHJpbmcoc3RhcnQsIHRoaXMubGVuZ3RoIC0gMSk7XG4gIGlmIChyZW1haW5kZXIubGVuZ3RoID4gMCkge1xuICAgIGVsZW1lbnRzLnB1c2gocmVtYWluZGVyKTtcbiAgfVxuICByZXR1cm4gZWxlbWVudHM7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFR1cGxlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5jaGFyQXQoMCkgIT09IFwie1wiIHx8IHRoaXMuY2hhckF0KHRoaXMubGVuZ3RoIC0gMSkgIT09IFwifVwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGVkICR7Z3JlZW4oXCIodHVwbGUgLi4uKVwiKX0sIGdvdCAke3JlZCh0aGlzLnRvU3RyaW5nKCkpfWBcbiAgICApO1xuICB9XG5cbiAgbGV0IHN0YXJ0ID0gMTtcbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgY29uc3QgZWxlbWVudHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIixcIiAmJiBzdGFjay5sZW5ndGggPT0gMSkge1xuICAgICAgZWxlbWVudHMucHVzaCh0aGlzLnN1YnN0cmluZyhzdGFydCwgaSkpO1xuICAgICAgc3RhcnQgPSBpICsgMjtcbiAgICB9XG4gICAgaWYgKFtcIihcIiwgXCJbXCIsIFwie1wiXS5pbmNsdWRlcyh0aGlzLmNoYXJBdChpKSkpIHtcbiAgICAgIHN0YWNrLnB1c2godGhpcy5jaGFyQXQoaSkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiKVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIihcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCJ9XCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwie1wiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIl1cIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCJbXCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgfVxuICBjb25zdCByZW1haW5kZXIgPSB0aGlzLnN1YnN0cmluZyhzdGFydCwgdGhpcy5sZW5ndGggLSAxKTtcbiAgaWYgKHJlbWFpbmRlci5sZW5ndGggPiAwKSB7XG4gICAgZWxlbWVudHMucHVzaChyZW1haW5kZXIpO1xuICB9XG5cbiAgY29uc3QgdHVwbGU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgZm9yIChjb25zdCBlbGVtZW50IG9mIGVsZW1lbnRzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoZWxlbWVudC5jaGFyQXQoaSkgPT09IFwiOlwiKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGVsZW1lbnQuc3Vic3RyaW5nKDAsIGkpLnRyaW0oKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBlbGVtZW50LnN1YnN0cmluZyhpICsgMikudHJpbSgpO1xuICAgICAgICB0dXBsZVtrZXldID0gdmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0dXBsZTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3RTVFhUcmFuc2ZlckV2ZW50ID0gZnVuY3Rpb24gKGFtb3VudCwgc2VuZGVyLCByZWNpcGllbnQpIHtcbiAgZm9yIChjb25zdCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgc3R4X3RyYW5zZmVyX2V2ZW50IH0gPSBldmVudDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFtb3VudDogc3R4X3RyYW5zZmVyX2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgc2VuZGVyOiBzdHhfdHJhbnNmZXJfZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgICByZWNpcGllbnQ6IHN0eF90cmFuc2Zlcl9ldmVudC5yZWNpcGllbnQuZXhwZWN0UHJpbmNpcGFsKHJlY2lwaWVudCksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBTVFhUcmFuc2ZlckV2ZW50XCIpO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdFNUWEJ1cm5FdmVudCA9IGZ1bmN0aW9uIChhbW91bnQsIHNlbmRlcikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBzdHhfYnVybl9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IHN0eF9idXJuX2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgc2VuZGVyOiBzdHhfYnVybl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlciksXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBTVFhCdXJuRXZlbnRcIik7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0RnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQgPSBmdW5jdGlvbiAoXG4gIGFtb3VudCxcbiAgc2VuZGVyLFxuICByZWNpcGllbnQsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBmdF90cmFuc2Zlcl9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAoIWZ0X3RyYW5zZmVyX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIuZW5kc1dpdGgoYXNzZXRJZCkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGZ0X3RyYW5zZmVyX2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgc2VuZGVyOiBmdF90cmFuc2Zlcl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlciksXG4gICAgICAgIHJlY2lwaWVudDogZnRfdHJhbnNmZXJfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChyZWNpcGllbnQpLFxuICAgICAgICBhc3NldElkOiBmdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudCgke2Ftb3VudH0sICR7c2VuZGVyfSwgJHtyZWNpcGllbnR9LCAke2Fzc2V0SWR9KVxcbiR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICB0aGlzXG4gICAgKX1gXG4gICk7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudCA9IGZ1bmN0aW9uIChcbiAgYW1vdW50LFxuICByZWNpcGllbnQsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBmdF9taW50X2V2ZW50IH0gPSBldmVudDtcbiAgICAgIGlmICghZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLmVuZHNXaXRoKGFzc2V0SWQpKSBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYW1vdW50OiBmdF9taW50X2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgcmVjaXBpZW50OiBmdF9taW50X2V2ZW50LnJlY2lwaWVudC5leHBlY3RQcmluY2lwYWwocmVjaXBpZW50KSxcbiAgICAgICAgYXNzZXRJZDogZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgRnVuZ2libGVUb2tlbk1pbnRFdmVudFwiKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3RGdW5naWJsZVRva2VuQnVybkV2ZW50ID0gZnVuY3Rpb24gKFxuICBhbW91bnQsXG4gIHNlbmRlcixcbiAgYXNzZXRJZFxuKSB7XG4gIGZvciAoY29uc3QgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGZ0X2J1cm5fZXZlbnQgfSA9IGV2ZW50O1xuICAgICAgaWYgKCFmdF9idXJuX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIuZW5kc1dpdGgoYXNzZXRJZCkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGZ0X2J1cm5fZXZlbnQuYW1vdW50LmV4cGVjdEludChhbW91bnQpLFxuICAgICAgICBzZW5kZXI6IGZ0X2J1cm5fZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgICBhc3NldElkOiBmdF9idXJuX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuQnVybkV2ZW50XCIpO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdFByaW50RXZlbnQgPSBmdW5jdGlvbiAoY29udHJhY3RJZGVudGlmaWVyLCB2YWx1ZSkge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBjb250cmFjdF9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAoIWNvbnRyYWN0X2V2ZW50LnRvcGljLmVuZHNXaXRoKFwicHJpbnRcIikpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFjb250cmFjdF9ldmVudC52YWx1ZS5lbmRzV2l0aCh2YWx1ZSkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250cmFjdF9pZGVudGlmaWVyOlxuICAgICAgICAgIGNvbnRyYWN0X2V2ZW50LmNvbnRyYWN0X2lkZW50aWZpZXIuZXhwZWN0UHJpbmNpcGFsKFxuICAgICAgICAgICAgY29udHJhY3RJZGVudGlmaWVyXG4gICAgICAgICAgKSxcbiAgICAgICAgdG9waWM6IGNvbnRyYWN0X2V2ZW50LnRvcGljLFxuICAgICAgICB2YWx1ZTogY29udHJhY3RfZXZlbnQudmFsdWUsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBQcmludEV2ZW50XCIpO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkLFxuICBzZW5kZXIsXG4gIHJlY2lwaWVudCxcbiAgYXNzZXRBZGRyZXNzLFxuICBhc3NldElkXG4pIHtcbiAgZm9yIChjb25zdCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgbmZ0X3RyYW5zZmVyX2V2ZW50IH0gPSBldmVudDtcbiAgICAgIGlmIChuZnRfdHJhbnNmZXJfZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKG5mdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyICE9PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRva2VuSWQ6IG5mdF90cmFuc2Zlcl9ldmVudC52YWx1ZSxcbiAgICAgICAgc2VuZGVyOiBuZnRfdHJhbnNmZXJfZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgICByZWNpcGllbnQ6IG5mdF90cmFuc2Zlcl9ldmVudC5yZWNpcGllbnQuZXhwZWN0UHJpbmNpcGFsKHJlY2lwaWVudCksXG4gICAgICAgIGFzc2V0SWQ6IG5mdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnRcIik7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0Tm9uRnVuZ2libGVUb2tlbk1pbnRFdmVudCA9IGZ1bmN0aW9uIChcbiAgdG9rZW5JZCxcbiAgcmVjaXBpZW50LFxuICBhc3NldEFkZHJlc3MsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBuZnRfbWludF9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAobmZ0X21pbnRfZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKG5mdF9taW50X2V2ZW50LmFzc2V0X2lkZW50aWZpZXIgIT09IGAke2Fzc2V0QWRkcmVzc306OiR7YXNzZXRJZH1gKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG9rZW5JZDogbmZ0X21pbnRfZXZlbnQudmFsdWUsXG4gICAgICAgIHJlY2lwaWVudDogbmZ0X21pbnRfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChyZWNpcGllbnQpLFxuICAgICAgICBhc3NldElkOiBuZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlbk1pbnRFdmVudFwiKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3ROb25GdW5naWJsZVRva2VuQnVybkV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkLFxuICBzZW5kZXIsXG4gIGFzc2V0QWRkcmVzcyxcbiAgYXNzZXRJZFxuKSB7XG4gIGZvciAoY29uc3QgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBpZiAoZXZlbnQubmZ0X2J1cm5fZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5uZnRfYnVybl9ldmVudC5hc3NldF9pZGVudGlmaWVyICE9PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YFxuICAgICAgKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXNzZXRJZDogZXZlbnQubmZ0X2J1cm5fZXZlbnQuYXNzZXRfaWRlbnRpZmllcixcbiAgICAgICAgdG9rZW5JZDogZXZlbnQubmZ0X2J1cm5fZXZlbnQudmFsdWUsXG4gICAgICAgIHNlbmRlcjogZXZlbnQubmZ0X2J1cm5fZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlbkJ1cm5FdmVudFwiKTtcbn07XG5cbmNvbnN0IG5vQ29sb3IgPSBEZW5vLm5vQ29sb3IgPz8gdHJ1ZTtcbmNvbnN0IGVuYWJsZWQgPSAhbm9Db2xvcjtcblxuaW50ZXJmYWNlIENvZGUge1xuICBvcGVuOiBzdHJpbmc7XG4gIGNsb3NlOiBzdHJpbmc7XG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG5mdW5jdGlvbiBjb2RlKG9wZW46IG51bWJlcltdLCBjbG9zZTogbnVtYmVyKTogQ29kZSB7XG4gIHJldHVybiB7XG4gICAgb3BlbjogYFxceDFiWyR7b3Blbi5qb2luKFwiO1wiKX1tYCxcbiAgICBjbG9zZTogYFxceDFiWyR7Y2xvc2V9bWAsXG4gICAgcmVnZXhwOiBuZXcgUmVnRXhwKGBcXFxceDFiXFxcXFske2Nsb3NlfW1gLCBcImdcIiksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bihzdHI6IHN0cmluZywgY29kZTogQ29kZSk6IHN0cmluZyB7XG4gIHJldHVybiBlbmFibGVkXG4gICAgPyBgJHtjb2RlLm9wZW59JHtzdHIucmVwbGFjZShjb2RlLnJlZ2V4cCwgY29kZS5vcGVuKX0ke2NvZGUuY2xvc2V9YFxuICAgIDogc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMyXSwgMzkpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFjQSxjQUFjLFlBQVksQ0FBQztBQUUzQixPQUFPLE1BQU0sRUFBRTtJQUNiLElBQUksQ0FBUztJQUNiLE1BQU0sQ0FBUztJQUNmLFlBQVksQ0FBa0I7SUFDOUIsV0FBVyxDQUFjO0lBQ3pCLGNBQWMsQ0FBb0I7SUFFbEMsWUFBWSxJQUFZLEVBQUUsTUFBYyxDQUFFO1FBQ3hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3RCO0lBRUQsT0FBTyxXQUFXLENBQUMsTUFBYyxFQUFFLFNBQWlCLEVBQUUsTUFBYyxFQUFFO1FBQ3BFLE1BQU0sRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQUFBQztRQUM3QixFQUFFLENBQUMsV0FBVyxHQUFHO1lBQ2YsU0FBUztZQUNULE1BQU07U0FDUCxDQUFDO1FBQ0YsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUVELE9BQU8sWUFBWSxDQUNqQixRQUFnQixFQUNoQixNQUFjLEVBQ2QsSUFBbUIsRUFDbkIsTUFBYyxFQUNkO1FBQ0EsTUFBTSxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxBQUFDO1FBQzdCLEVBQUUsQ0FBQyxZQUFZLEdBQUc7WUFDaEIsUUFBUTtZQUNSLE1BQU07WUFDTixJQUFJO1NBQ0wsQ0FBQztRQUNGLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFFRCxPQUFPLGNBQWMsQ0FBQyxJQUFZLEVBQUUs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