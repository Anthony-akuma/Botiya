const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cacheFolder = path.resolve(__dirname, './cache');
const apiKey = 'AIzaSyBof52QJ3pOuv7EP8Vm5v7rOX3RyNfjfPE'; // Your API Key

if (!fs.existsSync(cacheFolder)) {
    fs.mkdirSync(cacheFolder);
}

const youtube = google.youtube({
    version: 'v3',
    auth: apiKey,
});

module.exports = {
    name: 'video',
    description: 'Search and download video from YouTube',
    cooldown: 5,
    permission: 0,
    dmUser: true,
    run: async ({ sock, m, args }) => {
        if (!args.length) {
            return m.reply('Please provide a search term or YouTube URL.');
        }

        const query = args.join(' ');
        const searchingMessage = await sock.sendMessage(m.key.remoteJid, { text: 'Searching for video...' });

        try {
            // Search YouTube for the video
            const searchResults = await youtube.search.list({
                part: 'snippet',
                q: query,
                maxResults: 1,
            });

            const video = searchResults.data.items[0];

            if (!video) {
                await sock.sendMessage(m.key.remoteJid, { text: 'No results found for your query.' });
                return;
            }

            const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
            const videoTitle = video.snippet.title;
            const videoDescription = video.snippet.description;

            // Send video details
            await sock.sendMessage(m.key.remoteJid, {
                text: `🎥 Found video: *${videoTitle}*\n\n*Description:* ${videoDescription}\n*Watch here:* ${videoUrl}`,
            });

            // Step 2: Download the Video (Using a third-party download API)
            const videoDownloadUrl = `https://some-video-download-api.com/download?url=${videoUrl}`;
            const videoDownloadResponse = await axios.get(videoDownloadUrl, { responseType: 'stream' });

            // Save the video file locally
            const videoFilePath = path.join(cacheFolder, `${videoTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`);
            const writer = fs.createWriteStream(videoFilePath);
            videoDownloadResponse.data.pipe(writer);

            writer.on('finish', async () => {
                // Send the downloaded video
                await sock.sendMessage(m.key.remoteJid, {
                    video: { url: videoFilePath },
                    mimetype: 'video/mp4',
                    caption: `🎬 *${videoTitle}*`,
                });

                // Automatically delete the "Searching..." message
                await sock.sendMessage(m.key.remoteJid, { delete: searchingMessage.key });
            });

            writer.on('error', async (error) => {
                console.error('Error saving video file:', error.message);
                await sock.sendMessage(m.key.remoteJid, { text: 'An error occurred while downloading the video.' });
            });
        } catch (error) {
            console.error('Error fetching video:', error.message);
            await sock.sendMessage(m.key.remoteJid, { text: 'An error occurred. Please try again.' });
        }
    },
};