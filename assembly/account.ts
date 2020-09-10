import {Keto, ResultRow, Transaction} from "../lib/typescript_contract_sdk/assembly/keto"
import {TsJSONBuilder,TsJsonType} from "../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"
import {Constants} from "./constants"
import {AccountInfo} from "./account/account_info"
export {_malloc,_free} from "../lib/typescript_contract_sdk/assembly/keto"

var KETO_NAME: string = "keto_account_management_contract"

export function debit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[keto_account_management_contract][debit] process the debit transaction");
    return true;
}

export function credit(): bool {
    Keto.log(Keto.LOG_LEVEL.INFO,"[keto_account_management_contract][credit] begin processing");
    let transaction = Keto.transaction();
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][credit] execute query");
    let changeSets = Keto.executeQuery(`SELECT ?subject ?predicate ?object WHERE { 
        ?subject ?predicate ?object .
    }`);

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][credit] process results");
    let row : ResultRow | null;
    while ((row = changeSets.nextRow()) != null) {
        rdfNode(transaction,row)    
    }

    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][credit] process the account transaction");
    return true;
}

export function request(): bool {
    let httpRequest = Keto.httpRequest();
    let httpResponse = Keto.httpResponse();
    
    let jsonBuilder = new TsJSONBuilder();        
    jsonBuilder.add("account").set(httpRequest.getAccount());
    jsonBuilder.add("target").set(httpRequest.getTarget());
    
    if (httpRequest.getTarget() == "account_detail") {
        //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][request] get account info");
        let account = new AccountInfo();
        //data.add("account").set(account.accountHash)
        //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][request] add data");
        jsonBuilder.add("name").set(account.name);
        jsonBuilder.add("email").set(account.email);
        jsonBuilder.add("email_varified").set(account.email_verified);
        jsonBuilder.add("firstname").set(account.firstname);
        jsonBuilder.add("lastname").set(account.lastname);
        jsonBuilder.add("type").set(account.type);
        jsonBuilder.add("status").set(account.status);
        jsonBuilder.add("locale").set("unknown");

        //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][request] set the account details");
        httpResponse.setBody(jsonBuilder.toJson());
        httpResponse.setContentType("application/javascript");
        //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][request] after setting the details");
    } else {
        // if no account is found we cannot perform a query and return a blank list
        let data = jsonBuilder.addArray("data")
        let jsonArray = data.add();
    }
    Keto.log(Keto.LOG_LEVEL.INFO,"[keto_account_management_contract][request] return the result");
    return true;
}

export function process(): void {
    Keto.console("[process]hello world");
}


function rdfNode(transaction: Transaction, row : ResultRow) : void {
    let id =  row.getQueryStringByKey("id")
    let subject = row.getQueryStringByKey("subject");
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][rdfNode] validate [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "]");
    if (!subject.startsWith("http://keto-coin.io/schema/rdf/1.0/keto/Account#Account/") && !subject.startsWith("http://keto-coin.io/schema/rdf/1.0/keto/AccountGroup#AccountGroup/")) {
        return;
    }
    //Keto.log(Keto.LOG_LEVEL.DEBUG,"[keto_account_management_contract][rdfNode] copy [" + row.getQueryStringByKey("subject") + 
    //    "][" + row.getQueryStringByKey("predicate") + 
    //    "]");
    transaction.addTripleString(row.getQueryStringByKey("subject"), row.getQueryStringByKey("predicate"), row.getQueryStringByKey("object"))
}