//Steps
//FirstName => lowercase => replace "'" => ""
//LastName => lowercase => replace "'" => ""
//First Initial = firstName[0]
//Last Initial = lastName[0]
//org domain => loweracse

//vars
//firstname
//lastname
//firstinitial
//lastinitial
//domain
//first3initial => first name . substr 0 , 3
//last3initial => last name . substr 0 , 3
//permutations array
//simply hardcode some permutations

const permutator = (firstName , lastName , domain)=>{
    if(firstName == null){
        firstName = ""
    }
    if(lastName == null){
        lastName = ""
    }
    if(domain == null){
        return []
    }
    let fname = firstName.toLowerCase().replace("'","")
    let lname = lastName.toLowerCase().replace("'","")
    let fini = fname[0];
    let lini = lname[0];
    let f3ini = fname.substring(0,3);
    let l3ini = lname.substring(0,3);
    let dm = domain.toLowerCase()
    let permutations = [
        `${fname}.${lname}@${dm}`,
        `${fini}${lname}@${dm}`,
        `${fname}@${dm}`,
        `${fname}${lname}@${dm}`,
        `${fname}${lini}@${dm}`,
        `${fini}.${lname}@${dm}`,
        `${lname}@${dm}`,
        `${fname}_${lname}@${dm}`,
        `${fname}.${lini}@${dm}`,
        `${lini}@${dm}`,
        `${fini}${lini}@${dm}`,
        `${lini}.${fname}@${dm}`,
        `${fini}@${dm}`,
        `${fname}_${lini}@${dm}`,
        `${lini}_${fname}@${dm}`,
        `${lini}${fini}@${dm}`,
        `${lname}${fname}@${dm}`,
        `${lini}${fname}@${dm}`,
        `${lname}.${fname}@${dm}`,
        `${fini}_${lname}@${dm}`,
        `${f3ini}@${dm}`,
        `${l3ini}@${dm}`,
        `${lname}_${fname}@${dm}`,
    ];

    if(lname.includes("'")){
        let lastname_without_apostrophe1 = lname.split("'")[1]
        let lastname_without_apostrophe2 = lname.replace("'","")
        let perms4 = [
            `${lastname_without_apostrophe1}@${dm}`,
            `${fname}.${lastname_without_apostrophe2}@${dm}`,
            `${fini}.${lastname_without_apostrophe2}@${dm}`,
            `${fini}.${lastname_without_apostrophe1}@${dm}`,
        ]
        permutations.push(...perms4)
    }


    if(fname.includes('-')){
        let firstname_no_hyphen = fname.replace('-','')
        let firstname_split = fname.split('-')
        let perms7 = [`${firstname_no_hyphen}.${lname}@${dm}`,
            `${firstname_no_hyphen}@${dm}`,
            `${firstname_split[0]}.${lname}@${dm}`,
            `${firstname_split[0]}@${dm}`,
            `${firstname_split[0][0]}${firstname_split[1][0]}${lname}@${dm}`,
            `${firstname_split[1][0]}${lname}@${dm}`,
            `${firstname_split[0][0]}${lname}@${dm}`,]
        permutations.push(...perms7)
    }

    if(lname.includes('-')){
        let lastname_no_hyphen = lname.replace('-','')
        let lastname_split = lname.split('-')
        let perms17 = [
            `${fname}.${lastname_no_hyphen}@${dm}`,
            `${fini}${lastname_split[0]}@${dm}`,
            `${fname}.${lastname_split[0]}@${dm}`,
            `${fini}${lastname_split[1]}@${dm}`,
            `${fini}${lastname_no_hyphen}@${dm}`,
            `${fname}.${lastname_split[1]}@${dm}`,
            `${fname}${lastname_no_hyphen}@${dm}`,
            `${fname}${lastname_split[0]}@${dm}`,
            `${lastname_split[1]}@${dm}`,
            `${fname}_${lastname_split[0]}_${lastname_split[1]}@${dm}`,
            `${fname}_${lastname_split[1]}@${dm}`,
            `${lastname_split[0]}@${dm}`,
            `${fini}.${lastname_no_hyphen}@${dm}`,
            `${fini}.${lastname_split[0]}@${dm}`,
            `${fname}.${lastname_split[0]}.${lastname_split[1]}@${dm}`,
            `${fname}${lastname_split[1]}@${dm}`,
            `${lastname_no_hyphen}${fini}@${dm}`,]
        permutations.push(...perms17)
        if(lastname_split.length > 2){
            permutations.push(`${fname}${lastname_split.at(-1)[0]}@${dm}`)
        }
    }
    return permutations
}


module.exports = permutator;