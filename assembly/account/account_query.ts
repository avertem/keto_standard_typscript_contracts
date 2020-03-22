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

        let accountTotal = Keto.executeQuery(`SELECT ?type ( SUM( ?value ) AS ?totalValue )
        WHERE {
          {
            {
              ?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> "` + this.accountHash + `"^^<http://www.w3.org/2001/XMLSchema#string> .
              ?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> ?type .
              ?transaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value .
            }
          }
        }
        GROUP BY ?type
        LIMIT 250`,Keto.QUERY_TYPES.REMOTE)

        let row : ResultRow | null;
        while ((row = accountTotal.nextRow()) != null) {
            if (row.getQueryStringByKey("type") == "debit") {
                this.debits = row.getQueryLongByKey("totalValue");
            } else {
                this.credits = row.getQueryLongByKey("totalValue");
            }
        }
    }

    getTotal() : u64 {
        return this.credits - this.debits;
    }

    accountTransactions(builder: TsJSONBuilder) : void {
        let transactions = Keto.executeQuery(
            `SELECT ?id ?date ?type ?name ?description ?value WHERE {
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#accountHash> "`+ this.accountHash + `"^^<http://www.w3.org/2001/XMLSchema#string> .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#id> ?id .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#dateTime> ?date .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#type> ?type .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#name> ?name .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#description> ?description .
                ?accountTransaction <http://keto-coin.io/schema/rdf/1.0/keto/AccountTransaction#value> ?value .
            } ORDER BY DESC(?date) LIMIT 50`)

        let row : ResultRow | null;
        while ((row = transactions.nextRow()) != null) {
            let jsonObj = builder.add();
            jsonObj.add("id").set(row.getQueryStringByKey("id"))
            jsonObj.add("date").set(row.getQueryStringByKey("date"))
            jsonObj.add("type").set(row.getQueryStringByKey("type"))
            jsonObj.add("name").set(row.getQueryStringByKey("name"))
            jsonObj.add("description").set(row.getQueryStringByKey("description"))
            jsonObj.add("amount").set(row.getQueryStringByKey("value"))
        }
    }


}