// The entry file of your WebAssembly module.
//import "allocator/system";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSON} from "../lib/typescript_contract_sdk/assembly/json/TsJSON"
import {AccountQuery} from "./account/account_query"
import {Constants} from "./constants"

export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "keto_account_faucet";
var KETO_FAUCET_VALUE : u64 = 1000;

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.ERROR,"[debit][faucet] debit account [" + transaction.getAccount() + "]");

    let accountQuery = new AccountQuery();
    if (accountQuery.getTotal() < KETO_FAUCET_VALUE) {
        return false;
    }

    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the faucet account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,KETO_FAUCET_VALUE);

    return true;
}

export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][faucet][" + transaction.getAccount() + "]");
    transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account with faucet value",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
        KETO_FAUCET_VALUE - transaction.getTotalFeeValue(Constants.KETO_MIMIMIM_FEE));
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

