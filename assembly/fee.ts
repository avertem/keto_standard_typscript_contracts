// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto} from "../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "./constants"

var KETO_NAME: string  = "keto_fee_contract"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit] fee [" + Keto.getFeeAccount() + "]");
    // get the transaction value
    Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME,"debit fee from transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getFeeValue(Constants.KETO_MIMIMIM_FEE));
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit] fee [" + Keto.getFeeAccount() + "]");
    Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME, "credit fee for transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getFeeValue(Constants.KETO_MIMIMIM_FEE));
}
export function process(): void {
    Keto.console("[process]hello world");
}
