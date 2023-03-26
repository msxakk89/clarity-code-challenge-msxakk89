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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC42L2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBiYW4tdHMtY29tbWVudCBuby1uYW1lc3BhY2VcblxuaW1wb3J0IHtcbiAgRXhwZWN0RnVuZ2libGVUb2tlbkJ1cm5FdmVudCxcbiAgRXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudCxcbiAgRXhwZWN0RnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5NaW50RXZlbnQsXG4gIEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50LFxuICBFeHBlY3RQcmludEV2ZW50LFxuICBFeHBlY3RTVFhUcmFuc2ZlckV2ZW50LFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgKiBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG5leHBvcnQgY2xhc3MgVHgge1xuICB0eXBlOiBudW1iZXI7XG4gIHNlbmRlcjogc3RyaW5nO1xuICBjb250cmFjdENhbGw/OiBUeENvbnRyYWN0Q2FsbDtcbiAgdHJhbnNmZXJTdHg/OiBUeFRyYW5zZmVyO1xuICBkZXBsb3lDb250cmFjdD86IFR4RGVwbG95Q29udHJhY3Q7XG5cbiAgY29uc3RydWN0b3IodHlwZTogbnVtYmVyLCBzZW5kZXI6IHN0cmluZykge1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5zZW5kZXIgPSBzZW5kZXI7XG4gIH1cblxuICBzdGF0aWMgdHJhbnNmZXJTVFgoYW1vdW50OiBudW1iZXIsIHJlY2lwaWVudDogc3RyaW5nLCBzZW5kZXI6IHN0cmluZykge1xuICAgIGNvbnN0IHR4ID0gbmV3IFR4KDEsIHNlbmRlcik7XG4gICAgdHgudHJhbnNmZXJTdHggPSB7XG4gICAgICByZWNpcGllbnQsXG4gICAgICBhbW91bnQsXG4gICAgfTtcbiAgICByZXR1cm4gdHg7XG4gIH1cblxuICBzdGF0aWMgY29udHJhY3RDYWxsKFxuICAgIGNvbnRyYWN0OiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgYXJnczogQXJyYXk8c3RyaW5nPixcbiAgICBzZW5kZXI6IHN0cmluZ1xuICApIHtcbiAgICBjb25zdCB0eCA9IG5ldyBUeCgyLCBzZW5kZXIpO1xuICAgIHR4LmNvbnRyYWN0Q2FsbCA9IHtcbiAgICAgIGNvbnRyYWN0LFxuICAgICAgbWV0aG9kLFxuICAgICAgYXJncyxcbiAgICB9O1xuICAgIHJldHVybiB0eDtcbiAgfVxuXG4gIHN0YXRpYyBkZXBsb3lDb250cmFjdChuYW1lOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgc2VuZGVyOiBzdHJpbmcpIHtcbiAgICBjb25zdCB0eCA9IG5ldyBUeCgzLCBzZW5kZXIpO1xuICAgIHR4LmRlcGxveUNvbnRyYWN0ID0ge1xuICAgICAgbmFtZSxcbiAgICAgIGNvZGUsXG4gICAgfTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBUeENvbnRyYWN0Q2FsbCB7XG4gIGNvbnRyYWN0OiBzdHJpbmc7XG4gIG1ldGhvZDogc3RyaW5nO1xuICBhcmdzOiBBcnJheTxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4RGVwbG95Q29udHJhY3Qge1xuICBjb2RlOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUeFRyYW5zZmVyIHtcbiAgYW1vdW50OiBudW1iZXI7XG4gIHJlY2lwaWVudDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR4UmVjZWlwdCB7XG4gIHJlc3VsdDogc3RyaW5nO1xuICBldmVudHM6IEFycmF5PHVua25vd24+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJsb2NrIHtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIHJlY2VpcHRzOiBBcnJheTxUeFJlY2VpcHQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFjY291bnQge1xuICBhZGRyZXNzOiBzdHJpbmc7XG4gIGJhbGFuY2U6IG51bWJlcjtcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENoYWluIHtcbiAgc2Vzc2lvbklkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVhZE9ubHlGbiB7XG4gIHNlc3Npb25faWQ6IG51bWJlcjtcbiAgcmVzdWx0OiBzdHJpbmc7XG4gIGV2ZW50czogQXJyYXk8dW5rbm93bj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1wdHlCbG9jayB7XG4gIHNlc3Npb25faWQ6IG51bWJlcjtcbiAgYmxvY2tfaGVpZ2h0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzTWFwcyB7XG4gIHNlc3Npb25faWQ6IG51bWJlcjtcbiAgYXNzZXRzOiB7XG4gICAgW25hbWU6IHN0cmluZ106IHtcbiAgICAgIFtvd25lcjogc3RyaW5nXTogbnVtYmVyO1xuICAgIH07XG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFpbiB7XG4gIHNlc3Npb25JZDogbnVtYmVyO1xuICBibG9ja0hlaWdodCA9IDE7XG5cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbklkOiBudW1iZXIpIHtcbiAgICB0aGlzLnNlc3Npb25JZCA9IHNlc3Npb25JZDtcbiAgfVxuXG4gIG1pbmVCbG9jayh0cmFuc2FjdGlvbnM6IEFycmF5PFR4Pik6IEJsb2NrIHtcbiAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9taW5lX2Jsb2NrXCIsIHtcbiAgICAgICAgc2Vzc2lvbklkOiB0aGlzLnNlc3Npb25JZCxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiB0cmFuc2FjdGlvbnMsXG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5ibG9ja0hlaWdodCA9IHJlc3VsdC5ibG9ja19oZWlnaHQ7XG4gICAgY29uc3QgYmxvY2s6IEJsb2NrID0ge1xuICAgICAgaGVpZ2h0OiByZXN1bHQuYmxvY2tfaGVpZ2h0LFxuICAgICAgcmVjZWlwdHM6IHJlc3VsdC5yZWNlaXB0cyxcbiAgICB9O1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuXG4gIG1pbmVFbXB0eUJsb2NrKGNvdW50OiBudW1iZXIpOiBFbXB0eUJsb2NrIHtcbiAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9taW5lX2VtcHR5X2Jsb2Nrc1wiLCB7XG4gICAgICAgIHNlc3Npb25JZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLmJsb2NrSGVpZ2h0ID0gcmVzdWx0LmJsb2NrX2hlaWdodDtcbiAgICBjb25zdCBlbXB0eUJsb2NrOiBFbXB0eUJsb2NrID0ge1xuICAgICAgc2Vzc2lvbl9pZDogcmVzdWx0LnNlc3Npb25faWQsXG4gICAgICBibG9ja19oZWlnaHQ6IHJlc3VsdC5ibG9ja19oZWlnaHQsXG4gICAgfTtcbiAgICByZXR1cm4gZW1wdHlCbG9jaztcbiAgfVxuXG4gIG1pbmVFbXB0eUJsb2NrVW50aWwodGFyZ2V0QmxvY2tIZWlnaHQ6IG51bWJlcik6IEVtcHR5QmxvY2sge1xuICAgIGNvbnN0IGNvdW50ID0gdGFyZ2V0QmxvY2tIZWlnaHQgLSB0aGlzLmJsb2NrSGVpZ2h0O1xuICAgIGlmIChjb3VudCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENoYWluIHRpcCBjYW5ub3QgYmUgbW92ZWQgZnJvbSAke3RoaXMuYmxvY2tIZWlnaHR9IHRvICR7dGFyZ2V0QmxvY2tIZWlnaHR9YFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWluZUVtcHR5QmxvY2soY291bnQpO1xuICB9XG5cbiAgY2FsbFJlYWRPbmx5Rm4oXG4gICAgY29udHJhY3Q6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmdzOiBBcnJheTx1bmtub3duPixcbiAgICBzZW5kZXI6IHN0cmluZ1xuICApOiBSZWFkT25seUZuIHtcbiAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9jYWxsX3JlYWRfb25seV9mblwiLCB7XG4gICAgICAgIHNlc3Npb25JZDogdGhpcy5zZXNzaW9uSWQsXG4gICAgICAgIGNvbnRyYWN0OiBjb250cmFjdCxcbiAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICAgIHNlbmRlcjogc2VuZGVyLFxuICAgICAgfSlcbiAgICApO1xuICAgIGNvbnN0IHJlYWRPbmx5Rm46IFJlYWRPbmx5Rm4gPSB7XG4gICAgICBzZXNzaW9uX2lkOiByZXN1bHQuc2Vzc2lvbl9pZCxcbiAgICAgIHJlc3VsdDogcmVzdWx0LnJlc3VsdCxcbiAgICAgIGV2ZW50czogcmVzdWx0LmV2ZW50cyxcbiAgICB9O1xuICAgIHJldHVybiByZWFkT25seUZuO1xuICB9XG5cbiAgZ2V0QXNzZXRzTWFwcygpOiBBc3NldHNNYXBzIHtcbiAgICBjb25zdCByZXN1bHQgPSBKU09OLnBhcnNlKFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9nZXRfYXNzZXRzX21hcHNcIiwge1xuICAgICAgICBzZXNzaW9uSWQ6IHRoaXMuc2Vzc2lvbklkLFxuICAgICAgfSlcbiAgICApO1xuICAgIGNvbnN0IGFzc2V0c01hcHM6IEFzc2V0c01hcHMgPSB7XG4gICAgICBzZXNzaW9uX2lkOiByZXN1bHQuc2Vzc2lvbl9pZCxcbiAgICAgIGFzc2V0czogcmVzdWx0LmFzc2V0cyxcbiAgICB9O1xuICAgIHJldHVybiBhc3NldHNNYXBzO1xuICB9XG59XG5cbnR5cGUgUHJlRGVwbG95bWVudEZ1bmN0aW9uID0gKFxuICBjaGFpbjogQ2hhaW4sXG4gIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PlxuKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcblxudHlwZSBUZXN0RnVuY3Rpb24gPSAoXG4gIGNoYWluOiBDaGFpbixcbiAgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+LFxuICBjb250cmFjdHM6IE1hcDxzdHJpbmcsIENvbnRyYWN0PlxuKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcblxuaW50ZXJmYWNlIFVuaXRUZXN0T3B0aW9ucyB7XG4gIG5hbWU6IHN0cmluZztcbiAgb25seT86IHRydWU7XG4gIGlnbm9yZT86IHRydWU7XG4gIGRlcGxveW1lbnRQYXRoPzogc3RyaW5nO1xuICBwcmVEZXBsb3ltZW50PzogUHJlRGVwbG95bWVudEZ1bmN0aW9uO1xuICBmbjogVGVzdEZ1bmN0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnRyYWN0IHtcbiAgY29udHJhY3RfaWQ6IHN0cmluZztcbiAgc291cmNlOiBzdHJpbmc7XG4gIGNvbnRyYWN0X2ludGVyZmFjZTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGFja3NOb2RlIHtcbiAgdXJsOiBzdHJpbmc7XG59XG5cbnR5cGUgU2NyaXB0RnVuY3Rpb24gPSAoXG4gIGFjY291bnRzOiBNYXA8c3RyaW5nLCBBY2NvdW50PixcbiAgY29udHJhY3RzOiBNYXA8c3RyaW5nLCBDb250cmFjdD4sXG4gIG5vZGU6IFN0YWNrc05vZGVcbikgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG5cbmludGVyZmFjZSBTY3JpcHRPcHRpb25zIHtcbiAgZm46IFNjcmlwdEZ1bmN0aW9uO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xhcmluZXQge1xuICBzdGF0aWMgdGVzdChvcHRpb25zOiBVbml0VGVzdE9wdGlvbnMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgRGVuby50ZXN0KHtcbiAgICAgIG5hbWU6IG9wdGlvbnMubmFtZSxcbiAgICAgIG9ubHk6IG9wdGlvbnMub25seSxcbiAgICAgIGlnbm9yZTogb3B0aW9ucy5pZ25vcmUsXG4gICAgICBhc3luYyBmbigpIHtcbiAgICAgICAgY29uc3QgaGFzUHJlRGVwbG95bWVudFN0ZXBzID0gb3B0aW9ucy5wcmVEZXBsb3ltZW50ICE9PSB1bmRlZmluZWQ7XG5cbiAgICAgICAgbGV0IHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIERlbm8uY29yZS5vcFN5bmMoXCJhcGkvdjEvbmV3X3Nlc3Npb25cIiwge1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICAgICAgbG9hZERlcGxveW1lbnQ6ICFoYXNQcmVEZXBsb3ltZW50U3RlcHMsXG4gICAgICAgICAgICBkZXBsb3ltZW50UGF0aDogb3B0aW9ucy5kZXBsb3ltZW50UGF0aCxcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnByZURlcGxveW1lbnQpIHtcbiAgICAgICAgICBjb25zdCBjaGFpbiA9IG5ldyBDaGFpbihyZXN1bHQuc2Vzc2lvbl9pZCk7XG4gICAgICAgICAgY29uc3QgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+ID0gbmV3IE1hcCgpO1xuICAgICAgICAgIGZvciAoY29uc3QgYWNjb3VudCBvZiByZXN1bHQuYWNjb3VudHMpIHtcbiAgICAgICAgICAgIGFjY291bnRzLnNldChhY2NvdW50Lm5hbWUsIGFjY291bnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBvcHRpb25zLnByZURlcGxveW1lbnQoY2hhaW4sIGFjY291bnRzKTtcblxuICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL2xvYWRfZGVwbG95bWVudFwiLCB7XG4gICAgICAgICAgICAgIHNlc3Npb25JZDogY2hhaW4uc2Vzc2lvbklkLFxuICAgICAgICAgICAgICBkZXBsb3ltZW50UGF0aDogb3B0aW9ucy5kZXBsb3ltZW50UGF0aCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNoYWluID0gbmV3IENoYWluKHJlc3VsdC5zZXNzaW9uX2lkKTtcbiAgICAgICAgY29uc3QgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+ID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGFjY291bnQgb2YgcmVzdWx0LmFjY291bnRzKSB7XG4gICAgICAgICAgYWNjb3VudHMuc2V0KGFjY291bnQubmFtZSwgYWNjb3VudCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udHJhY3RzOiBNYXA8c3RyaW5nLCBDb250cmFjdD4gPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAoY29uc3QgY29udHJhY3Qgb2YgcmVzdWx0LmNvbnRyYWN0cykge1xuICAgICAgICAgIGNvbnRyYWN0cy5zZXQoY29udHJhY3QuY29udHJhY3RfaWQsIGNvbnRyYWN0KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCBvcHRpb25zLmZuKGNoYWluLCBhY2NvdW50cywgY29udHJhY3RzKTtcblxuICAgICAgICBKU09OLnBhcnNlKFxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBEZW5vLmNvcmUub3BTeW5jKFwiYXBpL3YxL3Rlcm1pbmF0ZV9zZXNzaW9uXCIsIHtcbiAgICAgICAgICAgIHNlc3Npb25JZDogY2hhaW4uc2Vzc2lvbklkLFxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHJ1bihvcHRpb25zOiBTY3JpcHRPcHRpb25zKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIERlbm8udGVzdCh7XG4gICAgICBuYW1lOiBcInJ1bm5pbmcgc2NyaXB0XCIsXG4gICAgICBhc3luYyBmbigpIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gSlNPTi5wYXJzZShcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgRGVuby5jb3JlLm9wU3luYyhcImFwaS92MS9uZXdfc2Vzc2lvblwiLCB7XG4gICAgICAgICAgICBuYW1lOiBcInJ1bm5pbmcgc2NyaXB0XCIsXG4gICAgICAgICAgICBsb2FkRGVwbG95bWVudDogdHJ1ZSxcbiAgICAgICAgICAgIGRlcGxveW1lbnRQYXRoOiB1bmRlZmluZWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgYWNjb3VudHM6IE1hcDxzdHJpbmcsIEFjY291bnQ+ID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGNvbnN0IGFjY291bnQgb2YgcmVzdWx0LmFjY291bnRzKSB7XG4gICAgICAgICAgYWNjb3VudHMuc2V0KGFjY291bnQubmFtZSwgYWNjb3VudCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udHJhY3RzOiBNYXA8c3RyaW5nLCBDb250cmFjdD4gPSBuZXcgTWFwKCk7XG4gICAgICAgIGZvciAoY29uc3QgY29udHJhY3Qgb2YgcmVzdWx0LmNvbnRyYWN0cykge1xuICAgICAgICAgIGNvbnRyYWN0cy5zZXQoY29udHJhY3QuY29udHJhY3RfaWQsIGNvbnRyYWN0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGFja3Nfbm9kZTogU3RhY2tzTm9kZSA9IHtcbiAgICAgICAgICB1cmw6IHJlc3VsdC5zdGFja3Nfbm9kZV91cmwsXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IG9wdGlvbnMuZm4oYWNjb3VudHMsIGNvbnRyYWN0cywgc3RhY2tzX25vZGUpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIHR5cGVzIHtcbiAgY29uc3QgYnl0ZVRvSGV4OiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGxldCBuID0gMDsgbiA8PSAweGZmOyArK24pIHtcbiAgICBjb25zdCBoZXhPY3RldCA9IG4udG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgICBieXRlVG9IZXgucHVzaChoZXhPY3RldCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXJpYWxpemVUdXBsZShpbnB1dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBjb25zdCBpdGVtczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGlucHV0KSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlR1cGxlIHZhbHVlIGNhbid0IGJlIGFuIGFycmF5XCIpO1xuICAgICAgfSBlbHNlIGlmICghIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpdGVtcy5wdXNoKFxuICAgICAgICAgIGAke2tleX06IHsgJHtzZXJpYWxpemVUdXBsZSh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPil9IH1gXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtcy5wdXNoKGAke2tleX06ICR7dmFsdWV9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpdGVtcy5qb2luKFwiLCBcIik7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gb2sodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYChvayAke3ZhbH0pYDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBlcnIodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYChlcnIgJHt2YWx9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gc29tZSh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBgKHNvbWUgJHt2YWx9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gbm9uZSgpIHtcbiAgICByZXR1cm4gYG5vbmVgO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGJvb2wodmFsOiBib29sZWFuKSB7XG4gICAgcmV0dXJuIGAke3ZhbH1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGludCh2YWw6IG51bWJlciB8IGJpZ2ludCkge1xuICAgIHJldHVybiBgJHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiB1aW50KHZhbDogbnVtYmVyIHwgYmlnaW50KSB7XG4gICAgcmV0dXJuIGB1JHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBhc2NpaSh2YWw6IHN0cmluZykge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHV0ZjgodmFsOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYHUke0pTT04uc3RyaW5naWZ5KHZhbCl9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiBidWZmKHZhbDogQXJyYXlCdWZmZXIgfCBzdHJpbmcpIHtcbiAgICBjb25zdCBidWZmID1cbiAgICAgIHR5cGVvZiB2YWwgPT0gXCJzdHJpbmdcIlxuICAgICAgICA/IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh2YWwpXG4gICAgICAgIDogbmV3IFVpbnQ4QXJyYXkodmFsKTtcblxuICAgIGNvbnN0IGhleE9jdGV0cyA9IG5ldyBBcnJheShidWZmLmxlbmd0aCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1ZmYubGVuZ3RoOyArK2kpIHtcbiAgICAgIGhleE9jdGV0c1tpXSA9IGJ5dGVUb0hleFtidWZmW2ldXTtcbiAgICB9XG5cbiAgICByZXR1cm4gYDB4JHtoZXhPY3RldHMuam9pbihcIlwiKX1gO1xuICB9XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIGxpc3QodmFsOiBBcnJheTx1bmtub3duPikge1xuICAgIHJldHVybiBgKGxpc3QgJHt2YWwuam9pbihcIiBcIil9KWA7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gcHJpbmNpcGFsKHZhbDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGAnJHt2YWx9YDtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiB0dXBsZSh2YWw6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgcmV0dXJuIGB7ICR7c2VyaWFsaXplVHVwbGUodmFsKX0gfWA7XG4gIH1cbn1cblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgU3RyaW5nIHtcbiAgICBleHBlY3RPaygpOiBzdHJpbmc7XG4gICAgZXhwZWN0RXJyKCk6IHN0cmluZztcbiAgICBleHBlY3RTb21lKCk6IHN0cmluZztcbiAgICBleHBlY3ROb25lKCk6IHZvaWQ7XG4gICAgZXhwZWN0Qm9vbCh2YWx1ZTogYm9vbGVhbik6IGJvb2xlYW47XG4gICAgZXhwZWN0VWludCh2YWx1ZTogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50O1xuICAgIGV4cGVjdEludCh2YWx1ZTogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50O1xuICAgIGV4cGVjdEJ1ZmYodmFsdWU6IEFycmF5QnVmZmVyKTogQXJyYXlCdWZmZXI7XG4gICAgZXhwZWN0QXNjaWkodmFsdWU6IHN0cmluZyk6IHN0cmluZztcbiAgICBleHBlY3RVdGY4KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmc7XG4gICAgZXhwZWN0UHJpbmNpcGFsKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmc7XG4gICAgZXhwZWN0TGlzdCgpOiBBcnJheTxzdHJpbmc+O1xuICAgIGV4cGVjdFR1cGxlKCk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIH1cblxuICBpbnRlcmZhY2UgQXJyYXk8VD4ge1xuICAgIGV4cGVjdFNUWFRyYW5zZmVyRXZlbnQoXG4gICAgICBhbW91bnQ6IG51bWJlciB8IGJpZ2ludCxcbiAgICAgIHNlbmRlcjogc3RyaW5nLFxuICAgICAgcmVjaXBpZW50OiBzdHJpbmdcbiAgICApOiBFeHBlY3RTVFhUcmFuc2ZlckV2ZW50O1xuICAgIGV4cGVjdEZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50KFxuICAgICAgYW1vdW50OiBudW1iZXIgfCBiaWdpbnQsXG4gICAgICBzZW5kZXI6IHN0cmluZyxcbiAgICAgIHJlY2lwaWVudDogc3RyaW5nLFxuICAgICAgYXNzZXRJZDogc3RyaW5nXG4gICAgKTogRXhwZWN0RnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQ7XG4gICAgZXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudChcbiAgICAgIGFtb3VudDogbnVtYmVyIHwgYmlnaW50LFxuICAgICAgcmVjaXBpZW50OiBzdHJpbmcsXG4gICAgICBhc3NldElkOiBzdHJpbmdcbiAgICApOiBFeHBlY3RGdW5naWJsZVRva2VuTWludEV2ZW50O1xuICAgIGV4cGVjdEZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQoXG4gICAgICBhbW91bnQ6IG51bWJlciB8IGJpZ2ludCxcbiAgICAgIHNlbmRlcjogc3RyaW5nLFxuICAgICAgYXNzZXRJZDogc3RyaW5nXG4gICAgKTogRXhwZWN0RnVuZ2libGVUb2tlbkJ1cm5FdmVudDtcbiAgICBleHBlY3RQcmludEV2ZW50KFxuICAgICAgY29udHJhY3RJZGVudGlmaWVyOiBzdHJpbmcsXG4gICAgICB2YWx1ZTogc3RyaW5nXG4gICAgKTogRXhwZWN0UHJpbnRFdmVudDtcbiAgICBleHBlY3ROb25GdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudChcbiAgICAgIHRva2VuSWQ6IHN0cmluZyxcbiAgICAgIHNlbmRlcjogc3RyaW5nLFxuICAgICAgcmVjaXBpZW50OiBzdHJpbmcsXG4gICAgICBhc3NldEFkZHJlc3M6IHN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50O1xuICAgIGV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5NaW50RXZlbnQoXG4gICAgICB0b2tlbklkOiBzdHJpbmcsXG4gICAgICByZWNpcGllbnQ6IHN0cmluZyxcbiAgICAgIGFzc2V0QWRkcmVzczogc3RyaW5nLFxuICAgICAgYXNzZXRJZDogc3RyaW5nXG4gICAgKTogRXhwZWN0Tm9uRnVuZ2libGVUb2tlbk1pbnRFdmVudDtcbiAgICBleHBlY3ROb25GdW5naWJsZVRva2VuQnVybkV2ZW50KFxuICAgICAgdG9rZW5JZDogc3RyaW5nLFxuICAgICAgc2VuZGVyOiBzdHJpbmcsXG4gICAgICBhc3NldEFkZHJlc3M6IHN0cmluZyxcbiAgICAgIGFzc2V0SWQ6IHN0cmluZ1xuICAgICk6IEV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5CdXJuRXZlbnQ7XG4gIH1cbn1cblxuLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbmZ1bmN0aW9uIGNvbnN1bWUoc3JjOiBTdHJpbmcsIGV4cGVjdGF0aW9uOiBzdHJpbmcsIHdyYXBwZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGRzdCA9IChcIiBcIiArIHNyYykuc2xpY2UoMSk7XG4gIGxldCBzaXplID0gZXhwZWN0YXRpb24ubGVuZ3RoO1xuICBpZiAoIXdyYXBwZWQgJiYgc3JjICE9PSBleHBlY3RhdGlvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBFeHBlY3RlZCAke2dyZWVuKGV4cGVjdGF0aW9uLnRvU3RyaW5nKCkpfSwgZ290ICR7cmVkKHNyYy50b1N0cmluZygpKX1gXG4gICAgKTtcbiAgfVxuICBpZiAod3JhcHBlZCkge1xuICAgIHNpemUgKz0gMjtcbiAgfVxuICBpZiAoZHN0Lmxlbmd0aCA8IHNpemUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihleHBlY3RhdGlvbi50b1N0cmluZygpKX0sIGdvdCAke3JlZChzcmMudG9TdHJpbmcoKSl9YFxuICAgICk7XG4gIH1cbiAgaWYgKHdyYXBwZWQpIHtcbiAgICBkc3QgPSBkc3Quc3Vic3RyaW5nKDEsIGRzdC5sZW5ndGggLSAxKTtcbiAgfVxuICBjb25zdCByZXMgPSBkc3Quc2xpY2UoMCwgZXhwZWN0YXRpb24ubGVuZ3RoKTtcbiAgaWYgKHJlcyAhPT0gZXhwZWN0YXRpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihleHBlY3RhdGlvbi50b1N0cmluZygpKX0sIGdvdCAke3JlZChzcmMudG9TdHJpbmcoKSl9YFxuICAgICk7XG4gIH1cbiAgbGV0IGxlZnRQYWQgPSAwO1xuICBpZiAoZHN0LmNoYXJBdChleHBlY3RhdGlvbi5sZW5ndGgpID09PSBcIiBcIikge1xuICAgIGxlZnRQYWQgPSAxO1xuICB9XG4gIGNvbnN0IHJlbWFpbmRlciA9IGRzdC5zdWJzdHJpbmcoZXhwZWN0YXRpb24ubGVuZ3RoICsgbGVmdFBhZCk7XG4gIHJldHVybiByZW1haW5kZXI7XG59XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0T2sgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwib2tcIiwgdHJ1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEVyciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGNvbnN1bWUodGhpcywgXCJlcnJcIiwgdHJ1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFNvbWUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBjb25zdW1lKHRoaXMsIFwic29tZVwiLCB0cnVlKTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0Tm9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGNvbnN1bWUodGhpcywgXCJub25lXCIsIGZhbHNlKTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0Qm9vbCA9IGZ1bmN0aW9uICh2YWx1ZTogYm9vbGVhbikge1xuICB0cnkge1xuICAgIGNvbnN1bWUodGhpcywgYCR7dmFsdWV9YCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0VWludCA9IGZ1bmN0aW9uICh2YWx1ZTogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50IHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGB1JHt2YWx1ZX1gLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIEJpZ0ludCh2YWx1ZSk7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdEludCA9IGZ1bmN0aW9uICh2YWx1ZTogbnVtYmVyIHwgYmlnaW50KTogYmlnaW50IHtcbiAgdHJ5IHtcbiAgICBjb25zdW1lKHRoaXMsIGAke3ZhbHVlfWAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gQmlnSW50KHZhbHVlKTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0QnVmZiA9IGZ1bmN0aW9uICh2YWx1ZTogQXJyYXlCdWZmZXIpIHtcbiAgY29uc3QgYnVmZmVyID0gdHlwZXMuYnVmZih2YWx1ZSk7XG4gIGlmICh0aGlzICE9PSBidWZmZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkICR7Z3JlZW4oYnVmZmVyKX0sIGdvdCAke3JlZCh0aGlzLnRvU3RyaW5nKCkpfWApO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0QXNjaWkgPSBmdW5jdGlvbiAodmFsdWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN1bWUodGhpcywgYFwiJHt2YWx1ZX1cImAsIGZhbHNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuXG5TdHJpbmcucHJvdG90eXBlLmV4cGVjdFV0ZjggPSBmdW5jdGlvbiAodmFsdWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN1bWUodGhpcywgYHVcIiR7dmFsdWV9XCJgLCBmYWxzZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuU3RyaW5nLnByb3RvdHlwZS5leHBlY3RQcmluY2lwYWwgPSBmdW5jdGlvbiAodmFsdWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN1bWUodGhpcywgYCR7dmFsdWV9YCwgZmFsc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0TGlzdCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuY2hhckF0KDApICE9PSBcIltcIiB8fCB0aGlzLmNoYXJBdCh0aGlzLmxlbmd0aCAtIDEpICE9PSBcIl1cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBFeHBlY3RlZCAke2dyZWVuKFwiKGxpc3QgLi4uKVwiKX0sIGdvdCAke3JlZCh0aGlzLnRvU3RyaW5nKCkpfWBcbiAgICApO1xuICB9XG5cbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgY29uc3QgZWxlbWVudHMgPSBbXTtcbiAgbGV0IHN0YXJ0ID0gMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIixcIiAmJiBzdGFjay5sZW5ndGggPT0gMSkge1xuICAgICAgZWxlbWVudHMucHVzaCh0aGlzLnN1YnN0cmluZyhzdGFydCwgaSkpO1xuICAgICAgc3RhcnQgPSBpICsgMjtcbiAgICB9XG4gICAgaWYgKFtcIihcIiwgXCJbXCIsIFwie1wiXS5pbmNsdWRlcyh0aGlzLmNoYXJBdChpKSkpIHtcbiAgICAgIHN0YWNrLnB1c2godGhpcy5jaGFyQXQoaSkpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiKVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIihcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCJ9XCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwie1wiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIl1cIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCJbXCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgfVxuICBjb25zdCByZW1haW5kZXIgPSB0aGlzLnN1YnN0cmluZyhzdGFydCwgdGhpcy5sZW5ndGggLSAxKTtcbiAgaWYgKHJlbWFpbmRlci5sZW5ndGggPiAwKSB7XG4gICAgZWxlbWVudHMucHVzaChyZW1haW5kZXIpO1xuICB9XG4gIHJldHVybiBlbGVtZW50cztcbn07XG5cblN0cmluZy5wcm90b3R5cGUuZXhwZWN0VHVwbGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmNoYXJBdCgwKSAhPT0gXCJ7XCIgfHwgdGhpcy5jaGFyQXQodGhpcy5sZW5ndGggLSAxKSAhPT0gXCJ9XCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0ZWQgJHtncmVlbihcIih0dXBsZSAuLi4pXCIpfSwgZ290ICR7cmVkKHRoaXMudG9TdHJpbmcoKSl9YFxuICAgICk7XG4gIH1cblxuICBsZXQgc3RhcnQgPSAxO1xuICBjb25zdCBzdGFjayA9IFtdO1xuICBjb25zdCBlbGVtZW50cyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiLFwiICYmIHN0YWNrLmxlbmd0aCA9PSAxKSB7XG4gICAgICBlbGVtZW50cy5wdXNoKHRoaXMuc3Vic3RyaW5nKHN0YXJ0LCBpKSk7XG4gICAgICBzdGFydCA9IGkgKyAyO1xuICAgIH1cbiAgICBpZiAoW1wiKFwiLCBcIltcIiwgXCJ7XCJdLmluY2x1ZGVzKHRoaXMuY2hhckF0KGkpKSkge1xuICAgICAgc3RhY2sucHVzaCh0aGlzLmNoYXJBdChpKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNoYXJBdChpKSA9PT0gXCIpXCIgJiYgc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gPT09IFwiKFwiKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hhckF0KGkpID09PSBcIn1cIiAmJiBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA9PT0gXCJ7XCIpIHtcbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFyQXQoaSkgPT09IFwiXVwiICYmIHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdID09PSBcIltcIikge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHJlbWFpbmRlciA9IHRoaXMuc3Vic3RyaW5nKHN0YXJ0LCB0aGlzLmxlbmd0aCAtIDEpO1xuICBpZiAocmVtYWluZGVyLmxlbmd0aCA+IDApIHtcbiAgICBlbGVtZW50cy5wdXNoKHJlbWFpbmRlcik7XG4gIH1cblxuICBjb25zdCB0dXBsZTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgZWxlbWVudHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChlbGVtZW50LmNoYXJBdChpKSA9PT0gXCI6XCIpIHtcbiAgICAgICAgY29uc3Qga2V5ID0gZWxlbWVudC5zdWJzdHJpbmcoMCwgaSkudHJpbSgpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGVsZW1lbnQuc3Vic3RyaW5nKGkgKyAyKS50cmltKCk7XG4gICAgICAgIHR1cGxlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHR1cGxlO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdFNUWFRyYW5zZmVyRXZlbnQgPSBmdW5jdGlvbiAoYW1vdW50LCBzZW5kZXIsIHJlY2lwaWVudCkge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBzdHhfdHJhbnNmZXJfZXZlbnQgfSA9IGV2ZW50O1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYW1vdW50OiBzdHhfdHJhbnNmZXJfZXZlbnQuYW1vdW50LmV4cGVjdEludChhbW91bnQpLFxuICAgICAgICBzZW5kZXI6IHN0eF90cmFuc2Zlcl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlciksXG4gICAgICAgIHJlY2lwaWVudDogc3R4X3RyYW5zZmVyX2V2ZW50LnJlY2lwaWVudC5leHBlY3RQcmluY2lwYWwocmVjaXBpZW50KSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIHJldHJpZXZlIGV4cGVjdGVkIFNUWFRyYW5zZmVyRXZlbnRcIik7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0RnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnQgPSBmdW5jdGlvbiAoXG4gIGFtb3VudCxcbiAgc2VuZGVyLFxuICByZWNpcGllbnQsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBmdF90cmFuc2Zlcl9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAoIWZ0X3RyYW5zZmVyX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIuZW5kc1dpdGgoYXNzZXRJZCkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGZ0X3RyYW5zZmVyX2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgc2VuZGVyOiBmdF90cmFuc2Zlcl9ldmVudC5zZW5kZXIuZXhwZWN0UHJpbmNpcGFsKHNlbmRlciksXG4gICAgICAgIHJlY2lwaWVudDogZnRfdHJhbnNmZXJfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChyZWNpcGllbnQpLFxuICAgICAgICBhc3NldElkOiBmdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuVHJhbnNmZXJFdmVudCgke2Ftb3VudH0sICR7c2VuZGVyfSwgJHtyZWNpcGllbnR9LCAke2Fzc2V0SWR9KVxcbiR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICB0aGlzXG4gICAgKX1gXG4gICk7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0RnVuZ2libGVUb2tlbk1pbnRFdmVudCA9IGZ1bmN0aW9uIChcbiAgYW1vdW50LFxuICByZWNpcGllbnQsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBmdF9taW50X2V2ZW50IH0gPSBldmVudDtcbiAgICAgIGlmICghZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLmVuZHNXaXRoKGFzc2V0SWQpKSBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYW1vdW50OiBmdF9taW50X2V2ZW50LmFtb3VudC5leHBlY3RJbnQoYW1vdW50KSxcbiAgICAgICAgcmVjaXBpZW50OiBmdF9taW50X2V2ZW50LnJlY2lwaWVudC5leHBlY3RQcmluY2lwYWwocmVjaXBpZW50KSxcbiAgICAgICAgYXNzZXRJZDogZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgRnVuZ2libGVUb2tlbk1pbnRFdmVudFwiKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3RGdW5naWJsZVRva2VuQnVybkV2ZW50ID0gZnVuY3Rpb24gKFxuICBhbW91bnQsXG4gIHNlbmRlcixcbiAgYXNzZXRJZFxuKSB7XG4gIGZvciAoY29uc3QgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGZ0X2J1cm5fZXZlbnQgfSA9IGV2ZW50O1xuICAgICAgaWYgKCFmdF9idXJuX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIuZW5kc1dpdGgoYXNzZXRJZCkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbW91bnQ6IGZ0X2J1cm5fZXZlbnQuYW1vdW50LmV4cGVjdEludChhbW91bnQpLFxuICAgICAgICBzZW5kZXI6IGZ0X2J1cm5fZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgICBhc3NldElkOiBmdF9idXJuX2V2ZW50LmFzc2V0X2lkZW50aWZpZXIsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBGdW5naWJsZVRva2VuQnVybkV2ZW50XCIpO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdFByaW50RXZlbnQgPSBmdW5jdGlvbiAoY29udHJhY3RJZGVudGlmaWVyLCB2YWx1ZSkge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBjb250cmFjdF9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAoIWNvbnRyYWN0X2V2ZW50LnRvcGljLmVuZHNXaXRoKFwicHJpbnRcIikpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFjb250cmFjdF9ldmVudC52YWx1ZS5lbmRzV2l0aCh2YWx1ZSkpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb250cmFjdF9pZGVudGlmaWVyOlxuICAgICAgICAgIGNvbnRyYWN0X2V2ZW50LmNvbnRyYWN0X2lkZW50aWZpZXIuZXhwZWN0UHJpbmNpcGFsKFxuICAgICAgICAgICAgY29udHJhY3RJZGVudGlmaWVyXG4gICAgICAgICAgKSxcbiAgICAgICAgdG9waWM6IGNvbnRyYWN0X2V2ZW50LnRvcGljLFxuICAgICAgICB2YWx1ZTogY29udHJhY3RfZXZlbnQudmFsdWUsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oZXJyb3IpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byByZXRyaWV2ZSBleHBlY3RlZCBQcmludEV2ZW50XCIpO1xufTtcblxuQXJyYXkucHJvdG90eXBlLmV4cGVjdE5vbkZ1bmdpYmxlVG9rZW5UcmFuc2ZlckV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkLFxuICBzZW5kZXIsXG4gIHJlY2lwaWVudCxcbiAgYXNzZXRBZGRyZXNzLFxuICBhc3NldElkXG4pIHtcbiAgZm9yIChjb25zdCBldmVudCBvZiB0aGlzKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgbmZ0X3RyYW5zZmVyX2V2ZW50IH0gPSBldmVudDtcbiAgICAgIGlmIChuZnRfdHJhbnNmZXJfZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKG5mdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyICE9PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRva2VuSWQ6IG5mdF90cmFuc2Zlcl9ldmVudC52YWx1ZSxcbiAgICAgICAgc2VuZGVyOiBuZnRfdHJhbnNmZXJfZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgICByZWNpcGllbnQ6IG5mdF90cmFuc2Zlcl9ldmVudC5yZWNpcGllbnQuZXhwZWN0UHJpbmNpcGFsKHJlY2lwaWVudCksXG4gICAgICAgIGFzc2V0SWQ6IG5mdF90cmFuc2Zlcl9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlblRyYW5zZmVyRXZlbnRcIik7XG59O1xuXG5BcnJheS5wcm90b3R5cGUuZXhwZWN0Tm9uRnVuZ2libGVUb2tlbk1pbnRFdmVudCA9IGZ1bmN0aW9uIChcbiAgdG9rZW5JZCxcbiAgcmVjaXBpZW50LFxuICBhc3NldEFkZHJlc3MsXG4gIGFzc2V0SWRcbikge1xuICBmb3IgKGNvbnN0IGV2ZW50IG9mIHRoaXMpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBuZnRfbWludF9ldmVudCB9ID0gZXZlbnQ7XG4gICAgICBpZiAobmZ0X21pbnRfZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKG5mdF9taW50X2V2ZW50LmFzc2V0X2lkZW50aWZpZXIgIT09IGAke2Fzc2V0QWRkcmVzc306OiR7YXNzZXRJZH1gKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG9rZW5JZDogbmZ0X21pbnRfZXZlbnQudmFsdWUsXG4gICAgICAgIHJlY2lwaWVudDogbmZ0X21pbnRfZXZlbnQucmVjaXBpZW50LmV4cGVjdFByaW5jaXBhbChyZWNpcGllbnQpLFxuICAgICAgICBhc3NldElkOiBuZnRfbWludF9ldmVudC5hc3NldF9pZGVudGlmaWVyLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlbk1pbnRFdmVudFwiKTtcbn07XG5cbkFycmF5LnByb3RvdHlwZS5leHBlY3ROb25GdW5naWJsZVRva2VuQnVybkV2ZW50ID0gZnVuY3Rpb24gKFxuICB0b2tlbklkLFxuICBzZW5kZXIsXG4gIGFzc2V0QWRkcmVzcyxcbiAgYXNzZXRJZFxuKSB7XG4gIGZvciAoY29uc3QgZXZlbnQgb2YgdGhpcykge1xuICAgIHRyeSB7XG4gICAgICBpZiAoZXZlbnQubmZ0X2J1cm5fZXZlbnQudmFsdWUgIT09IHRva2VuSWQpIGNvbnRpbnVlO1xuICAgICAgaWYgKFxuICAgICAgICBldmVudC5uZnRfYnVybl9ldmVudC5hc3NldF9pZGVudGlmaWVyICE9PSBgJHthc3NldEFkZHJlc3N9Ojoke2Fzc2V0SWR9YFxuICAgICAgKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgYXNzZXRJZDogZXZlbnQubmZ0X2J1cm5fZXZlbnQuYXNzZXRfaWRlbnRpZmllcixcbiAgICAgICAgdG9rZW5JZDogZXZlbnQubmZ0X2J1cm5fZXZlbnQudmFsdWUsXG4gICAgICAgIHNlbmRlcjogZXZlbnQubmZ0X2J1cm5fZXZlbnQuc2VuZGVyLmV4cGVjdFByaW5jaXBhbChzZW5kZXIpLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZXhwZWN0ZWQgTm9uRnVuZ2libGVUb2tlbkJ1cm5FdmVudFwiKTtcbn07XG5cbmNvbnN0IG5vQ29sb3IgPSBEZW5vLm5vQ29sb3IgPz8gdHJ1ZTtcbmNvbnN0IGVuYWJsZWQgPSAhbm9Db2xvcjtcblxuaW50ZXJmYWNlIENvZGUge1xuICBvcGVuOiBzdHJpbmc7XG4gIGNsb3NlOiBzdHJpbmc7XG4gIHJlZ2V4cDogUmVnRXhwO1xufVxuXG5mdW5jdGlvbiBjb2RlKG9wZW46IG51bWJlcltdLCBjbG9zZTogbnVtYmVyKTogQ29kZSB7XG4gIHJldHVybiB7XG4gICAgb3BlbjogYFxceDFiWyR7b3Blbi5qb2luKFwiO1wiKX1tYCxcbiAgICBjbG9zZTogYFxceDFiWyR7Y2xvc2V9bWAsXG4gICAgcmVnZXhwOiBuZXcgUmVnRXhwKGBcXFxceDFiXFxcXFske2Nsb3NlfW1gLCBcImdcIiksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJ1bihzdHI6IHN0cmluZywgY29kZTogQ29kZSk6IHN0cmluZyB7XG4gIHJldHVybiBlbmFibGVkXG4gICAgPyBgJHtjb2RlLm9wZW59JHtzdHIucmVwbGFjZShjb2RlLnJlZ2V4cCwgY29kZS5vcGVuKX0ke2NvZGUuY2xvc2V9YFxuICAgIDogc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVkKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMxXSwgMzkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdyZWVuKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bihzdHIsIGNvZGUoWzMyXSwgMzkpKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFhQSxjQUFjLFlBQVksQ0FBQztBQUUzQixPQUFPLE1BQU0sRUFBRTtJQUNiLElBQUksQ0FBUztJQUNiLE1BQU0sQ0FBUztJQUNmLFlBQVksQ0FBa0I7SUFDOUIsV0FBVyxDQUFjO0lBQ3pCLGNBQWMsQ0FBb0I7SUFFbEMsWUFBWSxJQUFZLEVBQUUsTUFBYyxDQUFFO1FBQ3hDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3RCO0lBRUQsT0FBTyxXQUFXLENBQUMsTUFBYyxFQUFFLFNBQWlCLEVBQUUsTUFBYyxFQUFFO1FBQ3BFLE1BQU0sRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMs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