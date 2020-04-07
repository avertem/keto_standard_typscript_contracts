import {Keto, ResultRow, Transaction, Contract} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountInfo} from "./account/account_info"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem__contract_management_contract"
const CONTRACT_FEE : i64 = 1000;

class ValidationResult {
    status : bool;
    error : string;

    constructor(status : bool, error: string = "NA") {
        this.status = status;
        this.error = error;
    }
}

export function debit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__contract_management_contract][debit] process the debit transaction");

    let transaction = Keto.transaction();

    transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit the source for the contract allocation fee",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,CONTRACT_FEE);

    return true;
}

export function credit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__contract_management_contract][credit] begin processing");
    let transaction = Keto.transaction();
    let contract = Keto.contract();
    
    // validate the transaction
    let validationResult = validate(transaction,contract)
    if (!validationResult.status) {
        logBadRequest(transaction, validationResult.error )
    } else if (transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"debit the contract account for the fee",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,CONTRACT_FEE)) {
        // copy the contract information
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__contract_management_contract][credit] execute query");
        let changeSets = Keto.executeQuery("SELECT ?subject ?predicate ?object WHERE { " +
            "?subject ?predicate ?object . " +
        "}");

        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__contract_management_contract][credit] process results");
        let row : ResultRow | null;
        while ((row = changeSets.nextRow()) != null) {
            copyRdfNode(transaction,row)    
        }

        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__contract_management_contract][credit] process the account transaction");
    } else {
        logBadRequest(transaction, "Transaction fee is not present" )
    }
    return true;
    
}


