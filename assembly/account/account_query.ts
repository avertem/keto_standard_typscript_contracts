import {Keto, ResultRow, Transaction} from "../../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "../constants"
import {TsJSONBuilder} from "../../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"


export class AccountQuery {
    
    transaction: Transaction;
    accountHash: string;
    debits: i64 = 0;
    credits: i64 = 0;
    
    constructor() {
        this.transaction = Keto.transaction();
        this.accountHash = this.transaction.getAccount();

        // calculate the total credits to this account
        let creditTotal = Keto.executeQuery("SELECT (SUM(?value) as ?totalValue) WHERE { " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> \"" + this.accountHash + "\"^^<http://www.w3.org/2001/XMLSchema#string> . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> \"credit\"^^<http://www.w3.org/2001/XMLSchema#string> . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value . " +
            "}",Keto.QUERY_TYPES.REMOTE)
        
        if (creditTotal.getRowCount()) {
            this.credits = creditTotal.nextRow().getQueryLongByKey("totalValue")
        }

        // calculate the total debits to this account
        let debitTotal = Keto.executeQuery("SELECT (SUM(?value) as ?totalValue) WHERE { " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> \"" + this.accountHash + "\"^^<http://www.w3.org/2001/XMLSchema#string> . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> \"debit\"^^<http://www.w3.org/2001/XMLSchema#string> . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value . " +
            "}",Keto.QUERY_TYPES.REMOTE)
        if (debitTotal.getRowCount()) {
            this.debits =  debitTotal.nextRow().getQueryLongByKey("totalValue")
        }
    }

    getTotal() : u64 {
        return this.credits - this.debits;
    }

    accountTransactions(builder: TsJSONBuilder) : void {
        let transactions = Keto.executeQuery(
            "SELECT ?id ?date ?account ?accountHash ?type ?name ?value WHERE { " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#id> ?id . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#date> ?date . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#account>  \"" + this.accountHash + "\"^^<http://www.w3.org/2001/XMLSchema#string> . " +
            "?transaction <http://keto-coin.io/schema/rdf/1.0/keto/Transaction#account> ?account . " +
  			"?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/Account#transaction> ?transaction . " +
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> ?type . " + 
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#name> ?name . " + 
            "?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> ?accountHash . " +
  			"?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value . " +
            "} ORDER BY DESC(?date) LIMIT 10")

        let row : ResultRow | null;
        Keto.log(Keto.LOG_LEVEL.ERROR,"After performing the query.")
        while ((row = transactions.nextRow()) != null) {
            Keto.log(Keto.LOG_LEVEL.ERROR,"Add transactions to list")
            let jsonObj = builder.add();
            jsonObj.add("id").set(row.getQueryStringByKey("id"))
            jsonObj.add("account").set(row.getQueryStringByKey("accountHash"))
            jsonObj.add("date").set(row.getQueryStringByKey("date"))
            jsonObj.add("type").set(row.getQueryStringByKey("type"))
            jsonObj.add("name").set(row.getQueryStringByKey("name"))
            jsonObj.add("amount").set(row.getQueryStringByKey("value"))
        }
    }
}