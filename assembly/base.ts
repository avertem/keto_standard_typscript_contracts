// The entry file of your WebAssembly module.
//import "allocator/arena";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountQuery} from "./account/account_query"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem_account_contract"
const FEE_NAMESPACE : string = "http://keto-coin.io/schema/rdf/1.0/keto/Fee#";

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][" + transaction.getAccount() + "]");
    
    let accountQuery = new AccountQuery();
    if (accountQuery.getTotal() < transaction.getTransactionValue()) {
        return false;
    }

    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the sourcer account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,transaction.getTransactionValue());

    return true;
}

export function credit(): bool {
    let transaction = Keto.transaction();
    if (checkForFeeInfo(transaction)) {
        Keto.log(Keto.LOG_LEVEL.INFO,"[credit][" + transaction.getAccount() + "] this is a free transaction and no fee will be deducted");
        transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account with the fee value",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
                transaction.getTransactionValue());
    } else {
        Keto.log(Keto.LOG_LEVEL.INFO,"[credit][" + transaction.getAccount() + "] this is not a fee transaction and fees will be deducted");
        transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
                transaction.getTransactionValue() - transaction.getTotalFeeValue(Constants.KETO_MIMIMIM_FEE));
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[credit][" + transaction.getAccount() + "] credit is complete");
    return true;
}

export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    let jsonBuilder = new TsJSONBuilder();        
    jsonBuilder.add("account").set(httpRequest.getAccount());
    jsonBuilder.add("target").set(httpRequest.getTarget());
    
    if (httpRequest.getTarget() == "account_total") {
        let account = new AccountQuery();
        //data.add("account").set(account.accountHash)
        let data = jsonBuilder.add("data")
        data.add("account").set(httpRequest.getAccount())
        data.add("credits").setInt(account.credits)
        data.add("debits").setInt(account.debits)
        data.add("total").setInt(account.getTotal())
    } else if (httpRequest.getTarget() == "transactions") {
        let account = new AccountQuery();
        let data = jsonBuilder.addArray("data")
        account.accountTransactions(data);
    } else {
        // if no account is found we cannot perform a query and return a blank list
        let data = jsonBuilder.addArray("data")
        let jsonArray = data.add();
    }
    httpResponse.setContentType("application/javascript");
    httpResponse.setBody(jsonBuilder.toJson());
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}

function checkForFeeInfo(transaction : Transaction) : bool {
    // copy the contract information
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_account_contract][checkForFeeInfo] execute query");
    let changeSets = Keto.executeQuery("SELECT ?subject ?predicate ?object WHERE { " +
        "?subject ?predicate ?object . " +
    "}");

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_account_contract][checkForFeeInfo] process results");
    let row : ResultRow | null;
    while ((row = changeSets.nextRow()) != null) {
        if (checkRdfNode(transaction,row)) {
            return true;
        }
    }
    return false;
}

function checkRdfNode(transaction: Transaction, row : ResultRow) : bool {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_contract_management_contract][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "][" + row.getQueryStringByKey("object") + "]");
    if (!subject.startsWith(FEE_NAMESPACE)) {
        return false;
    }
    return true;
}


