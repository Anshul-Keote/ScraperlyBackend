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
            for(let j=0; j<filtered_people.length; j++){
                if(filtered_people[j].possibleEmails){
                    if(verifyQueue.length < 4800){
                        verifyQueue.push(...filtered_people[j].possibleEmails);
                    }else{
                        batchEmailVerifier(verifyQueue);
                        verifyQueue = [];
                        verifyQueue.push(...filtered_people[j].possibleEmails);
                    }
                }
            }
            return filtered_people;
        }).then(async (filtered_people) => {
            console.log("PPL : ", filtered_people.length);
            const _order = await orderModal.findById(id);
            let data = _order.data;
            //push people in data
            for(let i=0; i<filtered_people.length;i++){
                data.push(filtered_people[i]);
            }
            const _order_ = await orderModal.findByIdAndUpdate(id, {data:data}, {
                runValidators: true,
                useFindAndModify: false,
            });
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

const generateCSVHelper = catchAsyncErrors(async (id)=>{
    const iniTime = Date.now();
    const order = await orderModal.findById(id);
    let dataLen = order.data.length;
    let org_fetch_queue = []
    let organisations = {}
    const result = [
    ]

    for(let i=0; i<dataLen; i++){
        if(!order.data[i].organization){
            continue;
        }
        const resultDoc = {
            id : order.data[i].id,
            first_name : order.data[i].first_name,
            last_name : order.data[i].last_name,
            title: order.data[i].title,
            city : order.data[i].city,
            state : order.data[i].state,
            country : order.data[i].country,
            linkedin_url : order.data[i].linkedin_url,
            headline : order.data[i].headline,
            organization_domain : order.data[i].organization.primary_domain,
            organization_name : order.data[i].organization.name,
            organization_founded_year : order.data[i].organization.founded_year,
            organization_phone : order.data[i].organization.phone,
            organization_facebook_url : order.data[i].organization.facebook_url,
            organization_linkedin_url : order.data[i].organization.linkedin_url,
            organization_website_url : order.data[i].organization.website_url,
            organization_twitter_url : order.data[i].organization.twitter_url,
            organization_angellist_url : order.data[i].organization.angellist_url,
            email : "",
            status : false,
            ESP:""
        }
        const emails = await emailModal.find({personId:order.data[i].id,orderId:id});
        let max_score = 0;
        for(let j=0; j<emails.length;j++){
            if(emails[j].score >= max_score){
                resultDoc.email = emails[j].email;
                resultDoc.status = emails[j].score >= 60 ? true : false;
                resultDoc.ESP = emails[j].ESP ? emails[j].ESP : null;
                max_score = emails[j].score;
            }
        }
        // if(org_fetch_queue.length < 100){
        //     org_fetch_queue.push(order.data[i].organization.id);
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
        console.log(`${i}`);
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
});

exports.generateCSV = catchAsyncErrors(async (req, res, next) => {
    generateCSVHelper(req.body.id);
    res.status(201).json({
        success: true
    })
});
