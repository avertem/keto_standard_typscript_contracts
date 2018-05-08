// The entry file of your WebAssembly module.
import {Keto} from "../../typescript_contract_sdk/assembly/index"

var KETO_ACCOUNT_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/Account#Account"
var KETO_ACCOUNT_TRANSACTION_MODEL: string = "http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#AccountTransaction/"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit]");
    // get the transaction value
    Keto.createDebitEntry(KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,Keto.getTransactionValue());
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit]debug message");
    Keto.createCreditEntry(KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getTransactionValue() - Keto.getFeeValue());
}
export function fee(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit]debug message");
    Keto.createCreditEntry(KETO_ACCOUNT_MODEL,KETO_ACCOUNT_TRANSACTION_MODEL,
            Keto.getFeeValue());
}
export function process(): void {
    Keto.console("[process]hello world");
}
