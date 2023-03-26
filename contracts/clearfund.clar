(define-constant CONTRACT_ADDRESS (as-contract tx-sender))

(define-constant ERR_TITLE_DESCRIPTION_LINK_EMPTY (err u101))
(define-constant ERR_INVALID_FUND_GOAL (err u102))
(define-constant ERR_START_NOT_VALID (err u103))
(define-constant ERR_END_NOT_VALID (err u104))
(define-constant ERR_ID_NOT_FOUND (err u105))
(define-constant ERR_CANNOT_CANCEL (err u106))
(define-constant ERR_NOT_OWNER (err u107))
(define-constant ERR_NOT_STARTED (err u108))
(define-constant ERR_ENDED (err u109))
(define-constant ERR_PLEDGE_GREATER_THAN_ZERO (err u110))
(define-constant ERR_STX_TRANSFER_FAILED (err u111))
(define-constant ERR_NOT_PLEDGED (err u112))
(define-constant ERR_INVALID_UNPLEDGE_AMT (err u113))
(define-constant ERR_NOT_ENDED (err u114))
(define-constant ERR_GOAL_NOT_MET (err u115))
(define-constant ERR_ALREADY_CLAIMED (err u116))
(define-constant ERR_TARGET_NOT_REACHED (err u117))


;; calculate roughly 90 days based on block times of 10 minutes
(define-constant FUNDING_TIME_LIMIT u12960)

(define-data-var last-id uint u0)

(define-map Campaigns uint {
    title: (string-utf8 256),
    description: (buff 33),
    link: (string-utf8 256),
    fundGoal: uint,
    startsAt: uint,
    endsAt: uint,
    campaignOwner: principal,
    pledgedCount: uint,
    pledgedAmount: uint,
    claimed: bool,
    targetReached: bool,
    targetReachedBy: uint
})

(define-map Investments {contributor: principal, campaignId: uint} {amount: uint})

;; public functions
(define-public (launch (title (string-utf8 256)) (description (buff 33)) (link (string-utf8 256)) (fundGoal uint) (startsAt uint) (endsAt uint))
    (let
        (
        (request-id (+ (var-get last-id ) u1))
        )
    (asserts! (> fundGoal u0) ERR_INVALID_FUND_GOAL)
    (asserts! (not (is-eq title u"")) ERR_TITLE_DESCRIPTION_LINK_EMPTY)
    (asserts! (not (is-eq description 0x)) ERR_TITLE_DESCRIPTION_LINK_EMPTY)
    (asserts! (not (is-eq link u"")) ERR_TITLE_DESCRIPTION_LINK_EMPTY)
    (asserts! (> startsAt block-height) ERR_START_NOT_VALID)
    (asserts! (> endsAt block-height) ERR_END_NOT_VALID)
    (asserts! (< endsAt (+ block-height FUNDING_TIME_LIMIT)) ERR_END_NOT_VALID)
    (map-insert Campaigns request-id {
        title: title,
        description: description,
        link: link,
        fundGoal: fundGoal,
        startsAt: startsAt,
        endsAt: endsAt,
        campaignOwner: tx-sender,
        pledgedCount: u0,
        pledgedAmount: u0,
        claimed: false,
        targetReached: false,
        targetReachedBy: u0})
    (var-set last-id request-id)
    (ok u1)
    )
)

