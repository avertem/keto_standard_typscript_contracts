import {Keto, ResultRow, Transaction, Contract} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountInfo} from "./account/account_info"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem__namespace_management_contract"

class ValidationResult {
    status : bool;
    error : string;

    constructor(status : bool, error: string = "NA") {
        this.status = status;
        this.error = error;
    }
}

export function debit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][debit] process the debit transaction");

    return true;
}


export function credit(): bool {
    let transaction = Keto.transaction();
    let contract = Keto.contract();

    // validate the transaction
    let validationResult = validate(transaction,contract)
    if (!validationResult.status) {
        logBadRequest(transaction, validationResult.error )
    } else {
        // copy the contract information
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] execute query");
        let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE {
                ?subject ?predicate ?object .
            }`);

        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] copy the provided rows");
        let row : ResultRow | null;
        while ((row = changeSets.nextRow()) != null) {
            copyRdfNode(transaction,row)    
        }

        // retrieve the namespace information
        let namespaceInfo = Keto.executeQuery(`SELECT ?id WHERE {
            ?namespace <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#id> ?id .
            }`);

        row = namespaceInfo.nextRow();

        transaction.addTripleString(`http://keto-coin.io/schema/rdf/1.0/keto/Namespace#Namespace/${row?.getQueryStringByKey('id')}`, "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifier", "PUBLIC");
        
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] process the namespace transaction");
    }
    return true;
}


export function request(): bool {


    return false;
}

function validate( transaction : Transaction, contract: Contract ) : ValidationResult {

    let creditAccount = transaction.getCreditAccount();

    if (contract.getOwner() != creditAccount) {
        return new ValidationResult(false, 'Executing contract against the incorrect account owner, this is not allowed.');
    }

    let namespaceInfo = Keto.executeQuery(`SELECT ?namespace ?accountHash WHERE {
        ?namespace <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> ?namespace .
        ?namespace <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> ?accountHash .
        }`);

    // if there are 
    if (namespaceInfo.getRowCount() == 0) {
        return new ValidationResult(false,'No namespace information was provided with action');
    }

    // check the change set
    let row : ResultRow | null = namespaceInfo.nextRow();
    if (!row) {
        return new ValidationResult(false,'No namespace information was provided with action');
    }

    let namespace = row.getQueryStringByKey("namespace");
    let account = row.getQueryStringByKey("accountHash");

    if (!validateNamespace(account,namespace)) {
        return new ValidationResult(false,'This namespace is not owned by this accocunt cannot modify it');
    }
    
    return new ValidationResult(true);
}

function validateNamespace(account : string, namespace: string) : bool {
    let namespaceInfo = Keto.executeQuery(`SELECT ?accountHash WHERE {
        ?namespace <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> '${namespace}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?namespace <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> ?accountHash .
        }`, Keto.QUERY_TYPES.REMOTE);

    // if there are 
    if (namespaceInfo.getRowCount() == 0) {
        return true;
    }

    // check the change set
    let row : ResultRow | null = namespaceInfo.nextRow();
    if (!row) {
        return true;
    }

    let _account = row.getQueryStringByKey("accountHash");

    // the 
    if (_account != account) {
        return false;
    }

    return true;
}

function copyRdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    let predicate = row.getQueryStringByKey("predicate");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_contract_management_contract][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "][" + row.getQueryStringByKey("object") + "]");
    // ignore any none namespace entries.
    if (!subject.startsWith("http://keto-coin.io/schema/rdf/1.0/keto/Namespace#Namespace")) {
        return;
    }
    // ignore any modifiers as they will be handled by this contract
    if (predicate == "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifier") {
        return;
    }
    
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][rdfNode] copy [" + subject + 
        "][" + predicate + 
        "][" + row.getQueryStringByKey("object") + "]");
    transaction.addTripleString(subject, predicate, row.getQueryStringByKey("object"))
}

function logBadRequest(transaction: Transaction, msg: string = "unknown error") : void {
    let transactionId = transaction.getTransaction();
    let debitAccount = transaction.getDebitAccount();
    let creditAccount = transaction.getCreditAccount();
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#id", transactionId);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#debit", debitAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#credit", creditAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#msg", msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifer", "PUBLIC");
}