export function request(): bool {
    let jsonBuilder = new TsJSONBuilder();   
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();

    jsonBuilder.add("account").set(httpRequest.getAccount());
    jsonBuilder.add("target").set(httpRequest.getTarget());
    
    if (httpRequest.getTarget() == "contracts") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?hash ?name ?namespace WHERE {
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Contract#accountHash> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Contract#hash> ?hash .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Contract#name> ?name .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Contract#namespace> ?namespace .
            }`,Keto.QUERY_TYPES.REMOTE);
        let row : ResultRow | null;
        let dataBuilder = jsonBuilder.addArray("data")
        while ((row = namespaceInfo.nextRow()) != null) {
            let jsonObj = dataBuilder.add();
            jsonObj.add("hash").set(row.getQueryStringByKey("hash"))
            jsonObj.add("name").set(row.getQueryStringByKey("name"))
            jsonObj.add("namespace").set(row.getQueryStringByKey("namespace"))
        }
    } else if (httpRequest.getTarget() == "contract_errors") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?id ?msg WHERE {
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/ContractError#debit> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id> ?id .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/ContractError#msg> ?msg .
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
    
    let debitAccount = transaction.getDebitAccount();
    let creditAccount = transaction.getCreditAccount();

    if (contract.getOwner() != creditAccount) {
        return new ValidationResult(false, 'Executing contract against the incorrect account owner, this is not allowed.');
    }

    let contractInfo = Keto.executeQuery(`SELECT ?contractHash ?contractName ?contractNamespace ?accountHash WHERE {
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#hash> ?contractHash . 
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#name> ?contractName . 
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#namespace> ?contractNamespace .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#accountHash> ?accountHash .
        }`);

    // if there are 
    if (contractInfo.getRowCount() != 1) {
        return new ValidationResult(false, 'No contract information was provided with this transaction');
    }

    // check the change set
    let row : ResultRow | null = contractInfo.nextRow();
    if (!row) {
        return new ValidationResult(false,'Failed to retrive and entry');
    }

    // account hash
    let accountHash = row.getQueryStringByKey("accountHash");
    if (accountHash != debitAccount) {
        return new ValidationResult(false,'Attempting to perform an action on an acccount owned by a different hash.');
    }

    let contractHash = row.getQueryStringByKey("contractHash");
    let contractName = row.getQueryStringByKey("contractName");
    let contractNamespace = row.getQueryStringByKey("contractNamespace");

    
    
    if (!checkContract(
        `SELECT ?contractHash ?contractName ?contractNamespace ?accountHash WHERE {
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#hash> '${contractHash}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#hash> ?contractHash .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#name> ?contractName .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#namespace> ?contractNamespace .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#accountHash> ?accountHash .
        }`,contractHash,contractName)) {
        return new ValidationResult(false,`Contract clash on contract hash [${contractHash}]`);
    }

    if (!checkContract(
        `SELECT ?contractHash ?contractName ?contractNamespace ?accountHash WHERE {
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#name> '${contractName}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#name> ?contractName .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#hash> ?contractHash .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#namespace> ?contractNamespace .
        ?contract <http://keto-coin.io/schema/rdf/1.0/keto/Contract#accountHash> ?accountHash .
        }`,contractHash,contractName)) {
        return new ValidationResult(false,`Contract clash on contract name ${contractHash}`);
    }

    if (!validateNamespace(accountHash, contractNamespace)) {
        return new ValidationResult(false,`The namespace [${contractNamespace}] is not owned by this account [${accountHash}]`);
    }

    if (contractName.indexOf("__") != -1) {
        let contractNameNamespace = contractName.substring(0,contractName.indexOf("__"));
        if (!validateNamespace(accountHash, contractNameNamespace)) {
            return new ValidationResult(false,`The name for the contract pre-pended a namespace [${contractNameNamespace}] that is not owned by this account [${accountHash}]`);
        }
    } else {
        return new ValidationResult(false,'Illegally formatted name [' + contractName + '] must be pre-pended with a valid contract namespace');
    }

    return new ValidationResult(true);
}


function checkContract(query : string, contractHash: string, contractName: string) : bool {
    let contractInfo = Keto.executeQuery(query, Keto.QUERY_TYPES.REMOTE);

    // if there are 
    if (contractInfo.getRowCount() == 0) {
        return true;
    }

    // check the change set
    let row : ResultRow | null = contractInfo.nextRow();
    if (!row) {
        return true;
    }

    let _contractHash = row.getQueryStringByKey("contractHash");
    let _contractName = row.getQueryStringByKey("contractName");
    
    if (_contractHash != contractHash || _contractName != contractName) {
        return false;
    }

    return true;
}

function validateNamespace(account : string, contractNamespace: string) : bool {
    let namespaceInfo = Keto.executeQuery(`SELECT ?namespace ?accountHash WHERE {
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> '${contractNamespace}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> '${account}'^^<http://www.w3.org/2001/XMLSchema#string> .
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#namespace> ?namespace .
        ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Namespace#accountHash> ?accountHash .
        }`, Keto.QUERY_TYPES.REMOTE);

    // if there are 
    if (namespaceInfo.getRowCount() == 0) {
        return false;
    }

    // check the change set
    let row : ResultRow | null = namespaceInfo.nextRow();
    if (!row) {
        return false;
    }

    return true;
}

function copyRdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_contract_management_contract][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "][" + row.getQueryStringByKey("object") + "]");
    if (!subject.startsWith("http://keto-coin.io/schema/rdf/1.0/keto/Contract#Contract") && !subject.startsWith("http://keto-coin.io/schema/rdf/1.0/keto/ContractVersion#ContractVersion")) {
        return;
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[keto_contract_management_contract][rdfNode] copy [" + row.getQueryStringByKey("subject") + 
        "][" + row.getQueryStringByKey("predicate") + 
        "][" + row.getQueryStringByKey("object") + "]");
    transaction.addTripleString(row.getQueryStringByKey("subject"), row.getQueryStringByKey("predicate"), row.getQueryStringByKey("object"))
}

function logBadRequest(transaction: Transaction, msg: string = "Unknown error") : void {
    let transactionId = transaction.getTransaction();
    let debitAccount = transaction.getDebitAccount();
    let creditAccount = transaction.getCreditAccount();
    Keto.log(Keto.LOG_LEVEL.ERROR,"[keto_contract_management_contract][logBadRequest] failed because : " + msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id", transactionId);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/ContractError#debit", debitAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/ContractError#credit", creditAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/ContractError#msg", msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/ContractError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/AccountModifier#accountModifier", "PUBLIC");
}