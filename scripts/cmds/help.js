const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    desc: 'Displays the help menu with a list of commands.',
    dmUser: true,
    permission: 0,
    run: async ({ m }) => {
        const commandsFolder = path.resolve(__dirname);
        const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js') && file !== 'help.js');

        let helpMessage = 'Here are the available commands:\n\n';

        commandFiles.forEach(file => {
            const command = require(path.join(commandsFolder, file));
            if (command.name && command.desc) {
                helpMessage += `~ ${global.prefix}${command.name} - ${command.desc}\n`;
            }
        });

        m.reply(helpMessage);
    },
};