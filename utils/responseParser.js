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

const responseParser = async (people)=>{
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
            let link = "https://rahulob.app.n8n.cloud/webhook/verifyEmail";
            let args = {
                "emails":possible_emails
            }
            const result = await fetch(link , {
                method : "POST",
                headers : {
                "Content-Type":"application/json"
                },
                redirect:"follow",
                body: JSON.stringify(args),
            }).then(response => response.json()).then(async (response) => {
                return response.data;
            }).catch(error => {
                console.error(error);
            });

            // let processed_possible_emails = result;
            if(result){
                let res_len = result.length;
                if(res_len){
                    let max_score_email = result[0].email;
                    let max_score = result[0].score;
                    for(let i=0; i<res_len;i++){
                        let el = result[i];
                        if(max_score <= el.score){
                            max_score = el.score;
                            max_score_email = el.email;
                        }
                    }
                    filtered_person.possible_emails = result;
                    filtered_person.best_possible_email = max_score_email;
                    filtered_person.best_possible_email_score = max_score;
                }
            }
        }
        filtered_people_array.push(filtered_person);
    }
    return filtered_people_array;
}


module.exports = responseParser;