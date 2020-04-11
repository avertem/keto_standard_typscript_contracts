// The entry file of your WebAssembly module.
//import "allocator/arena";
import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "./constants"

export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string  = "avertem_fee_contract"
const FAUCET_NAMESPACE: string = "http://keto-coin.io/schema/rdf/1.0/keto/Faucet#"
const NAMESPACE : string = "http://keto-coin.io/schema/rdf/1.0/keto/Fee#";

export function debit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.DEBUG,"[avertem_fee_contract][debit] process fee [" + transaction.getFeeAccount() + "]");
    
    if (!handleActionInfo(transaction,"debit")) {
        createChildTransacction(transaction, 'DEBIT');
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][debit] created the debit fee for [" + transaction.getFeeAccount() + "]");
    //transaction.createCreditEntry(transaction.getFeeAccount(),KETO_NAME,"debit fee from transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
    //        transaction.getFeeValue(Constants.KETO_MIMIMIM_FEE));
    return true;
}
export function credit(): bool {
    let transaction = Keto.transaction();
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][credit] process fee [" + transaction.getFeeAccount() + "]");
    if (!handleActionInfo(transaction,"credit")) {
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][credit] create the credit fee for [" + transaction.getFeeAccount() + "]");
        createChildTransacction(transaction, 'CREDIT');
    } else {
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][credit] fee not required for [" + transaction.getAccount() + "] this is either a faucet or fee transaction");
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][credit] credit fees submitted [" + transaction.getFeeAccount() + "]");
    //transaction.createCreditEntry(transaction.getFeeAccount(),KETO_NAME, "credit fee for transaction",Constants.KETO_ACCOUNT_MODEL,Constants.KETO_ACCOUNT_TRANSACTION_MODEL,
    //        transaction.getFeeValue(Constants.KETO_MIMIMIM_FEE));
    return true;
}

export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    Keto.log(Keto.LOG_LEVEL.ERROR,"[avertem_fee_contract][request][" + httpRequest.getAccount() + "][" + httpRequest.getTarget() + "]");
    httpResponse.setContentType("text/html");
    httpResponse.setBody("<html><body>[" + httpRequest.getAccount() + "]</body></html>");
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}

function handleActionInfo(transaction : Transaction, type: string) : bool {
    // copy the contract information
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][handleActionInfo] execute query");
    let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE { 
        ?subject ?predicate ?object .
    }`);

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][handleActionInfo] process results");
    let row : ResultRow | null;
    let result : bool = false;
    while ((row = changeSets.nextRow()) != null) {
        if (processRdfNode(transaction,type,row)) {
            result = true;
        }
    }
    return result;
}

function processRdfNode(transaction: Transaction, type: string, row : ResultRow) : bool {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][processRdfNode] validate [" + row.getQueryStringByKey("subject") + 
        "][" + row.getQueryStringByKey("predicate") + 
        "][" + row.getQueryStringByKey("object") + "]");
    if (subject.startsWith(FAUCET_NAMESPACE)) {
        return true;
    }
    if (!subject.startsWith(NAMESPACE)) {
        return false;
    }
    if (type == "credit") {
        Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][processRdfNode] copy [" + row.getQueryStringByKey("subject") + 
            "][" + row.getQueryStringByKey( "predicate") + 
            "][" + row.getQueryStringByKey("object") + "]");
        transaction.addTripleString(row.getQueryStringByKey("subject"), row.getQueryStringByKey("predicate"), row.getQueryStringByKey("object"))
    }
    return true;
}

function createChildTransacction(transaction : Transaction, type: string) : void {
    // get the transaction value
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][createChildTransaction] create a child transaction [" + type + "]");
    let childTransaction = transaction.createChildTransaction();
    childTransaction.setSourceAccount(transaction.getAccount());
    childTransaction.setTargetAccount(transaction.getFeeAccount());
    let value = transaction.getFeeValue(Constants.KETO_MIMIMIM_FEE);
    
    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][createChildTransaction] set the values [" + type + "]");
    childTransaction.setTransactionValue(value);
    let action = childTransaction.createAction();
    action.setContract('6DF454B154203B629CF2664969C6E6EE391E3CA2C48365F75DFCB780E20F5E61');
    let transactionId = transaction.getTransaction();

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][createChildTransaction] add the model [" + type + "]");
    let subject = NAMESPACE + 'Fee/'+type+'_'+transactionId;
    action.setModelStringValue(subject, NAMESPACE + 'id', transactionId);
    action.setModelStringValue(subject, NAMESPACE + 'action', type);
    action.setModelStringValue(subject, NAMESPACE + 'account', transaction.getAccount());
    action.setModelStringValue(subject, NAMESPACE + 'transaction', transactionId);
    action.setModelLongValue(subject, NAMESPACE + 'value', value);

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][createChildTransaction] submit the transaction [" + type + "]");
    childTransaction.submitWithStatus("CREDIT");

    Keto.log(Keto.LOG_LEVEL.INFO,"[avertem_fee_contract][createChildTransaction] submit the child transaction for the fees [" + type + "]");
}


