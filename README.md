# Usage
1. Node 10+
2. `npm i`
3. Get token (for example: manually from VK Admin app via https://vkhost.github.io/)
4. `node index.js --token=TOKEN" --from_id=ID --start_offset=START_OFFSET`

# Params
* `--token`: access_token for api requests
* `--from_id`: id of source user
* `--start_offset`: number of posts to parse (will decrease from OFFSET to 0)

ps: set delay as long as possible, otherwise you will get error 1003 with captcha
