// The entry file of your WebAssembly module.
import "allocator/arena";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSON} from "../lib/typescript_contract_sdk/assembly/json/TsJSON"
import {Constants} from "./constants"

var KETO_CHANGE_SET_RDF_ID : string = "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id"
var KETO_NAME: string  = "nested_transaction"

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[debit][nested_transaction] fee [" + transaction.getAccount() + "]");
    let changeSets = Keto.executeQuery("SELECT ?id ?changeSetHash ?type ?signature ?transactionHash WHERE { " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> 'DEBIT'^^<http://www.w3.org/2001/XMLSchema#string> . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id> ?id . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash> ?changeSetHash . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> ?type . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature> ?signature . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash> ?transactionHash . }");
    let row : ResultRow = null;
    while ((row = changeSets.nextRow()) != null)  {
        rdfNode(transaction,row)
    }
    return true;
}

export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[credit][nested_transaction] fee [" + transaction.getAccount() + "]");
    let changeSets = Keto.executeQuery("SELECT ?id ?changeSetHash ?type ?signature ?transactionHash WHERE { " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> 'CREDIT'^^<http://www.w3.org/2001/XMLSchema#string> . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id> ?id . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash> ?changeSetHash . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type> ?type . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature> ?signature . " +
        "?change <http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash> ?transactionHash . }");
    let row : ResultRow = null;
    while ((row = changeSets.nextRow()) != null) {
        rdfNode(transaction,row)    
    }
    return true;
}

export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[request][" + httpRequest.getAccount() + "][" + httpRequest.getTarget() + "]");
    httpResponse.setContentType("text/html");
    httpResponse.setBody("<html><body>[" + httpRequest.getAccount() + "]</body></html>");
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}

function rdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id", id)
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#type", row.getQueryStringByKey("type"))
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#changeSetHash", id)
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#signature", row.getQueryStringByKey("signature"))
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#id/"+ id, "http://keto-coin.io/schema/rdf/1.0/keto/ChangeSet#transactionHash", row.getQueryStringByKey("transactionHash"))
}
