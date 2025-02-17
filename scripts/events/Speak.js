module.exports = {
    name: 'Oi',
    description: 'Responds to the word "oi".',
    event: async function ({ ptz, m, sender }) {
        const body = (
            m.mtype === 'conversation' && m.message.conversation ||
            m.mtype === 'imageMessage' && m.message.imageMessage.caption ||
            m.mtype === 'documentMessage' && m.message.documentMessage.caption ||
            m.mtype === 'videoMessage' && m.message.videoMessage.caption ||
            m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text
        ) || '';

        if (body.toLowerCase() === 'oi') {
            await m.reply(`Hello, @${sender.split('@')[0]}! Mr Anthony is busy.. I am aterus bot of Anthony how can i help you?`);
        }
    }
};