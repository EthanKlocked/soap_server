export const generateRandomNumber = (digit : number) : string => {
    const randomDigit : string = Math.random().toFixed(digit).toString().substring(2);
    return randomDigit;
}