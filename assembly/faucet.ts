// The entry file of your WebAssembly module.
//import "allocator/system";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSON} from "../lib/typescript_contract_sdk/assembly/json/TsJSON"
import {Constants} from "./constants"

export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

export function debit(): bool {
    Keto.log(Keto.LOG_LEVEL.ERROR,"[debit][faucet] ");
    return true;
}

export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.ERROR,"[credit][faucet] ");
    return true;
}

export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    httpResponse.setContentType("text/html");
    httpResponse.setBody("<html><body>[" + httpRequest.getAccount() + "]</body></html>");
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}

