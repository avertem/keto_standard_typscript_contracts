// The entry file of your WebAssembly module.
//import "allocator/system";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSON} from "../lib/typescript_contract_sdk/assembly/json/TsJSON"
import {AccountQuery} from "./account/account_query"
import {Constants} from "./constants"

export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem__account_faucet";
var NAMESPACE: string = "http://keto-coin.io/schema/rdf/1.0/keto/Faucet#"
var KETO_FAUCET_VALUE : u64 = 1000;

export function debit(): bool {
    let transaction = Keto.transaction();
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][faucet] debit account [" + transaction.getAccount() + "]");

    // this will result in a retry
    let accountQuery = new AccountQuery();
    if (accountQuery.getTotal() < KETO_FAUCET_VALUE) {
        return false;
    }

    // deduct the fee and copy the faucet information
    copyFaucetInfo(transaction);
    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the faucet account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,KETO_FAUCET_VALUE);

    return true;
}

export function credit(): bool {
    let transaction = Keto.transaction();
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][faucet][" + transaction.getAccount() + "]");
    copyFaucetInfo(transaction);
    transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account with faucet value",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
        KETO_FAUCET_VALUE);
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

function copyFaucetInfo(transaction : Transaction) : void {
    // copy the contract information
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem_fee_contract][copyFeeInfo] execute query");
    let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE {
        ?subject ?predicate ?object . 
    }`);

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_faucet][copyFeeInfo] process results");
    let row : ResultRow | null;
    while ((row = changeSets.nextRow()) != null) {
        copyRdfNode(transaction,row);
    }
}

function copyRdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_faucet][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "][" + row.getQueryStringByKey("object") + "]");
    if (!subject.startsWith(NAMESPACE)) {
        return;
    }
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_faucet][rdfNode] copy [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "]");
    transaction.addTripleString(row.getQueryStringByKey("subject"), row.getQueryStringByKey("predicate"), row.getQueryStringByKey("object"))
}

