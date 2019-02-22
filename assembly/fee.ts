// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string  = "keto_fee_contract"
var KETO_ACCOUNT_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/Account#Account"
var KETO_ACCOUNT_TRANSACTION_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#AccountTransaction/"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit] fee : " + Keto.getFeeAccount());
    // get the transaction value
    Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME,"debit fee from transaction",KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getFeeValue());
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit] fee : " + Keto.getFeeAccount());
    Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME, "credit fee for transaction",KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getFeeValue());
}
export function process(): void {
    Keto.console("[process]hello world");
}
