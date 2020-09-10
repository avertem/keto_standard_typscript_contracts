import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"

export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "avertem__account_sidechain";
var NAMESPACE: string = "http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#"
var ACCOUNT_NAMESPACE: string = "http://keto-coin.io/schema/rdf/1.0/keto/Account#"
var ACCOUNT_GROUP_NAMESPACE: string = "http://keto-coin.io/schema/rdf/1.0/keto/AccountGroup#"
var GENESIS: string = "22AEC58889504AB835D6FC62B79CD342CF13A6202883DD013781005B49E59DF2";
const TRANSACTION_FEE: i64 = 2;
const SIDECHAIN_FEE: i64 = 10000;

class SidechainRequest {
    status : bool;
    error: string;
    owner : string;
    account: string;
    key: string;
    encrypted: bool;
    seed : i64;


    constructor(status : bool, error: string | null = null, owner: string | null = null, 
        account: string | null = null, key : string | null = null, encrypted : bool = false, 
        seed: i64 = 0) {
        this.status = status;
        if (error) {
            this.error = error;
        }
        if (owner) {
            this.owner = owner;
        }
        if (account) {
            this.account = account;
        }
        if (key) {
            this.key = key;
        }
        
        this.encrypted = encrypted;
        this.seed = seed;
    }
}

export function debit(): bool {
    let transaction = Keto.transaction();
    let contract = Keto.contract();

    let request = getRequest(transaction);
    if (!request.status) {
        logBadRequest(transaction, request.error);
        return true;
    } else if (contract.getOwner() != transaction.getDebitAccount() && transaction.getDebitAccount() != request.owner) {
        logBadRequest(transaction, "Invalid request owner");
        return true;
    }

    if (contract.getOwner() != transaction.getDebitAccount() && contract.getOwner() == transaction.getCreditAccount()) {
        
        // this indicates that we are executing in the child transaction and we need to copy the details
        copySidechainInfo(transaction);
        
        // debit the seed value for the side chain
        if (request.seed != 0 && transaction.getAccount() == request.owner) {
            transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit seed account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,request.seed);
        }
        transaction.createDebitEntry(transaction.getAccount(),KETO_NAME,"debit sidechain fee",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,SIDECHAIN_FEE);
        
    } else if (contract.getOwner() == transaction.getDebitAccount() && contract.getOwner() != transaction.getCreditAccount()) {
        
    }

    // nothing to be done on the debit transaction
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__account_sidechain][debit] debit side chain transaction");

    return true;
}


export function credit(): bool {
    let transaction = Keto.transaction();
    let contract = Keto.contract();

    let request = getRequest(transaction);
    if (!request.status) {
        logBadRequest(transaction, (request.error ? request.error : "Invalid request object"));
        return true;
    } else if (contract.getOwner() != transaction.getDebitAccount() && transaction.getDebitAccount() != request.owner) {
        logBadRequest(transaction, (request.error ? request.error : "Invalid request owner"));
        return true;
    }

    if (contract.getOwner() == transaction.getDebitAccount() && transaction.getCreditAccount() == request.account) {
        // debit the seed value for the side chain
        if (request.seed) {
            transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"debit the faucet account",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,request.seed);
        }
        copySidechainInfo(transaction);
    } else if (contract.getOwner() == transaction.getDebitAccount() && transaction.getCreditAccount() == request.owner) {
        
        
    } else if (contract.getOwner() == transaction.getCreditAccount()) {
        if (transaction.createCreditEntry(transaction.getAccount(),KETO_NAME,"credit the sidechain account purchase",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,SIDECHAIN_FEE)) {
            // create side chain transaction with sub transaction.
            createSideChainTransaction(transaction, request);
        } else {
            logBadRequest(transaction, "No sidechain purchase present");
        }
    } else {
        logBadRequest(transaction, "Invalid transaction request");
    }
    
    
    return true;
}


