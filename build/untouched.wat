(module
 (type $v (func))
 (type $iiv (func (param i32 i32)))
 (type $I (func (result i64)))
 (type $iiIv (func (param i32 i32 i64)))
 (type $iv (func (param i32)))
 (import "Keto" "log" (func $../typescript_contract_sdk/assembly/index/Keto.log (param i32 i32)))
 (import "Keto" "getTransactionValue" (func $../typescript_contract_sdk/assembly/index/Keto.getTransactionValue (result i64)))
 (import "Keto" "createDebitEntry" (func $../typescript_contract_sdk/assembly/index/Keto.createDebitEntry (param i32 i32 i64)))
 (import "Keto" "getFeeValue" (func $../typescript_contract_sdk/assembly/index/Keto.getFeeValue (result i64)))
 (import "Keto" "createCreditEntry" (func $../typescript_contract_sdk/assembly/index/Keto.createCreditEntry (param i32 i32 i64)))
 (import "Keto" "console" (func $../typescript_contract_sdk/assembly/index/Keto.console (param i32)))
 (global $assembly/index/KETO_ACCOUNT_MODEL (mut i32) (i32.const 4))
 (global $assembly/index/KETO_ACCOUNT_TRANSACTION_MODEL (mut i32) (i32.const 120))
 (global $HEAP_BASE i32 (i32.const 392))
 (memory $0 1)
 (data (i32.const 4) "7\00\00\00h\00t\00t\00p\00:\00/\00/\00k\00e\00t\00o\00-\00c\00o\00i\00n\00.\00i\00o\00/\00s\00c\00h\00e\00m\00a\00/\00r\00d\00f\00/\001\00.\000\00/\00k\00e\00t\00o\00/\00A\00c\00c\00o\00u\00n\00t\00#\00A\00c\00c\00o\00u\00n\00t\00")
 (data (i32.const 120) "N\00\00\00h\00t\00t\00p\00:\00/\00/\00k\00e\00t\00o\00-\00c\00o\00i\00n\00.\00i\00o\00/\00s\00c\00h\00e\00m\00a\00/\00r\00d\00f\00/\001\00.\000\00/\00k\00e\00t\00o\00/\00A\00c\00c\00o\00u\00n\00t\00T\00r\00a\00n\00s\00a\00c\00t\00i\00o\00n\00#\00A\00c\00c\00o\00u\00n\00t\00T\00r\00a\00n\00s\00a\00c\00t\00i\00o\00n\00/\00")
 (data (i32.const 280) "\07\00\00\00[\00d\00e\00b\00i\00t\00]\00")
 (data (i32.const 300) "\15\00\00\00[\00c\00r\00e\00d\00i\00t\00]\00d\00e\00b\00u\00g\00 \00m\00e\00s\00s\00a\00g\00e\00")
 (data (i32.const 348) "\14\00\00\00[\00p\00r\00o\00c\00e\00s\00s\00]\00h\00e\00l\00l\00o\00 \00w\00o\00r\00l\00d\00")
 (export "debit" (func $assembly/index/debit))
 (export "credit" (func $assembly/index/credit))
 (export "fee" (func $assembly/index/fee))
 (export "process" (func $assembly/index/process))
 (export "memory" (memory $0))
 (func $assembly/index/debit (; 6 ;) (type $v)
  ;;@ assembly/index.ts:8:9
  (call $../typescript_contract_sdk/assembly/index/Keto.log
   ;;@ assembly/index.ts:8:13
   (i32.const 1)
   ;;@ assembly/index.ts:8:34
   (i32.const 280)
  )
  ;;@ assembly/index.ts:10:9
  (call $../typescript_contract_sdk/assembly/index/Keto.createDebitEntry
   ;;@ assembly/index.ts:10:26
   (get_global $assembly/index/KETO_ACCOUNT_MODEL)
   ;;@ assembly/index.ts:10:45
   (get_global $assembly/index/KETO_ACCOUNT_TRANSACTION_MODEL)
   ;;@ assembly/index.ts:10:81
   (call $../typescript_contract_sdk/assembly/index/Keto.getTransactionValue)
  )
 )
 (func $assembly/index/credit (; 7 ;) (type $v)
  ;;@ assembly/index.ts:13:9
  (call $../typescript_contract_sdk/assembly/index/Keto.log
   ;;@ assembly/index.ts:13:13
   (i32.const 1)
   ;;@ assembly/index.ts:13:34
   (i32.const 300)
  )
  ;;@ assembly/index.ts:14:9
  (call $../typescript_contract_sdk/assembly/index/Keto.createCreditEntry
   ;;@ assembly/index.ts:14:27
   (get_global $assembly/index/KETO_ACCOUNT_MODEL)
   ;;@ assembly/index.ts:14:46
   (get_global $assembly/index/KETO_ACCOUNT_TRANSACTION_MODEL)
   ;;@ assembly/index.ts:15:12
   (i64.sub
    ;;@ assembly/index.ts:15:17
    (call $../typescript_contract_sdk/assembly/index/Keto.getTransactionValue)
    ;;@ assembly/index.ts:15:46
    (call $../typescript_contract_sdk/assembly/index/Keto.getFeeValue)
   )
  )
 )
 (func $assembly/index/fee (; 8 ;) (type $v)
  ;;@ assembly/index.ts:18:9
  (call $../typescript_contract_sdk/assembly/index/Keto.log
   ;;@ assembly/index.ts:18:13
   (i32.const 1)
   ;;@ assembly/index.ts:18:34
   (i32.const 300)
  )
  ;;@ assembly/index.ts:19:9
  (call $../typescript_contract_sdk/assembly/index/Keto.createCreditEntry
   ;;@ assembly/index.ts:19:27
   (get_global $assembly/index/KETO_ACCOUNT_MODEL)
   ;;@ assembly/index.ts:19:46
   (get_global $assembly/index/KETO_ACCOUNT_TRANSACTION_MODEL)
   ;;@ assembly/index.ts:20:17
   (call $../typescript_contract_sdk/assembly/index/Keto.getFeeValue)
  )
 )
 (func $assembly/index/process (; 9 ;) (type $v)
  ;;@ assembly/index.ts:23:9
  (call $../typescript_contract_sdk/assembly/index/Keto.console
   ;;@ assembly/index.ts:23:17
   (i32.const 348)
  )
 )
)
