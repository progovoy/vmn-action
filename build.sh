npm i -g @vercel/ncc
npm i 
ncc build index.js -o dist

git add -U && git commit -m "make build" && git push

vmn stamp -r patch vmna


