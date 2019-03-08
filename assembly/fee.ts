// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "./constants"

var KETO_NAME: string  = "keto_fee_contract"

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit] fee [" + transaction.getFeeAccount() + "]");
    // get the transaction value
    transaction.createCreditEntry(transaction.getFeeAccount(),KETO_NAME,"debit fee from transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            transaction.getFeeValue(Constants.KETO_MIMIMIM_FEE));
    return true;
}
export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit] fee [" + transaction.getFeeAccount() + "]");
    transaction.createCreditEntry(transaction.getFeeAccount(),KETO_NAME, "credit fee for transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            transaction.getFeeValue(Constants.KETO_MIMIMIM_FEE));
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
