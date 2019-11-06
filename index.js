const nconf = require('nconf');
nconf.argv().env();

const req = require('axios');

const token = nconf.get('token');
const fromId = nconf.get('from_id');
const startOffset = nconf.get('start_offset');

if (!token || !fromId || !startOffset) {
    console.error('Run as "node index.js --token=TOKEN" --from_id=ID --start_offset=START_OFFSET');
    process.exit(1);
}

class App {
    constructor(token, fromId, offset) {
        this.token = token;
        this.fromId = fromId;
        this.count = 10;
        this.offset = offset - this.count;
    }

    async getPosts() {
        try {
            while (this.offset > 0) {
                console.log(`[#] CURRENT OFFSET ${this.offset}, parse...`);

                const result = await this.wallGet(this.fromId, this.offset, this.count);

                if (result.data.error) {
                    throw new Error(JSON.stringify(result.data.error));
                }

                const audios = [];

                result.data.response.items.forEach(post => {
                    const result = this.parsePost(post);

                    if (result.length > 0) {
                        audios.unshift(...result);
                    }

                    console.log(' ');
                });


                for (const audio of audios) {
                    const a = await this.audioAdd(audio.id, audio.owner);

                    if (a.data.error) {
                        console.log(`[-] Need restart from ${this.offset+this.count}, ${JSON.stringify(a.data.error)}`);
                        process.exit(1);
                    }

                    console.log(`[+] ${audio._debug} `);

                    await this.delay(10000);
                }

                this.offset -= this.count;
            }

        } catch (e) {
            console.error(`Something wrong: ${e}`);
        }
    }

    parsePost(post) {
        const out = [];

        if (!post.attachments) {
            return out;
        }

        console.log(`[POST] ${post.id}`);

        post.attachments.forEach((item) => {
            if (item.type === 'audio') {
                console.log(`[!] ${item.audio.id} // ${item.audio.artist} - ${item.audio.title}`); // item.audio.url :)

                if (!item.audio.id || !item.audio.owner_id) {
                    console.warn(`[x] Skip it!`);
                    return;
                }

                out.push({
                    'id': item.audio.id,
                    'owner': item.audio.owner_id,
                    '_debug': `${item.audio.artist} - ${item.audio.title}`,
                });
            }
        });

        return out;
    }

    async execApi(method, params, version='5.103') {
        return req.get(`https://api.vk.com/method/${method}`, {
            params: {
                ...params,
                'access_token': this.token,
                'v': version,
            },
        });
    }

    async wallGet(userId, offset, count) {
        const params = {
            'owner_id': userId,
            'count': count,
            'offset': offset,
            'filter': 'owner',
        };

        return this.execApi('wall.get', params);
    }

    async audioAdd(id, owner) {
        const params = {
            'audio_id': id,
            'owner_id': owner,
        };

        return this.execApi('audio.add', params);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

(async () => {
    const a = new App(token, fromId, startOffset);
    await a.getPosts();
})();