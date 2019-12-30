// The entry file of your WebAssembly module.
//import "allocator/arena";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountQuery} from "./account/account_query"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "keto_account_contract"

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
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][" + transaction.getAccount() + "]");
    transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the target account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
            transaction.getTransactionValue() - transaction.getTotalFeeValue(Constants.KETO_MIMIMIM_FEE));
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
        let transactions = Keto.executeQuery("SELECT ?id ?date ?account ?accountHash ?type ?name ?value WHERE { " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#id> ?id . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#date> ?date . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#account> ?account . " +
  			"?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#transaction> ?accountTransaction . " +
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/Account#transaction> ?transaction . " +
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> ?type . " +
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> ?accountHash . " +
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#name> ?name . " + 
  			"?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value . " +
            "} ORDER BY DESC(?date) LIMIT 200")
        
        let row : ResultRow | null;
        let data = jsonBuilder.addArray("data")
        let jsonArray = data.add();
        while ((row = transactions.nextRow()) != null) {
            let jsonObj = jsonArray.add();
            jsonObj.add("id").set(row.getQueryStringByKey("id"))
            jsonObj.add("account").set(row.getQueryStringByKey("accountHash"))
            jsonObj.add("date").set(row.getQueryStringByKey("date"))
            jsonObj.add("type").set(row.getQueryStringByKey("type"))
            jsonObj.add("name").set(row.getQueryStringByKey("name"))
            jsonObj.add("amount").set(row.getQueryStringByKey("value"))
        }
    }
    httpResponse.setContentType("application/javascript");
    httpResponse.setBody(jsonBuilder.toJson());
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}


