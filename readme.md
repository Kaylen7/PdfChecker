# PDF Checker
Parse pdf content with `pdf2json` [node.js module](https://www.npmjs.com/package/pdf2json) and perform a series of quality validations for publishing. Output results are stored in files `results/resumen.md` and `results/resultados.md`. This tool is meant for Spanish pdfs, with printing marks and info (usually the same pdf output you would send for printing).

## 📖 More on use cases
In printed publishing services, the editor usually performs a series of validations in order to improve the quality of the pdf before it is sent to print. Common checks include: 
- numbered empty pages (or the other way around), 
- dialogue dashes at the end of line, 
- and a series of queries that improve readability. 
Most of these checks depend on the language and can easily be missed even by a trained eye. This tool provided some robustness to that quality control check, adding an automated layer that could be peformed at production level, before the editor validation.

## 🕵️‍♀️ What is checked so far
They are divided in two groups, depending on their priority in production.
*PRIORITY*
- Numbered white pages
- Non-numbered content pages
- Dialogue dash at EOL
- Non-accepted words at SOL
- Closing pairs for `¿`, `¡`, `(`.

*OTHER*
- Repeated 3-letter group EOL
- Repeated 3-letter group SOL
- Repeated single-letter x3 EOL
- Repeated single-letter x3 SOL

[Abreviations: EOL, `end of line`; SOL, `start of line`]

## ⚙️ How to run
**1** Copy pdf in `pdfs/`. Make sure the name of the file is the same as the name that appears in the footer of the pdf.  
**2** Open the terminal and run `npm run start`.
**3** Use `npm run dev` for debugging purposes.

## Known errors
- This script depends on dir `rawTexts/` to output a parsed version of the pdf by `pdf2json` module. If `rawTexts/` does not exist, it will trigger ENOTDIR error.
- If there are more closing tags (`?`, `!`, or `)`) than opening ones, then validation must be done "manually" as there are cases in which this could be correct and should be addressed by an intelligent being.

## 🧪 Test
See `pdfs/OC_Secreto_Ciudad.pdf` for example pdf.