export function request(): bool {
    let jsonBuilder = new TsJSONBuilder();   
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();

    jsonBuilder.add("account").set(httpRequest.getAccount());
    jsonBuilder.add("target").set(httpRequest.getTarget());
    
    if (httpRequest.getTarget() == "sidechains") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?accountHash ?account ?key ?encrypted ?seed  WHERE {
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#accountHash> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#accountHash> ?accountHash .
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#account> ?account .
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#key> ?key .
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#encrypted> ?encrypted .
            ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#seed> ?seed . }
            }`,Keto.QUERY_TYPES.REMOTE);
        let row : ResultRow | null;
        let dataBuilder = jsonBuilder.addArray("data")
        while ((row = namespaceInfo.nextRow()) != null) {
            let jsonObj = dataBuilder.add();
            jsonObj.add("accountHash").set(row.getQueryStringByKey("accountHash"));
            jsonObj.add("account").set(row.getQueryStringByKey("account"));
            jsonObj.add("key").set(row.getQueryStringByKey("key"));
            jsonObj.add("encrypted").set(row.getQueryStringByKey("encrypted"));
            jsonObj.add("seed").setInt(row.getQueryLongByKey("seed"));
        }
    } else if (httpRequest.getTarget() == "sidechain_errors") {
        let namespaceInfo = Keto.executeQuery(`SELECT ?id ?msg WHERE {
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#debit> "` + httpRequest.getAccount() + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/Sidechainrror#id> ?id .
            ?subject <http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#msg> ?msg .
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


export function process(): void {
    Keto.console("[process]hello world");
}

function copySidechainInfo(transaction : Transaction) : void {
    // copy the contract information
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][copySidechainInfo] execute query");
    let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE { 
        ?subject ?predicate ?object .
    }`);

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][copySidechainInfo] process results");
    let row : ResultRow | null;
    while ((row = changeSets.nextRow()) != null) {
        copyRdfNode(transaction,row);
    }
}

function copyRdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_faucet][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "][" + row.getQueryStringByKey("object") + "]");
    if (!subject.startsWith(NAMESPACE)) {
        return;
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem__account_sidechain][rdfNode] copy [" + row.getQueryStringByKey("subject") + 
        "][" + row.getQueryStringByKey("predicate") + 
        "][" + row.getQueryStringByKey("object") + "]");
    transaction.addTripleString(row.getQueryStringByKey("subject"), row.getQueryStringByKey("predicate"), row.getQueryStringByKey("object"))
}

function logBadRequest(transaction: Transaction, msg: string = "Unknown error") : void {
    let transactionId = transaction.getTransaction();
    let debitAccount = transaction.getDebitAccount();
    let creditAccount = transaction.getCreditAccount();
    Keto.log(Keto.LOG_LEVEL.ERROR,"[avertem__account_sidechain][logBadRequest] failed because : " + msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#id", transactionId);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#debit", debitAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/SidechainErrorr#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#credit", creditAccount);
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#msg", msg );
    transaction.addTripleString("http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#id/"+ transactionId, "http://keto-coin.io/schema/rdf/1.0/keto/SidechainError#accountModifier", "PUBLIC");
}


function createSideChainTransaction(transaction : Transaction, request : SidechainRequest) : void {

    // get the transaction value
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][createSideChainTransaction] create a child transaction");
    let childTransaction = transaction.createChildTransaction();
    childTransaction.setSourceAccount(transaction.getCreditAccount());
    childTransaction.setTargetAccount(transaction.getDebitAccount());
    
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][createSideChainTransaction] set the values");
    childTransaction.setTransactionValue(TRANSACTION_FEE);
    let nestedTransaction = childTransaction.createNestedTransactionFromParent(request.encrypted,GENESIS);
    nestedTransaction.setSourceAccount(transaction.getCreditAccount());
    nestedTransaction.setTargetAccount(request.account);
    let action = nestedTransaction.createAction();
    action.setContract('BC43DA695277D088BDEC03CE1DC58549651B5F3228F62AEEA7EEA7EDD2E2D221');
    let transactionId = transaction.getTransaction();

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][createSideChainTransaction] add the model");
    let subject = NAMESPACE + 'Sidechain/'+transactionId;
    action.setModelStringValue(subject, NAMESPACE + 'id', transactionId);
    action.setModelStringValue(subject, NAMESPACE + 'accountHash', request.owner);
    action.setModelStringValue(subject, NAMESPACE + 'account',request.account);
    action.setModelStringValue(subject, NAMESPACE + 'key', request.key);
    action.setModelStringValue(subject, NAMESPACE + 'encrypted', (request.encrypted ? 'true' : 'false'));
    action.setModelLongValue(subject, NAMESPACE + 'seed', request.seed);

    let accountAction = nestedTransaction.createAction();
    accountAction.setContract('BB2DBC44D90DCA25D2F10D09E173A89E876C3ABBE7D9C6BD118FCBE0EFA0E5F9');
    accountAction.setContractName('avertem__account_management_contract');
    let accountSubject = ACCOUNT_NAMESPACE + 'Account/' + request.account;
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'id', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'hash', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'hash', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'name', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'email', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'email', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'email_verified', 'false');
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'firstname', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'lastname', request.account);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'public_key', request.key);
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'type', 'master');
    accountAction.setModelStringValue(accountSubject, ACCOUNT_NAMESPACE + 'parent', request.owner);
    let accountGroupSubject = ACCOUNT_GROUP_NAMESPACE + 'AccountGroup/' + request.account;
    accountAction.setModelStringValue(accountGroupSubject, accountGroupSubject + 'id', request.account);
    accountAction.setModelStringValue(accountGroupSubject, ACCOUNT_NAMESPACE + 'Account', request.account);

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][createSideChainTransaction] submit the transaction");
    childTransaction.submit();

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem__account_sidechain][createSideChainTransaction] submit the child transaction");
}

function getRequest(transaction: Transaction) : SidechainRequest {


    let sidechainInfo = Keto.executeQuery(`SELECT ?accountHash ?account ?key ?encrypted ?seed  WHERE {
        ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#accountHash> ?accountHash .
        ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#account> ?account .
        ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#key> ?key .
        ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#encrypted> ?encrypted .
        ?sidechain <http://keto-coin.io/schema/rdf/1.0/keto/Sidechain#seed> ?seed . }`);
    
    let row : ResultRow | null = sidechainInfo.nextRow();
    if (!row) {
        return new SidechainRequest(false,"No request was populated");
    }

    return new SidechainRequest(true,null,row.getQueryStringByKey('accountHash'),row.getQueryStringByKey('account'),row.getQueryStringByKey('key'),(row.getQueryStringByKey('enrypted') == 'true' ? true: false),row.getQueryLongByKey('seed'));
}