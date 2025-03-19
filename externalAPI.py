import requests


r = requests.get('https://httpbin.org/basic-auth/user/pass', auth=('user', 'pass'))
#Accounts
## Ebay
ebayAccountEP = 'https://api.ebay.com/sell/account/v1/'
#Account overview

def post_custom_policy():
    payload = {
        "description": "Once a purchase is made, it cannot be returned or refunded. Please review product descriptions, images, and seller information carefully before making a purchase.",
        "label": "Take-back Policy",
        "name": "Take_Back_Policy_01",
        "policyType": "TAKE_BACK"
    }

    #ebay requests.post(ebayAccountEP + 'custom_policy/', )
    pass

def get_custom_policy():
    #ebay requests.get(ebayAccountEP + 'custom_policy/
    pass

def get_custom_policies():
    #ebay requests.get(ebayAccountEP + 'custom_policy/{custom_policy_id}

def updateCustomPolicy():
    #ebay requests.put(ebayAccountEP + 'custom_policy/{custom_policy_id}


    * EBAY
        advertising_eligibility
        custom_policy
        fulfillment_policy
        payment_policy
        return_policy
        payments_program
        privilege
        program
        rate_table
        sales_tax
        kyc 