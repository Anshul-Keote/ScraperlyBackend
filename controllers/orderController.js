const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const orderModal = require("../models/orderModal");
const responseParser = require("../utils/responseParser");


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
        }).then(response => response.json()).then(response => response.people).then(async (response) => {
            const people = response;
            const filtered_people = await responseParser(people , id);
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
