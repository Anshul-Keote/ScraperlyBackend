const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const orderModal = require("../models/orderModal");
const responseParser = require("../utils/responseParser");
const emailModal = require("../models/emailModal");
const converter = require("json-2-csv");
const fs = require('node:fs');
const path = require('node:path');
const batchEmailVerifier = require("../utils/batchEmailVerifier");
const peopleModal = require("../models/peopleModal");

exports.createOrder = catchAsyncErrors(async (req, res, next) => {
    const fieldsObj = req.body.data.fields;
    const ord = {
        createdAt:req.body.data.createdAt,
        noOfLeads:0,
        name:fieldsObj[0].value,
        email:fieldsObj[1].value,
        apolloUrl:fieldsObj[2].value,
        fileName:fieldsObj[4].value,
        data:[],
        paymentStatus:false
    }
    let nol = fieldsObj[3];
    let len = nol.options.length;
    for(let i=0; i<len; i++){
        let e = nol.options[i]
        if(e.id == nol.value){
            let val = e.text
            val = val.replace("k","000");
            val = parseInt(val);
            ord.noOfLeads = val;
            break;
        }
    }
    const request = await orderModal.create(ord);
    res.status(201).json({
        success: true
    })
});
const startOrderHelper = async (nop , apiRequestBody , id)=>{
    let verifyQueue = [];
    for(let i=2; i<=nop+1;i++){
        console.log(i);
        apiRequestBody.page = i;
        let arb = {
            q_keywords : apiRequestBody.q_keywords,
            page : apiRequestBody.page,
            per_page : apiRequestBody.per_page,
            person_titles : apiRequestBody.person_titles,
            person_seniorities : apiRequestBody.person_seniorities,
            contact_email_status : apiRequestBody.contact_email_status,
            q_organization_domains : apiRequestBody.q_organization_domains,
            organisation_num_employees_ranges : apiRequestBody.organisation_num_employees_ranges,
            organisation_id : apiRequestBody.organisation_id,
        }
        let link = "https://api.apollo.io/v1/mixed_people/search"; 
        const result = await fetch(link , {
            method : "POST",
            // mode : "cors",
            headers : {
              "Content-Type":"application/json",
              "X-Api-Key":"ByIN6wgmPzSvjSYFP7alvQ"
            },
            redirect:"follow",
            body: JSON.stringify(arb),
        }).then(response => response.json()).then(response => response.people).then(async(response)=>{
            const filtered_people = await responseParser(response);
            console.log("PPL : ", filtered_people.length);
            for(let j=0; j<filtered_people.length; j++){
                const _person_ = peopleModal.create({orderId:id,data:filtered_people[j]});
                if(filtered_people[j].possibleEmails){
                    if(verifyQueue.length < 49900){
                        verifyQueue.push(...filtered_people[j].possibleEmails);
                    }else{
                        batchEmailVerifier(verifyQueue);
                        verifyQueue = [];
                        verifyQueue.push(...filtered_people[j].possibleEmails);
                    }
                }
            }
            return filtered_people;
        }).catch(error => {
            console.error(error);
        });
    }
    if(verifyQueue.length != 0){
        batchEmailVerifier(verifyQueue);
        verifyQueue = [];
    }
}
exports.startOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await orderModal.findById(req.body.id);
    console.log(order);
    const order_ = await orderModal.findByIdAndUpdate(req.body.id, {paymentStatus:true}, {
        runValidators: true,
        useFindAndModify: false,
    });
    function parseApolloURL(url) {
        const params = {};
        const queryString = url.split('?')[1].split('&');
    
        queryString.forEach(param => {
            const [key, value] = param.split('=');
            if (params[key]) {
                params[key].push(decodeURIComponent(value));
            } else {
                params[key] = [decodeURIComponent(value)];
            }
        });
    
        const apiRequest = {
            q_keywords: params['qKeywords'] ? params['qKeywords'][0] : undefined,
            page: params['page'] ? parseInt(params['page'][0]) : 1,
            per_page: 100, // Default value, change as needed
            person_titles: params['personTitles[]'] || [],
            person_seniorities: params['personSeniorities[]'] || [],
            contact_email_status: params['contactEmailStatusV2[]'] || [],
            q_organization_domains: params['organizationIds[]'] ? params['organizationIds[]'].join('\n') : "",
            organization_num_employees_ranges: params['organizationNumEmployeesRanges[]'] || [],
            organization_ids: params['organizationIds[]'] || []
        };
        
        return JSON.stringify(apiRequest, null, 4);
    }
    const apolloURL = order.apolloUrl;
    const apiRequestBody = JSON.parse(parseApolloURL(apolloURL));
    let nol = order.noOfLeads;
    let pp = apiRequestBody.per_page;
    let nop = nol/pp;
    startOrderHelper(nop , apiRequestBody,req.body.id)
    res.status(201).json({
        success: true
    })
});
let generateTasksRemaining = {};
const generateCSVWriteData = async(id,iniTime)=>{
    if(generateTasksRemaining[id] != 0){
        console.log(`${generateTasksRemaining[id]} tasks remaining for order id : ${id}`);
        let x = 10*1000 + await Math.floor(Math.random() * 10)
        setTimeout(()=>{generateCSVWriteData(id,iniTime)},x);
        return;
    }
    delete generateTasksRemaining[id];
    const people = await peopleModal.find({orderId:id});
    let dataLen = people.length;
    let org_fetch_queue = []
    let organisations = {}
    const result = []
    for(let i=0; i<dataLen; i++){
        console.log(i);
        if(!people[i].data.organization){
            continue;
        }
        const resultDoc = {
            id : people[i].data.id,
            first_name : people[i].data.first_name,
            last_name : people[i].data.last_name,
            email : people[i].data.email,
            status : people[i].data.status,
            ESP:people[i].data.ESP,
            mx_record:people[i].data.mx_record,
            title: people[i].data.title,
            city : people[i].data.city,
            state : people[i].data.state,
            country : people[i].data.country,
            linkedin_url : people[i].data.linkedin_url,
            headline : people[i].data.headline,
            organization_domain : people[i].data.organization.primary_domain,
            organization_name : people[i].data.organization.name,
            organization_founded_year : people[i].data.organization.founded_year,
            organization_phone : people[i].data.organization.phone,
            organization_facebook_url : people[i].data.organization.facebook_url,
            organization_linkedin_url : people[i].data.organization.linkedin_url,
            organization_website_url : people[i].data.organization.website_url,
            organization_twitter_url : people[i].data.organization.twitter_url,
            organization_angellist_url : people[i].data.organization.angellist_url,
        }
        // if(org_fetch_queue.length < 100){
        //     org_fetch_queue.push(order.data[i].organization.primary_domain);
        // }else{
        //     let link = "https://api.apollo.io/api/v1/mixed_companies/search";
        //     const result = await fetch(link , {
        //         method : "POST",
        //         headers : {
        //           "Content-Type":"application/json",
        //           "X-Api-Key":"ByIN6wgmPzSvjSYFP7alvQ"
        //         },
        //         redirect:"follow",
        //         body: JSON.stringify({per_page:100,organization_ids:org_fetch_queue}),
        //     }).then(response => response.json()).then(response => response.organizations).then(async(response)=>{
        //         for(let k=0; k<response.length; k++){
        //             organisations[response[k].id] = response[k];
        //         }
        //     }).catch(error => {
        //         console.error(error);
        //     });
        //     org_fetch_queue = [];
        //     org_fetch_queue.push(order.data[i].organization.id);
        // }
        // console.log(`${i} , ${organisations.length} , ${org_fetch_queue.length}`);
        // console.log(`${i}`);
        result.push(resultDoc);
    }
    const csv = await converter.json2csv(result);
    fs.writeFile(`${id}.csv`,csv,(err)=>{
        if(err){
            console.error(err);
        }else{
            console.log("File Written Successfully");
        }
    });
    const compTime = Date.now();
    console.log(`Generated CSV in ${compTime - iniTime} seconds`);
}
const bestEmailCalculator = async(id,person)=>{
    //do task
    if(person.data.email){
        generateTasksRemaining[id] -= 1;
        return;
    }
    const possibleEmails = person.data.possibleEmails;
    const possibleEmailsObj = [];
    let scoreFrequencyMap = {};
    let max_score = 0;
    let resultData = {
        email:"",
        status:false,
        ESP : null,
        mx_record : null,
    }
    if(possibleEmails){
        for(let mailIndex = 0; mailIndex < possibleEmails.length; mailIndex++){
            const mailObj = await emailModal.findOne({email:possibleEmails[mailIndex]});
            if(!mailObj){
                continue;
            }
            if(mailObj.score >= 60){
                possibleEmailsObj.push(mailObj);
            }
            if(scoreFrequencyMap[mailObj.score]){
                scoreFrequencyMap[mailObj.score] += 1;
            }else{
                scoreFrequencyMap[mailObj.score] = 1;
            }
            if(mailObj.score >= max_score){
                resultData.email = mailObj.email;
                resultData.status = mailObj.score >= 60 ? true : false;
                resultData.ESP = mailObj.ESP ? mailObj.ESP : null;
                resultData.mx_record = mailObj.mx_record;
                max_score = mailObj.score;
            }
        }
    }
    if(scoreFrequencyMap[max_score] > 1 && max_score >= 60){
        for(let mm = 0; mm < possibleEmailsObj.length; mm++){
            if(possibleEmailsObj[mm].score == max_score && possibleEmailsObj[mm].is_catchall == false){
                resultData.email = possibleEmailsObj[mm].email;
                resultData.mx_record = possibleEmailsObj[mm].mx_record;
            }
        }
    }
    const data = person.data;
    data.email = resultData.email;
    data.status = resultData.status;
    data.ESP = resultData.ESP;
    data.mx_record = resultData.mx_record;
    const result__ = await peopleModal.findByIdAndUpdate(person._id, {data:data}, {
        runValidators: true,
        useFindAndModify: false,
    });
    generateTasksRemaining[id] -= 1;
}
const generateCSVHelper = catchAsyncErrors(async (id)=>{
    const iniTime = Date.now();
    const people = await peopleModal.find({orderId:id});
    let dataLen = people.length;
    const result = []
    generateTasksRemaining[id] = 0;
    for(let i=0; i<dataLen;i++){
        generateTasksRemaining[id] += 1;
        bestEmailCalculator(id,people[i]);
    }
    let x = 40*1000 + await Math.floor(Math.random() * 10)
    setTimeout(()=>{generateCSVWriteData(id,iniTime)},x);
});

exports.generateCSV = catchAsyncErrors(async (req, res, next) => {
    generateCSVHelper(req.body.id);
    res.status(201).json({
        success: true
    })
});
