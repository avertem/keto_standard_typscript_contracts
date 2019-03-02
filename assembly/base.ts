// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto} from "../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "./constants"
import {String} from "string"

var KETO_NAME: string = "keto_account_contract"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][" + Keto.getAccount() + "]");
    // get the transaction value
    Keto.createDebitEntry(Keto.getAccount(),KETO_NAME,"debit the sourcer account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,Keto.getTransactionValue());
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][" + Keto.getAccount() + "]");
    Keto.createCreditEntry(Keto.getAccount(),KETO_NAME,"credit the target account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getTransactionValue() - Keto.getTotalFeeValue(Constants.KETO_MIMIMIM_FEE));
}
export function process(): void {
    Keto.console("[process]hello world");
}