(define-public (cancel (id uint)) 
    (let 
        (
        (should_start (unwrap! (get startsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (owner (unwrap! (get campaignOwner (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        ) 
    (asserts! (> should_start block-height) ERR_CANNOT_CANCEL)
    (asserts! (is-eq owner tx-sender) ERR_NOT_OWNER)
    (ok (map-delete Campaigns id))
    )
)


(define-public (update (id uint) (title_n (string-utf8 256)) (description_n (buff 33)) (link_n (string-utf8 256)))
    (let 
        (
        (prior_campaign (unwrap! (map-get? Campaigns id) ERR_ID_NOT_FOUND) )
        (for_merge {title: title_n, description: description_n,link: link_n})
        (posterior (merge prior_campaign for_merge))
        
        (campaignOwner (unwrap! (get campaignOwner (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (endsAt (unwrap! (get endsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        )
    (asserts! (is-eq campaignOwner tx-sender) ERR_NOT_OWNER)
    (asserts! (> endsAt block-height) ERR_CANNOT_CANCEL)
    (map-set Campaigns id posterior)
    (ok true)
    )
)

(define-public (pledge (id uint) (amount uint)) 
    (let 
        (
        (prior_campaign (unwrap! (map-get? Campaigns id) ERR_ID_NOT_FOUND) )
        (pledgedAmount (unwrap! (get pledgedAmount (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (pledgedCount (unwrap! (get pledgedCount (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (fundGoal (unwrap! (get fundGoal (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (startsAt (unwrap! (get startsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (endsAt (unwrap! (get endsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))

        
        (pledgedAmount_new (+ pledgedAmount amount) )
        (pledgedCount_new ( + pledgedCount u1) )
        (sender tx-sender)
        )
    
    (
    if (>= amount fundGoal) 
        (map-set Campaigns id (merge    prior_campaign 
                                    {targetReached: true, 
                                    pledgedAmount: pledgedAmount_new, pledgedCount: pledgedCount_new})) 
        (
        if (is-eq (map-get? Investments {contributor: tx-sender, campaignId: id}) none)
            (map-set Campaigns id   (merge prior_campaign 
                                    {pledgedAmount: pledgedAmount_new, pledgedCount: pledgedCount_new}))
            (map-set Campaigns id (merge    prior_campaign 
                                        {pledgedAmount: pledgedAmount_new}))
        )

    )
    (
    if (is-eq (map-get? Investments {contributor: tx-sender, campaignId: id}) none)
            (map-set Investments {contributor: tx-sender, campaignId: id} {amount: amount})
            (map-set Investments {contributor: tx-sender, campaignId: id} {amount: (+   amount 
                                                                                        (unwrap! (get amount (map-get? Investments {contributor: tx-sender, campaignId: id})) ERR_NOT_PLEDGED )
            )})

    )
    (asserts! (> amount u0) ERR_PLEDGE_GREATER_THAN_ZERO)
    (asserts! (> block-height startsAt) ERR_NOT_STARTED)
    (asserts! (< block-height endsAt) ERR_ENDED)
    (try! (stx-transfer? amount tx-sender CONTRACT_ADDRESS))
    (asserts! (> amount u500) (ok true))
    (try! (as-contract (contract-call? .donorpass mint sender))) 
    (ok true)
    )
)

(define-public (unpledge (id uint) (amount uint))
    (begin 
    (asserts! (<= amount (unwrap! (get amount (map-get? Investments {contributor: tx-sender, campaignId: id})) ERR_NOT_PLEDGED )) ERR_INVALID_UNPLEDGE_AMT)
    (let 
    (
        (prior_campaign (unwrap! (map-get? Campaigns id) ERR_ID_NOT_FOUND) )
        (unpleadger tx-sender)
        (pledgedAmount (unwrap! (get pledgedAmount (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (pledgedAmount_new (- pledgedAmount amount))
        ;; (prior_investment (unwrap! (get amount (map-get? Investments {contributor: tx-sender, campaignId: id})) ERR_ID_NOT_FOUND ))
        (total_pledged_user (unwrap! (get amount (map-get? Investments {contributor: tx-sender, campaignId: id})) ERR_NOT_PLEDGED ) )
        (total_pledged_user_new (- total_pledged_user amount))
        (pledgedCount (unwrap! (get pledgedCount (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (endsAt (unwrap! (get endsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
    )
    (asserts! (< block-height endsAt) ERR_ENDED)
    
    (
    if (is-eq total_pledged_user amount)
            (map-set Campaigns id   (merge prior_campaign 
                            {pledgedAmount: pledgedAmount_new, pledgedCount: (- pledgedCount u1)}))
            (map-set Campaigns id   (merge prior_campaign 
                            {pledgedAmount: pledgedAmount_new})) 
    ) 
    (map-set Investments    {contributor: tx-sender, campaignId: id} 
                            {amount: total_pledged_user_new}
    )
    (try! (as-contract (stx-transfer? amount CONTRACT_ADDRESS unpleadger)))
    (ok true)
    ))
)

(define-public (refund (id uint)) 
    (let
        (
            (refund_seeker tx-sender)
            (targetReached (unwrap! (get targetReached (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
            (endsAt (unwrap! (get endsAt (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
            (to_be_refunded (unwrap! (get amount (map-get? Investments {contributor: tx-sender, campaignId: id})) ERR_NOT_PLEDGED ))
        )
    (asserts! (> block-height endsAt) ERR_NOT_ENDED)
    (asserts! (is-eq false targetReached) ERR_GOAL_NOT_MET)
    (try! (as-contract (stx-transfer? to_be_refunded CONTRACT_ADDRESS refund_seeker)))
    (ok true)
    )
)

(define-public (claim (id uint)) 
    (let 
        (
        (prior_campaign (unwrap! (map-get? Campaigns id) ERR_ID_NOT_FOUND))
        (campaignOwner (unwrap! (get campaignOwner (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (targetReached (unwrap! (get targetReached (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (pledgedAmount (unwrap! (get pledgedAmount (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        (claimed (unwrap! (get claimed (map-get? Campaigns id)) ERR_ID_NOT_FOUND))
        )
    (asserts! (is-eq targetReached true) ERR_TARGET_NOT_REACHED)
    (asserts! (is-eq campaignOwner tx-sender) ERR_NOT_OWNER)
    (asserts! (is-eq claimed false) ERR_ALREADY_CLAIMED)
    (map-set Campaigns id (merge prior_campaign {claimed: true, targetReachedBy: block-height}))
    ;; (as-contract (stx-transfer? pledgedAmount CONTRACT_ADDRESS tx-sender) )
    ;; (try! (stx-transfer? pledgedAmount CONTRACT_ADDRESS tx-sender ))
    (ok true)
    )
)

(define-public (get-investment (campaignId uint) (investor principal)) 
    (ok (map-get? Investments {contributor: investor, campaignId: campaignId}))
)


;; read only functions
(define-read-only (get-campaign (id uint)) 
    (ok (unwrap! (map-get? Campaigns id) ERR_ID_NOT_FOUND))
)

