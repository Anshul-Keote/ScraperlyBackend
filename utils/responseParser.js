const emailModal = require("../models/emailModal");
const permutator = require("./permutator");

let fields_to_remove = {
    employment_history:true,
    email_status:true,
    photo_url:true,
    twitter_url:true, 
    github_url:true,
    facebook_url:true,
    extrapolated_email_confidence:true, 
    email:true,
    is_likely_to_engage:true,
    departments:true,
    subdepartments:true,
    seniority:true, 
    functions:true,
    phone_numbers:true,
    show_intent:true, 
    revealed_for_current_team:true,
    organization_id:true
}

let org_fields_to_remove = {
    organization_id:true,
    alexa_ranking:true,
    primary_phone:true,
    linkedin_uid:true, 
    publicly_traded_symbol:true,
    publicly_traded_exchange:true,
    blog_url:true,
    crunchbase_url:true,
    sanitized_phone:true
}

const verifyEmail = async (email, personId , orderId)=>{
    const link = `http://api.mails.so/v1/validate?email=${email}`;
    const processedEmail = {
        email:email,
        score:0,
        personId:personId,
        orderId:orderId,
        error:false,
    }
    const result = await fetch(link , {
        method : "GET",
        headers : {
          "Content-Type":"application/json",
          "x-mails-api-key":"4ab9daeb-3024-4f2a-a967-4b49eab706f6"
        },
        redirect:"follow",
    }).then(response => response.json()).then(async (response) => {
        processedEmail.score = response.data.score;
        console.log(processedEmail);
    }).catch(error => {
        console.log(error)
        processedEmail.error = true;
    });
    const _email_ = await emailModal.create(processedEmail);
}

const batchEmailVerify = async (emails , personId , orderId)=>{
    let noe = emails.length;
    for(let i=0; i<noe; i++){
        verifyEmail(emails[i] , personId , orderId);
    }
}

const responseParser = async (people , orderId)=>{
    let filtered_people_array = [];
    let people_len = people.length;
    for(let ppl_id = 0; ppl_id < people_len; ppl_id++){
        console.log("person no " + (ppl_id + 1));
        let element = people[ppl_id];
        let keys = Object.keys(element);
        let filtered_person = {};
        let keys_len = keys.length;
        let flag;
        for(let i=0; i<keys_len; i++){
            let key = keys[i];
            if(key == "organization"){
                flag = true;
            }
            if (fields_to_remove[key]){
                continue;
            }else{
                filtered_person[key] = element[key]
            }
        }
        if(flag){
            let org_keys = Object.keys(filtered_person["organization"]);
            let org_keys_len = org_keys.length;
            let filtered_org_obj = {};
            for(let i=0; i<org_keys_len; i++){
                let org_key = org_keys[i];
                if(org_fields_to_remove[org_key]){
                    continue;
                }else{
                    filtered_org_obj[org_key] = filtered_person["organization"][org_key]
                }
            }
        }
        if(filtered_person.organization){
            let possible_emails = permutator(filtered_person.first_name , filtered_person.last_name , filtered_person.organization.primary_domain);
            batchEmailVerify(possible_emails , filtered_person.id , orderId);
        }
        filtered_people_array.push(filtered_person);
    }
    return filtered_people_array;
}


module.exports = responseParser;