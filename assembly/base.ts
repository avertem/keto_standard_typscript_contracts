// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
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
    
    let transactions = Keto.executeQuery("SELECT ?id ?blockId ?date ?account WHERE {" +
        "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#id> ?id . " +
        "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#block> ?block . " +
  		"?block <http://keto-coin.io/schema/rdf/1.0/keto/Block#id> ?blockId . " +
  		"?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#date> ?date . " +
  		"?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#account> ?account . " +
        "} ORDER BY DESC(?date) LIMIT 10")

    Keto.log(Keto.LOG_LEVEL.DEBUG,"[request][" + httpRequest.getAccount() + "][" + httpRequest.getTarget() + "]");
    httpResponse.setContentType("text/html");
    let html = "<html><body><table><tr><th>id</th><th>block</th><th>account</th><th>date</th></tr>"
    let row : ResultRow = null;
    while ((row = transactions.nextRow()) != null) {
        html += "<tr><td>" + row.getQueryStringByKey("id") + "</td><td>" + row.getQueryStringByKey("blockId") + "</td><td>" + row.getQueryStringByKey("account") + "</td><td>" + row.getQueryStringByKey("date") + "</td></tr>"
    }
    html += "</table></body></html>"
    httpResponse.setBody(html);
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}
