module.exports = {
    name: 'hi',
    description: 'Responds to the word "hi".',
    event: async function ({ ptz, m, sender }) {
        const body = (
            m.mtype === 'conversation' && m.message.conversation ||
            m.mtype === 'imageMessage' && m.message.imageMessage.caption ||
            m.mtype === 'documentMessage' && m.message.documentMessage.caption ||
            m.mtype === 'videoMessage' && m.message.videoMessage.caption ||
            m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text
        ) || '';

        if (body.toLowerCase() === 'hi') {
            await m.reply(`Hello, @${sender.split('@')[0]}! How can I assist you today?`);
        }
    }
};