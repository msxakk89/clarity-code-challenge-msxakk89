(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-constant CLEARFUND_CONTRACT .clearfund)
(define-constant ERR_CLEARFUND_ONLY (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_DOESNT_EXISTS (err u102))

(define-non-fungible-token donorpass uint)

(define-data-var lastTokenId uint u0)

(define-read-only (get-last-token-id) 
  (ok (var-get lastTokenId))
)

(define-read-only (get-token-uri (id uint)) 
  (ok none)
)

(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? donorpass id))
)

(define-public (transfer (id uint) (sender principal) (receiver principal))
  (begin
    ;; (asserts! (is-eq (unwrap! (nft-get-owner? donorpass id) ERR_DOESNT_EXISTS ) tx-sender) ERR_NOT_TOKEN_OWNER )
    (nft-transfer? donorpass id sender receiver)
))

(define-public (mint (for principal)) 
  (let 
  (
    (new_id (+ (var-get lastTokenId) u1))
    ;; (sender tx-sender)
  )
  (asserts! (is-eq tx-sender CLEARFUND_CONTRACT ) ERR_CLEARFUND_ONLY)

  (try! (nft-mint? donorpass new_id for)) 
  (var-set lastTokenId new_id)
  (ok true)
  )
)