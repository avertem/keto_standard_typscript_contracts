// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "./constants"

var KETO_NAME: string = "keto_account_contract"

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][" + transaction.getAccount() + "]");
    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the sourcer account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,transaction.getTransactionValue());
    return true;
}
export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][" + transaction.getAccount() + "]");
    transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            transaction.getTransactionValue() - transaction.getTotalFeeValue(Constants.KETO_MIMIMIM_FEE));
    return true;
}
export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[request][" + httpRequest.getAccount() + "][" + httpRequest.getTarget() + "]");
    httpResponse.setContentType("text/html");
    httpResponse.setBody("<html><body>[" + httpRequest.getAccount() + "]</body></html>");
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}
