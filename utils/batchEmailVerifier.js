const emailModal = require("../models/emailModal");
const storeVerifiedEmails = async (id)=>{
    let retry = true;
    let processedEmails = [];
    const link = `https://api.mails.so/v1/batch/${id}`;
    console.log(`Trying GET Request on ${link}`)
    const result = await fetch(link , {
        method : "GET",
        headers : {
            "Content-Type":"application/json",
            "x-mails-api-key":"4ab9daeb-3024-4f2a-a967-4b49eab706f6"
        },
        redirect:"follow",
    }).then(response => response.json()).then(async (response) => {
        if(response.finished_at){
            retry = false;
            processedEmails = response.emails;
        }
    }).catch(error => {
        console.log(error)
    });
    if(retry){
        let x = 40*1000 + await Math.floor(Math.random() * 10);
        setTimeout(async()=>{storeVerifiedEmails(id)},x);
        return;
    }
    const processedEmail = {
        email:"",
        score:0,
        is_catchall:false,
        mx_record:"",
        provider:null,
        isv_format:false,
        isv_domain:false,
        isv_mx:false,
        isv_noblock:false,
        isv_nocatchall:false,
        isv_nogeneric:false,
        is_free:false,
        result:"",
        reason:""
    }
    for(let e = 0; e<processedEmails.length; e++){
        processedEmail.email = processedEmails[e].email;
        processedEmail.score = processedEmails[e].score;
        if(processedEmails[e].isv_nocatchall){
            processedEmail.is_catchall = !processedEmails[e].isv_nocatchall;
        }
        if(processedEmails[e].mx_record){
            processedEmail.mx_record = processedEmails[e].mx_record;
        }else{
            processedEmail.mx_record = "None";
        }
        processedEmail.provider = processedEmails[e].provider;
        processedEmail.isv_format = processedEmails[e].isv_format;
        processedEmail.isv_domain = processedEmails[e].isv_domain;
        processedEmail.isv_mx = processedEmails[e].isv_mx;
        processedEmail.isv_noblock = processedEmails[e].isv_noblock;
        processedEmail.isv_nocatchall = processedEmails[e].isv_nocatchall;
        processedEmail.isv_nogeneric = processedEmails[e].isv_nogeneric;
        processedEmail.is_free = processedEmails[e].is_free;
        processedEmail.result = processedEmails[e].result;
        processedEmail.reason = processedEmails[e].reason;
        const _email_ = await emailModal.create(processedEmail);
    }
}
const batchEmailVerifier = async (emails)=>{
    let retry = true;
    let batchResponse;
    console.log("Trying Post Request")
    const link = `https://api.mails.so/v1/batch`;
    const result = await fetch(link , {
        method : "POST",
        headers : {
            "Content-Type":"application/json",
            "x-mails-api-key":"4ab9daeb-3024-4f2a-a967-4b49eab706f6"
        },
        body:JSON.stringify({emails:emails}),
        redirect:"follow",
    }).then(response => response.json()).then(async (response) => {
        if(response.created_at){
            retry = false;
            batchResponse = response;
        }
    }).catch(error => {
        console.log(error);
    });
    if(retry){
        let x = 40*1000 + await Math.floor(Math.random() * 10)
        setTimeout(async()=>{batchEmailVerifier(emails)},x);
        return;
    }
    let y = 4*60*1000 + await Math.floor(Math.random() * 10);
    setTimeout(async()=>{storeVerifiedEmails(batchResponse.id)},y);
    return;
}


module.exports = batchEmailVerifier;