import {Keto, ResultRow, Transaction} from "../../lib/typescript_contract_sdk/assembly/keto"
import {Constants} from "../constants"
import {TsJSONBuilder} from "../../lib/typescript_contract_sdk/assembly/json/TsJSONBuilder"


export class AccountInfo {

    transaction: Transaction;
    public accountHash: string = "";
    public name: string = "";
    public email: string = "";
    public email_verified: string = "";
    public firstname: string = "";
    public lastname: string = "";
    public type: string = "";
    public status: string = "";

    constructor() {
        this.transaction = Keto.transaction();
        this.accountHash = this.transaction.getAccount();

        Keto.log(Keto.LOG_LEVEL.INFO,"[AccountInfo][constructor] the account hash query [" + this.accountHash + "]");
        let queryStr = `SELECT ?name ?email ?email_verified ?firstname ?lastname ?type ?status
        WHERE {
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#hash> "` + this.accountHash + `"^^<http://www.w3.org/2001/XMLSchema#string> .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#name> ?name .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#email> ?email .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#email_verified> ?email_verified .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#firstname> ?firstname .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#lastname> ?lastname .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#type> ?type .
            ?account <http://keto-coin.io/schema/rdf/1.0/keto/Account#status> ?status .
        }
        LIMIT 1`;
        Keto.log(Keto.LOG_LEVEL.INFO,"[AccountInfo][constructor] query [" + queryStr + "]");
        let accountInfo = Keto.executeQuery(queryStr,Keto.QUERY_TYPES.REMOTE);

        Keto.log(Keto.LOG_LEVEL.INFO,"[AccountInfo][constructor] number of rows for account [" + this.accountHash + "][" + accountInfo.getRowCount().toString() + "]");

        let row : ResultRow | null = accountInfo.nextRow();
        if (row != null) {
            Keto.log(Keto.LOG_LEVEL.INFO,"[AccountInfo][constructor] load the row");
            this.name = row.getQueryStringByKey("name");
            this.email = row.getQueryStringByKey("email");
            this.email_verified = row.getQueryStringByKey("email_verified");
            this.firstname = row.getQueryStringByKey("firstname");
            this.lastname = row.getQueryStringByKey("lastname");
            this.type = row.getQueryStringByKey("type");
            this.status = row.getQueryStringByKey("status");
            Keto.log(Keto.LOG_LEVEL.INFO,"[AccountInfo][constructor] after load the row");
        }
    }


}