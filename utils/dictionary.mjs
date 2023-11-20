import {WORDS} from '../constants.mjs' 
import {capitalize} from './transform.mjs'

export const translateWords=async(text, lang = "en|ru")=>{
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}!&langpair=${lang}`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        }
    })
    const data = await res.json()
    const regex = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g
    return {source: capitalize(data.matches[0].segment.replace(regex, '')), target: capitalize(data.responseData.translatedText.replace(regex, ''))}
}

const randomWords = () => {
    return WORDS.sort(() => 0.5 - Math.random()).slice(0, 4)
}

export const getRandom= async () =>{
    const result = []
    const words = randomWords()

    for (const word of words){
        const data = await translateWords(word)
        result.push(data)
    }
    return result
}
