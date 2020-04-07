import {Keto, ResultRow, Transaction, Contract} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountInfo} from "./account/account_info"
import {AccountQuery} from "./account/account_query"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem__namespace_management_contract"
const NAMESPACE_FEE : u64 = 10000;

class ValidationResult {
    status : bool;
    error : string;
    

    constructor(status : bool, error: string = "NA") {
        this.status = status;
        this.error = error;
    }
}

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][debit] process the debit transaction [" + transaction.getAccount() + "]");
    
    let accountQuery = new AccountQuery();
    if (accountQuery.getTotal() < NAMESPACE_FEE) {
        Keto.log(Keto.LOG_LEVEL.ERROR,"[avertem_namespace_management_contract][debit] namespace fee exceeds the amount in the account cannot deduct fee.");
        return false;
    }

    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the source for the namespace fee",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,NAMESPACE_FEE);

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][debit] create the debit entry for the fee [" + transaction.getAccount() + "]");
    return true;
}


export function credit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][credit] started the of the credit method");
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][credit] get the contract");
    let contract = Keto.contract();

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][credit] started the credit [" + transaction.getAccount() + "]");

    // validate the transaction
    let validationResult = validate(transaction,contract)
    if (!validationResult.status) {
        logBadRequest(transaction, validationResult.error )
    } else if (transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the namespace account for the fee",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,NAMESPACE_FEE)) {
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
        if (row) {
            Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] add the modifier for : " + row.getQueryStringByKey('id'));    
            transaction.addTripleString(`http://keto-coin.io/schema/rdf/1.0/keto/Namespace#Namespace/` + row.getQueryStringByKey('id'), "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifier", "PUBLIC");
        }
        
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] process the namespace transaction");
    } else {
        logBadRequest(transaction, "Transaction fee is not present" );
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][credit] finished the credit [" + transaction.getAccount() + "]");
    return true;
}


export function request(): bool {
    let jsonBuilder = new TsJSONBuilder();   
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();

    jsonBuilder.add("account").set(httpRequest.getAccount());
    jsonBuilder.add("target").set(httpRequest.getTarget());
    
    if (httpRequest.getTarget() == "namespaces") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?namespace ?type ?hash WHERE {
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> ?namespace .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#type> ?type .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#hash> ?hash .
            }`,Keto.QUERY_TYPES.REMOTE);
        let row : ResultRow | null;
        let dataBuilder = jsonBuilder.addArray("data")
        while ((row = namespaceInfo.nextRow()) != null) {
            let jsonObj = dataBuilder.add();
            jsonObj.add("namespace").set(row.getQueryStringByKey("namespace"))
            jsonObj.add("type").set(row.getQueryStringByKey("type"))
            jsonObj.add("hash").set(row.getQueryStringByKey("hash"))
        }
    } else if (httpRequest.getTarget() == "namespace_errors") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?id ?msg WHERE {
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#debit> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id> ?id .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#msg> ?msg .
            }`,Keto.QUERY_TYPES.REMOTE);
        let row : ResultRow | null;
        let dataBuilder = jsonBuilder.addArray("data")
        while ((row = namespaceInfo.nextRow()) != null) {
            let jsonObj = dataBuilder.add();
            jsonObj.add("id").set(row.getQueryStringByKey("id"))
            jsonObj.add("msg").set(row.getQueryStringByKey("msg"))
        }
    }
    httpResponse.setContentType("application/javascript");
    httpResponse.setBody(jsonBuilder.toJson());
    return true;
}

function validate( transaction : Transaction, contract: Contract ) : ValidationResult {

    let creditAccount = transaction.getCreditAccount();

    if (contract.getOwner() != creditAccount) {
        return new ValidationResult(false, 'Executing contract against the incorrect account owner, this is not allowed.');
    }

    let namespaceInfo = Keto.executeQuery(`SELECT ?namespace ?accountHash WHERE {
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> ?namespace .
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> ?accountHash .
        }`);

    // if there are 
    //if (namespaceInfo.getRowCount() == 0) {
    //    return new ValidationResult(false,'No namespace provided to the action.');
    //}

    // check the change set
    let row : ResultRow | null = namespaceInfo.nextRow();
    if (row == null) {
        return new ValidationResult(false,'Could not find the namespace entry none supplied.');
    }

    let namespace = row.getQueryStringByKey("namespace");
    let account = row.getQueryStringByKey("accountHash");

    if (!validateNamespace(account,namespace)) {
        return new ValidationResult(false,'This namespace is not owned by this account cannot modify it');
    }
    
    return new ValidationResult(true);
}

function validateNamespace(account : string, namespace: string) : bool {
    let namespaceInfo = Keto.executeQuery(`SELECT ?accountHash WHERE {
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> '${namespace}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> ?accountHash .
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

    Keto.log(Keto.LOG_LEVEL.ERROR,"[avertem_namespace_management_contract][logBadRequest] to process the request : " + msg);
        
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#id", transactionId);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#debit", debitAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#credit", creditAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/NamspaceError#msg", msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/NamespaceError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifier", "PUBLIC");


    let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE {
        ?subject ?predicate ?object .
    }`);

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__namespace_management_contract][credit] copy the provided rows");
    let row : ResultRow | null;
    while ((row = changeSets.nextRow()) != null) {
        let subject = row.getQueryStringByKey("subject");
        let predicate = row.getQueryStringByKey("predicate");
        let _object = row.getQueryStringByKey("object");
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_namespace_management_contract][logBadRequest] print the query information [" + subject + 
            "][" + predicate + 
            "][" + _object + "]");
    }
}