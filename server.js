// const fs = require("fs");
// const ytdl = require("@distube/ytdl-core");
// const { createWriteStream, readFile, unlink } = require("fs-extra");
// const { tmpdir } = require("os");
// const { promisify } = require('util')
// const { exec } = require('child_process')
// const path = require("path");
// class YT {
//     constructor(url, type = "video") {
//         this.url = url;
//         this.type = type;
//         this.exec = promisify(exec)
//         this.cookiesFile = path.join(__dirname, "cookies.txt");
//         // Read and parse cookies
//         this.cookies = this.loadCookies();
//         this.agent = ytdl.createAgent(this.cookies);
//     }

//    // Load cookies and format them for ytdl
//        loadCookies = () => {
//            try {
//                if (!fs.existsSync(this.cookiesFile)) {
//                    console.warn("Warning: cookies.txt file not found!");
//                    return [];
//                }
//                const cookies_data = fs.readFileSync(this.cookiesFile, "utf8").trim();
//                return cookies_data
//                    .split("\n")
//                    .filter(line => !line.startsWith("#") && line.trim() !== "")
//                    .map(line => {
//                        const parts = line.split("\t");
//                        if (parts.length >= 7) {
//                            return { name: parts[5], value: parts[6] }; // Format properly
//                        }
//                    })
//                    .filter(cookie => cookie); // Remove undefined entries
//            } catch (error) {
//                console.error("Error loading cookies:", error);
//                return [];
//            }
//        };

//     // Validate URL
//     validate = () => ytdl.validateURL(this.url);

//     // Get Video Info
//     getInfo = async () => {
//             return await ytdl.getInfo(this.url, { agent: this.agent });
//         };

//     // Download Video/Audio
//     download = async (quality = "low") => {
//         let audioFilename = `${tmpdir()}/${Math.random().toString(36)}.mp3`;
//         let videoFilename = `${tmpdir()}/${Math.random().toString(36)}.mp4`;
        
//         // Create video stream (fetches both video & audio)
//         const videoStream = createWriteStream(videoFilename);
//         ytdl(this.url, {
//             quality: "highest",
//             agent: this.agent,
//             requestOptions: {
//                 headers: {
//                     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
//                     'Accept-Language': 'en-US,en;q=0.9',
//                     'Cookie': this.cookies.map(c => `${c.name}=${c.value}`).join('; ')
//                 }
//             }
//         }).pipe(videoStream);
    
//         // Wait for video download to complete
//         videoFilename = await new Promise((resolve, reject) => {
//             videoStream.on("finish", () => resolve(videoFilename));
//             videoStream.on("error", (error) => reject(error && console.log(error)));
//         });
    
//         // If only audio is requested, extract audio from the video
//         if (this.type === "audio") {
//             await this.exec(`ffmpeg -i ${videoFilename} -q:a 0 -map a ${audioFilename}`);
//             const buffer = await readFile(audioFilename);
//             Promise.all([unlink(videoFilename), unlink(audioFilename)]); // Cleanup
//             return buffer;
//         }
    
//         // If video is requested, return the video file as usual
//         const buffer = await readFile(videoFilename);
//         await unlink(videoFilename);
//         return buffer;
//     };
    
// }

const axios = require('axios');

module.exports = class YT {
    constructor(url, type = 'video') {
        this.url = url;
        this.type = type;
    }

    getInfo = async () => {
        try {
            const api = 'dfcb6d76f2f6a9894gjkege8a4ab232222';
            const { data } = await axios.get(
                `https://p.oceansaver.in/ajax/download.php?copyright=0&format=720&url=${this.url}&api=${api}`
            );
            const videoDetails = {
                title: data.title,
                url: data.info.image
            }

            return { videoDetails }
        } catch (error) {
            console.error("Error fetching video details:", error);
            return { videoDetails: null };
        }
    };

    download = async (quality = 'medium') => {
        try {
            const headers = {
                "Accept": "*/*",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                "Accept-Language": "en-US,en;q=0.9",
                "Content-Type": "application/json",
                "Origin": "https://www.y2matego.net",
                "Priority": "u=1, i",
                "Referer": "https://www.y2matego.net/",
                "Sec-CH-UA": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
                "Sec-CH-UA-Mobile": "?0",
                "Sec-CH-UA-Platform": '"Windows"',
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "cross-site",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "X-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
            };
            const videoId = this.url.includes('/watch?v=') ? this.url.split('v=')[1].split('&')[0] :
                this.url.includes('/shorts/') ? this.url.split('/shorts/')[1].split('?')[0] :
                    null;

           
            const api = 'dfcb6d76f2f6a9894gjkege8a4ab232222';
            let format;
            if (this.type === 'audio') {
                format = 'mp3';
            } else {
                const qualityMap = {
                    low: 360,
                    medium: 720,
                    high: 1080,
                };
                format = qualityMap[quality] || 720
            }
            const { data } = await axios.get(
                `https://p.oceansaver.in/ajax/download.php?copyright=0&format=720&url=${this.url}&api=${api}`
            );
            
            const response = await axios.get(
                `https://p.oceansaver.in/ajax/download.php?copyright=0&format=${format}&url=${this.url}&api=${api}`
            );

            const checkProgress = async (id) => {
                let progress;
                let download_url = null;
            
                while (!download_url) { 
                    const response = await axios.get(`https://p.oceansaver.in/ajax/progress.php?id=${id}`);
                    ({ progress, download_url } = response.data);
                    
                    // console.log(`Progress: ${progress}`);
                    // console.log(`Progress: ${download_url}`);
            
                    if (!download_url) await new Promise(r => setTimeout(r, 3000));
                }
            
                return download_url;
            };
            
            
            const downloadUrl = await checkProgress(data.id);
            const videoDetails = {
                author: `Ahmii`,
                data: {
                    title: response.data.title,
                    thumbnail: response.data.info.image,
                    type: this.type,
                    url: downloadUrl
                }
            }
            return videoDetails;
        } catch (error) {
            console.error('Error:', error.message);
        }
    };
};
