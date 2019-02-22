// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "keto_account_contract"
var KETO_ACCOUNT_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/Account#Account"
var KETO_ACCOUNT_TRANSACTION_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#AccountTransaction/"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit] [" + Keto.getAccount() + "]");
    // get the transaction value
    Keto.createDebitEntry(Keto.getAccount(),KETO_NAME,"debit the sourcer account",KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,Keto.getTransactionValue());
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit]debug message [" + Keto.getAccount() + "]");
    Keto.createCreditEntry(Keto.getAccount(),KETO_NAME,"credit the target account",KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getTransactionValue() - Keto.getTotalFeeValue());
}
export function process(): void {
    Keto.console("[process]hello world");
}
