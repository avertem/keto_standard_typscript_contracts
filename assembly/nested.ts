// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto, ResultRow} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSON} from "../lib/typescript_contract_sdk/assembly/json/TsJSON"
import {Constants} from "./constants"

var KETO_CHANGE_SET_RDF_ID : string = "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id"
var KETO_NAME: string  = "nested_transaction"

export function debit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][nested_transaction] fee [" + Keto.getAccount() + "]");
    let changeSets = Keto.executeQuery("SELECT ?id ?changeSetHash ?type ?signature ?transactionHash WHERE { " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> 'DEBIT'^^<http://www.w3.org/2001/XMLSchema#string> . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id> ?id . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash> ?changeSetHash . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> ?type . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature> ?signature . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash> ?transactionHash . }");
    let row : ResultRow = null;
    while ((row = changeSets.nextRow()) != null)  {
        rdfNode(row)
    }
    // get the transaction value
    //Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME,"debit fee from transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
    //        Keto.getFeeValue(Constants.KETO_MIMIMIM_FEE));
}
export function credit(): void {
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][nested_transaction] fee [" + Keto.getAccount() + "]");
    let changeSets = Keto.executeQuery("SELECT ?id ?changeSetHash ?type ?signature ?transactionHash WHERE { " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> 'CREDIT'^^<http://www.w3.org/2001/XMLSchema#string> . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id> ?id . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash> ?changeSetHash . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> ?type . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature> ?signature . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash> ?transactionHash . }");
    let row : ResultRow = null;
    while ((row = changeSets.nextRow()) != null) {
        rdfNode(row)    
    }
    //Keto.createCreditEntry(Keto.getFeeAccount(),KETO_NAME, "credit fee for transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
    //        Keto.getFeeValue(Constants.KETO_MIMIMIM_FEE));
}
export function process(): void {
    Keto.console("[process]hello world");
}

function rdfNode(row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    Keto.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id", id)
    Keto.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type", row.getQueryStringByKey("type"))
    Keto.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash", id)
    Keto.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature", row.getQueryStringByKey("signature"))
    Keto.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash", row.getQueryStringByKey("transactionHash"))
}
