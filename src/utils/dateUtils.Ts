export function isValidISODate(date:string){
    //returns true if date is valid
    return !isNaN(new Date(date).getTime())
}

export function getDate(date:string){
    //returns date if the value is valid
     return isValidISODate(date)==true?date : undefined
}